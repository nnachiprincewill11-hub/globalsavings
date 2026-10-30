import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp, updateDoc, query, where, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
const firebaseConfig={apiKey:"AIzaSyCmRE7PK3ve9DjBGIOCcOuq_5WyfUrwM50",authDomain:"global-savings.firebaseapp.com",projectId:"global-savings",storageBucket:"global-savings.firebasestorage.app",messagingSenderId:"83435054105",appId:"1:83435054105:web:efac6cbd5a264a6892b688"};
const app=initializeApp(firebaseConfig);const auth=getAuth(app);const db=getFirestore(app);
let user=null,userData=null,price=68420,coin="BTC",type=null,profit=83.7,activeId=null,activeData=null,endTime=null,timer=null,liveTimer=null;
let candles=[];let liveCandles=[];let entry=0;let unsubscribes={};
const assets=[
{sym:"BTC",name:"BTC/USD",price:68420,color:"#f7931a",logo:"₿",profit:83.7},
{sym:"ETH",name:"ETH/USD",price:3210,color:"#627eea",logo:"Ξ",profit:87.1},
{sym:"SOL",name:"SOL/USD",price:178,color:"#9945ff",logo:"S",profit:95.1},
{sym:"BNB",name:"BNB/USD",price:612,color:"#f3ba2f",logo:"B",profit:81.3},
{sym:"XRP",name:"XRP/USD",price:0.62,color:"#23292f",logo:"X",profit:98.7},
{sym:"ADA",name:"ADA/USD",price:0.45,color:"#0d47a1",logo:"A",profit:75.2},
{sym:"DOGE",name:"DOGE/USD",price:0.15,color:"#c2a633",logo:"D",profit:85.4},
{sym:"AVAX",name:"AVAX/USD",price:35,color:"#e84142",logo:"AV",profit:78.5},
{sym:"LINK",name:"LINK/USD",price:18,color:"#2a5bd7",logo:"L",profit:93.5},
{sym:"EURUSD",name:"EUR/USD",price:1.1151,color:"#1e40af",logo:"€",profit:89.7},
{sym:"GBPUSD",name:"GBP/USD",price:1.3051,color:"#7c3aed",logo:"£",profit:91.2},
];
let filtered=[...assets];
function renderList(){const o=document.getElementById("options");o.innerHTML="";filtered.sort((a,b)=>a.sym.localeCompare(b.sym)).forEach(a=>{o.innerHTML+=`<div class="assetItem" onclick="selectAsset('${a.sym}')"><div class="logo" style="background:${a.color}">${a.logo}</div><b>${a.sym}</b> $${a.price} <span style="margin-left:auto;background:#22c55e;color:#fff;padding:3px 8px;border-radius:20px;font-size:11px">+${a.profit}%</span></div>`});}
window.toggleList=()=>document.getElementById("assetList").classList.toggle("show");
window.filterList=()=>{const q=document.getElementById("search").value.toUpperCase();filtered=assets.filter(a=>a.sym.includes(q));renderList();}
window.selectAsset=(s)=>{const a=assets.find(x=>x.sym===s);coin=a.sym;price=a.price;profit=a.profit;document.getElementById("btnTxt").textContent=a.logo+" "+a.name+" +"+a.profit+"%";document.getElementById("assetList").classList.remove("show");calc();makeCandles();drawMain();};
window.calc=()=>{const am=Number(document.getElementById("amt").value||0);const pa=am*profit/100;document.getElementById("profitAmt").textContent="+$"+pa.toFixed(2);document.getElementById("willGet").textContent="$"+(am+pa).toFixed(2);document.getElementById("tp").value=pa.toFixed(2);document.getElementById("selProfit").textContent="+"+profit+"%";};
function makeCandles(){candles=[];let p=price;for(let i=0;i<60;i++){const open=p;const change=(Math.random()-0.48)*p*0.02;let close=open+change;const high=Math.max(open,close)+Math.random()*p*0.01;const low=Math.min(open,close)-Math.random()*p*0.01;p=close;if(p<1)p=1+Math.random()*2;candles.push({open,high,low,close});}}
function drawMain(){
const c=document.getElementById("chart");const ctx=c.getContext("2d");c.width=c.offsetWidth;c.height=320;const W=c.width,H=c.height;ctx.clearRect(0,0,W,H);ctx.fillStyle="#fff";ctx.fillRect(0,0,W,H);
let min=Math.min(...candles.map(x=>x.low));let max=Math.max(...candles.map(x=>x.high));let range=max-min||1;
const candleW=W/candles.length*0.7;
candles.forEach((cd,i)=>{
const x=i*W/candles.length+2;
const oY=H-((cd.open-min)/range)*H*0.8-H*0.1;
const cY=H-((cd.close-min)/range)*H*0.8-H*0.1;
const hY=H-((cd.high-min)/range)*H*0.8-H*0.1;
const lY=H-((cd.low-min)/range)*H*0.8-H*0.1;
ctx.strokeStyle=cd.close>=cd.open?"#22c55e":"#ef4444";ctx.lineWidth=1.2;
ctx.beginPath();ctx.moveTo(x+candleW/2,hY);ctx.lineTo(x+candleW/2,lY);ctx.stroke();
ctx.fillStyle=cd.close>=cd.open?"#22c55e":"#ef4444";
ctx.fillRect(x,Math.min(oY,cY),candleW,Math.abs(cY-oY)||2);
});
}
function animateMain(){
let last=candles[candles.length-1];let ch=(Math.random()-0.48)*last.close*0.02;if(Math.random()<0.06)ch=-last.close*0.6+Math.random()*3;
let newClose=last.close+ch;if(newClose<0.5)newClose=0.5+Math.random();const open=last.close;const high=Math.max(open,newClose)+Math.random()*newClose*0.01;const low=Math.min(open,newClose)-Math.random()*newClose*0.01;
candles.shift();candles.push({open,high,low,close:newClose});price=newClose;document.getElementById("priceText").innerHTML="$"+newClose.toFixed(2)+" <span style='color:"+(ch>=0?"#22c55e":"#ef4444")+"'>"+(ch>=0?"↗":"↘")+" "+(Math.abs(ch/newClose*100)).toFixed(2)+"%</span>";drawMain();
}
function makeLive(){liveCandles=[];let p=entry;for(let i=0;i<50;i++){const o=p;const ch=(Math.random()-0.5)*p*0.015;let cl=o+ch;const hi=Math.max(o,cl)+Math.random()*p*0.01;const lo=Math.min(o,cl)-Math.random()*p*0.01;p=cl;liveCandles.push({open:o,high:hi,low:lo,close:cl});}}
function drawLive(){
const c=document.getElementById("liveChart");if(!c)return;const ctx=c.getContext("2d");c.width=c.offsetWidth;c.height=300;const W=c.width,H=c.height;ctx.clearRect(0,0,W,H);ctx.fillStyle="#fff";ctx.fillRect(0,0,W,H);
let min=Math.min(...liveCandles.map(x=>x.low),entry);let max=Math.max(...liveCandles.map(x=>x.high),entry);let range=max-min||1;
const cw=W/liveCandles.length*0.7;
liveCandles.forEach((cd,i)=>{
const x=i*W/liveCandles.length+2;
const oY=H-((cd.open-min)/range)*H*0.8-H*0.1;
const cY=H-((cd.close-min)/range)*H*0.8-H*0.1;
const hY=H-((cd.high-min)/range)*H*0.8-H*0.1;
const lY=H-((cd.low-min)/range)*H*0.8-H*0.1;
ctx.strokeStyle=cd.close>=cd.open?"#22c55e":"#ef4444";ctx.lineWidth=1;
ctx.beginPath();ctx.moveTo(x+cw/2,hY);ctx.lineTo(x+cw/2,lY);ctx.stroke();
ctx.fillStyle=cd.close>=cd.open?"#22c55e":"#ef4444";ctx.fillRect(x,Math.min(oY,cY),cw,Math.abs(cY-oY)||2);
});
const eY=H-((entry-min)/range)*H*0.8-H*0.1;ctx.strokeStyle=type==="buy"?"#22c55e":"#ef4444";ctx.lineWidth=3;ctx.setLineDash([8,6]);ctx.beginPath();ctx.moveTo(0,eY);ctx.lineTo(W,eY);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=type==="buy"?"#22c55e":"#ef4444";ctx.fillRect(0,eY-14,W,18);ctx.fillStyle="#fff";ctx.font="bold 11px Arial";ctx.fillText((type==="buy"?"BUY ":"SELL ")+entry.toFixed(2),10,eY);
const last=liveCandles[liveCandles.length-1].close;document.getElementById("nowP").textContent="$"+last.toFixed(2);
const pl=type==="buy"?(last-entry):(entry-last);const amt=Number(activeData?.amount||700);const usd=amt*(pl/entry);document.getElementById("pl").textContent=(usd>=0?"+$":"-$")+Math.abs(usd).toFixed(2);document.getElementById("liveProfit").textContent=(usd>=0?"+$":"-$")+Math.abs(usd).toFixed(2);document.getElementById("liveProfit").style.color=usd>=0?"#22c55e":"#ef4444";
}
function animateLive(){
let last=liveCandles[liveCandles.length-1];let ch=(Math.random()-0.48)*last.close*0.015;if(Math.random()<0.08)ch=-last.close*0.5+Math.random()*2;
let nc=last.close+ch;if(nc<0.5)nc=0.5+Math.random();const o=last.close;const hi=Math.max(o,nc)+Math.random()*nc*0.01;const lo=Math.min(o,nc)-Math.random()*nc*0.01;
liveCandles.shift();liveCandles.push({open:o,high:hi,low:lo,close:nc});drawLive();
}
function renderTicker(){let h="";[...assets,...assets].forEach(a=>{h+=`<span style="margin-right:24px"><b>${a.sym}</b> $${a.price} <span style="color:#a7f3d0">↗ +${a.profit}%</span></span>`;});document.getElementById("ticker").innerHTML=h;}
function renderMovers(){let h="";assets.slice(0,6).forEach(a=>{h+=`<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #e2e8f0;font-size:11px"><span><b>${a.sym}</b> $${a.price}</span><span style="color:#22c55e;font-weight:900">↗ +${a.profit}%</span></div>`;});document.getElementById("movers").innerHTML=h;}
window.closeSuccess=()=>{
 document.getElementById("successPopup").classList.remove("show");
 document.getElementById("liveOverlay").classList.remove("show");
 if(activeId && unsubscribes[activeId]){unsubscribes[activeId]();delete unsubscribes[activeId];}
 activeId=null;activeData=null;
 checkLive();
};
window.closeLost=()=>{
 document.getElementById("lostPopup").classList.remove("show");
 document.getElementById("liveOverlay").classList.remove("show");
 if(activeId && unsubscribes[activeId]){unsubscribes[activeId]();delete unsubscribes[activeId];}
 activeId=null;activeData=null;
 checkLive();
};
function showSuccessPopup(data){
 const amount=Number(data.takeProfitAmount||0)+Number(data.amount||0);
 const edited=data.amount!==activeData?.amount || data.takeProfitAmount!==activeData?.takeProfitAmount ? " (Admin edited amount)" : "";
 document.getElementById("successMsg").textContent=`${data.coin} ${data.type.toUpperCase()} +${data.profitPct||0}%${edited}`;
 document.getElementById("successAmount").textContent=`+$${amount.toFixed(2)}`;
 document.getElementById("successAdminEdit").textContent=`Edited by admin: Stake $${data.amount} | TP $${data.takeProfitAmount}`;
 document.getElementById("successPopup").classList.add("show");
}
function showLostPopup(data){
 document.getElementById("lostMsg").textContent=`${data.coin} ${data.type.toUpperCase()} - Closed by admin`;
 document.getElementById("lostAmount").textContent=`$${Number(data.stopLossAmount||0).toFixed(2)} returned`;
 document.getElementById("lostAdminEdit").textContent=`Admin edited: Stake $${data.amount} | SL $${data.stopLossAmount}`;
 document.getElementById("lostPopup").classList.add("show");
}
async function checkLive(){
try{
const q=query(collection(db,"trades"), where("uid","==",user.uid));
const snap=await getDocs(q);
let actives=[];
snap.forEach(d=>{
 const t=d.data();
 if(t.status==="active"){
  actives.push({id:d.id,data:t});
 }
});
if(actives.length===0){
 document.getElementById("resumeBox").style.display="none";
 return;
}
document.getElementById("resumeBox").style.display="block";
let html="";
actives.sort((a,b)=>{
 const atA=a.data.createdAt?.toDate? a.data.createdAt.toDate().getTime():0;
 const atB=b.data.createdAt?.toDate? b.data.createdAt.toDate().getTime():0;
 return atB-atA;
});
actives.forEach(item=>{
 const t=item.data;
 const created=t.createdAt?.toDate? t.createdAt.toDate():new Date();
 const dur=Number(t.duration||0);
 const end=new Date(created.getTime()+dur*1000);
 const rem=Math.max(0, Math.floor((end-new Date())/1000));
 const m=Math.floor(rem/60);const s=rem%60;
 // Listen live for admin edits for each trade
 if(!unsubscribes[item.id]){
  unsubscribes[item.id]=onSnapshot(doc(db,"trades",item.id), (s)=>{
   const nd=s.data();if(!nd)return;
   if(nd.finalVerdict==="approve"){
    if(activeId===item.id){
     document.getElementById("liveOverlay").classList.remove("show");
    }
    showSuccessPopup(nd);
    if(unsubscribes[item.id]){unsubscribes[item.id]();delete unsubscribes[item.id];}
    setTimeout(checkLive,1000);
   }else if(nd.finalVerdict==="rejected"){
    if(activeId===item.id){
     document.getElementById("liveOverlay").classList.remove("show");
    }
    showLostPopup(nd);
    if(unsubscribes[item.id]){unsubscribes[item.id]();delete unsubscribes[item.id];}
    setTimeout(checkLive,1000);
   }else{
    // Admin edited amount/profit - update display live
    const el=document.getElementById("edit-"+item.id);
    if(el) el.textContent=`Edited: $${nd.amount} | TP $${nd.takeProfitAmount||0} | SL $${nd.stopLossAmount||0}`;
    if(activeId===item.id){
     activeData=nd;
     entry=nd.entryPrice||nd.amount;
     type=nd.type;
     document.getElementById("liveStake").textContent=`Stake $${nd.amount} (Edited)`;
     document.getElementById("adminEditInfo").textContent=`Admin edited live: $${nd.amount} TP $${nd.takeProfitAmount}`;
    }
   }
  });
 }
 html+=`<div class="liveTradeItem activeTrade">
 <div><b>${t.coin} ${t.type.toUpperCase()} $${t.amount}</b><br><small>Entry $${Number(t.entryPrice||0).toFixed(2)} | <span style="color:#155eef">${m}:${String(s).padStart(2,"0")}</span><br><span id="edit-${item.id}" style="font-size:10px;color:#64748b">Stake $${t.amount} | TP $${t.takeProfitAmount||0}</span></small></div>
 <button onclick="viewSpecific('${item.id}')" style="padding:8px 14px;background:#155eef;color:#fff;border:0;border-radius:8px;font-weight:900">VIEW</button>
 </div>`;
});
document.getElementById("liveTradesList").innerHTML=html;
}catch(e){console.log("checkLive error",e);}
}
window.viewSpecific=(id)=>{
 const q=query(collection(db,"trades"), where("uid","==",user.uid));
 getDocs(q).then(snap=>{
  snap.forEach(d=>{
   if(d.id===id){
    const t=d.data();
    activeId=id;activeData=t;entry=t.entryPrice||t.amount;type=t.type;profit=t.profitPct||profit;
    coin=t.coin;
    const created=t.createdAt?.toDate? t.createdAt.toDate():new Date();
    endTime=new Date(created.getTime()+Number(t.duration||0)*1000);
    document.getElementById("liveOverlay").classList.add("show");
    document.getElementById("liveCoin").textContent=t.coin+"/USD LIVE - "+type.toUpperCase()+" (ID "+id.slice(0,6)+")";
    document.getElementById("entryP").textContent="$"+entry.toFixed(2);
    document.getElementById("tradeIdShow").textContent=id.slice(0,8);
    document.getElementById("liveBadge").textContent=type.toUpperCase();
    document.getElementById("liveBadge").style.background=type==="buy"?"#22c55e":"#ef4444";
    document.getElementById("liveStake").textContent=`Stake $${t.amount}`;
    document.getElementById("adminEditInfo").textContent=`Live: Admin edits apply instantly - $${t.amount}`;
    makeLive();drawLive();
    if(timer)clearInterval(timer);if(liveTimer)clearInterval(liveTimer);
    timer=setInterval(async()=>{
     const now=new Date();let rem=Math.floor((endTime-now)/1000);if(rem<0)rem=0;
     document.getElementById("count").textContent=Math.floor(rem/60)+":"+String(rem%60).padStart(2,"0");
     if(rem<=0){
      document.getElementById("count").textContent="00:00";
      clearInterval(timer);
      try{
       const last=liveCandles[liveCandles.length-1]?.close||entry;
       await addDoc(collection(db,"admin_notifications"),{type:"trade_time_reached",tradeId:activeId,uid:user.uid,username:userData.username||"",coin:coin,tradeType:type,entryPrice:entry,closePrice:last,message:`⏰ TIME REACHED ${userData.username} ${coin} ${type} $${t.amount}`,status:"unread",createdAt:serverTimestamp()});
      }catch(e){}
     }
    },1000);
    liveTimer=setInterval(animateLive,600);
   }
  });
 });
};
window.viewLive=()=>{
 if(document.querySelector("[onclick^='viewSpecific']")){
  document.querySelector("[onclick^='viewSpecific']").click();
 }
};
window.closeLive=()=>{document.getElementById("liveOverlay").classList.remove("show"); if(timer)clearInterval(timer); if(liveTimer)clearInterval(liveTimer);};
onAuthStateChanged(auth, async u=>{
if(!u){location.href="login.html";return;}user=u;
try{
const s=await getDoc(doc(db,"users",u.uid));if(!s.exists()){location.href="login.html";return;}userData=s.data();
if(userData.accountStatus==="disabled"||userData.accountStatus==="paused"){alert("ACCOUNT "+userData.accountStatus);location.href="login.html";return;}
document.getElementById("mainBal").textContent="$"+Number(userData.balance||0).toFixed(2);
document.getElementById("bal2").textContent="$"+Number(userData.balance||0).toFixed(2);
document.getElementById("realBal").textContent="REAL $"+Number(userData.balance||0).toFixed(2);
renderList();renderTicker();renderMovers();makeCandles();drawMain();calc();setInterval(animateMain,800);await checkLive();
}catch(e){document.getElementById("msg").textContent="Error: "+e.message;}
});
window.pick=(t)=>{type=t;document.getElementById("sellBtn").style.opacity=t==="sell"?"1":"0.5";document.getElementById("buyBtn").style.opacity=t==="buy"?"1":"0.5";document.getElementById("msg").textContent="Selected "+t.toUpperCase();};
window.activate=async()=>{
const am=Number(document.getElementById("amt").value);const sl=Number(document.getElementById("sl").value||200);const tp=Number(document.getElementById("tp").value||0);const dur=Number(document.getElementById("dur").value);const pr=document.getElementById("pred").value;
if(!am){document.getElementById("msg").textContent="Enter amount";return;}
if(!type){document.getElementById("msg").textContent="Select BUY or SELL";return;}
if(am>Number(userData.balance||0)){document.getElementById("msg").textContent="Insufficient";return;}
document.getElementById("msg").textContent="Processing...";
try{
const nb=Number(userData.balance||0)-am;await updateDoc(doc(db,"users",user.uid),{balance:nb});userData.balance=nb;
const tr=await addDoc(collection(db,"trades"),{uid:user.uid,username:userData.username||"",coin:coin,amount:am,type:type,profitPct:profit,stopLossAmount:sl,takeProfitAmount:tp,duration:dur,prediction:pr,entryPrice:price,status:"active",finalVerdict:"processing",notified:false,createdAt:serverTimestamp()});
await addDoc(collection(db,"transactions"),{uid:user.uid,type:"trade_active",amount:am,description:`Trade Activated ${coin} ${type.toUpperCase()} $${am} - Processing`,status:"pending",tradeId:tr.id,createdAt:serverTimestamp()});
document.getElementById("msg").textContent="Trade Activated - See below";
await checkLive();
const first=document.querySelector("[onclick^='viewSpecific']");if(first) first.click();
}catch(e){document.getElementById("msg").textContent=e.message;}
};