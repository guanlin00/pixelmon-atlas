'use strict';
/* General training templates derived from default-form base stats (PokéAPI).
 * Move candidates are restricted to the Pokémon's own PokéAPI learnset, when available.
 * Main-series availability does NOT verify learnability in Pixelmon 9.4.2. */
(() => {
 const attr=['HP','攻擊','防禦','特攻','特防','速度'];
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const moveInfo=new Map((typeof ATLAS_MOVE_DATA!=='undefined'?ATLAS_MOVE_DATA:[]).map(m=>[m[0],m]));
 const cache=new Map();
 const props={
  physical:{nature:'固執（+攻擊、−特攻）',fastNature:'爽朗（+速度、−特攻）',item:'生命寶珠',alt:'講究頭帶',note:'提升物理輸出；生命寶珠會消耗 HP，講究頭帶會鎖定招式'},
  special:{nature:'內斂（+特攻、−攻擊）',fastNature:'膽小（+速度、−攻擊）',item:'生命寶珠',alt:'講究眼鏡',note:'提升特殊輸出；講究眼鏡會鎖定招式'},
  defensive:{nature:'大膽（+防禦、−攻擊）',fastNature:'淘氣（+防禦、−特攻）',item:'吃剩的東西',alt:'凸凸頭盔',note:'偏重耐久、回復與干擾，依實際招式和特性微調'},
  specialwall:{nature:'溫和（+特防、−攻擊）',fastNature:'慎重（+特防、−特攻）',item:'吃剩的東西',alt:'突擊背心',note:'偏重特防；突擊背心無法使用變化招式，不適合有回復／輔助招式的配置'}
 };
 function template(p){
  const s=typeof ATLAS_BASE_STATS!=='undefined'?ATLAS_BASE_STATS[p.id-1]:null;
  if(!s||s.length!==6)return null;
  const [hp,atk,def,spa,spd,spe]=s,physical=atk>=spa+12,special=spa>=atk+12;
  let role,main,secondary,nature,ev,reason;
  if(Math.max(atk,spa)>=85 && (Math.max(atk,spa)>=Math.max(def,spd)+8 || spe>=85)){
   role=physical?'physical':special?'special':(atk>=spa?'physical':'special');
  }else if(Math.max(def,spd)>=95&&Math.max(def,spd)>=Math.max(atk,spa)+5){
   role=def>=spd?'defensive':'specialwall';
  }else role=atk>=spa?'physical':'special';
  const attackIndex=role==='physical'?1:role==='special'?3:-1;
  if(attackIndex>=0){
    main=attackIndex;secondary=spe>=65?5:0;
    nature=spe>=85?props[role].fastNature:props[role].nature;
    ev=[4,0,0,0,0,0];ev[main]=252;ev[secondary]=252;ev[0]=(main!==0&&secondary!==0)?4:ev[0];
    if(secondary===0)ev=[252,0,0,0,0,0],ev[main]=252;
    reason=(role==='physical'?'物攻':'特攻')+'種族值 '+s[main]+'，速度 '+spe+'，以'+attr[main]+'和'+attr[secondary]+'為主要投入方向';
  }else{
    main=role==='defensive'?2:4;secondary=0;
    nature=role==='defensive'?(spa>=atk?props[role].nature:props[role].fastNature):(atk>=spa?props[role].nature:props[role].fastNature);
    ev=[252,0,0,0,0,0];ev[main]=252;ev[5]=4;
    reason='HP '+hp+'、防禦 '+def+'、特防 '+spd+'，建議優先強化'+attr[main]+'與耐久';
  }
  if(ev.reduce((a,b)=>a+b,0)!==508)throw Error('EV total invalid');
  return {stats:s,role,ev,nature,reason,...props[role]};
 }
 const movesByType=type=>[...moveInfo.values()].filter(x=>x[3]===type);
 const bonusStatus=new Set([14,73,86,92,97,105,113,115,133,156,164,182,191,219,226,230,232,240,241,246,269,273,312,334,347,349,355,366,367,384,387,393,403,417,432,433,446,468,469,470,473,475,483,501,504,526,561,588,590,597,601,606,608,611,659,661,662,673,674,676,688,694,737,753,764,765,766,776,792,809,810,851]);
 function chooseMoves(p,plan,moves){
  const source=moves.map(x=>{
   const id=Number((x.move?.url||'').match(/\/move\/(\d+)\//)?.[1]);
   const row=moveInfo.get(id);
   if(!row)return null;
   const versions=(x.version_group_details||[]).map(v=>v.version_group?.name).filter(Boolean);
   const inSV=versions.some(v=>['scarlet-violet','the-teal-mask','the-indigo-disk'].includes(v));
   return {row,versions,inSV};
  }).filter(Boolean);
  const sv=source.filter(x=>x.inSV),pool=sv.length>=4?sv:source;
  const used=new Set(),chosen=[],roleClass=plan.role==='physical'?2:plan.role==='special'?3:plan.stats[1]>=plan.stats[3]?2:3;
  const score=x=>{
   const m=x.row,stab=p.types.includes(m[3]),power=m[5]||0,accuracy=m[6]==null?95:m[6];
   return Math.min(power,130)*(accuracy/100)+(stab?37:0)+(m[4]===roleClass?30:-24)-(power<45?28:0);
  };
  const picks=pool.filter(x=>x.row[4]===roleClass&&x.row[5]&&x.row[5]>=40&&x.row[3]!=='unknown').sort((a,b)=>score(b)-score(a));
  const add=x=>{if(x&&!used.has(x.row[0])){chosen.push(x);used.add(x.row[0]);return true}return false};
  for(const type of p.types){add(picks.find(x=>x.row[3]===type));if(chosen.length===2)break}
  if(chosen.length<2)add(picks.find(x=>p.types.includes(x.row[3])));
  if(chosen.length<3)add(picks.find(x=>!p.types.includes(x.row[3])));
  if(chosen.length<4){
   const status=pool.filter(x=>x.row[4]===1&&bonusStatus.has(x.row[0]));
   if(plan.role==='defensive'||plan.role==='specialwall')status.sort((a,b)=>((/recover|roost|soft-boiled|slack-off|milk drink|synthesis|moonlight|wish|rest/i.test(a.row[2])?1:0)-( /recover|roost|soft-boiled|slack-off|milk drink|synthesis|moonlight|wish|rest/i.test(b.row[2])?1:0))*-1);
   add(status[0]);
  }
  for(const move of picks){if(chosen.length>=4)break;add(move)}
  if(chosen.length<4)for(const x of pool.filter(x=>x.row[4]===1)){if(chosen.length>=4)break;add(x)}
  return {selected:chosen.slice(0,4),source:sv.length>=4?'《朱／紫》版本群可學招式':'主系列歷代可學招式（版本可能不同）'};
 }
 const displayEv=ev=>ev.map((v,i)=>v?attr[i]+' '+v:null).filter(Boolean).join(' / ');
 function render(p){
  const plan=template(p);
  if(!plan)return '<h3>建議培育方式</h3><p class="guide">缺少種族值資料，暫不提供自動配招，以免誤導。</p>';
  return '<section class="atlas-training"><h3>建議培育方式</h3>'+
   '<p class="guide">依一般形態種族值提供的入門培育方向，非唯一最強配置。實際對戰還取決於特性、隊伍、規則與形態。</p>'+
   '<div class="atlas-training-grid"><div class="atlas-training-part"><strong>推薦努力值（總計 508）</strong><p>'+esc(displayEv(plan.ev))+'</p></div>'+
   '<div class="atlas-training-part"><strong>推薦性格</strong><p>'+esc(plan.nature)+'</p></div>'+
   '<div class="atlas-training-part"><strong>攜帶道具</strong><p>'+esc(plan.item)+'</p><small>其他選擇：'+esc(plan.alt)+'</small></div>'+
   '<div class="atlas-training-part"><strong>培育方向</strong><p>'+esc(plan.reason)+'</p></div></div>'+
   '<h4>四招參考配招</h4><div id="atlas-recommended-moves" data-training-pokemon="'+p.id+'"><p class="guide">正在讀取這隻寶可夢的主系列可學招式清單…</p></div>'+
   '<p class="guide">道具提醒：'+esc(plan.note)+'。配招以主系列資料產生，尚未核實 Pixelmon 9.4.2 的專屬學習方法與特殊形態；請使用下方官方連結交叉確認。</p>'+
   '<div class="atlas-training-links"><a class="btn quiet" href="#ev">查看練努力值的地形／目標</a><a class="btn quiet" href="#natures">查看性格表</a><a class="btn quiet" href="https://pixelmonmod.com/wiki/'+encodeURIComponent(p.en.replace(/ /g,'_'))+'" target="_blank" rel="noopener noreferrer">核對 Pixelmon 官方資料 ↗</a></div>'+
   '</section>';
 }
 function loadMoves(p){
  const node=document.getElementById('atlas-recommended-moves');
  if(!node||Number(node.dataset.trainingPokemon)!==p.id)return;
  const plan=template(p);
  if(!plan)return;
  const request=cache.has(p.id)?cache.get(p.id):fetch('https://pokeapi.co/api/v2/pokemon/'+p.id+'/').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(x=>x.moves||[]);
  if(!cache.has(p.id))cache.set(p.id,request);
  request.then(moves=>{
   const box=document.getElementById('atlas-recommended-moves');
   if(!box||Number(box.dataset.trainingPokemon)!==p.id)return;
   const r=chooseMoves(p,plan,moves);
   const li=r.selected.map((v,i)=>'<li><strong>'+esc(v.row[1])+'</strong> <small>'+esc(v.row[2])+'</small></li>').join('');
   box.innerHTML='<p class="guide">來源：'+esc(r.source)+'；這是依屬性、威力與定位產生的參考配招，並非已驗證的 Pixelmon 對戰配置。</p>'+
    (li?'<ol class="atlas-training-moves">'+li+'</ol>':'<p class="guide">尚無足夠可核對的招式資料，暫不編造四招。</p>')+
    (r.selected.length<4?'<p class="guide">已找到 '+r.selected.length+' 招，其他招式仍需核對。</p>':'');
  }).catch(()=>{
   const box=document.getElementById('atlas-recommended-moves');
   if(box&&Number(box.dataset.trainingPokemon)===p.id)box.innerHTML='<p class="guide">目前無法載入可學招式資料，因此沒有顯示未經核對的配招。請透過官方 Wiki 查看。</p>';
  });
 }
 window.AtlasTraining={render,loadMoves,template};
})();
