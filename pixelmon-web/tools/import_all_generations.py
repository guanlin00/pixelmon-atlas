#!/usr/bin/env python3
"""Sequential source-audited import of Generation II–IX Pixelmon spawn/drops.
This data is from pixelmon.site (third-party reference), NOT verified from official Pixelmon Wiki.
Only an actual matching page with a drops table becomes an imported record.
Nonmatching/unavailable pages are recorded in an explicit audit, never fabricated.
"""
import csv
import datetime as dt
import io
import json
import re
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from import_gen1_reference import get, extract_spawn, extract_drops, clean, BASE, CSV_URL

ROOT=Path(__file__).resolve().parents[1]
GENERATIONS = {2:(152,251),3:(252,386),4:(387,493),5:(494,649),
               6:(650,721),7:(722,809),8:(810,905),9:(906,1025)}
ALIASES={
  'ho-oh':['ho-oh','hooh'],
  'porygon-z':['porygon-z','porygonz'],
  'mime-jr':['mime-jr','mimejr'],
  'mr-rime':['mr-rime','mrrime'],
  'type-null':['type-null','typenull'],
  'jangmo-o':['jangmo-o','jangmoo'],
  'hakamo-o':['hakamo-o','hakamoo'],
  'kommo-o':['kommo-o','kommoo'],
  'flabebe':['flabebe'],
  'sirfetchd':['sirfetchd','sirfetch-d'],
  'farfetchd':['farfetchd'],
  'nidoran-f':['nidoran-f','nidoran-female'],
  'nidoran-m':['nidoran-m','nidoran-male'],
  'mr-mime':['mr-mime','mrmime'],
  'tapu-koko':['tapu-koko','tapukoko'],
  'tapu-lele':['tapu-lele','tapulele'],
  'tapu-bulu':['tapu-bulu','tapubulu'],
  'tapu-fini':['tapu-fini','tapufini'],
  'wo-chien':['wo-chien','wochien'],
  'chien-pao':['chien-pao','chienpao'],
  'ting-lu':['ting-lu','tinglu'],
  'chi-yu':['chi-yu','chiyu'],
}
def get_species():
    rows=csv.DictReader(io.StringIO(get(CSV_URL)))
    names={}
    for row in rows:
        i=int(row['id'])
        if 152<=i<=1025:
            names[i]=row['identifier']
    if len(names)!=874:
        raise RuntimeError('Expected 874 generations II–IX, got '+str(len(names)))
    return names

def read_one(pair):
    i,slug=pair
    aliases=ALIASES.get(slug,[slug])
    # PokeAPI identifiers occasionally differ in punctuation from the page slug.
    errors=[]
    for candidate in aliases:
        url=urljoin(BASE,candidate+'/')
        try:
            html=get(url,retries=2)
            soup=BeautifulSoup(html,'html.parser')
            h=soup.find('h1')
            heading=clean(h.get_text(' ',strip=True)) if h else ''
            if not re.search(r'#0*'+str(i)+r'\b',heading):
                errors.append(candidate+': mismatch '+heading[:55])
                continue
            spawns,blocks=extract_spawn(soup)
            drops,has_drops=extract_drops(soup)
            # Some newer Pokémon pages expose a Spawn section but no Drops table.
            # Keep the source-backed spawn rows, and explicitly flag missing drops.
            if not has_drops and not spawns:
                errors.append(candidate+': neither usable spawn nor drop table')
                continue
            if blocks and not spawns:
                errors.append(candidate+': failed to parse spawn sections')
                continue
            record={
                'source':url,'officialWiki':'https://pixelmonmod.com/wiki/'+candidate.replace('-','_').title(),
                'spawn':spawns,'drops':drops,
                'verification':{
                    'sourceStatus':'Imported from third-party pixelmon.site mirror. NOT verified against official Pixelmon Wiki or current Pixelmon version.',
                    'form':'default','spawnSectionPresent':bool(blocks),'dropsSectionPresent':has_drops,
                    'notes':'Spawn rarity is a source weight, not a percent. No Spawn section does not prove this species is unobtainable. Empty drops with dropsSectionPresent=false means no verified drop data; NOT a claim of zero drops.'
                }
            }
            return i,slug,record,None
        except Exception as err:
            errors.append(candidate+': '+str(err)[:90])
    return i,slug,None,'; '.join(errors)

def main(generation):
    species=get_species()
    lo,hi=GENERATIONS[generation]
    selection=[(id,slug) for id,slug in species.items() if lo<=id<=hi]
    print('START_GENERATION',generation,'DEX',lo,'-',hi,'TOTAL',len(selection),flush=True)
    with ThreadPoolExecutor(max_workers=7) as pool:
        results=list(pool.map(read_one,selection))
    data={'metadata':{
      'source':'https://pixelmon.site/','sourceType':'THIRD-PARTY Pixelmon reference, not official Pixelmon Wiki',
      'generation':generation,'dexStart':lo,'dexEnd':hi,'requested':len(selection),
      'updated':dt.date.today().isoformat(),
      'notes':'Records require matching National Dex ID and at least one of: actual Spawn section or Drops table. Missing sections remain explicitly unverified, not zero. Data from third-party mirror, no version compatibility claim.'
    },'pokemon':{},'items':{}}
    failures=[]
    audit=[]
    for id,slug,record,error in results:
        audit.append({'id':id,'slug':slug,'status':'imported' if record else 'unavailable',
                      'spawnRules':len(record['spawn']) if record else 0,
                      'drops':len(record['drops']) if record else 0,
                      'source':record['source'] if record else None,'error':error})
        if record:
            data['pokemon'][str(id)]=record
            for d in record['drops']:
                data['items'].setdefault(d['item'],[]).append(
                   {'pokemonId':id,'chance':d['chance'],'quantity':d['quantity']})
        else:
            failures.append({'id':id,'slug':slug,'reason':error})
    data['metadata'].update({
       'imported':len(data['pokemon']),'missing':len(failures),
       'withSpawns':sum(bool(x['spawn']) for x in data['pokemon'].values()),
       'withDrops':sum(bool(x['drops']) for x in data['pokemon'].values()),
       'spawnRows':sum(len(x['spawn']) for x in data['pokemon'].values()),
       'dropRows':sum(len(x['drops']) for x in data['pokemon'].values())
    })
    (ROOT/f'wiki-reference-gen{generation}.json').write_text(
        json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n','utf-8')
    (ROOT/f'gen{generation}-import-audit.json').write_text(
        json.dumps({'metadata':data['metadata'],'records':audit,'missing':failures},
                   ensure_ascii=False,indent=2)+'\n','utf-8')
    print('COMPLETE_GENERATION',generation,'SUCCESS',len(data['pokemon']),
          'MISSING',len(failures),'SPAWN_ROWS',data['metadata']['spawnRows'],
          'DROP_ROWS',data['metadata']['dropRows'],flush=True)
    for fail in failures:
        print('MISSING',fail['id'],fail['slug'],fail['reason'],flush=True)
    assert len(audit)==len(selection)
    assert set(map(int,data['pokemon']))<=set(range(lo,hi+1))
    assert len(data['pokemon'])+len(failures)==len(selection)
    if not data['pokemon']:
        print('WARNING: no supported entries for Generation',generation,flush=True)

if __name__=='__main__':
    if len(sys.argv)!=2 or int(sys.argv[1]) not in GENERATIONS:
        raise SystemExit('Usage: python import_all_generations.py <generation 2..9>')
    main(int(sys.argv[1]))
