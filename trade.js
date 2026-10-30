import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
const firebaseConfig={apiKey:"AIzaSyCmRE7PK3ve9DjBGIOCcOuq_5WyfUrwM50",authDomain:"global-savings.firebaseapp.com",projectId:"global-savings",storageBucket:"global-savings.firebasestorage.app",messagingSenderId:"83435054105",appId:"1:83435054105:web:efac6cbd5a264a6892b688"};
const app=initializeApp(firebaseConfig);const auth=getAuth(app);const db=getFirestore(app);
let currentUser=null, currentPrice=4027, chart, candleSeries, curCoin='BTC', curPct=92, liveTrades=[], pointerMode=false, detailChart, detailSeries;
const coins=[{n:'BTC',l:'₿',p:68509,pr:92},{n:'ETH',l:'Ξ',p:3849,pr:88},{n:'SOL',l:'◎',p:147,pr:94},{n:'GOLD',l:'●',p:4027,pr:90},{n:'EUR/USD',l:'€',p:1.084,pr:89},{n:'BNB',l:'B',p:612,pr:88}];
function initCoins(){let h=''; coins.forEach(c=>{h+=`<div onclick="selectCoin('${c.n}','${c.l}',${c.p},${c.pr})"><span>${c.l} ${c.n}</span><span>$${c.p} <b style="background:#155eef;color:white;padding:2px 6px;border-radius:10px">${c.pr}%</b></span></div>`;}); document.getElementById('coinList').innerHTML=h;} initCoins();

// FAST FAST STATS
let users=2417485, traded=184289213, live=15670;
setInterval(()=>{users+=Math.floor((Math.random()-0.45)*3500); traded+=Math.floor((Math.random()-0.45)*15000); live+=Math.floor((Math.random()-0.45)*250); document.getElementById('statUsers').textContent=users.toLocaleString(); document.getElementById('statTraded').textContent='$'+traded.toLocaleString(); document.getElementById('statLive').textContent=live.toLocaleString();},300);

function initChart(){
  const el=document.getElementById('tvChart'); if(chart) chart.remove();
  chart=LightweightCharts.createChart(el,{layout:{background:{color:'white'},textColor:'#64748b'},grid:{vertLines:{color:'#f1f5f9'},horzLines:{color:'#f1f5f9'}},width:el.clientWidth,height:el.clientHeight});
  candleSeries=chart.addCandlestickSeries({upColor:'#16a34a',downColor:'#ef4444',borderUpColor:'#16a34a',borderDownColor:'#ef4444',wickUpColor:'#16a34a',wickDownColor:'#ef4444',wickVisible:true});
  const now=Math.floor(Date.now()/1000); let data=[]; for(let i=120;i>=0;i--){let b=4022+Math.sin(i/4)*5+i*0.02; data.push({time:now-i*15,open:b,high:b+0.6,low:b-0.6,close:b+(Math.random()-0.5)});} candleSeries.setData(data);
  let last=4022;
  const fast=()=>{last+= (Math.random()-0.5)*1.5; currentPrice=last; const t=Math.floor(Date.now()/1000); candleSeries.update({time:t,open:last,high:last+0.6,low:last-0.6,close:currentPrice}); updateAllToolsPosition(); requestAnimationFrame(()=>setTimeout(fast,180));}; fast();
  chart.timeScale().subscribeVisibleLogicalRangeChange(()=>{updateAllToolsPosition();});
}
initChart();

function initDetailChart(){
  const el=document.getElementById('detailChart'); if(detailChart) detailChart.remove();
  detailChart=LightweightCharts.createChart(el,{layout:{background:{color:'white'},textColor:'#64748b'},grid:{vertLines:{color:'#f1f5f9'},horzLines:{color:'#f1f5f9'}},width:el.clientWidth,height:el.clientHeight});
  detailSeries=detailChart.addCandlestickSeries({upColor:'#16a34a',downColor:'#ef4444',borderUpColor:'#16a34a',borderDownColor:'#ef4444',wickUpColor:'#16a34a',wickDownColor:'#ef4444',wickVisible:true});
  const now=Math.floor(Date.now()/1000); let d=[]; for(let i=80;i>=0;i--){let b=currentPrice+Math.sin(i/5)*2; d.push({time:now-i*15,open:b,high:b+0.6,low:b-0.6,close:b+(Math.random()-0.5)});} detailSeries.setData(d);
  setInterval(()=>{const t=Math.floor(Date.now()/1000); detailSeries.update({time:t,open:currentPrice,high:currentPrice+0.6,low:currentPrice-0.6,close:currentPrice+(Math.random()-0.5)});},200);
}

window.toggleCoinDrop=()=>{document.getElementById('coinList').classList.toggle('show');};
window.selectCoin=(n,l,p,pr)=>{curCoin=n; curPct=pr; document.getElementById('curCoinLogo').textContent=l; document.getElementById('curCoinName').textContent=n; document.getElementById('curCoinPrice').textContent='$'+p; document.getElementById('curCoinPct').textContent=pr+'%'; document.getElementById('coinList').classList.remove('show');};
window.toggleSettings=()=>{document.getElementById('settingsPanel').classList.toggle('show');};
window.closeSettings=()=>{document.getElementById('settingsPanel').classList.remove('show');};

// TOOLS - 3 CIRCLES + FOLLOW ZOOM - ANCHORED TO TIME/PRICE
let toolsStore=[];
function createToolEl(type, t1,p1,t2,p2, rot){
  const wrap=document.createElement('div'); wrap.className='lineWrap'; wrap.dataset.type=type;
  wrap.dataset.t1=t1; wrap.dataset.p1=p1; wrap.dataset.t2=t2; wrap.dataset.p2=p2; wrap.dataset.rot=rot||0;
  const line=document.createElement('div'); line.className=type==='trend'?'trendLine':'predLine'; wrap.appendChild(line);
  const b=document.createElement('div'); b.className='circle cBlue'; b.title='Move start'; wrap.appendChild(b);
  const y=document.createElement('div'); y.className='circle cYellow'; y.title='Length'; wrap.appendChild(y);
  const g=document.createElement('div'); g.className='circle cGreen'; g.title='Rotate'; wrap.appendChild(g);
  document.getElementById('chartWrap').appendChild(wrap);
  if(type==='predict') wrap.onclick=(e)=>{if(e.target===b||e.target===y||e.target===g) return; document.getElementById('predictPopup').classList.add('show');};
  makeDrag3(wrap,b,y,g);
  positionTool(wrap);
}
function positionTool(wrap){
  if(!chart) return;
  const t1=Number(wrap.dataset.t1), p1=Number(wrap.dataset.p1), t2=Number(wrap.dataset.t2), p2=Number(wrap.dataset.p2);
  const x1=chart.timeScale().timeToCoordinate(t1), y1=candleSeries.priceToCoordinate(p1);
  const x2=chart.timeScale().timeToCoordinate(t2), y2=candleSeries.priceToCoordinate(p2);
  if(x1===null||y1===null||x2===null||y2===null){wrap.style.display='none'; return;} wrap.style.display='block';
  const dx=x2-x1, dy=y2-y1, len=Math.sqrt(dx*dx+dy*dy), ang=Math.atan2(dy,dx)*180/Math.PI + Number(wrap.dataset.rot||0);
  wrap.style.left=x1+'px'; wrap.style.top=y1+'px'; wrap.style.width=len+'px'; wrap.style.transform=`rotate(${ang}deg)`;
  // zoom effect: tiny when zoom out (scale width)
  const range=chart.timeScale().getVisibleLogicalRange(); if(range){const scale=Math.max(0.5, Math.min(2, 100/(range.to-range.from))); wrap.style.height=(scale*3)+'px';}
}
function updateAllToolsPosition(){document.querySelectorAll('.lineWrap').forEach(positionTool); document.querySelectorAll('.pinkDot').forEach(positionDot);}

function makeDrag3(wrap,b,y,g){
  let drag=null;
  b.onmousedown=(e)=>{e.stopPropagation(); drag='moveStart';}; y.onmousedown=(e)=>{e.stopPropagation(); drag='moveEnd';}; g.onmousedown=(e)=>{e.stopPropagation(); drag='rotate'; wrap.dataset.startRot=Number(wrap.dataset.rot||0); wrap.dataset.startAng=Math.atan2(e.clientY-wrap.getBoundingClientRect().top, e.clientX-wrap.getBoundingClientRect().left)*180/Math.PI;};
  wrap.onmousedown=(e)=>{if(e.target===b||e.target===y||e.target===g) return; drag='dragAll'; wrap.dataset.sx=e.clientX-wrap.offsetLeft; wrap.dataset.sy=e.clientY-wrap.offsetTop;};
  document.onmousemove=(e)=>{
    if(!drag) return;
    if(drag==='moveStart'){const t=chart.timeScale().coordinateToTime(e.clientX), p=candleSeries.coordinateToPrice(e.clientY); if(t&&p){wrap.dataset.t1=t; wrap.dataset.p1=p;}}
    if(drag==='moveEnd'){const t=chart.timeScale().coordinateToTime(e.clientX), p=candleSeries.coordinateToPrice(e.clientY); if(t&&p){wrap.dataset.t2=t; wrap.dataset.p2=p;}}
    if(drag==='rotate'){const rc=wrap.getBoundingClientRect(); const cx=rc.left, cy=rc.top; const curAng=Math.atan2(e.clientY-cy, e.clientX-cx)*180/Math.PI; const rot=curAng-Number(wrap.dataset.startAng); wrap.dataset.rot=Number(wrap.dataset.startRot)+rot;}
    if(drag==='dragAll'){wrap.style.left=(e.clientX-Number(wrap.dataset.sx))+'px'; wrap.style.top=(e.clientY-Number(wrap.dataset.sy))+'px'; const t=chart.timeScale().coordinateToTime(e.clientX), p=candleSeries.coordinateToPrice(e.clientY); if(t&&p){const dx=t-wrap.dataset.t1, dy=p-wrap.dataset.p1; wrap.dataset.t1=Number(wrap.dataset.t1)+dx; wrap.dataset.p1=Number(wrap.dataset.p1)+dy; wrap.dataset.t2=Number(wrap.dataset.t2)+dx; wrap.dataset.p2=Number(wrap.dataset.p2)+dy;}}
    positionTool(wrap);
  };
  document.onmouseup=()=>{drag=null; saveAllDraw();};
}

window.activateTool=(tool)=>{
  closeSettings();
  const now=Math.floor(Date.now()/1000);
  const t1=now-60, t2=now-10, p1=currentPrice, p2=currentPrice+2;
  createToolEl(tool,t1,p1,t2,p2,0);
  if(tool==='pointer') document.getElementById('pointerPopup').classList.add('show');
};

// PINK DOT INSIDE CANDLES - NOT PRICE SIDE
function positionDot(dot){
  const t=Number(dot.dataset.t), p=Number(dot.dataset.p);
  const x=chart.timeScale().timeToCoordinate(t), y=candleSeries.priceToCoordinate(p);
  if(x===null||y===null){dot.style.display='none'; return;} dot.style.display='block'; dot.style.left=x+'px'; dot.style.top=y+'px';
}
window.enablePointerTap=()=>{
  closePointerPop(); pointerMode=true;
  document.getElementById('chartWrap').onclick=(e)=>{
    if(!pointerMode) return; if(e.target.closest('.lineWrap')||e.target.closest('button')) return;
    // ensure inside candles area (not on right price scale)
    if(e.clientX > document.getElementById('chartWrap').getBoundingClientRect().right-80) return; // block price side
    const t=chart.timeScale().coordinateToTime(e.clientX), p=candleSeries.coordinateToPrice(e.clientY);
    if(!t||!p) return;
    const dot=document.createElement('div'); dot.className='pinkDot'; dot.dataset.t=t; dot.dataset.p=p;
    document.getElementById('pinkDots').appendChild(dot); positionDot(dot); pointerMode=false;
    saveAllDraw();
  };
};

window.saveAllDraw=()=>{
  let arr=[]; document.querySelectorAll('.lineWrap').forEach(w=>{arr.push({type:w.dataset.type,t1:w.dataset.t1,p1:w.dataset.p1,t2:w.dataset.t2,p2:w.dataset.p2,rot:w.dataset.rot});});
  let dots=[]; document.querySelectorAll('.pinkDot').forEach(d=>{dots.push({t:d.dataset.t,p:d.dataset.p});});
  localStorage.setItem('tools_m',JSON.stringify(arr)); localStorage.setItem('dots_m',JSON.stringify(dots));
  showPop('SAVED','Tools now follow candles - zoom in/out tiny/bold','✓',true);
};
function restoreM(){const a=localStorage.getItem('tools_m'), b=localStorage.getItem('dots_m'); if(a){JSON.parse(a).forEach(it=>{createToolEl(it.type,it.t1,it.p1,it.t2,it.p2,it.rot);});} if(b){JSON.parse(b).forEach(pt=>{const d=document.createElement('div'); d.className='pinkDot'; d.dataset.t=pt.t; d.dataset.p=pt.p; document.getElementById('pinkDots').appendChild(d); positionDot(d);});}} setTimeout(restoreM,700);
window.clearAllDraw=()=>{document.querySelectorAll('.lineWrap').forEach(e=>e.remove()); document.getElementById('pinkDots').innerHTML=''; localStorage.removeItem('tools_m'); localStorage.removeItem('dots_m');};
window.closePointerPop=()=>{document.getElementById('pointerPopup').classList.remove('show'); pointerMode=false;};
window.closePredictPop=()=>{document.getElementById('predictPopup').classList.remove('show');};
window.confirmPredict=()=>{closePredictPop(); openTrade('buy');};
window.openTrade=(type)=>{pendingType=type; document.getElementById('formTitle').textContent=`${type.toUpperCase()} ${curCoin} ${curPct}%`; document.getElementById('fTP').value=Math.floor((Number(document.getElementById('fAmount').value||100)*curPct)/100); document.getElementById('tradeForm').classList.add('show');};
window.closeTrade=()=>{document.getElementById('tradeForm').classList.remove('show');};
window.activateTrade=async()=>{
  const amt=Number(document.getElementById('fAmount').value||100); const sl=Number(document.getElementById('fSL').value||0); const tp=Number(document.getElementById('fTP').value||0);
  const us=await getDoc(doc(db,'users',currentUser.uid)); const end=Date.now()+60000;
  await addDoc(collection(db,'trades'),{uid:currentUser.uid,coin:curCoin,type:pendingType,amount:amt,stopLossAmount:sl,takeProfitAmount:tp,profitPct:curPct,entryPrice:currentPrice,entryTime:new Date().toISOString(),endTime:end,status:'active',createdAt:serverTimestamp(),username:us.data()?.username||''});
  const now=Math.floor(Date.now()/1000); const dot=document.createElement('div'); dot.className='pinkDot'; dot.dataset.t=now; dot.dataset.p=currentPrice; document.getElementById('pinkDots').appendChild(dot); positionDot(dot);
  closeTrade(); saveAllDraw(); showPop('TRADE ACTIVATED',`${pendingType.toUpperCase()} ${curCoin} ${curPct}% Live`,`$${amt}`,true);
};

onAuthStateChanged(auth,async u=>{
  if(!u){location.href='login.html';return;} currentUser=u;
  const us=await getDoc(doc(db,'users',u.uid)); document.getElementById('userBalTop').textContent='$'+Number(us.data()?.balance||0).toFixed(2); document.getElementById('balBold').textContent='$'+Number(us.data()?.balance||0).toFixed(2);
  const q=query(collection(db,'trades'),where('uid','==',u.uid),where('status','==','active'));
  onSnapshot(q,snap=>{
    liveTrades=[]; snap.forEach(d=>{let t=d.data(); t.id=d.id; liveTrades.push(t);}); renderLive();
    snap.docChanges().forEach(ch=>{const t=ch.doc.data(); if(t.finalVerdict==='approve') showPop('TRADE SUCCESSFUL',`Your ${t.coin} ${t.type.toUpperCase()} won +${t.profitPct||curPct}%`,`$${Number(t.amount)+Number(t.takeProfitAmount||0)}`,true); if(t.finalVerdict==='rejected') showPop('TRADE LOST',`Your ${t.coin} ${t.type.toUpperCase()} lost`,`$${t.stopLossAmount||0}`,false);});
  });
});
function renderLive(){
  let html=''; liveTrades.forEach(t=>{
    const rem=Math.max(0,Math.floor((t.endTime-Date.now())/1000));
    html+=`<div style="background:white;border:2px solid #155eef;border-radius:12px;padding:12px;margin-bottom:10px" onclick="openDetail('${t.id}')"><div style="display:flex;justify-content:space-between;font-weight:bold"><span>${t.coin} ${t.type.toUpperCase()} $${t.amount} <small style="background:#155eef;color:white;padding:2px 6px;border-radius:8px">${t.profitPct||curPct}%</small></span><span style="background:#ef4444;color:white;padding:2px 8px;border-radius:10px">${rem}s</span></div><div style="font-size:11px;color:#64748b">Start: ${new Date(t.entryTime).toLocaleString()}<br>End: ${new Date(t.endTime).toLocaleString()}</div></div>`;
  });
  document.getElementById('liveListContainer').innerHTML=html||'<p>No live trades</p>';
}
window.openLiveList=()=>{document.getElementById('liveListModal').classList.add('show');};
window.closeLiveList=()=>{document.getElementById('liveListModal').classList.remove('show');};
window.openDetail=(id)=>{
  const t=liveTrades.find(x=>x.id===id); if(!t) return;
  document.getElementById('liveDetail').classList.add('show');
  document.getElementById('detailCoin').textContent=`${t.coin} - ${t.profitPct||curPct}% - $${Number(t.entryPrice).toFixed(2)}`;
  document.getElementById('dAmount').textContent='$'+t.amount; document.getElementById('dStart').textContent=new Date(t.entryTime).toLocaleString(); document.getElementById('dEndFull').textContent=new Date(t.endTime).toLocaleString();
  setTimeout(initDetailChart,100);
  const int=setInterval(()=>{
    let pnl=(t.type==='buy'?(currentPrice-t.entryPrice):(t.entryPrice-currentPrice))*(t.amount/80)*(t.profitPct/100*2);
    const rem=Math.max(0,Math.floor((t.endTime-Date.now())/1000));
    document.getElementById('dProfit').textContent=(pnl>=0?'+$':'-$')+Math.abs(pnl).toFixed(2)+` (${t.profitPct||curPct}%)`;
    document.getElementById('dProfit').style.color=pnl>=0?'#16a34a':'#ef4444';
    document.getElementById('detailTimer').textContent=rem+'s';
    if(rem<=0) clearInterval(int);
  },200);
};
window.closeDetail=()=>{document.getElementById('liveDetail').classList.remove('show');};
function showPop(t,d,a,win){document.getElementById('pT').textContent=t;document.getElementById('pD').textContent=d;document.getElementById('pA').textContent=a;document.getElementById('pTick').textContent=win?'✓':'✕';document.getElementById('pTick').style.background=win?'#22c55e':'#ef4444';document.getElementById('popup').classList.add('show');}
window.showPop=showPop; window.closePop=()=>{document.getElementById('popup').classList.remove('show');};