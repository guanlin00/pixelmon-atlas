#!/usr/bin/env python3
"""Import the first 151 Pokémon from pixelmon.site, a third-party Pixelmon reference.
NOT official pixelmonmod.com; all records carry a truthful mirror citation.
A record without a Spawn block means that the mirror does not list natural spawning.
Requires: requests, beautifulsoup4.
"""
import concurrent.futures as cf
import csv
import datetime
import io
import json
import re
import sys
import time
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE = 'https://pixelmon.site/'
CSV_URL = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species.csv'
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'wiki-reference.json'
AUDIT = ROOT / 'gen1-import-audit.csv'
HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; PixelmonAtlasReference/1.0; personal research)'}
SESSION = requests.Session()
SESSION.headers.update(HEADERS)

def get(url, retries=3):
    for i in range(retries):
        try:
            r = SESSION.get(url, timeout=32)
            if r.status_code == 404:
                raise ValueError('HTTP 404')
            r.raise_for_status()
            if 'Just a moment' in r.text[:1500]:
                raise ValueError('Blocked by access challenge')
            return r.text
        except Exception:
            if i == retries - 1:
                raise
            time.sleep(1.5 * (i + 1))

def clean(t):
    return re.sub(r'\s+', ' ', t or '').strip()

def get_species():
    rows = csv.DictReader(io.StringIO(get(CSV_URL)))
    names = {}
    for row in rows:
        i = int(row['id'])
        if 1 <= i <= 151:
            names[i] = row['identifier']
    if len(names) != 151:
        raise RuntimeError('PokéAPI species names incomplete')
    return names

def extract_spawn(soup):
    results = []
    spawn_divs = []
    h = next((h for h in soup.find_all('h2') if clean(h.get_text(' ',strip=True)).lower()=='spawn'),None)
    if h:
        for sibling in h.next_siblings:
            if getattr(sibling, 'name', None)=='h2':
                break
            if getattr(sibling,'name',None):
                if sibling.name=='div' and 'spawn' in sibling.get('class',[]):
                    spawn_divs.append(sibling)
                else:
                    spawn_divs.extend(sibling.select('div.spawn'))
    for block in spawn_divs:
        fields={}
        for title in block.select('.spawn__title'):
            key=clean(title.get_text(' ',strip=True)).rstrip(':').lower()
            fields[key]=clean(title.parent.get_text(' ',strip=True)).split(':',1)[-1].strip()
        links=[clean(x.get_text(' ',strip=True)) for x in block.select('a')]
        # The spawn box only links biomes; some releases have pure text rather than links.
        if not links:
            txt=clean(block.get_text(' ',strip=True))
            m=re.search(r'Biomes list\s*(.+)',txt,re.I)
            links=[clean(m.group(1))] if m else []
        # Avoid treating a visually repeated / nested box as duplicate.
        for biome in links or ['Any']:
            results.append({
              'biome':biome,'mod':'—','time':fields.get('time','Any').title(),
              'location':fields.get('locations','—'),
              'condition':('等級：'+fields['levels']) if fields.get('levels') else '—',
              'rarity':('權重 '+fields['rarity']) if fields.get('rarity') else '—'
            })
    return list({json.dumps(d,sort_keys=True):d for d in results}.values()),len(spawn_divs)

def extract_drops(soup):
    h=next((h for h in soup.find_all('h2') if clean(h.get_text(' ',strip=True)).lower()=='drops'),None)
    if h is None:
        return [],False
    table=h.find_next('table',class_=lambda x: x and 'drops' in x.split())
    if not table:
        return [],False
    results=[]
    for tr in table.find_all('tr'):
        cells=[clean(td.get_text(' ',strip=True)) for td in tr.find_all('td',recursive=False)]
        if len(cells)<4:
            continue
        item,lo,hi,chance=cells[:4]
        if not item or not re.fullmatch(r'\d+(?:\.\d+)?%',chance):
            continue
        qty=lo if hi==lo else lo+'-'+hi
        results.append({'item':item,'chance':chance,'quantity':qty})
    return results,True

def fetch_one(pair):
    i,slug=pair
    url=urljoin(BASE,slug+'/')
    try:
        html=get(url)
        soup=BeautifulSoup(html,'html.parser')
        header=soup.find('h1')
        heading=clean(header.get_text(' ',strip=True)) if header else ''
        # Verify this page really refers to the requested National Dex entry.
        if not re.search(r'#0*'+str(i)+r'\b',heading):
            raise ValueError('Pokédex number mismatch: '+heading[:90])
        spawn,blocks=extract_spawn(soup)
        drops,has_drop=extract_drops(soup)
        if not has_drop:
            raise ValueError('Drops table missing')
        if blocks and not spawn:
            raise ValueError('Spawn blocks found, but spawn biomes could not be parsed')
        record={
          'source':url,
          'officialWiki': 'https://pixelmonmod.com/wiki/'+slug.replace('-','_').title(),
          'spawn':spawn,
          'drops':drops,
          'verification':{
            'sourceStatus':'Imported from third-party pixelmon.site mirror; NOT independently verified against official Pixelmon Wiki',
            'form':'default',
            'spawnSectionPresent':bool(blocks),
            'dropsSectionPresent':has_drop,
            'notes': 'Numeric rarity represents the source spawn weight, not a percent. Empty spawn means no listed Spawn section in source.'
          }
        }
        return i,slug,record,None
    except Exception as e:
        return i,slug,None,str(e)

def main():
    species=get_species()
    print('Fetching 151 named Gen I entries from community Pixelmon reference...',flush=True)
    with cf.ThreadPoolExecutor(max_workers=5) as pool:
        results=list(pool.map(fetch_one,species.items()))
    errors=[(i,name,err) for i,name,rec,err in results if err]
    for i,name,rec,err in results:
        print(f'{i:03d} {name}: '+(f'{len(rec["spawn"])} spawn rows / {len(rec["drops"])} drops' if rec else 'FAIL '+err),flush=True)
    if errors:
        print('ERROR: '+str(len(errors))+' pages failed; refusing partial production update.',flush=True)
        for item in errors:print('FAILED',*item,flush=True)
        sys.exit(1)
    existing=json.loads(OUT.read_text('utf-8')) if OUT.exists() else {'pokemon':{},'items':{},'metadata':{}}
    existing.setdefault('pokemon',{})
    for i,slug,rec,err in results:
        existing['pokemon'][str(i)]=rec
    # Rebuild reverse index from authoritative per-species drop rows; preserve other-gen entries.
    all_items={}
    for k,record in existing['pokemon'].items():
        for drop in record.get('drops',[]):
            all_items.setdefault(drop['item'],[]).append({
              'pokemonId':int(k),'chance':drop['chance'],'quantity':drop['quantity']})
    existing['items']=all_items
    existing.setdefault('metadata',{}).update({
      'source':BASE,'sourceType':'Third-party Pixelmon reference mirror, not official Pixelmon Wiki',
      'importedGenerations':[1],
      'gen1Count':151,
      'gen1WithSpawns':sum(bool(rec['spawn']) for i,slug,rec,err in results),
      'gen1WithDrops':sum(bool(rec['drops']) for i,slug,rec,err in results),
      'speciesCount':len(existing['pokemon']),
      'itemCount':len(all_items),
      'updated':datetime.date.today().isoformat(),
      'notes':'All Gen I 151 entries checked for page ID and drop table; data from pixelmon.site secondary reference. No version-match claim. Entries without Spawn section are marked accordingly.'
    })
    audit=[]
    for i,slug,rec,err in results:
        audit.append({'id':i,'slug':slug,'spawn_rows':len(rec['spawn']),
                      'spawn_section':rec['verification']['spawnSectionPresent'],
                      'drop_rows':len(rec['drops']),'source':rec['source']})
    with AUDIT.open('w',encoding='utf-8-sig',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=list(audit[0].keys()));writer.writeheader();writer.writerows(audit)
    output=json.dumps(existing,ensure_ascii=False,indent=2)+'\n'
    OUT.write_text(output,encoding='utf-8')
    print('FINAL',json.dumps(existing['metadata'],ensure_ascii=False),flush=True)
    assert set(map(int,filter(lambda k:int(k)<=151,existing['pokemon'].keys())))==set(range(1,152))
    assert len(audit)==151

if __name__=='__main__':
    main()
