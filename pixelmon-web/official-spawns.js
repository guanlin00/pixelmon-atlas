/* Selected spawn data transcribed from current Pixelmon Wiki species pages. Category groups are NOT exact Minecraft biomes. Check against installed version/server datapacks. */
const OFFICIAL_SPAWNS={
  16:[['分類：森林（Forests）','Day','Tree Top','Common'],['分類：平原（Plains）','Day','Tree Top','Common'],['分類：針葉林（Taigas）','Day','Tree Top','Common'],['分類：森林（Forests）','Day','Air','Uncommon']],
  27:[['分類：乾燥地帶（Arid）','Night','Land','Uncommon'],['分類：惡地（Mesas）','Night','Land','Uncommon'],['分類：乾燥地帶（Arid）','Night','Sweet Scent','Uncommon']],
  63:[['分類：森林（Forests）','Any','Land','Uncommon'],['分類：終界（End）','Any','Land','Uncommon']],
  328:[['分類：乾燥地帶（Arid）','Any','Land','Uncommon'],['分類：乾燥地帶（Arid）','Any','Forage','Ultra Rare']],
  329:[['沙漠丘陵（Desert Hills）','Day','Land','Ultra Rare'],['究極沙漠（Ultra Desert）','Day','Air','Rare'],['茂盛紅沙漠（Lush Red Desert）','Day','Land','Ultra Rare'],['莫哈韋沙漠（Mojave Desert）','Day','Land','Ultra Rare'],['茂盛沙漠（Lush Desert）','Day','Land','Ultra Rare']],
  330:[['沙漠丘陵（Desert Hills）','Dawn,Dusk','Air','Ultra Rare'],['究極沙漠（Ultra Desert）','Day','Air','Ultra Rare'],['茂盛紅沙漠（Lush Red Desert）','Dawn,Dusk','Air','Ultra Rare'],['莫哈韋沙漠（Mojave Desert）','Dawn,Dusk','Air','Ultra Rare'],['茂盛沙漠（Lush Desert）','Dawn,Dusk','Air','Ultra Rare']]
};
const OFFICIAL_SPAWN_URLS={16:'Pidgey',27:'Sandshrew',63:'Abra',328:'Trapinch',329:'Vibrava',330:'Flygon'};
function addVerifiedSpawns(){for(const p of POKEMON){const entries=OFFICIAL_SPAWNS[p.id];if(!entries)continue;p.rules=entries.map(([biome,time,location,rarity])=>({biome,times:time.split(','),location,rarity,verified:true,source:'https://pixelmonmod.com/wiki/'+OFFICIAL_SPAWN_URLS[p.id]}));}}

addVerifiedSpawns();
