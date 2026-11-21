'use strict';
/* The full 1–1025 National Pokédex is bundled locally in national-dex-data.js.
 * This loader only adds optional versioned spawning, drops and item references.
 * Do not replace the existing catalogue or display a full-screen loading state. */
window.catalogStatus=window.nationalDexImported?'已內建 1,025 隻全國圖鑑資料':'未找到內建全國圖鑑資料';
(async function loadOptionalPokemonDetails(){
 try{
  if(typeof loadWikiReference==='function')await loadWikiReference();
 }catch(error){
  console.warn('Additional Pixelmon spawn/drop rules unavailable:',error);
  window.wikiImportError=String(error);
 }
})();
