# Anjou Terminal v5.0 Professional Stable

此版以 v4.5 UI 為基底，不重寫版面、不移除 TradingView，只更換資料引擎。

## 更新檔案
GitHub Pages 覆蓋：
- `frontend/index.html`
- `frontend/style.css`
- `frontend/app.js`

Cloudflare Worker 覆蓋：
- `cloudflare-worker/worker.js`

## 更新後測試
```text
/health
/api/session-quotes?symbols=MU,NVDA,INTC
/api/tw-quotes?codes=2603,2609,2615,1513,1504,1519
/api/tw-index
/api/econ-light
```

`/health` 應顯示：
```text
Anjou Terminal Worker v5.0 Professional Stable
```

## 主要修正
- 保留 v4.5 原 UI 與 TradingView 圖表。
- 美股 session 漲跌幅由 Worker 正規化：
  - 日盤：目前價 vs 前一個日盤收盤
  - 盤前/夜盤：目前價 vs 最新日盤收盤
- 台股題材使用 TWSE MIS 批次查價，失敗 fallback Yahoo。
- 加入 Worker 記憶體快取，降低切頁/重新整理導致的資料不穩。
- 題材 5 分鐘更新；自選與大盤 5 秒更新。
- VIXTWN 多資料源嘗試：TWSE MIS → WantGoo。若來源擋 Cloudflare，會顯示錯誤來源。
- 景氣燈號嘗試國發會資料源；若端點或欄位不可讀，明確標示備援資料。
