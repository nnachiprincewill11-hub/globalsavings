import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, deleteDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCmRE7PK3ve9DjBGIOCcOuq_5WyfUrwM50",
  authDomain: "global-savings.firebaseapp.com",
  projectId: "global-savings",
  storageBucket: "global-savings.firebasestorage.app",
  messagingSenderId: "83435054105",
  appId: "1:83435054105:web:efac6cbd5a264a6892b688"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let isAdmin=false, allStocks=[], holdings=[], filter="all", currentUser=null;
let balances={mainBalance:0,stockBalance:0,depositedBalance:0,gain:0,tradePassword:"1234"};
const ADMIN_EMAILS=["admin@gmail.com","emmanuelomelu@gmail.com"];

// ALL MARKET ASSETS - ADMIN CAN EDIT ALL
const ALL_ASSETS = [
  {symbol:"BTC",name:"Bitcoin",type:"crypto",price:68420,change:2.31,cap:"$1.35T"},
  {symbol:"ETH",name:"Ethereum",type:"crypto",price:2540,change:-0.84,cap:"$305B"},
  {symbol:"USDT",name:"Tether",type:"crypto",price:1,change:0.01,cap:"$119B"},
  {symbol:"BNB",name:"BNB",type:"crypto",price:605,change:1.2,cap:"$88B"},
  {symbol:"SOL",name:"Solana",type:"crypto",price:178,change:5.4,cap:"$84B"},
  {symbol:"USDC",name:"USD Coin",type:"crypto",price:1,change:0,cap:"$35B"},
  {symbol:"XRP",name:"XRP",type:"crypto",price:0.58,change:-1.2,cap:"$32B"},
  {symbol:"DOGE",name:"Dogecoin",type:"crypto",price:0.14,change:3.1,cap:"$20B"},
  {symbol:"ADA",name:"Cardano",type:"crypto",price:0.45,change:-2.1,cap:"$16B"},
  {symbol:"AVAX",name:"Avalanche",type:"crypto",price:28,change:4.2,cap:"$11B"},
  {symbol:"SHIB",name:"Shiba Inu",type:"crypto",price:0.000025,change:6.5,cap:"$14B"},
  {symbol:"DOT",name:"Polkadot",type:"crypto",price:6.8,change:-0.5,cap:"$8.9B"},
  {symbol:"LINK",name:"Chainlink",type:"crypto",price:14.2,change:2.8,cap:"$8.4B"},
  {symbol:"MATIC",name:"Polygon",type:"crypto",price:0.52,change:-1.8,cap:"$5.2B"},
  {symbol:"LTC",name:"Litecoin",type:"crypto",price:72,change:1.1,cap:"$5.4B"},
  {symbol:"AAPL",name:"Apple Inc.",type:"stock",price:228.5,change:1.2,cap:"Technology"},
  {symbol:"MSFT",name:"Microsoft",type:"stock",price:415,change:0.8,cap:"Technology"},
  {symbol:"NVDA",name:"NVIDIA",type:"stock",price:875,change:3.4,cap:"Semiconductors"},
  {symbol:"GOOGL",name:"Alphabet",type:"stock",price:165,change:-0.3,cap:"Technology"},
  {symbol:"AMZN",name:"Amazon",type:"stock",price:178,change:1.5,cap:"Consumer"},
  {symbol:"META",name:"Meta Platforms",type:"stock",price:485,change:2.1,cap:"Technology"},
  {symbol:"TSLA",name:"Tesla",type:"stock",price:248,change:-1.4,cap:"Automotive"},
  {symbol:"NFLX",name:"Netflix",type:"stock",price:680,change:1.8,cap:"Entertainment"},
  {symbol:"SPY",name:"S&P 500 ETF",type:"stock",price:520,change:0.7,cap:"ETF"},
  {symbol:"GME",name:"GameStop",type:"stock",price:22,change:5.2,cap:"Meme"},
  {symbol:"AMD",name:"AMD",type:"stock",price:165,change:2.2,cap:"Semiconductors"},
  {symbol:"COIN",name:"Coinbase",type:"stock",price:245,change:4.5,cap:"Crypto Exchange"}
];

function checkAdmin(u){return u && (ADMIN_EMAILS.includes(u.email) || u.email.includes("admin"))}

onAuthStateChanged(auth, async user=>{
  currentUser=user; isAdmin=checkAdmin(user);
  document.getElementById("adminBanner").classList.toggle("show",isAdmin);
  document.getElementById("seedBtn").classList.toggle("hidden",!isAdmin);
  document.getElementById("adminEditBtn").classList.toggle("hidden",!isAdmin);
  document.getElementById("loginBtn").classList.toggle("hidden",!!user);
  document.getElementById("logoutBtn").classList.toggle("hidden",!user);
  document.getElementById("userEmail").textContent=user?user.email:"Not logged in";
  if(user){
    onSnapshot(doc(db,"userBalances",user.uid), snap=>{ if(snap.exists()) balances={...balances,...snap.data()}; renderBalances(); });
    onSnapshot(query(collection(db,"portfolios")), snap=>{ holdings=snap.docs.filter(d=>d.data().uid===user.uid).map(d=>({id:d.id,...d.data()})); render(); });
  }
});

document.getElementById("loginBtn").onclick=async()=>{ const e=prompt("Email:"); const p=prompt("Password:"); if(e&&p){try{await signInWithEmailAndPassword(auth,e,p)}catch(err){alert(err.message)}}};
document.getElementById("logoutBtn").onclick=()=>signOut(auth);

function renderBalances(){
  document.getElementById("mainBal").textContent="$"+(balances.mainBalance||0).toLocaleString();
  document.getElementById("stockBal").textContent="$"+(balances.stockBalance||0).toLocaleString();
  document.getElementById("depBal").textContent="$"+(balances.depositedBalance||0).toLocaleString();
  const g=balances.gain||0; const el=document.getElementById("gainBal"); el.textContent=(g>=0?"+ $":"- $")+Math.abs(g).toLocaleString(); el.className=g>=0?"up":"down";
  let hv=0; holdings.forEach(h=>{ const live=allStocks.find(a=>a.symbol===h.symbol)?.price||h.avgPrice; hv+=live*h.quantity; });
  document.getElementById("holdVal").textContent="$"+hv.toFixed(2); document.getElementById("holdCount").textContent=holdings.length;
}

const q=query(collection(db,"stocks"),orderBy("symbol"));
onSnapshot(q, snap=>{ allStocks=snap.docs.map(d=>({id:d.id,...d.data()})); if(allStocks.length===0) allStocks=ALL_ASSETS.map(a=>({id:a.symbol.toLowerCase(),...a})); render(); });

function render(){
  let list=[...allStocks];
  const s=document.getElementById("search").value.toLowerCase();
  if(s) list=list.filter(x=>x.symbol.toLowerCase().includes(s)||x.name.toLowerCase().includes(s));
  if(filter==="crypto") list=list.filter(x=>x.type==="crypto");
  if(filter==="stock") list=list.filter(x=>x.type==="stock");
  if(filter==="my") list=list.filter(x=>holdings.some(h=>h.symbol===x.symbol));
  if(filter==="gainers") list=[...list].sort((a,b)=>b.change-a.change).slice(0,20);
  if(filter==="losers") list=[...list].sort((a,b)=>a.change-b.change).slice(0,20);
  document.getElementById("tbody").innerHTML=list.map((a,i)=>{ const my=holdings.find(h=>h.symbol===a.symbol); const up=a.change>=0; return `<tr><td>${i+1}</td><td><div style="display:flex;gap:8px;align-items:center"><div class="icon">${a.symbol[0]}</div><div><b>${a.symbol}</b><br><small style="color:#8aa0bd">${a.name}</small></div></div></td><td><span class="badge ${a.type==="crypto"?"badge-crypto":"badge-stock"}">${a.type}</span></td><td class="${up?'up':'down'}" style="font-weight:700">$${Number(a.price).toLocaleString()}</td><td class="${up?'up':'down'}">${up?'▲':'▼'} ${a.change}%</td><td>${my?`${my.quantity} ($${(my.quantity*a.price).toFixed(2)})`:'0'}</td><td><button class="btn btn-sm btn-primary" onclick="window.openTrade('${a.symbol}')">Trade</button></td></tr>`; }).join("");
  document.getElementById("mobileList").innerHTML=list.map(a=>{ const my=holdings.find(h=>h.symbol===a.symbol); const up=a.change>=0; return `<div class="m-item"><div><b>${a.symbol}</b> <span class="badge ${a.type==="crypto"?"badge-crypto":"badge-stock"}">${a.type}</span><br><small style="color:#8aa0bd">${a.name}</small>${my?`<br><small>${my.quantity} owned • $${(my.quantity*a.price).toFixed(2)}</small>`:''}</div><div style="text-align:right"><b class="${up?'up':'down'}">$${Number(a.price).toLocaleString()}</b><br><small class="${up?'up':'down'}">${a.change}%</small><br><button class="btn btn-sm btn-primary" style="margin-top:6px" onclick="window.openTrade('${a.symbol}')">Trade</button></div></div>`; }).join("");
  renderBalances();
}

document.querySelectorAll(".tab").forEach(t=>{ t.onclick=()=>{ document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active")); t.classList.add("active"); filter=t.dataset.filter; render(); }});
document.getElementById("search").oninput=render;

// Move Main → Stocks (removes from main, adds to stocks + deposited)
document.getElementById("moveBtn").onclick=()=>document.getElementById("moveModal").classList.add("show");
document.getElementById("cancelMove").onclick=()=>document.getElementById("moveModal").classList.remove("show");
document.getElementById("confirmMove").onclick=async()=>{
  if(!currentUser) return alert("Login first");
  const amt=parseFloat(document.getElementById("moveAmount").value);
  if(!amt||amt<=0) return alert("Enter amount");
  if((balances.mainBalance||0) < amt) return alert("Not enough Main Balance");
  await setDoc(doc(db,"userBalances",currentUser.uid),{mainBalance:(balances.mainBalance||0)-amt,stockBalance:(balances.stockBalance||0)+amt,depositedBalance:(balances.depositedBalance||0)+amt,uid:currentUser.uid,updatedAt:Date.now()},{merge:true});
  document.getElementById("moveModal").classList.remove("show"); document.getElementById("moveAmount").value="";
};

// Trade - Buy/Sell
window.openTrade=(symbol)=>{ const a=allStocks.find(x=>x.symbol===symbol); document.getElementById("tradeTitle").textContent="Trade "+a.symbol+" - $"+a.price; document.getElementById("tradeSymbol").value=a.symbol; document.getElementById("tradeModal").dataset.symbol=symbol; document.getElementById("tradeModal").classList.add("show"); };
document.getElementById("closeTrade").onclick=()=>document.getElementById("tradeModal").classList.remove("show");

document.getElementById("buyBtn").onclick=async()=>{
  if(!currentUser) return alert("Login");
  const symbol=document.getElementById("tradeSymbol").value; const qty=parseFloat(document.getElementById("tradeQty").value);
  if(!qty) return alert("Enter qty");
  const stock=allStocks.find(s=>s.symbol===symbol); const cost=qty*stock.price;
  if((balances.stockBalance||0) < cost) return alert("Not enough Stocks Balance");
  const holdingId=currentUser.uid+"_"+symbol.toLowerCase(); const ref=doc(db,"portfolios",holdingId); const snap=await getDoc(ref);
  if(snap.exists()){ const d=snap.data(); const newQty=d.quantity+qty; const newAvg=((d.avgPrice*d.quantity)+(stock.price*qty))/newQty; await setDoc(ref,{uid:currentUser.uid,symbol,quantity:newQty,avgPrice:newAvg,currentPrice:stock.price,updatedAt:Date.now()},{merge:true}); }
  else { await setDoc(ref,{uid:currentUser.uid,symbol,quantity:qty,avgPrice:stock.price,currentPrice:stock.price,createdAt:Date.now()}); }
  await setDoc(doc(db,"userBalances",currentUser.uid),{stockBalance:(balances.stockBalance||0)-cost,uid:currentUser.uid},{merge:true});
  document.getElementById("tradeModal").classList.remove("show");
};

document.getElementById("sellBtn").onclick=async()=>{
  if(!currentUser) return alert("Login");
  const symbol=document.getElementById("tradeModal").dataset.symbol; const qty=parseFloat(document.getElementById("tradeQty").value); const pass=document.getElementById("tradePass").value;
  if(!qty||!pass) return alert("Enter qty and password");
  if(pass !== (balances.tradePassword||"1234")) return alert("Wrong trading password! Default 1234");
  const stock=allStocks.find(s=>s.symbol===symbol); const holdingId=currentUser.uid+"_"+symbol.toLowerCase(); const ref=doc(db,"portfolios",holdingId); const snap=await getDoc(ref);
  if(!snap.exists()||snap.data().quantity<qty) return alert("Not enough holdings");
  const proceeds=qty*stock.price; const newQty=snap.data().quantity-qty;
  if(newQty===0) await deleteDoc(ref); else await setDoc(ref,{quantity:newQty,currentPrice:stock.price,updatedAt:Date.now()},{merge:true});
  await setDoc(doc(db,"userBalances",currentUser.uid),{mainBalance:(balances.mainBalance||0)+proceeds,uid:currentUser.uid},{merge:true});
  document.getElementById("tradeModal").classList.remove("show"); document.getElementById("tradeQty").value=""; document.getElementById("tradePass").value="";
  alert("Sold $"+proceeds.toFixed(2)+" added to Main Balance!");
};

// Admin edit price + seed
document.getElementById("adminEditBtn").onclick=async()=>{
  if(!isAdmin) return; const symbol=document.getElementById("tradeSymbol").value; const newPrice=parseFloat(prompt("Enter new price for "+symbol+":"));
  if(!newPrice) return; await setDoc(doc(db,"stocks",symbol.toLowerCase()),{price:newPrice,updatedAt:Date.now()},{merge:true}); alert("Price updated!");
};
document.getElementById("seedBtn").onclick=async()=>{
  if(!isAdmin) return; for(let a of ALL_ASSETS){ await setDoc(doc(db,"stocks",a.symbol.toLowerCase()),{...a,updatedAt:Date.now()},{merge:true}); } alert("Seeded 40 assets!");
};
document.getElementById("fetchLiveBtn").onclick=async()=>{
  if(!isAdmin) return alert("Admin only"); 
  const res=await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false");
  const data=await res.json();
  for(let c of data){ await setDoc(doc(db,"stocks",c.symbol.toLowerCase()),{symbol:c.symbol.toUpperCase(),name:c.name,type:"crypto",price:c.current_price,change:+(c.price_change_percentage_24h?.toFixed(2)||0),cap:"$"+(c.market_cap/1e9).toFixed(2)+"B",updatedAt:Date.now()},{merge:true}); }
  alert("Fetched 250+ live crypto!");
};