# Anjou Terminal v5.0 RC4 - VIXTWN / NDC Source Fix

依照你提供的網址修正：
- VIXTWN 改抓 https://www.wantgoo.com/index/vixtwn
- 景氣訊號燈改抓 https://index.ndc.gov.tw/n/zh_tw
- 景氣燈 fallback 更新為截圖的 2026年5月 紅燈 39分；前期 2026年4月 紅燈 40分

需要更新：
- Cloudflare Worker：cloudflare-worker/worker.js
- 若你已使用 RC3 前端，GitHub 前端不用動。

測試：
/health
/api/quotes?symbols=VIXTWN
/api/econ-light
/api/tw-index
