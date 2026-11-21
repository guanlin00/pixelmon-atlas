'use strict';
/* PokéAPI shiny images are artwork references, not Pixelmon availability assertions. */
(() => {
 const BASE='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
 const G=[['全部世代',1,1025],['第一代・關都',1,151],['第二代・城都',152,251],['第三代・豐緣',252,386],['第四代・神奧',387,493],['第五代・合眾',494,649],['第六代・卡洛斯',650,721],['第七代・阿羅拉',722,809],['第八代・伽勒爾',810,905],['第九代・帕底亞',906,1025]];
 const state={query:'',gen:0,limit:60},missing=new Set();
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const pad=n=>'#'+String(n).padStart(4,'0');
 const all=()=>typeof POKEMON==='undefined'?[]:[...POKEMON].filter(p=>p.id>=1&&p.id<=1025).sort((a,b)=>a.id-b.id);
 const matching=()=>{const [name,low,high]=G[state.gen],q=state.query.toLowerCase().trim();return all().filter(p=>p.id>=low&&p.id<=high&&(!q||String(p.id).includes(q)||p.zh.toLowerCase().includes(q)||p.en.toLowerCase().includes(q)))};
 function shinyImg(p){
  return '<div class="shiny-img"><img loading="lazy" decoding="async" class="shiny-asset" data-id="'+p.id+'" src="'+BASE+'other/official-artwork/shiny/'+p.id+'.png" alt="'+esc(p.zh)+'異色圖片"'+(missing.has(p.id)?' hidden':'')+'><span class="shiny-unavailable"'+(missing.has(p.id)?'':' hidden')+'>異色圖片未提供</span></div>';
 }
 function results(){
  const hits=matching();
  return '<p class="shiny-count">搜尋結果 '+hits.length+' 隻</p><div class="shiny-grid">'+hits.slice(0,state.limit).map(p=>
   '<a class="shiny-card" href="#pokemon/'+p.id+'">'+shinyImg(p)+'<small>'+pad(p.id)+'</small><strong>'+esc(p.zh)+'</strong><small>'+esc(p.en)+'</small></a>').join('')+
   '</div>'+(hits.length>state.limit?'<button class="btn quiet shiny-load-more" data-shiny-more>載入更多（'+state.limit+'/'+hits.length+'）</button>':'');
 }
 function render(){
  return '<section class="page-heading"><div class="eyebrow">Shiny / Pokédex</div><h1>✨ 異色圖鑑</h1><p>搜尋全國圖鑑 1～1025 隻寶可夢的異色外觀。點擊卡片即可查看一般與異色對照。</p></section>'+
   '<div class="shiny-controls panel"><label>搜尋寶可夢<input id="shiny-search" type="search" class="search-input" placeholder="名稱、英文名稱或圖鑑編號" value="'+esc(state.query)+'"></label>'+
   '<label>依世代搜尋<select class="select" id="shiny-gen">'+G.map((g,i)=>'<option value="'+i+'"'+(i===state.gen?' selected':'')+'>'+g[0]+'（#'+g[1]+'–#'+g[2]+'）</option>').join('')+'</select></label></div>'+
   '<div id="shiny-results">'+results()+'</div><p class="shiny-note">圖片來源：PokéAPI sprites。缺圖表示來源尚未提供該圖，不代表該寶可夢沒有異色或無法在 Pixelmon 取得。</p>';
 }
 function detail(p){
  return '<section class="shiny-detail"><h3>✨ 一般與異色外觀</h3><div class="shiny-comparison">'+
   '<div class="shiny-variant"><div class="shiny-img"><img loading="lazy" src="'+BASE+'other/official-artwork/'+p.id+'.png" alt="'+esc(p.zh)+'一般外觀"></div><strong>一般外觀</strong></div>'+
   '<div class="shiny-variant">'+shinyImg(p)+'<strong>異色外觀</strong></div></div>'+
   '<p class="shiny-note">展示的是全國圖鑑的一般形態與異色參考圖；地區形態及 Pixelmon 特殊材質需另行核對。</p></section>';
 }
 window.renderShinyDex=render;
 window.renderShinyDetail=detail;
 document.addEventListener('input',e=>{if(e.target.id==='shiny-search'){state.query=e.target.value;state.limit=60;document.getElementById('shiny-results').innerHTML=results()}});
 document.addEventListener('change',e=>{if(e.target.id==='shiny-gen'){state.gen=Number(e.target.value)||0;state.limit=60;document.getElementById('shiny-results').innerHTML=results()}});
 document.addEventListener('click',e=>{if(e.target.closest('[data-shiny-more]')){state.limit+=60;document.getElementById('shiny-results').innerHTML=results()}});
 // Fallback only to another SHINY image, never a normal-color image.
 document.addEventListener('error',e=>{
  const el=e.target;if(!(el instanceof HTMLImageElement)||!el.matches('.shiny-asset'))return;
  const id=Number(el.dataset.id);
  if(!el.dataset.retry){el.dataset.retry='yes';el.src=BASE+'shiny/'+id+'.png';return}
  missing.add(id);el.hidden=true;el.style.display='none';
  const badge=el.parentElement.querySelector('.shiny-unavailable');if(badge)badge.hidden=false;
 },true);
 const originalRender=window.render;
 if(typeof originalRender==='function')window.render=function(){
  const out=originalRender.apply(this,arguments);
  if(location.hash.split('/')[0]==='#shiny'&&(window.nationalDexImported||window.catalogFailed)){
   const app=document.getElementById('app');app.innerHTML=render();
   document.getElementById('breadcrumb').textContent='異色圖鑑';
   document.querySelectorAll('.side-nav a').forEach(a=>a.classList.toggle('active',a.dataset.route==='shiny'));
  }
  return out;
 };
 window.addEventListener('hashchange',()=>{
  if(location.hash.split('/')[0]==='#shiny'){window.render();window.scrollTo({top:0,behavior:'instant'})}
 });
 if(location.hash.split('/')[0]==='#shiny'||location.hash.split('/')[0]==='#pokemon')window.render();
})();