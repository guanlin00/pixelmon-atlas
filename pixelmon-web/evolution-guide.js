'use strict';
/* Evolutions in Pixelmon Atlas. Core family links come from National Dex.
 * Most method labels are PokeAPI main-series references and may need Pixelmon verification.
 * Eevee's eight methods are cross-checked against Pixelmon Wiki. */
(() => {
 const lookup=new Map(ATLAS_EVOLUTION_CONDITIONS.map(([id,label,category,official,source])=>[id,{label,category,official:!!official,source:source||null}]));
 const categories=[['all','全部'],['level','等級'],['item','進化道具'],['trade','交換'],['friendship','親密度'],['time','時間'],['special','特殊條件']];
 const state={query:'',category:'all'};
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const label=id=>lookup.get(+id)?.label||'未收錄此形態的獨立進化條件';
 const pokemon=id=>POKEMON.find(p=>p.id===+id);
 function pairs(){
  const q=state.query.trim().toLowerCase();
  return POKEMON.filter(p=>{
   if(!p.evolvesFrom)return false;
   const prev=pokemon(p.evolvesFrom),entry=lookup.get(p.id);
   if(state.category!=='all'&&entry?.category!==state.category)return false;
   if(q&&!String(p.id).includes(q)&&!String(prev?.id||'').includes(q)&&![p.zh,p.en,prev?.zh,prev?.en,entry?.label].some(v=>(v||'').toLowerCase().includes(q)))return false;
   return true;
  });
 }
 const sprites=id=>'<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'+id+'.png" alt="" loading="lazy" decoding="async">';
 function tile(p){
  const prev=pokemon(p.evolvesFrom),x=lookup.get(p.id);
  return '<article class="atlas-evo-tile"><div class="atlas-evo-pair">'+
   '<a href="#pokemon/'+prev.id+'">'+sprites(prev.id)+'<span>'+esc(prev.zh)+'</span></a><span class="atlas-evo-arrow">→</span>'+
   '<a href="#pokemon/'+p.id+'">'+sprites(p.id)+'<span>'+esc(p.zh)+'</span></a>'+
   '</div><strong>'+esc(label(p.id))+'</strong>'+
   '<small>'+(x?.official?'已對照 Pixelmon 官方 Wiki':'主系列資料參考（可能與 Pixelmon 版本不同）')+'</small>'+(x?.source?'<a class="atlas-evo-source" href="'+esc(x.source)+'" target="_blank" rel="noopener noreferrer">查看進化條件來源 ↗</a>':'')+'</article>';
 }
 function entries(){
  const list=pairs();
  return '<p class="soft atlas-evo-count">符合 '+list.length+' 種進化結果</p>'+
   (list.length?'<div class="atlas-evo-grid">'+list.map(tile).join('')+'</div>':
    '<div class="empty"><h3>沒有符合條件的進化資料</h3><p>請更換關鍵字或搜尋種類。</p></div>');
 }
 function render(){
  return '<section class="page-heading"><div><div class="eyebrow">Evolution Guide</div><h1>進化條件</h1>'+
  '<p>查寶可夢的進化分支、進化石、等級、交換、親密度及特殊條件。點擊圖片可開啟寶可夢詳細資料。</p></div></section>'+
  '<section class="panel atlas-evo-search"><input class="search-input" type="search" id="evolution-query" value="'+esc(state.query)+'" placeholder="搜尋伊布、皮卡丘、進化石、等級…">'+
  '<div class="atlas-evo-category">'+categories.map(([id,name])=>'<button type="button" class="chip '+(state.category===id?'active':'')+'" data-evolution-category="'+id+'">'+name+'</button>').join('')+'</div></section>'+
  '<div id="evolution-results">'+entries()+'</div>'+
  '<p class="atlas-info-notice">進化關係與尚未經官方 Wiki 逐項確認的普通條件以 PokéAPI 主系列資料作為參考；有 Pixelmon Wiki 個別證據的特殊進化、地區形態及伊布分支會標出來源。若使用自訂伺服器，實際進化規則可能不同。<a href="https://pixelmonmod.com/wiki/Eevee" target="_blank" rel="noopener">查看伊布 Wiki 來源</a></p>';
 }
 window.AtlasEvolution={render,label,lookup};
 document.addEventListener('input',e=>{
  if(e.target.id!=='evolution-query')return;
  state.query=e.target.value;
  const target=document.getElementById('evolution-results');
  if(target)target.innerHTML=entries();
 });
 document.addEventListener('click',e=>{
  const b=e.target.closest('[data-evolution-category]');
  if(!b)return;
  state.category=b.dataset.evolutionCategory;
  const target=document.getElementById('evolution-results');
  if(target)target.innerHTML=entries();
  document.querySelectorAll('[data-evolution-category]').forEach(node=>node.classList.toggle('active',node.dataset.evolutionCategory===state.category));
 });
})();