'use strict';
/* Pixelmon Atlas: explicit Traditional Chinese UI localization for Wiki spawn tables.
 * This is a presentation layer. It never modifies the original wiki-reference.json.
 * Unknown biome/condition terms are visibly flagged rather than silently translated incorrectly.
 */
(() => {
 const biome = {
  'Mountainous':'山岳地帶','Volcanic':'火山地帶','Eroded Badlands':'侵蝕惡地','Ultra Crater':'究極隕石坑',
  'Birches':'樺木林類','Forests':'森林類','Ultra Forest':'究極森林','Crag Gardens':'岩壁花園',
  'Arid':'乾燥地帶','Plains':'平原類','Taigas':'針葉林類','Mesas':'惡地類','Evil':'陰暗地帶',
  'Swamps':'沼澤類','Jungles':'叢林類','Savannas':'莽原類','Oceans':'海洋類','Rivers':'河流類',
  'Beaches':'海灘類','Hills':'丘陵類','Mountains':'山岳類','Cold':'寒冷地帶','Freezing':'冰凍地帶',
  'Snowy':'積雪地帶','Ice Plains':'冰原','Desert':'沙漠','Desert Hills':'沙漠丘陵',
  'Forest':'森林','Flower Forest':'繁花森林','Birch Forest':'樺木森林','Dark Forest':'黑森林',
  'Jungle':'叢林','Bamboo Jungle':'竹林','Sparse Jungle':'稀疏叢林','Taiga':'針葉林',
  'Old Growth Pine Taiga':'原始松木針葉林','Old Growth Spruce Taiga':'原始雲杉針葉林',
  'Old Growth Birch Forest':'原始樺木森林','Snowy Taiga':'積雪針葉林','Snowy Plains':'雪原',
  'Swamp':'沼澤','Mangrove Swamp':'紅樹林沼澤','Badlands':'惡地','Wooded Badlands':'疏林惡地',
  'Ocean':'海洋','Deep Ocean':'深海','Warm Ocean':'溫暖海洋','Lukewarm Ocean':'溫海洋',
  'Cold Ocean':'冷海洋','Frozen Ocean':'冰凍海洋','Deep Frozen Ocean':'深層冰凍海洋',
  'River':'河流','Frozen River':'冰凍河流','Beach':'海灘','Stony Shore':'石岸',
  'Stony Peaks':'裸岩山峰','Jagged Peaks':'尖峭山峰','Frozen Peaks':'冰封山峰',
  'Meadow':'草甸','Cherry Grove':'櫻花樹林','Grove':'雪林','Windswept Hills':'風襲丘陵',
  'Sunflower Plains':'向日葵平原','Mushroom Fields':'蘑菇地','Dripstone Caves':'鐘乳石洞窟',
  'Lush Caves':'繁茂洞窟','Deep Dark':'深淵','The End':'終界','End':'終界',
  'End Highlands':'終界高地','End Midlands':'終界中地','End Barrens':'終界荒地',
  'Small End Islands':'終界小島','Nether Wastes':'地獄荒原','Crimson Forest':'緋紅森林',
  'Warped Forest':'扭曲森林','Soul Sand Valley':'靈魂砂谷','Basalt Deltas':'玄武岩三角洲',
  'Ultra Desert':'究極沙漠','Ultra Deep Sea':'究極深海','Ultra Jungle':'究極叢林',
  'Ultra Space':'究極空間','Ultra Plant':'究極植物','Ultra Forest':'究極森林',
  'Lush Red Desert':'繁茂紅沙漠','Lush Desert':'繁茂沙漠','Mojave Desert':'莫哈維沙漠',
  'DesertHills':'沙漠丘陵','Roofed Forest':'黑森林','Mega Taiga':'巨木針葉林',
  'Extreme Hills':'高山','Mesa':'惡地','Snowy Slopes':'積雪山坡','Windswept Gravelly Hills':'風襲礫石丘陵','Windswept Savanna':'風襲莽原','Savanna Plateau':'莽原高地','Savanna':'莽原','Deep Cold Ocean':'寒冷深海','Deep Lukewarm Ocean':'溫暖深海','Snowy Beach':'積雪海灘','Lakes':'湖泊類','Plains (Category)':'平原類','Ice Spikes':'冰刺平原','Windswept Forest':'風襲森林','Deep Warm Ocean':'溫暖深海','Any':'不限','None':'無限制'
 };
 const place = {
  'Land':'陸地','Air':'空中','Water':'水中','Underground':'地下','Tree Top':'樹頂',
  'Tree Tops':'樹頂','Surface Water':'水面','Water Surface':'水面','Seafloor':'海床',
  'Underwater':'水下','Lava':'熔岩中','Fishing':'釣魚','Forage':'野外採集',
  'Sweet Scent':'甜甜香氣','Headbutt':'撞樹','Rock Smash':'碎岩','Rock smash':'碎岩',
  'Indoors':'室內','Lava Floor':'熔岩表面','Underground Water':'地下水域','Cave':'洞窟','Caves':'洞窟','Manmade':'人造區域','Treetop':'樹冠','Any':'不限'
 };
 const rarity = {
  'Common':'常見','Uncommon':'不常見','Rare':'稀有','Ultra Rare':'極稀有',
  'Legendary':'傳說級','Very Rare':'非常稀有','Extremely Rare':'極度稀有','Any':'不限'
 };
 const conditions = {
  'Clear Weather':'晴朗天氣','Clear':'晴朗','Rain':'下雨','Raining':'下雨',
  'Storm':'雷雨','Thunderstorm':'雷雨','Thunder':'雷雨','Snow':'下雪','Snowing':'下雪',
  'No Rain':'無雨','Rainy Weather':'雨天','Clear weather':'晴朗天氣',
  'Night':'夜晚','Day':'白天','Morning':'上午','Midday':'正午',
  'Afternoon':'下午','Dusk':'黃昏','Dawn':'黎明','Midnight':'午夜',
  'Full Moon':'滿月','New Moon':'新月','Underwater':'水下',
  'No Special Conditions':'無特殊條件','Any':'不限'
 };
 const blank = new Set(['—','-','--','', 'N/A']);
 const logMissing = new Set();
 function normalized(v){return v.replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim()}
 function translatePhrase(raw,dict,{compound=false}={}){
  const t=normalized(raw);if(blank.has(t))return '無特殊限制';
  if(dict[t])return `${dict[t]}（${t}）`;
  if(/^權重\s*\d+(?:\.\d+)?$/.test(t))return `${t}（非百分比）`;
  if(compound && /[,;/]/.test(t)) return t.split(/\s*[,;/]\s*/).filter(Boolean).map(x=>translatePhrase(x,dict)).join('、');
  if(compound && /\s+or\s+/i.test(t))return t.split(/\s+or\s+/i).map(x=>translatePhrase(x,dict)).join(' 或 ');
  // Preserve incoming bilingual text if a recognized English term is bracketed.
  const inParen=t.match(/^(.+?)\s*[（(]([^()（）]+)[）)]$/);
  if(inParen){const en=normalized(inParen[2]);if(dict[en])return `${dict[en]}（${en}）`;if(/[\u3400-\u9fff]/.test(inParen[1]))return t}
  logMissing.add(t);
  return `待翻譯（${t}）`;
 }
 function translateCondition(raw){const t=normalized(raw);if(blank.has(t))return '無特殊條件';
  if(conditions[t])return `${conditions[t]}（${t}）`;
  if(/[,;/]|\s+and\s+|\s+or\s+/i.test(t)){
   const sep=t.match(/\s+and\s+/i)?/\s+and\s+/i:t.match(/\s+or\s+/i)?/\s+or\s+/i:/\s*[,;/]\s*/;
   const join=t.match(/\s+and\s+/i)?' 且 ':t.match(/\s+or\s+/i)?' 或 ':'、';
   return t.split(sep).map(x=>translateCondition(x)).join(join);
  }
  if(/[\u3400-\u9fff]/.test(t))return t;
  logMissing.add(t);return `待翻譯（${t}）`;
 }
 const converters=[v=>translatePhrase(v,biome),null,null,v=>translatePhrase(v,place,{compound:true}),translateCondition,v=>translatePhrase(v,rarity)];
 let scheduled=false;
 function apply(){scheduled=false;
  document.querySelectorAll('.spawn-table tbody tr').forEach(row=>{
   const cells=row.querySelectorAll('td');if(cells.length<6)return;
   for(let i of [0,3,4,5]){
    const cell=cells[i];if(cell.dataset.atlasOriginal===undefined)cell.dataset.atlasOriginal=normalized(cell.textContent);
    const val=converters[i](cell.dataset.atlasOriginal);
    if(cell.textContent!==val)cell.textContent=val;
   }
  });
  window.pixelmonUntranslatedTerms=[...logMissing];
 }
 const observer=new MutationObserver(()=>{if(!scheduled){scheduled=true;queueMicrotask(apply)}});
 observer.observe(document.querySelector('#app')||document.body,{childList:true,subtree:true});
 apply();
 window.pixelmonLocalization={translateBiome:x=>translatePhrase(x,biome),translateLocation:x=>translatePhrase(x,place),translateCondition,translateRarity:x=>translatePhrase(x,rarity),missing:()=>[...logMissing]};
})();
