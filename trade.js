import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
const firebaseConfig={apiKey:"AIzaSyCmRE7PK3ve9DjBGIOCcOuq_5WyfUrwM50",authDomain:"global-savings.firebaseapp.com",projectId:"global-savings",storageBucket:"global-savings.firebasestorage.app",messagingSenderId:"83435054105",appId:"1:83435054105:web:efac6cbd5a264a6892b688"};
const app=initializeApp(firebaseConfig);const auth=getAuth(app);const db=getFirestore(app);
let currentUser=null, currentPrice=4021.61, pendingType='buy', chart, candleSeries, curCoin='BTC', liveTrades=[], activeTool=null, pointerMode=false, detailChart, detailSeries;

function initChart(){
  const el=document.getElementById('tvChart'); if(!el) return; if(chart) chart.remove();
  chart=LightweightCharts.createChart(el,{layout:{background:{color:'white'},textColor:'#64748b'},grid:{vertLines:{color:'#f1f5f9'},horzLines:{color:'#f1f5f9'}},width:el.clientWidth,height:el.clientHeight});
  candleSeries=chart.addCandlestickSeries({upColor:'#16a34a',downColor:'#ef4444',borderUpColor:'#16a34a',borderDownColor:'#ef4444',wickUpColor:'transparent',wickDownColor:'transparent',borderVisible:true,wickVisible:false});
  const now=Math.floor(Date.now()/1000); let data=[];
  for(let i=80;i>=0;i--){let base=4021+Math.sin(i/6)*3; data.push({time:now-i*15,open:base,high:base+0.15,low:base-0.15,close:base+(Math.random()-0.5)*0.4});}
  candleSeries.setData(data);
  // FAST CANDLES - GOING WELL LIKE COINS
  setInterval(()=>{
    currentPrice+=(Math.random()-0.5)*1.2;
    const t=Math.floor(Date.now()/1000);
    candleSeries.update({time:t,open:currentPrice,high:currentPrice+0.15,low:currentPrice-0.15,close:currentPrice+(Math.random()-0.5)*0.5});
  },300); // FAST
}
window.addEventListener('resize',()=>{if(chart) chart.applyOptions({width:document.getElementById('tvChart').clientWidth,height:document.getElementById('tvChart').clientHeight}); restoreDraw();});
initChart();

function initDetailChart(){
  const el=document.getElementById('detailChart'); if(!el) return; if(detailChart) detailChart.remove();
  detailChart=LightweightCharts.createChart(el,{layout:{background:{color:'white'},textColor:'#64748b'},grid:{vertLines:{color:'#f1f5f9'},horzLines:{color:'#f1f5f9'}},width:el.clientWidth,height:el.clientHeight});
  detailSeries=detailChart.addCandlestickSeries({upColor:'#16a34a',downColor:'#ef4444',borderUpColor:'#16a34a',borderDownColor:'#ef4444',wickUpColor:'transparent',wickDownColor:'transparent',borderVisible:true,wickVisible:false});
  const now=Math.floor(Date.now()/1000); let data=[];
  for(let i=60;i>=0;i--){let base=currentPrice+Math.sin(i/5); data.push({time:now-i*15,open:base,high:base+0.15,low:base-0.15,close:base+(Math.random()-0.5)*0.4});}
  detailSeries.setData(data);
  setInterval(()=>{
    const t=Math.floor(Date.now()/1000);
    detailSeries.update({time:t,open:currentPrice,high:currentPrice+0.15,low:currentPrice-0.15,close:currentPrice+(Math.random()-0.5)*0.5});
  },300);
}

window.toggleCoinDrop=()=>{document.getElementById('coinList').classList.toggle('show');};
window.selectCoin=(n,l,p)=>{curCoin=n; document.getElementById('curCoinLogo').textContent=l; document.getElementById('curCoinName').textContent=n; document.getElementById('curCoinPrice').textContent='$'+p; document.getElementById('coinList').classList.remove('show');};
window.toggleSettings=()=>{document.getElementById('settingsPanel').classList.toggle('show');};
window.closeSettings=()=>{document.getElementById('settingsPanel').classList.remove('show');};

// PERMANENT SAVE - RESTORE EVEN AFTER EXPAND/REDUCE
window.saveAllDraw=()=>{
  const layer=document.getElementById('drawLayer').innerHTML;
  const dots=document.getElementById('pinkDots').innerHTML;
  localStorage.setItem('trade_draw_layer',layer);
  localStorage.setItem('trade_pink_dots',dots);
  // also save as % positions for resize safety
  let items=[];
  document.querySelectorAll('.lineWrap').forEach(el=>{
    items.push({top:el.style.top,left:el.style.left,width:el.style.width,transform:el.style.transform,html:el.innerHTML,cls:el.querySelector('.trendLine')?'trend':'pred'});
  });
  localStorage.setItem('trade_draw_json',JSON.stringify(items));
  let dotsArr=[];
  document.querySelectorAll('#pinkDots .pinkDot').forEach(d=>{
    dotsArr.push({left:d.style.left,top:d.style.top});
  });
  localStorage.setItem('trade_dots_json',JSON.stringify(dotsArr));
  showPop('SAVED','All tools saved permanently - stays on green/red candles','✓',true);
};
function restoreDraw(){
  const json=localStorage.getItem('trade_draw_json'); const dotsJson=localStorage.getItem('trade_dots_json');
  if(json){
    document.getElementById('drawLayer').innerHTML='';
    JSON.parse(json).forEach(it=>{
      const wrap=document.createElement('div'); wrap.className='lineWrap'; wrap.style.top=it.top; wrap.style.left=it.left; wrap.style.width=it.width; wrap.style.transform=it.transform; wrap.innerHTML=it.html;
      document.getElementById('drawLayer').appendChild(wrap);
      const hLen=wrap.querySelector('.handle.len'), hRot=wrap.querySelector('.handle.rotate');
      if(hLen&&hRot) makeRotatable(wrap,hLen,hRot);
      if(it.cls==='pred') wrap.onclick=()=>{document.getElementById('predictPopup').classList.add('show');};
    });
  }
  if(dotsJson){
    document.getElementById('pinkDots').innerHTML='';
    JSON.parse(dotsJson).forEach(d=>{
      const dot=document.createElement('div'); dot.className='pinkDot'; dot.style.left=d.left; dot.style.top=d.top; document.getElementById('pinkDots').appendChild(dot);
    });
  }
}
setTimeout(restoreDraw,500);
window.clearAllDraw=()=>{document.getElementById('drawLayer').innerHTML=''; document.getElementById('pinkDots').innerHTML=''; localStorage.removeItem('trade_draw_layer'); localStorage.removeItem('trade_pink_dots'); localStorage.removeItem('trade_draw_json'); localStorage.removeItem('trade_dots_json');};

window.activateTool=(tool)=>{
  activeTool=tool; closeSettings();
  if(tool==='trend'||tool==='predict'){
    const wrap=document.createElement('div'); wrap.className='lineWrap'; wrap.style.top='50%'; wrap.style.left='20%'; wrap.style.width='60%';
    const line=document.createElement('div'); line.className=tool==='trend'?'trendLine':'predLine'; wrap.appendChild(line);
    const hLen=document.createElement('div'); hLen.className='handle len'; wrap.appendChild(hLen);
    const hRot=document.createElement('div'); hRot.className='handle rotate'; wrap.appendChild(hRot);
    if(tool==='predict'){
      const f=document.createElement('small'); f.textContent='First'; f.style.cssText='position:absolute;left:0;top:-18px;background:white;border:1px solid #000;padding:2px 6px;border-radius:4px;font-size:10px'; wrap.appendChild(f);
      const l=document.createElement('small'); l.textContent='Last'; l.style.cssText='position:absolute;right:0;top:-18px;background:white;border:1px solid #000;padding:2px 6px;border-radius:4px;font-size:10px'; wrap.appendChild(l);
      wrap.onclick=()=>{document.getElementById('predictPopup').classList.add('show');};
    }
    document.getElementById('drawLayer').appendChild(wrap); makeRotatable(wrap,hLen,hRot);
  }
  if(tool==='pointer'){document.getElementById('pointerPopup').classList.add('show');}
};
function makeRotatable(wrap,hLen,hRot){
  let isDrag=false,isLen=false,isRot=false,startY,startX,startRot=0,curRot=0;
  const getRot=()=>{const m=wrap.style.transform.match(/rotate\(([-\d.]+)deg\)/); return m?parseFloat(m[1]):0;};
  wrap.onmousedown=(e)=>{if(e.target===hLen||e.target===hRot) return; isDrag=true; curRot=getRot(); startY=e.clientY-wrap.offsetTop; startX=e.clientX-wrap.offsetLeft;};
  hLen.onmousedown=(e)=>{e.stopPropagation(); isLen=true; startX=e.clientX; curRot=getRot();};
  hRot.onmousedown=(e)=>{e.stopPropagation(); isRot=true; const rect=wrap.getBoundingClientRect(); const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2; startRot=Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI - getRot();};
  document.onmousemove=(e)=>{
    if(isDrag){wrap.style.top=(e.clientY-startY)+'px'; wrap.style.left=(e.clientX-startX)+'px';}
    if(isLen){wrap.style.width=(wrap.offsetWidth+(e.clientX-startX))+'px'; startX=e.clientX;}
    if(isRot){const rect=wrap.getBoundingClientRect(); const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2; const ang=Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI; curRot=ang-startRot; wrap.style.transform=`rotate(${curRot}deg)`;}
  };
  document.onmouseup=()=>{isDrag=isLen=isRot=false;};
  wrap.ontouchstart=(e)=>{isDrag=true; startY=e.touches[0].clientY-wrap.offsetTop; startX=e.touches[0].clientX-wrap.offsetLeft; curRot=getRot();};
  document.ontouchmove=(e)=>{if(!isDrag&&!isLen&&!isRot) return; e.preventDefault(); if(isDrag){wrap.style.top=(e.touches[0].clientY-startY)+'px'; wrap.style.left=(e.touches[0].clientX-startX)+'px';} if(isLen){wrap.style.width=(wrap.offsetWidth+(e.touches[0].clientX-startX))+'px'; startX=e.touches[0].clientX;} if(isRot){const rect=wrap.getBoundingClientRect(); const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2; const ang=Math.atan2(e.touches[0].clientY-cy,e.touches[0].clientX-cx)*180/Math.PI; curRot=ang-startRot; wrap.style.transform=`rotate(${curRot}deg)`;}};
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
window.confirmPredict=()=>{
  const amt=document.getElementById('pAmount').value||100; document.getElementById('fAmount').value=amt; closePredictPop(); openTrade(document.getElementById('pType').value);
};

window.openTrade=(type)=>{pendingType=type; document.getElementById('formTitle').textContent=type.toUpperCase()+' '+curCoin; let pct=curCoin==='BTC'?0.02:0.015; let amount=Number(document.getElementById('fAmount').value||100); document.getElementById('fSL').value=(amount*pct*10).toFixed(0); document.getElementById('fTP').value=(amount*pct*15).toFixed(0); document.getElementById('tradeForm').classList.add('show'); startCount();};
window.closeTrade=()=>{document.getElementById('tradeForm').classList.remove('show');};
let countInterval;
function startCount(){clearInterval(countInterval); let s=60; countInterval=setInterval(()=>{s--; document.getElementById('countDown').textContent=s+'s'; if(s<=0) clearInterval(countInterval);},1000);}
window.activateTrade=async()=>{
  const amt=Number(document.getElementById('fAmount').value||100); const sl=Number(document.getElementById('fSL').value); const tp=Number(document.getElementById('fTP').value);
  const us=await getDoc(doc(db,'users',currentUser.uid));
  const dot=document.createElement('div'); dot.className='pinkDot'; dot.style.left='50%'; dot.style.top='50%'; document.getElementById('pinkDots').appendChild(dot);
  const end=Date.now()+60000;
  await addDoc(collection(db,'trades'),{uid:currentUser.uid,coin:curCoin,type:pendingType,amount:amt,stopLossAmount:sl,takeProfitAmount:tp,entryPrice:currentPrice,entryTime:new Date().toISOString(),endTime:end,status:'active',createdAt:serverTimestamp(),username:us.data()?.username||''});
  closeTrade(); saveAllDraw(); showPop('TRADE ACTIVATED',`${pendingType.toUpperCase()} ${curCoin} $${amt} - Live now`,`$${amt}`,true);
};

onAuthStateChanged(auth,async u=>{
  if(!u){location.href='login.html';return;} currentUser=u;
  const us=await getDoc(doc(db,'users',u.uid)); document.getElementById('userBalTop').textContent='$'+Number(us.data()?.balance||0).toFixed(2); document.getElementById('balBold').textContent='$'+Number(us.data()?.balance||0).toFixed(2);
  const q=query(collection(db,'trades'),where('uid','==',u.uid),where('status','==','active'));
  onSnapshot(q,snap=>{
    liveTrades=[]; snap.forEach(d=>{let t=d.data(); t.id=d.id; liveTrades.push(t);});
    renderLive();
    // SUCCESS / LOSS POPUP - FINAL VERDICT HIDDEN FROM USER
    snap.docChanges().forEach(ch=>{
      const t=ch.doc.data();
      if(t.finalVerdict==='approve'){showPop('TRADE SUCCESSFUL',`Your ${t.coin} ${t.type.toUpperCase()} won +${t.profitPct||25}%`,`$${Number(t.amount)+Number(t.takeProfitAmount||0)}`,true);}
      if(t.finalVerdict==='rejected'){showPop('TRADE LOST',`Your ${t.coin} ${t.type.toUpperCase()} lost`,`$${t.stopLossAmount||0}`,false);}
    });
  });
});

function renderLive(){
  let html=''; liveTrades.forEach(t=>{
    const rem=Math.max(0,Math.floor((t.endTime-Date.now())/1000));
    html+=`<div style="background:white;border:2px solid #155eef;border-radius:12px;padding:12px;margin-bottom:10px" onclick="openDetail('${t.id}')"><div style="display:flex;justify-content:space-between;font-weight:bold"><span>${t.coin} ${t.type.toUpperCase()} $${t.amount}</span><span style="background:#ef4444;color:white;padding:2px 8px;border-radius:10px;font-size:11px">${rem}s left</span></div><div style="font-size:11px;color:#64748b">${new Date(t.entryTime).toLocaleString()} → Ends ${new Date(t.endTime).toLocaleTimeString()} - Remaining ${rem}s - Even if logout</div></div>`;
  });
  document.getElementById('liveListContainer').innerHTML=html||'<p>No live trades</p>';
  // update remaining timers every sec
  setInterval(()=>{
    liveTrades.forEach(t=>{
      const rem=Math.max(0,Math.floor((t.endTime-Date.now())/1000));
      const el=document.getElementById('dRem'); if(el) el.textContent=rem+'s';
      const el2=document.getElementById('detailTimer'); if(el2) el2.textContent=rem+'s left';
    });
    renderLive();
  },1000);
}
window.openLiveList=()=>{document.getElementById('liveListModal').classList.add('show');};
window.closeLiveList=()=>{document.getElementById('liveListModal').classList.remove('show');};
window.openDetail=(id)=>{
  const t=liveTrades.find(x=>x.id===id); if(!t) return;
  document.getElementById('liveDetail').classList.add('show');
  document.getElementById('detailCoin').textContent=`${t.coin} - $${Number(t.entryPrice).toFixed(2)}`;
  document.getElementById('dAmount').textContent='$'+t.amount; document.getElementById('dDay').textContent=new Date(t.entryTime).toLocaleDateString(); document.getElementById('dEnd').textContent=new Date(t.endTime).toLocaleTimeString();
  setTimeout(initDetailChart,100);
  const int=setInterval(()=>{
    let pnl=(t.type==='buy'?(currentPrice-t.entryPrice):(t.entryPrice-currentPrice))*(t.amount/80);
    const rem=Math.max(0,Math.floor((t.endTime-Date.now())/1000));
    document.getElementById('dProfit').textContent=(pnl>=0?'+$':'-$')+Math.abs(pnl).toFixed(2);
    document.getElementById('dProfit').style.color=pnl>=0?'#16a34a':'#ef4444';
    document.getElementById('dRem').textContent=rem+'s';
    if(rem<=0) clearInterval(int);
  },400);
};
window.closeDetail=()=>{document.getElementById('liveDetail').classList.remove('show');};
function showPop(t,d,a,win){document.getElementById('pT').textContent=t;document.getElementById('pD').textContent=d;document.getElementById('pA').textContent=a;document.getElementById('pTick').textContent=win?'✓':'✕';document.getElementById('pTick').style.background=win?'#22c55e':'#ef4444';document.getElementById('popup').classList.add('show');}
window.showPop=showPop; window.closePop=()=>{document.getElementById('popup').classList.remove('show');};