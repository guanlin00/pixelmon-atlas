'use strict';
/* 25 standard Pixelmon natures. Official source: https://pixelmonmod.com/wiki/Natures
 * Chinese names checked against https://pixelmonmod.com/wiki/Natures/zh-cn
 * Each entry: traditional Chinese, English, increased stat, decreased stat. */
(() => {
 const natures=[["勤奮","Hardy",null,null],["怕寂寞","Lonely","攻擊","防禦"],["勇敢","Brave","攻擊","速度"],["固執","Adamant","攻擊","特攻"],["頑皮","Naughty","攻擊","特防"],["大膽","Bold","防禦","攻擊"],["坦率","Docile",null,null],["悠閒","Relaxed","防禦","速度"],["淘氣","Impish","防禦","特攻"],["樂天","Lax","防禦","特防"],["膽小","Timid","速度","攻擊"],["急躁","Hasty","速度","防禦"],["認真","Serious",null,null],["爽朗","Jolly","速度","特攻"],["天真","Naive","速度","特防"],["內斂","Modest","特攻","攻擊"],["慢吞吞","Mild","特攻","防禦"],["冷靜","Quiet","特攻","速度"],["害羞","Bashful",null,null],["馬虎","Rash","特攻","特防"],["溫和","Calm","特防","攻擊"],["溫順","Gentle","特防","防禦"],["自大","Sassy","特防","速度"],["慎重","Careful","特防","特攻"],["浮躁","Quirky",null,null]];
 const stats=['全部','攻擊','防禦','特攻','特防','速度','無修正'];
 const state={query:'',boost:'全部'};
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function rows(){
  const q=state.query.trim().toLowerCase();
  const found=natures.filter(n=>(!q||n[0].includes(q)||n[1].toLowerCase().includes(q))&&(state.boost==='全部'||(state.boost==='無修正'?!n[2]:n[2]===state.boost)));
  const cells=found.map(([zh,en,up,down])=>'<tr><td><strong>'+escape(zh)+'</strong><small>'+escape(en)+'</small></td><td>'+(up?'<span class="nature-up">↑ '+up+' +10%</span>':'<span class="nature-neutral">不變</span>')+'</td><td>'+(down?'<span class="nature-down">↓ '+down+' −10%</span>':'<span class="nature-neutral">不變</span>')+'</td><td>'+(up?'一項能力提高，另一項降低':'中性性格（能力無修正）')+'</td></tr>').join('');
  return '<p class="soft">符合 '+found.length+' 種性格</p><div class="nature-scroll"><table class="nature-table"><thead><tr><th>性格</th><th>提升能力</th><th>降低能力</th><th>效果</th></tr></thead><tbody>'+cells+'</tbody></table></div>'+(found.length?'':'<p class="guide">沒有符合條件的性格。</p>');
 }
 function render(){
  return '<section class="page-heading"><div><div class="eyebrow">Nature Guide</div><h1>性格表</h1><p>完整收錄 25 種寶可夢性格，查詢每種性格對能力值的影響。</p></div></section>'+
   '<section class="panel nature-guide"><div class="nature-explain"><span class="nature-up">↑ 提升 10%</span><span class="nature-down">↓ 降低 10%</span><span class="nature-neutral">— 中性不變</span></div>'+
   '<p class="guide">性格影響攻擊、防禦、特攻、特防或速度，<strong>不影響 HP</strong>。20 種性格提升一項能力 10%、降低另一項 10%；另外 5 種為中性性格，不改變能力值。</p>'+
   '<div class="nature-filters"><label>搜尋性格<input id="nature-search" class="search-input" type="search" placeholder="例如：固執 / Adamant" value="'+escape(state.query)+'"></label>'+
   '<label>依提升能力篩選<select class="select" id="nature-boost">'+stats.map(v=>'<option value="'+v+'"'+(state.boost===v?' selected':'')+'>'+v+'</option>').join('')+'</select></label></div>'+
   '<div id="nature-results">'+rows()+'</div>'+
   '<p class="guide">使用薄荷可以改變性格對能力值的修正效果，但不會改變寶可夢顯示的原始性格。實際效果可能受模組與伺服器設定影響。</p>'+
   '<p><a class="inline-link" href="https://pixelmonmod.com/wiki/Natures" target="_blank" rel="noopener noreferrer">查看 Pixelmon 官方性格資料 ↗</a></p></section>';
 }
 window.AtlasNatures={render,data:natures};
 document.addEventListener('input',event=>{
  if(event.target.id!=='nature-search')return;
  state.query=event.target.value;
  const node=document.getElementById('nature-results');if(node)node.innerHTML=rows();
 });
 document.addEventListener('change',event=>{
  if(event.target.id!=='nature-boost')return;
  state.boost=event.target.value;
  const node=document.getElementById('nature-results');if(node)node.innerHTML=rows();
 });
})();
