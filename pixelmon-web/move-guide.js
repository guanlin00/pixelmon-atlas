'use strict';
/* Searchable basic move encyclopedia based on PokéAPI moves.csv.
 * Pixelmon-specific learnsets have NOT been verified; direct Wiki entry is supplied.
 * No invented TM numbers or compatibility tables. */
(() => {
 const names={normal:'一般',fire:'火',water:'水',grass:'草',electric:'電',ice:'冰',fighting:'格鬥',poison:'毒',ground:'地面',flying:'飛行',psychic:'超能力',bug:'蟲',rock:'岩石',ghost:'幽靈',dragon:'龍',dark:'惡',steel:'鋼',fairy:'妖精'};
 const categories={1:'變化',2:'物理',3:'特殊'};
 const types=Object.keys(names);
 const state={query:'',type:'all',category:'all'};
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const catalog=typeof ATLAS_MOVE_DATA!=='undefined'?ATLAS_MOVE_DATA:[];
 const byId=new Map(catalog.map(row=>[row[0],row]));
 const paldeaTMByMove=new Map((typeof ATLAS_PALDEA_TMS!=='undefined'?ATLAS_PALDEA_TMS:[]).map(([tm,id])=>[id,'TM'+String(tm).padStart(3,'0')]));
 const paldeaTM=m=>paldeaTMByMove.get(m[0])||'—';
 const entries=()=>catalog.filter(m=>{
  const q=state.query.trim().toLowerCase();
  return (!q||m[1].toLowerCase().includes(q)||m[2].toLowerCase().includes(q)||String(m[0])===q||paldeaTM(m).toLowerCase().replace(/\s+/g,'')===q.replace(/\s+/g,'')||paldeaTM(m).toLowerCase().replace(/\s+/g,'')==='tm'+q.replace(/^tm/i,'').trim().padStart(3,'0')||('帕底亞'+paldeaTM(m)).toLowerCase().replace(/\s+/g,'')===q.replace(/\s+/g,''))&&
   (state.type==='all'||m[3]===state.type)&&(state.category==='all'||String(m[4])===state.category);
 });
 const value=n=>n==null?'—':n;
 function row(m){
  return '<tr><td><strong>'+esc(m[1])+'</strong><small>'+esc(m[2])+'</small></td>'+
  '<td><span class="atlas-move-type atlas-move-'+m[3]+'">'+(names[m[3]]||m[3])+'</span></td>'+
  '<td>'+(categories[m[4]]||'—')+'</td><td>'+value(m[5])+'</td><td>'+value(m[6])+'</td><td>'+value(m[7])+'</td>'+
  '<td>'+paldeaTM(m)+'</td><td><a class="inline-link" href="#moves/'+m[0]+'">詳情</a></td></tr>';
 }
 function result(){
  const list=entries();
  return '<p class="soft">符合 '+list.length+' 個招式</p><div class="atlas-move-scroll"><table class="atlas-move-table"><thead><tr>'+
  '<th>招式名稱</th><th>屬性</th><th>分類</th><th>威力</th><th>命中</th><th>PP</th><th>帕底亞 TM</th><th></th>'+
  '</tr></thead><tbody>'+list.map(row).join('')+'</tbody></table></div>';
 }
 function options(list,selected){
  return list.map(([id,name])=>'<option value="'+id+'"'+(String(id)===String(selected)?' selected':'')+'>'+esc(name)+'</option>').join('');
 }
 function render(){
  return '<section class="page-heading"><div><div class="eyebrow">Move Encyclopedia</div><h1>招式學習圖鑑</h1>'+
  '<p>搜尋招式中文／英文名稱或帕底亞 TM 編號，並查看屬性、分類、威力、命中與 PP。各寶可夢的 Pixelmon 學習條件將以 Wiki 為準。</p></div></section>'+
  '<div class="panel atlas-move-filters"><label>搜尋招式<input id="move-query" class="search-input" type="search" placeholder="例：冰凍光束 / Ice Beam / TM 135" value="'+esc(state.query)+'"></label>'+
  '<label>屬性<select class="select" id="move-type">'+options([['all','所有屬性'],...types.map(t=>[t,names[t]])],state.type)+'</select></label>'+
  '<label>分類<select class="select" id="move-category">'+options([['all','全部分類'],...Object.entries(categories)],state.category)+'</select></label></div>'+
  '<div id="move-results">'+result()+'</div>'+
  '<p class="atlas-info-notice">招式名稱與基本數值參考 PokéAPI 主系列資料，未保證完全對應 Pixelmon 9.4.2；帕底亞 TM 編號依 Pixelmon Wiki 對照，不代表所有寶可夢皆可學；目前沒有已完整核實的 1,025 隻寶可夢專屬學習清單，請先透過各寶可夢的官方 Wiki 查看升級、TM／TR、遺傳與教學招式。不會推測相容性。</p>';
 }
 function detail(id){
  const m=byId.get(+id);if(!m)return '<section class="page-heading"><h1>找不到這個招式</h1></section>';
  return '<div class="back"><a class="btn quiet" href="#moves">← 返回招式圖鑑</a></div>'+
  '<section class="detail-main atlas-move-detail"><div class="eyebrow">Move #'+m[0]+'</div><h1>'+esc(m[1])+'</h1><p>'+esc(m[2])+'</p>'+
  '<div class="atlas-move-facts"><span>屬性：'+(names[m[3]]||'—')+'</span><span>分類：'+(categories[m[4]]||'—')+
  '</span><span>威力：'+value(m[5])+'</span><span>命中率：'+value(m[6])+'</span><span>PP：'+value(m[7])+
  '</span><span>優先度：'+value(m[8])+'</span></div>'+
  '<h3>帕底亞招式學習器</h3><p>'+(paldeaTM(m)==='—'?'本招式沒有帕底亞 TM 編號。':'帕底亞 '+paldeaTM(m)+'（以 Pixelmon Wiki 列出的 Paldea-TM 為準）。')+'</p><h3>招式學習條件</h3><p>此招式的 Pixelmon 學習寶可夢清單尚未核實，暫不標示哪些寶可夢能學。請依官方 Wiki 核對不同版本與招式機／招式教學資料。</p>'+
  '<a class="inline-link" href="https://pixelmonmod.com/wiki/Category:Moves" target="_blank" rel="noopener noreferrer">查看 Pixelmon 官方招式資料 ↗</a></section>';
 }
 function pokemon(p){
  const name=encodeURIComponent(p.en.replace(/ /g,'_'));
  return '<section class="atlas-pokemon-moves"><h3>招式學習資料</h3>'+
  '<p>可前往 Pixelmon Wiki 查看 '+esc(p.zh)+' 的升級、招式機、教學與遺傳招式。尚未核實本版本的專屬學習清單，因此不會把其他遊戲版本的可學招式誤列為 Pixelmon 9.4.2。</p>'+
  '<div class="atlas-move-links"><a class="btn quiet" href="#moves">搜尋全部招式</a>'+
  '<a class="btn quiet" href="https://pixelmonmod.com/wiki/'+name+'" target="_blank" rel="noopener noreferrer">查看 '+esc(p.en)+' 官方 Wiki ↗</a></div></section>';
 }
 window.AtlasMoves={render,detail,pokemon,byId};
 document.addEventListener('input',e=>{
  if(e.target.id!=='move-query')return;
  state.query=e.target.value;
  const box=document.getElementById('move-results');if(box)box.innerHTML=result();
 });
 document.addEventListener('change',e=>{
  if(e.target.id==='move-type')state.type=e.target.value;
  else if(e.target.id==='move-category')state.category=e.target.value;
  else return;
  const box=document.getElementById('move-results');if(box)box.innerHTML=result();
 });
})();