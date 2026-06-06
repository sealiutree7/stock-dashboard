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
{name:"半導體權值",desc:"晶圓代工 IC 設計",symbols:["2330","2454","3034","2379","3443","3661"]},
{name:"ABF / PCB",desc:"載板、PCB、CCL",symbols:["3037","8046","3189","2368","2383","6213"]},
{name:"矽光子 / CPO",desc:"光通訊與 CPO",symbols:["6442","3450","4979","6531","3081"]},
{name:"記憶體",desc:"DRAM / NAND",symbols:["2408","2344","2337","8299","3260"]},
{name:"電源 / 散熱",desc:"電源、散熱與機構",symbols:["2308","3017","3324","8996","2421"]},
{name:"機器人",desc:"機器人與自動化",symbols:["2049","2359","4566","1590","4576"]},
{name:"玻璃基板",desc:"玻璃基板 / TGV 供應鏈",symbols:["3149","8027","6207","3131","3583","3455","4760"]}
];
const TW_NAMES={
"2330":"台積電","2454":"聯發科","2308":"台達電","2317":"鴻海","3443":"創意","3661":"世芯-KY","2379":"瑞昱","3034":"聯詠","6669":"緯穎","4763":"材料-KY","3450":"聯鈞","6531":"愛普*","2382":"廣達","3231":"緯創","3017":"奇鋐","3324":"雙鴻","2356":"英業達","3037":"欣興","8046":"南電","3189":"景碩","2368":"金像電","2383":"台光電","6213":"聯茂","6442":"光聖","4979":"華星光","3081":"聯亞","2408":"南亞科","2344":"華邦電","2337":"旺宏","8299":"群聯","3260":"威剛","8996":"高力","2421":"建準","2049":"上銀","2359":"所羅門","4566":"時碩工業","1590":"亞德客-KY","4576":"大銀微系統","3149":"正達","8027":"鈦昇","6207":"雷科","3131":"弘塑","3583":"辛耘","3455":"由田","4760":"勤凱"
};
const $=id=>document.getElementById(id);let activeUS="NVDA",activeTW="2330",usStore={},twStore={},usThemeStore={},twThemeStore={};
function apiBase(){return $("apiBase").value.trim().replace(/\/$/,"")}function list(id){return $(id).value.split(",").map(s=>s.trim().toUpperCase()).filter(Boolean)}function fmt(n,d=2){const x=Number(n);return Number.isFinite(x)?x.toFixed(d):"--"}function cls(v){return v>0?"up":v<0?"down":"flat"}function changeHtml(ch,pct){if(ch===null||ch===undefined||pct===null||pct===undefined)return `<span class="flat">--</span>`;const sign=ch>0?"+":"";return `<span class="${cls(ch)}">${sign}${fmt(ch)} (${sign}${fmt(pct)}%)</span>`}async function api(path){if(!apiBase())throw new Error("請先填 Cloudflare Worker API URL");const sep=path.includes("?")?"&":"?";const r=await fetch(`${apiBase()}${path}${sep}_=${Date.now()}`);const j=await r.json();if(!j.ok)throw new Error(j.error||"API error");return j.data}function uniq(a){return [...new Set(a)]}
function init(){document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));$(b.dataset.page).classList.add("active");});$("apiBase").value=localStorage.getItem("apiBase")||"";$("usSymbols").value=localStorage.getItem("usSymbols")||$("usSymbols").value;$("twSymbols").value=localStorage.getItem("twSymbols")||$("twSymbols").value;$("refreshBtn").onclick=refreshAll;themeMap("us",US_THEMES,[]);themeMap("tw",TW_THEMES,[]);chips("usChips",list("usSymbols"),"us");chips("twChips",list("twSymbols"),"tw");renderUSTV(activeUS);renderTWTV(activeTW);refreshAll();setInterval(refreshAll,5000);
document.body.addEventListener("click",e=>{
  const rank=e.target.closest(".rank-pill");
  if(rank){
    focusTheme(rank.dataset.prefix, rank.dataset.themeName, rank.dataset.symbols);
    return;
  }
  const box=e.target.closest(".theme-box");
  if(box){
    switchTheme(box.dataset.prefix,box.dataset.symbols);
    return;
  }
});
}
function chips(elId,symbols,type){$(elId).innerHTML=symbols.map(s=>`<button class="chip" data-type="${type}" data-symbol="${s}">${type==="tw"?(TW_NAMES[s]||s):s}</button>`).join("");document.querySelectorAll(`#${elId} .chip`).forEach(c=>c.onclick=()=>type==="us"?selectUS(c.dataset.symbol):selectTW(c.dataset.symbol))}
function seg(title,obj){const val=obj?(obj.last??obj.price):null;return `<div class="seg"><div class="seg-title">${title}</div><div class="seg-val">${fmt(val)}</div></div>`}
function usCard(label,q){usStore[q.symbol]=q;const m=q.main||{};return `<div class="card" data-symbol="${q.symbol}"><div class="symbol"><span>${label}</span><span>${q.symbol}</span></div><div class="session-line">目前：<span class="session-badge">${m.label||"--"}</span></div><div class="price">${fmt(m.price)}</div><div class="change">${changeHtml(m.change,m.pct)}</div><div class="segment-grid">${seg("盤前最後",q.segments?.pre)}${seg("日盤收盤",q.segments?.dayClose)}${seg("夜盤最後",q.segments?.nightClose)}</div><div class="card-meta">Updated ${q.updatedAt?new Date(q.updatedAt).toLocaleTimeString():"--"}</div></div>`}
function twCard(q){twStore[q.code]=q;const name=TW_NAMES[q.code]||q.name||q.code;return `<div class="card" data-code="${q.code}" data-market="${q.market}"><div class="symbol"><span>${name}</span><span>${q.code}</span></div><div class="session-line">市場：<span class="session-badge">${q.market||"--"}</span></div><div class="price">${fmt(q.price)}</div><div class="change">${changeHtml(q.change,q.changePercent)}</div><div class="card-meta">Open ${fmt(q.open)} · Prev ${fmt(q.previousClose)}<br/>High ${fmt(q.high)} · Low ${fmt(q.low)}<br/>${q.time||""}</div></div>`}
async function loadUS(){const syms=list("usSymbols");chips("usChips",syms,"us");const data=await api(`/api/session-quotes?symbols=${encodeURIComponent(syms.join(","))}`);$("session").textContent=data.session?.label||"Session";usStore={};$("usCards").innerHTML=(data.results||[]).map(x=>x.ok?usCard(x.quote.symbol,x.quote):`<div class="card"><div class="symbol"><span>${x.symbol}</span><span>Error</span></div><div class="card-meta">${x.error}</div></div>`).join("");document.querySelectorAll("#usCards .card[data-symbol]").forEach(c=>c.onclick=()=>selectUS(c.dataset.symbol));}
async function loadTW(){const codes=list("twSymbols");chips("twChips",codes,"tw");const data=await api(`/api/tw-yahoo-quotes?codes=${encodeURIComponent(codes.join(","))}`);twStore={};$("twCards").innerHTML=Object.values(data||{}).map(q=>q.ok?twCard(q):`<div class="card"><div class="symbol"><span>${TW_NAMES[q.code]||q.code}</span><span>Error</span></div><div class="card-meta">${q.error||"no data"}</div></div>`).join("");document.querySelectorAll("#twCards .card[data-code]").forEach(c=>c.onclick=()=>selectTW(c.dataset.code,c.dataset.market));}
async function loadThemeUniverses(){const usCodes=uniq(US_THEMES.flatMap(t=>t.symbols));const twCodes=uniq(TW_THEMES.flatMap(t=>t.symbols));const [usData,twData]=await Promise.all([api(`/api/session-quotes?symbols=${encodeURIComponent(usCodes.join(","))}`),api(`/api/tw-yahoo-quotes?codes=${encodeURIComponent(twCodes.join(","))}`)]);usThemeStore={};(usData.results||[]).forEach(x=>{if(x.ok)usThemeStore[x.quote.symbol]=x.quote});twThemeStore={};Object.values(twData||{}).forEach(q=>{if(q.ok)twThemeStore[q.code]=q});heat("us",US_THEMES,usThemeStore);heat("tw",TW_THEMES,twThemeStore);}
function heat(prefix,themes,store){const vals=Object.values(store).map(q=>({symbol:q.symbol||q.code,name:prefix==="tw"?(TW_NAMES[q.code]||q.name||q.code):(q.symbol||q.code),price:q.main?.price??q.price,pct:q.main?.pct??q.changePercent})).filter(x=>Number.isFinite(Number(x.pct)));const up=vals.filter(x=>x.pct>0).length,total=vals.length,b=total?up/total*100:0;const top=[...vals].sort((a,b)=>b.pct-a.pct)[0];$(`${prefix}Breadth`).textContent=total?`${fmt(b,1)}%`:"--";$(`${prefix}MarketMode`).textContent=b>=70?"全面偏多":b>=50?"結構輪動":"資金保守";$(`${prefix}MarketModeDesc`).textContent=total?`上漲 ${up}/${total} 檔`:"--";if(top){$(`${prefix}TopStock`).textContent=top.name;$(`${prefix}TopStockDesc`).textContent=`${fmt(top.price)}｜${top.pct>0?"+":""}${fmt(top.pct)}%`;}const stats=themes.map(t=>{const p=t.symbols.map(s=>store[s]).filter(Boolean).map(q=>Number(q.main?.pct??q.changePercent)).filter(Number.isFinite);const avg=p.length?p.reduce((a,b)=>a+b,0)/p.length:null;const ups=p.filter(x=>x>0).length;return {...t,avg,ups,count:p.length,score:avg===null?-999:avg*1.6+(p.length?ups/p.length*100:0)*.025};}).filter(x=>x.count>0).sort((a,b)=>b.score-a.score);if(stats[0]){$(`${prefix}TopTheme`).textContent=stats[0].name;$(`${prefix}TopThemeDesc`).textContent=`平均 ${stats[0].avg>0?"+":""}${fmt(stats[0].avg)}%｜上漲 ${stats[0].ups}/${stats[0].count}`;}$(`${prefix}ThemeRank`).innerHTML=stats.map((s,i)=>`<div class="rank-pill ${i===0?"hot":i<=2?"warm":""}" data-prefix="${prefix}" data-theme-name="${s.name}" data-symbols="${s.symbols.join(", ")}">#${i+1} <strong>${s.name}</strong><br>${s.avg>0?"+":""}${fmt(s.avg)}%｜${s.ups}/${s.count} 上漲</div>`).join("");themeMap(prefix,themes,stats);}

function focusTheme(prefix, themeName, symbols){
  const themes = prefix==="us" ? US_THEMES : TW_THEMES;
  const store = prefix==="us" ? usThemeStore : twThemeStore;
  const theme = themes.find(t=>t.name===themeName);
  if(!theme) return;

  const qs = theme.symbols.map(s=>store[s]).filter(Boolean);
  const pcts = qs.map(q=>Number(q.main?.pct ?? q.changePercent)).filter(Number.isFinite);
  const avg = pcts.length ? pcts.reduce((a,b)=>a+b,0)/pcts.length : null;
  const ups = pcts.filter(x=>x>0).length;

  const top = qs.map(q=>({
    symbol:q.symbol||q.code,
    name:prefix==="tw"?(TW_NAMES[q.code]||q.name||q.code):(q.symbol||q.code),
    price:q.main?.price??q.price,
    pct:q.main?.pct??q.changePercent
  })).filter(x=>Number.isFinite(Number(x.pct))).sort((a,b)=>b.pct-a.pct)[0];

  $(`${prefix}TopTheme`).textContent = theme.name;
  $(`${prefix}TopThemeDesc`).textContent = avg===null ? "這個題材目前沒有資料" : `平均 ${avg>0?"+":""}${fmt(avg)}%｜上漲 ${ups}/${pcts.length}`;

  if(top){
    $(`${prefix}TopStock`).textContent = top.name;
    $(`${prefix}TopStockDesc`).textContent = `${fmt(top.price)}｜${top.pct>0?"+":""}${fmt(top.pct)}%`;
  }

  document.querySelectorAll(`#${prefix}ThemeRank .rank-pill`).forEach(x=>{
    x.classList.toggle("selected", x.dataset.themeName===themeName);
  });
  document.querySelectorAll(`#${prefix}ThemeMap .theme-box`).forEach(x=>{
    x.classList.toggle("selected", x.dataset.themeName===themeName);
  });
}

function switchTheme(prefix,symbols){if(prefix==="us"){$("usSymbols").value=symbols;loadUS();}else{$("twSymbols").value=symbols;loadTW();}}
function themeMap(prefix,themes,stats=[]){const sm=Object.fromEntries(stats.map(s=>[s.name,s]));$(`${prefix}ThemeMap`).innerHTML=themes.map(t=>{const st=sm[t.name];const pct=st&&st.avg!==null?`${st.avg>0?"+":""}${fmt(st.avg)}%`:"--";return `<div class="theme-box" data-prefix="${prefix}" data-theme-name="${t.name}" data-symbols="${t.symbols.join(", ")}"><div class="theme-title">${t.name} <span class="${st?cls(st.avg):"flat"}">${pct}</span></div><div class="theme-desc">${t.desc}</div><div class="theme-tickers">${t.symbols.map(s=>`<span class="ticker-pill">${prefix==="tw"?(TW_NAMES[s]||s):s}</span>`).join("")}</div></div>`}).join("");}
function renderWidget(containerId,titleId,symbol,titleText){$(titleId).textContent=titleText;const c=$(containerId);c.innerHTML="";const id=`tv-${containerId}-${Date.now()}`;const inner=document.createElement("div");inner.id=id;inner.style.height="100%";inner.style.width="100%";c.appendChild(inner);const script=document.createElement("script");script.src="https://s3.tradingview.com/tv.js";script.onload=()=>new TradingView.widget({autosize:true,symbol,interval:"D",timezone:"Asia/Taipei",theme:"dark",style:"1",locale:"zh_TW",toolbar_bg:"#0f172a",enable_publishing:false,allow_symbol_change:true,hide_side_toolbar:false,withdateranges:true,details:true,studies:["Volume@tv-basicstudies","RSI@tv-basicstudies","MACD@tv-basicstudies"],container_id:id});c.appendChild(script);}
function renderUSTV(s){activeUS=s;renderWidget("usTvChart","usChartTitle",`NASDAQ:${s}`,`${s} TradingView Chart`)}
function renderTWTV(code,market){activeTW=code;const m=market==="上櫃"?"TPEX":"TWSE";renderWidget("twTvChart","twChartTitle",`${m}:${code}`,`${code} ${TW_NAMES[code]||""} TradingView Chart`)}
function selectUS(s){renderUSTV(s)}function selectTW(code,market){renderTWTV(code,market||twStore[code]?.market)}
async function refreshAll(){localStorage.setItem("apiBase",$("apiBase").value.trim());localStorage.setItem("usSymbols",$("usSymbols").value);localStorage.setItem("twSymbols",$("twSymbols").value);$("refreshStatus").textContent="Updating...";try{await Promise.all([loadUS(),loadTW()]);await loadThemeUniverses();$("refreshStatus").textContent=`Auto updated ${new Date().toLocaleTimeString()} · 5s`;}catch(e){$("refreshStatus").textContent=`Error: ${e.message}`;}}
init();
