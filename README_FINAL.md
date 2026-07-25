# Anjou Terminal v5.0 Professional Stable FINAL

以 v4.5 UI 為基底，不重寫版面；只更換資料引擎與安全計算。

更新：
- GitHub Pages: frontend/index.html, frontend/style.css, frontend/app.js
- Cloudflare Worker: cloudflare-worker/worker.js

更新後先測 `/health`，必須看到：Anjou Terminal Worker v5.0 Professional Stable FINAL

再測：
- /api/session-quotes?symbols=MU,NVDA,INTC
- /api/tw-quotes?codes=2603,2609,2615,1513,1504,1519
- /api/tw-index
- /api/econ-light
