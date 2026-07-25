# Anjou Terminal v6.2 Localhost PNA Fix

修正 GitHub Pages 讀不到本機 Python Proxy 的問題。

原因：
HTTPS GitHub Pages 呼叫 `http://127.0.0.1:5050` 可能被 Chrome Private Network Access / CORS 擋下，前端會顯示 `Failed to fetch`。

修正：
- Python Proxy 新增：
  - Access-Control-Allow-Origin: *
  - Access-Control-Allow-Private-Network: true
  - OPTIONS preflight route
- 前端依序嘗試：
  - http://127.0.0.1:5050
  - http://localhost:5050

更新：
- frontend/app.js
- frontend/style.css
- frontend/index.html
- python-proxy/app.py

請關掉舊 PowerShell server，重新跑：
```powershell
cd python-proxy
.\run_playwright.bat
```

測：
- http://127.0.0.1:5050/api/tw-index
- http://127.0.0.1:5050/api/vixtwn
- http://127.0.0.1:5050/api/econ-light

最後 GitHub Pages 按 Ctrl+F5。
