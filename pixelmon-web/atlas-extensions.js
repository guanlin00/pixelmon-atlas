/* Pixelmon Atlas v0.9 — additive enhancements. National Dex != Pixelmon verified content. */
'use strict';
(()=>{
 const GENERATIONS=[['全部世代',1,1025],['第一代・關都',1,151],['第二代・城都',152,251],['第三代・豐緣',252,386],['第四代・神奧',387,493],['第五代・合眾',494,649],['第六代・卡洛斯',650,721],['第七代・阿羅拉',722,809],['第八代・伽勒爾',810,905],['第九代・帕底亞',906,1025]];
 let gen=0;let formCache=new Map();let itemList=null;let itemBusy=false;
 const special={658:[{name:'牽絆變身／小智甲賀忍蛙',en:'Ash-Greninja',kind:'對戰形態',note:'牽絆變身（Battle Bond），需核對 9.4.2 實際觸發規則。',source:'https://pixelmonmod.com/wiki/Battle_Bond'}, {name:'殭屍特殊皮膚',en:'Zombie Ash Greninja',kind:'Pixelmon 特殊外觀',note:'官方特殊材質頁提到 Ash Form 的 Zombie 材質。此圖示不以一般甲賀忍蛙冒充。',source:'https://pixelmonmod.com/wiki/Special_textures'}, {name:'詛咒皮膚（待核對）',en:'Cursed Skin',kind:'待確認名稱',note:'尚未找到官方 Wiki 能證實此皮膚名稱對應的模型及取得途徑。可能與殭屍或伺服器自訂材質混淆。',source:'https://pixelmonmod.com/wiki/Special_textures'}, {name:'創作者皮膚',en:'Creator Greninja',kind:'Pixelmon 特殊外觀',note:'官方 Wiki 有收錄的特殊材質；多與活動／授權解鎖有關。',source:'https://pixelmonmod.com/wiki/Special_textures'}]};
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
 function current(){return (location.hash.split('/')[0]||'#home').slice(1)}
 function runExtension(){
  const route=current();
  if(route==='pokedex')drawGenerations();
  if(route==='pokemon')drawForms();
  if(route==='items')drawItemDirectory();
 }
 function drawGenerations(){const catalog=document.querySelector('.catalog');if(!catalog||catalog.querySelector('.atlas-gen'))return;
  const aside=el('aside','atlas-gen');const heading=el('h3','', '依世代尋找');aside.append(heading);
  aside.append(el('p','atlas-help','依全國圖鑑編號分類，不代表全部已於 Pixelmon 9.4.2 實裝。'));
  const buttons=el('div','atlas-gen-buttons');
  GENERATIONS.forEach((g,i)=>{const b=el('button',`atlas-gen-btn ${i===gen?'active':''}`);b.type='button';b.dataset.generation=String(i);
   const n=el('strong','',g[0]);const c=el('span','',`${g[1]}–${g[2]}`);b.append(n,c);buttons.appendChild(b);
  });aside.append(buttons);catalog.append(aside);
  const info=document.querySelector('.results-head small');if(info&&gen)info.textContent=`目前顯示 ${GENERATIONS[gen][0]}（#${GENERATIONS[gen][1]}–#${GENERATIONS[gen][2]}）· 生成條件仍依已匯入資料判定`;
 }
 function drawForms(){const id=+(location.hash.split('/')[1]||0);if(!id)return;const detail=document.querySelector('.detail-main');if(!detail||detail.querySelector('.atlas-form-section'))return;
  const panel=el('section','atlas-form-section');panel.dataset.species=String(id);
  panel.innerHTML='<div class="atlas-section-title"><div><h3>不同形態與特殊皮膚</h3><p>地區／戰鬥形態與 Pixelmon 特殊材質分開顯示；不會把特殊皮膚誤認成新物種。</p></div></div><div class="atlas-form-grid" id="atlasFormGrid"><p class="atlas-help">正在查詢可用形態…</p></div>';
  detail.append(panel);loadForms(id,panel);
 }
 function nameForm(id,display){const z=String(id).toLowerCase();const labels=[['-alola','阿羅拉形態'],['-galar','伽勒爾形態'],['-hisui','洗翠形態'],['-paldea','帕底亞形態'],['-mega-x','超級進化 X'],['-mega-y','超級進化 Y'],['-mega','超級進化'],['-gmax','超極巨化'],['-ash','小智／牽絆變身'],['-origin','起源形態'],['-therian','靈獸形態']];for(const [ending,zh] of labels)if(z.endsWith(ending))return zh;return display||z.replaceAll('-',' ')}
 function card(name,english,image,caption,detail,source,verified){const article=el('article','atlas-form-card');const picture=el('div','atlas-form-picture');if(image){const img=document.createElement('img');img.loading='lazy';img.alt=name;img.src=image;img.onerror=()=>{picture.textContent='圖片尚未提供'};picture.append(img)}else picture.append(el('span','atlas-no-image','尚無已核對圖片'));
 article.append(picture,el('strong','',name),el('small','',english));const badge=el('span','atlas-form-kind',caption);article.append(badge);if(detail)article.append(el('p','atlas-form-desc',detail));if(source){const a=el('a','atlas-form-source','查看來源 ↗');a.href=source;a.target='_blank';a.rel='noopener noreferrer';article.append(a)}return article}
 async function loadForms(id,panel){const box=panel.querySelector('#atlasFormGrid');if(!box)return;
  try{
   let forms=formCache.get(id);if(!forms){const resp=await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}/`);if(!resp.ok)throw Error(resp.status);const data=await resp.json();forms=(data.varieties||[]).map(x=>({name:x.pokemon.name,isDefault:x.is_default}));formCache.set(id,forms)}
   if(!panel.isConnected||Number(panel.dataset.species)!==id)return;box.replaceChildren();
   let names=forms; if(!names.length)names=[{name:(typeof POKEMON!=='undefined'?POKEMON.find(p=>p.id===id)?.en:'')||`#${id}`,isDefault:true}];
   const details=await Promise.all(names.slice(0,32).map(async v=>{try{const r=await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(v.name)}/`);if(!r.ok)throw Error(r.status);const d=await r.json();return {...v,image:d.sprites?.other?.['official-artwork']?.front_default||d.sprites?.front_default||'',types:d.types?.map(x=>x.type.name)||[]}}catch{return {...v,image:'',types:[]}}}));
   if(!panel.isConnected)return;
   for(const v of details){const zh=v.isDefault?'一般形態':nameForm(v.name,v.name);const info=v.types.length?'屬性：'+v.types.join('／')+'。':'來源：PokéAPI。';box.append(card(zh,v.name,v.image,v.isDefault?'一般形態':'官方寶可夢形態',info,'https://pokeapi.co/api/v2/pokemon/'+encodeURIComponent(v.name)+'/',true))}
   for(const v of (special[id]||[]))box.append(card(v.name,v.en,null,v.kind,v.note,v.source,false));
   const foot=el('p','atlas-help','注意：PokéAPI 的形態與圖片不代表 Pixelmon 9.4.2 一定已實裝；Pixelmon 特殊材質若未取得官方圖片，不會用其他形態圖片替代。');panel.append(foot);
  }catch(e){box.replaceChildren(el('p','atlas-help','目前無法連線查詢形態，請確認網路後重新開啟此頁。'))}
 }
 function drawItemDirectory(){const root=document.querySelector('#itemResults');if(!root||document.querySelector('#atlasItemDirectory'))return;
  const section=el('section','atlas-item-directory');section.id='atlasItemDirectory';section.innerHTML=`<div class="atlas-section-title"><div><h3>更多寶可夢系列道具（PokéAPI）</h3><p>提供可搜尋的圖片索引；這些是寶可夢遊戲道具，不代表全部屬於 Pixelmon 9.4.2，取得方式尚未核實。</p></div></div><input id="atlasExtraItemQuery" type="search" placeholder="搜尋英文道具名稱，如 rare-candy、master-ball…"/><div class="atlas-item-status" id="atlasItemStatus">準備載入線上道具索引…</div><div class="atlas-extra-items" id="atlasExtraItems"></div>`;
  root.insertAdjacentElement('afterend',section);if(!itemList&&!itemBusy)loadItemList();else updateItems();
 }
 async function loadItemList(){itemBusy=true;try{const resp=await fetch('https://pokeapi.co/api/v2/item?limit=2500');if(!resp.ok)throw Error(resp.status);const d=await resp.json();itemList=d.results||[];updateItems()}catch{const s=document.querySelector('#atlasItemStatus');if(s)s.textContent='道具清單無法載入，請檢查網路連線。'}finally{itemBusy=false}}
 function updateItems(){const elOut=document.querySelector('#atlasExtraItems'),status=document.querySelector('#atlasItemStatus');if(!elOut||!status)return;if(!itemList){status.textContent='載入中…';return}
  const input=document.querySelector('#atlasExtraItemQuery');const q=(input?.value||'').trim().toLowerCase();const found=itemList.filter(i=>i.name.includes(q));status.textContent=`PokéAPI 收錄 ${itemList.length} 種道具；目前符合 ${found.length} 種（顯示前 48 種）。Pixelmon 專屬道具仍待另行匯入。`;
  elOut.replaceChildren();for(const item of found.slice(0,48)){const a=el('a','atlas-extra-item');a.href='https://pokeapi.co/api/v2/item/'+item.name+'/';a.target='_blank';a.rel='noopener noreferrer';const img=document.createElement('img');img.loading='lazy';img.alt=item.name;img.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/'+item.name+'.png';img.onerror=()=>img.style.display='none';a.append(img,el('span','',item.name.replaceAll('-',' ')));elOut.append(a)}
 }
 document.addEventListener('input',e=>{if(e.target?.id==='atlasExtraItemQuery')updateItems()});
 document.addEventListener('click',e=>{const btn=e.target.closest('[data-generation]');if(!btn)return;gen=Number(btn.dataset.generation);if(typeof window.render==='function')window.render()});
 // The current site's resultsArea() already implements all other live filters.
 // Restrict generation by Pokédex number without clobbering its other filters.
 if(typeof window.matches==='function'){
  const base=window.matches;window.matches=function(p){return (!gen||(p.id>=GENERATIONS[gen][1]&&p.id<=GENERATIONS[gen][2]))&&base(p)};
 }
 if(typeof window.render==='function'){
  const previous=window.render;window.render=function(){const result=previous.apply(this,arguments);runExtension();return result}
 }
 window.addEventListener('hashchange',()=>setTimeout(runExtension,0));
 const style=document.createElement('style');style.textContent=`
 .catalog:has(.atlas-gen){grid-template-columns:290px minmax(0,1fr) 205px;align-items:start}
 .atlas-gen,.atlas-form-section,.atlas-item-directory{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:17px}
 .atlas-gen{position:sticky;top:91px;max-height:calc(100vh - 110px);overflow:auto}.atlas-gen h3{font-size:16px;margin:0 0 9px}
 .atlas-help{font-size:12px;line-height:1.8;color:var(--muted)}.atlas-gen-buttons{display:grid;gap:6px}.atlas-gen-btn{border:1px solid var(--border);background:var(--surface2);color:var(--text);text-align:left;border-radius:9px;padding:9px;display:grid;gap:4px}.atlas-gen-btn span{font-size:11px;color:var(--muted)}.atlas-gen-btn:hover{border-color:var(--accent)}.atlas-gen-btn.active{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 15%,var(--surface));color:var(--accent)}
 .atlas-form-section{margin-top:16px}.atlas-section-title{display:flex;align-items:start;justify-content:space-between;margin-bottom:15px}.atlas-section-title h3{margin:0 0 5px;font-size:19px}.atlas-section-title p{margin:0;color:var(--muted);font-size:12px;line-height:1.65}.atlas-form-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}.atlas-form-card{padding:13px;border:1px solid var(--border);border-radius:12px;background:var(--surface2);display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;min-width:0}.atlas-form-picture{height:140px;width:100%;background:var(--surface);border-radius:10px;display:grid;place-items:center;overflow:hidden}.atlas-form-picture img{width:100%;height:100%;object-fit:contain}.atlas-no-image{color:var(--muted);font-size:12px}.atlas-form-card small{color:var(--muted);word-break:break-word}.atlas-form-kind{background:color-mix(in srgb,var(--accent) 15%,var(--surface));color:var(--accent);font-size:11px;border-radius:5px;padding:3px 7px}.atlas-form-desc{font-size:11px;color:var(--muted);line-height:1.65;margin:4px 0}.atlas-form-source{color:var(--accent);font-size:11px;margin-top:auto}
 .atlas-item-directory{margin-top:24px}#atlasExtraItemQuery{width:100%;border:1px solid var(--border);background:var(--surface2);color:var(--text);padding:12px;border-radius:9px}.atlas-item-status{font-size:12px;color:var(--muted);padding:12px 0}.atlas-extra-items{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:9px}.atlas-extra-item{display:flex;align-items:center;gap:8px;min-width:0;padding:9px;border:1px solid var(--border);border-radius:9px;background:var(--surface2);font-size:12px;word-break:break-word}.atlas-extra-item img{width:30px;height:30px;object-fit:contain;image-rendering:pixelated}
 @media(max-width:1350px){.catalog:has(.atlas-gen){grid-template-columns:250px minmax(0,1fr)}.atlas-gen{grid-column:1/-1;grid-row:1;position:static;max-height:none}.atlas-gen-buttons{display:grid;grid-template-columns:repeat(5,minmax(0,1fr))}}
 @media(max-width:900px){.catalog:has(.atlas-gen){grid-template-columns:minmax(0,1fr)}.atlas-gen{grid-column:1;grid-row:auto}.atlas-gen-buttons{grid-template-columns:repeat(3,minmax(0,1fr))}}
 @media(max-width:480px){.atlas-gen-buttons{grid-template-columns:repeat(2,minmax(0,1fr))}.atlas-form-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.atlas-form-picture{height:110px}}
 `;document.head.append(style);runExtension();
})();
