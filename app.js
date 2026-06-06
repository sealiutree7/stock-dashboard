const INDEXES=[
  {label:"S&P 500",symbol:"SPY"},
  {label:"NASDAQ",symbol:"QQQ"},
  {label:"DOW",symbol:"DIA"},
  {label:"Russell 2000",symbol:"IWM"},
  {label:"Semiconductor",symbol:"SOXX"},
  {label:"VIX Proxy",symbol:"VXX"}
];

const SECTORS=[
  {name:"AI GPU / Accelerator",desc:"AI 訓練與推論核心",symbols:["NVDA","AMD","AVGO"]},
  {name:"Hyperscaler / Cloud",desc:"雲端資本支出與 AI 平台",symbols:["MSFT","GOOGL","AMZN","META"]},
  {name:"Semiconductor ETF",desc:"半導體整體資金流",symbols:["SOXX","SMH","NVDA","AMD","AVGO","MU","TSM"]},
  {name:"Memory / HBM",desc:"AI 伺服器記憶體週期",symbols:["MU","WDC","STX","NVDA"]},
  {name:"EV / Robotaxi",desc:"車用 AI 與自駕題材",symbols:["TSLA","NVDA","AMD"]},
  {name:"Foundry / ASIC",desc:"晶圓代工與 ASIC 供應鏈",symbols:["TSM","AVGO","NVDA"]},
  {name:"Broad Market",desc:"大盤風險偏好",symbols:["SPY","QQQ","DIA","IWM"]},
  {name:"Volatility",desc:"市場避險與波動",symbols:["VXX"]}
];

const $=id=>document.getElementById(id);
let activeSymbol="SATL";
let activeInterval="5";
let tvScriptCounter=0;
let refreshTimer=null;
let lastPrices={};
let quoteStore={};
const AUTO_REFRESH_MS=5000;

function apiBase(){return $("apiBase").value.trim().replace(/\/$/,"")}
function symbols(){return $("symbols").value.split(",").map(s=>s.trim().toUpperCase()).filter(Boolean)}
function fmt(n,d=2){const x=Number(n);return Number.isFinite(x)?x.toFixed(d):"--"}
function cls(v){return v>0?"up":v<0?"down":"flat"}
function changeHtml(ch,pct){
  if(ch===null||ch===undefined||pct===null||pct===undefined)return `<span class="flat">--</span>`;
  const sign=ch>0?"+":"";
  return `<span class="${cls(ch)}">${sign}${fmt(ch)} (${sign}${fmt(pct)}%)</span>`;
}
async function api(path){
  if(!apiBase())throw new Error("請先填 Cloudflare Worker API URL");
  const sep=path.includes("?")?"&":"?";
  const r=await fetch(`${apiBase()}${path}${sep}_=${Date.now()}`);
  const j=await r.json();
  if(!j.ok)throw new Error(j.error||"API error");
  return j.data;
}
function flashClass(symbol, price){
  const p=Number(price), old=lastPrices[symbol];
  if(!Number.isFinite(p))return "";
  if(old===undefined){lastPrices[symbol]=p;return ""}
  if(p===old)return "";
  lastPrices[symbol]=p;
  return p>old?"flash-up":"flash-down";
}
function renderChips(){
  const syms=symbols();
  $("chips").innerHTML=syms.map(s=>`<button class="chip ${s===activeSymbol?"active":""}" data-symbol="${s}">${s}</button>`).join("");
  document.querySelectorAll(".chip").forEach(c=>c.onclick=()=>selectSymbol(c.dataset.symbol));
}
function segBox(title,obj){
  const val=obj?(obj.last ?? obj.price):null;
  return `<div class="seg"><div class="seg-title">${title}</div><div class="seg-val">${fmt(val)}</div></div>`;
}
function quoteCard(label,q){
  quoteStore[q.symbol]=q;
  const m=q.main||{},c=q.compare||{};
  const flash=flashClass(q.symbol,m.price);
  return `<div class="card ${flash}" data-symbol="${q.symbol}">
    <div class="symbol"><span>${label}</span><span>${q.symbol}</span></div>
    <div class="session-line">目前：<span class="session-badge">${m.label||"--"}</span></div>
    <div class="price ${flash}">${fmt(m.price)}</div>
    <div class="change ${cls(m.change)}">${changeHtml(m.change,m.pct)}</div>
    <div class="time-note">${m.time?new Date(m.time).toLocaleString():""}</div>
    <div class="compare-box">
      <div class="session-line">同時參考：${c.label||"--"}</div>
      <div class="compare-main"><span class="compare-price">${fmt(c.price)}</span><span class="${cls(c.change)}">${changeHtml(c.change,c.pct)}</span></div>
      <div class="time-note">${c.time?new Date(c.time).toLocaleString():"沒有資料時顯示 --"}</div>
    </div>
    <div class="segment-grid">
      ${segBox("盤前最後",q.segments?.pre)}
      ${segBox("日盤收盤",q.segments?.dayClose)}
      ${segBox("夜盤最後",q.segments?.nightClose)}
    </div>
    <div class="card-meta">Source ${q.source}<br/>Updated ${q.updatedAt?new Date(q.updatedAt).toLocaleTimeString():"--"}</div>
  </div>`;
}
async function renderCards(id,items){
  const syms=items.map(x=>x.symbol||x);
  const labels=Object.fromEntries(items.map(x=>[x.symbol||x,x.label||x]));
  const el=$(id);
  const data=await api(`/api/session-quotes?symbols=${encodeURIComponent(syms.join(","))}`);
  $("session").textContent=data.session?.label||"Session";
  const res=data.results||[];
  el.innerHTML=res.map(item=>item.ok?quoteCard(labels[item.quote.symbol]||item.quote.symbol,item.quote):`<div class="card"><div class="symbol"><span>${item.symbol}</span><span>Error</span></div><div class="card-meta">${item.error}</div></div>`).join("");
  el.querySelectorAll(".card[data-symbol]").forEach(c=>c.onclick=()=>selectSymbol(c.dataset.symbol));
}
function computeHeat(){
  const all=Object.values(quoteStore).filter(x=>Number.isFinite(Number(x.main?.pct)));
  const up=all.filter(x=>x.main.pct>0).length,total=all.length;
  const breadth=total?up/total*100:0;
  const top=[...all].sort((a,b)=>(b.main?.pct??-999)-(a.main?.pct??-999))[0];
  $("breadth").textContent=total?`${fmt(breadth,1)}%`:"--";
  $("marketMode").textContent=breadth>=70?"全面偏多":breadth>=50?"結構輪動":"資金保守";
  $("marketModeDesc").textContent=total?`上漲 ${up}/${total} 檔`:"--";
  if(top){$("topStock").textContent=top.symbol;$("topStockDesc").textContent=`${fmt(top.main.price)}｜${top.main.pct>0?"+":""}${fmt(top.main.pct)}%`}

  const stats=SECTORS.map(sec=>{
    const qs=sec.symbols.map(s=>quoteStore[s]).filter(Boolean);
    const pcts=qs.map(q=>Number(q.main?.pct)).filter(Number.isFinite);
    const avg=pcts.length?pcts.reduce((a,b)=>a+b,0)/pcts.length:null;
    const ups=pcts.filter(x=>x>0).length;
    const strong=pcts.filter(x=>x>=2).length;
    const score=avg===null?-999:avg*1.6+(pcts.length?ups/pcts.length*100:0)*.025+strong*.5;
    return {...sec,avg,ups,count:pcts.length,score};
  }).filter(s=>s.count>0).sort((a,b)=>b.score-a.score);

  if(stats[0]){
    $("topSector").textContent=stats[0].name;
    $("topSectorDesc").textContent=`平均 ${stats[0].avg>0?"+":""}${fmt(stats[0].avg)}%｜上漲 ${stats[0].ups}/${stats[0].count}`;
  }
  $("sectorRank").innerHTML=stats.map((s,i)=>`<div class="rank-pill ${i===0?"hot":i<=2?"warm":""}">#${i+1} <strong>${s.name}</strong><br>${s.avg>0?"+":""}${fmt(s.avg)}%｜${s.ups}/${s.count} 上漲</div>`).join("");
  renderSupplyMap(stats);
}
function renderSupplyMap(stats=[]){
  const statMap=Object.fromEntries(stats.map(s=>[s.name,s]));
  $("supplyMap").innerHTML=SECTORS.map(sec=>{
    const st=statMap[sec.name];
    const pct=st&&st.avg!==null?`${st.avg>0?"+":""}${fmt(st.avg)}%`:"--";
    return `<div class="sector-box ${sec.symbols.includes(activeSymbol)?"active":""}" data-sector="${sec.name}">
      <div class="sector-title">${sec.name} <span class="${st?cls(st.avg):"flat"}">${pct}</span></div>
      <div class="sector-desc">${sec.desc}</div>
      <div class="sector-tickers">${sec.symbols.map(s=>`<span class="ticker-pill">${s}</span>`).join("")}</div>
    </div>`;
  }).join("");
  document.querySelectorAll(".sector-box").forEach(box=>box.onclick=()=>{
    const sec=SECTORS.find(x=>x.name===box.dataset.sector);
    if(sec){$("symbols").value=sec.symbols.join(", ");localStorage.setItem("watchlist",$("symbols").value);refreshAll();}
  });
}
function tvSymbol(symbol){return `NASDAQ:${symbol}`}
function renderTradingView(symbol){
  activeSymbol=symbol;
  $("chartTitle").textContent=`${symbol} TradingView Chart`;
  renderChips();
  const container=$("tvChart");
  container.innerHTML="";
  const widgetId=`tv-widget-${++tvScriptCounter}`;
  const inner=document.createElement("div");
  inner.id=widgetId;inner.style.height="100%";inner.style.width="100%";
  container.appendChild(inner);
  const script=document.createElement("script");
  script.type="text/javascript";
  script.src="https://s3.tradingview.com/tv.js";
  script.onload=()=>new TradingView.widget({
    autosize:true,symbol:tvSymbol(symbol),interval:activeInterval,timezone:"America/New_York",theme:"dark",style:"1",locale:"zh_TW",
    toolbar_bg:"#0f172a",enable_publishing:false,allow_symbol_change:true,hide_side_toolbar:false,withdateranges:true,details:true,
    studies:["Volume@tv-basicstudies","RSI@tv-basicstudies","MACD@tv-basicstudies"],container_id:widgetId
  });
  container.appendChild(script);
}
function selectSymbol(symbol){activeSymbol=symbol;renderTradingView(symbol);computeHeat();}
async function refreshAll(){
  localStorage.setItem("apiBase",$("apiBase").value.trim());
  localStorage.setItem("watchlist",$("symbols").value);
  $("refreshStatus").textContent="Auto tracking...";
  try{
    renderChips();
    await renderCards("indexCards",INDEXES);
    await renderCards("stockCards",symbols());
    computeHeat();
    $("refreshStatus").textContent=`Auto updated ${new Date().toLocaleTimeString()} · 5s`;
  }catch(e){
    $("refreshStatus").textContent=`Error: ${e.message}`;
  }
}
function startAuto(){
  if(refreshTimer)clearInterval(refreshTimer);
  refreshTimer=setInterval(refreshAll,AUTO_REFRESH_MS);
}
$("apiBase").value=localStorage.getItem("apiBase")||"";
$("symbols").value=localStorage.getItem("watchlist")||$("symbols").value;
$("refreshBtn").onclick=refreshAll;
document.querySelectorAll(".mini").forEach(b=>b.onclick=()=>{activeInterval=b.dataset.interval;document.querySelectorAll(".mini").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderTradingView(activeSymbol)});
renderSupplyMap();
renderChips();
renderTradingView(activeSymbol);
refreshAll();
startAuto();
