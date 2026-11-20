'use strict';
/* Official Wiki-derived reference data are intentionally distinct from Pixelmon 9.4.2 JAR data.
 * Do not overwrite locally verified mod rules when adding Wiki entries. */
const WIKI_ITEM_TEXTURES = {'Vines':'vine','Twisting Vines':'twisting_vines','Ender Pearl':'ender_pearl','Seeds':'wheat_seeds','Sand':'sand'};
const WIKI_BIOME_ZH={'Birches':'樺木林類','Forests':'森林類','Ultra Forest':'究極森林','Crag Gardens':'岩壁花園','Arid':'乾燥地帶','Plains':'平原類','Taigas':'針葉林類','Mesas':'惡地類','Land':'陸地'};
function wikiItemId(en){if(en==='Ender Pearl')return 'pearl';return 'wiki:'+en.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')}
function importWikiReference(data){
 if(!data||typeof data!=='object'||!data.pokemon)return;
 window.wikiDataset=data;
 const items=data.items||{};
 const existingBiomes=new Set(BIOMES.map(b=>b[0]));
 const importedBiomes=[...new Set(Object.values(data.pokemon).flatMap(p=>(p.spawn||[]).map(r=>r.biome)))];
 const newBiomes=importedBiomes.filter(b=>b&&!existingBiomes.has(b)).map(b=>[b,WIKI_BIOME_ZH[b]||b,b]);
 if(newBiomes.length){BIOME_GROUPS.push({name:'Pixelmon Wiki 生成分類／生態域',items:newBiomes});BIOMES.push(...newBiomes)}
 // Include item entries from individual species pages even if the global Drops table is incomplete.
 for(const [id,record] of Object.entries(data.pokemon)){
   const p=POKEMON.find(x=>x.id===Number(id));if(!p)continue;
   const rules=(record.spawn||[]).map(x=>({
     biome:x.biome,times:String(x.time||'Any').split(/[,/]|\s+or\s+/i).map(t=>t.trim()).filter(Boolean),
     location:x.location||'—',rarity:x.rarity||'—',mod:x.mod||'—',condition:x.condition||'—',
     verified:true,source:record.source||'https://pixelmonmod.com/wiki/'+encodeURIComponent(p.en),sourceType:'wiki'
   }));
   // The imported Wiki list is authoritative only as a cited Wiki reference, not version 9.4.2 verified.
   if(rules.length)p.rules=rules;
   const drops=(record.drops||[]).map(d=>({item:wikiItemId(d.item),chance:String(d.chance||'—'),quantity:String(d.quantity||'—'),source:record.source,sourceType:'wiki'}));
   if(drops.length){p.verifiedDrops=drops;p.drops=drops.map(d=>d.item)}
 }
 for(const [en,refs] of Object.entries(items)){
   let i=ITEMS.find(x=>x.id===wikiItemId(en));
   if(!i){i={id:wikiItemId(en),zh:WIKI_ITEM_ZH[en]||en,en,icon:'◇',texture:WIKI_ITEM_TEXTURES[en]||null,kind:'Pixelmon Wiki 掉落物',desc:'官方 Wiki 收錄的寶可夢掉落道具，請核對 9.4.2 設定。'};ITEMS.push(i)}
   i.wikiDrops=refs.filter(x=>POKEMON.some(p=>p.id===Number(x.pokemonId))).map(x=>({...x,pokemonId:Number(x.pokemonId)}));
 }
 // The global drops index can include more entries than individual species pages.
 for(const i of ITEMS){for(const d of i.wikiDrops||[]){const p=POKEMON.find(x=>x.id===d.pokemonId);if(!p)continue;p.verifiedDrops=p.verifiedDrops||[];if(!p.verifiedDrops.some(x=>x.item===i.id&&String(x.chance)===String(d.chance)&&String(x.quantity)===String(d.quantity))){p.verifiedDrops.push({item:i.id,chance:d.chance,quantity:d.quantity,source:'https://pixelmonmod.com/wiki/Drops',sourceType:'wiki'})}}}
 window.wikiLoaded=true;
 if(typeof render==='function')render();
}
const WIKI_ITEM_ZH={'Vines':'藤蔓','Twisting Vines':'扭曲藤蔓','Ender Pearl':'終界珍珠'};
async function loadWikiReference(){try{const response=await fetch('data/wiki-reference.json',{cache:'no-cache'});if(!response.ok)throw Error('HTTP '+response.status);const data=await response.json();window.wikiReferenceRaw=data;importWikiReference(data)}catch(e){console.warn('Wiki dataset unavailable',e)}}
window.loadWikiReference=loadWikiReference;
