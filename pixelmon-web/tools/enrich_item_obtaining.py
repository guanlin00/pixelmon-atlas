#!/usr/bin/env python3
"""Best-effort individual item-source audit for Pixelmon Atlas.
Only quotes acquire methods visibly stated on the linked third-party item page.
Never turns a missing method into a fabricated survival recipe.
"""
import concurrent.futures as cf
import json
import re
import threading
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
PATH=ROOT/'pixelmon-item-index.json'
DATA=json.loads(PATH.read_text('utf-8'))
EXCLUDE_CATEGORIES=set()  # Every indexed unique item receives a check.
MAX_WORKERS=8
tls=threading.local()
def session():
    if not hasattr(tls,'session'):
        tls.session=requests.Session()
        tls.session.headers.update({'User-Agent':'Mozilla/5.0 (PixelmonAtlasResearch/1.0; noncommercial personal reference)'})
    return tls.session
def clean(s):
    return re.sub(r'\s+',' ',s or '').strip()

def parse_page(item):
    url=item.get('source','')
    if not url.startswith('https://pixelmon.site/') or url.endswith('/id/'):
        return None,'Skipped missing dedicated source'
    try:
        resp=session().get(url,timeout=30)
        if resp.status_code!=200:return None,'HTTP '+str(resp.status_code)
        soup=BeautifulSoup(resp.text,'html.parser')
        h=soup.find('h1')
        if h is None:return None,'No title'
        heading=clean(h.get_text(' ',strip=True))
        if not heading:return None,'Empty heading'
        # The site occasionally redirects to a search page for obsolete variants.
        if heading.lower().replace("’","'")!=item['name'].lower().replace("’","'"):
            if re.sub(r'[^a-z0-9]+','',heading.lower())!=re.sub(r'[^a-z0-9]+','',item['name'].lower()):
                return None,'Wrong article: '+heading[:60]
        methods=[]
        # Core article usually contains the only explicit shopkeeper/creative category note.
        par=h.find_next('p')
        if par:
            txt=clean(par.get_text(' ',strip=True))
            for pattern in [
                r'This item can be bought from shopkeepers in [^.]+\.',
                r'This item can be bought from [^.]+\.',
                r'This item can be obtained from [^.]+\.',
                r'This item can be found in [^.]+\.',
                r'This item can be received from [^.]+\.',
            ]:
                for m in re.findall(pattern,txt,flags=re.I):
                    if 'creative mode' not in m.lower():
                        methods.append({'type':'shop-or-source','text':m,'source':url})
        obt=next((tag for tag in soup.find_all(['h2']) if clean(tag.get_text(' ',strip=True)).lower()=='obtaining'),None)
        if obt:
            for sib in obt.next_siblings:
                if getattr(sib,'name',None)=='h2':break
                if getattr(sib,'name',None)!='h3':continue
                header=clean(sib.get_text(' ',strip=True))
                if not header or header.lower()=='give command':continue
                rows=[]
                t=sib.find_next_sibling('table')
                if t:
                    for tr in t.find_all('tr')[:35]:
                        cols=[clean(td.get_text(' ',strip=True)) for td in tr.find_all(['th','td'],recursive=False)]
                        if cols:rows.append(cols)
                methods.append({
                   'type':'section','text':header,
                   'rows':rows,'source':url
                })
        # Source command is creative/admin-only, never claimed as a survival drop.
        command=None
        if obt:
            heading=next((h for h in obt.find_all_next('h3') if clean(h.get_text(' ',strip=True)).lower()=='give command'),None)
            if heading:
                code=heading.find_next(['code','pre'])
                if code:
                    c=clean(code.get_text(' ',strip=True))
                    if c.startswith('/give @p '):command=c
        methods=list({json.dumps(x,sort_keys=True,ensure_ascii=False):x for x in methods}.values())
        return {'methods':methods,'creativeCommand':command,'source':url},None
    except Exception as e:
        return None,str(e)[:110]

def main():
    items=DATA['items']
    print('Checking individual item pages:',len(items),flush=True)
    checked=0;success=0;informed=0;fails=[];methodTally={}
    with cf.ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        for item,(result,error) in zip(items,pool.map(parse_page,items)):
            checked+=1
            if result:
                success+=1
                item['individualMethods']=result['methods']
                if result['creativeCommand']:item['creativeCommand']=result['creativeCommand']
                if result['methods']:
                    informed+=1
                    for x in result['methods']:
                        methodTally[x['text']]=methodTally.get(x['text'],0)+1
            else:
                fails.append((item['name'],error))
            if checked%200==0:
                print('PROGRESS',checked,'OK',success,'METHODS',informed,'FAIL',len(fails),flush=True)
    DATA['metadata']['individualPagesChecked']=checked
    DATA['metadata']['individualPagesAccessible']=success
    DATA['metadata']['individualMethodsFound']=informed
    DATA['metadata']['individualPagesFailed']=len(fails)
    DATA['metadata']['notes']+=' Individual-page obtaining sections were inspected on third-party mirror. Missing information remains explicitly unverified.'
    PATH.write_text(json.dumps(DATA,ensure_ascii=False,separators=(',',':'))+'\n','utf-8')
    (ROOT/'item-source-audit.json').write_text(json.dumps({
      'total':checked,'accessible':success,'withAcquisitionDetails':informed,
      'failures':[{'name':n,'error':e} for n,e in fails],
      'mostCommonMethods':sorted(methodTally.items(),key=lambda x:-x[1])[:30],
    },ensure_ascii=False,indent=2)+'\n','utf-8')
    print('RESULT',checked,success,informed,len(fails),flush=True)
    print('COMMON',list(sorted(methodTally.items(),key=lambda x:-x[1])[:12]),flush=True)
    if success<100:
        raise RuntimeError('Source accessibility insufficient; refusing to commit the enrichment')
if __name__=='__main__':main()
