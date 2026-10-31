// 0 BALANCE START - USER BALANCE BESIDE USERNAME
let mainBalance = parseFloat(localStorage.getItem('mainBal')||'0');
let portfolioVal = parseFloat(localStorage.getItem('portVal')||'0');
let dayGain = parseFloat(localStorage.getItem('dayGain')||'0');
let holdings = JSON.parse(localStorage.getItem('holdings')||'[]');
let withdrawAllowed = localStorage.getItem('withdrawAllowed')==='true';
let currentStock = {ticker:'AAPL',name:'Apple Inc.',price:229.32,company:'Apple Inc. NASDAQ'};
let sellIndex = null;

let stocks = JSON.parse(localStorage.getItem('adminStocks')||'null') || [
{ticker:'AAPL',name:'Apple',company:'Apple Inc.',price:229.32,change:'+1.24%'},
{ticker:'GOOGL',name:'Google',company:'Alphabet',price:172.45,change:'+0.98%'},
{ticker:'NFLX',name:'Netflix',company:'Netflix Inc.',price:685.20,change:'+2.67%'},
{ticker:'TSLA',name:'Tesla',company:'Tesla Inc.',price:248.60,change:'+1.56%'},
{ticker:'AMZN',name:'Amazon',company:'Amazon.com',price:178.90,change:'+0.73%'},
{ticker:'MSFT',name:'Microsoft',company:'Microsoft Corp.',price:415.12,change:'+1.12%'},
{ticker:'META',name:'Meta',company:'Meta Platforms',price:512.34,change:'+2.05%'},
{ticker:'NVDA',name:'Nvidia',company:'Nvidia Corp.',price:122.44,change:'+3.11%'}
];

let news = JSON.parse(localStorage.getItem('adminNews')||'null') || [
{title:'Apple earnings beat expectations as services revenue grows 14%',src:'Reuters • 12m ago',tag:'Tech'},
{title:'Tesla unveils lower-cost EV model plans for 2025',src:'Bloomberg • 1h ago',tag:'Tech'},
{title:'Netflix subscriber growth surges as ad tier gains traction',src:'Reuters • 3h ago',tag:'Markets'},
{title:'Nvidia shares climb 4% on AI demand outlook upgrade',src:'Bloomberg • 5h ago',tag:'Markets'}
];

function init(){
document.getElementById('mainBalanceTop').textContent=mainBalance.toFixed(2);
document.getElementById('dashPort').textContent='$'+portfolioVal.toFixed(2);
document.getElementById('dashGain').textContent='$'+dayGain.toFixed(2);
document.getElementById('dashBuyPower').textContent='$'+mainBalance.toFixed(2);
document.getElementById('portValueBig').textContent=portfolioVal.toFixed(2);
document.getElementById('cashBal').textContent=mainBalance.toFixed(2);
document.getElementById('cashBal2').textContent=mainBalance.toFixed(2);
document.getElementById('tradePortVal').textContent='$'+portfolioVal.toFixed(2);
document.getElementById('tradeBuyPower').textContent='$'+mainBalance.toFixed(2);
document.getElementById('userNameTop').textContent=localStorage.getItem('userName')||'User Name';
document.getElementById('userAvatar').textContent=(localStorage.getItem('userName')||'U')[0].toUpperCase();
renderPopular(); renderHoldings(); renderTrades(); renderNews(); calcQty();
}

function renderPopular(){
let body=document.getElementById('popularBody'); body.innerHTML='';
stocks.forEach(s=>{
let tr=document.createElement('tr');
tr.innerHTML=`<td><b>${s.ticker}</b></td><td>${s.name}</td><td><b>$${s.price}</b></td><td class="green">${s.change}</td><td><button class="buy-btn" onclick="selectStock('${s.ticker}')">BUY</button> <button class="sell-btn" onclick="sellStock('${s.ticker}')">SELL</button></td>`;
body.appendChild(tr);
});
}

function renderHoldings(){
let div=document.getElementById('holdingsList'); div.innerHTML='';
if(holdings.length===0){div.innerHTML='<div style="padding:16px;text-align:center;color:#64748b">No holdings yet - Buy a stock</div>';return}
holdings.forEach((h,i)=>{
let el=document.createElement('div'); el.className='hold-item';
el.innerHTML=`<div><b>${h.ticker}</b> - ${h.name}<br><small>${h.qty} shares</small></div><div style="text-align:right"><b>$${(h.qty*h.price).toFixed(2)}</b><br><small class="green">+$12.50</small></div>`;
el.onclick=()=>openTrade(i);
div.appendChild(el);
});
}

function renderTrades(){
let div=document.getElementById('openTradesList'); div.innerHTML='';
if(holdings.length===0){div.innerHTML='<div style="padding:16px;text-align:center;color:#64748b">No Open Trades</div>';return}
holdings.forEach((h,i)=>{
let el=document.createElement('div'); el.className='trade-card';
el.innerHTML=`<div>📈 <b>${h.ticker}</b> ${h.name} Buy $${h.total}<br><small>TP: $240 SL: $220 Current Price $${h.price} Profit <span class="green">+$${h.profit||'12.50'}</span> Status: Running</small></div><div><span style="background:#dcfce7;color:#16a34a;padding:4px 8px;border-radius:12px;font-size:11px">Running</span></div>`;
el.onclick=()=>openTrade(i);
div.appendChild(el);
});
}

function renderNews(){
let feed=document.getElementById('newsFeed'); feed.innerHTML='';
news.forEach(n=>{
let d=document.createElement('div'); d.className='news-item';
d.innerHTML=`<div class="news-icon">${n.tag[0]}</div><div><span style="font-size:10px;background:#eef2ff;padding:2px 6px;border-radius:6px">${n.tag}</span><h4>${n.title}</h4><small>${n.src}</small></div>`;
feed.appendChild(d);
});
}

function showSection(sec){
document.querySelectorAll('.sec').forEach(s=>s.classList.add('hidden'));
document.getElementById('sec-'+sec).classList.remove('hidden');
document.querySelectorAll('.side-item').forEach(a=>a.classList.remove('active'));
document.querySelector(`[data-sec="${sec}"]`).classList.add('active');
}

function selectStock(ticker){
let s=stocks.find(x=>x.ticker===ticker); currentStock=s;
document.getElementById('watchStockName').textContent=`Stocks — ${s.name} (${s.ticker})`;
document.getElementById('watchComp').textContent=s.company+' NASDAQ';
document.getElementById('watchPrice').textContent='$'+s.price;
document.getElementById('buyBtnTicker').textContent=s.ticker;
showSection('watch'); calcQty();
}

function calcQty(){
let amt=parseFloat(document.getElementById('buyAmount').value||0);
let qty=(amt/currentStock.price).toFixed(2);
document.getElementById('qtyCalc').textContent=`≈${qty} shares`;
document.getElementById('estCost').textContent=amt.toFixed(2);
document.getElementById('buyBtnAmt').textContent=amt.toLocaleString()+'.00';
}

function buyStock(){
let amt=parseFloat(document.getElementById('buyAmount').value||0);
if(amt<=0||amt>mainBalance){alert('Insufficient balance. Balance is 0 until admin funds or user deposits.');return}
mainBalance-=amt; portfolioVal+=amt;
let qty=amt/currentStock.price;
holdings.push({ticker:currentStock.ticker,name:currentStock.name,price:currentStock.price,qty:qty.toFixed(2),total:amt.toFixed(2),profit:'12.50',entry:(currentStock.price-12.82).toFixed(2)});
saveAll();
document.getElementById('popSuccess').style.display='flex';
}

function sellStock(ticker){
let idx=holdings.findIndex(h=>h.ticker===ticker);
if(idx===-1){alert('No holding for '+ticker);return}
sellIndex=idx;
if(!withdrawAllowed){document.getElementById('popNoWithdraw').style.display='flex';return}
document.getElementById('popWithdraw').style.display='flex';
}

function openTrade(i){
sellIndex=i; let h=holdings[i];
document.getElementById('tdEntry').textContent='$'+h.entry;
document.getElementById('tdCurrent').textContent='$'+h.price;
document.getElementById('tdPnl').textContent='+$'+(h.profit||'12.50');
document.getElementById('tdDur').textContent='2d 5h 12m';
document.getElementById('tradeDetailBox').classList.remove('hidden');
showSection('trades');
}

function doWithdraw(){
let pass=document.getElementById('withdrawPass').value;
if(!pass){alert('Enter password');return}
let h=holdings[sellIndex]; let amt=parseFloat(h.total);
mainBalance+=amt; portfolioVal-=amt;
holdings.splice(sellIndex,1); sellIndex=null;
saveAll(); closePops();
document.getElementById('popWithdrawOk').style.display='flex';
}

function saveAll(){
localStorage.setItem('mainBal',mainBalance);
localStorage.setItem('portVal',portfolioVal);
localStorage.setItem('holdings',JSON.stringify(holdings));
init();
}
function closePops(){
document.querySelectorAll('.popup').forEach(p=>p.style.display='none');
document.getElementById('tradeDetailBox').classList.add('hidden');
}

// Admin functions
function adminAddStockPrompt(){
let t=prompt('Ticker (e.g. NFLX)'); let n=prompt('Company name'); let p=prompt('Price e.g. 685.20');
if(!t||!n||!p) return;
stocks.push({ticker:t.toUpperCase(),name:n,company:n,price:parseFloat(p),change:'+1.24%'});
localStorage.setItem('adminStocks',JSON.stringify(stocks)); renderPopular();
}
function adminAddNewsPrompt(){
let title=prompt('News title');
if(!title) return;
news.unshift({title:title,src:'Admin • Just now',tag:'Markets'});
localStorage.setItem('adminNews',JSON.stringify(news)); renderNews();
}

document.querySelectorAll('.side-item').forEach(el=>{el.addEventListener('click',()=>showSection(el.dataset.sec))});
document.getElementById('buyAmount').addEventListener('input',calcQty);
document.getElementById('buyBtn').addEventListener('click',buyStock);
document.getElementById('closeTradeBtn').addEventListener('click',()=>{ if(!withdrawAllowed){document.getElementById('popNoWithdraw').style.display='flex';return} document.getElementById('popWithdraw').style.display='flex'; });
document.getElementById('doWithdrawBtn').addEventListener('click',doWithdraw);

init();