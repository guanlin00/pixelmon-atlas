'use strict';
/* Pixelmon Wiki reference data. Wiki entries do not guarantee 9.4.2 server compatibility. */
const WIKI_ITEM_TEXTURES = {"Vines":"vine","Twisting Vines":"twisting_vines","Blaze Powder":"blaze_powder","Charcoal":"charcoal","Blaze Rod":"blaze_rod","Magma Cream":"magma_cream","Kelp":"kelp","Scute":"scute","Seagrass":"seagrass","Prismarine Crystals":"prismarine_crystals","String":"string","Cobweb":"cobweb","Cornflower":"cornflower","Chorus Flower":"chorus_flower","Feather":"feather","Raw Chicken":"chicken","Glowstone Dust":"glowstone_dust","Apple":"apple","Cookie":"cookie","Ender Pearl":"ender_pearl","Seeds":"wheat_seeds","Sand":"sand"};
const WIKI_BIOME_ZH={'Birches':'樺木林類','Forests':'森林類','Ultra Forest':'究極森林','Crag Gardens':'岩壁花園','Arid':'乾燥地帶','Plains':'平原類','Taigas':'針葉林類','Mesas':'惡地類','Land':'陸地'};
const WIKI_ITEM_ZH = {"Vines":"藤蔓","Twisting Vines":"扭曲藤蔓","Grass Gem":"草之寶石","Big Root":"大根莖","Blaze Powder":"烈焰粉","Charcoal":"木炭","Blaze Rod":"烈焰桿","Fire Gem":"火之寶石","Magma Cream":"岩漿球","Fire Stone Shard":"火之石碎片","Kelp":"海帶","Scute":"鱗甲","Seagrass":"海草","Water Gem":"水之寶石","Prismarine Crystals":"海磷晶體","String":"線","Cobweb":"蜘蛛網","Cornflower":"矢車菊","Shed Shell":"美麗空殼","Chorus Flower":"歌萊花","Silver Powder":"銀粉","Feather":"羽毛","Raw Chicken":"生雞肉","Glowstone Dust":"螢石粉","Thunder Stone Shard":"雷之石碎片","Pikanium Z":"皮卡丘Z","Apple":"蘋果","Cookie":"餅乾","Chesto Berry":"零餘果","Snorlium Z":"卡比獸Z","Ender Pearl":"終界珍珠"};
function wikiItemId(en){if(en==='Ender Pearl')return 'pearl';return 'wiki:'+en.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')}
function importWikiReference(data){
 if(!data||typeof data!=='object'||!data.pokemon) return;
 window.wikiDataset={...(window.wikiDataset||{}),pokemon:{...(window.wikiDataset?.pokemon||{}),...data.pokemon},items:{...(window.wikiDataset?.items||{}),...(data.items||{})}};
 const items=data.items||{};
 const existingBiomes=new Set(BIOMES.map(b=>b[0]));
 const importedBiomes=[...new Set(Object.values(data.pokemon).flatMap(p=>(p.spawn||[]).map(r=>r.biome)))];
 const newBiomes=importedBiomes.filter(b=>b&&!existingBiomes.has(b)).map(b=>[b,WIKI_BIOME_ZH[b]||b,b]);
 if(newBiomes.length){BIOME_GROUPS.push({name:'Pixelmon Wiki 生成分類／生態域',items:newBiomes});BIOMES.push(...newBiomes)}
 for(const [id,record] of Object.entries(data.pokemon)){
  const p=POKEMON.find(x=>x.id===Number(id));if(!p)continue;
  const rules=(record.spawn||[]).map(x=>({biome:x.biome,times:String(x.time||'Any').split(/[,/]|\s+or\s+/i).map(t=>t.trim()).filter(Boolean),location:x.location||'—',rarity:x.rarity||'—',mod:x.mod||'—',condition:x.condition||'—',verified:true,source:record.source||'https://pixelmonmod.com/wiki/'+encodeURIComponent(p.en),sourceType:'wiki'}));
  if(rules.length)p.rules=rules;
  const drops=(record.drops||[]).map(d=>({item:wikiItemId(d.item),chance:String(d.chance||'—'),quantity:String(d.quantity||'—'),source:record.source,sourceType:'wiki'}));
  if(drops.length||record.verification?.sourceStatus?.includes('original Pixelmon 9.4.2')){p.verifiedDrops=drops;p.drops=drops.map(d=>d.item)}
  if(record.formDrops&&typeof record.formDrops==='object'){
   p.formDrops=Object.entries(record.formDrops).map(([form,rows])=>({
      form,drops:(rows||[]).map(d=>({item:wikiItemId(d.item),
          chance:String(d.chance||'—'),quantity:String(d.quantity||'—'),
          gameItemId:d.gameItemId||null,source:record.source,sourceType:'official-mod'}))
   }));
  }
 }
 for(const [en,refs] of Object.entries(items)){
  let i=ITEMS.find(x=>x.id===wikiItemId(en));
  if(!i){i={id:wikiItemId(en),zh:WIKI_ITEM_ZH[en]||en,en,icon:'◇',texture:WIKI_ITEM_TEXTURES[en]||null,kind:'Pixelmon Wiki 掉落物',desc:'Pixelmon 掉落物資料；實際來源可能是官方 9.4.2 遊戲檔或第三方圖鑑，請查看寶可夢條目。'};ITEMS.push(i)}
  const newRefs=refs.filter(x=>POKEMON.some(p=>p.id===Number(x.pokemonId))).map(x=>({...x,pokemonId:Number(x.pokemonId)}));
  const merged=[...(i.wikiDrops||[]),...newRefs];
  i.wikiDrops=[...new Map(merged.map(x=>[x.pokemonId+'|'+(x.form||'base')+'|'+x.chance+'|'+x.quantity,x])).values()];
 }
 for(const i of ITEMS){for(const d of i.wikiDrops||[]){const p=POKEMON.find(x=>x.id===d.pokemonId);if(!p)continue;p.verifiedDrops=p.verifiedDrops||[];if(d.form)continue;if(!p.verifiedDrops.some(x=>x.item===i.id&&String(x.chance)===String(d.chance)&&String(x.quantity)===String(d.quantity))){p.verifiedDrops.push({item:i.id,chance:d.chance,quantity:d.quantity,source:window.wikiDataset?.pokemon?.[String(d.pokemonId)]?.source||'https://pixelmonmod.com/wiki/Drops',sourceType:'wiki'})}}}
 window.wikiLoaded=true;
}
async function loadWikiReference(){
 // Prefer Pixelmon's actual 9.4.2 datapack; use the third-party Wiki
 // mirror only for generations without a valid official-file extraction.
 const imported=[];const unavailable=[];
 for(let generation=1;generation<=9;generation++){
  const candidates=[
   'official-942-gen'+generation+'.json',
   generation===1?'wiki-reference.json':'wiki-reference-gen'+generation+'.json'
  ];
  let loaded=false;
  for(const path of candidates){
   try{
    const response=await fetch(path,{cache:'no-store'});
    if(!response.ok){if(response.status!==404)unavailable.push(path+' HTTP '+response.status);continue}
    const data=await response.json();
    if(!data.pokemon||!Object.keys(data.pokemon).length)throw Error('empty Pokémon dataset');
    importWikiReference(data);
    imported.push({path,count:Object.keys(data.pokemon).length,metadata:data.metadata||{}});
    loaded=true;break;
   }catch(error){unavailable.push(path+': '+error.message)}
  }
  if(!loaded)unavailable.push('generation '+generation+' has no importable reference');
 }
 window.wikiImportProgress={imported,unavailable,total:imported.reduce((n,x)=>n+x.count,0)};
 window.wikiReferencePath=imported.map(x=>x.path).join(', ');
 window.wikiReferenceRaw=window.wikiDataset;
 console.info('Pixelmon spawn/drop import progress:',window.wikiImportProgress);
 if(typeof render==='function')render();
}
window.loadWikiReference=loadWikiReference;
