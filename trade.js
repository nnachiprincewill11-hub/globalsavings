import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp, updateDoc, query, where, orderBy, getDocs, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
const firebaseConfig={apiKey:"AIzaSyCmRE7PK3ve9DjBGIOCcOuq_5WyfUrwM50",authDomain:"global-savings.firebaseapp.com",projectId:"global-savings",storageBucket:"global-savings.firebasestorage.app",messagingSenderId:"83435054105",appId:"1:83435054105:web:efac6cbd5a264a6892b688"};
const app=initializeApp(firebaseConfig);const auth=getAuth(app);const db=getFirestore(app);
let user=null,userData=null,currentPrice=68420,currentCoin="BTC",selectedType=null,currentProfit=83.7;
let liveChartData=[],entryPrice=0,activeTradeId=null,countdownTimer=null,liveChartTimer=null;
let activeTradeData=null, tradeEndTime=null, tradeUnsubscribe=null;
const assets=[
 {sym:"ADA",name:"ADA/USD",price:0.45,color:"#0d47a1",logo:"A",profit:75.2,mov:"↗ +2.1%"},
 {sym:"AVAX",name:"AVAX/USD",price:35,color:"#e84142",logo:"AV",profit:78.5,mov:"↗ +3.4%"},
 {sym:"BNB",name:"BNB/USD",price:612,color:"#f3ba2f",logo:"B",profit:81.3,mov:"↗ +1.8%"},
 {sym:"BTC",name:"BTC/USD",price:68420,color:"#f7931a",logo:"₿",profit:83.7,mov:"↗ +2.41%"},
 {sym:"DOGE",name:"DOGE/USD",price:0.15,color:"#c2a633",logo:"D",profit:85.4,mov:"↗ +5.2%"},
 {sym:"ETH",name:"ETH/USD",price:3210,color:"#627eea",logo:"Ξ",profit:87.1,mov:"↗ +2.9%"},
 {sym:"EURUSD",name:"EUR/USD",price:1.1151,color:"#1e40af",logo:"€",profit:89.7,mov:"↗ +0.8%"},
 {sym:"GBPUSD",name:"GBP/USD",price:1.3051,color:"#7c3aed",logo:"£",profit:91.2,mov:"↗ +1.2%"},
 {sym:"LINK",name:"LINK/USD",price:18,color:"#2a5bd7",logo:"L",profit:93.5,mov:"↗ +4.1%"},
 {sym:"SOL",name:"SOL/USD",price:178,color:"#9945ff",logo:"S",profit:95.1,mov:"↗ +6.3%"},
 {sym:"USDCHF",name:"USD/CHF",price:0.9784,color:"#059669",logo:"$",profit:96.8,mov:"↗ +0.5%"},
 {sym:"USDJPY",name:"USD/JPY",price:119.71,color:"#dc2626",logo:"¥",profit:97.9,mov:"↗ +0.9%"},
 {sym:"XRP",name:"XRP/USD",price:0.62,color:"#23292f",logo:"X",profit:98.7,mov:"↗ +7.1%"},
];
let filtered=[...assets];
function renderAssets(){const box=document.getElementById("assetOptions");box.innerHTML="";filtered.sort((a,b)=>a.sym.localeCompare(b.sym));filtered.forEach(a=>{box.innerHTML+=`<div class="assetOpt" onclick="selectAsset('${a.sym}')"><div class="logo" style="background:${a.color}">${a.logo}</div><div><b>${a.sym}</b> /USD <span style="color:#22c55e;font-size:11px">${a.mov} 📈</span><div style="font-size:11px;color:#8aa0c2">$${a.price}</div></div><span class="profitBadge">+${a.profit}%</span></div>`});}
function renderTicker(){const t=document.getElementById("ticker");let h="";[...assets,...assets].forEach(a=>{h+=`<span class="tickerItem"><b>${a.sym}</b> $${a.price} <span style="color:#a7f3d0">${a.mov} 📈</span></span>`;});t.innerHTML=h;}
function renderTopMovers(){const box=document.getElementById("topMovers");let h="";assets.slice(-6).reverse().forEach(a=>{h+=`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:11px"><span><b>${a.sym}</b> $${a.price}</span><span style="color:#22c55e;font-weight:bold">${a.mov} ↗</span></div>`;});box.innerHTML=h;}
window.toggleDrop=()=>document.getElementById("assetDrop").classList.toggle("show");
window.filterAssets=()=>{const q=document.getElementById("assetSearch").value.toUpperCase();filtered=assets.filter(a=>a.sym.includes(q)||a.name.includes(q));renderAssets();};
window.selectAsset=(sym)=>{const a=assets.find(x=>x.sym===sym);currentCoin=a.sym;currentPrice=a.price;currentProfit=a.profit;document.getElementById("assetBtnTxt").textContent=a.logo+" "+a.name+" +"+a.profit+"% 📈";document.getElementById("price").innerHTML="$"+a.price.toLocaleString()+" USD <span style='color:#22c55e'>"+a.mov+"</span>";document.getElementById("profitPctShow").textContent="+"+a.profit+"%";document.getElementById("selectedProfit").textContent="+"+a.profit+"%";document.getElementById("assetDrop").classList.remove("show");calcProfit();initChartData();drawChart();};
window.calcProfit=()=>{const amt=Number(document.getElementById("tradeAmt").value||0);const profitAmt=amt*currentProfit/100;document.getElementById("profitAmt").textContent="+$"+profitAmt.toFixed(2);document.getElementById("willGet").textContent="$"+(amt+profitAmt).toFixed(2);document.getElementById("takeProfit").value=profitAmt.toFixed(2);};
let chartData=[];function initChartData(){chartData=[];let p=currentPrice;for(let i=0;i<100;i++){p+=(Math.random()-0.48)*p*0.015;if(p<0.01)p=0.01+Math.random()*5;chartData.push(p);}}
function drawChart(){const canvas=document.getElementById("chart");const ctx=canvas.getContext("2d");canvas.width=canvas.offsetWidth;canvas.height=220;const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.fillStyle="white";ctx.fillRect(0,0,w,h);ctx.strokeStyle="#e2e8f0";ctx.lineWidth=0.5;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(0,h/5*i);ctx.lineTo(w,h/5*i);ctx.stroke();}ctx.beginPath();ctx.strokeStyle="#155eef";ctx.lineWidth=2.5;const min=Math.min(...chartData),max=Math.max(...chartData);chartData.forEach((v,i)=>{const x=i/(chartData.length-1)*w;const y=h - ((v-min)/(max-min||1))*h*0.8 - h*0.1;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.stroke();ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fillStyle="rgba(21,94,239,0.12)";ctx.fill();}
function animateChart(){let last=chartData[chartData.length-1];let change=(Math.random()-0.45)*last*0.02;if(Math.random()<0.05){change=-last*0.7+Math.random()*5;}last+=change;if(last<0.01)last=0.01+Math.random()*2;chartData.shift();chartData.push(last);currentPrice=last;document.getElementById("price").innerHTML="$"+last.toFixed(2)+" USD <span style='color:"+(change>=0?"#22c55e":"#ef4444")+"'>"+(change>=0?"↗":"↘")+" "+((change/last)*100).toFixed(2)+"%</span>";document.getElementById("lastUpdate").textContent=new Date().toLocaleTimeString();drawChart();}
function initLiveChart(){liveChartData=[];let p=entryPrice;for(let i=0;i<80;i++){p+=(Math.random()-0.5)*p*0.01;if(p<0.01)p=0.5+Math.random()*3;liveChartData.push(p);}}
function drawLiveChart(){
 const canvas=document.getElementById("liveChart");if(!canvas)return;const ctx=canvas.getContext("2d");canvas.width=canvas.offsetWidth;canvas.height=260;const w=canvas.width,h=canvas.height;
 ctx.clearRect(0,0,w,h);ctx.fillStyle="white";ctx.fillRect(0,0,w,h);
 const min=Math.min(...liveChartData,entryPrice),max=Math.max(...liveChartData,entryPrice);
 const entryY=h - ((entryPrice-min)/(max-min||1))*h*0.8 - h*0.1;
 ctx.beginPath();ctx.strokeStyle=selectedType==="buy"?"#22c55e":"#ef4444";ctx.lineWidth=3;ctx.setLineDash([8,6]);ctx.moveTo(0,entryY);ctx.lineTo(w,entryY);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle=selectedType==="buy"?"#22c55e":"#ef4444";ctx.fillRect(0,entryY-14,w,20);ctx.fillStyle="white";ctx.font="bold 12px Arial";ctx.fillText((selectedType==="buy"?"BUY ":"SELL ")+entryPrice.toFixed(2)+" ← ENTRY",10,entryY);
 ctx.beginPath();ctx.strokeStyle="#155eef";ctx.lineWidth=2.5;
 liveChartData.forEach((v,i)=>{const x=i/(liveChartData.length-1)*w;const y=h - ((v-min)/(max-min||1))*h*0.8 - h*0.1;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.stroke();
 const last=liveChartData[liveChartData.length-1];const lastY=h - ((last-min)/(max-min||1))*h*0.8 - h*0.1;
 const dot=document.getElementById("arrowDot");const tri=document.getElementById("arrowTri");
 if(dot){dot.style.left=(w-10)+"px";dot.style.top=lastY+"px";dot.style.background=last>=entryPrice?"#22c55e":"#ef4444";}
 if(tri){tri.style.left=(w-10)+"px";tri.style.top=(lastY+12)+"px";tri.style.borderTopColor=last>=entryPrice?"#22c55e":"#ef4444";}
 document.getElementById("nowPrice").textContent="$"+last.toFixed(2);
 const pl= selectedType==="buy"? (last-entryPrice) : (entryPrice-last);
 const plPct=(pl/entryPrice)*100;const amt=Number(activeTradeData?.amount || document.getElementById("tradeAmt").value || 700);
 const profitUSD= amt * (plPct/100);
 document.getElementById("livePL").textContent=(profitUSD>=0?"+$":"-$")+Math.abs(profitUSD).toFixed(2);
 document.getElementById("profitLiveCenter").textContent=(profitUSD>=0?"+$":"-$")+Math.abs(profitUSD).toFixed(2);
 document.getElementById("profitLiveCenter").style.color=profitUSD>=0?"#22c55e":"#ef4444";
}
function animateLiveChart(){let last=liveChartData[liveChartData.length-1];let change=(Math.random()-0.46)*last*0.018;if(Math.random()<0.07){change=-last*0.6+Math.random()*3;}last+=change;if(last<0.01)last=0.01+Math.random()*2;liveChartData.shift();liveChartData.push(last);drawLiveChart();}
async function checkActiveTrade(){
 try{
  const q=query(collection(db,"trades"), where("uid","==",user.uid), where("status","==","active"), orderBy("createdAt","desc"), limit(1));
  const snap=await getDocs(q);
  if(snap.empty){document.getElementById("resumeLiveBox").style.display="none";return;}
  const d=snap.docs[0];const t=d.data();
  if(t.finalVerdict==="approve" || t.finalVerdict==="rejected"){document.getElementById("resumeLiveBox").style.display="none";return;}
  activeTradeId=d.id;activeTradeData=t;entryPrice=t.entryPrice||t.amount||currentPrice;selectedType=t.type||"buy";
  const createdAt=t.createdAt?.toDate ? t.createdAt.toDate() : new Date();
  const durationSec=Number(t.duration||0);
  const endTime=new Date(createdAt.getTime()+durationSec*1000);
  tradeEndTime=endTime;const now=new Date();let remaining=Math.floor((endTime-now)/1000);
  const box=document.getElementById("resumeLiveBox");box.style.display="block";
  if(remaining>0){
   const m=Math.floor(remaining/60);const s=remaining%60;
   document.getElementById("resumeLiveText").innerHTML=`🔴 LIVE TRADE RUNNING<br>${t.coin} ${t.type.toUpperCase()} $${t.amount} | Ends in ${m}:${String(s).padStart(2,"0")}`;
   document.getElementById("resumeLiveBtn").textContent=`VIEW LIVE TRADE (${m}:${String(s).padStart(2,"0")})`;
  }else{
   document.getElementById("resumeLiveText").innerHTML=`⏳ TRADE TIME REACHED<br>${t.coin} ${t.type.toUpperCase()} $${t.amount} | Waiting admin verification`;
   document.getElementById("resumeLiveBtn").textContent=`VIEW LIVE - WAITING ADMIN`;
  }
  if(tradeUnsubscribe) tradeUnsubscribe();
  tradeUnsubscribe=onSnapshot(doc(db,"trades",activeTradeId), (docSnap)=>{
   const data=docSnap.data();if(!data) return;
   if(data.status==="completed" || data.finalVerdict==="approve" || data.finalVerdict==="rejected"){
    document.getElementById("resumeLiveBox").style.display="none";
    document.getElementById("liveTradeOverlay").classList.remove("show");
    if(countdownTimer) clearInterval(countdownTimer);
    if(liveChartTimer) clearInterval(liveChartTimer);
    alert("✅ Trade finished by admin: "+(data.finalVerdict||data.status));
    location.href="my-trades.html";
   }
  });
 }catch(e){console.log(e);}
}
window.viewLiveTrade=()=>{
 if(!activeTradeData) return;
 currentCoin=activeTradeData.coin||"BTC";entryPrice=activeTradeData.entryPrice||activeTradeData.amount||0;selectedType=activeTradeData.type||"buy";
 document.getElementById("liveTradeOverlay").classList.add("show");
 document.getElementById("liveCoin").textContent=currentCoin+"/USD LIVE - "+selectedType.toUpperCase();
 document.getElementById("entryPrice").textContent="$"+entryPrice.toFixed(2);
 document.getElementById("liveBadge").textContent=selectedType==="buy"?"BUY ↑ GREEN":"SELL ↓ RED";
 document.getElementById("liveBadge").className="buyLineBadge "+(selectedType==="buy"?"buyBadge":"sellBadge");
 document.getElementById("liveStake").textContent="Stake $"+activeTradeData.amount;
 initLiveChart();drawLiveChart();
 if(countdownTimer) clearInterval(countdownTimer);
 if(liveChartTimer) clearInterval(liveChartTimer);
 countdownTimer=setInterval(async()=>{
  const now=new Date();let remaining=Math.floor((tradeEndTime-now)/1000);if(remaining<0) remaining=0;
  document.getElementById("countdown").textContent=Math.floor(remaining/60)+":"+String(remaining%60).padStart(2,"0");
  document.getElementById("resumeLiveBtn").textContent=remaining>0?`VIEW LIVE TRADE (${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,"0")})`:`VIEW LIVE - WAITING ADMIN`;
  if(remaining<=0){
   document.getElementById("liveStatus").textContent="⏰ Time reached - Waiting admin final verdict";
   if(!activeTradeData.notified){
    try{
     const lastPrice=liveChartData[liveChartData.length-1];
     await addDoc(collection(db,"admin_notifications"),{type:"trade_time_reached",tradeId:activeTradeId,uid:user.uid,username:userData.username||"",coin:currentCoin,tradeType:selectedType,entryPrice:entryPrice,closePrice:lastPrice,duration:activeTradeData.duration,message:`⏰ TRADE TIME REACHED - User ${userData.username}`,status:"unread",createdAt:serverTimestamp()});
     activeTradeData.notified=true;await updateDoc(doc(db,"trades",activeTradeId),{notified:true, closePrice:lastPrice});
    }catch(e){}
   }
   clearInterval(countdownTimer);
  }
 },1000);
 liveChartTimer=setInterval(animateLiveChart,600);
};
onAuthStateChanged(auth, async u=>{
 if(!u){location.href="login.html";return;}
 user=u;const s=await getDoc(doc(db,"users",u.uid));if(!s.exists()){location.href="login.html";return;}userData=s.data();
 if(userData.accountStatus==="disabled"||userData.accountStatus==="paused"){alert("ACCOUNT "+userData.accountStatus.toUpperCase());location.href="login.html";return;}
 document.getElementById("mainBal").textContent="$"+Number(userData.balance||0).toFixed(2);
 document.getElementById("balSide").textContent="$"+Number(userData.balance||0).toFixed(2);
 document.getElementById("realBalTop").textContent="REAL $"+Number(userData.balance||0).toFixed(2);
 renderAssets();renderTicker();renderTopMovers();initChartData();drawChart();calcProfit();setInterval(animateChart,700);
 await checkActiveTrade();
});
window.selectType=(type)=>{selectedType=type;document.getElementById("sellBtn").style.opacity=type==="sell"?"1":"0.5";document.getElementById("buyBtn").style.opacity=type==="buy"?"1":"0.5";document.getElementById("msg").textContent="Selected "+type.toUpperCase();};
window.activateTrade=async()=>{
 const amt=Number(document.getElementById("tradeAmt").value);const sl=Number