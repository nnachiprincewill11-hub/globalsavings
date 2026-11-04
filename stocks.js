import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const ALL_ASSETS = [
  {symbol:"BTC",name:"Bitcoin",type:"crypto",price:68420,change:2.31,cap:"$1.35T"},
  {symbol:"ETH",name:"Ethereum",type:"crypto",price:2540,change:-0.84,cap:"$305B"},
  {symbol:"USDT",name:"Tether",type:"crypto",price:1,change:0.01,cap:"$119B"},
  {symbol:"BNB",name:"BNB",type:"crypto",price:605,change:1.2,cap:"$88B"},
  {symbol:"SOL",name:"Solana",type:"crypto",price:178,change:5.4,cap:"$84B"},
  {symbol:"XRP",name:"XRP",type:"crypto",price:0.58,change:-1.2,cap:"$32B"},
  {symbol:"DOGE",name:"Dogecoin",type:"crypto",price:0.14,change:3.1,cap:"$20B"},
  {symbol:"ADA",name:"Cardano",type:"crypto",price:0.45,change:-2.1,cap:"$16B"},
  {symbol:"AVAX",name:"Avalanche",type:"crypto",price:28,change:4.2,cap:"$11B"},
  {symbol:"SHIB",name:"Shiba Inu",type:"crypto",price:0.000025,change:6.5,cap:"$14B"},
  {symbol:"LINK",name:"Chainlink",type:"crypto",price:14.2,change:2.8,cap:"$8.4B"},
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

function checkAdmin(u){ return u && (ADMIN_EMAILS.includes(u.email) || u.email.includes("admin")); }

onAuthStateChanged(auth, async user=>{
  currentUser=user;
  isAdmin=checkAdmin(user);
  document.getElementById("seedBtn")?.classList.toggle("hidden",!isAdmin);
  document.getElementById("adminEditBtn")?.classList.toggle("hidden",!isAdmin);
  document.getElementById("loginBtn")?.classList.toggle("hidden",!!user);
  document.getElementById("logoutBtn")?.classList.toggle("hidden",!user);
  document.getElementById("userEmail").textContent=user?user.email:"Not logged in";
  
  if(user){
    // 🆕 ONLINE TRACKING
    try{
      await setDoc(doc(db,"users",user.uid),{lastActive:serverTimestamp(),lastLogin:serverTimestamp(),email:user.email},{merge:true});
      setInterval(async()=>{ try{ await setDoc(doc(db,"users",user.uid),{lastActive:serverTimestamp()},{merge:true}); }catch(e){} }, 120000);
    }catch(e){}

    try{
      const balRef=doc(db,"userBalances",user.uid);
      const balSnap=await getDoc(balRef);
      if(!balSnap.exists()){
        await setDoc(balRef,{uid:user.uid,mainBalance:0,stockBalance:0,depositedBalance:0,gain:0,tradePassword:"1234",createdAt:serverTimestamp()},{merge:true});
      }
    }catch(e){}

    onSnapshot(doc(db,"users",user.uid), snap=>{
      if(snap.exists()){
        const d=snap.data();
        const userMain = d.balance ?? d.mainBalance ?? 0;
        if(userMain) balances.mainBalance = userMain;
        renderBalances();
      }
    });
    onSnapshot(doc(db,"userBalances",user.uid), snap=>{
      if(snap.exists()){ balances={...balances,...snap.data()}; }
      renderBalances();
    });
    onSnapshot(query(collection(db,"portfolios")), snap=>{
      holdings=snap.docs.filter(d=>d.data().uid===user.uid).map(d=>({id:d.id,...d.data()}));
      render(); renderBalances(); renderHoldingsList();
    });
  } else {
    holdings=[]; balances={mainBalance:0,stockBalance:0,depositedBalance:0,gain:0,tradePassword:"1234"};
    renderBalances(); render(); renderHoldingsList();
  }
});

document.getElementById("loginBtn").onclick=async()=>{
  const email=prompt("Email:"); const pass=prompt("Password:");
  if(!email||!pass) return;
  try{ await signInWithEmailAndPassword(auth,email,pass);}catch(e){alert(e.message);}
};
document.getElementById("logoutBtn").onclick=()=>signOut(auth);

function renderBalances(){
  document.getElementById("mainBal").textContent="$"+(balances.mainBalance||0).toLocaleString();
  document.getElementById("stockBal").textContent="$"+(balances.stockBalance||0).toLocaleString();
  document.getElementById("depBal").textContent="$"+(balances.depositedBalance||0).toLocaleString();
  const g=balances.gain||0;
  const el=document.getElementById("gainBal");
  el.textContent=(g>=0?"+ $":"- $")+Math.abs(g).toLocaleString(undefined,{minimumFractionDigits:2});
  el.className=g>=0?"up":"down";
  let hv=0;
  holdings.forEach(h=>{
    const live=allStocks.find(a=>a.symbol===h.symbol)?.price||h.avgPrice||0;
    hv+=live*h.quantity;
  });
  document.getElementById("holdVal").textContent="$"+hv.toFixed(2);
  document.getElementById("holdCount").textContent=holdings.length;
}

function renderHoldingsList(){
  const el=document.getElementById("myHoldingsList");
  if(!el) return;
  if(holdings.length===0){ el.innerHTML="<div style='padding:12px;color:#8aa0c2'>No stocks yet. Buy from market.</div>"; return; }
  let html="";
  holdings.forEach(h=>{
    const live=allStocks.find(a=>a.symbol===h.symbol);
    const livePrice=live?.price||h.avgPrice||0;
    const total=livePrice*h.quantity;
    const cost=h.avgPrice*h.quantity;
    const profit=total-cost;
    const profitPct=cost?((profit/cost)*100).toFixed(2):0;
    const up=profit>=0;
    html+=`<div style="background:#0f1e38;padding:12px;border-radius:10px;margin:8px 0;border:1px solid #1e3a5f;display:flex;justify-content:space-between;align-items:center">
      <div style="display:flex;gap:10px;align-items:center"><div style="width:36px;height:36px;background:#1e293b;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:bold">${h.symbol[0]}</div><div><b>${h.symbol}</b> <small>${h.quantity} shares @ $${h.avgPrice}</small><br><small>Now $${livePrice} = $${total.toFixed(2)}</small> <span style="color:${up?'#22c55e':'#ef4444'};font-weight:bold">${up?'▲':'▼'} ${profitPct}% ($${profit.toFixed(2)})</span></div></div>
      <button class="btn btn-sm" style="background:#ef4444;color:white" onclick="sellHolding('${h.symbol}',${h.quantity})">Sell</button>
    </div>`;
  });
  el.innerHTML=html;
}

const q=query(collection(db,"stocks"),orderBy("symbol"));
onSnapshot(q, snap=>{
  allStocks=snap.docs.map(d=>({id:d.id,...d.data()}));
  if(allStocks.length===0) allStocks=ALL_ASSETS.map(a=>({id:a.symbol.toLowerCase(),...a}));
  render();
});

function render(){
  let list=[...allStocks];
  const s=document.getElementById("search")?.value.toLowerCase()||"";
  if(s) list=list.filter(x=>x.symbol.toLowerCase().includes(s)||x.name.toLowerCase().includes(s));
  if(filter==="crypto") list=list.filter(x=>x.type==="crypto");
  if(filter==="stock") list=list.filter(x=>x.type==="stock");
  if(filter==="my") list=list.filter(x=>holdings.some(h=>h.symbol===x.symbol));
  if(filter==="gainers") list=[...list].sort((a,b)=>b.change-a.change).slice(0,20);
  if(filter==="losers") list=[...list].sort((a,b)=>a.change-b.change).slice(0,20);

  document.getElementById("tbody").innerHTML=list.map((a,i)=>{
    const my=holdings.find(h=>h.symbol===a.symbol);
    const up=a.change>=0;
    return `<tr><td>${i+1}</td><td><div style="display:flex;gap:10px;align-items:center"><div class="icon">${a.symbol[0]}</div><div><b>${a.symbol}</b><br><small>${a.name}</small></div></div></td><td><span class="badge ${a.type==="crypto"?"badge-crypto":"badge-stock"}">${a.type}</span></td><td class="${up?'up':'down'}" style="font-weight:700">$${Number(a.price).toLocaleString()}</td><td class="${up?'up':'down'}">${up?'▲':'▼'} ${a.change}%</td><td>${my?`${my.quantity} ($${(my.quantity*a.price).toFixed(2)})`:'0'}</td><td><button class="btn btn-sm btn-primary" onclick="window.openTrade('${a.symbol}')">Trade</button></td></tr>`;
  }).join("");
}

document.querySelectorAll("[data-filter]").forEach(el=>{
  el.onclick=()=>{ filter=el.dataset.filter; document.querySelectorAll("[data-filter]").forEach(t=>t.classList.remove("active")); el.classList.add("active"); render(); };
});
document.getElementById("search").oninput=()=>render();

// Move money Main -> Stocks
document.getElementById("moveBtn").onclick=()=>{
  if(!currentUser) return alert("Login first");
  document.getElementById("moveModal").classList.add("show");
};
document.getElementById("closeMove").onclick=()=>document.getElementById("moveModal").classList.remove("show");
document.getElementById("confirmMove").onclick=async()=>{
  const amt=parseFloat(document.getElementById("moveAmount").value||0);
  if(!amt) return alert("Enter amount");
  if((balances.mainBalance||0) < amt) return alert("Not enough Main Balance");
  await setDoc(doc(db,"userBalances",currentUser.uid),{
    mainBalance:(balances.mainBalance||0)-amt,
    stockBalance:(balances.stockBalance||0)+amt,
    depositedBalance:(balances.depositedBalance||0)+amt,
    uid:currentUser.uid, updatedAt:serverTimestamp()
  },{merge:true});
  try{ await setDoc(doc(db,"users",currentUser.uid),{balance:(balances.mainBalance||0)-amt},{merge:true}); }catch(e){}
  document.getElementById("moveModal").classList.remove("show");
  document.getElementById("moveAmount").value="";
  alert("$"+amt+" moved to Stocks Balance!");
};

window.openTrade=(symbol)=>{
  const a=allStocks.find(x=>x.symbol===symbol);
  if(!a) return;
  document.getElementById("tradeTitle").textContent="Buy "+a.symbol+" - $"+a.price;
  document.getElementById("tradeSymbol").value=a.symbol;
  document.getElementById("tradeModal").dataset.symbol=symbol;
  document.getElementById("tradeModal").classList.add("show");
};
document.getElementById("closeTrade").onclick=()=>document.getElementById("tradeModal").classList.remove("show");

document.getElementById("buyBtn").onclick=async()=>{
  if(!currentUser) return alert("Login");
  const symbol=document.getElementById("tradeSymbol").value;
  const qty=parseFloat(document.getElementById("tradeQty").value||0);
  if(!qty) return alert("Enter qty");
  const stock=allStocks.find(s=>s.symbol===symbol);
  const cost=qty*stock.price;
  if((balances.stockBalance||0) < cost) return alert("Not enough Stocks Balance. Move money from Main to Stocks first.");
  const holdingId=currentUser.uid+"_"+symbol.toLowerCase();
  const ref=doc(db,"portfolios",holdingId);
  const snap=await getDoc(ref);
  if(snap.exists()){
    const d=snap.data(); const newQty=d.quantity+qty; const newAvg=((d.avgPrice*d.quantity)+(stock.price*qty))/newQty;
    await setDoc(ref,{uid:currentUser.uid,symbol,name:stock.name,type:stock.type,quantity:newQty,avgPrice:newAvg,currentPrice:stock.price,updatedAt:serverTimestamp()},{merge:true});
  } else {
    await setDoc(ref,{uid:currentUser.uid,symbol,name:stock.name,type:stock.type,quantity:qty,avgPrice:stock.price,currentPrice:stock.price,createdAt:serverTimestamp()},{merge:true});
  }
  await setDoc(doc(db,"userBalances",currentUser.uid),{stockBalance:(balances.stockBalance||0)-cost,uid:currentUser.uid,updatedAt:serverTimestamp()},{merge:true});
  document.getElementById("tradeModal").classList.remove("show");
  document.getElementById("tradeQty").value="";
  alert("Bought "+qty+" "+symbol+" for $"+cost.toFixed(2));
};

// 🆕 SELL WITH TRADE PASSWORD
window.sellHolding=async(symbol, maxQty)=>{
  if(!currentUser) return alert("Login");
  const holding=holdings.find(h=>h.symbol===symbol);
  if(!holding) return alert("No holding");
  const qty=parseFloat(prompt(`Sell how many ${symbol}? You have ${holding.quantity}:`, holding.quantity));
  if(!qty || qty>holding.quantity) return alert("Invalid qty");
  const pass=prompt("Enter your Trade Password (default 1234):");
  if(!pass) return;
  const correctPass=balances.tradePassword||"1234";
  if(pass!==correctPass) return alert("Wrong trade password! Ask admin. Default is 1234");
  
  const live=allStocks.find(a=>a.symbol===symbol)?.price||holding.avgPrice;
  const proceeds=qty*live;
  const profit= (live - holding.avgPrice) * qty;
  
  const holdingId=currentUser.uid+"_"+symbol.toLowerCase();
  const ref=doc(db,"portfolios",holdingId);
  if(qty>=holding.quantity){ await deleteDoc(ref); } 
  else { await setDoc(ref,{quantity:holding.quantity-qty,updatedAt:serverTimestamp()},{merge:true}); }
  
  await setDoc(doc(db,"userBalances",currentUser.uid),{
    mainBalance:(balances.mainBalance||0)+proceeds,
    gain:(balances.gain||0)+profit,
    uid:currentUser.uid, updatedAt:serverTimestamp()
  },{merge:true});
  try{ await setDoc(doc(db,"users",currentUser.uid),{balance:(balances.mainBalance||0)+proceeds},{merge:true}); }catch(e){}
  alert("Sold "+qty+" "+symbol+" for $"+proceeds.toFixed(2)+" added to Main Balance! Profit: $"+profit.toFixed(2));
};

document.getElementById("adminEditBtn").onclick=async()=>{
  if(!isAdmin) return;
  const symbol=document.getElementById("tradeSymbol").value;
  const newPrice=parseFloat(prompt("Enter new price for "+symbol+":"));
  if(!newPrice) return;
  await setDoc(doc(db,"stocks",symbol.toLowerCase()),{price:newPrice,updatedAt:serverTimestamp()},{merge:true});
  alert("Price updated! Holdings value moves live!");
};
document.getElementById("seedBtn").onclick=async()=>{
  if(!isAdmin) return;
  for(let a of ALL_ASSETS){ await setDoc(doc(db,"stocks",a.symbol.toLowerCase()),{...a,updatedAt:serverTimestamp()},{merge:true}); }
  alert("Seeded 24 assets - admin can edit all!");
};
document.getElementById("buyStockBtn").onclick=()=>{ document.getElementById("tradeSymbol").value=""; document.getElementById("tradeModal").classList.add("show"); };
document.getElementById("myHoldBtn").onclick=()=>{ filter="my"; document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active")); document.querySelector('[data-filter="my"]').classList.add("active"); render(); };