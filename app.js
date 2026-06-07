const US_INDEX=["SPY","VOO","QQQ","DIA","IWM","SOXX","SMH"];
const DASH_SYMBOLS=["^VIX","BTC-USD","^TNX"];
const TW_INDEX=[
  {name:"加權指數",symbol:"^TWII",tv:"TWSE:TAIEX"},
  {name:"櫃買指數",symbol:"^TWOII",tv:"TPEX:OTC"},
  {name:"電子指數",symbol:"^TEII",tv:"TWSE:TE"},
  {name:"台指期 TXF8",symbol:"TXF8",tv:"TAIFEX:TXF1!",isFuture:true}
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
async function api(path){
  if(!apiBase())throw new Error("請先填 Cloudflare Worker API URL");
  const sep=path.includes("?")?"&":"?";
  const r=await fetch(`${apiBase()}${path}${sep}_=${Date.now()}`);
  const j=await r.json();
  if(!j.ok)throw new Error(j.error||"API error");
  return j.data;
}
function quoteMain(q){return q.main||{price:q.price,change:q.change,pct:q.changePercent,label:"最近價"}}

function init(){
  $("apiBase").value=localStorage.getItem("apiBase")||"";
  $("usSymbols").value=localStorage.getItem("usSymbols")||$("usSymbols").value;
  $("twSymbols").value=localStorage.getItem("twSymbols")||$("twSymbols").value;
  $("refreshBtn").onclick=()=>refreshAll(true);

  document.querySelectorAll(".tab").forEach(btn=>{
    btn.onclick=()=>{
      document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
      $(btn.dataset.page).classList.add("active");
    };
  });

  document.addEventListener("click",e=>{
    const rank=e.target.closest(".rank-pill");
    if(rank){focusTheme(rank.dataset.prefix,rank.dataset.themeName);return;}
    const box=e.target.closest(".theme-box");
    if(box){focusTheme(box.dataset.prefix,box.dataset.themeName);return;}
  });

  renderThemeMap("us",US_THEMES,[]);
  renderThemeMap("tw",TW_THEMES,[]);
  renderChips("usChips",list("usSymbols"),"us");
  renderChips("twChips",list("twSymbols"),"tw");
  renderUSTV(activeUS);
  renderTWTV(activeTW);
  renderTXFChart();

  refreshAll(true);
  quoteTimer=setInterval(()=>refreshAll(false),5000);
  themeTimer=setInterval(()=>loadThemeUniverses(),300000);
}

async function refreshAll(withTheme=false){
  localStorage.setItem("apiBase",$("apiBase").value.trim());
  localStorage.setItem("usSymbols",$("usSymbols").value);
  localStorage.setItem("twSymbols",$("twSymbols").value);
  $("refreshStatus").textContent="Updating...";
  try{
    await Promise.all([loadDashboard(),loadUSIndex(),loadTWIndex(),loadUSWatchlist(),loadTWWatchlist()]);
    updateWaveAnalysis();
    if(withTheme) await loadThemeUniverses();
    $("refreshStatus").textContent=`Auto updated ${new Date().toLocaleTimeString()} · 5s`;
  }catch(e){
    $("refreshStatus").textContent=`Error: ${e.message}`;
  }
}

async function loadDashboard(){
  const data=await api(`/api/quotes?symbols=${encodeURIComponent(DASH_SYMBOLS.join(","))}`);
  const map={}; Object.values(data||{}).forEach(q=>{if(q.ok)map[q.symbol]=q});
  const vix=map["^VIX"], btc=map["BTC-USD"], tnx=map["^TNX"];
  const v=Number(vix?.price), bp=Number(btc?.changePercent);
  let risk="🟡 Neutral", desc="VIX / BTC / 10Y 綜合判斷";
  if(v<20 && bp>0){risk="🔴 Risk ON";desc="波動低且風險資產偏強";}
  if(v>25){risk="🟢 Risk OFF";desc="VIX偏高，市場風險趨避";}
  $("usRisk").textContent=risk; $("usRiskDesc").textContent=desc;
  $("vixValue").innerHTML=`${fmt(vix?.price)} ${changeHtml(vix?.change,vix?.changePercent)}`;
  $("btcValue").innerHTML=`${fmt(btc?.price,0)} ${changeHtml(btc?.change,btc?.changePercent)}`;
  $("bond10y").innerHTML=`${fmt(tnx?.price)} ${changeHtml(tnx?.change,tnx?.changePercent)}`;
}

function cardQuote(label,q){
  if(!q||!q.ok)return `<div class="card"><div class="symbol"><span>${label}</span><span>Error</span></div><div class="card-meta">${q?.error||"no data"}</div></div>`;
  const m=quoteMain(q);
  return `<div class="card">
    <div class="symbol"><span>${label}</span><span>${q.symbol||q.code||label}</span></div>
    <div class="session-line">目前：<span class="session-badge">${m.label||q.market||"最近價"}</span></div>
    <div class="price">${fmt(m.price)}</div>
    <div class="change">${changeHtml(m.change,m.pct)}</div>
    <div class="card-meta">Open ${fmt(q.open)} · Prev ${fmt(q.previousClose)}<br/>High ${fmt(q.high)} · Low ${fmt(q.low)}<br/>Updated ${q.updatedAt?new Date(q.updatedAt).toLocaleTimeString():q.time||"--"}</div>
  </div>`;
}
async function loadUSIndex(){
  const data=await api(`/api/quotes?symbols=${encodeURIComponent(US_INDEX.join(","))}`);
  const map={}; Object.values(data||{}).forEach(q=>map[q.symbol]=q);
  $("usIndexBoard").innerHTML=US_INDEX.map(s=>cardQuote(s==="^VIX"?"VIX":s,map[s])).join("");
}
async function loadTWIndex(){
  const quoteSymbols=TW_INDEX.filter(x=>!x.isFuture).map(x=>x.symbol);
  const data=await api(`/api/quotes?symbols=${encodeURIComponent(quoteSymbols.join(","))}`);
  const map={}; Object.values(data||{}).forEach(q=>map[q.symbol]=q);
  $("twIndexBoard").innerHTML=TW_INDEX.map(x=>{
    if(x.isFuture){
      return `<div class="card" data-tv="${x.tv}" data-title="${x.name}線圖">
        <div class="symbol"><span>${x.name}</span><span>TXF8</span></div>
        <div class="session-line">來源：<span class="session-badge">TradingView</span></div>
        <div class="price">請看下方線圖</div>
        <div class="card-meta">台指期以 TAIFEX 連續合約圖表呈現，避免誤抓加權指數。</div>
      </div>`;
    }
    return cardQuote(x.name,map[x.symbol]).replace('<div class="card">',`<div class="card" data-tv="${x.tv}" data-title="${x.name}線圖">`);
  }).join("");
  document.querySelectorAll("#twIndexBoard .card[data-tv]").forEach(c=>c.onclick=()=>renderTWIndexChart(c.dataset.tv,c.dataset.title));
  if(!window.__twIndexChartLoaded){window.__twIndexChartLoaded=true;renderTWIndexChart("TWSE:TAIEX","加權指數線圖");}
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

async function loadThemeUniverses(){
  const usCodes=uniq(US_THEMES.flatMap(t=>t.symbols));
  const twCodes=uniq(TW_THEMES.flatMap(t=>t.symbols));
  const [usData,twData]=await Promise.all([
    api(`/api/session-quotes?symbols=${encodeURIComponent(usCodes.join(","))}`),
    api(`/api/tw-yahoo-quotes?codes=${encodeURIComponent(twCodes.join(","))}`)
  ]);
  usThemeStore={}; (usData.results||[]).forEach(x=>{if(x.ok)usThemeStore[x.quote.symbol]=x.quote});
  twThemeStore={}; Object.values(twData||{}).forEach(q=>{if(q.ok)twThemeStore[q.code]=q});
  renderHeat("us",US_THEMES,usThemeStore);
  renderHeat("tw",TW_THEMES,twThemeStore);
}
function renderHeat(prefix,themes,store){
  const vals=Object.values(store).map(q=>({symbol:q.symbol||q.code,name:prefix==="tw"?(TW_NAMES[q.code]||q.name||q.code):(q.symbol||q.code),price:q.main?.price??q.price,pct:q.main?.pct??q.changePercent})).filter(x=>Number.isFinite(Number(x.pct)));
  const up=vals.filter(x=>x.pct>0).length,total=vals.length,b=total?up/total*100:0,top=[...vals].sort((a,b)=>b.pct-a.pct)[0];
  $(`${prefix}Breadth`).textContent=total?`${fmt(b,1)}%`:"--";
  $(`${prefix}MarketMode`).textContent=b>=70?"全面偏多":b>=50?"結構輪動":"資金保守";
  $(`${prefix}MarketModeDesc`).textContent=total?`上漲 ${up}/${total} 檔`:"--";
  if(top){$(`${prefix}TopStock`).textContent=top.name;$(`${prefix}TopStockDesc`).textContent=`${fmt(top.price)}｜${top.pct>0?"+":""}${fmt(top.pct)}%`;}
  const stats=themes.map(t=>{const p=t.symbols.map(s=>store[s]).filter(Boolean).map(q=>Number(q.main?.pct??q.changePercent)).filter(Number.isFinite);const avg=p.length?p.reduce((a,b)=>a+b,0)/p.length:null;const ups=p.filter(x=>x>0).length;return {...t,avg,ups,count:p.length,score:avg===null?-999:avg*1.6+(p.length?ups/p.length*100:0)*.025};}).filter(x=>x.count>0).sort((a,b)=>b.score-a.score).slice(0,10);
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
  const qs=theme.symbols.map(s=>store[s]).filter(Boolean);
  if(!qs.length){
    el.innerHTML=`<div class="card"><div class="symbol"><span>${theme.name}</span><span>No data</span></div><div class="card-meta">這個題材目前沒有可顯示報價。</div></div>`;
    return;
  }
  el.innerHTML=qs.map(q=>{
    if(prefix==="tw"){
      const name=TW_NAMES[q.code]||q.name||q.code;
      return `<div class="card" data-code="${q.code}" data-market="${q.market}">
        <div class="symbol"><span>${name}</span><span>${q.code}</span></div>
        <div class="price">${fmt(q.price)}</div>
        <div class="change">${changeHtml(q.change,q.changePercent)}</div>
        <div class="card-meta">Open ${fmt(q.open)} · Prev ${fmt(q.previousClose)}<br/>High ${fmt(q.high)} · Low ${fmt(q.low)}<br/>${q.time||""}</div>
      </div>`;
    }
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
  const qs=theme.symbols.map(s=>store[s]).filter(Boolean), pcts=qs.map(q=>Number(q.main?.pct??q.changePercent)).filter(Number.isFinite), avg=pcts.length?pcts.reduce((a,b)=>a+b,0)/pcts.length:null, ups=pcts.filter(x=>x>0).length;
  const top=qs.map(q=>({name:prefix==="tw"?(TW_NAMES[q.code]||q.name||q.code):(q.symbol||q.code),price:q.main?.price??q.price,pct:q.main?.pct??q.changePercent})).filter(x=>Number.isFinite(Number(x.pct))).sort((a,b)=>b.pct-a.pct)[0];
  $(`${prefix}TopTheme`).textContent=theme.name; $(`${prefix}TopThemeDesc`).textContent=avg===null?"這個題材目前沒有資料":`平均 ${avg>0?"+":""}${fmt(avg)}%｜上漲 ${ups}/${pcts.length}`;
  if(top){$(`${prefix}TopStock`).textContent=top.name;$(`${prefix}TopStockDesc`).textContent=`${fmt(top.price)}｜${top.pct>0?"+":""}${fmt(top.pct)}%`;}
  document.querySelectorAll(`#${prefix}ThemeRank .rank-pill`).forEach(x=>x.classList.toggle("selected",x.dataset.themeName===themeName));
  document.querySelectorAll(`#${prefix}ThemeMap .theme-box`).forEach(x=>x.classList.toggle("selected",x.dataset.themeName===themeName));
  renderThemeFocusCards(prefix,theme);
}

function renderTWIndexChart(symbol,title){const t=$("twIndexChartTitle"); if(t)t.textContent=title||"台股大盤線圖"; renderWidget("twIndexChart",null,symbol,title||"台股大盤線圖");}
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
function renderTXFChart(){renderWidget("txfChart",null,"TAIFEX:TXF1!","台指期 TXF8 即時圖")}
function selectUS(s){renderUSTV(s)} function selectTW(code,market){renderTWTV(code,market||twStore[code]?.market)}
function updateWaveAnalysis(){
  $("waveStage").textContent="台指期 TXF8：第3浪/反彈浪觀察";
  $("waveSupport").textContent="請看TXF線圖";
  $("waveResistance").textContent="請看TXF線圖";
  $("waveTarget").textContent="待接TXF歷史K";
}
init();
