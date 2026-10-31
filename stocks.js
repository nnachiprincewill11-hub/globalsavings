const firebaseConfig = {
  apiKey: "AIzaSyCmRE7PK3ve9DjBGIOCcOuq_5WyfUrwM50",
  authDomain: "global-savings.firebaseapp.com",
  projectId: "global-savings",
  storageBucket: "global-savings.firebasestorage.app",
  messagingSenderId: "83435054105",
  appId: "1:83435054105:web:efac6cbd5a264a6892b688",
  measurementId: "G-XC54YQ0R7N"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let mainBalance=0, portfolioVal=0, dayGain=0, holdings=[], withdrawAllowed=false, currentStock=null, sellIndex=null, isAdmin=false;
let selectedDuration="1 Day", selectedChart="1D", currentTab="open";
let logoMap={AAPL:"https://logo.clearbit.com/apple.com",GOOGL:"https://logo.clearbit.com/google.com",NFLX:"https://logo.clearbit.com/netflix.com",TSLA:"https://logo.clearbit.com/tesla.com",AMZN:"https://logo.clearbit.com/amazon.com",MSFT:"https://logo.clearbit.com/microsoft.com",META:"https://logo.clearbit.com/meta.com",NVDA:"https://logo.clearbit.com/nvidia.com"};

auth.onAuthStateChanged(async user=>{
  if(!user){ location.href="login.html"; return; }
  document.getElementById('userName').textContent=user.email;
  isAdmin = user.email==="admin@gmail.com" || user.email==="emmanuelomelu@gmail.com";
  if(isAdmin){ document.getElementById('adminTag').classList.remove('hidden'); document.getElementById('adminBtn').classList.remove('hidden'); }
  await db.collection('users').doc(user.uid).set({email:user.email,uid:user.uid,lastLogin:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
  await db.collection('activeUsers').doc(user.uid).set({email:user.email,uid:user.uid,lastActive:firebase.firestore.FieldValue.serverTimestamp(),isOnline:true,balance:mainBalance},{merge:true});
  db.collection('userLogins').add({email:user.email,uid:user.uid,loginTime:firebase.firestore.FieldValue.serverTimestamp()});
  loadUserData(user.uid); loadStocks(); loadNews(); if(isAdmin) loadActiveUsers();
});

async function loadUserData(uid){
  let doc=await db.collection('stockPortfolio').doc(uid).get();
  if(doc.exists){ mainBalance=doc.data().mainBalance||0; portfolioVal=doc.data().portfolioValue||0; dayGain=doc.data().dayGain||0; holdings=doc.data().holdings||[]; withdrawAllowed=doc.data().withdrawAllowed||false; }
  updateUI();
}
function updateUI(){
  document.getElementById('mainBal').textContent=mainBalance.toFixed(2);
  document.getElementById('portVal').textContent='$'+portfolioVal.toFixed(2);
  document.getElementById('buyPower').textContent='$'+mainBalance.toFixed(2);
  document.getElementById('dayGain').textContent='$'+dayGain.toFixed(2);
  document.getElementById('portBig').textContent=portfolioVal.toFixed(2);
  document.getElementById('cash1').textContent=mainBalance.toFixed(2);
  document.getElementById('tPort').textContent='$'+portfolioVal.toFixed(2);
  document.getElementById('tBuy').textContent='$'+mainBalance.toFixed(2);
  document.getElementById('holdCount').textContent=holdings.length;
  renderHoldings(); renderTradesTab();
}

async function loadStocks(){
  let snap=await db.collection('stocks').get();
  let body=document.getElementById('stockBody'); body.innerHTML='';
  if(snap.empty && isAdmin){
    let defs=[{ticker:'AAPL',name:'Apple Inc.',price:229.32,change:'+1.24%'},{ticker:'GOOGL',name:'Alphabet',price:172.45,change:'+0.98%'},{ticker:'NFLX',name:'Netflix',price:685.20,change:'+2.67%'},{ticker:'TSLA',name:'Tesla',price:248.60,change:'+1.56%'},{ticker:'AMZN',name:'Amazon',price:178.90,change:'+0.73%'},{ticker:'MSFT',name:'Microsoft',price:415.12,change:'+1.12%'},{ticker:'META',name:'Meta',price:512.34,change:'+2.05%'},{ticker:'NVDA',name:'Nvidia',price:122.44,change:'+3.11%'}];
    for(let s of defs){ await db.collection('stocks').doc(s.ticker).set({...s,logo:logoMap[s.ticker],time:firebase.firestore.FieldValue.serverTimestamp()}); }
    loadStocks(); return;
  }
  snap.forEach(doc=>{
    let s=doc.data();
    let tr=document.createElement('tr');
    tr.innerHTML=`<td><div class="logo-cell"><img src="${s.logo}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/138/138292.png'"><b>${s.ticker}</b></div></td><td>${s.name}</td><td><b>$${s.price}</b></td><td style="color:#16a34a">${s.change}</td><td><button class="buy-btn" onclick="selectStock('${s.ticker}')">BUY</button> <button class="sell-btn" onclick="sellByTicker('${s.ticker}')">SELL</button></td>`;
    body.appendChild(tr);
  });
  document.getElementById('stockCount').textContent=snap.size+' stocks available - tap BUY or SELL';
}

function selectStock(ticker){
  db.collection('stocks').doc(ticker).get().then(doc=>{
    currentStock=doc.data();
    document.getElementById('watchTitle').textContent=`Stocks — ${currentStock.name} (${currentStock.ticker})`;
    document.getElementById('watchComp').textContent=currentStock.name+' NASDAQ';
    document.getElementById('watchPrice').textContent='$'+currentStock.price;
    showSection('watch'); calcQty();
  });
}
function calcQty(){
  if(!currentStock) return;
  let amt=parseFloat(document.getElementById('buyAmount').value||0);
  document.getElementById('qtyCalc').textContent=`≈${(amt/currentStock.price).toFixed(2)} shares`;
  document.getElementById('estCost').textContent=amt.toFixed(2);
  document.getElementById('buyBtn').textContent=`Buy ${currentStock.ticker} - $${amt.toLocaleString()}`;
  document.getElementById('durShow').textContent=selectedDuration;
  document.getElementById('selectedDur').textContent=selectedDuration;
}

async function buyStock(){
  let amt=parseFloat(document.getElementById('buyAmount').value||0);
  if(amt>mainBalance){alert('Insufficient balance - balance shows top right. Balance is 0 until funded.');return}
  mainBalance-=amt; portfolioVal+=amt;
  holdings.push({
    ticker:currentStock.ticker,name:currentStock.name,price:currentStock.price,
    qty:(amt/currentStock.price).toFixed(2),total:amt.toFixed(2),
    duration:selectedDuration, chart:selectedChart, profit:'12.50',
    entry:(currentStock.price-12).toFixed(2), buyDate:new Date().toLocaleString()
  });
  await savePortfolio(); document.getElementById('popBuy').style.display='flex';
}
async function savePortfolio(){
  let uid=auth.currentUser.uid;
  await db.collection('stockPortfolio').doc(uid).set({mainBalance,portfolioValue:portfolioVal,dayGain,holdings,withdrawAllowed,uid,email:auth.currentUser.email},{merge:true});
  updateUI();
}
function renderHoldings(){
  let div=document.getElementById('holdingsList'); div.innerHTML='';
  if(!holdings.length){div.innerHTML='<div style="padding:12px;text-align:center;color:#64748b">No holdings yet - Buy in Trades (All Stocks Market)</div>';return}
  holdings.forEach((h,i)=>{
    let el=document.createElement('div'); el.className='row'; el.style.cursor='pointer';
    el.innerHTML=`<span><img src="${logoMap[h.ticker]||''}" style="width:20px;height:20px;border-radius:50%"> <b>${h.ticker}</b> • ${h.duration} • ${h.chart}<br><small>${h.qty} shares • ${h.buyDate}</small></span><span><b>$${(h.qty*h.price).toFixed(2)}</b></span>`;
    el.onclick=()=>openHoldingDetail(i); div.appendChild(el);
  });
}
function openHoldingDetail(i){
  let h=holdings[i];
  document.getElementById('holdingDetail').classList.remove('hidden');
  document.getElementById('hdName').textContent=`${h.ticker} - ${h.name}`;
  document.getElementById('hdDesc').innerHTML=`Company: ${h.name}<br>Price Bought: $${h.price}<br>Amount: $${h.total}<br>Quantity: ${h.qty} shares<br>Duration: <b>${h.duration}</b> (You bought for ${h.duration})<br>Chart: ${h.chart}<br>Buy Date: ${h.buyDate}<br>Take Profit: $240 • Stop Loss: $220<br>Current P&L: +$${h.profit}<br><br>Entry Price: $${h.entry} • Current Price: $${h.price}`;
  showSection('port');
}
function closeHoldingDetail(){ document.getElementById('holdingDetail').classList.add('hidden'); }

function renderTradesTab(){
  let div=document.getElementById('tradesContent'); div.innerHTML='';
  if(currentTab==="open"){
    if(!holdings.length){div.innerHTML='<div style="padding:12px;text-align:center">No Open Trades</div>';return}
    holdings.forEach((h,i)=>{
      let el=document.createElement('div'); el.className='box'; el.style.padding='12px'; el.style.display='flex'; el.style.justifyContent='space-between'; el.style.cursor='pointer';
      el.innerHTML=`<div><img src="${logoMap[h.ticker]||''}" style="width:20px;height:20px;border-radius:50%"> <b>${h.ticker}</b> ${h.name} Buy $${h.total}<br><small>Duration: ${h.duration} | TP $240 SL $220 | Current $${h.price} | Profit +$${h.profit} | Status Running</small></div><span style="background:#dcfce7;padding:4px 8px;border-radius:12px;font-size:11px">Running</span>`;
      el.onclick=()=>openTrade(i); div.appendChild(el);
    });
  } else if(currentTab==="all"){
    // ALL STOCKS MARKET - USER CAN CLICK AND BUY
    db.collection('stocks').get().then(snap=>{
      snap.forEach(doc=>{
        let s=doc.data();
        let el=document.createElement('div'); el.className='box'; el.style.padding='12px'; el.style.display='flex'; el.style.justifyContent='space-between';
        el.innerHTML=`<div style="display:flex;gap:8px;align-items:center"><img src="${s.logo}" style="width:32px;height:32px;border-radius:50%;border:1px solid #eee"><div><b>${s.ticker}</b> ${s.name}<br><small>$${s.price} ${s.change} - Click Buy</small></div></div><button class="buy-btn" onclick="selectStock('${s.ticker}')">BUY</button>`;
        div.appendChild(el);
      });
    });
  } else {
    div.innerHTML='<div style="padding:12px;text-align:center">No Closed Trades Yet</div>';
  }
}
function openTrade(i){
  sellIndex=i; let h=holdings[i];
  document.getElementById('tdEntry').textContent='$'+h.entry;
  document.getElementById('tdCur').textContent='$'+h.price;
  document.getElementById('tdDur').textContent=h.duration;
  document.getElementById('tdPnl').textContent='+$'+h.profit;
  document.getElementById('tdLeft').textContent=h.duration+' left';
  document.getElementById('tradeDetailBox').classList.remove('hidden');
  showSection('trades');
}
function sellByTicker(t){
  let idx=holdings.findIndex(h=>h.ticker===t); if(idx===-1){alert('No holding for '+t+' - Buy first in Trades > All Stocks Market');return}
  sellIndex=idx; if(!withdrawAllowed){document.getElementById('popNo').style.display='flex';return}
  document.getElementById('popSell').style.display='flex';
}
async function doWithdraw(){
  let pass=document.getElementById('pass').value; if(!pass){alert('Enter password');return}
  let h=holdings[sellIndex]; let amt=parseFloat(h.total);
  mainBalance+=amt; portfolioVal-=amt; holdings.splice(sellIndex,1); sellIndex=null;
  await savePortfolio(); closePops(); document.getElementById('popOk').style.display='flex';
}
async function loadNews(){
  let snap=await db.collection('stockNews').orderBy('time','desc').limit(20).get();
  let grid=document.getElementById('newsGrid'); grid.innerHTML='';
  snap.forEach(doc=>{
    let n=doc.data();
    let d=document.createElement('div'); d.className='news-item';
    d.innerHTML=`<div style="width:40px;height:40px;background:#eef2ff;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:900">${n.tag?.[0]||'N'}</div><div><span style="font-size:10px;background:#eef2ff;padding:2px 6px;border-radius:6px">${n.tag}</span><h4 style="font-size:13px">${n.title}</h4><small>${n.src}</small></div>`;
    grid.appendChild(d);
  });
}
async function adminAddStock(){
  if(!isAdmin){alert('Only admin can edit - users cannot edit');return}
  let ticker=document.getElementById('aTicker').value.toUpperCase(); let name=document.getElementById('aName').value; let price=parseFloat(document.getElementById('aPrice').value); let logo=document.getElementById('aLogo').value||logoMap[ticker]||`https://logo.clearbit.com/${ticker.toLowerCase()}.com`;
  if(!ticker||!name||!price){alert('Fill');return}
  await db.collection('stocks').doc(ticker).set({ticker,name,price,change:'+1.24%',logo,time:firebase.firestore.FieldValue.serverTimestamp()});
  alert('Stock added - users will see it but cannot edit'); loadStocks();
}
async function adminAddNews(){
  if(!isAdmin){alert('Only admin');return}
  let title=document.getElementById('aNewsTitle').value; let tag=document.getElementById('aNewsTag').value||'Markets';
  if(!title) return; await db.collection('stockNews').add({title,src:'Admin • Just now',tag,time:firebase.firestore.FieldValue.serverTimestamp()}); alert('News added'); loadNews();
}
async function adminSetGain(){
  if(!isAdmin) return; let gain=parseFloat(document.getElementById('aGain').value||0);
  let users=await db.collection('stockPortfolio').get(); users.forEach(async doc=>{ await db.collection('stockPortfolio').doc(doc.id).update({dayGain:gain}); }); alert('Day gain set');
}
async function adminSetWithdraw(){
  if(!isAdmin) return; let allow=document.getElementById('aWithdraw').checked;
  let users=await db.collection('stockPortfolio').get(); users.forEach(async doc=>{ await db.collection('stockPortfolio').doc(doc.id).update({withdrawAllowed:allow}); }); alert('Withdrawal: '+allow);
}
async function loadActiveUsers(){
  db.collection('activeUsers').orderBy('lastActive','desc').limit(50).onSnapshot(snap=>{
    let div=document.getElementById('activeUsersList'); div.innerHTML='';
    snap.forEach(doc=>{ let u=doc.data(); div.innerHTML+=`<div style="border-bottom:1px solid #eee;padding:6px;font-size:12px"><b>${u.email}</b><br>UID: ${u.uid}<br>Last: ${u.lastActive?.toDate?.()?.toLocaleString()||''} • 🟢</div>`; });
  });
}
function showSection(sec){
  document.querySelectorAll('.sec').forEach(s=>s.classList.add('hidden'));
  document.getElementById('sec-'+sec).classList.remove('hidden');
  document.querySelectorAll('.side').forEach(a=>a.classList.remove('active'));
  let el=document.querySelector(`[data-sec="${sec}"]`); if(el) el.classList.add('active');
  if(sec==='trades') renderTradesTab();
}
function closePops(){ document.querySelectorAll('.popup').forEach(p=>p.style.display='none'); document.getElementById('tradeDetailBox')?.classList.add('hidden'); }

// EVENTS - CLICKABLE DURATIONS AND CHART TABS
document.querySelectorAll('.side').forEach(el=>el.addEventListener('click',()=>showSection(el.dataset.sec)));
document.getElementById('buyAmount').addEventListener('input',calcQty);
document.getElementById('buyBtn').addEventListener('click',buyStock);
document.getElementById('sellBtn').addEventListener('click',()=>sellByTicker(currentStock?.ticker));
document.getElementById('closeTradeBtn').addEventListener('click',()=>{ if(!withdrawAllowed){document.getElementById('popNo').style.display='flex';return} document.getElementById('popSell').style.display='flex'; });
document.getElementById('confirmSell').addEventListener('click',doWithdraw);

document.querySelectorAll('.dur').forEach(d=>{
  d.addEventListener('click',()=>{
    document.querySelectorAll('.dur').forEach(x=>x.classList.remove('active'));
    d.classList.add('active'); selectedDuration=d.dataset.dur; calcQty();
  });
});
document.querySelectorAll('.ctab').forEach(t=>{
  t.addEventListener('click',()=>{
    document.querySelectorAll('.ctab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active'); selectedChart=t.dataset.d; calcQty();
  });
});
document.querySelectorAll('.trade-tab').forEach(t=>{
  t.addEventListener('click',()=>{
    document.querySelectorAll('.trade-tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active'); currentTab=t.dataset.tab; renderTradesTab();
  });
});
document.getElementById('tabBuy').addEventListener('click',()=>{document.getElementById('tabBuy').classList.add('active');document.getElementById('tabSell').classList.remove('active')});
document.getElementById('tabSell').addEventListener('click',()=>{document.getElementById('tabSell').classList.add('active');document.getElementById('tabBuy').classList.remove('active'); if(currentStock) sellByTicker(currentStock.ticker)});