import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
const firebaseConfig={apiKey:"AIzaSyCmRE7PK3ve9DjBGIOCcOuq_5WyfUrwM50",authDomain:"global-savings.firebaseapp.com",projectId:"global-savings",storageBucket:"global-savings.firebasestorage.app",messagingSenderId:"83435054105",appId:"1:83435054105:web:efac6cbd5a264a6892b688"};
const app=initializeApp(firebaseConfig);const auth=getAuth(app);const db=getFirestore(app);
let currentUser=null, currentPrice=4021.61, pendingType='buy', chart, candleSeries, volSeries, line;
let liveTrades=[];

function initChart(){
  const el=document.getElementById('tvChart'); if(!el) return; if(chart) chart.remove();
  chart=LightweightCharts.createChart(el,{layout:{background:{color:'#08111f'},textColor:'#8aa0c2'},grid:{vertLines:{color:'#11264a'},horzLines:{color:'#11264a'}},width:el.clientWidth,height:el.clientHeight});
  candleSeries=chart.addCandlestickSeries({upColor:'#22c55e',downColor:'#ef4444',borderDownColor:'#ef4444',borderUpColor:'#22c55e',wickDownColor:'#ef4444',wickUpColor:'#22c55e'});
  // GREEN MARK - SMALLER VOLUME
  volSeries=chart.addHistogramSeries({priceScaleId:'',priceFormat:{type:'volume'},priceLineVisible:false});
  volSeries.applyOptions({priceScaleId:'',scaleMargins:{top:0.85,bottom:0}}); // makes volume SMALLER than main candles
  const now=Math.floor(Date.now()/1000); let candles=[], vols=[];
  for(let i=80;i>=0;i--){let base=4021+Math.sin(i/7)*2.5; if(i>50) base+=5; let close=base+(Math.random()-0.5); candles.push({time:now-i*60,open:base,high:base+1,low:base-1,close}); vols.push({time:now-i*60,value:10+Math.random()*15,color: close>base ? '#22c55e66' : '#ef444466'});}
  candleSeries.setData(candles); volSeries.setData(vols);
  line=candleSeries.createPriceLine({price:currentPrice,color:'#facc15',lineWidth:1,lineStyle:2,axisLabelVisible:false});
  setInterval(()=>{
    currentPrice+=(Math.random()-0.5)*0.6; const t=now+Math.floor(Date.now()/1000)%100;
    candleSeries.update({time:t,open:currentPrice,high:currentPrice+0.6,low:currentPrice-0.6,close:currentPrice+(Math.random()-0.5)});
    volSeries.update({time:t,value:8+Math.random()*12,color: Math.random()>0.5 ? '#22c55e66' : '#ef444466'});
    line.applyOptions({price:currentPrice}); document.getElementById('yellowTag').textContent=`${currentPrice.toFixed(2)} 00:41`;
    // WHITE MARK - UPDATE BTC AND OLD COINS PRICE
    document.getElementById('coinsTicker').innerHTML=`
      <span class="coinT"><b>BTC</b> $${(68420+Math.random()*100).toFixed(0)} <small class="${Math.random()>0.5?'up':'down'}">${Math.random()>0.5?'+':''}${(Math.random()*2).toFixed(1)}%</small></span>
      <span class="coinT"><b>ETH</b> $${(3840+Math.random()*20).toFixed(0)} <small class="${Math.random()>0.5?'up':'down'}">${Math.random()>0.5?'+':''}${(Math.random()*2).toFixed(1)}%</small></span>
      <span class="coinT"><b>SOL</b> $${(142+Math.random()*5).toFixed(1)} <small class="up">+${(Math.random()*3).toFixed(1)}%</small></span>
      <span class="coinT"><b>GOLD</b> $${currentPrice.toFixed(2)} <small class="down">-1.12%</small></span>`;
    renderOldLive();
  },1100);
}
window.addEventListener('resize',()=>{if(chart) chart.applyOptions({width:document.getElementById('tvChart').clientWidth,height:document.getElementById('tvChart').clientHeight})});
initChart();

window.toggleLive=()=>{document.getElementById('liveDrawer').classList.toggle('open');};

onAuthStateChanged(auth,async u=>{
  if(!u){location.href='login.html';return;} currentUser=u;
  const us=await getDoc(doc(db,'users',u.uid)); document.getElementById('userBal').textContent=`$${Number(us.data()?.balance||0).toLocaleString()}`;
  const q=query(collection(db,'trades'),where('uid','==',u.uid),where('status','==','active'));
  onSnapshot(q,snap=>{liveTrades=[]; snap.forEach(d=>{let t=d.data(); t.id=d.id; liveTrades.push(t);}); renderOldLive();});
});

function renderOldLive(){
  let html=''; if(liveTrades.length===0) html=`<p style="color:#8aa0c2;text-align:center;margin-top:20px">No active trades yet</p>`;
  liveTrades.forEach(t=>{
    let pnl=(t.type==='buy'?(currentPrice-(t.entryPrice||currentPrice)):((t.entryPrice||currentPrice)-currentPrice))*(t.amount/80);
    html+=`<div class="oldCard"><div class="bigLine"></div>
      <div class="oldTop"><span>${t.coin||'GOLD'} ${t.type?.toUpperCase()} $${t.amount} ${t.edited?'<span style="background:#f59e0b;color:#000;padding:1px 5px;border-radius:4px;font-size:9px">Edited</span>':''}</span><span class="${pnl>=0?'profitUp':'profitDown'}">${pnl>=0?'+':''}$${pnl.toFixed(2)}</span></div>
      <div class="oldBottom"><span>Entry $${Number(t.entryPrice||currentPrice).toFixed(2)}</span><span>Now $${currentPrice.toFixed(2)}</span><span>LIVE</span></div>
      <div style="height:6px;background:#e2e8f0;border-radius:10px;margin-top:8px;overflow:hidden;position:relative;z-index:2"><div style="width:${50+Math.min(50,Math.abs(pnl))}%;height:100%;background:${pnl>=0?'#16a34a':'#ef4444'};transition:0.5s"></div></div>
    </div>`;
    if(t.finalVerdict==='approve') showPop('TRADE SUCCESSFUL',`Your ${t.coin} won +${t.profitPct||0}%`,`$${Number(t.amount)+Number(t.takeProfitAmount||0)}`,true);
    if(t.finalVerdict==='rejected') showPop('TRADE LOST',`Your ${t.coin} returned`,`$${t.stopLossAmount||0}`,false);
  });
  document.getElementById('liveListOld').innerHTML=html;
}

window.openTrade=(type)=>{pendingType=type;document.getElementById('tTitle').textContent=`${type.toUpperCase()} Trade`;document.getElementById('tradeForm').classList.add('show');};
window.closeTrade=()=>{document.getElementById('tradeForm').classList.remove('show');};
window.confirmTrade=async()=>{
  const amt=Number(document.getElementById('tAmount').value);const sl=Number(document.getElementById('tSL').value||200);const tp=Number(document.getElementById('tTP').value||100);const dur=Number(document.getElementById('tDur').value);
  if(!amt){alert('Enter amount');return;}
  const us=await getDoc(doc(db,'users',currentUser.uid)); if(amt>Number(us.data()?.balance||0)){alert('Insufficient');return;}
  await addDoc(collection(db,'trades'),{uid:currentUser.uid,coin:'GOLD',type:pendingType,amount:amt,originalAmount:amt,stopLossAmount:sl,takeProfitAmount:tp,duration:dur,entryPrice:currentPrice,status:'active',createdAt:serverTimestamp(),username:us.data()?.username||''});
  closeTrade(); showPop('TRADE OPENED',`${pendingType.toUpperCase()} GOLD $${amt}`,`$${amt}`,true);
};
function showPop(t,d,a,win){document.getElementById('pT').textContent=t;document.getElementById('pD').textContent=d;document.getElementById('pA').textContent=a;document.getElementById('pTick').textContent=win?'✓':'✕';document.getElementById('pTick').style.background=win?'#22c55e':'#ef4444';document.getElementById('popup').classList.add('show');}
window.showPop=showPop; window.closePop=()=>{document.getElementById('popup').classList.remove('show');};