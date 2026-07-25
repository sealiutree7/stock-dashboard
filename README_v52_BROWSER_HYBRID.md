# Anjou Terminal v5.2 Browser Hybrid

## 改動
- VIXTWN：前端瀏覽器優先直接抓 WantGoo API：
  - /investure/vixtwn/commoditystate
  - /investure/vixtwn/minute-candlestick
- 景氣訊號燈：前端瀏覽器優先直接抓國發會 API：
  - POST /n/json/lightscore
- 若瀏覽器因 CORS 或來源阻擋失敗，會 fallback 到 Worker。

## 更新
GitHub Pages 覆蓋：
- frontend/app.js
- frontend/style.css
- frontend/index.html

Worker 可先不動，沿用 v5.1 Hotfix Worker。

## 注意
若 WantGoo / 國發會沒有開 CORS，GitHub Pages 直連仍可能失敗；此版會把錯誤顯示在卡片中。
