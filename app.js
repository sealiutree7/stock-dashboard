const $ = (id) => document.getElementById(id);

const US_INDEX = ["SPY","VOO","QQQ","DIA","IWM","SOXX","SMH"];
const TW_INDEX = [
  {name:"加權指數",symbol:"^TWII"},
  {name:"櫃買指數",symbol:"^TWOII"},
  {name:"電子指數",symbol:"^TEII"},
  {name:"台指期近一 WTX&",symbol:"TXF8"},
  {name:"VIXTWN",symbol:"VIXTWN"}
];

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
{name:"玻璃基板",desc:"玻璃基板 / TGV 供應鏈",symbols:["3149","8027","6207","3131","3583","3455"]},
{name:"航運",desc:"貨櫃、散裝、航空",symbols:["2603","2609","2615","2605","2637","2610","2618"]},
{name:"鋼鐵",desc:"鋼鐵、不鏽鋼、特殊鋼",symbols:["2002","2027","2014","2031"]},
{name:"塑化",desc:"塑化、PVC、化工",symbols:["1301","1303","1326","6505"]},
{name:"金融",desc:"金控、銀行、保險",symbols:["2881","2882","2891","2886","2885","2884"]},
{name:"生技醫療",desc:"新藥、醫材、醫療服務",symbols:["6446","4743","4147","1783","4123"]},
{name:"觀光餐飲",desc:"觀光、餐飲、百貨",symbols:["2727","2731","5706","2707","2912"]},
{name:"軍工無人機",desc:"軍工、無人機、航太",symbols:["2634","8033","8222","4572","6753"]},
{name:"重電儲能",desc:"重電、電網、儲能",symbols:["1513","1504","1519","1609","1618"]}
];

const TW_NAMES={
"2330":"台積電","2454":"聯發科","3034":"聯詠","2379":"瑞昱","3443":"創意","3661":"世芯-KY","2382":"廣達","6669":"緯穎","3231":"緯創","3017":"奇鋐","3324":"雙鴻","2356":"英業達","3037":"欣興","8046":"南電","3189":"景碩","2368":"金像電","2383":"台光電","6213":"聯茂","6442":"光聖","3450":"聯鈞","4979":"華星光","6531":"愛普*","3081":"聯亞","2408":"南亞科","2344":"華邦電","2337":"旺宏","8299":"群聯","3260":"威剛","2308":"台達電","8996":"高力","2421":"建準","2049":"上銀","2359":"所羅門","4566":"時碩工業","1590":"亞德客-KY","4576":"大銀微系統","3149":"正達","8027":"鈦昇","6207":"雷科","3131":"弘塑","3583":"辛耘","3455":"由田","2603":"長榮","2609":"陽明","2615":"萬海","2605":"新興","2637":"慧洋-KY","2610":"華航","2618":"長榮航","2002":"中鋼","2027":"大成鋼","2014":"中鴻","2031":"新光鋼","1301":"台塑","1303":"南亞","1326":"台化","6505":"台塑化","2881":"富邦金","2882":"國泰金","2891":"中信金","2886":"兆豐金","2885":"元大金","2884":"玉山金","6446":"藥華藥","4743":"合一","4147":"中裕","1783":"和康生","4123":"晟德","2727":"王品","2731":"雄獅","5706":"鳳凰","2707":"晶華","2912":"統一超","2634":"漢翔","8033":"雷虎","8222":"寶一","4572":"駐龍","6753":"龍德造船","1513":"中興電","1504":"東元","1519":"華城","1609":"大亞","1618":"合機"};

let activePage = "us";
let activeUS = "MU";
let activeTW = "2330";
let usStore = {};
let twStore = {};
let usThemeStore = {};
let twThemeStore = {};
let isRefreshing = false;
let isThemeRefreshing = false;
let lastThemeRefresh = 0;
let quoteTimer = null;
let themeTimer = null;
const lastPrice = new Map();

function apiBase(){
  return ($("apiBase")?.value || "").trim().replace(/\/$/,"");
}
function list(id){
  return ($(`${id}`)?.value || "").split(",").map(x=>x.trim()).filter(Boolean);
}
function uniq(arr){
  return [...new Set(arr.map(x=>String(x).trim()).filter(Boolean))];
}
function fmt(n,d=2){
  const x=Number(n);
  if(!Number.isFinite(x)) return "--";
  return x.toFixed(Math.abs(x)>=1000 ? 2 : d);
}
function cssMove(v){
  return Number(v)>0 ? "up" : Number(v)<0 ? "down" : "flat";
}
function changeHtml(ch,pct){
  const c=Number(ch), p=Number(pct);
  if(!Number.isFinite(c) || !Number.isFinite(p)) return `<span class="flat">--</span>`;
  const s=c>0?"+":"";
  return `<span class="${cssMove(c)}">${s}${fmt(c)} (${s}${fmt(p)}%)</span>`;
}
function qPrice(q){ return q?.main?.price ?? q?.price ?? null; }
function qChange(q){ return q?.main?.change ?? q?.change ?? null; }
function qPct(q){ 
  const v=q?.main?.pct ?? q?.changePercent;
  return Number.isFinite(Number(v)) ? Number(v) : null;
}
function qLabel(q){ return q?.main?.label ?? q?.sessionLabel ?? q?.market ?? "最近價"; }
function setText(id, value){ const el=$(id); if(el) el.textContent=value; }
function setHTML(id, value){ const el=$(id); if(el) el.innerHTML=value; }

async function api(path, retries=2){
  if(!apiBase()) throw new Error("請先填 Cloudflare Worker API URL");
  const sep = path.includes("?") ? "&" : "?";
  let lastErr;
  for(let i=0;i<=retries;i++){
    try{
      const res = await fetch(`${apiBase()}${path}${sep}_=${Date.now()}`, {cache:"no-store"});
      const text = await res.text();
      let json;
      try{ json = JSON.parse(text); }catch(e){ throw new Error(`API 非 JSON：${text.slice(0,120)}`); }
      if(!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
      return json.data;
    }catch(err){
      lastErr = err;
      if(i<retries) await new Promise(r=>setTimeout(r, 350*(i+1)));
    }
  }
  throw lastErr;
}

function flashCard(el,key,price){
  if(!el || price==null) return;
  const old = lastPrice.get(key);
  if(old!==undefined && Number(old)!==Number(price)){
    el.classList.add("flash");
    setTimeout(()=>el.classList.remove("flash"),450);
  }
  lastPrice.set(key, price);
}
function applyFlash(containerId){
  document.querySelectorAll(`#${containerId} .card[data-key]`).forEach(el=>{
    flashCard(el, el.dataset.key, el.dataset.price);
  });
}

function cardQuote(label,q){
  if(!q || q.ok===false){
    return `<div class="card"><div class="symbol"><span>${label}</span><span>No data</span></div><div class="card-meta">${q?.error || "資料源目前沒有回報數值"}</div></div>`;
  }
  const price=qPrice(q), ch=qChange(q), pct=qPct(q);
  return `<div class="card" data-key="${q.symbol||q.code||label}" data-price="${price ?? ""}">
    <div class="symbol"><span>${label}</span><span>${q.symbol||q.code||label}</span></div>
    <div class="session-line">目前：<span class="session-badge">${qLabel(q)}</span></div>
    <div class="price">${fmt(price)}</div>
    <div class="change">${changeHtml(ch,pct)}</div>
    <div class="card-meta">基準 ${fmt(q.base ?? q.previousClose)} · Open ${fmt(q.open)} · Prev ${fmt(q.previousClose)}<br/>High ${fmt(q.high)} · Low ${fmt(q.low)}<br/>Updated ${q.updatedAt?new Date(q.updatedAt).toLocaleTimeString():q.time||"--"}<br/>Source ${q.source||"--"}</div>
  </div>`;
}

function renderChips(id,codes,type){
  setHTML(id, codes.map(c=>`<button class="chip" data-symbol="${c}">${type==="tw"?(TW_NAMES[c]||c):c}</button>`).join(""));
  document.querySelectorAll(`#${id} .chip`).forEach(b=>{
    b.onclick=()=> type==="tw" ? selectTW(b.dataset.symbol) : selectUS(b.dataset.symbol);
  });
}

function renderWidget(containerId,titleId,symbol,titleText){
  if(titleId && $(titleId)) $(titleId).textContent=titleText;
  const c=$(containerId);
  if(!c) return;
  c.innerHTML="";
  const id=`tv-${containerId}-${Date.now()}`;
  const inner=document.createElement("div");
  inner.id=id;
  inner.style.height="420px";
  c.appendChild(inner);
  const s=document.createElement("script");
  s.src="https://s3.tradingview.com/tv.js";
  s.onload=()=>{
    try{
      new TradingView.widget({
        autosize:true,
        symbol,
        interval:"D",
        timezone:"Asia/Taipei",
        theme:"dark",
        style:"1",
        locale:"zh_TW",
        toolbar_bg:"#020812",
        enable_publishing:false,
        hide_side_toolbar:false,
        allow_symbol_change:true,
        studies:["RSI@tv-basicstudies","MACD@tv-basicstudies"],
        container_id:id
      });
    }catch(e){ console.warn("TradingView widget failed",e); }
  };
  document.body.appendChild(s);
}
function renderUSTV(symbol){ renderWidget("usTvChart","usChartTitle",symbol,`${symbol} 技術線圖`); }
function renderTWTV(code,market="上市"){ renderWidget("twTvChart","twChartTitle",`TWSE:${code}`,`${TW_NAMES[code]||code} 技術線圖`); }

function selectUS(symbol){
  activeUS=symbol;
  renderUSTV(symbol);
}
function selectTW(code){
  activeTW=code;
  const q=twStore[code] || twThemeStore[code];
  renderTWTV(code, q?.market || "上市");
}

async function loadSession(){
  const h = await api("/health",1);
  const s = h?.session?.label || h?.session?.key || "--";
  setText("session", s);
}

async function loadDashboard(){
  const d = await api("/api/dashboard",1);
  setText("usRisk", d.risk || "🟡 Neutral");
  setText("usRiskDesc", d.riskDesc || "VIX / BTC / 10Y 綜合判斷");
  setHTML("vixValue", `${fmt(d.vix?.price)} ${changeHtml(d.vix?.change,d.vix?.changePercent)}`);
  setHTML("btcValue", `${fmt(d.btc?.price,0)} ${changeHtml(d.btc?.change,d.btc?.changePercent)}`);
  setHTML("bond10y", `${fmt(d.us10y?.price)} ${changeHtml(d.us10y?.change,d.us10y?.changePercent)}`);
}

async function loadUSIndex(){
  const data = await api(`/api/quotes?symbols=${encodeURIComponent(US_INDEX.join(","))}`,1);
  setHTML("usIndexBoard", US_INDEX.map(s=>cardQuote(s,data[s])).join(""));
  applyFlash("usIndexBoard");
}

async function loadTWIndex(){
  const data = await api("/api/tw-index",1);
  const map = {};
  Object.values(data||{}).forEach(q=>{ map[q.symbol]=q; });
  setHTML("twIndexBoard", TW_INDEX.map(x=>cardQuote(x.name,map[x.symbol])).join(""));
  applyFlash("twIndexBoard");
  updateWaveAnalysis(map["TXF8"] || map["^TWII"]);
}

async function loadUSWatchlist(){
  const syms = uniq(list("usSymbols").map(s=>s.toUpperCase()));
  localStorage.setItem("usSymbols", syms.join(", "));
  renderChips("usChips", syms, "us");
  const data = await api(`/api/session-quotes?symbols=${encodeURIComponent(syms.join(","))}`,1);
  setText("session", data.session?.label || $("session")?.textContent || "--");
  const next={};
  const html=(data.results||[]).map(x=>{
    if(!x.ok) return cardQuote(x.symbol,{ok:false,error:x.error});
    next[x.quote.symbol]=x.quote;
    return cardQuote(x.quote.symbol,x.quote);
  }).join("");
  usStore=next;
  setHTML("usCards", html);
  applyFlash("usCards");
}

async function loadTWWatchlist(){
  const codes = uniq(list("twSymbols"));
  localStorage.setItem("twSymbols", codes.join(", "));
  renderChips("twChips", codes, "tw");
  const data = await api(`/api/tw-quotes?codes=${encodeURIComponent(codes.join(","))}`,1);
  twStore=data||{};
  setHTML("twCards", codes.map(c=>cardQuote(TW_NAMES[c]||c,twStore[c])).join(""));
  applyFlash("twCards");
}

async function fetchTWQuotesInBatches(codes,batchSize=12){
  const out={};
  for(let i=0;i<codes.length;i+=batchSize){
    const batch=codes.slice(i,i+batchSize);
    try{
      const data=await api(`/api/tw-quotes?codes=${encodeURIComponent(batch.join(","))}`,1);
      Object.assign(out,data||{});
    }catch(err){
      batch.forEach(c=>{ out[c]={ok:false,code:c,error:`batch failed: ${err.message}`}; });
    }
    await new Promise(r=>setTimeout(r,120));
  }
  return out;
}

async function loadThemeUniverses(force=false){
  if(isThemeRefreshing) return;
  if(!force && Date.now()-lastThemeRefresh < 5*60*1000 && Object.keys(twThemeStore).length) return;
  isThemeRefreshing=true;
  try{
    const usCodes=uniq(US_THEMES.flatMap(t=>t.symbols));
    const twCodes=uniq(TW_THEMES.flatMap(t=>t.symbols));
    const [usData,twData]=await Promise.all([
      api(`/api/session-quotes?symbols=${encodeURIComponent(usCodes.join(","))}`,1),
      fetchTWQuotesInBatches(twCodes,12)
    ]);
    const nextUS={};
    (usData.results||[]).forEach(x=>{ if(x.ok && x.quote) nextUS[x.quote.symbol]=x.quote; });
    const nextTW={};
    Object.values(twData||{}).forEach(q=>{ if(q&&q.code) nextTW[q.code]=q; });
    if(Object.keys(nextUS).length) usThemeStore=nextUS;
    if(Object.keys(nextTW).length) twThemeStore=nextTW;
    lastThemeRefresh=Date.now();
    renderHeat("us",US_THEMES,usThemeStore);
    renderHeat("tw",TW_THEMES,twThemeStore);
  }catch(e){
    console.warn("theme load failed",e);
  }finally{
    isThemeRefreshing=false;
  }
}

function statsForTheme(theme,store){
  const qs=theme.symbols.map(s=>store[s]).filter(q=>q&&q.ok!==false);
  const pcts=qs.map(qPct).filter(Number.isFinite);
  const avg=pcts.length?pcts.reduce((a,b)=>a+b,0)/pcts.length:null;
  const ups=pcts.filter(x=>x>0).length;
  return {qs,pcts,avg,ups,count:pcts.length,score:avg==null?-999:avg*1.6+(pcts.length?ups/pcts.length*2.5:0)};
}

function renderHeat(prefix,themes,store){
  const vals=Object.values(store).filter(q=>q&&q.ok!==false).map(q=>({
    symbol:q.symbol||q.code,
    code:q.code,
    name:prefix==="tw"?(TW_NAMES[q.code]||q.name||q.code):(q.symbol||q.code),
    price:qPrice(q),
    pct:qPct(q)
  })).filter(x=>Number.isFinite(Number(x.pct)));

  const up=vals.filter(x=>x.pct>0).length;
  const total=vals.length;
  const breadth=total?up/total*100:0;
  const top=[...vals].sort((a,b)=>b.pct-a.pct)[0];

  setText(`${prefix}Breadth`, total?`${fmt(breadth,1)}%`:"--");
  setText(`${prefix}MarketMode`, total?(breadth>=70?"全面偏多":breadth>=50?"結構輪動":"資金保守"):"--");
  setText(`${prefix}MarketModeDesc`, total?`上漲 ${up}/${total} 檔`:"--");

  if(top){
    setText(`${prefix}TopStock`, top.name);
    setText(`${prefix}TopStockDesc`, `${fmt(top.price)}｜${top.pct>0?"+":""}${fmt(top.pct)}%`);
  }

  const ranked=themes.map(t=>({...t,...statsForTheme(t,store)})).filter(x=>x.count>0).sort((a,b)=>b.score-a.score);
  const topTheme=ranked[0];
  if(topTheme){
    setText(`${prefix}TopTheme`, topTheme.name);
    setText(`${prefix}TopThemeDesc`, `平均 ${topTheme.avg>0?"+":""}${fmt(topTheme.avg)}%｜上漲 ${topTheme.ups}/${topTheme.count}`);
  }

  setHTML(`${prefix}ThemeRank`, ranked.slice(0,10).map((s,i)=>`
    <div class="rank-pill ${i===0?"hot":i<=2?"warm":""}" data-prefix="${prefix}" data-theme-name="${s.name}">
      #${i+1} ${s.name}<br/>${s.avg>0?"+":""}${fmt(s.avg)}%｜${s.ups}/${s.count} 上漲
    </div>`).join(""));
  document.querySelectorAll(`#${prefix}ThemeRank .rank-pill`).forEach(el=>{
    el.onclick=()=>focusTheme(prefix,el.dataset.themeName);
  });

  renderThemeMap(prefix,themes,store);
  if(topTheme) focusTheme(prefix,topTheme.name);
}

function renderThemeMap(prefix,themes,store){
  setHTML(`${prefix}ThemeMap`, themes.map(t=>{
    const st=statsForTheme(t,store);
    return `<div class="theme-box" data-prefix="${prefix}" data-theme-name="${t.name}">
      <div class="theme-title">${t.name} <span class="${cssMove(st.avg)}">${st.avg==null?"--":`${st.avg>0?"+":""}${fmt(st.avg)}%`}</span></div>
      <div class="theme-desc">${t.desc}</div>
      <div class="theme-symbols">${t.symbols.map(s=>`<span class="theme-symbol-pill">${prefix==="tw"?(TW_NAMES[s]||s):s}</span>`).join("")}</div>
    </div>`;
  }).join(""));
  document.querySelectorAll(`#${prefix}ThemeMap .theme-box`).forEach(el=>{
    el.onclick=()=>focusTheme(prefix,el.dataset.themeName);
  });
}

function focusTheme(prefix,themeName){
  const themes=prefix==="tw"?TW_THEMES:US_THEMES;
  const store=prefix==="tw"?twThemeStore:usThemeStore;
  const theme=themes.find(t=>t.name===themeName);
  if(!theme) return;

  const st=statsForTheme(theme,store);
  setText(`${prefix}TopTheme`, theme.name);
  setText(`${prefix}TopThemeDesc`, st.avg==null?"這個題材目前沒有資料":`平均 ${st.avg>0?"+":""}${fmt(st.avg)}%｜上漲 ${st.ups}/${st.count}`);

  const top=theme.symbols.map(s=>store[s]).filter(q=>q&&q.ok!==false).map(q=>({
    q, name:prefix==="tw"?(TW_NAMES[q.code]||q.name||q.code):(q.symbol||q.code), price:qPrice(q), pct:qPct(q)
  })).filter(x=>Number.isFinite(Number(x.pct))).sort((a,b)=>b.pct-a.pct)[0];
  if(top){
    setText(`${prefix}TopStock`, top.name);
    setText(`${prefix}TopStockDesc`, `${fmt(top.price)}｜${top.pct>0?"+":""}${fmt(top.pct)}%`);
  }

  document.querySelectorAll(`#${prefix}ThemeRank .rank-pill`).forEach(x=>x.classList.toggle("selected",x.dataset.themeName===themeName));
  document.querySelectorAll(`#${prefix}ThemeMap .theme-box`).forEach(x=>x.classList.toggle("selected",x.dataset.themeName===themeName));

  setHTML(`${prefix}ThemeFocusCards`, theme.symbols.map(s=>{
    const q=store[s];
    const label=prefix==="tw"?(TW_NAMES[s]||s):s;
    return cardQuote(label,q);
  }).join(""));
  applyFlash(`${prefix}ThemeFocusCards`);
}

async function loadEconLight(){
  try{
    const e=await api("/api/econ-light",1);
    setText("econLight", e.currentLight || "--");
    $("econLight")?.nextElementSibling && ($("econLight").nextElementSibling.textContent = `${e.currentMonth||""}｜分數：${e.currentScore??"--"}`);
    setText("econPrev", e.prevLight || "--");
    $("econPrev")?.nextElementSibling && ($("econPrev").nextElementSibling.textContent = `${e.prevMonth||""}｜分數：${e.prevScore??"--"}`);
    setText("econPhase", e.sourceMode || "--");
    $("econPhase")?.nextElementSibling && ($("econPhase").nextElementSibling.textContent = e.note || "");
    setText("econRead", e.marketRead || "--");
  }catch(e){
    console.warn("econ failed",e);
  }
}

function updateWaveAnalysis(refQuote){
  const manual=Number($("txfManual")?.value);
  const px=Number.isFinite(manual)&&manual>0 ? manual : Number(refQuote?.price);
  if(!Number.isFinite(px)||px<=0){
    setText("waveStage","台指期 WTX&：資料等待中");
    setText("waveSupport","待取得報價");
    setText("waveResistance","待取得報價");
    setText("waveTarget","待取得報價");
    return;
  }
  const r=v=>Math.round(v/50)*50;
  const s=[r(px*0.985),r(px*0.970),r(px*0.950)];
  const p=[r(px*1.015),r(px*1.030),r(px*1.050)];
  const t=[r(px*1.045),r(px*1.065),r(px*1.085)];
  setText("waveStage","第3浪延伸 / B浪反彈二擇一");
  setText("waveSupport",s.join(" / "));
  setText("waveResistance",p.join(" / "));
  setText("waveTarget",t.join(" / "));
}

async function refreshAll(forceTheme=false){
  if(isRefreshing) return;
  isRefreshing=true;
  setText("refreshStatus","Updating...");
  try{
    if($("apiBase")) localStorage.setItem("apiBase",$("apiBase").value.trim());
    if($("usSymbols")) localStorage.setItem("usSymbols",$("usSymbols").value);
    if($("twSymbols")) localStorage.setItem("twSymbols",$("twSymbols").value);

    await loadSession();

    if(activePage==="us"){
      await loadDashboard();
      await loadUSIndex();
      await loadUSWatchlist();
    }else{
      await loadTWIndex();
      await loadEconLight();
      await loadTWWatchlist();
    }

    if(forceTheme || !Object.keys(usThemeStore).length || !Object.keys(twThemeStore).length){
      await loadThemeUniverses(true);
    }

    setText("refreshStatus",`Auto updated ${new Date().toLocaleTimeString()} · 5s`);
  }catch(e){
    console.error(e);
    setText("refreshStatus",`Error: ${e.message}`);
  }finally{
    isRefreshing=false;
  }
}

function switchPage(pageId){
  activePage = pageId==="twPage" ? "tw" : "us";
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.page===pageId));
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===pageId));
  if(activePage==="us") renderUSTV(activeUS);
  else renderTWTV(activeTW,(twStore[activeTW]||twThemeStore[activeTW])?.market||"上市");
  refreshAll(false);
}

function init(){
  try{
    if($("apiBase")) $("apiBase").value = localStorage.getItem("apiBase") || "https://stock-session-worker.selu010107.workers.dev";
    if($("usSymbols")) $("usSymbols").value = localStorage.getItem("usSymbols") || $("usSymbols").value;
    if($("twSymbols")) $("twSymbols").value = localStorage.getItem("twSymbols") || $("twSymbols").value;

    document.querySelectorAll(".tab").forEach(tab=>tab.onclick=()=>switchPage(tab.dataset.page));
    $("refreshBtn") && ($("refreshBtn").onclick=()=>refreshAll(true));
    $("txfManual") && $("txfManual").addEventListener("input",()=>updateWaveAnalysis(null));

    renderUSTV(activeUS);
    refreshAll(true);

    if(quoteTimer) clearInterval(quoteTimer);
    if(themeTimer) clearInterval(themeTimer);
    quoteTimer=setInterval(()=>refreshAll(false),5000);
    themeTimer=setInterval(()=>loadThemeUniverses(true),5*60*1000);
  }catch(e){
    console.error("init failed",e);
    setText("refreshStatus",`Init Error: ${e.message}`);
  }
}

document.addEventListener("DOMContentLoaded", init);
