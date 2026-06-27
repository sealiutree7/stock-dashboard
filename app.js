const US_INDEX=["SPY","VOO","QQQ","DIA","IWM","SOXX","SMH"];
const DASH_SYMBOLS=["^VIX","BTC-USD","^TNX"];
const TW_INDEX=[
  {name:"加權指數",symbol:"^TWII",kind:"api"},
  {name:"櫃買指數",symbol:"^TWOII",kind:"api"},
  {name:"電子指數",symbol:"^TEII",kind:"api"},
  {name:"台指期近一 WTX&",symbol:"TXF8",kind:"api"},
  {name:"VIXTWN",symbol:"VIXTWN",kind:"api"}
];

const US_THEMES=[
{name:"AI GPU / Accelerator",desc:"AI 訓練與推論核心",symbols:["NVDA","AMD","AVGO","ARM","SMCI"]},
{name:"Semiconductor",desc:"半導體整體資金流",symbols:["SOXX","SMH","NVDA","AMD","AVGO","MU","TSM","INTC"]},
{name:"Cloud / Software AI",desc:"雲端資本支出與 AI 平台",symbols:["MSFT","GOOGL","AMZN","META","PLTR","SNOW","ORCL"]},
{name:"EV / Robotaxi",desc:"自駕與機器人題材",symbols:["TSLA","NVDA","AMD","GOOGL"]},
{name:"Crypto",desc:"加密貨幣與交易所",symbols:["COIN","MSTR","MARA","RIOT","IBIT"]},
{name:"Energy",desc:"能源、核電、電力",symbols:["XLE","CCJ","CEG","VST","GEV"]},
{name:"Financials",desc:"銀行與金融",symbols:["XLF","JPM","BAC","GS","MS"]},
{name:"Volatility",desc:"避險與波動",symbols:["^VIX","VXX","UVXY"]}
];

const TW_THEMES=[
{name:"AI 伺服器",desc:"AI Server / ODM / 散熱",symbols:["2382","6669","3231","3017","3324","2356"]},
{name:"半導體權值",desc:"晶圓代工 IC 設計",symbols:["2330","2454","3034","2379","3443","3661"]},
{name:"ABF / PCB",desc:"載板、PCB、CCL",symbols:["3037","8046","3189","2368","2383","6213"]},
{name:"矽光子 / CPO",desc:"光通訊與 CPO",symbols:["6442","3450","4979","6531","3081"]},
{name:"記憶體",desc:"DRAM / NAND",symbols:["2408","2344","2337","8299","3260"]},
{name:"電源 / 散熱",desc:"電源、散熱與機構",symbols:["2308","3017","3324","8996","2421"]},
{name:"機器人",desc:"機器人與自動化",symbols:["2049","2359","4566","1590","4576"]},
{name:"玻璃基板",desc:"玻璃基板 / TGV 供應鏈",symbols:["3149","8027","6207","3131","3583","3455","4760"]},
{name:"航運",desc:"貨櫃、散裝、航空",symbols:["2603","2609","2615","2605","2637","2610","2618"]},
{name:"鋼鐵",desc:"鋼鐵、不鏽鋼、特殊鋼",symbols:["2002","2027","2034","2014","2015"]},
{name:"塑化",desc:"塑化、PVC、化工",symbols:["1301","1303","1326","6505","1717"]},
{name:"金融",desc:"金控、銀行、保險",symbols:["2881","2882","2891","2886","2885","2884"]},
{name:"生技醫療",desc:"新藥、醫材、醫療服務",symbols:["6446","4743","4147","1783","4123"]},
{name:"觀光餐飲",desc:"觀光、餐飲、百貨",symbols:["2727","2731","5706","2707","2912"]},
{name:"軍工無人機",desc:"軍工、無人機、航太",symbols:["2634","8033","8222","4572","6753"]},
{name:"重電儲能",desc:"重電、電網、儲能",symbols:["1513","1504","1519","1609","1618"]}
];

const TW_NAMES={"2330":"台積電","2454":"聯發科","2308":"台達電","2317":"鴻海","3443":"創意","3661":"世芯-KY","2379":"瑞昱","3034":"聯詠","6669":"緯穎","4763":"材料-KY","3450":"聯鈞","6531":"愛普*","2382":"廣達","3231":"緯創","3017":"奇鋐","3324":"雙鴻","2356":"英業達","3037":"欣興","8046":"南電","3189":"景碩","2368":"金像電","2383":"台光電","6213":"聯茂","6442":"光聖","4979":"華星光","3081":"聯亞","2408":"南亞科","2344":"華邦電","2337":"旺宏","8299":"群聯","3260":"威剛","8996":"高力","2421":"建準","2049":"上銀","2359":"所羅門","4566":"時碩工業","1590":"亞德客-KY","4576":"大銀微系統","3149":"正達","8027":"鈦昇","6207":"雷科","3131":"弘塑","3583":"辛耘","3455":"由田","4760":"勤凱","2603":"長榮","2609":"陽明","2615":"萬海","2605":"新興","2637":"慧洋-KY","2610":"華航","2618":"長榮航","2002":"中鋼","2027":"大成鋼","2034":"允強","2014":"中鴻","2015":"豐興","1301":"台塑","1303":"南亞","1326":"台化","6505":"台塑化","1717":"長興","2881":"富邦金","2882":"國泰金","2891":"中信金","2886":"兆豐金","2885":"元大金","2884":"玉山金"};

const $=id=>document.getElementById(id);
let usThemeStore={},twThemeStore={},twStore={},usStore={};
let activeUS="NVDA",activeTW="2330";
let themeTimer=null, quoteTimer=null;
let isRefreshing=false;
let isThemeRefreshing=false;

function apiBase(){return $("apiBase").value.trim().replace(/\/$/,"")}
function list(id){return $(id).value.split(",").map(s=>s.trim().toUpperCase()).filter(Boolean)}
function uniq(a){return [...new Set(a)]}
function fmt(n,d=2){const x=Number(n);return Number.isFinite(x)?x.toFixed(d):"--"}
function colorClass(v){return Number(v)>0?"up":Number(v)<0?"down":"flat"}
function changeHtml(ch,pct){
  if(ch===null||ch===undefined||pct===null||pct===undefined)return `<span class="flat">--</span>`;
  const sign=Number(ch)>0?"+":"";
  return `<span class="${colorClass(ch)}">${sign}${fmt(ch)} (${sign}${fmt(pct)}%)</span>`;
}
async function api(path, retries=2){
  if(!apiBase())throw new Error("請先填 Cloudflare Worker API URL");
  const sep=path.includes("?")?"&":"?";
  let lastErr;
  for(let i=0;i<=retries;i++){
    try{
      const r=await fetch(`${apiBase()}${path}${sep}_=${Date.now()}`, {cache:"no-store"});
      const text=await r.text();
      let j;
      try{ j=JSON.parse(text); }catch(e){ throw new Error(`API 非 JSON 回應：${text.slice(0,100)}`); }
      if(!r.ok || !j.ok)throw new Error(j.error || `HTTP ${r.status}`);
      return j.data;
    }catch(err){ lastErr=err; if(i<retries)await new Promise(res=>setTimeout(res,350*(i+1))); }
  }
  throw lastErr;
}

function metricPrice(q){return q?.main?.price ?? q?.price;}
function metricPct(q){return q?.main?.pct ?? q?.changePercent;}
function metricChange(q){return q?.main?.change ?? q?.change;}

function quoteMain(q){
  if(q?.main)return q.main;
  return {label:q?.sessionLabel||q?.market||"最近價",price:q?.price,change:q?.change,pct:q?.changePercent};
}

async function loadEconLight(){
  try{
    const e=await api(`/api/econ-light`);
    if(e){
      const light=$("econLight"), prev=$("econPrev"), phase=$("econPhase"), read=$("econRead");
      if(light){light.textContent=e.currentLight||"--"; light.nextElementSibling.textContent=`${e.currentMonth||""}｜分數：${e.currentScore??"--"}`;}
      if(prev){prev.textContent=e.prevLight||"--"; prev.nextElementSibling.textContent=`${e.prevMonth||""}｜分數：${e.prevScore??"--"}`;}
      if(phase){phase.textContent=e.sourceMode||"API/備援"; phase.nextElementSibling.textContent=e.note||"";}
      if(read){read.textContent=e.marketRead||"--";}
    }
  }catch(err){console.warn("econ light failed",err);}
}

async function refreshAll(withTheme=false){
  if(isRefreshing)return;
  isRefreshing=true;
  localStorage.setItem("apiBase",$("apiBase").value.trim());
  localStorage.setItem("usSymbols",$("usSymbols").value);
  localStorage.setItem("twSymbols",$("twSymbols").value);
  $("refreshStatus").textContent="Updating...";
  try{
    await loadDashboard();
    await loadUSIndex();
    await loadTWIndex();
    await loadUSWatchlist();
    await loadTWWatchlist();
    if(typeof loadEconLight==="function") await loadEconLight();
    if(withTheme) await loadThemeUniverses();
    $("refreshStatus").textContent=`Auto updated ${new Date().toLocaleTimeString()} · 5s`;
  }catch(e){
    $("refreshStatus").textContent=`Error: ${e.message}`;
  }finally{
    isRefreshing=false;
  }
}

async function loadDashboard(){
  const data=await api(`/api/dashboard`);
  const vix=data.vix, btc=data.btc, tnx=data.us10y;
  $("usRisk").textContent=data.risk||"🟡 Neutral";
  $("usRiskDesc").textContent=data.riskDesc||"VIX / BTC / 10Y 綜合判斷";
  $("vixValue").innerHTML=`${fmt(vix?.price)} ${changeHtml(vix?.change,vix?.changePercent)}`;
  $("btcValue").innerHTML=`${fmt(btc?.price,0)} ${changeHtml(btc?.change,btc?.changePercent)}`;
  $("bond10y").innerHTML=`${fmt(tnx?.price)} ${changeHtml(tnx?.change,tnx?.changePercent)}`;
}

function cardQuote(label,q){
  if(!q||!q.ok)return `<div class="card"><div class="symbol"><span>${label}</span><span>No data</span></div><div class="card-meta">${q?.error||"這個資料源目前沒有回報數值。"}</div></div>`;
  const m=quoteMain(q);
  return `<div class="card">
    <div class="symbol"><span>${label}</span><span>${q.symbol||q.code||label}</span></div>
    <div class="session-line">目前：<span class="session-badge">${m.label||q.sessionLabel||q.market||"最近價"}</span></div>
    <div class="price">${fmt(m.price)}</div>
    <div class="change">${changeHtml(m.change,m.pct)}</div>
    <div class="card-meta">基準 ${fmt(q.base ?? q.previousClose)} · Open ${fmt(q.open)} · Prev ${fmt(q.previousClose)}<br/>High ${fmt(q.high)} · Low ${fmt(q.low)}<br/>Updated ${q.updatedAt?new Date(q.updatedAt).toLocaleTimeString():q.time||"--"}<br/>Source ${q.source||"--"}</div>
  </div>`;
}
async function loadUSIndex(){
  const data=await api(`/api/quotes?symbols=${encodeURIComponent(US_INDEX.join(","))}`);
  const map={}; Object.values(data||{}).forEach(q=>map[q.symbol]=q);
  $("usIndexBoard").innerHTML=US_INDEX.map(s=>cardQuote(s==="^VIX"?"VIX":s,map[s])).join("");
}
async function loadTWIndex(){
  const data=await api(`/api/tw-index`,1);
  const map={}; Object.values(data||{}).forEach(q=>map[q.symbol]=q);
  $("twIndexBoard").innerHTML=TW_INDEX.map(x=>cardQuote(x.name,map[x.symbol])).join("");
  updateWaveAnalysis(map["TXF8"] || map["^TWII"]);
}

function renderChips(elId,symbols,type){
  $(elId).innerHTML=symbols.map(s=>`<button class="chip" data-symbol="${s}" data-type="${type}">${type==="tw"?(TW_NAMES[s]||s):s}</button>`).join("");
  document.querySelectorAll(`#${elId} .chip`).forEach(b=>b.onclick=()=>type==="us"?selectUS(b.dataset.symbol):selectTW(b.dataset.symbol));
}
async function loadUSWatchlist(){
  const syms=list("usSymbols"); renderChips("usChips",syms,"us");
  const data=await api(`/api/session-quotes?symbols=${encodeURIComponent(syms.join(","))}`);
  $("session").textContent=data.session?.label||"Session";
  usStore={};
  $("usCards").innerHTML=(data.results||[]).map(x=>{
    if(!x.ok)return `<div class="card"><div class="symbol"><span>${x.symbol}</span><span>Error</span></div><div class="card-meta">${x.error}</div></div>`;
    const q=x.quote; usStore[q.symbol]=q; const m=q.main||{};
    return `<div class="card" data-symbol="${q.symbol}">
      <div class="symbol"><span>${q.symbol}</span><span>${q.symbol}</span></div>
      <div class="session-line">目前：<span class="session-badge">${m.label||"--"}</span></div>
      <div class="price">${fmt(m.price)}</div>
      <div class="change">${changeHtml(m.change,m.pct)}</div>
      <div class="segment-grid">${seg("盤前最後",q.segments?.pre)}${seg("日盤收盤",q.segments?.dayClose)}${seg("夜盤最後",q.segments?.nightClose)}</div>
      <div class="card-meta">Updated ${q.updatedAt?new Date(q.updatedAt).toLocaleTimeString():"--"}</div>
    </div>`;
  }).join("");
  document.querySelectorAll("#usCards .card[data-symbol]").forEach(c=>c.onclick=()=>selectUS(c.dataset.symbol));
}
function seg(title,obj){const val=obj?(obj.last??obj.price):null;return `<div class="seg"><div class="seg-title">${title}</div><div class="seg-val">${fmt(val)}</div></div>`}

async function loadTWWatchlist(){
  const codes=list("twSymbols"); renderChips("twChips",codes,"tw");
  const data=await api(`/api/tw-yahoo-quotes?codes=${encodeURIComponent(codes.join(","))}`);
  twStore={};
  $("twCards").innerHTML=Object.values(data||{}).map(q=>{
    if(!q.ok)return `<div class="card"><div class="symbol"><span>${TW_NAMES[q.code]||q.code}</span><span>Error</span></div><div class="card-meta">${q.error||"no data"}</div></div>`;
    twStore[q.code]=q; const name=TW_NAMES[q.code]||q.name||q.code;
    return `<div class="card" data-code="${q.code}" data-market="${q.market}">
      <div class="symbol"><span>${name}</span><span>${q.code}</span></div>
      <div class="session-line">市場：<span class="session-badge">${q.market||"--"}</span></div>
      <div class="price">${fmt(q.price)}</div>
      <div class="change">${changeHtml(q.change,q.changePercent)}</div>
      <div class="card-meta">Open ${fmt(q.open)} · Prev ${fmt(q.previousClose)}<br/>High ${fmt(q.high)} · Low ${fmt(q.low)}<br/>${q.time||""}</div>
    </div>`;
  }).join("");
  document.querySelectorAll("#twCards .card[data-code]").forEach(c=>c.onclick=()=>selectTW(c.dataset.code,c.dataset.market));
}

async function fetchTWQuotesInBatches(codes, batchSize=12){
  const out={};
  for(let i=0;i<codes.length;i+=batchSize){
    const batch=codes.slice(i,i+batchSize);
    try{ const data=await api(`/api/tw-quotes?codes=${encodeURIComponent(batch.join(","))}`,1); Object.assign(out,data||{}); }
    catch(err){ batch.forEach(code=>{ out[code]={ok:false,code,error:`batch failed: ${err.message||err}`}; }); }
    await new Promise(res=>setTimeout(res,120));
  }
  return out;
}

async function loadThemeUniverses(){
  if(isThemeRefreshing)return;
  isThemeRefreshing=true;
  try{
    const usCodes=uniq(US_THEMES.flatMap(t=>t.symbols));
    const twCodes=uniq(TW_THEMES.flatMap(t=>t.symbols));
    const usData=await api(`/api/session-quotes?symbols=${encodeURIComponent(usCodes.join(","))}`,1);
    const twData=await fetchTWQuotesInBatches(twCodes,12);
    const nextUS={}; (usData.results||[]).forEach(x=>{if(x.ok)nextUS[x.quote.symbol]=x.quote});
    const nextTW={}; Object.values(twData||{}).forEach(q=>{if(q&&q.code)nextTW[q.code]=q});
    if(Object.keys(nextUS).length)usThemeStore=nextUS;
    if(Object.keys(nextTW).length)twThemeStore=nextTW;
    renderHeat("us",US_THEMES,usThemeStore);
    renderHeat("tw",TW_THEMES,twThemeStore);
  }catch(err){ console.warn("loadThemeUniverses failed", err); }
  finally{ isThemeRefreshing=false; }
}
function renderHeat(prefix,themes,store){
  const vals=Object.values(store).filter(q=>q&&q.ok!==false).map(q=>({symbol:q.symbol||q.code,name:prefix==="tw"?(TW_NAMES[q.code]||q.name||q.code):(q.symbol||q.code),price:metricPrice(q),pct:metricPct(q)})).filter(x=>Number.isFinite(Number(x.pct)));
  const up=vals.filter(x=>x.pct>0).length,total=vals.length,b=total?up/total*100:0,top=[...vals].sort((a,b)=>b.pct-a.pct)[0];
  $(`${prefix}Breadth`).textContent=total?`${fmt(b,1)}%`:"--";
  $(`${prefix}MarketMode`).textContent=b>=70?"全面偏多":b>=50?"結構輪動":"資金保守";
  $(`${prefix}MarketModeDesc`).textContent=total?`上漲 ${up}/${total} 檔`:"--";
  if(top){$(`${prefix}TopStock`).textContent=top.name;$(`${prefix}TopStockDesc`).textContent=`${fmt(top.price)}｜${top.pct>0?"+":""}${fmt(top.pct)}%`;}
  const stats=themes.map(t=>{const p=t.symbols.map(s=>store[s]).filter(q=>q&&q.ok!==false).map(q=>Number(metricPct(q))).filter(Number.isFinite);const avg=p.length?p.reduce((a,b)=>a+b,0)/p.length:null;const ups=p.filter(x=>x>0).length;return {...t,avg,ups,count:p.length,score:avg===null?-999:avg*1.6+(p.length?ups/p.length*100:0)*.025};}).filter(x=>x.count>0).sort((a,b)=>b.score-a.score).slice(0,10);
  if(stats[0]){$(`${prefix}TopTheme`).textContent=stats[0].name;$(`${prefix}TopThemeDesc`).textContent=`平均 ${stats[0].avg>0?"+":""}${fmt(stats[0].avg)}%｜上漲 ${stats[0].ups}/${stats[0].count}`;}
  $(`${prefix}ThemeRank`).innerHTML=stats.map((s,i)=>`<div class="rank-pill ${i===0?"hot":i<=2?"warm":""}" data-prefix="${prefix}" data-theme-name="${s.name}">#${i+1} <strong>${s.name}</strong><br>${s.avg>0?"+":""}${fmt(s.avg)}%｜${s.ups}/${s.count} 上漲</div>`).join("");
  renderThemeMap(prefix,themes,stats);
}
function renderThemeMap(prefix,themes,stats=[]){
  const sm=Object.fromEntries(stats.map(s=>[s.name,s]));
  $(prefix+"ThemeMap").innerHTML=themes.slice(0,16).map(t=>{const st=sm[t.name];const pct=st&&st.avg!==null?`${st.avg>0?"+":""}${fmt(st.avg)}%`:"--";return `<div class="theme-box" data-prefix="${prefix}" data-theme-name="${t.name}"><div class="theme-title">${t.name} <span class="${st?colorClass(st.avg):"flat"}">${pct}</span></div><div class="theme-desc">${t.desc}</div><div class="theme-tickers">${t.symbols.slice(0,8).map(s=>`<span class="ticker-pill">${prefix==="tw"?(TW_NAMES[s]||s):s}</span>`).join("")}</div></div>`}).join("");
}

function renderThemeFocusCards(prefix,theme){
  const store=prefix==="us"?usThemeStore:twThemeStore;
  const el=$(prefix+"ThemeFocusCards");
  if(!el||!theme)return;
  el.innerHTML=theme.symbols.map(sym=>{
    const q=store[sym];
    if(prefix==="tw"){
      const name=TW_NAMES[sym]||sym;
      if(!q){
        return `<div class="card"><div class="symbol"><span>${name}</span><span>${sym}</span></div><div class="card-meta">尚未收到此檔報價；請先按「更新全部」。</div></div>`;
      }
      if(q.ok===false){
        return `<div class="card"><div class="symbol"><span>${name}</span><span>${sym}</span></div><div class="card-meta">${q.error||"資料源回傳失敗"}</div></div>`;
      }
      return `<div class="card" data-code="${q.code}" data-market="${q.market}">
        <div class="symbol"><span>${TW_NAMES[q.code]||q.name||q.code}</span><span>${q.code}</span></div>
        <div class="price">${fmt(q.price)}</div>
        <div class="change">${changeHtml(q.change,q.changePercent)}</div>
        <div class="card-meta">Open ${fmt(q.open)} · Prev ${fmt(q.previousClose)}<br/>High ${fmt(q.high)} · Low ${fmt(q.low)}<br/>${q.time||""}<br/>Source ${q.source||""}</div>
      </div>`;
    }
    if(!q)return `<div class="card"><div class="symbol"><span>${sym}</span><span>No data</span></div><div class="card-meta">目前沒有報價資料。</div></div>`;
    if(q.ok===false)return `<div class="card"><div class="symbol"><span>${sym}</span><span>Error</span></div><div class="card-meta">${q.error||"資料源回傳失敗"}</div></div>`;
    const m=q.main||{};
    return `<div class="card" data-symbol="${q.symbol}">
      <div class="symbol"><span>${q.symbol}</span><span>${q.symbol}</span></div>
      <div class="price">${fmt(m.price)}</div>
      <div class="change">${changeHtml(m.change,m.pct)}</div>
      <div class="card-meta">主價：${m.label||"--"}<br/>Updated ${q.updatedAt?new Date(q.updatedAt).toLocaleTimeString():"--"}</div>
    </div>`;
  }).join("");
  document.querySelectorAll(`#${prefix}ThemeFocusCards .card[data-symbol]`).forEach(c=>c.onclick=()=>selectUS(c.dataset.symbol));
  document.querySelectorAll(`#${prefix}ThemeFocusCards .card[data-code]`).forEach(c=>c.onclick=()=>selectTW(c.dataset.code,c.dataset.market));
}

function focusTheme(prefix,themeName){
  const themes=prefix==="us"?US_THEMES:TW_THEMES, store=prefix==="us"?usThemeStore:twThemeStore, theme=themes.find(t=>t.name===themeName); if(!theme)return;
  const qs=theme.symbols.map(s=>store[s]).filter(Boolean), pcts=qs.map(q=>Number(metricPct(q))).filter(Number.isFinite), avg=pcts.length?pcts.reduce((a,b)=>a+b,0)/pcts.length:null, ups=pcts.filter(x=>x>0).length;
  const top=qs.map(q=>({name:prefix==="tw"?(TW_NAMES[q.code]||q.name||q.code):(q.symbol||q.code),price:metricPrice(q),pct:metricPct(q)})).filter(x=>Number.isFinite(Number(x.pct))).sort((a,b)=>b.pct-a.pct)[0];
  $(`${prefix}TopTheme`).textContent=theme.name; $(`${prefix}TopThemeDesc`).textContent=avg===null?"這個題材目前沒有資料":`平均 ${avg>0?"+":""}${fmt(avg)}%｜上漲 ${ups}/${pcts.length}`;
  if(top){$(`${prefix}TopStock`).textContent=top.name;$(`${prefix}TopStockDesc`).textContent=`${fmt(top.price)}｜${top.pct>0?"+":""}${fmt(top.pct)}%`;}
  document.querySelectorAll(`#${prefix}ThemeRank .rank-pill`).forEach(x=>x.classList.toggle("selected",x.dataset.themeName===themeName));
  document.querySelectorAll(`#${prefix}ThemeMap .theme-box`).forEach(x=>x.classList.toggle("selected",x.dataset.themeName===themeName));
  renderThemeFocusCards(prefix,theme);
}




function renderWidget(containerId,titleId,symbol,titleText){
  if(titleId)$(titleId).textContent=titleText;
  const c=$(containerId); if(!c)return; c.innerHTML="";
  const id=`tv-${containerId}-${Date.now()}`; const inner=document.createElement("div"); inner.id=id; inner.style.height="100%"; inner.style.width="100%"; c.appendChild(inner);
  const script=document.createElement("script"); script.src="https://s3.tradingview.com/tv.js";
  script.onload=()=>new TradingView.widget({autosize:true,symbol,interval:"D",timezone:"Asia/Taipei",theme:"dark",style:"1",locale:"zh_TW",toolbar_bg:"#0f172a",enable_publishing:false,allow_symbol_change:true,hide_side_toolbar:false,withdateranges:true,details:true,studies:["Volume@tv-basicstudies","RSI@tv-basicstudies","MACD@tv-basicstudies"],container_id:id});
  c.appendChild(script);
}
function renderUSTV(s){activeUS=s;renderWidget("usTvChart","usChartTitle",`NASDAQ:${s}`,`${s} TradingView Chart`)}
function renderTWTV(code,market){activeTW=code;const m=market==="上櫃"?"TPEX":"TWSE";renderWidget("twTvChart","twChartTitle",`${m}:${code}`,`${code} ${TW_NAMES[code]||""} TradingView Chart`)}

function selectUS(s){renderUSTV(s)} function selectTW(code,market){renderTWTV(code,market||twStore[code]?.market)}
function updateWaveAnalysis(refQuote){
  const manual=Number($("txfManual")?.value);
  const px=Number.isFinite(manual)&&manual>0 ? manual : Number(refQuote?.price);
  if(!Number.isFinite(px)||px<=0){
    $("waveStage").textContent="台指期 WTX&：資料等待中";
    $("waveSupport").textContent="待取得報價";
    $("waveResistance").textContent="待取得報價";
    $("waveTarget").textContent="待取得報價";
    return;
  }
  const r=v=>Math.round(v/50)*50;
  const s1=r(px*0.985), s2=r(px*0.970), s3=r(px*0.950);
  const r1=r(px*1.015), r2=r(px*1.030), r3=r(px*1.050);
  const t1=r(px*1.045), t2=r(px*1.065), t3=r(px*1.085);
  $("waveStage").textContent="第3浪延伸 / B浪反彈二擇一";
  $("waveSupport").textContent=`${s1} / ${s2} / ${s3}`;
  $("waveResistance").textContent=`${r1} / ${r2} / ${r3}`;
  $("waveTarget").textContent=`${t1} / ${t2} / ${t3}`;
}
init();
