#!/usr/bin/env python3
"""Import Minecraft base items visible in the user's creative screenshots.
Keep these separate from Pixelmon mod records; source versions cited.
Recipes are copied from PrismarineJS/minecraft-data for 1.21.1, not inferred.
"""
import json
import re
from pathlib import Path
from urllib.parse import quote
import requests

ROOT=Path(__file__).resolve().parents[1]
BASE='https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/1.21.1/'
ZH='https://assets.mcasset.cloud/1.21.1/assets/minecraft/lang/zh_tw.json'
session=requests.Session();session.headers.update({'User-Agent':'PixelmonAtlas/1.0 research'})
def get_json(url):
    r=session.get(url,timeout=40);r.raise_for_status()
    return r.json()
def classify(name,is_block):
    n=name
    if any(x in n for x in ('_planks','_log','_wood','_stripped_','_stairs','_slab','_fence','_fence_gate','_door','_trapdoor','_button','_pressure_plate','_sign','_hanging_sign','_sapling')):
        return 'Minecraft 木材與建材'
    if any(x in n for x in ('_wool','_carpet','_concrete','_terracotta','_glass','_stained_glass','_banner','_bed','_candle')):
        return 'Minecraft 彩色與裝飾'
    if any(x in n for x in ('_ore','_ingot','_raw_','_block_of','_gem','_crystal','_quartz')):return 'Minecraft 礦石與礦物'
    if any(x in n for x in ('_pickaxe','_axe','_shovel','_hoe','_sword','_helmet','_chestplate','_leggings','_boots','_bow','_crossbow')):return 'Minecraft 工具與裝備'
    if any(x in n for x in ('_potion','_bucket','_food','_stew','_chicken','_beef','_porkchop','_fish','_carrot','_potato','_apple')):return 'Minecraft 食物與補給'
    return 'Minecraft 原版方塊' if is_block else 'Minecraft 其他物品'

def display_cell(cell,lookup):
    if cell is None:return None
    if isinstance(cell,int):return lookup.get(cell,{}).get('zh') or lookup.get(cell,{}).get('en') or '物品 #'+str(cell)
    if isinstance(cell,list):
        # A recipe slot may accept multiple alternative materials.
        names=[display_cell(c,lookup) for c in cell]
        return '／'.join(x for x in dict.fromkeys(names) if x)
    if isinstance(cell,dict):
        return display_cell(cell.get('id'),lookup)
    return None

def get_recipe(record,recipes,lookup):
    choices=recipes.get(str(record['numericId'])) or []
    for opt in choices:
        if not isinstance(opt,dict):continue
        rows=opt.get('inShape')
        if isinstance(rows,list) and rows:
            grid=[[display_cell(c,lookup) for c in row] for row in rows if isinstance(row,list)]
            if not grid:continue
            names=list(dict.fromkeys(x for row in grid for x in row if x))
            return {'ingredients':names,'grid':grid,
                    'source':'https://github.com/PrismarineJS/minecraft-data/blob/master/data/pc/1.21.1/recipes.json',
                    'sourceStatus':'Minecraft 1.21.1 參考配方'}
        entries=opt.get('ingredients')
        if isinstance(entries,list) and entries:
            names=list(dict.fromkeys(display_cell(c,lookup) for c in entries if display_cell(c,lookup)))
            if not names:continue
            return {'ingredients':names,'grid':None,
                    'source':'https://github.com/PrismarineJS/minecraft-data/blob/master/data/pc/1.21.1/recipes.json',
                    'sourceStatus':'Minecraft 1.21.1 無序合成配方'}
    return None

def main():
    items=get_json(BASE+'items.json')
    recipes=get_json(BASE+'recipes.json')
    blocks=get_json(BASE+'blocks.json')
    blockNames={b['name'] for b in blocks}
    try:zh=get_json(ZH)
    except Exception as e:print('WARNING: Official Chinese locale unavailable',e,flush=True);zh={}
    out=[]
    for v in items:
        slug=v.get('name','')
        if not slug or slug=='air' or v.get('id') is None:continue
        en=v.get('displayName') or slug.replace('_',' ').title()
        translation=zh.get('block.minecraft.'+slug) or zh.get('item.minecraft.'+slug) or en
        out.append({
          'name':slug,'numericId':int(v['id']),'zh':translation,'en':en,
          'category':classify(slug,slug in blockNames),
          'gameId':'minecraft:'+slug,
          'source':'https://minecraft.wiki/w/'+quote(en.replace(' ','_')),
          'referenceSource':BASE+'items.json',
          'recipe':None,
          'method':'此物品屬於 Minecraft 原版。' + ('請查看下方已收錄的合成配方。' if str(v['id']) in recipes else '尚未從此資料來源核對個別採集、交易或戰利品取得條件。'),
          'methodStatus':'Minecraft 1.21.1 基礎資料；取得方式不代表 Pixelmon 專屬機制',
          'texture':slug
        })
    lookup={rec['numericId']:rec for rec in out}
    for rec in out:rec['recipe']=get_recipe(rec,recipes,lookup)
    result={'metadata':{
      'source':'https://github.com/PrismarineJS/minecraft-data',
      'translationSource':ZH,
      'count':len(out),'recipes':sum(bool(x['recipe']) for x in out),
      'notes':'Vanilla Minecraft items are grouped separately from Pixelmon items. Imported version 1.21.1; may differ from Pixelmon mod pack version. Chinese names from Minecraft localization where available.'
    },'items':out}
    (ROOT/'minecraft-item-index.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n','utf-8')
    print('MINECRAFT_ITEMS',len(out),'WITH_RECIPES',result['metadata']['recipes'],flush=True)
    print('CHINESE_NAMES',sum(x['zh']!=x['en'] for x in out),'LOCALE',len(zh),flush=True)
    assert len(out)>1000 and result['metadata']['recipes']>500
if __name__=='__main__':main()
