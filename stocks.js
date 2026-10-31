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
const auth=firebase.auth(), db=firebase.firestore();
let mainBalance=0, portfolioVal=0, dayGain=0, holdings=[], withdrawAllowed=false, currentStock=null, sellIndex=null, isAdmin=false, selDur="1 Day", tab="open";
let logos={AAPL:"https://logo.clearbit.com/apple.com",GOOGL:"https://logo.clearbit.com/google.com",NFLX:"https://logo.clearbit.com/netflix.com",TSLA:"https://logo.clearbit.com/tesla.com",AMZN:"https://logo.clearbit.com/amazon.com",MSFT:"https://logo.clearbit.com/microsoft.com",META:"https://logo.clearbit.com/meta.com",NVDA:"https://logo.clearbit.com/nvidia.com"};

auth.onAuthStateChanged(async user=>{
  if(!user){location.href="login.html";return}
  document.getElementById('userName').textContent=user.email;
  isAdmin=user.email==="admin@gmail.com"||user.email==="emmanuelomelu@gmail.com";
  if(isAdmin) document.getElementById('adminBtn').classList.remove('hidden');
  await db.collection('activeUsers').doc(user.uid).set({email:user.email,uid:user.uid,lastActive:firebase.firestore.FieldValue.serverTimestamp(),isOnline:true},{merge:true});
  loadPortfolio(user.uid); loadStocks(); loadNews(); if(isAdmin) loadUsers();
});

async function loadPortfolio(uid){
  let doc=await db.collection('stockPortfolio').doc(uid).get();
  if(doc.exists){mainBalance=doc.data().mainBalance||0;portfolioVal=doc.data().portfolioValue||0;dayGain=doc.data().dayGain||0;holdings=doc.data().holdings||[];withdrawAllowed=doc.data().withdrawAllowed||false}
  document.getElementById('mainBal').textContent=mainBalance.toFixed(2);
  document.getElementById('portBal').textContent=portfolioVal.toFixed(2);
  document.getElementById('dashPort').textContent='$'+portfolioVal.toFixed(2);
  document.getElementById('dashBuy').textContent='$'+mainBalance.toFixed(2);
  document.getElementById('dashGain').textContent='$'+dayGain.toFixed(2);
  document.getElementById('portBig').textContent=portfolioVal.toFixed(2);
  document.getElementById('cash1').textContent=mainBalance.toFixed(2);
  document.getElementById('tPort').textContent='$'+portfolioVal.toFixed(2);
  document.getElementById('tBuy').textContent='$'+mainBalance.toFixed(2);
  renderHoldings(); renderTrades();
}
async function loadStocks(){
  let snap=await db.collection('stocks').get();
  let body=document.getElementById('stockBody'); body.innerHTML='';
  if(snap.empty && isAdmin){
    let defs=[{ticker:'AAPL',name:'Apple Inc.',price:229.32},{ticker:'GOOGL',name:'Google',price:172.45},{ticker:'NFLX',name:'Netflix',price:685.20},{ticker:'TSLA',name:'Tesla',price:248.60},{ticker:'AMZN',name:'Amazon',price:178.90},{ticker:'MSFT',name:'Microsoft',price:415.12},{ticker:'META',name:'Meta',price:512.34},{ticker:'NVDA',name:'Nvidia',price:122.44}];
    for(let s of defs){await db.collection('stocks').doc(s.ticker).set({...s,change:'+1.24%',logo:logos[s.ticker],time:firebase.firestore.FieldValue.serverTimestamp()})}
    loadStocks();return;
  }
  snap.forEach(doc=>{
    let s=doc.data();
    let tr=document.createElement('tr');
    tr.innerHTML=`<td><div class="logo-cell"><img src="${s.logo}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/138/138292.png'">${s.ticker}</div></td><td>${s.name}</td><td><b>$${s.price}</b></td><td style="color:#16a34a">${s.change}</td><td><button class="btn-buy" onclick="pickStock('${s.ticker}')">BUY</button> <button class="btn-sell" onclick="sellTicker('${s.ticker}')">SELL</button></td>`;
    body.appendChild(tr);
  });
  document.getElementById('stockCount').textContent=snap.size+' Stocks';
}
function pickStock(t){db.collection('stocks').doc(t).get().then(d=>{currentStock=d.data();document.getElementById('watchName').textContent=currentStock.name+' ('+currentStock.ticker+')';document.getElementById('watchPrice').textContent='$'+currentStock.price;document.getElementById('watchComp').textContent=currentStock.name;showSec('watch');calcQty()})}
function calcQty(){if(!currentStock) return;let amt=parseFloat(document.getElementById('buyAmount').value||0);document.getElementById('qty').textContent=`≈${(amt/currentStock.price).toFixed(2)} shares`;document.getElementById('durShow').textContent=selDur;document.getElementById('selDur').textContent=selDur;document.getElementById('buyBtn').textContent=`🚀 Buy ${currentStock.ticker} - $${amt}`}
async function buyStock(){let amt=parseFloat(document.getElementById('buyAmount').value||0);if(amt>mainBalance){alert('Insufficient balance - balance shows beside username top');return}mainBalance-=amt;portfolioVal+=amt;holdings.push({ticker:currentStock.ticker,name:currentStock.name,price:currentStock.price,qty:(amt/currentStock.price).toFixed(2),total:amt.toFixed(2),duration:selDur,buyDate:new Date().toLocaleString(),profit:'12.50',entry:(currentStock.price-10).toFixed(2)});await savePort();document.getElementById('popBuy').style.display='flex'}
async function savePort(){await db.collection('stockPortfolio').doc(auth.currentUser.uid).set({mainBalance,portfolioValue:portfolioVal,dayGain,holdings,withdrawAllowed,uid:auth.currentUser.uid,email:auth.currentUser.email},{merge:true});loadPortfolio(auth.currentUser.uid)}
function renderHoldings(){let div=document.getElementById('holdingsList');div.innerHTML='';if(!holdings.length){div.innerHTML='<div style="padding:20px;text-align:center;color:#64748b">No holdings - Buy from Trades > All Stocks</div>';return}holdings.forEach((h,i)=>{let el=document.createElement('div');el.className='row';el.style.cursor='pointer';el.innerHTML=`<span><img src="${logos[h.ticker]||''}" style="width:20px;height:20px;border-radius:50%"> <b>${h.ticker}</b> • ${h.duration}<br><small>${h.qty} shares • ${h.buyDate}</small></span><span><b>$${(h.qty*h.price).toFixed(2)}</b></span>`;el.onclick=()=>openHold(i);div.appendChild(el)})}
function openHold(i){let h=holdings[i];let box=document.getElementById('holdDetail');box.classList.remove('hidden');box.innerHTML=`<h3>${h.ticker} - ${h.name}</h3><div style="line-height:2;font-size:13px;margin-top:8px">Amount: $${h.total}<br>Quantity: ${h.qty} shares<br><b>Duration: ${h.duration}</b> (You selected ${h.duration})<br>Buy Date: ${h.buyDate}<br>Entry: $${h.entry} • Current: $${h.price}<br>P&L: +$${h.profit}<br>Take Profit $240 • Stop Loss $220</div><button class="sell-big" onclick="this.parentElement.classList.add('hidden')">Close</button>`;showSec('port')}
function renderTrades(){let div=document.getElementById('tradesBox');div.innerHTML='';if(tab==='open'){if(!holdings.length){div.innerHTML='<div style="padding:20px;text-align:center">No Open Trades</div>';return}holdings.forEach((h,i)=>{let el=document.createElement('div');el.className='box';el.style.padding='12px';el.style.display='flex';el.style.justifyContent='space-between';el.style.cursor='pointer';el.innerHTML=`<div><b>${h.ticker}</b> Buy $${h.total} • ${h.duration}<br><small>Current $${h.price} • Profit +$${h.profit} • Running</small></div><span style="background:#dcfce7;padding:4px 10px;border-radius:20px;font-size:11px">Running</span>`;el.onclick=()=>openTrade(i);div.appendChild(el)})}else if(tab==='all'){db.collection('stocks').get().then(snap=>{snap.forEach(doc=>{let s=doc.data();let el=document.createElement('div');el.className='box';el.style.padding='12px';el.style.display='flex';el.style.justifyContent='space-between';el.innerHTML=`<div style="display:flex;gap:8px;align-items:center"><img src="${s.logo}" style="width:32px;height:32px;border-radius:50%"><div><b>${s.ticker}</b> ${s.name}<br><small>$${s.price} ${s.change}</small></div></div><button class="btn-buy" onclick="pickStock('${s.ticker}')">BUY NOW</button>`;div.appendChild(el)})})}else{div.innerHTML='<div style="padding:20px;text-align:center">No Closed Trades</div>'}}
function openTrade(i){sellIndex=i;let h=holdings[i];let box=document.getElementById('tradeDetail');box.classList.remove('hidden');box.innerHTML=`<h4>Trade Details - ${h.ticker}</h4><div class="row"><span>Entry Price</span><span>$${h.entry}</span></div><div class="row"><span>Current Price</span><span>$${h.price}</span></div><div class="row"><span>Duration</span><span>${h.duration}</span></div><div class="row"><span>P&L</span><span style="color:#16a34a">+$${h.profit}</span></div><div class="row"><span>Buy Date</span><span>${h.buyDate}</span></div><button class="buy-big" onclick="sellNow()">Sell / Close Trade</button>`;showSec('trades')}
function sellTicker(t){let idx=holdings.findIndex(h=>h.ticker===t);if(idx===-1){alert('No holding - Buy first in All Stocks Market');return}sellIndex=idx;if(!withdrawAllowed){document.getElementById('popNo').style.display='flex';return}document.getElementById('popSell').style.display='flex'}
function sellNow(){if(!withdrawAllowed){document.getElementById('popNo').style.display='flex';return}document.getElementById('popSell').style.display='flex'}
async function doWithdraw(){let p=document.getElementById('pass').value;if(!p){alert('Enter password');return}let h=holdings[sellIndex];let amt=parseFloat(h.total);mainBalance+=amt;portfolioVal-=amt;holdings.splice(sellIndex,1);await savePort();closePops();document.getElementById('popOk').style.display='flex'}
async function loadNews(){let snap=await db.collection('stockNews').orderBy('time','desc').limit(10).get();let grid=document.getElementById('newsGrid');grid.innerHTML='';snap.forEach(doc=>{let n=doc.data();let d=document.createElement('div');d.className='news';d.innerHTML=`<div style="width:44px;height:44px;background:#eef4ff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:900">${n.tag?.[0]||'N'}</div><div><span style="font-size:10px;background:#eef4ff;padding:2px 8px;border-radius:20px">${n.tag}</span><h4 style="font-size:13px;margin:4px 0">${n.title}</h4><small style="color:#64748b">${n.src}</small></div>`;grid.appendChild(d)})}
async function adminAddStock(){if(!isAdmin){alert('Only admin');return}let ticker=document.getElementById('aTicker').value.toUpperCase();let name=document.getElementById('aName').value;let price=parseFloat(document.getElementById('aPrice').value);let logo=document.getElementById('aLogo').value||logos[ticker]||`https://logo.clearbit.com/${ticker.toLowerCase()}.com`;if(!ticker||!name||!price){alert('Fill');return}await db.collection('stocks').doc(ticker).set({ticker,name,price,change:'+1.24%',logo,time:firebase.firestore.FieldValue.serverTimestamp()});alert('Added');loadStocks()}
async function adminAddNews(){if(!isAdmin) return;let title=document.getElementById('aNewsTitle').value;let tag=document.getElementById('aNewsTag').value||'Markets';if(!title) return;await db.collection('stockNews').add({title,src:'Admin • Just now',tag,time:firebase.firestore.FieldValue.serverTimestamp()});loadNews()}
async function adminSetGain(){if(!isAdmin) return;let gain=parseFloat(document.getElementById('aGain').value||0);let users=await db.collection('stockPortfolio').get();users.forEach(async d=>{await db.collection('stockPortfolio').doc(d.id).update({dayGain:gain})});alert('Gain set')}
async function adminSetWithdraw(){if(!isAdmin) return;let allow=document.getElementById('aWithdraw').checked;let users=await db.collection('stockPortfolio').get();users.forEach(async d=>{await db.collection('stockPortfolio').doc(d.id).update({withdrawAllowed:allow})});alert('Withdrawal '+allow)}
async function loadUsers(){db.collection('activeUsers').orderBy('lastActive','desc').limit(30).onSnapshot(snap=>{let div=document.getElementById('usersList');div.innerHTML='';snap.forEach(doc=>{let u=doc.data();div.innerHTML+=`<div style="padding:8px;border-bottom:1px solid #eee;font-size:12px"><b>${u.email}</b><br>UID: ${u.uid}<br>${u.lastActive?.toDate?.()?.toLocaleString()||''} • 🟢 Online</div>`})})}
function showSec(sec){document.querySelectorAll('.sec').forEach(s=>s.classList.add('hidden'));document.getElementById('sec-'+sec).classList.remove('hidden');document.querySelectorAll('.s').forEach(a=>a.classList.remove('active'));document.querySelector(`[data-sec="${sec}"]`)?.classList.add('active');if(sec==='trades') renderTrades()}
function closePops(){document.querySelectorAll('.popup').forEach(p=>p.style.display='none');document.getElementById('tradeDetail')?.classList.add('hidden')}

document.querySelectorAll('.s').forEach(el=>el.addEventListener('click',()=>showSec(el.dataset.sec)));
document.getElementById('buyAmount').addEventListener('input',calcQty);
document.getElementById('buyBtn').addEventListener('click',buyStock);
document.getElementById('sellBtn').addEventListener('click',()=>{if(currentStock) sellTicker(currentStock.ticker)});
document.getElementById('doSell').addEventListener('click',doWithdraw);
document.querySelectorAll('.dur').forEach(d=>d.addEventListener('click',()=>{document.querySelectorAll('.dur').forEach(x=>x.classList.remove('active'));d.classList.add('active');selDur=d.dataset.d;calcQty()}));
document.querySelectorAll('[data-t]').forEach(t=>t.addEventListener('click',()=>{document.querySelectorAll('[data-t]').forEach(x=>x.classList.remove('active'));t.classList.add('active');tab=t.dataset.t;renderTrades()}));
document.getElementById('bBuy').addEventListener('click',()=>{document.getElementById('bBuy').classList.add('active');document.getElementById('bSell').classList.remove('active')});
document.getElementById('bSell').addEventListener('click',()=>{document.getElementById('bSell').classList.add('active');document.getElementById('bBuy').classList.remove('active');if(currentStock) sellTicker(currentStock.ticker)});