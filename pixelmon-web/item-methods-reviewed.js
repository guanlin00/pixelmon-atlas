'use strict';
/* Selected acquisition/crafting references verified against Pixelmon Wiki item pages.
 * These are wiki-reported recipes, not independently tested against every 9.4.2
 * server/datapack. Never assign an invented 3x3 grid. */
window.atlasReviewedItemMethods={
 'poke-ball':{
  method:'合成：精靈球蓋＋石製按鈕＋金屬球底（鐵、鋁等相容球底）。也可向 NPC 商店購買，或由特殊掉落取得。',
  recipe:{ingredients:['精靈球蓋（由熟紅球果製作）','石製按鈕','相容的金屬球底'],source:'https://pixelmonmod.com/wiki/Poke_Ball',sourceStatus:'Pixelmon 官方 Wiki 個別條目；詳細材料排列請查看來源'},
  source:'https://pixelmonmod.com/wiki/Poke_Ball'
 },
 'ultra-ball':{
  method:'合成：高級球蓋＋按鈕＋鉑金球底。另可向商店購買，或透過特殊掉落取得。',
  recipe:{ingredients:['高級球蓋（由熟黑、黃色球果製作）','按鈕','鉑金球底'],source:'https://pixelmonmod.com/wiki/Ultra_Ball',sourceStatus:'Pixelmon 官方 Wiki 個別條目；詳細材料排列請查看來源'},
  source:'https://pixelmonmod.com/wiki/Ultra_Ball'
 },
 'old-rod':{
  method:'合成：木棒＋線＋精靈球。另可從部分船隻寶箱、特定頭目寶可夢掉落取得。',
  recipe:{ingredients:['木棒','線','精靈球'],source:'https://pixelmonmod.com/wiki/Old_Rod',sourceStatus:'Pixelmon 官方 Wiki 個別條目；位置排列請查看來源'},
  source:'https://pixelmonmod.com/wiki/Old_Rod'
 },
 'pc':{
  method:'可使用工作台合成，材料包括 6 個鋁錠、1 片玻璃片、1 個紅石燈及 1 個紅石粉。取得方式依伺服器規則可能不同。',
  recipe:{ingredients:['鋁錠 ×6','玻璃片 ×1','紅石燈 ×1','紅石粉 ×1'],source:'https://pixelmonmod.com/wiki/PC',sourceStatus:'Pixelmon 官方 Wiki 個別條目；位置排列請查看來源'},
  source:'https://pixelmonmod.com/wiki/PC'
 },
 'healer':{
  method:'可用 4 個鋁錠、3 個鐵錠、1 顆鑽石與 1 個染料合成；也能在寶可夢中心找到治療機。不同顏色可透過染色取得。',
  recipe:{ingredients:['鋁錠 ×4','鐵錠 ×3','鑽石 ×1','染料 ×1'],source:'https://pixelmonmod.com/wiki/Healer',sourceStatus:'Pixelmon 官方 Wiki 個別條目；位置排列與染色方式請查看來源'},
  source:'https://pixelmonmod.com/wiki/Healer'
 },
 'exp-share':{
  method:'可從部分戰利品寶箱、特殊掉落、頭目寶可夢或阿爾宙斯的掉落取得；官方 Wiki 所列舊版合成配方已移除。',
  notCraftable:true,
  source:'https://pixelmonmod.com/wiki/Exp_Share'
 }
};
window.atlasApplyReviewedItemMethods=function(items){
 let count=0;
 for(const i of items){
  if(i.minecraftGameId)continue;
  const slug=String(i.searchSlug||i.en||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const record=window.atlasReviewedItemMethods[slug];
  if(!record)continue;
  i.pixelmonMethod=record.method;
  i.pixelmonMethodSource=record.source;
  i.pixelmonDetailSource=record.source;
  i.pixelmonMethodStatus='Pixelmon 官方 Wiki 個別道具頁參考；9.4.2 與伺服器覆寫未逐一驗證';
  if(record.recipe)i.pixelmonRecipe=record.recipe;
  if(record.notCraftable){i.pixelmonRecipe=null;i.pixelmonNotCraftable=true;}
  count++;
 }
 return count;
};
