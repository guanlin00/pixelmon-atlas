'use strict';
/* Local, no-account Pokédex bookmarks. Stored as National Dex IDs. */
(() => {
 const KEY='pixelmon-atlas-favorites-v1';
 const MAX=1025;
 let favorites=new Set();
 let search='';
 let storageAvailable=true;
 try{
  const raw=JSON.parse(localStorage.getItem(KEY)||'[]');
  if(Array.isArray(raw))favorites=new Set(raw.map(Number).filter(n=>Number.isInteger(n)&&n>=1&&n<=MAX));
 }catch(e){storageAvailable=false;console.warn('Favorites storage unavailable:',e)}
 const saved=id=>favorites.has(Number(id));
 const button=id=>'<button type="button" class="atlas-favorite-btn'+(saved(id)?' is-favorite':'')+
  '" data-favorite="'+Number(id)+'" aria-label="'+(saved(id)?'取消收藏':'加入收藏')+
  '" aria-pressed="'+saved(id)+'" title="'+(saved(id)?'取消收藏':'加入收藏')+'">'+(saved(id)?'★':'☆')+'</button>';
 const store=()=>{
  try{localStorage.setItem(KEY,JSON.stringify([...favorites].sort((a,b)=>a-b)));storageAvailable=true}
  catch(e){storageAvailable=false;console.warn('Cannot persist favorites:',e)}
 };
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function rows(){
  if(typeof POKEMON==='undefined')return [];
  const q=search.toLowerCase().trim();
  return POKEMON.filter(p=>favorites.has(p.id)&&(!q||String(p.id).includes(q)||p.zh.toLowerCase().includes(q)||p.en.toLowerCase().includes(q))).sort((a,b)=>a.id-b.id);
 }
 function list(){
  const results=rows();
  return '<div class="favorites-results-head">顯示 <strong>'+results.length+'</strong> 隻收藏的寶可夢</div>'+
   (results.length?'<div class="cards atlas-favorite-cards">'+results.map(card).join('')+'</div>':
    '<div class="empty"><h3>'+(favorites.size?'沒有符合搜尋條件的收藏':'還沒有收藏的寶可夢')+'</h3><p>在寶可夢圖鑑的卡片上點擊 ☆，即可將牠加入這裡。</p><a class="btn primary" href="#pokedex">前往寶可夢圖鑑</a></div>');
 }
 function render(){
  return '<section class="page-heading"><div><div class="eyebrow">Favorites / Bookmarks</div><h1>★ 我的收藏</h1>'+
   '<p>點擊寶可夢卡片右上角的 ☆ 收藏，變成 ★ 就代表成功；再次點擊即可取消。</p></div></section>'+
   '<div class="favorites-toolbar"><label for="favorites-search">搜尋已收藏的寶可夢</label>'+
   '<input id="favorites-search" class="search-input" type="search" value="'+esc(search)+'" placeholder="搜尋中文名、英文名或圖鑑編號">'+
   '<span class="soft">已收藏 '+favorites.size+' 隻</span></div>'+
   '<div id="favorites-results">'+list()+'</div>'+
   '<p class="favorites-storage-note">收藏儲存在這個瀏覽器內。關閉網站或重新整理不會清除；更換裝置、清除網站資料或使用無痕模式可能無法保留。</p>'+
   (!storageAvailable?'<p class="favorites-storage-warning">目前瀏覽器未允許儲存收藏，重新整理後可能不會保留。</p>':'');
 }
 function refreshButtons(){
  document.querySelectorAll('[data-favorite]').forEach(el=>{
   const active=saved(el.dataset.favorite);
   el.classList.toggle('is-favorite',active);
   el.textContent=active?'★':'☆';
   el.setAttribute('aria-pressed',String(active));
   el.setAttribute('aria-label',active?'取消收藏':'加入收藏');
   el.title=active?'取消收藏':'加入收藏';
  });
 }
 function update(id){
  const n=Number(id);
  if(!Number.isInteger(n)||n<1||n>MAX)return;
  const active=!saved(n);
  if(active)favorites.add(n);else favorites.delete(n);
  store();
  if(location.hash==='#favorites'){
   const container=document.getElementById('favorites-results');
   if(container)container.innerHTML=list();
   const count=document.querySelector('.favorites-toolbar .soft');
   if(count)count.textContent='已收藏 '+favorites.size+' 隻';
  }else refreshButtons();
 }
 window.AtlasFavorites={button,render,has:saved,update,count:()=>favorites.size};
 document.addEventListener('click',e=>{
  const target=e.target.closest('[data-favorite]');
  if(!target)return;
  // Star button sits inside a clickable Pokédex card. Never open its detail
  // page when only toggling the bookmark.
  e.preventDefault();e.stopImmediatePropagation();
  update(target.dataset.favorite);
 });
 document.addEventListener('keydown',e=>{
  if(!e.target.matches('[data-favorite]'))return;
  e.stopPropagation();
 });
 document.addEventListener('input',e=>{
  if(e.target.id!=='favorites-search')return;
  search=e.target.value;
  const box=document.getElementById('favorites-results');
  if(box)box.innerHTML=list();
 });
})();