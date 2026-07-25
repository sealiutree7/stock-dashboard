# Anjou Terminal v5.4 Browser Automation Proxy

v5.3 的 requests 仍被來源站擋，所以這版改成真正開 Chromium 瀏覽器讀資料。

## 執行
```bat
cd python-proxy
run_playwright.bat
```

第一次會安裝 Chromium，會比較久。

## 測試
```text
http://127.0.0.1:5050/health
http://127.0.0.1:5050/api/vixtwn
http://127.0.0.1:5050/api/econ-light
```

前端沿用 v5.3 架構，會優先走本機 Python Proxy。
