# Anjou Terminal v7.0 Cloud Deploy

雲端部署版：手機可看，也可分享。

## 更新 GitHub Pages
覆蓋：
- frontend/app.js
- frontend/style.css
- frontend/index.html

## 部署 Python Proxy 到 Render
推到 GitHub 後，Render → New → Blueprint，選 repo，Render 會讀根目錄 `render.yaml`。

或手動 Web Service：
- Root Directory: `python-proxy`
- Build Command: `pip install -r requirements.txt && python -m playwright install chromium`
- Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120`
- Python Version: `3.10.13`

## 測試
部署完成後：
- `https://你的proxy.onrender.com/health`
- `https://你的proxy.onrender.com/api/vixtwn`
- `https://你的proxy.onrender.com/api/econ-light`
- `https://你的proxy.onrender.com/api/tw-index`

## GitHub Pages 指向雲端 Proxy
第一次打開加參數：
`https://sealiutree7.github.io/stock-dashboard/?proxy=https://你的proxy.onrender.com`

成功後會寫入 localStorage，之後可直接開 GitHub Pages。
