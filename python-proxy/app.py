from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import time, re, os

app = Flask(__name__)
CORS(app)
CACHE = {}

@app.after_request
def add_local_proxy_headers(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    resp.headers["Access-Control-Allow-Private-Network"] = "true"
    return resp

@app.route("/", defaults={"path": ""}, methods=["OPTIONS"])
@app.route("/<path:path>", methods=["OPTIONS"])
def options_preflight(path):
    return ("", 204)



def cached(key, ttl, fn):
    now = time.time()
    item = CACHE.get(key)
    if item and now - item["ts"] < ttl:
        return item["data"]
    data = fn()
    CACHE[key] = {"ts": now, "data": data}
    return data

def pct(price, base):
    if base in (None, 0): return None, None
    ch = price - base
    return ch, ch / base * 100

def light_name(score):
    score = float(score)
    if score <= 16: return "藍燈"
    if score <= 22: return "黃藍燈"
    if score <= 31: return "綠燈"
    if score <= 37: return "黃紅燈"
    return "紅燈"

def month_label(s):
    s = str(s)
    return "%s年%d月" % (s[:4], int(s[4:6]))

def run_browser(job):
    try:
        from playwright.sync_api import sync_playwright
    except Exception as e:
        raise Exception("Playwright 尚未安裝，請執行 run_playwright.bat。%s" % e)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--disable-blink-features=AutomationControlled", "--no-sandbox"])
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
            locale="zh-TW",
            timezone_id="Asia/Taipei",
            viewport={"width":1366,"height":900}
        )
        try:
            return job(context)
        finally:
            context.close()
            browser.close()


from pathlib import Path
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

@app.route("/")
def serve_local_dashboard():
    return send_from_directory(str(FRONTEND_DIR), "index.html")

@app.route("/app.js")
def serve_local_app_js():
    return send_from_directory(str(FRONTEND_DIR), "app.js")

@app.route("/style.css")
def serve_local_style_css():
    return send_from_directory(str(FRONTEND_DIR), "style.css")

@app.route("/frontend/<path:filename>")
def serve_local_frontend_file(filename):
    return send_from_directory(str(FRONTEND_DIR), filename)


@app.route("/api/config")
def api_config():
    return jsonify({"ok": True, "version": "Anjou Terminal v7.0 Cloud Deploy", "mode": "cloud"})

@app.route("/health")
def health():
    return jsonify({"ok": True, "message": "Anjou Terminal Browser Automation Proxy v5.4 running", "cacheSize": len(CACHE)})

@app.route("/api/vixtwn")
def vixtwn():
    def fetch_data():
        def job(context):
            page = context.new_page()
            cap = {"state": None, "candle": None}
            def on_response(resp):
                try:
                    u = resp.url.lower()
                    if "vixtwn" in u and "commoditystate" in u and resp.status in (200,304):
                        cap["state"] = resp.json()
                    if "vixtwn" in u and "minute-candlestick" in u and resp.status in (200,304):
                        cap["candle"] = resp.json()
                except Exception:
                    pass
            page.on("response", on_response)
            page.goto("https://www.wantgoo.com/index/vixtwn", wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(4500)

            price = base = open_v = high = low = None
            if cap["candle"]:
                c = cap["candle"][-1] if isinstance(cap["candle"], list) else cap["candle"]
                price = float(c.get("close"))
                open_v, high, low = c.get("open"), c.get("high"), c.get("low")
            if cap["state"]:
                s = cap["state"][-1] if isinstance(cap["state"], list) else cap["state"]
                if s.get("flat") is not None:
                    base = float(s.get("flat"))

            if price is None:
                text = page.locator("body").inner_text(timeout=10000)
                vals = [float(x) for x in re.findall(r"(?<!\d)(\d{1,2}\.\d{2})(?!\d)", text) if 5 < float(x) < 100]
                if vals: price = vals[0]
                m = re.search(r"昨收\s*(\d{1,2}\.\d{2})", text)
                if m: base = float(m.group(1))
                m = re.search(r"開盤\s*(\d{1,2}\.\d{2})", text)
                if m: open_v = float(m.group(1))
                m = re.search(r"最高\s*(\d{1,2}\.\d{2})", text)
                if m: high = float(m.group(1))
                m = re.search(r"最低\s*(\d{1,2}\.\d{2})", text)
                if m: low = float(m.group(1))

            if price is None:
                raise Exception("開啟 WantGoo 後仍找不到 VIXTWN 數值")
            ch, cp = pct(price, base)
            return {"ok": True, "symbol": "VIXTWN", "price": price, "base": base, "previousClose": base, "change": ch, "changePercent": cp, "open": open_v, "high": high, "low": low, "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "source": "Playwright WantGoo browser"}
        return run_browser(job)
    try:
        return jsonify({"ok": True, "data": cached("vixtwn", 15, fetch_data)})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 502

@app.route("/api/econ-light", methods=["GET","POST"])
def econ_light():
    def fetch_data():
        def job(context):
            page = context.new_page()
            cap = {"data": None}
            def on_response(resp):
                try:
                    if "json/lightscore" in resp.url.lower() and resp.status == 200:
                        cap["data"] = resp.json()
                except Exception:
                    pass
            page.on("response", on_response)
            page.goto("https://index.ndc.gov.tw/n/zh_tw", wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(3000)
            data = cap["data"]
            if not data:
                data = page.evaluate("""async () => {
                    const res = await fetch('/n/json/lightscore', {method:'POST', headers:{'Accept':'application/json,text/plain,*/*','Content-Type':'application/json;charset=UTF-8','X-Requested-With':'XMLHttpRequest'}, body:'{}'});
                    return await res.json();
                }""")
            line = [{"x":str(x["x"]), "y":float(x["y"])} for x in data.get("line", []) if "x" in x and "y" in x]
            if not line: raise Exception("國發會頁面開啟後仍找不到 lightscore")
            line.sort(key=lambda x:x["x"])
            cur, prev = line[-1], line[-2] if len(line) >= 2 else None
            return {"currentMonth": month_label(cur["x"]), "currentLight": light_name(cur["y"]), "currentScore": int(cur["y"]), "prevMonth": month_label(prev["x"]) if prev else "--", "prevLight": light_name(prev["y"]) if prev else "--", "prevScore": int(prev["y"]) if prev else None, "sourceMode": "Playwright 國發會 API", "marketRead": "中性偏多" if cur["y"]>=38 else "偏多觀望" if cur["y"]>=32 else "中性" if cur["y"]>=23 else "偏保守", "note": "Playwright 已讀取國發會 /n/json/lightscore", "nextPublish": data.get("next"), "source": "https://index.ndc.gov.tw/n/json/lightscore"}
        return run_browser(job)
    try:
        return jsonify({"ok": True, "data": cached("econ", 3600, fetch_data)})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 502


@app.route("/api/tw-index")
def tw_index_proxy():
    import requests, time, re
    UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    symbols = {"^TWII":"加權指數","^TWOII":"櫃買指數","^TEII":"電子指數"}

    def yahoo_chart(sym):
        url = "https://query1.finance.yahoo.com/v8/finance/chart/%s?range=5d&interval=1d" % sym
        r = requests.get(url, headers={"User-Agent":UA,"Accept":"application/json"}, timeout=10)
        if not r.ok:
            raise Exception("%s Yahoo HTTP %s" % (sym, r.status_code))
        data = r.json()["chart"]["result"][0]
        meta = data.get("meta", {})
        q = data.get("indicators", {}).get("quote", [{}])[0]
        closes = [x for x in q.get("close", []) if x is not None]
        opens = [x for x in q.get("open", []) if x is not None]
        highs = [x for x in q.get("high", []) if x is not None]
        lows = [x for x in q.get("low", []) if x is not None]
        price = float(meta.get("regularMarketPrice") or closes[-1])
        prev = float(meta.get("chartPreviousClose") or (closes[-2] if len(closes) >= 2 else price))
        ch = price - prev
        cp = ch / prev * 100 if prev else None
        return {"ok":True,"symbol":sym,"price":price,"base":prev,"previousClose":prev,"change":ch,"changePercent":cp,"open":float(opens[-1]) if opens else None,"high":float(highs[-1]) if highs else None,"low":float(lows[-1]) if lows else None,"updatedAt":time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),"source":"Python Proxy Yahoo Finance"}

    def txf_from_browser():
        try:
            def job(context):
                page = context.new_page()
                page.goto("https://tw.stock.yahoo.com/future/WTX%26", wait_until="domcontentloaded", timeout=60000)
                page.wait_for_timeout(2500)
                text = page.locator("body").inner_text(timeout=10000)
                nums = [float(x.replace(",", "")) for x in re.findall(r"(?<!\d)(\d{2,3},\d{3}\.00|\d{5}\.00)(?!\d)", text)]
                price = nums[0] if nums else None
                if price is None:
                    raise Exception("no txf price")
                return {"ok":True,"symbol":"TXF8","price":price,"base":None,"previousClose":None,"change":None,"changePercent":None,"open":None,"high":None,"low":None,"updatedAt":time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),"source":"Playwright Yahoo 股市台指期"}
            return run_browser(job)
        except Exception as e:
            return {"ok":False,"symbol":"TXF8","error":"台指期 Python fallback failed: %s" % e}

    def fetch_data():
        out = {}
        for sym, name in symbols.items():
            try:
                q = yahoo_chart(sym)
                q["name"] = name
                out[sym] = q
            except Exception as e:
                out[sym] = {"ok":False,"symbol":sym,"name":name,"error":str(e)}
        out["TXF8"] = txf_from_browser()
        out["VIXTWN"] = {"ok":False,"symbol":"VIXTWN","error":"frontend override"}
        return out

    try:
        return jsonify({"ok":True,"data":cached("tw-index",5,fetch_data)})
    except Exception as e:
        return jsonify({"ok":False,"error":str(e)}), 502

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5050")), debug=False)
