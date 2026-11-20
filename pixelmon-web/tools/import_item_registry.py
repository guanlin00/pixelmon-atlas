#!/usr/bin/env python3
"""Import a sourced Pixelmon item-ID reference and the available illustrated recipes.
The id/ and recipes/ pages are THIRD-PARTY mirrors; these are NOT gameplay verification.
Generated records have per-entry source, method status and image coordinates.
"""
import json
import re
from pathlib import Path
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
URL='https://pixelmon.site/id/'
RECIPES='https://pixelmon.site/recipes/'
HEADERS={'User-Agent':'Mozilla/5.0 (PixelmonAtlasDataImporter/1.0; personal game-reference indexing)'}
session=requests.Session()
session.headers.update(HEADERS)
def get(url):
    r=session.get(url,timeout=40)
    r.raise_for_status()
    if 'Just a moment' in r.text[:1200]:raise RuntimeError('Access blocked: '+url)
    return BeautifulSoup(r.text,'html.parser')
def slug(s):
    return re.sub(r'(^-|-$)','',re.sub(r'[^a-z0-9]+','-',s.lower().replace('é','e').replace('’','')))

def read_recipes():
    soup=get(RECIPES); table=soup.find('table')
    if not table:raise RuntimeError('Missing recipes table')
    recipes={}
    for tr in table.find_all('tr'):
        cells=tr.find_all('td',recursive=False)
        if len(cells)<3:continue
        item=cells[0].get_text(' ',strip=True)
        if not item or len(item)>90:continue
        img=cells[1].find('img') if cells[1] else None
        src=urljoin(RECIPES,img.get('src','')) if img else ''
        # The recipe site provides a readable ingredient list, but omits slot layout
        # from HTML text. The illustrated recipe image retains the actual grid.
        ingredients=list(dict.fromkeys(x.strip() for x in cells[2].stripped_strings if x.strip()))
        if src or ingredients:
            recipes.setdefault(slug(item),{
               'ingredients':ingredients,
               'recipeImage':src,
               'source':RECIPES,
               'sourceStatus':'第三方 Pixelmon 參考網站配方；請核對目前版本'
            })
    return recipes

def classify(name,identifier):
    n=name.lower();p=identifier.lower()
    if re.search(r'\btr\s*\d|^tr\d|^tr[: -]|tr_gen',n+' '+p):return '招式紀錄 TR'
    if re.search(r'\btm\s*\d|^tm\d|^tm[: -]|tm_gen',n+' '+p):return '招式機 TM'
    if 'spawn egg' in n or 'spawn_egg' in p:return '生成蛋'
    if 'badge' in n:return '徽章'
    if 'unown' in n and 'block' in n:return '未知圖騰方塊'
    if 'braille' in n or 'letterbox' in n:return '裝飾與建材'
    if any(x in n for x in ['healer','vending machine','chair','clock','umbrella','bench','couch','rug','mailbox','flooring','brick','bed','table','fence','sign','block','wall','door','trapdoor','stairs','slab']):return '裝飾與建材'
    if any(x in n for x in ['armor','helmet','leggings','chestplate','boots','hammer','pickaxe','axe','shovel','sword','hoe']):return '工具與裝備'
    if 'fossil' in n:return '化石與復活'
    if 'z-crystal' in n or n.endswith('ium z') or n.endswith('nium z'):return 'Z 純晶'
    if 'berry' in n or 'apricorn' in n:return '樹果與球果'
    if 'mint' in n:return '薄荷'
    if any(x in n for x in ['mega stone','ite x','ite y','ite']):return '超級進化石'
    if 'ball' in n or 'disc' in n or 'lid' in n:return '精靈球與零件'
    if any(x in n for x in ['potion','elixir','medicine','revive','heal','vitamin','candy','repel']):return '藥品與補給'
    if any(x in n for x in ['gem','stone','shard','ingot','ore','crystal']):return '石頭、寶石與礦物'
    if any(x in n for x in ['trade machine','pc','computer','machine','infuser','cleaner']):return '機器設備'
    return '其他 Pixelmon 道具'

def category_method(cat):
    methods={
      '招式機 TM':('對應世代的空白招式機可由商人、寶可夢戰利品或頭目等來源取得；將空白招式機交給會使用對應招式的寶可夢攜帶，依指定招式使用次數完成記錄。各世代／伺服器取得規則可能不同。','https://pixelmonmod.com/wiki/TMs','分類機制：官方 Wiki；非單一招式機掉落保證'),
      '招式紀錄 TR':('使用對應世代的空白招式紀錄，交給會使用指定招式的寶可夢攜帶；依指定招式使用次數記錄後取得。依官方 Wiki，TR 通常需使用招式 25 次，並可能受設定影響。','https://pixelmonmod.com/wiki/TR','分類機制：官方 Wiki；非單一招式紀錄掉落保證'),
      '生成蛋':('通常為創造模式／指令用途；是否在生存模式有特殊取得方式，須依伺服器設定查證。','https://pixelmonmod.com/wiki/Item_IDs','僅提供創造模式分類提示'),
      '未知圖騰方塊':('屬裝飾方塊分類；合成表或其他取得方法尚待查證。','https://pixelmonmod.com/wiki/Items','尚待核對'),
      'Z 純晶':('需依 Z 純晶的種類查詢專屬取得事件、NPC 或戰鬥機制；不共用固定合成配方。','https://pixelmonmod.com/wiki/Z-Crystals','分類提示，個別取得方式待核實'),
      '超級進化石':('超級石可能透過對應的超級頭目掉落及特殊獲得途徑取得；各石頭應再依官方 Wiki 個別條目核對。','https://pixelmonmod.com/wiki/Mega_Stones','分類機制，個別掉落來源待核實'),
      '樹果與球果':('可透過對應植物的種植、栽培及採收取得；部分種類亦有野外收集或戰鬥來源，依道具種類而異。','https://pixelmonmod.com/wiki/Berry','通用分類方式，待核對個別種類'),
      '徽章':('通常透過道館挑戰或管理員／NPC 設定取得，不能把所有徽章當成通用合成物品。','https://pixelmonmod.com/wiki/Badges','分類提示，依伺服器而異'),
      '化石與復活':('不同化石的獲得及復活方式不同；化石可搭配化石清洗機與化石復活機使用。','https://pixelmonmod.com/wiki/Fossils','分類取得方式，個別條目待查'),
      '精靈球與零件':('精靈球及零件可能透過製作、野外戰利品或商店取得，配方依球種及模組版本而異。','https://pixelmonmod.com/wiki/Poke_Balls','分類提示，個別配方待核實'),
      '裝飾與建材':('部分道具可合成，部分為創造模式或商店／特殊場景限定；無法只依圖示判定配方。','https://pixelmonmod.com/wiki/Recipes','分類提示，個別配方待核實'),
    }
    return methods.get(cat,('尚未找到可核實的個別配方或生存模式取得方法；可依來源連結查詢該道具。','https://pixelmonmod.com/wiki/Items','個別取得方式待核實'))

def main():
    soup=get(URL)
    tab=soup.find('table',class_='items')
    if not tab:raise RuntimeError('Pixelmon item table missing')
    recipes=read_recipes()
    listed=[]
    for tr in tab.find_all('tr')[1:]:
        cells=tr.find_all('td',recursive=False)
        if len(cells)<3:continue
        name=cells[1].get_text(' ',strip=True)
        gameid=cells[2].get_text(' ',strip=True)
        if not name or not gameid.startswith('pixelmon:'):continue
        sourceA=cells[1].find('a')
        link=urljoin(URL,sourceA.get('href','')) if sourceA else URL
        icon=cells[0].find('i')
        position=icon.get('style','') if icon else ''
        match=re.search(r'background-position:\s*(-?\d+)px\s+(-?\d+)px',position)
        sprite=[int(match.group(1)),int(match.group(2))] if match else None
        group=classify(name,gameid)
        base=slug(name)
        # Preserve NBT and variant item IDs. Multiple distinct in-game items may share a name.
        rid=gameid
        craft=recipes.get(base)
        guide,guide_source,status=category_method(group)
        if craft:
            guide='可依來源網站提供的配方圖與材料表製作；該頁可能包含舊版配方，需以目前遊戲為準。'
            guide_source=craft['source'];status=craft['sourceStatus']
        listed.append({
          'name':name,'gameId':gameid,'slug':base,'category':group,
          'source':link,'idListSource':URL,'sprite':sprite,
          'method':guide,'methodSource':guide_source,'methodStatus':status,
          'recipe':craft
        })
    if len(listed)<2000:raise RuntimeError('Too few Pixelmon IDs '+str(len(listed)))
    uniq={}
    for it in listed:uniq[it['gameId']]=it
    listed=list(uniq.values())
    result={'metadata':{
      'source':URL,'sourceType':'THIRD-PARTY Pixelmon Reforged registry; NOT official pixelmonmod.com',
      'recipeSource':RECIPES,'count':len(listed),'recipeMatches':sum(bool(i['recipe']) for i in listed),
      'notes':'Items from the mirror ID table. Method information is a sourced category guide unless individually corroborated by an illustrated recipe. Current server/version availability not certified.'
    },'items':listed}
    out=ROOT/'pixelmon-item-index.json'
    out.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n','utf-8')
    print('IMPORT',len(listed),'ITEMS',flush=True)
    print('RECIPES',len(recipes),'MATCHES',result['metadata']['recipeMatches'],flush=True)
    cats={}
    for item in listed:cats[item['category']]=cats.get(item['category'],0)+1
    print('CATEGORIES',json.dumps(cats,ensure_ascii=False),flush=True)
    print('EXAMPLES',json.dumps(listed[:3],ensure_ascii=False)[:2200],flush=True)
    assert len(uniq)==len(listed)
if __name__=='__main__':main()
