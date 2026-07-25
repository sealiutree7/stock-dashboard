# Anjou Terminal v5.3 Python Proxy

這是專門解決 Cloudflare Worker 被 WantGoo / 國發會擋掉 403 的本機 Python 代理。

## 執行
```bat
cd python-proxy
run.bat
```

或手動：
```bat
py -3.7 -m pip install -r requirements.txt
py -3.7 app.py
```

## 測試
打開：
- http://127.0.0.1:5050/health
- http://127.0.0.1:5050/api/vixtwn
- http://127.0.0.1:5050/api/econ-light

前端 v5.3 會先嘗試：
1. Browser direct
2. Python Proxy `http://127.0.0.1:5050`
3. Cloudflare Worker fallback

所以只要本機 Python Proxy 有開，VIXTWN 和景氣燈會優先走 Python。
