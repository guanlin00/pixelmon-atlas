# Pixelmon Atlas v0.7 — Wiki reference data importer

## 網站更新
將這個資料夾的全部檔案（包含 `wiki-import.js`、`data/`）更新到 GitHub 既有的 `pixelmon-web/` 目錄。網站仍使用原本 Vercel 網址。

## 匯入內容
- 初始內建：妙蛙種子（Bulbasaur）官方 Wiki 的四筆生成資訊、兩筆掉落資訊（出處與圖片另外附於頁面）。
- `tools/import_pixelmon_wiki.py` 可按圖鑑編號，從 Pixelmon 官方 Wiki 分批匯入 Spawn Biomes 與 Drops 表格。需電腦連網。
- `data/wiki-reference.json` 是靜態輸出；`wiki-import.js` 會把它合併到網頁內的圖鑑、掉落物查詢、道具百科。沒有匯入的寶可夢仍顯示「待匯入」。
- **Wiki 資料 ≠ 已驗證的 Pixelmon 9.4.2 模組檔**；沒有生成資料不代表不能生成；稀有度不等於固定生成百分比。

## 在 Windows 一次批次匯入（需要 Python）

```powershell
py -m pip install requests beautifulsoup4
cd pixelmon-web
py tools/import_pixelmon_wiki.py --start 1 --batch-size 60 --global-drops
```

每次可變更 `--start` 到 61、121、181 ...。腳本限制存取速度，避免大量並發請求。各物種的特殊形態、重定向和不同結構的 Wiki 表格可能需要人工核對。

## 自動更新（GitHub Actions）

將 `.github/workflows/wiki-import.yml` 放到 **GitHub 專案根目錄**的 `.github/workflows/`，不是 `pixelmon-web/.github/workflows/`。
然後到 GitHub 儲存庫的 **Actions → Refresh Pixelmon Wiki reference data → Run workflow**，選擇 `start` 與 `batch_size`。完成後，Actions 自動提交 `pixelmon-web/data/wiki-reference.json`，Vercel 會部署新版。若儲存庫限制 Actions 寫入，需至 **Settings → Actions → General → Workflow permissions** 啟用 Read and write permissions。

注意：將工作流程檔放在根目錄時，網站的 Root Directory 仍保持 `pixelmon-web`。

## 圖片
寶可夢圖片仍透過 PokéAPI 取得，道具先以 Minecraft 材質服務提供可用的圖示，若沒有對應圖片則顯示替代圖示。尚不能宣稱 Pixelmon 所有專屬道具均已取得正確圖片。
