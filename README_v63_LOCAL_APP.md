# Anjou Terminal v6.3 Local App

GitHub Pages 是 HTTPS，本機 Python Proxy 是 HTTP，Chrome 可能會擋掉跨來源 localhost fetch，導致一直 `Failed to fetch`。

這版改成 Python Proxy 同時提供前端頁面與 API，全部同源：

Dashboard:
http://127.0.0.1:5050/

API:
http://127.0.0.1:5050/api/vixtwn
http://127.0.0.1:5050/api/econ-light
http://127.0.0.1:5050/api/tw-index

## 更新
覆蓋：
- frontend/app.js
- frontend/style.css
- frontend/index.html
- python-proxy/app.py

## 執行
關掉舊 PowerShell server，重新跑：
```powershell
cd python-proxy
.\run_playwright.bat
```

## 重點
測 VIXTWN / 景氣燈時，請改開：
http://127.0.0.1:5050/

不要用 GitHub Pages 測這兩個本機 Proxy 功能。
