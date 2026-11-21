'use strict';
/* Data sourced from PokéAPI default-form EV yields. Pixelmon overrides not verified. */
(() => {
 const names=['HP','攻擊','防禦','特攻','特防','速度'];
 const st={query:'',stat:-1,amount:0,gen:0};
 const gens=[['全部世代',1,1025],['第一代・關都',1,151],['第二代・城都',152,251],['第三代・豐緣',252,386],['第四代・神奧',387,493],['第五代・合眾',494,649],['第六代・卡洛斯',650,721],['第七代・阿羅拉',722,809],['第八代・伽勒爾',810,905],['第九代・帕底亞',906,1025]];
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const ev=id=>ATLAS_EV_YIELDS[id-1]||null;
 function reward(id){
  const data=ev(id);
  if(!data)return '<span>資料未提供</span>';
  return '<span class="ev-rewards">'+data.map((n,i)=>n?'<span class="ev-reward ev-stat-'+i+'">'+names[i]+' +'+n+'</span>':'').join('')+'</span>';
 }
 function filtered(){
  const r=gens[st.gen],q=st.query.trim().toLowerCase();
  return POKEMON.filter(p=>{
   if(p.id<r[1]||p.id>r[2])return false;
   if(q&&!String(p.id).includes(q)&&!p.zh.toLowerCase().includes(q)&&!p.en.toLowerCase().includes(q))return false;
   const values=ev(p.id);
   if(!values)return false;
   if(st.stat>=0){if(!values[st.stat])return false;if(st.amount&&values[st.stat]!==st.amount)return false}
   else if(st.amount&&values.reduce((a,b)=>a+b,0)!==st.amount)return false;
   return true;
  });
 }
 function results(){
  const rows=filtered();
  return '<p class="ev-count">搜尋結果：<strong>'+rows.length+'</strong> 隻</p><div class="ev-grid">'+rows.map(p=>
   '<a class="ev-card" href="#pokemon/'+p.id+'"><div class="ev-card-art">'+
   '<img loading="lazy" decoding="async" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'+p.id+'.png" alt="'+escape(p.zh)+'" onerror="this.hidden=true">'+
   '</div><div class="ev-card-body"><small>#'+String(p.id).padStart(4,'0')+'</small><strong>'+escape(p.zh)+'</strong>'+
   '<small>'+escape(p.en)+'</small>'+reward(p.id)+'</div></a>'
  ).join('')+'</div>';
 }
 function options(values,selected){
  return values.map(o=>'<option value="'+o[0]+'"'+(String(o[0])===String(selected)?' selected':'')+'>'+escape(o[1])+'</option>').join('');
 }
 function render(){
  return '<section class="page-heading"><div class="eyebrow">EV / Effort Values</div><h1>努力值圖鑑</h1>'+
  '<p>查詢打敗哪隻寶可夢能練哪項努力值，依能力、每次獲得點數、世代和名稱篩選。</p></section>'+
  '<section class="panel ev-controls">'+
  '<label>搜尋寶可夢<input type="search" class="search-input" id="ev-search" value="'+escape(st.query)+'" placeholder="中文、英文或圖鑑編號"></label>'+
  '<label>努力值種類<select class="select" id="ev-stat">'+options([[-1,'全部能力'],...names.map((n,i)=>[i,n])],st.stat)+'</select></label>'+
  '<label>每次獲得<select class="select" id="ev-amount">'+options([[0,'不限'],[1,'+1'],[2,'+2'],[3,'+3']],st.amount)+'</select></label>'+
  '<label>依世代搜尋<select class="select" id="ev-gen">'+options(gens.map((g,i)=>[i,g[0]]),st.gen)+'</select></label>'+
  '</section><section id="ev-results">'+results()+'</section>'+
  '<p class="ev-note">資料來源：PokéAPI 的一般形態努力值資料。這是主系列參考值，尚未逐一核對 Pixelmon 9.4.2 特殊形態及伺服器修改；不含努力值道具、寶可病毒等加成。</p>';
 }
 function detail(p){return '<section class="ev-detail"><h3>擊敗後獲得的努力值（EV）</h3>'+
  reward(p.id)+'<p class="ev-note">一般形態參考值；特殊形態或伺服器設定可能不同。<a href="#ev">打開努力值圖鑑</a></p></section>'}
 window.renderEVDex=render;
 window.renderEVDetail=detail;
 document.addEventListener('input',e=>{
  if(e.target.id==='ev-search'){st.query=e.target.value;const node=document.getElementById('ev-results');if(node)node.innerHTML=results()}
 });
 document.addEventListener('change',e=>{
  const fields={'ev-stat':'stat','ev-amount':'amount','ev-gen':'gen'};
  if(!(e.target.id in fields))return;
  st[fields[e.target.id]]=Number(e.target.value);
  const node=document.getElementById('ev-results');if(node)node.innerHTML=results();
 });
})();