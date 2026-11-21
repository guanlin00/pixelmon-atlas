'use strict';
/* Pixelmon Atlas attack type matchup page: standard 18-type chart.
 * Row = attack type, column = defense type. Dual defenses multiply.
 * Does not account for abilities, items, weather, inverse battles or moves with overrides.
 */
(() => {
  const TYPES = [
    ['normal','一般','Normal','#A8A77A'], ['fire','火','Fire','#EE8130'],
    ['water','水','Water','#6390F0'], ['electric','電','Electric','#F7D02C'],
    ['grass','草','Grass','#7AC74C'], ['ice','冰','Ice','#96D9D6'],
    ['fighting','格鬥','Fighting','#C22E28'], ['poison','毒','Poison','#A33EA1'],
    ['ground','地面','Ground','#E2BF65'], ['flying','飛行','Flying','#A98FF3'],
    ['psychic','超能力','Psychic','#F95587'], ['bug','蟲','Bug','#A6B91A'],
    ['rock','岩石','Rock','#B6A136'], ['ghost','幽靈','Ghost','#735797'],
    ['dragon','龍','Dragon','#6F35FC'], ['dark','惡','Dark','#705746'],
    ['steel','鋼','Steel','#B7B7CE'], ['fairy','妖精','Fairy','#D685AD']
  ];
  const RULES = {
    normal:   { half:['rock','steel'], zero:['ghost'] },
    fire:     { twice:['grass','ice','bug','steel'], half:['fire','water','rock','dragon'] },
    water:    { twice:['fire','ground','rock'], half:['water','grass','dragon'] },
    electric: { twice:['water','flying'], half:['electric','grass','dragon'], zero:['ground'] },
    grass:    { twice:['water','ground','rock'], half:['fire','grass','poison','flying','bug','dragon','steel'] },
    ice:      { twice:['grass','ground','flying','dragon'], half:['fire','water','ice','steel'] },
    fighting: { twice:['normal','ice','rock','dark','steel'], half:['poison','flying','psychic','bug','fairy'], zero:['ghost'] },
    poison:   { twice:['grass','fairy'], half:['poison','ground','rock','ghost'], zero:['steel'] },
    ground:   { twice:['fire','electric','poison','rock','steel'], half:['grass','bug'], zero:['flying'] },
    flying:   { twice:['grass','fighting','bug'], half:['electric','rock','steel'] },
    psychic:  { twice:['fighting','poison'], half:['psychic','steel'], zero:['dark'] },
    bug:      { twice:['grass','psychic','dark'], half:['fire','fighting','poison','flying','ghost','steel','fairy'] },
    rock:     { twice:['fire','ice','flying','bug'], half:['fighting','ground','steel'] },
    ghost:    { twice:['psychic','ghost'], half:['dark'], zero:['normal'] },
    dragon:   { twice:['dragon'], half:['steel'], zero:['fairy'] },
    dark:     { twice:['psychic','ghost'], half:['fighting','dark','fairy'] },
    steel:    { twice:['ice','rock','fairy'], half:['fire','water','electric','steel'] },
    fairy:    { twice:['fighting','dragon','dark'], half:['fire','poison','steel'] }
  };
  const typeLookup = new Map(TYPES.map(t=>[t[0],t]));
  function multiplier(attack,defense){const r=RULES[attack]||{};return r.zero?.includes(defense)?0:r.twice?.includes(defense)?2:r.half?.includes(defense)?.5:1;}
  function defending(attack,first,second){return multiplier(attack,first)*(second?multiplier(attack,second):1)}
  function label(v){return v===.25?'¼×':v===.5?'½×':v+'×'}
  function category(v){return v===0?'immune':v<1?'resist':v>1?'weak':'neutral'}
  const state={primary:'grass',secondary:'poison',move:'fire'};
  function chip(t,showEnglish=true){return `<span class="tc-chip" style="--tc-color:${t[3]}">${t[1]}${showEnglish?` <small>${t[2]}</small>`:''}</span>`}
  function optionList(selected,exclude='',allowNone=false){return `${allowNone?'<option value="">無（單屬性）</option>':''}${TYPES.filter(t=>t[0]!==exclude).map(t=>`<option value="${t[0]}" ${selected===t[0]?'selected':''}>${t[1]}（${t[2]}）</option>`).join('')}`}
  function results(){
    const buckets={4:[],2:[],1:[],.5:[],.25:[],0:[]};
    for(const t of TYPES){buckets[defending(t[0],state.primary,state.secondary)].push(t)}
    const groups=[['4','4× 特別弱點'],['2','2× 弱點'],['1','1× 一般傷害'],['0.5','½× 抗性'],['0.25','¼× 強抗性'],['0','0× 免疫']];
    return `<div class="tc-summary">${groups.map(([v,title])=>`<article class="tc-group tc-${category(+v)}"><header><strong>${title}</strong><span>${buckets[+v].length} 種</span></header><div class="tc-chipwrap">${buckets[+v].length?buckets[+v].map(t=>chip(t,false)).join(''):'<span class="tc-empty">無</span>'}</div></article>`).join('')}</div>`;
  }
  function chart(){return `<div class="tc-scroll" tabindex="0" aria-label="屬性相剋完整表格，可左右捲動"><table class="tc-matrix"><thead><tr><th class="tc-corner">攻擊 ↓<br>防禦 →</th>${TYPES.map(t=>`<th title="${t[1]}（${t[2]}）" style="--tc-color:${t[3]}"><span>${t[1]}</span></th>`).join('')}</tr></thead><tbody>${TYPES.map(at=>`<tr><th style="--tc-color:${at[3]}">${at[1]}</th>${TYPES.map(dt=>{const value=multiplier(at[0],dt[0]);return `<td class="tc-cell tc-${category(value)}" title="${at[1]}攻擊 ${dt[1]}：${label(value)}">${label(value)}</td>`}).join('')}</tr>`).join('')}</tbody></table></div>`}
  function contents(){
    return `<section class="page-heading"><div><div class="eyebrow">Battle / Type Effectiveness</div><h1>屬性相剋表</h1><p>快速查看 18 種屬性攻防倍率，或組合兩種防禦屬性計算弱點與抗性。</p></div></section>
      <div class="tc-legend"><span class="tc-weak">2×／4× 效果絕佳</span><span class="tc-neutral">1× 一般</span><span class="tc-resist">½×／¼× 效果不好</span><span class="tc-immune">0× 沒有效果</span></div>
      <section class="tc-panel"><div class="tc-titleline"><h2>雙屬性弱點計算器</h2><p>先選擇防守方的屬性</p></div>
        <div class="tc-selectors"><label>第一屬性<select id="tc-primary">${optionList(state.primary)}</select></label><label>第二屬性<select id="tc-secondary">${optionList(state.secondary,state.primary,true)}</select></label></div>
        <div class="tc-selected">目前防禦屬性：${chip(typeLookup.get(state.primary))}${state.secondary?chip(typeLookup.get(state.secondary)):'<span class="tc-sub">單屬性</span>'}</div>
        ${results()}
      </section>
      <section class="tc-panel"><div class="tc-titleline"><h2>招式攻擊倍率</h2><p>依照攻擊招式的屬性，查看打在目前防禦屬性上的傷害倍率</p></div>
      <div class="tc-attackrow"><label>攻擊招式屬性<select id="tc-move">${optionList(state.move)}</select></label><div class="tc-result tc-${category(defending(state.move,state.primary,state.secondary))}"><span>攻擊倍率</span><strong>${label(defending(state.move,state.primary,state.secondary))}</strong></div></div>
      </section>
      <section class="tc-panel"><div class="tc-titleline"><h2>完整 18 × 18 屬性相剋表</h2><p>左側是攻擊屬性，上方是防禦屬性；手機上可左右滑動表格</p></div>${chart()}</section>
      <p class="tc-footnote">說明：雙屬性倍率相乘，例如火系招式攻擊草／鋼為 4×；效果免疫為 0×。此表是標準屬性相剋，不包含特性、道具、天氣、特殊招式及伺服器自訂規則。資料參考 <a href="https://pixelmonmod.com/wiki/Types" target="_blank" rel="noopener noreferrer">Pixelmon 官方屬性頁 ↗</a>。</p>`;
  }
  function draw(){if(location.hash.split('/')[0]!=='#types')return;
    const app=document.getElementById('app');if(!app)return;
    app.innerHTML=contents();
    document.querySelectorAll('.side-nav a').forEach(a=>a.classList.toggle('active',a.dataset.route==='types'));
    const crumb=document.getElementById('breadcrumb');if(crumb)crumb.textContent='屬性相剋表';
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('mobileOverlay')?.classList.remove('show');
  }
  document.addEventListener('change',e=>{
    const t=e.target;
    if(t.id==='tc-primary'){state.primary=t.value;if(state.secondary===t.value)state.secondary='';draw()}
    else if(t.id==='tc-secondary'){state.secondary=t.value===state.primary?'':t.value;draw()}
    else if(t.id==='tc-move'){state.move=t.value;draw()}
  });
  window.addEventListener('hashchange',draw);
  // The catalog loader calls render() after fetching data. Preserve our type chart
  // even if a background catalog refresh occurs while the user is on this page.
  const originalRender=window.render;
  if(typeof originalRender==='function')window.render=function(){if(location.hash.split('/')[0]==='#types')draw();else return originalRender.apply(this,arguments)};
  const css=document.createElement('style');
  css.textContent=`
  .tc-panel{background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:clamp(16px,2.5vw,28px);margin:18px 0}
  .tc-panel h2{margin:0;font-size:20px}.tc-titleline{display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:19px}.tc-titleline p{color:var(--muted);margin:0;font-size:12px}
  .tc-legend{display:flex;gap:9px;flex-wrap:wrap}.tc-legend span{font-size:12px;padding:8px 11px;border-radius:8px;border:1px solid var(--border);background:var(--surface)}
  .tc-legend .tc-weak{color:#54bba5}.tc-legend .tc-resist{color:#ed736b}.tc-legend .tc-immune{color:var(--muted)}
  .tc-selectors{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.tc-selectors label,.tc-attackrow label{font-size:12px;font-weight:700;color:var(--muted);display:flex;flex-direction:column;gap:9px}
  .tc-selectors select,.tc-attackrow select{background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:10px;padding:13px 14px;width:100%;min-width:0}
  .tc-selected{display:flex;align-items:center;flex-wrap:wrap;gap:8px;color:var(--muted);font-size:12px;margin:18px 0}.tc-chipwrap{display:flex;flex-wrap:wrap;gap:5px}
  .tc-chip{display:inline-flex;gap:5px;align-items:center;background:color-mix(in srgb,var(--tc-color) 17%,var(--surface));border:1px solid color-mix(in srgb,var(--tc-color) 42%,var(--border));color:var(--text);font-size:12px;border-radius:7px;padding:5px 9px;font-weight:700;white-space:nowrap}.tc-chip small{font-size:10px;color:var(--muted);font-weight:500}
  .tc-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.tc-group{background:var(--surface2);border:1px solid var(--border);padding:14px;border-radius:12px;min-height:95px}
  .tc-group header{display:flex;align-items:center;justify-content:space-between;gap:5px;margin-bottom:12px}.tc-group header strong{font-size:13px}.tc-group header span{font-size:11px;color:var(--muted)}.tc-group.tc-weak header strong{color:#64c7ae}.tc-group.tc-resist header strong{color:#ef8e87}.tc-group.tc-immune header strong{color:var(--muted)}.tc-empty{font-size:12px;color:var(--muted)}
  .tc-attackrow{display:flex;align-items:end;gap:15px}.tc-attackrow label{flex:1}.tc-result{border-radius:11px;background:var(--surface2);border:1px solid var(--border);padding:10px 20px;display:flex;align-items:center;justify-content:center;gap:16px;min-width:160px}.tc-result span{font-size:12px;color:var(--muted)}.tc-result strong{font-size:24px}.tc-result.tc-weak strong{color:#64c7ae}.tc-result.tc-resist strong{color:#ef8e87}
  .tc-scroll{overflow:auto;max-width:100%;border:1px solid var(--border);border-radius:10px}.tc-matrix{border-collapse:separate;border-spacing:2px;width:max-content;min-width:100%;font-size:11px;text-align:center}.tc-matrix th,.tc-matrix td{padding:7px 4px;min-width:39px;white-space:nowrap}.tc-matrix th{color:var(--text);background:var(--surface2);position:sticky;z-index:1}.tc-matrix thead th{top:0}.tc-matrix tbody th{left:0;text-align:left;border-left:3px solid var(--tc-color)}.tc-matrix .tc-corner{left:0;z-index:3;min-width:88px}.tc-matrix thead th:not(.tc-corner){border-top:3px solid var(--tc-color)}.tc-matrix .tc-weak{background:#2a99852b;color:#61c6ad;font-weight:800}.tc-matrix .tc-resist{background:#a84c4c30;color:#ef9b92;font-weight:700}.tc-matrix .tc-immune{background:var(--surface3);color:var(--muted);font-weight:800}.tc-matrix .tc-neutral{color:var(--muted);background:var(--surface2);opacity:.75}
  .tc-footnote{font-size:12px;line-height:1.85;color:var(--muted)}.tc-footnote a{color:var(--accent);text-decoration:underline}
  @media(max-width:800px){.tc-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.tc-attackrow{flex-wrap:wrap}.tc-attackrow label{min-width:160px}.tc-matrix th,.tc-matrix td{min-width:38px}}
  @media(max-width:480px){.tc-selectors{grid-template-columns:1fr}.tc-summary{grid-template-columns:1fr 1fr}.tc-group{padding:10px}.tc-chip{font-size:11px;padding:4px 6px}.tc-group header strong{font-size:11px}.tc-titleline h2{font-size:17px}}
  `;
  document.head.appendChild(css);
  draw();
  window.pixelmonTypeChart={multiplier,defending,types:TYPES.map(t=>t[0])};
})();
