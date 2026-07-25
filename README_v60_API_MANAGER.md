# Anjou Terminal v6.0 API Manager

這版把 VIXTWN 與景氣訊號燈改成單一 API Manager，避免舊流程覆蓋新資料。

## 重點
- 股票價格流程不動。
- VIXTWN：Python Proxy → Worker → Browser direct
- 景氣燈：Python Proxy → Worker → Browser direct

## 更新 GitHub Pages
覆蓋：
- frontend/app.js
- frontend/style.css
- frontend/index.html

## Python Proxy
沿用本包內 python-proxy：
```powershell
cd python-proxy
.\run_playwright.bat
```

先確認：
- http://127.0.0.1:5050/api/vixtwn
- http://127.0.0.1:5050/api/econ-light

再重整 GitHub Pages。若快取，按 Ctrl+F5。
