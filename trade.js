import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
const firebaseConfig={apiKey:"AIzaSyCmRE7PK3ve9DjBGIOCcOuq_5WyfUrwM50",authDomain:"global-savings.firebaseapp.com",projectId:"global-savings",storageBucket:"global-savings.firebasestorage.app",messagingSenderId:"83435054105",appId:"1:83435054105:web:efac6cbd5a264a6892b688"};
const app=initializeApp(firebaseConfig);const auth=getAuth(app);const db=getFirestore(app);
let currentUser=null, currentPrice=4021.61, pendingType='buy', chart, candleSeries, curCoin='BTC';
let liveTrades=[], activeTool=null, tradesData=[];

function initChart(){
  const el=document.getElementById('tvChart'); if(!el) return; if(chart) chart.remove();
  chart=LightweightCharts.createChart(el,{layout:{background:{color:'white'},textColor:'#64748b'},grid:{vertLines:{color:'#f1f5f9'},horzLines:{color:'#f1f5f9'}},width:el.clientWidth,height:el.clientHeight});
  // WHITE CANDLES - NO SHADOWS/WICKS
  candleSeries=chart.addCandlestickSeries({upColor:'white',downColor:'#08111f',borderUpColor:'#155eef',borderDownColor:'#ef4444',wickUpColor:'transparent',wickDownColor:'transparent',borderVisible:true,wickVisible:false});
  const now=Math.floor(Date.now()/1000); let data=[];
  for(let i=80;i>=0;i--){let base=4021+Math.sin(i/7)*2; if(i>50) base+=5; data.push({time:now-i*60,open:base,high:base+0.3,low:base-0.3,close:base+(Math.random()-0.5)*0.6});}
  candleSeries.setData(data); tradesData=data;
  setInterval(()=>{
    currentPrice+=(Math.random()-0.5)*0.6; const t=now+Math.floor(Date.now()/100)%100;
    candleSeries.update({time:t,open:currentPrice,high:currentPrice+0.3,low:currentPrice-0.3,close:currentPrice+(Math.random()-0.5)*0.6});
    // FINAL VERDICT WAIT - WHEN CANDLE REACHES END TIME
    checkEndTime();
  },1200);
}
window.addEventListener('resize',()=>{if(chart) chart.applyOptions({width:document.getElementById('tvChart').clientWidth,height:document.getElementById('tvChart').clientHeight})});
initChart();

window.toggleCoinDrop=()=>{document.getElementById('coinList').classList.toggle('show');};
window.selectCoin=(name,logo,price)=>{curCoin=name; document.getElementById('curCoinLogo').textContent=logo; document.getElementById('curCoinName').textContent=name; document.getElementById('curCoinPrice').textContent='$'+price; document.getElementById('coinList').classList.remove('show'); initChart();};
window.toggleSettings=()=>{document.getElementById('settingsPanel').classList.toggle('show');};
window.closeSettings=()=>{document.getElementById('settingsPanel').classList.remove('show');};

window.activateTool=(tool)=>{
  activeTool=tool; closeSettings();
  if(tool==='trend'){
    const div=document.createElement('div'); div.className='tradeLine'; div.style.top='50%'; document.getElementById('drawLayer').appendChild(div);
    makeDraggable(div,true,false); // blue line like yellow line - move + longer
  }
  if(tool==='predict'){
    const div=document.createElement('div'); div.className='predLine'; div.style.top='40%'; div.innerHTML='<small style="position:absolute;left:0;top:-18px;background:white;border:1px solid #000;padding:2px 6px;border-radius:4px;font-size:10px">First</small><small style="position:absolute;right:0;top:-18px;background:white;border:1px solid #000;padding:2px 6px;border-radius:4px;font-size:10px">Last</small>';
    document.getElementById('drawLayer').appendChild(div); makeDraggable(div,true,true);
    document.getElementById('predictBox').style.display='block'; document.getElementById('predFirst').textContent='Start placed'; document.getElementById('predLast').textContent='End placed';
    // popup for amount buy/sell
    openTrade('buy');
  }
  if(tool==='pointer'){
    document.getElementById('chartWrap').onclick=(e)=>{
      if(activeTool!=='pointer') return;
      const dot=document.createElement('div'); dot.className='pinkDot'; dot.style.left=e.offsetX+'px'; dot.style.top=e.offsetY+'px';
      document.getElementById('pinkDots').appendChild(dot);
    };
  }
};

function makeDraggable(el, vertical, horizontal){
  let isDrag=false, startY, startX;
  el.onmousedown=(e)=>{isDrag=true; startY=e.clientY - el.offsetTop; if(horizontal) startX=e.clientX;};
  document.onmousemove=(e)=>{if(!isDrag) return; if(vertical) el.style.top=(e.clientY-startY)+'px'; if(horizontal){let w=parseInt(el.style.width||'80%'); el.style.width=(w+2)+'px';}};
  document.onmouseup=()=>{isDrag=false;};
  el.ontouchstart=(e)=>{isDrag=true; startY=e.touches[0].clientY - el.offsetTop;};
  document.ontouchmove=(e)=>{if(!isDrag) return; if(vertical) el.style.top=(e.touches[0].clientY-startY)+'px';};
  document.ontouchend=()=>{isDrag=false;};
}

window.openTrade=(type)=>{
  pendingType=type; document.getElementById('formTitle').textContent=type.toUpperCase()+' '+curCoin;
  // AUTO SL TP % BASED ON COIN
  let pct= curCoin==='BTC'? 0.02 : curCoin==='GOLD'? 0.015 : 0.01;
  let amount=Number(document.getElementById('fAmount').value||100);
  document.getElementById('fSL').value=(amount*pct*10).toFixed(0); document.getElementById('fTP').value=(amount*pct*15).toFixed(0);
  document.getElementById('tradeForm').classList.add('show');
};
window.closeTrade=()=>{document.getElementById('tradeForm').classList.remove('show');};

window.activateTrade=async()=>{
  const amt=Number(document.getElementById('fAmount').value||100); const sl=Number(document.getElementById('fSL').value); const tp=Number(document.getElementById('fTP').value);
  if(!amt){alert('Enter amount');return;}
  const us=await getDoc(doc(db,'users',currentUser.uid));
  // add pink dot on candle
  const dot=document.createElement('div'); dot.className='pinkDot'; dot.style.left='50%'; dot.style.top='50%'; document.getElementById('pinkDots').appendChild(dot);
  await addDoc(collection(db,'trades'),{uid:currentUser.uid,coin:curCoin,type:pendingType,amount:amt,stopLossAmount:sl,takeProfitAmount:tp,entryPrice:currentPrice,entryTime:new Date().toISOString(),endTime:Date.now()+60000,status:'active',createdAt:serverTimestamp(),username:us.data()?.username||''});
  closeTrade(); showPop('TRADE ACTIVATED',`${pendingType.toUpperCase()} ${curCoin} $${amt} - Live now`,`$${amt}`,true);
};

onAuthStateChanged(auth,async u=>{
  if(!u){location.href='login.html';return;} currentUser=u;
  const us=await getDoc(doc(db,'users',u.uid)); document.getElementById('userBalTop').textContent='$'+Number(us.data()?.balance||0).toFixed(2);
  const q=query(collection(db,'trades'),where('uid','==',u.uid),where('status','==','active'));
  onSnapshot(q,snap=>{liveTrades=[]; snap.forEach(d=>{let t=d.data(); t.id=d.id; liveTrades.push(t);}); document.getElementById('liveCount').textContent=liveTrades.length; renderLiveList();});
});

function renderLiveList(){
  let html=''; liveTrades.forEach(t=>{
    html+=`<div class="oldCard" onclick="openDetail('${t.id}')" style="background:white;border:2px solid #155eef;border-radius:12px;padding:12px;margin-bottom:10px;cursor:pointer">
      <div style="display:flex;justify-content:space-between;font-weight:bold"><span>${t.coin} ${t.type.toUpperCase()} $${t.amount}</span><span style="color:#16a34a">LIVE</span></div>
      <div style="font-size:11px;color:#64748b;margin-top:4px">${new Date(t.entryTime||Date.now()).toLocaleString()} → Ends ${new Date(t.endTime||Date.now()).toLocaleTimeString()}</div>
    </div>`;
  });
  document.getElementById('liveListContainer').innerHTML=html||'<p style="color:#8aa0c2">No live trades</p>';
}
window.openLiveList=()=>{document.getElementById('liveListModal').classList.add('show');};
window.closeLiveList=()=>{document.getElementById('liveListModal').classList.remove('show');};

window.openDetail=(id)=>{
  const t=liveTrades.find(x=>x.id===id); if(!t) return;
  document.getElementById('liveDetail').classList.add('show');
  document.getElementById('detailCoin').textContent=`${t.coin} - $${Number(t.entryPrice).toFixed(2)}`;
  document.getElementById('dAmount').textContent='$'+t.amount;
  document.getElementById('dDay').textContent=new Date(t.entryTime||Date.now()).toLocaleDateString();
  document.getElementById('dEnd').textContent=new Date(t.endTime||Date.now()).toLocaleTimeString();
  // profit live adding/reducing based on buy/sell
  setInterval(()=>{
    let pnl=(t.type==='buy'?(currentPrice-t.entryPrice):(t.entryPrice-currentPrice))*(t.amount/80);
    document.getElementById('dProfit').textContent=(pnl>=0?'+$':'-$')+Math.abs(pnl).toFixed(2);
    document.getElementById('dProfit').style.color=pnl>=0?'#16a34a':'#ef4444';
  },800);
  // pink dot on detail
  document.getElementById('detailPink').innerHTML='<div class="pinkDot" style="left:50%;top:50%"></div>';
};
window.closeDetail=()=>{document.getElementById('liveDetail').classList.remove('show');};

function checkEndTime(){
  liveTrades.forEach(t=>{
    if(t.endTime && Date.now()>=t.endTime && !t.finalWaiting){
      t.finalWaiting=true;
      // WAIT FOR FINAL VERDICT - DON'T TELL USER - KEEP POPUP
      showPop('TRADE WAITING',`Your ${t.coin} trade reached end time - waiting final result`,`$${t.amount}`,true);
      // admin will add final verdict via admin.js - no description to user
    }
  });
}

function showPop(t,d,a,win){document.getElementById('pT').textContent=t;document.getElementById('pD').textContent=d;document.getElementById('pA').textContent=a;document.getElementById('pTick').textContent=win?'✓':'✕';document.getElementById('pTick').style.background=win?'#22c55e':'#ef4444';document.getElementById('popup').classList.add('show');}
window.showPop=showPop; window.closePop=()=>{document.getElementById('popup').classList.remove('show');};