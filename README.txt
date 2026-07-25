Anjou Terminal v4.5 Phase 2.2 Fix

修正：
1. VIXTWN parser 改為優先抓標題區附近的兩位小數，避免誤抓 80.00。
2. 台股題材分批由 45 改為 20，降低 Worker 超時/資源限制造成部分題材無資料。
3. 台股題材 store 會保留 failed quote，點擊後可顯示真正錯誤原因。
4. 新增 /api/econ-light，先嘗試 API 候選，抓不到使用目前 2026/04 紅燈 39 的備援資料。
5. 波浪分析區新增說明：目前是程式推估，不是杜金龍最新觀點；需要指定公開來源或搜尋 API 才能每日自動抓杜金龍觀點。

需要更新：
- GitHub frontend 三檔：index.html / style.css / app.js
- Cloudflare Worker：worker.js
