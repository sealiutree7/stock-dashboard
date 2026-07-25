# Anjou Terminal v6.1 Ultimate

修正：
- Worker URL 空白時不再讓台股大盤整區消失。
- 台股大盤優先走 Python Proxy `/api/tw-index`，失敗才走 Worker。
- VIXTWN 完全獨立，優先走 Python Proxy `/api/vixtwn`。
- 景氣訊號燈維持 Playwright Proxy `/api/econ-light`。
- 股票價格流程不動。

更新 GitHub Pages：
- frontend/app.js
- frontend/style.css
- frontend/index.html

更新/重開 Python Proxy：
```powershell
cd python-proxy
.\run_playwright.bat
```

確認：
- http://127.0.0.1:5050/api/tw-index
- http://127.0.0.1:5050/api/vixtwn
- http://127.0.0.1:5050/api/econ-light

最後 GitHub Pages 按 Ctrl+F5。
