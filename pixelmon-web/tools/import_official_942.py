#!/usr/bin/env python3
"""Extract verified spawn/drop reference facts directly from the official Pixelmon 9.4.2 JAR.
DO NOT publish the mod JAR or its proprietary sprites/models. Commit only derived facts.
See https://pixelmonmod.com/wiki/Datapack_Creation for data file structure.
"""
import collections
import datetime
import hashlib
import json
import os
import re
import shutil
import urllib.request
import zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
VERSION='9.4.2'
VERSION_URL='https://api.modrinth.com/v2/version/l63weWf0'
SOURCE_URL='https://modrinth.com/mod/pixelmon/version/9.4.2'
RANGES={1:(1,151),2:(152,251),3:(252,386),4:(387,493),5:(494,649),6:(650,721),7:(722,809),8:(810,905),9:(906,1025)}
HEADERS={'User-Agent':'PixelmonAtlas/1.0 (personal data verification)'}

def normalize(x):
    return re.sub('[^a-z0-9]','',str(x).lower())

def nice(x):
    return str(x).replace('_',' ').replace('-',' ').strip().title()

def get_package():
    r=urllib.request.Request(VERSION_URL,headers=HEADERS)
    with urllib.request.urlopen(r,timeout=35) as response:
        manifest=json.load(response)
    if manifest.get('version_number')!=VERSION:raise ValueError('Version mismatch')
    files=[x for x in manifest.get('files',[]) if x['filename'].endswith('.jar')]
    if len(files)!=1:raise ValueError('Ambiguous JAR download list')
    item=files[0]
    destination=Path('/tmp/pixelmon-official-942.jar')
    req=urllib.request.Request(item['url'],headers=HEADERS)
    with urllib.request.urlopen(req,timeout=140) as response,destination.open('wb') as out:
        shutil.copyfileobj(response,out,1024*1024)
    if destination.stat().st_size!=item['size']:
        raise ValueError('JAR file size mismatch')
    sha256=hashlib.file_digest(destination.open('rb'),'sha256').hexdigest()
    if item.get('hashes',{}).get('sha256') and sha256!=item['hashes']['sha256']:
        raise ValueError('JAR file SHA256 mismatch')
    print('OFFICIAL_JAR',VERSION,item['size'],'SHA256',sha256,flush=True)
    return destination,sha256

def scan_species(archive):
    species={}
    for path in archive.namelist():
        if not re.fullmatch(r'data/pixelmon/species/\d{3,4}_[^/]+\.json',path):continue
        obj=json.loads(archive.read(path))
        dex=obj.get('dex')
        if not isinstance(dex,int) or dex<1 or dex>1025:continue
        if dex in species:raise ValueError('Duplicate Dex ID '+str(dex))
        species[dex]={'name':obj.get('name',''),'path':path,
                      'forms':[f.get('name') for f in obj.get('forms',[])],
                      'spawnLocations':(obj.get('forms') or [{}])[0].get('spawn',{}).get('spawnLocations',[])}
    missing=[i for i in range(1,1026) if i not in species]
    if missing:
        print('SPECIES_MISSING_IN_JAR',missing,flush=True)
    if len(species)<1000:raise ValueError('Missing many species: '+str(len(species)))
    return species,missing

def item_name(item):
    if not item:return 'Unknown Item'
    if isinstance(item,dict):item=item.get('item') or item.get('id') or str(item)
    raw=str(item)
    return nice(raw.split(':',1)[-1])

def scan_drops(archive,species):
    raw=json.loads(archive.read('data/pixelmon/drops/pokedrops.json'))
    if not isinstance(raw,list):raise ValueError('Unexpected official pokedrops structure')
    by_name={normalize(rec['name']):dex for dex,rec in species.items()}
    records={}
    alternate=collections.defaultdict(dict)
    unmatched=[]
    for entry in raw:
        pokemon=str(entry.get('pokemon') or '')
        base_name=re.split(r'\s+(?:form|palette):',pokemon,maxsplit=1,flags=re.I)[0]
        id=by_name.get(normalize(base_name))
        if id is None:
            unmatched.append(pokemon)
            continue
        variant=pokemon[len(base_name):].strip()
        items=[]
        for item in entry.get('items',[]):
            if not isinstance(item,dict):continue
            rawid=item.get('item')
            if not rawid:continue
            rawchance=item.get('chance',None)
            if not isinstance(rawchance,(float,int)):continue
            percent=float(rawchance)*100.0
            ch=('%g'%round(percent,7))+'%'
            lo=item.get('min',0);hi=item.get('max',1)
            if lo is None or hi is None:continue
            qty=str(lo) if lo==hi else f'{lo}-{hi}'
            items.append({'item':item_name(rawid),
                          'gameItemId':str(rawid),
                          'chance':ch,'quantity':qty,
                          'min':lo,'max':hi,'chanceFraction':rawchance})
        if not variant or re.match(r'form:base\b',variant,flags=re.I):
            if id not in records or not variant:
                records[id]=items
        else:
            alternate[id][variant]=items
    covered=set(records)|set(alternate)
    if len(covered)<950:
        raise ValueError('Too few official drop entries, got '+str(len(covered)))
    print('OFFICIAL_DROPS',len(records),'WITH_SPECIAL_FORMS',len(alternate),
          'COVERED_SPECIES',len(covered),'UNMATCHED_NAMES',len(unmatched),unmatched[:45],flush=True)
    return records,dict(alternate),unmatched

def condition_text(obj):
    """Display only verbatim constraints and simple well-known keys."""
    if not isinstance(obj,dict):return ''
    parts=[]
    for key,value in obj.items():
        if key in ['biomes','times','time']:continue
        text=json.dumps(value,ensure_ascii=False,separators=(',',':')) if isinstance(value,(dict,list)) else str(value)
        if not text or text in ('[]','{}','null'):continue
        parts.append(nice(key)+': '+text)
    return '；'.join(parts)

def identify_species(spec,by_name):
    """Match a single species: token within Pixelmon spawn spec and preserve form rules."""
    if not isinstance(spec,str):return None,None
    m=re.search(r'(?:^|\s)species:([^\s,;]+)',spec,flags=re.I)
    if not m:return None,None
    name=m.group(1)
    dex=by_name.get(normalize(name))
    return dex,spec

def parse_spawns(archive,species):
    by_name={normalize(v['name']):k for k,v in species.items()}
    records=collections.defaultdict(list)
    seen=collections.defaultdict(set)
    categories=collections.Counter()
    unlinked=[]
    allfiles=[x for x in archive.namelist() if x.startswith('data/pixelmon/spawning/') and x.endswith('.json')]
    for path in allfiles:
        try:obj=json.loads(archive.read(path))
        except Exception as e:
            print('SPAWN_JSON_ERROR',path,str(e)[:100],flush=True)
            continue
        group=path.split('/')[3]
        categories[group]+=1
        if isinstance(obj,dict):
            infos=obj.get('spawnInfos',[])
        else:infos=[]
        if not isinstance(infos,list):continue
        for info in infos:
            if not isinstance(info,dict):continue
            dex,spec=identify_species(info.get('spec'),by_name)
            if dex is None:
                unlinked.append((path,str(info.get('spec',''))[:90]))
                continue
            if info.get('typeID','pokemon').lower()!='pokemon':continue
            condition=info.get('condition') or {}
            anticondition=info.get('anticondition') or {}
            raw_biomes=condition.get('biomes') or []
            if isinstance(raw_biomes,str):raw_biomes=[raw_biomes]
            if not isinstance(raw_biomes,list):raw_biomes=[]
            if not raw_biomes:raw_biomes=['Any / not specified']
            times=condition.get('times') or condition.get('time') or info.get('times') or []
            if isinstance(times,str):times=[times]
            if not isinstance(times,list):times=[]
            time=', '.join(str(x).title() for x in times) or 'Any'
            location=', '.join(str(x) for x in info.get('stringLocationTypes',[])) or '—'
            lev_a=info.get('minLevel');lev_b=info.get('maxLevel')
            required=[]
            if lev_a is not None or lev_b is not None:required.append('等級：'+str(lev_a if lev_a is not None else '?')+'-'+str(lev_b if lev_b is not None else '?'))
            special=condition_text(condition)
            if special:required.append(special)
            if anticondition:required.append('排除條件：'+json.dumps(anticondition,ensure_ascii=False,separators=(',',':')))
            if info.get('spec') and str(info['spec']).strip().lower()!=('species:'+species[dex]['name']).lower():
                required.append('形態／規格：'+str(info['spec']))
            rarity=info.get('rarity')
            for biome in raw_biomes:
                biome=str(biome)
                # Preserve official biome tag identifiers; translated generic names come from a secondary UI map.
                mod=biome.removeprefix('#').split(':',1)[0] if ':' in biome else '—'
                row={'biome':biome,'mod':mod,'time':time,'location':location,
                     'condition':'；'.join(required) or '—',
                     'rarity':('權重 %g'%rarity if isinstance(rarity,(int,float)) else '—'),
                     'sourceFile':path,'spawnGroup':group}
                key=json.dumps(row,sort_keys=True,ensure_ascii=False)
                if key in seen[dex]:continue
                seen[dex].add(key)
                records[dex].append(row)
    print('OFFICIAL_SPAWNS',len(records),'ROWS',sum(len(x) for x in records.values()),
          'GROUPS',categories,'UNLINKED',len(unlinked),'SAMPLE',unlinked[:12],flush=True)
    return records,unlinked,categories

def save_data(species,drops,alternate,spawns,sha256,missing_species,unmatched,unlinked):
    progress={'modVersion':VERSION,'sha256':sha256,'source':SOURCE_URL,'updated':datetime.date.today().isoformat(),
              'generations':[],'missingDexInJar':missing_species,
              'unmatchedDropNames':unmatched,
              'unlinkedSpawnRulesCount':len(unlinked)}
    for gen,(a,b) in RANGES.items():
        out={'metadata':{'source':SOURCE_URL,'sourceType':'Original Pixelmon 9.4.2 mod JAR datapack',
                         'jarSha256':sha256,'gameVersion':VERSION,'generation':gen,
                         'dexStart':a,'dexEnd':b,
                         'notes':'Derived factual spawn rules and drop chances from packaged official version 9.4.2 JSON. Spawn biome tags and special form spec are preserved; rarity values are weights, not percentages. Empty spawns do not mean unobtainable. Customized servers/datapacks may differ.'},
             'pokemon':{},'items':{}}
        audit=[]
        for id in range(a,b+1):
            if id not in species:
                audit.append({'id':id,'status':'species file absent','spawnRows':0,'dropRows':0})
                continue
            info=species[id]
            spawnrows=spawns.get(id,[])
            droprows=drops.get(id,[])
            variant_drops=alternate.get(id,{})
            entry={'source':SOURCE_URL,'sourceFile':info['path'],
                   'spawn':spawnrows,'drops':droprows,'formDrops':variant_drops,
                   'verification':{
                      'sourceStatus':'Verified from original Pixelmon 9.4.2 JAR datapack',
                      'modVersion':VERSION,
                      'spawnSectionPresent':bool(spawnrows),
                      'dropsSectionPresent':id in drops or bool(variant_drops),
                      'notes':'Individual forms and palettes may need separate interpretation. 0 spawn rows is NOT a claim of unobtainability.'
                   }}
            out['pokemon'][str(id)]=entry
            for form,rows in [('一般形態',droprows)]+list(variant_drops.items()):
                for drop in rows:
                    out['items'].setdefault(drop['item'],[]).append({
                      'pokemonId':id,'chance':drop['chance'],
                      'quantity':drop['quantity'],'gameItemId':drop['gameItemId'],
                      'form':form if form!='一般形態' else None})
            audit.append({'id':id,'name':info['name'],
                          'status':'official JAR imported',
                          'spawnRows':len(spawnrows),'dropRows':len(droprows),
                          'dropEntryPresent':id in drops or bool(variant_drops),
                          'alternateFormCount':len(variant_drops)})
        n=len(out['pokemon'])
        out['metadata'].update({'requested':b-a+1,'imported':n,
                                'withSpawns':sum(bool(x['spawn']) for x in out['pokemon'].values()),
                                'withDrops':sum(bool(x['drops']) for x in out['pokemon'].values()),
                                'withDropEntries':sum(x['verification']['dropsSectionPresent'] for x in out['pokemon'].values()),
                                'spawnRows':sum(len(x['spawn']) for x in out['pokemon'].values()),
                                'dropRows':sum(len(x['drops']) for x in out['pokemon'].values()),
                   'withAnyDrops':sum(bool(x['drops'] or x['formDrops']) for x in out['pokemon'].values()),
                   'formDropRows':sum(sum(len(v) for v in x['formDrops'].values()) for x in out['pokemon'].values())})
        (ROOT/f'official-942-gen{gen}.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n','utf-8')
        (ROOT/f'official-942-gen{gen}-audit.json').write_text(json.dumps({'metadata':out['metadata'],'records':audit},ensure_ascii=False,indent=2)+'\n','utf-8')
        progress['generations'].append(out['metadata'])
        print('OFFICIAL_GENERATION',gen,'SPECIES',n,'SPAWNS',out['metadata']['withSpawns'],
              'DROPS',out['metadata']['withDrops'],'RULES',out['metadata']['spawnRows'],flush=True)
    (ROOT/'official-942-progress.json').write_text(json.dumps(progress,ensure_ascii=False,indent=2)+'\n','utf-8')
    if sum(x['imported'] for x in progress['generations'])<1000:
        raise ValueError('Insufficient official species count')
    print('OFFICIAL_IMPORT_DONE',sum(x['imported'] for x in progress['generations']),
          'TOTAL_DROPS',sum(x['withDrops'] for x in progress['generations']),flush=True)

def main():
    jar,sha=get_package()
    with zipfile.ZipFile(jar) as z:
        species,missing=scan_species(z)
        drops,alternate,unmatched=scan_drops(z,species)
        spawns,unlinked,categories=parse_spawns(z,species)
    save_data(species,drops,alternate,spawns,sha,missing,unmatched,unlinked)
    jar.unlink(missing_ok=True)

if __name__=='__main__':
    main()
