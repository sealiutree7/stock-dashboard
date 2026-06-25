const $=id=>document.getElementById(id);
const fmt=n=>Number.isFinite(Number(n))?Number(n).toFixed(Math.abs(Number(n))>=1000?2:2):"--";
const uniq=a=>[...new Set(a.map(x=>String(x).trim()).filter(Boolean))];
const signClass=n=>Number(n)>0?"up":Number(n)<0?"down":"flat";
const pctObj=(price,base)=>{price=Number(price);base=Number(base);if(!Number.isFinite(price)||!Number.isFinite(base)||base===0)return{change:null,pct:null};const ch=price-base;return{change:ch,pct:ch/base*100}};
function changeHtml(ch,pct){if(!Number.isFinite(Number(ch))||!Number.isFinite(Number(pct)))return `<span class="flat">--</span>`;return `<span class="${signClass(ch)}">${ch>=0?"+":""}${Number(ch).toFixed(2)} (${pct>=0?"+":""}${Number(pct).toFixed(2)}%)</span>`}
function apiBase(){return ($("apiBase").value||"").trim().replace(/\/$/,"")}
async function api(path,retries=2){
  if(!apiBase())throw new Error("請先填 Cloudflare Worker API URL");
  const sep=path.includes("?")?"&":"?";
  let last;
  for(let i=0;i<=retries;i++){
    try{
      const r=await fetch(`${apiBase()}${path}${sep}_=${Date.now()}`,{cache:"no-store"});
      const text=await r.text(); let j;
      try{j=JSON.parse(text)}catch(e){throw new Error(`API 非 JSON：${text.slice(0,100)}`)}
      if(!r.ok||!j.ok)throw new Error(j.error||`HTTP ${r.status}`);
      return j.data;
    }catch(e){last=e;if(i<retries)await new Promise(res=>setTimeout(res,450*(i+1)))}
  }
  throw last;
}

const US_INDEX=["SPY","VOO","QQQ","DIA","IWM","SOXX","SMH","VXX"];
const TW_INDEX=["^TWII","^TWOII","^TEII","TXF8","VIXTWN"];
const TW_INDEX_NAMES={"^TWII":"加權指數","^TWOII":"櫃買指數","^TEII":"電子指數","TXF8":"台指期近一 WTX&","VIXTWN":"VIXTWN"};
const TW_NAMES={
 "2330":"台積電","2454":"聯發科","3034":"聯詠","2379":"瑞昱","3443":"創意","3661":"世芯-KY","2382":"廣達","6669":"緯穎","3231":"緯創","3017":"奇鋐","3324":"雙鴻","2356":"英業達","3037":"欣興","8046":"南電","3189":"景碩","2368":"金像電","2383":"台光電","6213":"聯茂","6442":"光聖","3450":"聯鈞","4979":"華星光","6531":"愛普*","3081":"聯亞","2408":"南亞科","2344":"華邦電","2337":"旺宏","8299":"群聯","3260":"威剛","2308":"台達電","8996":"高力","2421":"建準","2049":"上銀","2359":"所羅門","4566":"時碩工業","1590":"亞德客-KY","4576":"大銀微系統","3149":"正達","8027":"鈦昇","6207":"雷科","3131":"弘塑","3583":"辛耘","3455":"由田","2603":"長榮","2609":"陽明","2615":"萬海","2605":"新興","2637":"慧洋-KY","2610":"華航","2618":"長榮航","2002":"中鋼","2027":"大成鋼","2014":"中鴻","2031":"新光鋼","1301":"台塑","1303":"南亞","1326":"台化","6505":"台塑化","2881":"富邦金","2882":"國泰金","2891":"中信金","2886":"兆豐金","2885":"元大金","2884":"玉山金","6446":"藥華藥","4743":"合一","4147":"中裕","1783":"和康生","4123":"晟德","2727":"王品","2731":"雄獅","5706":"鳳凰","2707":"晶華","2912":"統一超","2634":"漢翔","8033":"雷虎","8222":"寶一","4572":"駐龍","6753":"龍德造船","1513":"中興電","1504":"東元","1519":"華城","1609":"大亞","1618":"合機"
};

const US_THEMES=[
 {name:"AI GPU / Accelerator",desc:"AI 訓練與推論核心",symbols:["NVDA","AMD","AVGO","ARM","SMCI"]},
 {name:"Semiconductor",desc:"半導體整體資金流",symbols:["SOXX","SMH","NVDA","AMD","AVGO","MU","TSM","INTC"]},
 {name:"Cloud / Software AI",desc:"雲端資本支出與 AI 平台",symbols:["MSFT","GOOGL","AMZN","META","PLTR","SNOW","ORCL"]},
 {name:"EV / Robotaxi",desc:"自駕與機器人題材",symbols:["TSLA","NVDA","AMD","GOOGL"]},
 {name:"Memory",desc:"DRAM / HBM / NAND",symbols:["MU","WDC","STX","NVDA"]},
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

let activePage="us", usStore={}, twStore={}, usThemeStore={}, twThemeStore={}, activeUS="MU", activeTW="2330";
let isRefreshing=false, isThemeRefreshing=false, quoteTimer=null, themeTimer=null;
const lastPrices=new Map();

function flashIfChanged(el,key,price){const old=lastPrices.get(key);if(old!==undefined && Number(old)!==Number(price)){el.classList.add("flash");setTimeout(()=>el.classList.remove("flash"),450)}lastPrices.set(key,price)}
function renderChips(id,codes,handler){$(id).innerHTML=codes.map(c=>`<button class="chip" data-code="${c}">${TW_NAMES[c]||c}</button>`).join("");document.querySelectorAll(`#${id} .chip`).forEach(b=>b.onclick=()=>handler(b.dataset.code))}
function cardHTML(label,q,{us=false}={}){
  if(!q||q.ok===false)return `<div class="card"><div class="symbol"><span>${label}</span><span>No data</span></div><div class="card-meta">${q?.error||"資料源目前沒有回報數值"}</div></div>`;
  const price=q.price, ch=q.change, pc=q.changePercent;
  const source=q.source?`<br/>Source ${q.source}`:"";
  return `<div class="card" data-key="${q.symbol||q.code||label}" data-price="${price}">
    <div class="symbol"><span>${label}</span><span>${q.symbol||q.code||label}</span></div>
    <div class="session-line">目前：<span class="session-badge">${q.sessionLabel||q.market||"最近價"}</span></div>
    <div class="price">${fmt(price)}</div>
    <div class="change">${changeHtml(ch,pc)}</div>
    <div class="card-meta">基準 ${fmt(q.base)} · Open ${fmt(q.open)} · Prev ${fmt(q.previousClose)}<br/>High ${fmt(q.high)} · Low ${fmt(q.low)}<br/>Updated ${q.updatedAt?new Date(q.updatedAt).toLocaleTimeString():q.time||"--"}${source}</div>
  </div>`;
}
function afterCards(container){document.querySelectorAll(`#${container} .card[data-key]`).forEach(c=>flashIfChanged(c,c.dataset.key,c.dataset.price))}

async function loadSession(){
  const h=await api("/health",1);
  $("sessionBadge").textContent=h.session?.label||"--";
}
async function loadDashboard(){
  const d=await api(`/api/market-dashboard`,1);
  $("marketDashboard").innerHTML=[
    ["美股情緒",d.riskMood||"--",d.riskNote||""],
    ["VIX",fmt(d.vix?.price),changeHtml(d.vix?.change,d.vix?.changePercent)],
    ["BTC",fmt(d.btc?.price),changeHtml(d.btc?.change,d.btc?.changePercent)],
    ["US10Y",fmt(d.us10y?.price),d.us10y?.source||""]
  ].map(x=>`<div class="summary-card"><div class="muted">${x[0]}</div><div class="price">${x[1]}</div><div class="card-meta">${x[2]}</div></div>`).join("");
}
async function loadUSIndex(){
  const d=await api(`/api/us-quotes?symbols=${encodeURIComponent(US_INDEX.join(","))}`,1);
  $("usIndexBoard").innerHTML=US_INDEX.map(s=>cardHTML(s,d[s],{us:true})).join("");
  afterCards("usIndexBoard");
}
async function loadTWIndex(){
  const d=await api(`/api/tw-index`,1);
  $("twIndexBoard").innerHTML=TW_INDEX.map(s=>cardHTML(TW_INDEX_NAMES[s]||s,d[s])).join("");
  afterCards("twIndexBoard");
  updateWave(d["TXF8"]);
}
async function loadUSWatchlist(){
  const codes=uniq($("usSymbols").value.toUpperCase().split(","));
  localStorage.setItem("usSymbols",codes.join(", "));
  renderChips("usWatchChips",codes,c=>activeUS=c);
  const d=await api(`/api/us-quotes?symbols=${encodeURIComponent(codes.join(","))}`,1);
  usStore=d||{};
  $("usWatchlist").innerHTML=codes.map(s=>cardHTML(s,usStore[s],{us:true})).join("");
  afterCards("usWatchlist");
}
async function loadTWWatchlist(){
  const codes=uniq($("twSymbols").value.split(","));
  localStorage.setItem("twSymbols",codes.join(", "));
  renderChips("twWatchChips",codes,c=>activeTW=c);
  const d=await api(`/api/tw-quotes?codes=${encodeURIComponent(codes.join(","))}`,1);
  twStore=d||{};
  $("twWatchlist").innerHTML=codes.map(c=>cardHTML(TW_NAMES[c]||c,twStore[c])).join("");
  afterCards("twWatchlist");
}

async function fetchTWQuotesInBatches(codes,batchSize=24){
  const out={};
  for(let i=0;i<codes.length;i+=batchSize){
    const batch=codes.slice(i,i+batchSize);
    try{Object.assign(out,await api(`/api/tw-quotes?codes=${encodeURIComponent(batch.join(","))}`,1))}
    catch(e){batch.forEach(c=>out[c]={ok:false,code:c,error:`batch failed: ${e.message}`})}
    await new Promise(r=>setTimeout(r,100));
  }
  return out;
}
async function loadThemeUniverses(){
  if(isThemeRefreshing)return; isThemeRefreshing=true;
  try{
    const usCodes=uniq(US_THEMES.flatMap(t=>t.symbols));
    const twCodes=uniq(TW_THEMES.flatMap(t=>t.symbols));
    const usData=await api(`/api/us-quotes?symbols=${encodeURIComponent(usCodes.join(","))}`,1);
    const twData=await fetchTWQuotesInBatches(twCodes,24);
    usThemeStore=usData||{}; twThemeStore=twData||{};
    renderHeat("us",US_THEMES,usThemeStore);
    renderHeat("tw",TW_THEMES,twThemeStore);
  }finally{isThemeRefreshing=false}
}
function quotePct(q){return q&&q.ok!==false&&Number.isFinite(Number(q.changePercent))?Number(q.changePercent):null}
function renderHeat(prefix,themes,store){
  const vals=Object.values(store).filter(q=>q&&q.ok!==false&&Number.isFinite(Number(q.changePercent)));
  const stats=themes.map(t=>{const arr=t.symbols.map(s=>store[s]).map(quotePct).filter(Number.isFinite);const avg=arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:null;const up=arr.filter(x=>x>0).length;return{...t,avg,up,total:arr.length}}).sort((a,b)=>(b.avg??-999)-(a.avg??-999));
  const hot=stats[0], best=vals.slice().sort((a,b)=>Number(b.changePercent)-Number(a.changePercent))[0];
  const breadth=vals.length?vals.filter(x=>Number(x.changePercent)>0).length/vals.length*100:null;
  const trend=breadth==null?"--":breadth>=55?"資金偏多":breadth<=45?"資金保守":"中性震盪";
  $(`${prefix}HeatSummary`).innerHTML=[
    ["最熱題材",hot?hot.name:"--",hot&&Number.isFinite(hot.avg)?`平均 ${hot.avg>=0?"+":""}${hot.avg.toFixed(2)}%｜上漲 ${hot.up}/${hot.total}`:"--"],
    ["最強個股",best?(prefix==="tw"?(TW_NAMES[best.code]||best.name||best.code):(best.symbol)): "--",best?`${fmt(best.price)}｜${best.changePercent>=0?"+":""}${Number(best.changePercent).toFixed(2)}%`:"--"],
    ["上漲家數比例",breadth?`${breadth.toFixed(1)}%`:"--",`${prefix.toUpperCase()} theme breadth`],
    ["市場狀態",trend,`上漲 ${vals.filter(x=>x.changePercent>0).length}/${vals.length} 檔`]
  ].map(x=>`<div class="summary-card"><div class="muted">${x[0]}</div><div class="price">${x[1]}</div><div class="card-meta">${x[2]}</div></div>`).join("");
  $(`${prefix}ThemeRank`).innerHTML=stats.slice(0,10).map((s,i)=>`<div class="rank" data-theme="${s.name}">#${i+1} ${s.name}<br/>${Number.isFinite(s.avg)?(s.avg>=0?"+":"")+s.avg.toFixed(2)+"%":"--"}｜${s.up}/${s.total} 上漲</div>`).join("");
  document.querySelectorAll(`#${prefix}ThemeRank .rank`).forEach(r=>r.onclick=()=>focusTheme(prefix,r.dataset.theme));
  renderThemeMap(prefix,themes,store);
  if(stats[0])focusTheme(prefix,stats[0].name);
}
function renderThemeMap(prefix,themes,store){
  $(`${prefix}ThemeMap`).innerHTML=themes.map(t=>{
    const arr=t.symbols.map(s=>store[s]).map(quotePct).filter(Number.isFinite);
    const avg=arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:null;
    return `<div class="theme-box" data-theme="${t.name}">
      <div class="theme-title">${t.name} <span class="${signClass(avg)}">${Number.isFinite(avg)?(avg>=0?"+":"")+avg.toFixed(2)+"%":"--"}</span></div>
      <div class="theme-desc">${t.desc}</div>
      <div class="theme-symbols">${t.symbols.map(s=>`<span class="mini">${prefix==="tw"?(TW_NAMES[s]||s):s}</span>`).join("")}</div>
    </div>`;
  }).join("");
  document.querySelectorAll(`#${prefix}ThemeMap .theme-box`).forEach(b=>b.onclick=()=>focusTheme(prefix,b.dataset.theme));
}
function focusTheme(prefix,name){
  const themes=prefix==="us"?US_THEMES:TW_THEMES, store=prefix==="us"?usThemeStore:twThemeStore;
  const theme=themes.find(t=>t.name===name); if(!theme)return;
  document.querySelectorAll(`#${prefix}ThemeMap .theme-box`).forEach(x=>x.classList.toggle("selected",x.dataset.theme===name));
  document.querySelectorAll(`#${prefix}ThemeRank .rank`).forEach(x=>x.classList.toggle("active",x.dataset.theme===name));
  $(`${prefix}ThemeFocusCards`).innerHTML=theme.symbols.map(s=>{
    const q=store[s], label=prefix==="tw"?(TW_NAMES[s]||s):s;
    return cardHTML(label,q);
  }).join("");
  afterCards(`${prefix}ThemeFocusCards`);
}

function updateWave(q){
  const manual=Number($("txfManual").value);
  const px=Number.isFinite(manual)&&manual>0?manual:Number(q?.price);
  if(!Number.isFinite(px)||px<=0){
    $("waveCards").innerHTML=[
      ["目前判定","等待台指期資料","可手動輸入參考價"],
      ["支撐區","--",""],
      ["壓力區","--",""],
      ["延伸目標","--",""]
    ].map(x=>`<div class="summary-card"><div class="muted">${x[0]}</div><div class="price">${x[1]}</div><div class="card-meta">${x[2]}</div></div>`).join(""); return;
  }
  const r=v=>Math.round(v/50)*50;
  const s=[r(px*0.985),r(px*0.970),r(px*0.950)];
  const p=[r(px*1.015),r(px*1.030),r(px*1.050)];
  const t=[r(px*1.045),r(px*1.065),r(px*1.085)];
  $("waveCards").innerHTML=[
    ["目前判定","第3浪延伸 / B浪反彈二擇一","偏多延伸，但需守支撐"],
    ["支撐區",s.join(" / "),"跌破則浪型轉弱"],
    ["壓力區",p.join(" / "),"站上確認續強"],
    ["延伸目標",t.join(" / "),"依近期波段估算"]
  ].map(x=>`<div class="summary-card"><div class="muted">${x[0]}</div><div class="price">${x[1]}</div><div class="card-meta">${x[2]}</div></div>`).join("");
}
async function loadEcon(){
  const e=await api("/api/econ-light",1);
  $("econCards").innerHTML=[
    ["目前燈號",e.currentLight||"--",`${e.currentMonth||""}｜分數：${e.currentScore??"--"}`],
    ["前期",e.prevLight||"--",`${e.prevMonth||""}｜分數：${e.prevScore??"--"}`],
    ["資料狀態",e.sourceMode||"--",e.note||""],
    ["台股解讀",e.marketRead||"--",e.source||""]
  ].map(x=>`<div class="summary-card"><div class="muted">${x[0]}</div><div class="price">${x[1]}</div><div class="card-meta">${x[2]}</div></div>`).join("");
}

async function refreshAll(withTheme=false){
  if(isRefreshing)return; isRefreshing=true;
  localStorage.setItem("apiBase",$("apiBase").value.trim());
  $("refreshStatus").textContent="Updating...";
  try{
    await loadSession();
    if(activePage==="us"){
      await loadDashboard(); await loadUSIndex(); await loadUSWatchlist();
    }else{
      await loadTWIndex(); await loadEcon(); await loadTWWatchlist();
    }
    if(withTheme)await loadThemeUniverses();
    $("refreshStatus").textContent=`Auto updated ${new Date().toLocaleTimeString()} · 5s`;
  }catch(e){$("refreshStatus").textContent=`Error: ${e.message}`}
  finally{isRefreshing=false}
}
function setup(){
  $("apiBase").value=localStorage.getItem("apiBase")||"https://stock-session-worker.selu010107.workers.dev";
  $("usSymbols").value=localStorage.getItem("usSymbols")||$("usSymbols").value;
  $("twSymbols").value=localStorage.getItem("twSymbols")||$("twSymbols").value;
  $("usTab").onclick=()=>{activePage="us";$("usTab").classList.add("active");$("twTab").classList.remove("active");$("usPage").classList.add("active");$("twPage").classList.remove("active");refreshAll(false)};
  $("twTab").onclick=()=>{activePage="tw";$("twTab").classList.add("active");$("usTab").classList.remove("active");$("twPage").classList.add("active");$("usPage").classList.remove("active");refreshAll(false)};
  $("refreshBtn").onclick=()=>refreshAll(true);
  $("txfManual").addEventListener("input",()=>updateWave(null));
  refreshAll(true);
  quoteTimer=setInterval(()=>refreshAll(false),5000);
  themeTimer=setInterval(()=>loadThemeUniverses(),5*60*1000);
}
setup();
