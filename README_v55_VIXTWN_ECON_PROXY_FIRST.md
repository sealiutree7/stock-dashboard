# Anjou Terminal v5.5 VIXTWN ECON Stable

這版只針對兩個重點：
- VIXTWN
- 景氣訊號燈

## 修改
前端固定優先呼叫本機 Python Proxy：
- http://127.0.0.1:5050/api/vixtwn
- http://127.0.0.1:5050/api/econ-light

股票價格部分不動。

## 更新 GitHub Pages
覆蓋：
- frontend/app.js
- frontend/style.css
- frontend/index.html

## 本機 Python Proxy
沿用 v5.4 的 python-proxy：
```powershell
cd python-proxy
.\run_playwright.bat
```
