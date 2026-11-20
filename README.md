# Pixelmon Atlas v0.5 — 圖鑑資料與圖片擴充

## 本版真正完成的部分

- 從 PokéAPI CSV 導入 **全國圖鑑 1–1025 號的主要物種**，包括繁體中文、英文、屬性、是否傳說／幻之，以及進化親緣關係。
- 圖鑑索引會在網頁開啟後，透過 HTTPS 從 PokéAPI 官方 GitHub 資料庫鏡像載入。首次載入需要網路；資料無法取得時會顯示清楚提示，並保留內建少量資料。
- 每隻寶可夢使用其全國圖鑑編號讀取外部 PokeAPI 圖片，優先 official-artwork、失敗則嘗試一般 sprite，若都不可用會顯示替代符號。
- 已收錄的 Minecraft 道具／材料顯示物品圖片，優先使用 Project-crafting 物品圖示服務；圖片失敗則保留替代圖案。
- 寶可夢列表每次顯示 60 筆，避免一次載入逾千張圖片。
- 清空原來尚未核對版本的「示範生成條件」，避免錯誤的搜尋結果。
- 原有經 Pixelmon Wiki 核對的終界珍珠掉落反查資料（47 個來源）保留。

## 尚未完成／重要限制

1. **全國圖鑑 ≠ Pixelmon 版本內可獲得名單**。並非所有全國圖鑑物種都保證存在於你的 Pixelmon 版本。
2. 沒有使用者的 **Minecraft 版本、Pixelmon 版本** 或可解析的官方該版本模組資料，不能可靠地宣稱已匯入全體野生生成規則、掉落率與合成配方。
3. 不應因資料尚未匯入而猜測生成條件；生態域及時間篩選無已驗證規則時結果可能是 0。
4. 圖片依賴第三方公開圖庫，受網路連線、資源覆蓋率、版權與主機穩定性影響；目前不是 Pixelmon 3D 模型圖，亦不保證每種地區形態、特殊形態有獨立圖片。
5. 目前道具索引集中在原版 Minecraft 材料，**不是完整 Pixelmon 專屬道具庫**，其掉落/合成資料仍需後續匯入。

## 如何發布更新

將此目錄中的 `index.html`、`app.js`、`catalog-loader.js`、`verified-data.js`、`style.css`、`manifest.webmanifest`、`favicon.svg` 和 README 上傳至既有 GitHub repository 的**同一個 Vercel Root Directory**，提交至部署分支。不要新建 Vercel 專案。確認瀏覽器硬重新整理，檢視 `BETA v0.5` 和圖鑑匯入狀態。

## 引用與圖片來源

- https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv
- https://github.com/PokeAPI/sprites
- https://pixelmonmod.com/wiki/Ender_Pearl
- https://github.com/Project-crafting/minecraft-auto-updated-textures-api

公開分發時務必自行核對素材使用權、Pokémon 和 Minecraft 品牌相關政策；此站不是官方產品。
