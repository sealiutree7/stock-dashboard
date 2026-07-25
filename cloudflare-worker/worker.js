const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"};
const CACHE=new Map();
function ok(data,status=200){return new Response(JSON.stringify({ok:true,data}),{status,headers:{...corsHeaders,"Content-Type":"application/json; charset=utf-8"}})}
function fail(error,status=500){return new Response(JSON.stringify({ok:false,error:String(error)}),{status,headers:{...corsHeaders,"Content-Type":"application/json; charset=utf-8"}})}
function nfloat(x){const v=Number(String(x ?? "").replace(/,/g,""));return Number.isFinite(v)?v:null}
function parseNum(s){const m=String(s ?? "").replace(/,/g,"").match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):null}
function pct(price,base){price=nfloat(price);base=nfloat(base);if(price===null||base===null||base===0)return{change:null,changePercent:null};const change=price-base;return{change,changePercent:change/base*100}}
function cleanText(s){return String(s||"").replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim()}
async function cached(key,ttlMs,fn){const now=Date.now(),hit=CACHE.get(key);if(hit&&now-hit.t<ttlMs)return hit.v;const v=await fn();CACHE.set(key,{t:now,v});return v}
function sessionNow(){const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",weekday:"short",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date());const get=t=>parts.find(p=>p.type===t)?.value;const w=get("weekday"),m=Number(get("hour"))*60+Number(get("minute"));if(w==="Sat"||w==="Sun")return{key:"closed",label:"休市"};if(m>=240&&m<570)return{key:"pre",label:"盤前"};if(m>=570&&m<960)return{key:"regular",label:"日盤"};if(m>=960&&m<1200)return{key:"post",label:"夜盤"};return{key:"overnight",label:"夜盤"}}
function localFromTs(ts,off){return new Date((ts+off)*1000)}function dateKey(ts,off){return localFromTs(ts,off).toISOString().slice(0,10)}function timeText(ts,off){return localFromTs(ts,off).toISOString().replace("T"," ").slice(0,19)}function minutes(ts,off){const d=localFromTs(ts,off);return d.getUTCHours()*60+d.getUTCMinutes()}function classifyUS(ts,off){const m=minutes(ts,off);if(m>=240&&m<570)return"pre";if(m>=570&&m<960)return"regular";if(m>=960&&m<1200)return"post";return"overnight"}
async function yahooChart(symbol,range="1mo",interval="1d",prepost=false){return cached(`yh:${symbol}:${range}:${interval}:${prepost}`,interval==="5m"?4500:55000,async()=>{const url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=${prepost?"true":"false"}&events=div,splits`;const res=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0","Accept":"application/json"}});if(!res.ok)throw new Error(`Yahoo HTTP ${res.status}`);const data=await res.json();const result=data?.chart?.result?.[0];if(!result)throw new Error(JSON.stringify(data?.chart?.error||"No chart result"));return result})}
async function quoteDaily(symbol,display=symbol){const result=await yahooChart(symbol,"1mo","1d",false),meta=result.meta||{},q=result.indicators?.quote?.[0]||{};const closes=(q.close||[]).map(nfloat),opens=(q.open||[]).map(nfloat),highs=(q.high||[]).map(nfloat),lows=(q.low||[]).map(nfloat),ts=result.timestamp||[];const valid=[];for(let i=0;i<closes.length;i++)if(closes[i]!==null)valid.push({i,close:closes[i]});const last=valid.at(-1),prev=valid.at(-2);const price=nfloat(meta.regularMarketPrice)??last?.close??null;const base=prev?.close??nfloat(meta.previousClose)??nfloat(meta.chartPreviousClose);if(price===null)throw new Error("no price");const i=last?.i??closes.length-1,pp=pct(price,base);return{ok:true,symbol:display,price,base,previousClose:base,change:pp.change,changePercent:pp.changePercent,open:opens[i],high:highs[i],low:lows[i],time:ts[i]?new Date(ts[i]*1000).toISOString().slice(0,10):"",updatedAt:new Date().toISOString(),source:"Yahoo Finance",sourceSymbol:symbol}}

async function yahooQuoteRaw(symbol){
  return cached(`yq:${symbol}`,4500,async()=>{
    const url=`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}&fields=regularMarketPrice,regularMarketPreviousClose,preMarketPrice,postMarketPrice,regularMarketTime,preMarketTime,postMarketTime,shortName,longName,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow`;
    const res=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0","Accept":"application/json"}});
    if(!res.ok)throw new Error(`Yahoo quote HTTP ${res.status}`);
    const data=await res.json();
    const q=data?.quoteResponse?.result?.[0];
    if(!q)throw new Error("No Yahoo quote result");
    return q;
  });
}

async function quoteUSSession(symbol){
  const s=sessionNow();
  try{
    const q=await yahooQuoteRaw(symbol);
    const regular=nfloat(q.regularMarketPrice);
    const prev=nfloat(q.regularMarketPreviousClose);
    const pre=nfloat(q.preMarketPrice);
    const post=nfloat(q.postMarketPrice);
    let price=null, base=null, label="最近價", t=null;
    if(s.key==="pre" && pre!==null){
      price=pre; base=prev ?? regular; label="盤前最後"; t=q.preMarketTime ? new Date(q.preMarketTime*1000).toISOString() : null;
    }else if((s.key==="post" || s.key==="overnight" || s.key==="closed") && post!==null){
      price=post; base=regular ?? prev; label="夜盤最後"; t=q.postMarketTime ? new Date(q.postMarketTime*1000).toISOString() : null;
    }else{
      price=regular ?? pre ?? post; base=prev; label=s.key==="regular" ? "日盤即時" : (pre!==null ? "盤前最後" : "最近價"); t=q.regularMarketTime ? new Date(q.regularMarketTime*1000).toISOString() : null;
    }
    if(price!==null){
      const pp=pct(price,base);
      return{ok:true,symbol,name:q.shortName||q.longName||symbol,session:s,main:{label,price,time:t,change:pp.change,pct:pp.changePercent},price,base,previousClose:base,sessionLabel:label,change:pp.change,changePercent:pp.changePercent,open:nfloat(q.regularMarketOpen),high:nfloat(q.regularMarketDayHigh),low:nfloat(q.regularMarketDayLow),segments:{pre:pre!==null?{last:pre,time:q.preMarketTime?new Date(q.preMarketTime*1000).toISOString():null}:null,regular:regular!==null?{last:regular,time:q.regularMarketTime?new Date(q.regularMarketTime*1000).toISOString():null}:null,post:post!==null?{last:post,time:q.postMarketTime?new Date(q.postMarketTime*1000).toISOString():null}:null,dayClose:regular!==null?{price:regular,time:q.regularMarketTime?new Date(q.regularMarketTime*1000).toISOString():null}:null},source:"Yahoo Finance quote normalized",updatedAt:new Date().toISOString()};
    }
  }catch(e){}
  const result=await yahooChart(symbol,"5d","5m",true), meta=result.meta||{}, off=Number(meta.gmtoffset??-14400);
  const ts=result.timestamp||[], q=result.indicators?.quote?.[0]||{}, cl=q.close||[], hi=q.high||[], lo=q.low||[], op=q.open||[], vo=q.volume||[];
  const rows=[];
  for(let i=0;i<ts.length;i++){const close=nfloat(cl[i]); if(close===null)continue; rows.push({date:dateKey(ts[i],off),time:timeText(ts[i],off),session:classifyUS(ts[i],off),close,open:nfloat(op[i]),high:nfloat(hi[i]),low:nfloat(lo[i]),volume:Number(vo[i]||0)});}
  if(!rows.length)throw new Error("No valid rows");
  const regDates=[...new Set(rows.filter(x=>x.session==="regular").map(x=>x.date))].sort();
  const latestReg=regDates.at(-1)||rows.at(-1).date, prevReg=regDates.length>=2?regDates.at(-2):null;
  function lastOf(sess,date){let f=null;for(const r of rows)if(r.session===sess&&(!date||r.date===date))f=r;return f}
  function rangeOf(sess,date){let first=null,last=null,high=-Infinity,low=Infinity,volume=0;for(const r of rows){if(r.session!==sess||date&&r.date!==date)continue;if(!first)first=r;last=r;high=Math.max(high,r.high??r.close);low=Math.min(low,r.low??r.close);volume+=r.volume||0}return last?{first:first.close,last:last.close,high,low,volume,time:last.time,date:last.date}:null;}
  const latestRegular=lastOf("regular",latestReg), prevRegular=prevReg?lastOf("regular",prevReg):null, latestPre=rangeOf("pre",rows.at(-1).date), latestPost=rangeOf("post",latestReg);
  const ext=s.key==="pre"?latestPre:latestPost;
  let price,label,base,time;
  if(s.key==="regular"){const lr=lastOf("regular",latestReg)||rows.at(-1);price=lr.close;label="日盤即時";base=prevRegular?.close??nfloat(meta.previousClose)??nfloat(meta.chartPreviousClose);time=lr.time;}
  else if(ext){price=ext.last;label=s.key==="pre"?"盤前最後":"夜盤最後";base=latestRegular?.close??prevRegular?.close??nfloat(meta.previousClose);time=ext.time;}
  else{const lr=latestRegular||rows.at(-1);price=lr.close;label="最近價";base=prevRegular?.close??nfloat(meta.previousClose);time=lr.time;}
  const pp=pct(price,base);
  return{ok:true,symbol,session:s,main:{label,price,time,change:pp.change,pct:pp.changePercent},price,base,previousClose:base,sessionLabel:label,change:pp.change,changePercent:pp.changePercent,open:latestRegular?.open??null,high:latestRegular?.high??ext?.high??null,low:latestRegular?.low??ext?.low??null,segments:{latestRegular,prevRegular,pre:latestPre,post:latestPost,dayClose:latestRegular?{price:latestRegular.close,time:latestRegular.time}:null},source:"Yahoo Finance chart normalized fallback",updatedAt:new Date().toISOString()};
}
async function fetchHtml(url){const res=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64)","Accept":"text/html,application/xhtml+xml"}});if(!res.ok)throw new Error(`HTTP ${res.status}`);return res.text()}
async function quoteTXF(){return cached("txf",5000,async()=>{const urls=["https://tw.stock.yahoo.com/future/WTX%26","https://tw.stock.yahoo.com/quote/WTX%26","https://tw.stock.yahoo.com/quote/WTX%26.TW"];let err="";for(const url of urls){try{const html=await fetchHtml(url),text=cleanText(html);let price=null,base=null,change=null,changePercent=null;let m=html.match(/regularMarketPrice[^]*?raw["']?\s*:\s*([0-9.]+)/);if(m)price=Number(m[1]);m=html.match(/regularMarketPreviousClose[^]*?raw["']?\s*:\s*([0-9.]+)/);if(m)base=Number(m[1]);m=html.match(/regularMarketChange[^]*?raw["']?\s*:\s*(-?[0-9.]+)/);if(m)change=Number(m[1]);m=html.match(/regularMarketChangePercent[^]*?raw["']?\s*:\s*(-?[0-9.]+)/);if(m)changePercent=Number(m[1]);if(price===null){const idx=text.indexOf("台指期");const block=idx>=0?text.slice(idx,idx+1200):text;price=[...block.matchAll(/\d{2,6}(?:,\d{3})*(?:\.\d+)?/g)].map(x=>parseNum(x[0])).find(x=>x&&x>10000&&x<100000)??null}const pp=pct(price,base);if(change===null)change=pp.change;if(changePercent===null)changePercent=pp.changePercent;if(price===null)throw new Error("parse price failed");return{ok:true,symbol:"TXF8",price,base,previousClose:base,change,changePercent,open:null,high:null,low:null,time:"Yahoo股市",updatedAt:new Date().toISOString(),source:"Yahoo股市",sourceSymbol:url}}catch(e){err+=`${url}: ${e.message}; `}}throw new Error(err||"TXF fetch failed")})}
async function quoteVIXTWN(){
  return cached("vixtwn",10000,async()=>{
    const headers={
      "User-Agent":"Mozilla/5.0",
      "Accept":"application/json,text/plain,*/*",
      "Referer":"https://www.wantgoo.com/index/vixtwn",
      "X-Requested-With":"XMLHttpRequest"
    };
    async function getJsonAny(paths){
      let err="";
      for(const path of paths){
        const url=path.startsWith("http")?path:`https://www.wantgoo.com${path}`;
        try{
          const res=await fetch(url,{headers});
          if(!res.ok && res.status!==304)throw new Error(`HTTP ${res.status}`);
          return {data:await res.json(),url};
        }catch(e){err+=`${url}: ${e.message}; `;}
      }
      throw new Error(err);
    }
    const candlePaths=[
      "/index/vixtwn/minute-candlestick",
      "/index/VIXTWN/minute-candlestick",
      "/stock/vixtwn/minute-candlestick",
      "/stock/VIXTWN/minute-candlestick",
      "/investure/vixtwn/minute-candlestick",
      "/investure/VIXTWN/minute-candlestick"
    ];
    const statePaths=[
      "/index/vixtwn/commoditystate",
      "/index/VIXTWN/commoditystate",
      "/stock/vixtwn/commoditystate",
      "/stock/VIXTWN/commoditystate",
      "/investure/vixtwn/commoditystate",
      "/investure/VIXTWN/commoditystate"
    ];
    const [stateR,candleR]=await Promise.all([getJsonAny(statePaths),getJsonAny(candlePaths)]);
    const state=Array.isArray(stateR.data)?stateR.data.at(-1):stateR.data;
    let candle=Array.isArray(candleR.data)?candleR.data.at(-1):candleR.data;
    if(candle?.data && Array.isArray(candle.data)) candle=candle.data.at(-1);
    if(candle?.candles && Array.isArray(candle.candles)) candle=candle.candles.at(-1);
    const price=nfloat(candle?.close)??nfloat(candle?.price)??nfloat(candle?.last);
    const base=nfloat(state?.flat)??nfloat(state?.previousClose)??nfloat(state?.close);
    const open=nfloat(candle?.open), high=nfloat(candle?.high), low=nfloat(candle?.low);
    if(price===null)throw new Error(`VIXTWN API found but no close price`);
    const pp=pct(price,base);
    return{ok:true,symbol:"VIXTWN",price,base,previousClose:base,change:pp.change,changePercent:pp.changePercent,open,high,low,time:candle?.time?new Date(candle.time).toISOString():"WantGoo",updatedAt:new Date().toISOString(),source:"WantGoo API",sourceSymbol:`${candleR.url} + ${stateR.url}`};
  });
}
function quoteFromTWSE(row,code,market){const price=nfloat(row.z)??nfloat(row.y),base=nfloat(row.y),pp=pct(price,base);return{ok:true,code,symbol:`${code}.${market==="上市"?"TW":"TWO"}`,market,name:row.n||code,price,base,previousClose:base,change:pp.change,changePercent:pp.changePercent,open:nfloat(row.o),high:nfloat(row.h),low:nfloat(row.l),time:row.t||"",updatedAt:new Date().toISOString(),source:"TWSE MIS"}}
async function twseBulk(codes){const out={};for(let i=0;i<codes.length;i+=20){const batch=codes.slice(i,i+20);const ex=[...batch.map(c=>`tse_${c}.tw`),...batch.map(c=>`otc_${c}.tw`)].join("|");try{const url=`https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${encodeURIComponent(ex)}&json=1&delay=0&_=${Date.now()}`;const res=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0","Referer":"https://mis.twse.com.tw/stock/index.jsp"}});if(!res.ok)throw new Error(`TWSE MIS HTTP ${res.status}`);const data=await res.json();for(const row of data.msgArray||[]){const code=row.c;if(!code||out[code])continue;const market=(row.ex||"").toLowerCase().includes("otc")?"上櫃":"上市";out[code]=quoteFromTWSE(row,code,market)}}catch(e){for(const c of batch)out[c]={ok:false,code:c,error:`TWSE MIS failed: ${e.message}`}}}return out}
async function twYahoo(code){for(const sym of [`${code}.TW`,`${code}.TWO`]){try{const r=await quoteDaily(sym,sym);return{...r,ok:true,code,symbol:sym,market:sym.endsWith(".TW")?"上市":"上櫃"}}catch(e){}}return{ok:false,code,error:"TWSE/Yahoo 都無資料"}}
async function twQuotes(codes){return cached(`tw:${codes.join(",")}`,4500,async()=>{const out=await twseBulk(codes);for(const c of codes)if(!out[c]||out[c].ok===false)out[c]=await twYahoo(c);return out})}
async function econLight(){
  return cached("econ-light",3600000,async()=>{
    const pageUrl="https://index.ndc.gov.tw/n/zh_tw";
    const apiUrl="https://index.ndc.gov.tw/n/json/lightscore";
    const fallback={currentMonth:"2026年5月",currentLight:"紅燈",currentScore:39,prevMonth:"2026年4月",prevLight:"紅燈",prevScore:40,sourceMode:"備援資料",marketRead:"中性偏多",note:"國發會 API 失敗時顯示截圖備援值",nextPublish:"2026-07-27 16:00",source:"fallback"};
    function parseSetCookie(headers){
      const cookies=[];
      if(headers.getSetCookie){for(const c of headers.getSetCookie()) cookies.push(c.split(";")[0]);}
      const one=headers.get("set-cookie");
      if(one){for(const part of one.split(/,(?=[^;,]+=)/)) cookies.push(part.split(";")[0].trim());}
      return cookies.filter(Boolean);
    }
    function cookieVal(cookies,name){
      const c=cookies.find(x=>x.startsWith(name+"="));
      return c?decodeURIComponent(c.slice(name.length+1)):null;
    }
    function monthLabel(yyyymm){return `${yyyymm.slice(0,4)}年${Number(yyyymm.slice(4,6))}月`;}
    function light(score){if(score<=16)return"藍燈"; if(score<=22)return"黃藍燈"; if(score<=31)return"綠燈"; if(score<=37)return"黃紅燈"; return"紅燈";}
    try{
      const page=await fetch(pageUrl,{headers:{"User-Agent":"Mozilla/5.0","Accept":"text/html,application/xhtml+xml"}});
      const cookies=parseSetCookie(page.headers);
      const cookieHeader=cookies.join("; ");
      const xsrf=cookieVal(cookies,"XSRF-TOKEN");
      const res=await fetch(apiUrl,{
        method:"POST",
        headers:{
          "User-Agent":"Mozilla/5.0",
          "Accept":"application/json,text/plain,*/*",
          "Content-Type":"application/json;charset=UTF-8",
          "Origin":"https://index.ndc.gov.tw",
          "Referer":pageUrl,
          ...(cookieHeader?{"Cookie":cookieHeader}:{}),
          ...(xsrf?{"X-XSRF-TOKEN":xsrf}:{}),
          "X-Requested-With":"XMLHttpRequest"
        },
        body:"{}"
      });
      if(!res.ok)throw new Error(`NDC HTTP ${res.status}`);
      const data=await res.json();
      const line=(data.line||[]).map(x=>({x:String(x.x||""),y:Number(x.y)})).filter(x=>x.x&&Number.isFinite(x.y));
      if(!line.length)throw new Error("NDC lightscore no line data");
      line.sort((a,b)=>a.x.localeCompare(b.x));
      const cur=line[line.length-1], prev=line[line.length-2];
      return{currentMonth:monthLabel(cur.x),currentLight:light(cur.y),currentScore:cur.y,prevMonth:prev?monthLabel(prev.x):fallback.prevMonth,prevLight:prev?light(prev.y):fallback.prevLight,prevScore:prev?.y??fallback.prevScore,sourceMode:"國發會 API",marketRead:cur.y>=38?"中性偏多":cur.y>=32?"偏多觀望":cur.y>=23?"中性":"偏保守",note:"已接國發會 /n/json/lightscore",nextPublish:data.next||fallback.nextPublish,source:apiUrl};
    }catch(e){return {...fallback,note:`國發會 API 失敗：${e.message}`};}
  });
}
async function dashboard(){const [v,b,t]=await Promise.allSettled([quoteDaily("^VIX","^VIX"),quoteDaily("BTC-USD","BTC-USD"),quoteDaily("^TNX","^TNX")]);const vix=v.status==="fulfilled"?v.value:null,btc=b.status==="fulfilled"?b.value:null,us10y=t.status==="fulfilled"?t.value:null;let risk="🟡 Neutral",riskDesc="VIX / BTC / 10Y 綜合判斷";if(vix?.price<20&&btc?.changePercent>0){risk="🔴 Risk ON";riskDesc="波動低且風險資產偏強"}if(vix?.price>25){risk="🟢 Risk OFF";riskDesc="VIX 偏高，市場風險趨避"}return{risk,riskDesc,vix,btc,us10y}}
async function handleUS(url){const symbols=(url.searchParams.get("symbols")||"MU,NVDA").split(",").map(s=>s.trim().toUpperCase()).filter(Boolean).slice(0,160);const results=[];for(const s of symbols){try{results.push({ok:true,quote:await quoteUSSession(s)})}catch(e){results.push({ok:false,symbol:s,error:e.message})}}return ok({results,session:sessionNow()})}
async function handleQuotes(url){const symbols=(url.searchParams.get("symbols")||"SPY").split(",").map(s=>s.trim()).filter(Boolean).slice(0,200);const out={};for(const s of symbols){try{out[s]=s==="TXF8"?await quoteTXF():s==="VIXTWN"?await quoteVIXTWN():await quoteDaily(s,s)}catch(e){out[s]={ok:false,symbol:s,error:e.message}}}return ok(out)}
async function handleTW(url){const codes=(url.searchParams.get("codes")||"2330").split(",").map(s=>s.trim()).filter(Boolean).slice(0,300);return ok(await twQuotes(codes))}
export default{async fetch(request){if(request.method==="OPTIONS")return new Response(null,{headers:corsHeaders});const url=new URL(request.url);try{if(url.pathname==="/"||url.pathname==="/health")return ok({version:"Anjou Terminal v5.1 Professional Hotfix API",message:"Anjou Terminal Worker v5.1 Professional Hotfix API",session:sessionNow(),cacheSize:CACHE.size});if(url.pathname==="/api/dashboard")return ok(await dashboard());if(url.pathname==="/api/econ-light")return ok(await econLight());if(url.pathname==="/api/session-quotes")return handleUS(url);if(url.pathname==="/api/quotes")return handleQuotes(url);if(url.pathname==="/api/tw-index")return handleQuotes(new URL("https://x/api/quotes?symbols=%5ETWII,%5ETWOII,%5ETEII,TXF8,VIXTWN"));if(url.pathname==="/api/tw-quotes"||url.pathname==="/api/tw-yahoo-quotes")return handleTW(url);return fail(`Not found: ${url.pathname}`,404)}catch(e){return fail(e.message,500)}}};
