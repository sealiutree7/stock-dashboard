# Anjou Terminal v5.1 Professional

修正：
1. 美股盤前/日盤/盤後：Yahoo quote API 優先，盤前用 preMarketPrice，盤後用 postMarketPrice。
2. VIXTWN：使用 WantGoo API：
   - /investure/vixtwn/minute-candlestick
   - /investure/vixtwn/commoditystate
3. 景氣訊號燈：使用國發會 API：
   - POST https://index.ndc.gov.tw/n/json/lightscore

更新：
- Cloudflare Worker：cloudflare-worker/worker.js
- GitHub Pages：frontend/app.js、frontend/style.css、frontend/index.html

測試：
/health
/api/session-quotes?symbols=SOXX,MU,NVDA
/api/quotes?symbols=VIXTWN
/api/econ-light
