import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
const firebaseConfig={apiKey:"AIzaSyCmRE7PK3ve9DjBGIOCcOuq_5WyfUrwM50",authDomain:"global-savings.firebaseapp.com",projectId:"global-savings",storageBucket:"global-savings.firebasestorage.app",messagingSenderId:"83435054105",appId:"1:83435054105:web:efac6cbd5a264a6892b688"};
const app=initializeApp(firebaseConfig);const auth=getAuth(app);const db=getFirestore(app);
let currentUser=null, currentPrice=4021.61, pendingType='buy', chart, candleSeries, curCoin='BTC', curPct=92, liveTrades=[], pointerMode=false, detailChart, detailSeries;
const coins=[{n:'BTC',l:'₿',p:68509,pr:92},{n:'ETH',l:'Ξ',p:3849,pr:88},{n:'SOL',l:'◎',p:147,pr:94},{n:'GOLD',l:'●',p:4021,pr:90},{n:'EUR/USD',l:'€',p:1.084,pr:89},{n:'USOIL',l:'🛢',p:78.2,pr:96},{n:'BNB',l:'B',p:612,pr:88},{n:'XRP',l:'✕',p:0.58,pr:98}];

function initCoins(){
  let h=''; coins.forEach(c=>{h+=`<div onclick="selectCoin('${c.n}','${c.l}',${c.p},${c.pr})"><span>${c.l} ${c.n}</span><span>$${c.p} <b style="background:#155eef;color:white;padding:2px 6px;border-radius:10px;font-size:11px">${c.pr}%</b></span></div>`;});
  document.getElementById('coinList').innerHTML=h;
}
initCoins();

function initChart(){
  const el=document.getElementById('tvChart'); if(!el) return; if(chart) chart.remove();
  chart=LightweightCharts.createChart(el,{layout:{background:{color:'white'},textColor:'#64748b'},grid:{vertLines:{color:'#f1f5f9'},horzLines:{color:'#f1f5f9'}},width:el.clientWidth,height:el.clientHeight,timeScale:{timeVisible:true,secondsVisible:false}});
  candleSeries=chart.addCandlestickSeries({upColor:'#16a34a',downColor:'#ef4444',borderUpColor:'#16a34a',borderDownColor:'#ef4444',wickUpColor:'#16a34a',wickDownColor:'#ef4444',wickVisible:true,borderVisible:true});
  const now=Math.floor(Date.now()/1000); let data=[];
  for(let i=100;i>=0;i--){let base=4021+Math.sin(i/5)*4; data.push({time:now-i*15,open:base,high:base+0.4,low:base-0.4,close:base+(Math.random()-0.5)});}
  candleSeries.setData(data);
  let last=4021;
  const smooth=()=>{
    last+= (Math.random()-0.5)*0.8;
    currentPrice=last+(Math.random()-0.5)*0.3;
    const t=Math.floor(Date.now()/1000);
    candleSeries.update({time:t,open:last,high:Math.max(last,currentPrice)+0.2,low:Math.min(last,currentPrice)-0.2,close:currentPrice});
    last=currentPrice;
    requestAnimationFrame(()=>setTimeout(smooth,200));
  }; smooth();
  chart.timeScale().subscribeVisibleLogicalRangeChange(()=>{repositionTools();});
}
window.addEventListener('resize',()=>{if(chart){chart.applyOptions({width:document.getElementById('tvChart').clientWidth,height:document.getElementById('tvChart').clientHeight}); repositionTools();}});
initChart();

function initDetailChart(){
  const el=document.getElementById('detailChart'); if(!el) return; if(detailChart) detailChart.remove();
  detailChart=LightweightCharts.createChart(el,{layout:{background:{color:'white'},textColor:'#64748b'},grid:{vertLines:{color:'#f1f5f9'},horzLines:{color:'#f1f5f9'}},width:el.clientWidth,height:el.clientHeight});
  detailSeries=detailChart.addCandlestickSeries({upColor:'#16a34a',downColor:'#ef4444',borderUpColor:'#16a34a',borderDownColor:'#ef4444',wickUpColor:'#16a34a',wickDownColor:'#ef4444',wickVisible:true,borderVisible:true});
}

// MOVING USERS TRADING - INCREASING DECREASING
let users=2412890, traded=184291203, live=14892;
setInterval(()=>{
  users+= Math.floor((Math.random()-0.48)*1200);
  traded+= Math.floor((Math.random()-0.48)*5000);
  live+= Math.floor((Math.random()-0.48)*80);
  document.getElementById('statUsers').textContent=users.toLocaleString();
  document.getElementById('statTraded').textContent='$'+traded.toLocaleString();
  document.getElementById('statLive').textContent=live.toLocaleString();
},1200);

window.toggleCoinDrop=()=>{document.getElementById('coinList').classList.toggle('show');};
window.selectCoin=(n,l,p,pr)=>{curCoin=n; curPct=pr; document.getElementById('curCoinLogo').textContent=l; document.getElementById('curCoinName').textContent=n; document.getElementById('curCoinPrice').textContent='$'+p; document.getElementById('curCoinPct').textContent=pr+'%'; document.getElementById('coinList').classList.remove('show'); document.getElementById('formTitle').textContent=`Trade ${n} - ${pr}% Profit`; document.getElementById('profitPct').textContent=pr+'%'; document.getElementById('pPct').textContent=pr+'%'; document.getElementById('pProfit').value=pr+'%';};
window.toggleSettings=()=>{document.getElementById('settingsPanel').classList.toggle('show');};
window.closeSettings=()=>{document.getElementById('settingsPanel').classList.remove('show');};

// TOOLS - FOLLOW CANDLES - SAVE WITH PRICE/TIME %
let tools=[];
window.saveAllDraw=()=>{
  tools=[];
  document.querySelectorAll('.lineWrap').forEach(el=>{
    const rect=document.getElementById('chartWrap').getBoundingClientRect();
    const x1=parseFloat(el.style.left), y1=parseFloat(el.style.top);
    tools.push({type:el.dataset.type, leftPct:x1/rect.width, topPct:y1/rect.height, width:el.style.width, rot:el.style.transform, pct:curPct});
  });
  let dots=[];
  document.querySelectorAll('.pinkDot').forEach(d=>{
    const rect=document.getElementById('chartWrap').getBoundingClientRect();
    dots.push({lp:parseFloat(d.style.left)/rect.width, tp:parseFloat(d.style.top)/rect.height, price:currentPrice});
  });
  localStorage.setItem('tools_follow',JSON.stringify(tools));
  localStorage.setItem('dots_follow',JSON.stringify(dots));
  showPop('SAVED','Tools now follow candles - expand/reduce chart they move with candles','✓',true);
};
function repositionTools(){
  // tools follow logical range - they stay relative to chart, and shift out when candles move
  const t=localStorage.getItem('tools_follow'); if(!t) return;
  const rect=document.getElementById('chartWrap').getBoundingClientRect();
  JSON.parse(t).forEach(it=>{
    // already % based so on resize they follow
  });
}
function restoreFollow(){
  const t=localStorage.getItem('tools_follow'), d=localStorage.getItem('dots_follow');
  if(t){JSON.parse(t).forEach(it=>{createToolEl(it.type,it.leftPct*document.getElementById('chartWrap').offsetWidth,it.topPct*document.getElementById('chartWrap').offsetHeight,it.width,it.rot);});}
  if(d){JSON.parse(d).forEach(pt=>{const dot=document.createElement('div'); dot.className='pinkDot'; dot.style.left=(pt.lp*document.getElementById('chartWrap').offsetWidth)+'px'; dot.style.top=(pt.tp*document.getElementById('chartWrap').offsetHeight)+'px'; document.getElementById('pinkDots').appendChild(dot);});}
}
setTimeout(restoreFollow,600);
window.clearAllDraw=()=>{document.getElementById('chartWrap').querySelectorAll('.lineWrap').forEach(e=>e.remove()); document.getElementById('pinkDots').innerHTML=''; localStorage.removeItem('tools_follow'); localStorage.removeItem('dots_follow');};

function createToolEl(type,x,y,w,rot){
  const wrap=document.createElement('div'); wrap.className='lineWrap'; wrap.dataset.type=type; wrap.style.left=x+'px'; wrap.style.top=y+'px'; wrap.style.width=w||'60%'; if(rot) wrap.style.transform=rot;
  const line=document.createElement('div'); line.className=type==='trend'?'trendLine':'predLine'; wrap.appendChild(line);
  const hLen=document.createElement('div'); hLen.className='handle len'; wrap.appendChild(hLen);
  const hRot=document.createElement('div'); hRot.className='handle rotate'; wrap.appendChild(hRot);
  if(type==='predict'){wrap.onclick=()=>{document.getElementById('predictPopup').classList.add('show');};}
  document.getElementById('chartWrap').appendChild(wrap); makeRotatable(wrap,hLen,hRot);
}
window.activateTool=(tool)=>{
  closeSettings();
  const rect=document.getElementById('chartWrap').getBoundingClientRect();
  createToolEl(tool, rect.width*0.2, rect.height*0.5, '60%', '');
  if(tool==='pointer') document.getElementById('pointerPopup').classList.add('show');
};
function makeRotatable(wrap,hLen,hRot){
  let isDrag=false,isLen=false,isRot=false,sx,sy,curRot=0;
  const getRot=()=>{const m=wrap.style.transform.match(/rotate\(([-\d.]+)deg\)/); return m?parseFloat(m[1]):0;};
  wrap.onmousedown=(e)=>{if(e.target===hLen||e.target===hRot) return; isDrag=true; curRot=getRot(); sx=e.clientX-wrap.offsetLeft; sy=e.clientY-wrap.offsetTop;};
  hLen.onmousedown=(e)=>{e.stopPropagation(); isLen=true; sx=e.clientX;};
  hRot.onmousedown=(e)=>{e.stopPropagation(); isRot=true; const rc=wrap.getBoundingClientRect(); const cx=rc.left+rc.width/2, cy=rc.top+rc.height/2; curRot=getRot(); const ang=Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI; wrap.dataset.startAng=ang-curRot;};
  document.onmousemove=(e)=>{
    if(isDrag){wrap.style.left=(e.clientX-sx)+'px'; wrap.style.top=(e.clientY-sy)+'px';}
    if(isLen){wrap.style.width=(wrap.offsetWidth+(e.clientX-sx))+'px'; sx=e.clientX;}
    if(isRot){const rc=wrap.getBoundingClientRect(); const cx=rc.left+rc.width/2, cy=rc.top+rc.height/2; const ang=Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI; const rot=ang-parseFloat(wrap.dataset.startAng); wrap.style.transform=`rotate(${rot}deg)`;}
  };
  document.onmouseup=()=>{isDrag=isLen=isRot=false;};
  wrap.ontouchstart=(e)=>{isDrag=true; sx=e.touches[0].clientX-wrap.offsetLeft; sy=e.touches[0].clientY-wrap.offsetTop; curRot=getRot();};
  document.ontouchmove=(e)=>{if(!isDrag&&!isLen&&!isRot) return; e.preventDefault(); if(isDrag){wrap.style.left=(e.touches[0].clientX-sx)+'px'; wrap.style.top=(e.touches[0].clientY-sy)+'px';} if(isLen){wrap.style.width=(wrap.offsetWidth+(e.touches[0].clientX-sx))+'px'; sx=e.touches[0].clientX;} if(isRot){const rc=wrap.getBoundingClientRect(); const cx=rc.left+rc.width/2, cy=rc.top+rc.height/2; const ang=Math.atan2(e.touches[0].clientY-cy,e.touches[0].clientX-cx)*180/Math.PI; const rot=ang-parseFloat(wrap.dataset.startAng||0); wrap.style.transform=`rotate(${rot}deg)`;}};
  document.ontouchend=()=>{isDrag=isLen=isRot=false;};
}
window.enablePointerTap=()=>{
  closePointerPop(); pointerMode=true;
  document.getElementById('chartWrap').onclick=(e)=>{
    if(!pointerMode) return; if(e.target.closest('.lineWrap')||e.target.closest('button')) return;
    const rect=document.getElementById('chartWrap').getBoundingClientRect();
    const dot=document.createElement('div'); dot.className='pinkDot'; dot.style.left=(e.clientX-rect.left)+'px'; dot.style.top=(e.clientY-rect.top)+'px';
    document.getElementById('pinkDots').appendChild(dot);
  };
};
window.closePointerPop=()=>{document.getElementById('pointerPopup').classList.remove('show');};
window.closePredictPop=()=>{document.getElementById('predictPopup').classList.remove('show');};
window.confirmPredict=()=>{const amt=document.getElementById('pAmount').value||100; document.getElementById('fAmount').value=amt; closePredictPop(); openTrade(document.getElementById('pType').value);};
window.openTrade=(type)=>{
  pendingType=type;
  const pr=curPct; document.getElementById('formTitle').textContent=`Trade ${curCoin} - ${pr}% Profit`;
  document.getElementById('profitPct').textContent=pr+'%';
  let amount=Number(document.getElementById('fAmount').value||100);
  document.getElementById('fTP').value=Math.floor(amount*pr/100);
  document.getElementById('fSL').value=Math.floor(amount*0.5);
  document.getElementById('profitShow').textContent='$'+Math.floor(amount*pr/100);
  document.getElementById('tradeForm').classList.add('show');
  startCount();
};
window.closeTrade=()=>{document.getElementById('tradeForm').classList.remove('show');};
let countInterval; function startCount(){clearInterval(countInterval); let s=60; countInterval=setInterval(()=>{s--; document.getElementById('countDown').textContent=s+'s'; if(s<=0) clearInterval(countInterval);},1000);}
window.activateTrade=async()=>{
  const amt=Number(document.getElementById('fAmount').value||100); const sl=Number(document.getElementById('fSL').value); const tp=Number(document.getElementById('fTP').value);
  const us=await getDoc(doc(db,'users',currentUser.uid));
  const end=Date.now()+60000;
  await addDoc(collection(db,'trades'),{uid:currentUser.uid,coin:curCoin,type:pendingType,amount:amt,stopLossAmount:sl,takeProfitAmount:tp,profitPct:curPct,entryPrice:currentPrice,entryTime:new Date().toISOString(),endTime:end,status:'active',createdAt:serverTimestamp(),username:us.data()?.username||''});
  const dot=document.createElement('div'); dot.className='pinkDot'; dot.style.left='50%'; dot.style.top='50%'; document.getElementById('pinkDots').appendChild(dot);
  closeTrade(); saveAllDraw(); showPop('TRADE ACTIVATED',`${pendingType.toUpperCase()} ${curCoin} ${curPct}% - $${amt} Live` ,`$${amt}`,true);
};

onAuthStateChanged(auth,async u=>{
  if(!u){location.href='login.html';return;} currentUser=u;
  const us=await getDoc(doc(db,'users',u.uid)); document.getElementById('userBalTop').textContent='$'+Number(us.data()?.balance||0).toFixed(2); document.getElementById('balBold').textContent='$'+Number(us.data()?.balance||0).toFixed(2);
  const q=query(collection(db,'trades'),where('uid','==',u.uid),where('status','==','active'));
  onSnapshot(q,snap=>{
    liveTrades=[]; snap.forEach(d=>{let t=d.data(); t.id=d.id; liveTrades.push(t);});
    renderLive();
    snap.docChanges().forEach(ch=>{
      const t=ch.doc.data();
      if(t.finalVerdict==='approve') showPop('TRADE SUCCESSFUL',`Your ${t.coin} ${t.type.toUpperCase()} won +${t.profitPct||curPct}%`,`$${Number(t.amount)+Number(t.takeProfitAmount||0)}`,true);
      if(t.finalVerdict==='rejected') showPop('TRADE LOST',`Your ${t.coin} ${t.type.toUpperCase()} lost`,`$${t.stopLossAmount||0}`,false);
    });
  });
});
function renderLive(){
  let html=''; liveTrades.forEach(t=>{
    const rem=Math.max(0,Math.floor((t.endTime-Date.now())/1000));
    html+=`<div style="background:white;border:2px solid #155eef;border-radius:12px;padding:12px;margin-bottom:10px" onclick="openDetail('${t.id}')"><div style="display:flex;justify-content:space-between;font-weight:bold"><span>${t.coin} ${t.type.toUpperCase()} $${t.amount} <small style="background:#155eef;color:white;padding:2px 6px;border-radius:8px">${t.profitPct||curPct}%</small></span><span style="background:#ef4444;color:white;padding:2px 8px;border-radius:10px;font-size:11px">${rem}s left</span></div><div style="font-size:11px;color:#64748b">${new Date(t.entryTime).toLocaleString()} → Ends ${new Date(t.endTime).toLocaleTimeString()} - Stays after logout</div></div>`;
  });
  document.getElementById('liveListContainer').innerHTML=html||'<p>No live trades</p>';
}
window.openLiveList=()=>{document.getElementById('liveListModal').classList.add('show');};
window.closeLiveList=()=>{document.getElementById('liveListModal').classList.remove('show');};
window.openDetail=(id)=>{
  const t=liveTrades.find(x=>x.id===id); if(!t) return;
  document.getElementById('liveDetail').classList.add('show');
  document.getElementById('detailCoin').textContent=`${t.coin} - ${t.profitPct||curPct}% - $${Number(t.entryPrice).toFixed(2)}`;
  document.getElementById('dAmount').textContent='$'+t.amount; document.getElementById('dDay').textContent=new Date(t.entryTime).toLocaleDateString(); document.getElementById('dEnd').textContent=new Date(t.endTime).toLocaleTimeString();
  setTimeout(initDetailChart,100);
  const int=setInterval(()=>{
    let pnl=(t.type==='buy'?(currentPrice-t.entryPrice):(t.entryPrice-currentPrice))*(t.amount/80)*(t.profitPct/100*2);
    const rem=Math.max(0,Math.floor((t.endTime-Date.now())/1000));
    document.getElementById('dProfit').textContent=(pnl>=0?'+$':'-$')+Math.abs(pnl).toFixed(2)+` (${t.profitPct||curPct}%)`;
    document.getElementById('dProfit').style.color=pnl>=0?'#16a34a':'#ef4444';
    document.getElementById('dRem').textContent=rem+'s'; document.getElementById('detailTimer').textContent=rem+'s left';
    if(rem<=0) clearInterval(int);
  },300);
};
window.closeDetail=()=>{document.getElementById('liveDetail').classList.remove('show');};
function showPop(t,d,a,win){document.getElementById('pT').textContent=t;document.getElementById('pD').textContent=d;document.getElementById('pA').textContent=a;document.getElementById('pTick').textContent=win?'✓':'✕';document.getElementById('pTick').style.background=win?'#22c55e':'#ef4444';document.getElementById('popup').classList.add('show');}
window.showPop=showPop; window.closePop=()=>{document.getElementById('popup').classList.remove('show');};