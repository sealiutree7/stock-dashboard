# Anjou Terminal v5.0 Professional RC2 Clean Frontend

這版改法：
- 不再 patch 舊 app.js，直接重寫乾淨前端控制程式，但保留原本 HTML/CSS/v4.5 UI 與 TradingView 區塊。
- 修正題材點擊不顯示個股：點題材地圖或排行都會更新 ThemeFocusCards，不影響自選清單。
- 自選/大盤 5 秒更新；題材 5 分鐘更新。
- 台股題材平均值排除 failed/null quote，不會一檔失敗導致整個題材 --。
- Worker 延用 RC/FINAL data engine。

更新方式：
1. GitHub Pages 請覆蓋 frontend/app.js、frontend/index.html、frontend/style.css。
2. Cloudflare Worker 可覆蓋 cloudflare-worker/worker.js；若你不想動 Worker，也可以只更新 app.js。

更新後：
- /health 應顯示 Anjou Terminal Worker v5.0 Professional RC2。
- 若 VIXTWN 仍 No data，代表目前來源 TWSE MIS / WantGoo 對 Worker 不提供可解析資料；這不是前端問題。
- 景氣燈若仍顯示備援，代表國發會候選端點未回傳可解析欄位。
