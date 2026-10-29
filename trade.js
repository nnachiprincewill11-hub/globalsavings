import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
const firebaseConfig={apiKey:"AIzaSyCmRE7PK3ve9DjBGIOCcOuq_5WyfUrwM50",authDomain:"global-savings.firebaseapp.com",projectId:"global-savings",storageBucket:"global-savings.firebasestorage.app",messagingSenderId:"83435054105",appId:"1:83435054105:web:efac6cbd5a264a6892b688"};
const app=initializeApp(firebaseConfig);const auth=getAuth(app);const db=getFirestore(app);
let currentUser=null, currentPrice=4021.61, pendingType='buy', chart, candleSeries, priceLine;
let liveTrades=[];

function initChart(){
  const el=document.getElementById('tvChart');
  if(!el) return;
  if(chart){chart.remove();}
  chart=LightweightCharts.createChart(el,{layout:{background:{color:'#000'},textColor:'#8aa0c2'},grid:{vertLines:{color:'#111'},horzLines:{color:'#111'}},width:el.clientWidth,height:el.clientHeight,timeScale:{timeVisible:true}});
  candleSeries=chart.addCandlestickSeries({upColor:'#22c55e',downColor:'#ef4444',borderDownColor:'#ef4444',borderUpColor:'#22c55e',wickDownColor:'#ef4444',wickUpColor:'#22c55e'});
  const now=Math.floor(Date.now()/1000); let data=[];
  for(let i=80;i>=0;i--){let base=4021+Math.sin(i/6)*1.5+(Math.random()-0.5); if(i>45) base+=3; if(i>25 && i<45) base-=2; data.push({time:now-i*60,open:base,high:base+0.9,low:base-0.9,close:base+(Math.random()-0.5)})}
  candleSeries.setData(data);
  priceLine=candleSeries.createPriceLine({price:currentPrice,color:'#facc15',lineWidth:1,lineStyle:2,axisLabelVisible:true,title:'00:41'});
  setInterval(()=>{
    currentPrice+=(Math.random()-0.5)*0.6;
    document.getElementById('priceTop').textContent=currentPrice.toFixed(3)+' '+(Math.random()>0.5?'-':'')+(44+Math.random()*2).toFixed(2)+' (-1.1%)';
    document.getElementById('priceLine').textContent=currentPrice.toFixed(3)+' 00:41';
    if(priceLine) priceLine.applyOptions({price:currentPrice});
    updateLivePnL();
  },1400);
}
window.addEventListener('resize',()=>{if(chart) chart.applyOptions({width:document.getElementById('tvChart').clientWidth,height:document.getElementById('tvChart').clientHeight})});
initChart();

window.changeAsset=()=>{ initChart(); };

onAuthStateChanged(auth,async u=>{
  if(!u){location.href='login.html';return;} currentUser=u;
  const q=query(collection(db,'trades'),where('uid','==',u.uid),where('status','==','active'));
  onSnapshot(q,snap=>{
    liveTrades=[]; let html='';
    snap.forEach(d=>{
      const t=d.data(); t.id=d.id; liveTrades.push(t);
      let editedBadge = t.edited ? `<span style="background:#f59e0b;color:black;padding:1px 5px;border-radius:4px;font-size:9px">Edited: $${t.amount}</span>` : '';
      let pnl = t.type==='buy' ? (currentPrice - (t.entryPrice||currentPrice))* (t.amount/100) : ((t.entryPrice||currentPrice)-currentPrice)*(t.amount/100);
      html+=`<div class="liveItem"><div><b>${t.coin||'GOLD'} ${t.type?.toUpperCase()} $${t.amount}</b> ${editedBadge}<br><span style="font-size:10px;color:#8aa0c2">Entry: $${Number(t.entryPrice||currentPrice).toFixed(2)}</span></div><div class="livePnL ${pnl>=0?'pnlUp':'pnlDown'}">${pnl>=0?'+':''}${pnl.toFixed(2)}</div></div>`;
      if(t.finalVerdict==='approve'){ showPopup('TRADE SUCCESSFUL',`Your ${t.coin} ${t.type} won +${t.profitPct||0}%`,`$${Number(t.amount)+Number(t.takeProfitAmount||0)}`,true); }
      if(t.finalVerdict==='rejected'){ showPopup('TRADE LOST',`Your ${t.coin} trade - $${t.stopLossAmount||0} returned`,`$${t.stopLossAmount||0}`,false); }
    });
    document.getElementById('liveBox').innerHTML=html;
  });
});

function updateLivePnL(){
  const box=document.getElementById('liveBox'); if(!box || liveTrades.length===0) return;
  let html=''; liveTrades.forEach(t=>{
    let pnl = t.type==='buy' ? (currentPrice - (t.entryPrice||currentPrice))* (t.amount/100) : ((t.entryPrice||currentPrice)-currentPrice)*(t.amount/100);
    let editedBadge = t.amount!==t.originalAmount ? `<span style="background:#f59e0b;color:black;padding:1px 5px;border-radius:4px;font-size:9px">Edited: $${t.amount}</span>` : '';
    if(t.edited) editedBadge=`<span style="background:#f59e0b;color:black;padding:1px 5px;border-radius:4px;font-size:9px">Edited: $${t.amount}</span>`;
    html+=`<div class="liveItem"><div><b>${t.coin||'GOLD'} ${t.type?.toUpperCase()} $${t.amount}</b> ${editedBadge}<br><span style="font-size:10px;color:#8aa0c2">Entry: $${Number(t.entryPrice||currentPrice).toFixed(2)}</span></div><div class="livePnL ${pnl>=0?'pnlUp':'pnlDown'}">${pnl>=0?'+':''}${pnl.toFixed(2)}</div></div>`;
  }); box.innerHTML=html;
}

window.openTrade=(type)=>{pendingType=type;document.getElementById('mTitle').textContent=type.toUpperCase()+' GOLD';document.getElementById('tradeModal').classList.add('show');document.getElementById('tradeModal').style.display='flex';};
window.closeTradeModal=()=>{document.getElementById('tradeModal').classList.remove('show');document.getElementById('tradeModal').style.display='none';};
window.confirmTrade=async()=>{
  const amt=Number(document.getElementById('mAmount').value);const sl=Number(document.getElementById('mSL').value||200);const tp=Number(document.getElementById('mTP').value||100);
  if(!amt || amt<=0){alert('Enter amount');return;}
  const userDoc=await getDoc(doc(db,'users',currentUser.uid)); const bal=Number(userDoc.data()?.balance||0);
  if(amt>bal){alert('Insufficient balance');return;}
  await addDoc(collection(db,'trades'),{uid:currentUser.uid,coin:document.getElementById('assetSel').value||'GOLD',type:pendingType,amount:amt,originalAmount:amt,stopLossAmount:sl,takeProfitAmount:tp,entryPrice:currentPrice,status:'active',createdAt:serverTimestamp(),username:userDoc.data()?.username||''});
  await addDoc(collection(db,'admin_notifications'),{tradeId:'new',coin:'GOLD',tradeType:pendingType,message:`New ${pendingType} trade $${amt} - User ${userDoc.data()?.username}`,createdAt:serverTimestamp()});
  closeTradeModal(); showPopup('TRADE OPENED',`${pendingType.toUpperCase()} GOLD trade opened`,`$${amt}`,true);
};

window.showPopup=(title,desc,amt,isWin)=>{
  document.getElementById('popTitle').textContent=title;
  document.getElementById('popDesc').textContent=desc;
  document.getElementById('popAmt').textContent=amt;
  document.getElementById('popTick').textContent=isWin?'✓':'✕';
  document.getElementById('popTick').style.background=isWin?'#22c55e':'#ef4444';
  document.getElementById('popup').classList.add('show');
};
window.closePopup=()=>{document.getElementById('popup').classList.remove('show');};