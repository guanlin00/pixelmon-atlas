'use strict';
/* Pixelmon Atlas v0.9.1: generation navigation, form cards with in-page acquisition details,
 * and searchable PokeAPI item index. Information from PokeAPI is not version certification.
 * Wiki-backed acquisition descriptions are explicitly distinguished from unverified forms. */
(()=>{
const GENERATIONS=[['全部世代',1,1025],['第一代・關都',1,151],['第二代・城都',152,251],['第三代・豐緣',252,386],['第四代・神奧',387,493],['第五代・合眾',494,649],['第六代・卡洛斯',650,721],['第七代・阿羅拉',722,809],['第八代・伽勒爾',810,905],['第九代・帕底亞',906,1025]];
let generation=0, formCache=new Map(), itemList=null, itemBusy=false, activeFormRecords=[];
const typeZH={normal:'一般',fire:'火',water:'水',electric:'電',grass:'草',ice:'冰',fighting:'格鬥',poison:'毒',ground:'地面',flying:'飛行',psychic:'超能力',bug:'蟲',rock:'岩石',ghost:'幽靈',dragon:'龍',dark:'惡',steel:'鋼',fairy:'妖精'};
const knownNames={'greninja':'一般甲賀忍蛙','greninja-battle-bond':'牽絆變身甲賀忍蛙','greninja-ash':'小智甲賀忍蛙','greninja-mega':'超級甲賀忍蛙','grimer':'一般臭泥','grimer-alola':'阿羅拉臭泥','muk-alola':'阿羅拉臭臭泥','decidueye':'一般狙射樹梟','decidueye-hisui':'洗翠狙射樹梟','samurott-hisui':'洗翠大劍鬼','typhlosion-hisui':'洗翠火爆獸','growlithe-hisui':'洗翠卡蒂狗','arcanine-hisui':'洗翠風速狗','raichu-alola':'阿羅拉雷丘','vulpix-alola':'阿羅拉六尾','ninetales-alola':'阿羅拉九尾','meowth-alola':'阿羅拉喵喵','meowth-galar':'伽勒爾喵喵','zigzagoon-galar':'伽勒爾蛇紋熊','wooper-paldea':'帕底亞烏波','tauros-paldea-combat-breed':'帕底亞肯泰羅（鬥戰種）'};
const WIKI='https://pixelmonmod.com/wiki/';
const descriptions={
 'greninja-battle-bond':{title:'牽絆變身特性（Battle Bond）',method:'官方 Wiki 記載須使用厲害釣竿（Super Rod），在沼澤（Swamps）或究極叢林（Ultra Jungle）類生態域釣魚，且釣餌所在水格周圍需符合至少 2 格深水的配置；符合條件後有低機率釣起牽絆變身甲賀忍蛙。牠在戰鬥中擊敗對手才會觸發形態變化。',url:WIKI+'Ash-Greninja',verified:'wiki'},
 'greninja-ash':{title:'小智甲賀忍蛙',method:'持有牽絆變身（Battle Bond）特性的甲賀忍蛙，在戰鬥中擊倒對手時可觸發變身；不是單獨的新物種。牽絆變身特性個體的取得可參考官方釣魚條件。',url:WIKI+'Ash-Greninja',verified:'wiki'},
 'decidueye-hisui':{title:'洗翠狙射樹梟取得方式',method:'官方 Wiki 記載投羽梟在黎明時升至 36 級可進化為洗翠狙射樹梟；亦記載以洗翠精靈球捕捉狙射樹梟的形態取得方式。實際是否可用須對照 Pixelmon 9.4.2／伺服器設定。',url:WIKI+'Decidueye',verified:'wiki'},
 'grimer-alola':{title:'阿羅拉臭泥取得方式',method:'阿羅拉臭泥是獨立的地區形態，毒／惡屬性，38 級可進化為阿羅拉臭臭泥。其野外生成生態域、時間與其他取得方法需查看 Pixelmon 9.4.2 形態專屬規則；不應用一般臭泥的生成表替代。',url:WIKI+'Grimer',verified:'partial'},
 'muk-alola':{title:'阿羅拉臭臭泥取得方式',method:'阿羅拉臭泥升至 38 級會進化為阿羅拉臭臭泥。其他生成及取得條件仍待版本資料核對。',url:WIKI+'Grimer',verified:'partial'},
 'greninja-mega':{title:'超級甲賀忍蛙',method:'這是 PokéAPI 收錄的對戰形態。是否在 Pixelmon 9.4.2 開放、需要什麼超級石或觸發方式，尚未核對；不能直接推定一般主系列規則適用。',url:WIKI+'Greninja',verified:'pending'}
};
const special={658:[
 {key:'greninja-zombie',name:'殭屍小智甲賀忍蛙',en:'Zombie Ash Greninja',kind:'Pixelmon 特殊材質',types:['water','dark'],method:'官方特殊材質條件：夜晚、滿月、寶可夢所在位置亮度至少 12、上方沒有方塊遮擋；滿足條件時對寶可夢使用雕刻南瓜右鍵，可轉換殭屍材質。官方頁列有一般與小智甲賀忍蛙的殭屍版本。',url:WIKI+'Special_textures',verified:'wiki'},
 {key:'greninja-alter',name:'異色特殊外觀（Alter）甲賀忍蛙',en:'Alter Greninja',kind:'Pixelmon 特殊材質',types:['water','dark'],method:'Pixelmon 特殊材質頁收錄 Alter Greninja，可於 Ultra Jungle（究極叢林）等指定環境、符合生成表條件時遇到；牽絆變身版本另列於 Alter Battle Bond Greninja 的生成表。',url:WIKI+'Special_texture',verified:'wiki'},
 {key:'greninja-creator',name:'創作者限定甲賀忍蛙',en:'Creator Greninja',kind:'Pixelmon 特殊材質',types:['water','dark'],method:'官方 Wiki 說明此特殊材質可能透過 Pixelmon 團隊活動、Discord 贈送等方式開放取得，並非一般野外生成。具體領取資格與活動有效性需依官方公告。',url:WIKI+'Greninja-Alter',verified:'wiki'},
 {key:'greninja-cursed',name:'詛咒皮膚（待核對名稱）',en:'Cursed Skin',kind:'名稱未核實',types:['water','dark'],method:'尚不能確認「詛咒皮膚」是否為官方獨立材質名稱。它可能指 Zombie 或 Alter 外觀，也可能是伺服器自訂皮膚。請以遊戲中的完整材質名稱／截圖比對，暫不提供未經確認的生成率或取得配方。',url:WIKI+'Special_textures',verified:'pending'}
]};
function make(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function route(){return (location.hash.split('/')[0]||'#home').slice(1)}
function update(){if(route()==='pokedex')drawGenerations();if(route()==='pokemon')drawForms();if(route()==='items')drawItemDirectory()}
function drawGenerations(){const root=document.querySelector('.catalog');if(!root||root.querySelector('.atlas-gen'))return;const aside=make('aside','atlas-gen');aside.append(make('h3','', '依世代尋找'),make('p','atlas-help','以全國圖鑑編號分類。'));const buttons=make('div','atlas-gen-buttons');GENERATIONS.forEach((g,i)=>{const b=make('button','atlas-gen-btn'+(generation===i?' active':''));b.type='button';b.dataset.generation=String(i);b.append(make('strong','',g[0]),make('span','',`#${g[1]}–#${g[2]}`));buttons.append(b)});aside.append(buttons);root.append(aside)}
function formName(key,isDefault){if(knownNames[key])return knownNames[key];if(isDefault)return '一般形態';const suffixes=[['-alola','阿羅拉形態'],['-galar','伽勒爾形態'],['-hisui','洗翠形態'],['-paldea','帕底亞形態'],['-mega-x','超級進化 X'],['-mega-y','超級進化 Y'],['-mega','超級進化'],['-gmax','超極巨化'],['-origin','起源形態'],['-therian','靈獸形態']];for(const [x,n] of suffixes)if(key.endsWith(x))return n;return key.replaceAll('-',' ')}
function formCard(form,index){const card=make('button','atlas-form-card');card.type='button';card.dataset.formIndex=String(index);card.setAttribute('aria-label',`查看${form.name}取得方式`);const picture=make('div','atlas-form-picture');if(form.image){const img=make('img');img.loading='lazy';img.alt=form.name;img.src=form.image;img.onerror=()=>{img.remove();picture.append(make('span','atlas-no-image','尚無已核對圖片'))};picture.append(img)}else picture.append(make('span','atlas-no-image','尚無已核對圖片'));card.append(picture,make('strong','',form.name),make('small','',form.en));card.append(make('span','atlas-form-kind',form.kind));if(form.types.length){card.append(make('div','atlas-form-types',form.types.map(t=>typeZH[t]||t).join('／')))}card.append(make('span','atlas-form-open','查看取得方式 ›'));return card}
function drawForms(){const id=Number(location.hash.split('/')[1]);const detail=document.querySelector('.detail-main');if(!id||!detail||detail.querySelector('.atlas-form-section'))return;const section=make('section','atlas-form-section');section.dataset.species=String(id);section.innerHTML='<div class="atlas-section-title"><h3>不同形態與特殊皮膚</h3><p>點擊卡片查看取得／變身方式。Wiki 參考與待核實項目分開顯示。</p></div><div id="atlasFormGrid" class="atlas-form-grid"><p class="atlas-help">正在查詢可用形態…</p></div>';detail.append(section);loadForms(id,section)}
async function loadForms(id,section){const box=section.querySelector('#atlasFormGrid');try{let varieties=formCache.get(id);if(!varieties){const response=await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}/`);if(!response.ok)throw Error(response.status);const raw=await response.json();varieties=raw.varieties||[];formCache.set(id,varieties)}const formResults=await Promise.all(varieties.slice(0,32).map(async v=>{const key=v.pokemon.name;try{const response=await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(key)}/`);if(!response.ok)throw Error(response.status);const d=await response.json();return {key,name:formName(key,v.is_default),en:key,image:d.sprites?.other?.['official-artwork']?.front_default||d.sprites?.front_default||'',types:d.types?.map(t=>t.type.name)||[],kind:v.is_default?'一般形態':'寶可夢其他形態',...((descriptions[key]||{}))}}catch{return {key,name:formName(key,v.is_default),en:key,image:'',types:[],kind:v.is_default?'一般形態':'寶可夢其他形態'}}}));if(!section.isConnected||Number(section.dataset.species)!==id)return;
// Battle Bond is an ability, not a distinct illustration. Exclude duplicate visual entry if default and Battle Bond share image.
const byKey=new Set();const filtered=[];for(const f of formResults){if(byKey.has(f.key))continue;byKey.add(f.key);if(f.key==='greninja-battle-bond'&&formResults.some(x=>x.key==='greninja-ash'))continue;if(f.key==='greninja-battle-bond'&&formResults.some(x=>x.key==='greninja'&&x.image===f.image))continue;filtered.push(f)}
const regional=filtered.filter(f=>!f.key.includes('-')||/(alola|galar|hisui|paldea|mega|ash|origin|therian|battle-bond|gmax)/.test(f.key));const skins=(special[id]||[]).map(s=>({...s,image:'',title:s.name}));activeFormRecords=[...regional,...skins];box.replaceChildren();const main=make('div','atlas-form-subheading','一般／地區／戰鬥形態');box.append(main);regional.forEach((f,i)=>box.append(formCard(f,i)));if(skins.length){box.append(make('div','atlas-form-subheading','Pixelmon 特殊外觀'));skins.forEach((s,i)=>box.append(formCard(s,regional.length+i)))}box.insertAdjacentElement('afterend',make('p','atlas-help','注意：PokéAPI 的形態不代表 Pixelmon 9.4.2 全部可取得。沒有核實的取得方式會明確標示。'))}catch(err){if(section.isConnected)box.replaceChildren(make('p','atlas-help','形態資料無法載入，請確認網路後重新開啟。'))}}
function showForm(index){const f=activeFormRecords[index];if(!f)return;let dialog=document.getElementById('atlasFormModal');if(!dialog){dialog=make('dialog','atlas-form-modal');dialog.id='atlasFormModal';document.body.append(dialog);dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()})}dialog.replaceChildren();const wrap=make('div','atlas-form-modal-body');const header=make('div','atlas-form-modal-head');header.append(make('h2','',f.name));const close=make('button','atlas-modal-close','✕');close.type='button';close.setAttribute('aria-label','關閉');close.addEventListener('click',()=>dialog.close());header.append(close);wrap.append(header,make('p','atlas-help',f.en+' · '+f.kind));if(f.image){const img=make('img','atlas-modal-art');img.src=f.image;img.alt=f.name;wrap.append(img)}wrap.append(make('h3','',f.title||'取得與變身方式'));wrap.append(make('p','atlas-method',f.method||'目前只有形態與外觀資料，尚未從 Pixelmon 9.4.2 的官方生成／進化設定核實具體取得方式。請勿直接套用主系列遊戲條件。'));const tag=make('p','atlas-form-status',f.verified==='wiki'?'資料狀態：Pixelmon 官方 Wiki 參考（9.4.2 仍須核對）':f.verified==='partial'?'資料狀態：部分官方資料已確認，生成規則待核對':'資料狀態：尚待核對 Pixelmon 9.4.2');wrap.append(tag);if(f.url&&f.url.startsWith(WIKI)){const link=make('a','atlas-wiki-link','查看 Pixelmon Wiki 說明 ↗');link.href=f.url;link.target='_blank';link.rel='noopener noreferrer';wrap.append(link)}dialog.append(wrap);if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','')}
// Official Traditional Chinese names are pre-generated from PokeAPI item_names.csv (language 4).
let atlasItemZH=null;
const atlasVanillaZH={'vines':'藤蔓','twisting-vines':'扭曲藤蔓','weeping-vines':'垂泣藤蔓','wheat':'小麥','string':'線','feather':'羽毛','leather':'皮革','rotten-flesh':'腐肉','cooked-mutton':'烤羊肉','gunpowder':'火藥','bone':'骨頭','bone-meal':'骨粉','redstone':'紅石粉','glowstone-dust':'螢石粉','slime-ball':'史萊姆球','blaze-rod':'烈焰桿','ender-pearl':'終界珍珠','iron-ingot':'鐵錠','gold-ingot':'金錠','copper-ingot':'銅錠','diamond':'鑽石','emerald':'綠寶石','sand':'沙子','flint':'燧石','coal':'煤炭','sweet-berries':'甜莓','apple':'蘋果','carrot':'胡蘿蔔','potato':'馬鈴薯','sugar':'糖','spider-eye':'蜘蛛眼','ink-sac':'墨囊','prismarine-shard':'海磷碎片','prismarine-crystals':'海磷晶體','amethyst-shard':'紫水晶碎片','quartz':'地獄石英','nether-wart':'地獄疙瘩','pumpkin':'南瓜','oak-log':'橡木原木','cobblestone':'鵝卵石','dirt':'泥土','glass':'玻璃','white-wool':'白色羊毛','bamboo':'竹子'};
const atlasItemSlug=x=>String(x||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const atlasItemName=slug=>(atlasItemZH&&atlasItemZH[slug])||atlasVanillaZH[slug]||'';
function localizeWikiItems(){
 if(!atlasItemZH)return false;
 let changed=false;
 for(const item of ITEMS){
  const slug=atlasItemSlug(item.en);
  const name=atlasItemName(slug);
  if(name&&(item.zh===item.en||item.zh===slug||!item.zh)){item.zh=name;changed=true}
  // Sprite for Pokémon-specific drops, while existing Minecraft textures keep priority.
  if(!item.texture&&!item.pokeSprite&&atlasItemZH[slug])item.pokeSprite='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/'+slug+'.png';
 }
 return changed;
}
// Merge PokéAPI's searchable item index into the same clickable catalogue as Wiki drops.
// Only catalogue items that have an actual site entry: existing Minecraft materials
// and Pixelmon Wiki drop references. PokeAPI's full item index is not a Pixelmon item list.
// Source: Pixelmon Wiki's own category index, not the complete PokéAPI catalogue.
let atlasCatalogInstalled=false;
const atlasCatalogSlug=txt=>String(txt).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function atlasInstallCatalog(data){
 if(atlasCatalogInstalled||!data||!Array.isArray(data.categories))return 0;
 const bySlug=new Map();
 for(const it of ITEMS)bySlug.set(atlasCatalogSlug(it.en),it);
 const categories=[];
 let added=0;
 data.categories.forEach((category,order)=>{
  categories.push(category.name);
  for(const entry of category.items||[]){
   const slug=entry.slug;
   let found=bySlug.get(slug);
   const translated=(atlasItemZH&&atlasItemZH[slug])||entry.zh||atlasVanillaZH[slug]||'';
   if(found){
    // Preserve the item-specific Wiki drop records and material texture.
    if(!found.pixelmonCategory)found.pixelmonCategory=category.name;
    found.pixelmonCategoryOrder=order;
    if(translated&&(found.zh===found.en||found.zh===slug||!found.zh))found.zh=translated;
    if(!found.pokeSprite&&!found.texture&&atlasItemZH?.[slug])found.pokeSprite='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/'+encodeURIComponent(slug)+'.png';
    continue;
   }
   found={
    id:'pixelmon:'+slug,searchSlug:slug,zh:translated||entry.en,
    en:entry.en,kind:category.name,pixelmonCategory:category.name,pixelmonCategoryOrder:order,
    icon:category.icon||'◇',
    desc:'Pixelmon 官方 Wiki 道具清單收錄。用途、合成配方與取得方式請依個別資料來源查證。',
    pokeSprite:atlasItemZH?.[slug]?'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/'+encodeURIComponent(slug)+'.png':null,
    wikiSource:'https://pixelmonmod.com/wiki/Items/en',
    sourceStatus:'官方 Wiki 清單收錄；尚未核對個別取得方式'
   };
   ITEMS.push(found);bySlug.set(slug,found);added++;
  }
 });
 window.atlasItemCategoryNames=categories;
 atlasCatalogInstalled=true;
 return added;
}

function atlasMergeRegistry(data){
 if(!data||!Array.isArray(data.items))return 0;
 const byName=new Map();
 for(const item of ITEMS){const key=atlasCatalogSlug(item.en);if(!byName.has(key))byName.set(key,[]);byName.get(key).push(item)}
 const cats=window.atlasItemCategoryNames||[];
 let count=0;
 for(const record of data.items){
  const slug=atlasCatalogSlug(record.name);
  const candidates=byName.get(slug)||[];
  const match=candidates.find(it=>!it.pixelmonGameId||it.pixelmonGameId===record.gameId);
  let dest=match;
  if(!dest){
   const group=record.category||'其他 Pixelmon 道具';
   const prefix='registry:'+record.gameId.replace(/[^a-z0-9]+/gi,'_');
   dest={
    id:prefix,zh:(atlasItemZH&&atlasItemZH[slug])||record.name,
    en:record.name,searchSlug:slug,
    kind:group,pixelmonCategory:group,pixelmonCategoryOrder:cats.length+5,
    desc:'Pixelmon 道具 ID 參考清單收錄；請查看詳情中的取得方式與資料來源。',
    icon:'◇',wikiSource:record.source||record.idListSource
   };
   ITEMS.push(dest);count++;
   if(!byName.has(slug))byName.set(slug,[]);
   byName.get(slug).push(dest);
  }
  const group=dest.pixelmonCategory||record.category||'其他 Pixelmon 道具';
  if(!cats.includes(group))cats.push(group);
  dest.pixelmonCategory=group;
  dest.pixelmonCategoryOrder=cats.indexOf(group);
  dest.searchSlug=slug;
  dest.pixelmonGameId=record.gameId;
  dest.pixelmonSprite=Array.isArray(record.sprite)&&record.sprite.length===2?record.sprite:null;
  dest.pixelmonMethod=record.method||'';
  dest.pixelmonMethodSource=record.methodSource||record.source||'';
  dest.pixelmonMethodStatus=record.methodStatus||'尚未核實';
  dest.pixelmonRecipe=record.recipe||null;
  dest.pixelmonDetailSource=record.source||record.idListSource;
  if(!dest.zh||dest.zh===dest.en)dest.zh=(atlasItemZH&&atlasItemZH[slug])||dest.zh||dest.en;
 }
 window.atlasItemCategoryNames=cats;
 return count;
}

function atlasMergeMinecraft(data){
 if(!data||!Array.isArray(data.items))return 0;
 let added=0;
 const cats=window.atlasItemCategoryNames||[];
 const bySlug=new Map();
 for(const i of ITEMS){
  const key=atlasCatalogSlug(i.en);
  if(!bySlug.has(key))bySlug.set(key,[]);
  bySlug.get(key).push(i);
 }
 for(const rec of data.items){
  const slug=rec.name;
  const match=(bySlug.get(slug)||[]).find(i=>
   i.minecraftGameId===rec.gameId
   ||(!i.minecraftGameId&&!i.pixelmonGameId&&!i.id.startsWith('pixelmon:')&&!i.id.startsWith('registry:'))
  );
  let dest=match;
  if(!dest){
   dest={
    id:'minecraft:'+slug,zh:rec.zh||rec.en,en:rec.en,
    kind:rec.category,pixelmonCategory:rec.category,
    icon:'▣',searchSlug:slug,
    desc:'Minecraft 原版物品；取得方式及合成配方依原版資料來源，與 Pixelmon 專屬道具分開。',
    texture:rec.texture||slug
   };
   ITEMS.push(dest);added++;
   if(!bySlug.has(slug))bySlug.set(slug,[]);
   bySlug.get(slug).push(dest);
  }
  if(!cats.includes(rec.category))cats.push(rec.category);
  dest.pixelmonCategory=rec.category;
  dest.pixelmonCategoryOrder=cats.indexOf(rec.category);
  dest.minecraftGameId=rec.gameId;
  dest.minecraftRecipe=rec.recipe||null;
  dest.minecraftMethod=rec.method||'';
  dest.minecraftMethodStatus=rec.methodStatus||'Minecraft 原版取得方法待核實';
  dest.minecraftMethodSource=rec.source;
  dest.minecraftDetailSource=rec.source;
  dest.searchSlug=slug;
  if(!dest.texture&&!dest.pixelmonSprite)dest.texture=rec.texture||slug;
  if(rec.zh)dest.zh=rec.zh;
 }
 window.atlasItemCategoryNames=cats;
 return added;
}
function drawItemDirectory(){if(!atlasCatalogInstalled&&!itemBusy)loadItems()}
async function loadItems(){
 if(itemBusy)return;itemBusy=true;
 try{
  const [namesRes,catalogRes,registryRes,minecraftRes]=await Promise.all([
   fetch('item-zh.json',{cache:'force-cache'}),
   fetch('pixelmon-item-categories.json',{cache:'no-store'}),
   fetch('pixelmon-item-index.json',{cache:'no-store'}),
   fetch('minecraft-item-index.json',{cache:'no-store'})
  ]);
  if(!catalogRes.ok)throw Error('Pixelmon Wiki catalogue HTTP '+catalogRes.status);
  if(namesRes.ok)atlasItemZH=await namesRes.json();
  localizeWikiItems();
  const source=await catalogRes.json();
  const added=atlasInstallCatalog(source);
  let registryCount=0;
  if(registryRes.ok){registryCount=atlasMergeRegistry(await registryRes.json());}
  else console.warn('Item-ID reference unavailable; Wiki categories remain available');
  let minecraftCount=0;
  if(minecraftRes.ok)minecraftCount=atlasMergeMinecraft(await minecraftRes.json());
  else console.warn('Minecraft vanilla item index unavailable');
  if(route()==='items'&&typeof atlasRefreshItemList==='function'){
   if(location.hash==='#items'&&typeof window.render==='function')window.render();
   else atlasRefreshItemList();
  }
  console.info('Pixelmon Wiki categories:',source.categories.length,'new Wiki cards:',added,'new ID-index cards:',registryCount,'new Minecraft cards:',minecraftCount);
 }catch(e){
  console.warn('Pixelmon category index not loaded; original items still available.',e);
 }finally{itemBusy=false}
}
function updateItems(){if(typeof atlasRefreshItemList==='function')atlasRefreshItemList()}
document.addEventListener('click',e=>{const genButton=e.target.closest('[data-generation]');if(genButton){generation=+genButton.dataset.generation;window.render?.();requestAnimationFrame(()=>{const target=document.querySelector('#results .results-head')||document.getElementById('results');if(target){const top=Math.max(0,window.scrollY+target.getBoundingClientRect().top-88);window.scrollTo({top,behavior:'instant'})}else window.scrollTo({top:0,behavior:'instant'})});return}const form=e.target.closest('[data-form-index]');if(form){showForm(+form.dataset.formIndex);return}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.getElementById('atlasFormModal')?.close?.()}});
const baseMatches=window.matches;if(typeof baseMatches==='function')window.matches=function(p){return (generation===0||(p.id>=GENERATIONS[generation][1]&&p.id<=GENERATIONS[generation][2]))&&baseMatches(p)};
const baseRender=window.render;if(typeof baseRender==='function')window.render=function(){const r=baseRender.apply(this,arguments);update();return r};window.addEventListener('hashchange',()=>setTimeout(update,0));
const css=make('style');css.textContent=`
.catalog:has(.atlas-gen){grid-template-columns:290px minmax(0,1fr) 205px;align-items:start}
.atlas-gen,.atlas-form-section,.atlas-item-directory{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:17px}
.atlas-gen{position:sticky;top:90px;max-height:calc(100vh - 110px);overflow:auto}.atlas-gen h3{margin:0 0 8px}.atlas-help{font-size:12px;line-height:1.8;color:var(--muted)}.atlas-gen-buttons{display:grid;gap:6px}.atlas-gen-btn{background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:9px;text-align:left;padding:9px;display:grid;gap:4px}.atlas-gen-btn span{color:var(--muted);font-size:11px}.atlas-gen-btn.active{border-color:var(--accent);color:var(--accent);background:color-mix(in srgb,var(--accent) 14%,var(--surface))}
.atlas-form-section{margin-top:16px}.atlas-section-title h3{margin:0 0 5px;font-size:19px}.atlas-section-title p{margin:0 0 16px;color:var(--muted);font-size:12px}.atlas-form-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(172px,1fr));gap:12px}.atlas-form-subheading{grid-column:1/-1;font-weight:800;color:var(--text);font-size:14px;margin:9px 0 0;padding-bottom:8px;border-bottom:1px solid var(--border)}
.atlas-form-card{font:inherit;text-align:center;color:var(--text);border:1px solid var(--border);border-radius:12px;background:var(--surface2);padding:12px;display:flex;flex-direction:column;align-items:center;gap:7px;min-width:0;transition:transform .15s,border-color .15s;cursor:pointer}.atlas-form-card:hover,.atlas-form-card:focus-visible{border-color:var(--accent);transform:translateY(-2px)}.atlas-form-card strong{font-size:13px}.atlas-form-card small{color:var(--muted);word-break:break-word}.atlas-form-picture{height:138px;width:100%;background:var(--surface);border-radius:10px;display:grid;place-items:center;overflow:hidden}.atlas-form-picture img{width:100%;height:100%;object-fit:contain}.atlas-no-image{color:var(--muted);font-size:12px}.atlas-form-kind{background:color-mix(in srgb,var(--accent) 15%,var(--surface));color:var(--accent);padding:4px 7px;border-radius:6px;font-size:11px}.atlas-form-types{color:var(--text);font-size:12px}.atlas-form-open{margin-top:auto;padding-top:10px;font-size:12px;color:var(--accent);font-weight:700}
.atlas-form-modal{width:min(560px,calc(100vw - 28px));max-height:min(85vh,760px);border:1px solid var(--border);border-radius:18px;background:var(--surface);color:var(--text);padding:0;box-shadow:0 22px 90px #0009}.atlas-form-modal::backdrop{background:#0009;backdrop-filter:blur(5px)}.atlas-form-modal-body{padding:clamp(18px,3vw,28px);overflow:auto;max-height:85vh}.atlas-form-modal-head{display:flex;align-items:start;justify-content:space-between;gap:12px}.atlas-form-modal-head h2{margin:0;font-size:22px}.atlas-modal-close{background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:9px;padding:7px 11px}.atlas-modal-art{height:160px;max-width:100%;display:block;object-fit:contain;margin:12px auto}.atlas-method{line-height:1.9;font-size:14px;white-space:pre-line}.atlas-form-status{font-size:12px;padding:12px;background:var(--surface2);border-radius:9px;color:var(--muted)}.atlas-wiki-link{color:var(--accent);text-decoration:underline;font-size:13px}
.atlas-item-directory{margin-top:24px}#atlasExtraItemQuery{width:100%;border:1px solid var(--border);background:var(--surface2);color:var(--text);padding:12px;border-radius:9px}.atlas-extra-items{display:grid;grid-template-columns:repeat(auto-fill,minmax(138px,1fr));gap:9px}.atlas-extra-item{display:flex;align-items:center;gap:8px;border:1px solid var(--border);background:var(--surface2);border-radius:9px;padding:8px;word-break:break-word;font-size:12px}.atlas-item-pic{width:36px;height:36px;display:grid;place-items:center;flex-shrink:0;background:var(--surface);border-radius:8px}.atlas-item-pic img{max-width:30px;max-height:30px;width:30px;height:30px;object-fit:contain;image-rendering:pixelated}.atlas-item-fallback{display:none;width:30px;height:30px;place-items:center;font-size:22px;color:var(--muted)}.atlas-item-labels{display:grid;gap:3px;min-width:0}.atlas-item-labels strong{font-size:12px;color:var(--text);font-weight:700}.atlas-item-labels small{font-size:10px;color:var(--muted);word-break:break-word}
.atlas-extra-item img{height:30px;width:30px;object-fit:contain;image-rendering:pixelated}
@media(max-width:1350px){.catalog:has(.atlas-gen){grid-template-columns:250px minmax(0,1fr)}.atlas-gen{grid-column:1/-1;grid-row:1;position:static;max-height:none}.atlas-gen-buttons{grid-template-columns:repeat(5,minmax(0,1fr))}}@media(max-width:900px){.catalog:has(.atlas-gen){grid-template-columns:1fr}.atlas-gen{grid-column:1;grid-row:auto}.atlas-gen-buttons{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:480px){.atlas-gen-buttons,.atlas-form-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.atlas-form-picture{height:110px}}`;
document.head.append(css);update();
})();
