'use strict';
/* Source: PokéAPI official CSV repository. This is the National Pokédex, NOT a claim that
   all listed Pokémon or game-generation mechanics are present in an installed Pixelmon mod.
   Details concerning Pixelmon spawning/drops require separately verified, versioned rules. */
const CATALOG_SOURCE = 'https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv';
const CATALOG_MIRRORS = [
  'https://cdn.jsdelivr.net/gh/PokeAPI/pokeapi@master/data/v2/csv/',
  'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/'
];
const CATALOG_FILES = ['pokemon_species.csv','pokemon_species_names.csv','pokemon.csv','pokemon_types.csv'];
const TYPE_FROM_ID = {1:'normal',2:'fighting',3:'flying',4:'poison',5:'ground',6:'rock',7:'bug',8:'ghost',9:'steel',10:'fire',11:'water',12:'grass',13:'electric',14:'psychic',15:'ice',16:'dragon',17:'dark',18:'fairy'};
// Small RFC4180-capable parser, including escaped double quotes and embedded commas/newlines.
function parseCSV(input){const rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<input.length;i++){const c=input[i];if(quoted){if(c==='"'&&input[i+1]==='"'){field+='"';i++}else if(c==='"'){quoted=false}else field+=c}
 else if(c==='"')quoted=true;else if(c===','){row.push(field);field=''}else if(c==='\n'){row.push(field.replace(/\r$/,''));rows.push(row);row=[];field=''}else field+=c;}
 if(field||row.length){row.push(field.replace(/\r$/,''));rows.push(row)}
 const columns=rows.shift();return rows.filter(r=>r.length>=columns.length).map(r=>Object.fromEntries(columns.map((name,i)=>[name,r[i]])));
}
async function loadCsv(name){let lastError;for(const base of CATALOG_MIRRORS){try{const res=await fetch(base+name,{cache:'force-cache'});if(!res.ok)throw Error('HTTP '+res.status);const raw=await res.text();if(!raw.startsWith(name==='pokemon.csv'?'id,':name==='pokemon_types.csv'?'pokemon_id,':name==='pokemon_species.csv'?'id,':'pokemon_species_id,'))throw Error('Unexpected CSV');return parseCSV(raw)}catch(e){lastError=e}}throw lastError}
function setCatalogStatus(message){window.catalogStatus=message;const n=document.getElementById('catalogLoadStatus');if(n)n.textContent=message}
async function importNationalDex(){
 setCatalogStatus('正在載入全國圖鑑（需要網路連線）…');
 try{
 const [species,names,pokemons,types]=await Promise.all(CATALOG_FILES.map(loadCsv));
 const maxId=1025;
 const nameIndex=new Map();
 for(const row of names){const id=+row.pokemon_species_id;if(id>maxId)continue;let n=nameIndex.get(id);if(!n){n={};nameIndex.set(id,n)}if(+row.local_language_id===4)n.zh=row.name;if(+row.local_language_id===9)n.en=row.name}
 const ids=new Map();
 for(const row of pokemons){if(row.is_default==='1'&&+row.species_id<=maxId)ids.set(+row.id,+row.species_id)}
 const typeIndex=new Map();
 for(const row of types){const id=ids.get(+row.pokemon_id);if(!id)continue;const list=typeIndex.get(id)||[];list[+row.slot-1]=TYPE_FROM_ID[+row.type_id];typeIndex.set(id,list)}
 const oldRecords=new Map(POKEMON.map(p=>[p.id,p]));
 const loaded=[];
 for(const row of species){const id=+row.id;if(id<1||id>maxId)continue;const names=nameIndex.get(id)||{},prior=oldRecords.get(id);
 const obj={id,zh:names.zh||names.en||prior?.zh||`#${id}`,en:names.en||prior?.en||`#${id}`,types:(typeIndex.get(id)||prior?.types||[]).filter(Boolean),class:row.is_mythical==='1'?'mythical':row.is_legendary==='1'?'legendary':'normal',rules:[],evolve:'進化關係請參考下方關聯圖鑑；實際進化條件待對應 Pixelmon 版本核對',drops:[],evolvesFrom:+row.evolves_from_species_id||null,sourceUrl:`https://pokeapi.co/api/v2/pokemon-species/${id}/`,verifiedDrops:prior?.verifiedDrops||[]};
 if(prior?.verifiedDrops?.length)obj.drops=prior.verifiedDrops.map(d=>d.item);
 // Do not copy old demonstrative biome rules; they are not verified to a specific version.
 loaded.push(obj)}
 if(loaded.length<1000)throw Error('資料筆數不足：'+loaded.length);
 POKEMON.splice(0,POKEMON.length,...loaded);
 window.nationalDexImported=true;
 setCatalogStatus(`已載入 ${loaded.length} 隻全國圖鑑資料（中文、英文、屬性、分類）`);
 if(typeof render==='function')render();
 }catch(err){console.warn('Pokédex import unavailable',err);setCatalogStatus('圖鑑來源暫時無法載入，僅顯示已內建的部分資料。請保持連線並重新整理。')}
}
importNationalDex();
