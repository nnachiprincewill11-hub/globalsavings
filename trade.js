import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
const firebaseConfig={apiKey:"AIzaSyCmRE7PK3ve9DjBGIOCcOuq_5WyfUrwM50",authDomain:"global-savings.firebaseapp.com",projectId:"global-savings",storageBucket:"global-savings.firebasestorage.app",messagingSenderId:"83435054105",appId:"1:83435054105:web:efac6cbd5a264a6892b688"};
const app=initializeApp(firebaseConfig);const auth=getAuth(app);const db=getFirestore(app);
let currentUser=null, currentPrice=4020.19, pendingType='buy', chart, candleSeries, volSeries, priceLineObj, blueLine;
let liveTrades=[];

function initChart(){
  const el=document.getElementById('tvChart'); if(!el) return; if(chart) chart.remove();
  chart=LightweightCharts.createChart(el,{layout:{background:{color:'#000'},textColor:'#8aa0c2'},grid:{vertLines:{color:'#111'},horzLines:{color:'#111'}},width:el.clientWidth,height:el.clientHeight});
  candleSeries=chart.addCandlestickSeries({upColor:'#22c55e',downColor:'#ef4444',borderDownColor:'#ef4444',borderUpColor:'#22c55e',wickDownColor:'#ef4444',wickUpColor:'#22c55e'});
  volSeries=chart.addHistogramSeries({priceScaleId:'',priceFormat:{type:'volume'}});
  const now=Math.floor(Date.now()/1000); let candles=[], vols=[];
  for(let i=90;i>=0;i--){
    let base=4020+Math.sin(i/8)*3+Math.cos(i/3)*1.2; if(i>60) base+=6; if(i>30 && i<45) base+=4;
    let close=base+(Math.random()-0.5)*1.2; candles.push({time:now-i*60,open:base,high:base+0.9,low:base-1,close});
    vols.push({time:now-i*60,value:20+Math.random()*40,color: close>base ? '#22c55e88' : '#ef444488'});
  }
  candleSeries.setData(candles); volSeries.setData(vols);
  priceLineObj=candleSeries.createPriceLine({price:currentPrice,color:'#facc15',lineWidth:1,lineStyle:2,axisLabelVisible:true,title:'00:41'});
  // blue diagonal line like image
  blueLine=candleSeries.createPriceLine({price:4025,color:'#3b82f6',lineWidth:2,lineStyle:0,axisLabelVisible:false});
  let tick=0;
  setInterval(()=>{
    currentPrice+=(Math.random()-0.5)*0.7; tick++;
    const t=now+tick; candleSeries.update({time:t,open:currentPrice,high:currentPrice+0.5,low:currentPrice-0.5,close:currentPrice+(Math.random()-0.5)});
    volSeries.update({time:t,value:15+Math.random()*35,color: Math.random()>0.5 ? '#22c55e88' : '#ef444488'});
    priceLineObj.applyOptions({price:currentPrice}); document.getElementById('coinPrice').textContent=`${currentPrice.toFixed(2)} -${(46+Math.random()).toFixed(2)} (-1.15%)`;
    document.getElementById('yellowLine').textContent=`${currentPrice.toFixed(2)} 00:41`; document.getElementById('volNum').textContent=Math.floor(800+Math.random()*100);
    document.getElementById('footerCoin').textContent=`${document.getElementById('coinSel').value}  1m`;
    updateLiveInc();
  },1200);
}
window.addEventListener('resize',()=>{if(chart) chart.applyOptions({width:document.getElementById('tvChart').clientWidth,height:document.getElementById('tvChart').clientHeight})});
initChart();

window.changeCoin=()=>{ initChart(); };
window.toggleLive=()=>{document.getElementById('liveDrawer').classList.toggle('open');};

onAuthStateChanged(auth,async u=>{
  if(!u){location.href='login.html';return;} currentUser=u;
  const us=await getDoc(doc(db,'users',u.uid)); document.getElementById('balanceTop').textContent=`$${Number(us.data()?.balance||0).toFixed(2)}`;
  const q=query(collection(db,'trades'),where('uid','==',u.uid),where('status','==','active'));
  onSnapshot(q,snap=>{
    liveTrades=[]; let html=''; snap.forEach(d=>{let t=d.data(); t.id=d.id; liveTrades.push(t);});
    document.getElementById('liveCount').textContent=`${liveTrades.length} Active`; document.getElementById('activeTradesCount').textContent=liveTrades.length;
    renderLive();
  });
});

function renderLive(){
  let html=''; if(liveTrades.length===0) html=`<p style="color:#8aa0c2;text-align:center;margin-top:20px">No live trades</p>`;
  liveTrades.forEach(t=>{
    let pnl=(t.type==='buy'?(currentPrice-(t.entryPrice||currentPrice)):((t.entryPrice||currentPrice)-currentPrice))*(t.amount/80);
    html+=`<div class="liveCard"><div class="bigLine"></div>
      <div class="liveTop"><span><b>${t.coin||'GOLD'}</b> ${t.type?.toUpperCase()} $${t.amount} ${t.edited?'<span style="background:#f59e0b;color:#000;padding:1px 5px;border-radius:4px;font-size:9px">Edited</span>':''}</span><span class="profitInc ${pnl>=0?'pnlUp':'pnlDown'}">${pnl>=0?'+':''}${pnl.toFixed(2)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#8aa0c2;margin-top:6px;position:relative;z-index:2"><span>Entry: $${Number(t.entryPrice||currentPrice).toFixed(2)}</span><span>Now: $${currentPrice.toFixed(2)}</span></div>
      <div style="height:6px;background:#11264a;border-radius:10px;margin-top:8px;overflow:hidden;position:relative;z-index:2"><div style="width:${50+Math.min(50,pnl)}%;height:100%;background:${pnl>=0?'#22c55e':'#ef4444'};transition:0.5s"></div></div>
    </div>`;
    if(t.finalVerdict==='approve') showPop('TRADE SUCCESSFUL',`Your ${t.coin} won +${t.profitPct||0}%`,`$${Number(t.amount)+Number(t.takeProfitAmount||0)}`,true);
    if(t.finalVerdict==='rejected') showPop('TRADE LOST',`Your ${t.coin} returned`,`$${t.stopLossAmount||0}`,false);
  });
  document.getElementById('liveList').innerHTML=html;
}
function updateLiveInc(){ if(document.getElementById('liveDrawer').classList.contains('open')) renderLive(); }

window.openTradeForm=(type)=>{pendingType=type;document.getElementById('formTitle').textContent=`Open ${type.toUpperCase()} - ${document.getElementById('coinSel').value}`;document.getElementById('formModal').classList.add('show');};
window.closeForm=()=>{document.getElementById('formModal').classList.remove('show');};
window.confirmTrade=async()=>{
  const amt=Number(document.getElementById('fAmount').value);const sl=Number(document.getElementById('fSL').value||200);const tp=Number(document.getElementById('fTP').value||100);const dur=Number(document.getElementById('fDuration').value);
  if(!amt||amt<=0){alert('Enter amount');return;}
  const us=await getDoc(doc(db,'users',currentUser.uid)); if(amt>Number(us.data()?.balance||0)){alert('Insufficient balance');return;}
  await addDoc(collection(db,'trades'),{uid:currentUser.uid,coin:document.getElementById('coinSel').value,type:pendingType,amount:amt,originalAmount:amt,stopLossAmount:sl,takeProfitAmount:tp,duration:dur,entryPrice:currentPrice,status:'active',createdAt:serverTimestamp(),username:us.data()?.username||''});
  await addDoc(collection(db,'admin_notifications'),{message:`New ${pendingType} $${amt} - ${us.data()?.username}`,createdAt:serverTimestamp()});
  closeForm(); showPop('TRADE OPENED',`${pendingType.toUpperCase()} ${document.getElementById('coinSel').value} trade opened`,`$${amt}`,true);
};
function showPop(t,d,a,win){document.getElementById('popT').textContent=t;document.getElementById('popD').textContent=d;document.getElementById('popA').textContent=a;document.getElementById('popTick').textContent=win?'✓':'✕';document.getElementById('popTick').style.background=win?'#22c55e':'#ef4444';document.getElementById('popup').classList.add('show');}
window.showPop=showPop; window.closePop=()=>{document.getElementById('popup').classList.remove('show');};