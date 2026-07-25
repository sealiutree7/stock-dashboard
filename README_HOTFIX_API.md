# Anjou Terminal v5.1 Professional Hotfix API

只需更新 Cloudflare Worker：
- cloudflare-worker/worker.js

修正：
- VIXTWN 404：改為自動嘗試 /index、/stock、/investure 多種 WantGoo API 路徑。
- 景氣燈 403：先 GET 國發會頁面取得 Cookie / XSRF，再 POST /n/json/lightscore。

測試：
/health
/api/quotes?symbols=VIXTWN
/api/econ-light
