import json,urllib.request,zipfile,shutil,os,time
api='https://api.modrinth.com/v2/version/l63weWf0'
req=urllib.request.Request(api,headers={'User-Agent':'PixelmonAtlas/1.0'})
with urllib.request.urlopen(req,timeout=40) as resp:obj=json.load(resp)
f=max(obj['files'],key=lambda x:x['size'])
print('VERSION',obj['version_number'],'SIZE',f['size'],flush=True)
dest='/tmp/pixelmon942.jar'
req=urllib.request.Request(f['url'],headers={'User-Agent':'PixelmonAtlas/1.0'})
t=time.time()
with urllib.request.urlopen(req,timeout=120) as inp,open(dest,'wb') as out:
  shutil.copyfileobj(inp,out,1024*1024)
print('DOWNLOADED',os.stat(dest).st_size,'seconds',round(time.time()-t,1),flush=True)
with zipfile.ZipFile(dest) as archive:
  names=archive.namelist()
  for token in ['/species/','/spawning/','/drops/','/loot_table/']:
    hits=[p for p in names if token in p and p.endswith(('.json','.json5'))]
    print('FILES',token,'count',len(hits),'first',hits[:8],flush=True)
    for path in hits[:2]:
      try:
        data=json.loads(archive.read(path))
        print('EXAMPLE',path,json.dumps(data,ensure_ascii=False)[:3200],flush=True)
      except Exception as e:print('EXAMPLE_ERROR',path,str(e),flush=True)
  for path in names:
    if path.endswith('pokedrops.json') or path.endswith('/906_sprigatito.json'):
      try:
        data=json.loads(archive.read(path))
        print('SPECIAL',path,json.dumps(data,ensure_ascii=False)[:4200],flush=True)
      except Exception as e:print('SPECIAL_ERR',path,str(e),flush=True)
