Anjou Terminal v4.5 Phase 2.4 Stability + US Session Fix

修正：
1. 美股盤前/盤後/夜盤漲跌幅計算改用「目前 session 價格 vs 對照 session 收盤」。
   例如 MU 盤前 1197.56 會對日盤收盤 1131.91，不再誤用 Yahoo meta previousClose。
2. 前端 API 新增 retry，避免切換頁面或重新整理時短暫 Failed to fetch 直接整區空白。
3. refreshAll 加鎖，避免 5 秒自動更新與手動更新/切換頁面同時打 API。
4. 題材熱度更新加鎖。
5. 台股題材批次改 12 檔一批，每批間隔 120ms，降低 Cloudflare Worker 資源限制和資料不穩。
6. Worker 內 TWSE MIS 批次改 20 檔一批，降低上游/Worker 壓力。

需要更新：
- GitHub frontend：index.html / style.css / app.js
- Cloudflare Worker：worker.js

測試：
/api/session-quotes?symbols=MU,NVDA,INTC
/api/tw-yahoo-quotes?codes=2603,2609,2615,2605,2637,2610,2618
