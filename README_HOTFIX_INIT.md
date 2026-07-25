# Anjou Terminal v5.0 Professional Stable FINAL - Hotfix INIT

修正：
- 前版 app.js 最後呼叫 init()，但 init function 遺漏，造成頁面停在 Checking / Ready，按「更新全部」沒有反應。
- 本版補回 init()，綁定切頁、更新全部、5秒自動更新、5分鐘題材更新。
- 不改 UI、不移除 TradingView、不改 Worker 資料引擎。

需要更新：
- GitHub Pages 只要覆蓋 frontend/app.js 即可。
- Worker 不需要重貼；若你已經是 /health 顯示 FINAL，就不用動 Worker。
