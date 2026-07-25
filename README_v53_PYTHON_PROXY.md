# Anjou Terminal v5.3 Python Proxy Hybrid

## 這版用途
Cloudflare Worker 和 GitHub Pages 直連都可能被 WantGoo / 國發會擋。
所以這版新增本機 Python Proxy：

資料順序：
1. Browser direct
2. Python Proxy http://127.0.0.1:5050
3. Cloudflare Worker fallback

## 更新 GitHub Pages
覆蓋：
- frontend/app.js
- frontend/style.css
- frontend/index.html

## 執行 Python Proxy
```bat
cd python-proxy
run.bat
```

## 測試
```text
http://127.0.0.1:5050/health
http://127.0.0.1:5050/api/vixtwn
http://127.0.0.1:5050/api/econ-light
```
