// BALANCE = 0 until buy, admin controls
let mainBalance = parseFloat(localStorage.getItem('mainBal')||'0');
let portfolioVal = parseFloat(localStorage.getItem('portVal')||'0');
let dayGain = parseFloat(localStorage.getItem('dayGain')||'0');
let withdrawAllowed = localStorage.getItem('withdrawAllowed')==='true';
let holdings = JSON.parse(localStorage.getItem('holdings')||'[]');
let currentStock = {ticker:'AAPL',name:'Apple Inc.',price:229.32};
let sellIndex = null;

let stocks = JSON.parse(localStorage.getItem('adminStocks')||'null') || [
{ticker:'AAPL',name:'Apple',price:229.32,change:'+1.24%'},
{ticker:'GOOGL',name:'Google',price:172.45,change:'+0.98%'},
{ticker:'NFLX',name:'Netflix',price:685.20,change:'+2.67%'},
{ticker:'TSLA',name:'Tesla',price:248.60,change:'+1.56%'},
{ticker:'AMZN',name:'Amazon',price:178.90,change:'+0.73%'},
{ticker:'MSFT',name:'Microsoft',price:415.12,change:'+1.12%'},
{ticker:'META',name:'Meta',price:512.34,change:'+2.05%'},
{ticker:'NVDA',name:'Nvidia',price:122.44,change:'+3.11%'}
];

let news = JSON.parse(localStorage.getItem('adminNews')||'null') || [
{title:'Apple earnings beat expectations as services revenue grows 14%',src:'Reuters - 12m ago',tag:'Tech'},
{title:'Tesla unveils lower-cost EV model plans for 2025',src:'Bloomberg - 1h ago',tag:'Tech'},
{title:'Netflix subscriber growth surges as ad tier gains traction',src:'Reuters - 3h ago',tag:'Markets'},
{title:'Nvidia shares climb 4% on AI demand outlook upgrade',src:'Bloomberg - 5h ago',tag:'Markets'}
];

function init(){
document.getElementById('mainBal').textContent=mainBalance.toFixed(2);
document.getElementById('buyPower').textContent='$'+mainBalance.toFixed(2);
document.getElementById('cashBal').textContent=mainBalance.toFixed(2);
document.getElementById('portVal').textContent='$'+portfolioVal.toFixed(2);
document.getElementById('pVal2').textContent=portfolioVal.toFixed(2);
document.getElementById('dayGain').textContent='$'+dayGain.toFixed(2);
document.getElementById('userName').textContent=localStorage.getItem('userName')||'User';
document.getElementById('userInit').textContent=(localStorage.getItem('userName')||'U')[0].toUpperCase();
renderStocks(); renderHoldings(); renderTrades(); renderNews();
calcQty();
}

function renderStocks(){
let tbl=document.getElementById('stockTable');
tbl.innerHTML='<tr><th>LOGO | TICKER</th><th>COMPANY</th><th>PRICE</th><th>CHANGE</th><th>ACTION</th></tr>';
stocks.forEach(s=>{
let tr=document.createElement('tr');
tr.innerHTML=`<td><b>${s.ticker}</b></td><td>${s.name}</td><td><b>$${s.price}</b></td><td class="green">${s.change}</td><td><button class="buy" onclick="selectStock('${s.ticker}')">BUY</button> <button class="sell" onclick="prepSell('${s.ticker}')">SELL</button></td>`;
tbl.appendChild(tr);
});
}

function renderHoldings(){
let div=document.getElementById('holdingsList'); div.innerHTML='';
if(holdings.length===0){div.innerHTML='<div style="padding:20px;text-align:center;color:#64748b">No holdings yet - Buy a stock</div>';return}
holdings.forEach((h,i)=>{
let el=document.createElement('div'); el.className='holdCard';
el.innerHTML=`<div><b>${h.ticker}</b> - ${h.name}<br><small>${h.qty} shares • $${h.price}</small></div><div><b>$${(h.qty*h.price).toFixed(2)}</b><br><small style="background:#dcfce7;padding:2px 6px;border-radius:8px">View</small></div>`;
el.onclick=()=>openTradeDetail(i);
div.appendChild(el);
});
}

function renderTrades(){
let div=document.getElementById('tradesList'); div.innerHTML='';
if(holdings.length===0){div.innerHTML='<div style="padding:20px;text-align:center;color:#64748b">No open trades</div>';return}
holdings.forEach((h,i)=>{
let el=document.createElement('div'); el.className='holdCard';
el.innerHTML=`<div>📈 <b>${h.ticker}</b> Buy $${h.total}<br><small>Current: $${h.price} • Profit: <span class="green">+$${h.profit||'12.50'}</span></small></div><div><span style="background:#dcfce7;color:#16a34a;padding:4px 8px;border-radius:12px;font-size:11px">Running</span></div>`;
el.onclick=()=>openTradeDetail(i);
div.appendChild(el);
});
}

function renderNews(){
let grid=document.getElementById('newsGrid'); grid.innerHTML='';
news.forEach(n=>{
let c=document.createElement('div'); c.className='newsCard';
c.innerHTML=`<div style="width:60px;height:60px;background:#e0eaff;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:900">${n.tag[0]}</div><div><div style="font-size:11px;background:#eef2ff;display:inline-block;padding:2px 6px;border-radius:6px">${n.tag}</div><div style="font-weight:700;font-size:13px;margin-top:4px">${n.title}</div><div style="font-size:11px;color:#64748b">${n.src}</div></div>`;
grid.appendChild(c);
});
}

function showSec(sec){
['dash','port','watch','trades','news'].forEach(s=>{
document.getElementById('sec-'+s).classList.toggle('hidden',s!==sec);
document.getElementById('s'+s.charAt(0).toUpperCase()+s.slice(1)).classList.toggle('active',s===sec);
});
}

function selectStock(t){
let s=stocks.find(x=>x.ticker===t); currentStock=s;
document.getElementById('watchTitle').textContent=`Stocks - ${s.name} (${s.ticker})`;
document.getElementById('buyBtn').innerHTML=`Buy ${s.ticker} - $<span id="buyBtnAmt">${document.getElementById('buyAmount').value}</span>`;
showSec('watch'); calcQty();
}

function calcQty(){
let amt=parseFloat(document.getElementById('buyAmount').value||0);
let qty=(amt/currentStock.price).toFixed(2);
document.getElementById('qtyCalc').textContent=`≈${qty} shares`;
let span=document.getElementById('buyBtnAmt');
if(span) span.textContent=amt;
}

function confirmBuy(){
let amt=parseFloat(document.getElementById('buyAmount').value||0);
if(amt<=0||amt>mainBalance){alert('Insufficient main balance - Balance is 0, user needs deposit');return}
mainBalance-=amt; portfolioVal+=amt;
let qty=amt/currentStock.price;
holdings.push({ticker:currentStock.ticker,name:currentStock.name,price:currentStock.price,qty:qty.toFixed(2),total:amt.toFixed(2),profit:'12.50',entryPrice:(currentStock.price-12.82).toFixed(2)});
saveAll();
document.getElementById('popBuy').style.display='flex';
}

function prepSell(t){ currentStock=stocks.find(x=>x.ticker===t); sellIndex=holdings.findIndex(h=>h.ticker===t); if(sellIndex===-1) sellIndex=0; sellFlow(); }
function openTradeDetail(i){ sellIndex=i; let h=holdings[i]; document.getElementById('tdEntry').textContent='$'+h.entryPrice; document.getElementById('tdCurrent').textContent='$'+h.price; document.getElementById('tdDur').textContent='2d 5h 12m'; document.getElementById('tdPnl').textContent='+$'+(h.profit||'12.50'); document.getElementById('tradeDetail').classList.remove('hidden'); showSec('trades'); }
function sellFlow(){
if(!withdrawAllowed){document.getElementById('popNo').style.display='flex';return}
document.getElementById('popSell').style.display='flex';
}
function doSell(){
let pass=document.getElementById('sellPass').value;
if(!pass){alert('Enter password');return}
let h=holdings[sellIndex!==null?sellIndex:0];
if(!h){closePops();return}
let amt=parseFloat(h.total);
mainBalance+=amt; portfolioVal-=amt;
holdings.splice(sellIndex,1);
sellIndex=null;
saveAll();
closePops();
document.getElementById('popSellOk').style.display='flex';
}
function saveAll(){
localStorage.setItem('mainBal',mainBalance);
localStorage.setItem('portVal',portfolioVal);
localStorage.setItem('holdings',JSON.stringify(holdings));
init();
}
function closePops(){
document.querySelectorAll('.popup').forEach(p=>p.style.display='none');
document.getElementById('tradeDetail').classList.add('hidden');
}

// Listeners
document.getElementById('sDash').onclick=()=>showSec('dash');
document.getElementById('sPort').onclick=()=>showSec('port');
document.getElementById('sWatch').onclick=()=>showSec('watch');
document.getElementById('sTrades').onclick=()=>showSec('trades');
document.getElementById('sNews').onclick=()=>showSec('news');
document.getElementById('buyAmount').addEventListener('input',calcQty);
document.getElementById('buyBtn').onclick=confirmBuy;
document.getElementById('sellBtn').onclick=sellFlow;
document.getElementById('confirmSell').onclick=doSell;
document.getElementById('cancelSell').onclick=closePops;
document.getElementById('closeBuyOk').onclick=closePops;
document.getElementById('closeSellOk').onclick=closePops;
document.getElementById('closeNo').onclick=closePops;

init();

// ADMIN API for you
// localStorage.setItem('withdrawAllowed','true') -> allow withdraw
// localStorage.setItem('dayGain','887.40')
// Add stock: let s=JSON.parse(localStorage.getItem('adminStocks')); s.push({ticker:'NEW',name:'New Co',price:100,change:'+1%'}); localStorage.setItem('adminStocks',JSON.stringify(s))