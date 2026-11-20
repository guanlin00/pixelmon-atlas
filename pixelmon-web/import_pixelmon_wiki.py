#!/usr/bin/env python3
"""Incremental, repeatable importer from Pixelmon Wiki into static site JSON.

Requires: pip install requests beautifulsoup4
Example: python tools/import_pixelmon_wiki.py --batch-size 60 --start 1
Running repeatedly with increasing --start imports additional species. Do not
interpret Wiki tables as guaranteed version-specific 9.4.2 spawn rates.
"""
import argparse
import csv
import datetime as dt
import io
import json
import re
import time
from pathlib import Path
from urllib.parse import quote
import requests
from bs4 import BeautifulSoup

BASE='https://pixelmonmod.com/wiki/'
CSV='https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species_names.csv'
ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/'data'/'wiki-reference.json'
UA='PixelmonAtlasResearch/0.7 (personal educational wiki reference; respect site rate limits)'
S=requests.Session();S.headers['User-Agent']=UA

def fetch(url):
    r=S.get(url,timeout=35)
    r.raise_for_status()
    return r.text

def clean(text):
    return re.sub(r'\s+',' ',text).strip()

def nearest_table(heading):
    # Iterate siblings until next section heading, skipping text nodes and wrapper divs.
    for node in heading.next_elements:
        if getattr(node,'name',None) in ('h2','h3') and node is not heading:
            return None
        if getattr(node,'name',None)=='table':
            return node
    return None

def tables_for_section(soup,title):
    for head in soup.select('h2,h3'):
        headline=clean(head.get_text(' ',strip=True)).replace('[edit]','').lower()
        if title.lower() in headline:
            table=nearest_table(head)
            if table:return table
    return None

def parse_table(table):
    rows=[]
    if table is None:return rows
    for tr in table.select('tr'):
        cells=tr.find_all(['th','td'],recursive=False)
        if not cells:continue
        vals=[clean(c.get_text(' ',strip=True)) for c in cells]
        if vals:rows.append(vals)
    return rows

def species_data(name):
    # MediaWiki title underscores preserve spaces; punctuation may require redirects.
    url=BASE+quote(name.replace(' ','_'),safe='()_-.')
    soup=BeautifulSoup(fetch(url),'html.parser')
    if soup.select_one('.noarticletext') or 'There is currently no text in this page' in soup.get_text(' ',strip=True):
        return None
    data={'source':url,'spawn':[],'drops':[]}
    sr=parse_table(tables_for_section(soup,'Spawn Biomes'))
    for row in sr[1:]:
        if len(row)<6:continue
        if 'Pokemon can spawn' in row[0]:continue
        data['spawn'].append(dict(zip(('biome','mod','time','location','condition','rarity'),row[:6])))
    dr=parse_table(tables_for_section(soup,'Drops'))
    for row in dr[1:]:
        if len(row)<3:continue
        if row[0].lower()=='drop':continue
        data['drops'].append({'item':row[0],'chance':row[1],'quantity':row[2]})
    return data if data['spawn'] or data['drops'] else None

def species_names():
    rows=csv.DictReader(io.StringIO(fetch(CSV)))
    return {int(r['pokemon_species_id']):r['name'] for r in rows if r['local_language_id']=='9' and int(r['pokemon_species_id'])<=1025}

def global_drops(names):
    """Cross-check the wiki's global Drops table and collect rows matching species names.
    This table includes some alternate forms that require manual reconciliation.
    """
    soup=BeautifulSoup(fetch(BASE+'Drops'),'html.parser')
    table=tables_for_section(soup,'List of possible drops')
    rows=parse_table(table)
    reverse={}
    match={re.sub(r'[^a-z0-9]+','',n.casefold()):sid for sid,n in names.items()}
    current=''
    for row in rows[1:]:
        # A global wiki table may use merged/rowspan drop cells, creating 3-column rows.
        if len(row)>=4:
            item,pokemon,chance,qty=row[:4]; current=item or current
        elif len(row)==3:
            pokemon,chance,qty=row;item=current
        else:continue
        if not current or not pokemon or not re.search(r'\d+\s*%',chance):continue
        key=re.sub(r'[^a-z0-9]+','',pokemon.casefold())
        sid=match.get(key)
        if sid is None:continue
        reverse.setdefault(current,[]).append({'pokemonId':sid,'chance':chance,'quantity':qty})
    return reverse

def rebuild_reverse(data):
    reverse={}
    for sid,p in data.get('pokemon',{}).items():
        for d in p.get('drops',[]):
            reverse.setdefault(d['item'],[]).append({'pokemonId':int(sid),'chance':d['chance'],'quantity':d['quantity']})
    # Rebuild rather than append stale records; canonical species page records take precedence.
    data['items']=reverse
    data['metadata']['speciesCount']=len(data['pokemon'])
    data['metadata']['itemCount']=len(reverse)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--start',type=int,default=1,help='National Pokédex start ID')
    parser.add_argument('--batch-size',type=int,default=60)
    parser.add_argument('--delay',type=float,default=1.2)
    parser.add_argument('--global-drops',action='store_true',help='also import the global Drops table')
    a=parser.parse_args()
    existing=json.loads(OUTPUT.read_text(encoding='utf-8')) if OUTPUT.exists() else {'metadata':{},'pokemon':{},'items':{}}
    existing.setdefault('pokemon',{})
    names=species_names()
    imported=0;failed=[]
    global_index={}
    if a.global_drops:
        try:
            global_index=global_drops(names)
            print('Global Drops references:',sum(len(v) for v in global_index.values()),flush=True)
        except Exception as exc:print('Global Drops unavailable:',exc,flush=True)
    for number in range(max(1,a.start),min(1025,a.start+a.batch_size-1)+1):
        title=names.get(number)
        if not title:continue
        try:
            result=species_data(title)
            if result:
                existing['pokemon'][str(number)]=result
                imported+=1
                print(f'{number:04} {title}: {len(result["spawn"])} spawn rows, {len(result["drops"])} drop rows',flush=True)
            else:print(f'{number:04} {title}: no usable table',flush=True)
        except Exception as exc:
            failed.append((number,str(exc)))
            print(f'{number:04} {title}: failed ({exc})',flush=True)
        time.sleep(max(.6,a.delay))
    existing['metadata'].update({'source':'https://pixelmonmod.com/wiki/','sourceType':'Pixelmon Wiki reference; NOT guaranteed for 9.4.2','targetVersion':'9.4.2','updated':dt.date.today().isoformat()})
    rebuild_reverse(existing)
    for item,refs in global_index.items():
        current=existing['items'].setdefault(item,[])
        keys={(d['pokemonId'],d['chance'],d['quantity']) for d in current}
        for d in refs:
            key=(d['pokemonId'],d['chance'],d['quantity'])
            if key not in keys:current.append(d);keys.add(key)
    existing['metadata']['itemCount']=len(existing['items'])
    OUTPUT.write_text(json.dumps(existing,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Added/updated {imported}; total {len(existing["pokemon"])}; errors {len(failed)}')
    for num,error in failed:print('ERROR',num,error)
    if failed and not imported:raise SystemExit(1)

if __name__=='__main__':main()
