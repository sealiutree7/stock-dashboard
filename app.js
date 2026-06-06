const US_THEMES=[
  {name:"AI GPU / Accelerator",desc:"AI 訓練與推論核心",symbols:["NVDA","AMD","AVGO","ARM","SMCI"]},
  {name:"Semiconductor",desc:"半導體整體資金流",symbols:["SOXX","SMH","NVDA","AMD","AVGO","MU","TSM","INTC"]},
  {name:"Cloud / Software AI",desc:"雲端資本支出與 AI 平台",symbols:["MSFT","GOOGL","AMZN","META","PLTR","SNOW","ORCL"]},
  {name:"EV / Robotaxi",desc:"自駕與機器人題材",symbols:["TSLA","NVDA","AMD","GOOGL"]},
  {name:"Crypto",desc:"加密貨幣與交易所",symbols:["COIN","MSTR","MARA","RIOT","IBIT"]},
  {name:"Energy",desc:"能源、核電、電力",symbols:["XLE","CCJ","CEG","VST","GEV"]},
  {name:"Financials",desc:"銀行與金融",symbols:["XLF","JPM","BAC","GS","MS"]},
  {name:"Volatility",desc:"避險與波動",symbols:["VXX","UVXY"]}
];

const TW_THEMES=[
  {name:"AI 伺服器",desc:"AI Server / ODM / 散熱",symbols:["2382","6669","3231","3017","3324","2356"]},
  {name:"半導體權值",desc:"晶圓代工與 IC 設計",symbols:["2330","2454","3034","2379","3443","3661"]},
  {name:"ABF / PCB",desc:"載板、PCB、CCL",symbols:["3037","8046","3189","2368","2383","6213"]},
  {name:"矽光子 / CPO",desc:"光通訊與 CPO",symbols:["6442","3450","4979","6531","3081"]},
  {name:"記憶體",desc:"DRAM / NAND",symbols:["2408","2344","2337","8299","3260"]},
  {name:"電源 / 散熱",desc:"電源、散熱與機構",symbols:["2308","3017","3324","8996","2421"]},
  {name:"機器人",desc:"機器人與自動化",symbols:["2049","2359","4566","1590","4576"]},
  {name:"玻璃基板",desc:"玻璃基板 / TGV 供應鏈",symbols:["3149","8027","6207","3131","3583","3455","4760"]}
];

const $=id=>document.getElementById(id);
let page="us";
let activeSymbol="NVDA";
let activeInterval="5";
let tvScriptCounter=0;
let refreshTimer=null;
let lastPrices={};
let usStore={},twStore={};
const AUTO_MS=5000;

function apiBase(){return $("apiBase").value.trim().replace(/\/$/,"")}
function list(id){return $(id).value.split(",").map(s=>s.trim().toUpperCase()).filter(Boolean)}
function fmt(n,d=2){const x=Number(n);return Number.isFinite(x)?x.toFixed(d):"--"}
function cls(v){return v>0?"up":v<0?"down":"flat"}
function changeHtml(ch,pct){if(ch===null||ch===undefined||pct===null||pct===undefined)return `<span class="flat">--</span>`;const sign=ch>0?"+":"";return `<span class="${cls(ch)}">${sign}${fmt(ch)} (${sign}${fmt(pct)}%)</span>`}
async function api(path){if(!apiBase())throw new Error("請先填 Cloudflare Worker API URL");const sep=path.includes("?")?"&":"?";const r=await fetch(`${apiBase()}${path}${sep}_=${Date.now()}`);const j=await r.json();if(!j.ok)throw new Error(j.error||"API error");return j.data}
function flash(key,price){const p=Number(price),old=lastPrices[key];if(!Number.isFinite(p))return "";if(old===undefined){lastPrices[key]=p;return ""}if(p===old)return "";lastPrices[key]=p;return p>old?"flash-up":"flash-down"}
function tabs(){document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));$(b.dataset.page).classList.add("active");page=b.dataset.page==="twPage"?"tw":"us";});}
function chips(elId,symbols){$(elId).innerHTML=symbols.map(s=>`<button class="chip ${s===activeSymbol?"active":""}" data-symbol="${s}">${s}</button>`).join("");document.querySelectorAll(`#${elId} .chip`).forEach(c=>c.onclick=()=>selectSymbol(c.dataset.symbol))}
function seg(title,obj){const val=obj?(obj.last??obj.price):null;return `<div class="seg"><div class="seg-title">${title}</div><div class="seg-val">${fmt(val)}</div></div>`}
function usCard(label,q){usStore[q.symbol]=q;const m=q.main||{};const f=flash("US:"+q.symbol,m.price);return `<div class="card ${f}" data-symbol="${q.symbol}"><div class="symbol"><span>${label}</span><span>${q.symbol}</span></div><div class="session-line">目前：<span class="session-badge">${m.label||"--"}</span></div><div class="price ${f}">${fmt(m.price)}</div><div class="change ${cls(m.change)}">${changeHtml(m.change,m.pct)}</div><div class="segment-grid">${seg("盤前最後",q.segments?.pre)}${seg("日盤收盤",q.segments?.dayClose)}${seg("夜盤最後",q.segments?.nightClose)}</div><div class="card-meta">Source ${q.source}<br/>Updated ${q.updatedAt?new Date(q.updatedAt).toLocaleTimeString():"--"}</div></div>`}
function twCard(q){twStore[q.code]=q;const f=flash("TW:"+q.code,q.price);return `<div class="card ${f}"><div class="symbol"><span>${q.name||q.code}</span><span>${q.code}</span></div><div class="session-line">市場：<span class="session-badge">${q.market||"--"}</span></div><div class="price ${f}">${fmt(q.price)}</div><div class="change ${cls(q.change)}">${changeHtml(q.change,q.changePercent)}</div><div class="card-meta">Open ${fmt(q.open)} · Prev ${fmt(q.previousClose)}<br/>High ${fmt(q.high)} · Low ${fmt(q.low)}<br/>${q.time||""}</div></div>`}
async function loadUS(){const syms=list("usSymbols");chips("usChips",syms);const data=await api(`/api/session-quotes?symbols=${encodeURIComponent(syms.join(","))}`);$("session").textContent=data.session?.label||"Session";$("usCards").innerHTML=(data.results||[]).map(x=>x.ok?usCard(x.quote.symbol,x.quote):`<div class="card"><div class="symbol"><span>${x.symbol}</span><span>Error</span></div><div class="card-meta">${x.error}</div></div>`).join("");document.querySelectorAll("#usCards .card[data-symbol]").forEach(c=>c.onclick=()=>selectSymbol(c.dataset.symbol));heat("us",US_THEMES,usStore);}
async function loadTW(){const codes=list("twSymbols");chips("twChips",codes);const data=await api(`/api/tw-quotes?codes=${encodeURIComponent(codes.join(","))}`);$("twCards").innerHTML=Object.values(data||{}).map(q=>q.ok?twCard(q):`<div class="card"><div class="symbol"><span>${q.code}</span><span>Error</span></div><div class="card-meta">${q.error||"no data"}</div></div>`).join("");heat("tw",TW_THEMES,twStore);}
function heat(prefix,themes,store){const vals=Object.values(store).map(q=>({symbol:q.symbol||q.code,name:q.name||q.symbol||q.code,price:q.main?.price??q.price,pct:q.main?.pct??q.changePercent})).filter(x=>Number.isFinite(Number(x.pct)));const up=vals.filter(x=>x.pct>0).length,total=vals.length,b=total?up/total*100:0;const top=[...vals].sort((a,b)=>b.pct-a.pct)[0];$(`${prefix}Breadth`).textContent=total?`${fmt(b,1)}%`:"--";$(`${prefix}MarketMode`).textContent=b>=70?"全面偏多":b>=50?"結構輪動":"資金保守";$(`${prefix}MarketModeDesc`).textContent=total?`上漲 ${up}/${total} 檔`:"--";if(top){$(`${prefix}TopStock`).textContent=top.name;$(`${prefix}TopStockDesc`).textContent=`${fmt(top.price)}｜${top.pct>0?"+":""}${fmt(top.pct)}%`;}
const stats=themes.map(t=>{const p=t.symbols.map(s=>store[s]).filter(Boolean).map(q=>Number(q.main?.pct??q.changePercent)).filter(Number.isFinite);const avg=p.length?p.reduce((a,b)=>a+b,0)/p.length:null;const ups=p.filter(x=>x>0).length;const score=avg===null?-999:avg*1.6+(p.length?ups/p.length*100:0)*.025;return {...t,avg,ups,count:p.length,score};}).filter(x=>x.count>0).sort((a,b)=>b.score-a.score);if(stats[0]){$(`${prefix}TopTheme`).textContent=stats[0].name;$(`${prefix}TopThemeDesc`).textContent=`平均 ${stats[0].avg>0?"+":""}${fmt(stats[0].avg)}%｜上漲 ${stats[0].ups}/${stats[0].count}`;}$(`${prefix}ThemeRank`).innerHTML=stats.map((s,i)=>`<div class="rank-pill ${i===0?"hot":i<=2?"warm":""}">#${i+1} <strong>${s.name}</strong><br>${s.avg>0?"+":""}${fmt(s.avg)}%｜${s.ups}/${s.count} 上漲</div>`).join("");themeMap(prefix,themes,stats);}
function themeMap(prefix,themes,stats=[]){const sm=Object.fromEntries(stats.map(s=>[s.name,s]));$(`${prefix}ThemeMap`).innerHTML=themes.map(t=>{const st=sm[t.name];const pct=st&&st.avg!==null?`${st.avg>0?"+":""}${fmt(st.avg)}%`:"--";return `<div class="theme-box" data-symbols="${t.symbols.join(", ")}"><div class="theme-title">${t.name} <span class="${st?cls(st.avg):"flat"}">${pct}</span></div><div class="theme-desc">${t.desc}</div><div class="theme-tickers">${t.symbols.map(s=>`<span class="ticker-pill">${s}</span>`).join("")}</div></div>`}).join("");document.querySelectorAll(`#${prefix}ThemeMap .theme-box`).forEach(b=>b.onclick=()=>{if(prefix==="us")$("usSymbols").value=b.dataset.symbols;else $("twSymbols").value=b.dataset.symbols;refreshAll();});}
function tvSymbol(symbol){return `NASDAQ:${symbol}`}
function renderTV(symbol){activeSymbol=symbol;$("chartTitle").textContent=`${symbol} TradingView Chart`;chips("usChips",list("usSymbols"));const c=$("tvChart");c.innerHTML="";const id=`tv-${++tvScriptCounter}`;const inner=document.createElement("div");inner.id=id;inner.style.height="100%";inner.style.width="100%";c.appendChild(inner);const script=document.createElement("script");script.src="https://s3.tradingview.com/tv.js";script.onload=()=>new TradingView.widget({autosize:true,symbol:tvSymbol(symbol),interval:activeInterval,timezone:"America/New_York",theme:"dark",style:"1",locale:"zh_TW",toolbar_bg:"#0f172a",enable_publishing:false,allow_symbol_change:true,hide_side_toolbar:false,withdateranges:true,details:true,studies:["Volume@tv-basicstudies","RSI@tv-basicstudies","MACD@tv-basicstudies"],container_id:id});c.appendChild(script);}
function selectSymbol(s){activeSymbol=s;renderTV(s);}
async function refreshAll(){localStorage.setItem("apiBase",$("apiBase").value.trim());localStorage.setItem("usSymbols",$("usSymbols").value);localStorage.setItem("twSymbols",$("twSymbols").value);$("refreshStatus").textContent="Updating...";try{await loadUS();await loadTW();$("refreshStatus").textContent=`Auto updated ${new Date().toLocaleTimeString()} · 5s`;}catch(e){$("refreshStatus").textContent=`Error: ${e.message}`;}}
document.querySelectorAll(".mini").forEach(b=>b.onclick=()=>{activeInterval=b.dataset.interval;document.querySelectorAll(".mini").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderTV(activeSymbol);});
$("apiBase").value=localStorage.getItem("apiBase")||"";$("usSymbols").value=localStorage.getItem("usSymbols")||$("usSymbols").value;$("twSymbols").value=localStorage.getItem("twSymbols")||$("twSymbols").value;$("refreshBtn").onclick=refreshAll;tabs();themeMap("us",US_THEMES);themeMap("tw",TW_THEMES);chips("usChips",list("usSymbols"));chips("twChips",list("twSymbols"));renderTV(activeSymbol);refreshAll();setInterval(refreshAll,AUTO_MS);
