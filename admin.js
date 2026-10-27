import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, query, orderBy, getDocs, doc, getDoc, updateDoc, deleteDoc, addDoc, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
const firebaseConfig={apiKey:"AIzaSyCmRE7PK3ve9DjBGIOCcOuq_5WyfUrwM50",authDomain:"global-savings.firebaseapp.com",projectId:"global-savings",storageBucket:"global-savings.firebasestorage.app",messagingSenderId:"83435054105",appId:"1:83435054105:web:efac6cbd5a264a6892b688"};
const app=initializeApp(firebaseConfig);const auth=getAuth(app);const db=getFirestore(app);
window.login=async()=>{try{await signInWithEmailAndPassword(auth,document.getElementById("email").value.trim(),document.getElementById("pass").value);}catch(e){document.getElementById("loginMsg").textContent=e.message;}};
window.logout=async()=>{await signOut(auth);location.reload();};
onAuthStateChanged(auth,u=>{
 if(!u)return;
 if(u.email!=="admin@gmail.com" && u.email!=="emmanuelomelu@gmail.com"){document.getElementById("loginMsg").textContent="Only admin@gmail.com allowed";return;}
 document.getElementById("loginBox").style.display="none";document.getElementById("adminBox").style.display="block";loadDeposits();
});
window.showTab=(t)=>{
 document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
 const m={deposits:"tabDep",trades:"tabTrade",users:"tabUsers",transactions:"tabTrans",tierVerifications:"tabTier",admin_notifications:"tabNotif",trade_indicators:"tabInfect"};
 document.getElementById(m[t]).classList.add("active");
 if(t==="deposits")loadDeposits();if(t==="trades")loadTrades();if(t==="users")loadUsers();if(t==="transactions")loadTransactions();if(t==="tierVerifications")loadTier();if(t==="admin_notifications")loadNotif();if(t==="trade_indicators")loadIndicators();
};
async function loadDeposits(){
 document.getElementById("title").textContent="Deposits - Approve = Add Money";
 const snap=await getDocs(query(collection(db,"deposits"),orderBy("createdAt","desc")));
 let html="";snap.forEach(d=>{const v=d.data();html+=`<div class="item"><b>$${v.amount}</b> - ${v.username||""}<br><span style="font-size:11px;color:#8aa0c2">UID:${v.uid}<br>Status:${v.status}<br>${v.createdAt?.toDate?.()?.toLocaleString()||""}</span><div style="margin-top:8px"><button class="btn btnG" onclick="approveDeposit('${d.id}')">APPROVE</button><button class="btn btnR" onclick="rejectDeposit('${d.id}')">REJECT</button><button class="btn btnB" onclick="del('deposits','${d.id}')">Delete</button></div></div>`;});
 document.getElementById("list").innerHTML=html||"No deposits";
}
window.approveDeposit=async(id)=>{
 if(!confirm("Approve deposit?"))return;
 const dep= (await getDoc(doc(db,"deposits",id))).data();
 const uRef=doc(db,"users",dep.uid);const u=(await getDoc(uRef)).data();
 await updateDoc(uRef,{balance:Number(u.balance||0)+Number(dep.amount)});
 await updateDoc(doc(db,"deposits",id),{status:"completed",finalVerdict:"approve",approvedAt:serverTimestamp()});
 await addDoc(collection(db,"transactions"),{uid:dep.uid,type:"deposit_success",amount:dep.amount,description:`DEPOSIT SUCCESSFUL $${dep.amount}`,status:"completed",createdAt:serverTimestamp()});
 alert("Approved");loadDeposits();
};
window.rejectDeposit=async(id)=>{await updateDoc(doc(db,"deposits",id),{status:"rejected",finalVerdict:"rejected"});alert("Rejected");loadDeposits();};
async function loadUsers(){
 document.getElementById("title").textContent="Users - Disable / Pause / Delete Control";
 const snap=await getDocs(collection(db,"users"));
 let html="";snap.forEach(d=>{
  const u=d.data();const status=u.accountStatus||"active";
  let badge=status==="active"?`<span class="statusBadge activeS">ACTIVE</span>`:status==="disabled"?`<span class="statusBadge disabled">DISABLED</span>`:`<span class="statusBadge paused">PAUSED</span>`;
  html+=`<div class="item" onclick="toggleDetail('${d.id}')" style="cursor:pointer"><div style="display:flex;justify-content:space-between"><div><b>${u.fullName||u.username||"No Name"}</b> - @${u.username||""} ${badge}<br><span style="font-size:12px">Balance: $${Number(u.balance||0).toFixed(2)} - ${u.email||""}</span></div><div style="font-size:11px;color:#22c55e">▼ Tap</div></div><div id="det-${d.id}" class="detailBox"><div class="rowD"><b>Email</b><span>${u.email||"-"}</span></div><div class="rowD"><b>Status</b><span>${status}</span></div><div class="rowD"><b>Reason</b><span>${u.statusReason||"-"}</span></div><div style="margin-top:12px;background:#1a1a0a;padding:10px;border-radius:10px;border:1px solid #f59e0b"><b>🔒 ACCOUNT CONTROL</b><div class="editGrid" style="margin-top:8px"><input id="reason-${d.id}" placeholder="Reason..." value="${u.statusReason||""}"><select id="statusSel-${d.id}"><option value="active" ${status==="active"?"selected":""}>ACTIVE</option><option value="paused" ${status==="paused"?"selected":""}>PAUSED</option><option value="disabled" ${status==="disabled"?"selected":""}>DISABLED</option></select></div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button class="btn btnY" onclick="event.stopPropagation();setUserStatus('${d.id}','paused')">⏸ PAUSE</button><button class="btn btnR" onclick="event.stopPropagation();setUserStatus('${d.id}','disabled')">❌ DISABLE</button><button class="btn btnG" onclick="event.stopPropagation();setUserStatus('${d.id}','active')">✅ ENABLE</button><button class="btn btnR" style="background:#7f1d1d" onclick="event.stopPropagation();deleteUserFull('${d.id}')">🗑 DELETE</button></div></div><div style="margin-top:10px" class="editGrid"><input id="bal-${d.id}" type="number" value="${u.balance||0}"><button class="btn btnB" onclick="event.stopPropagation();setBal('${d.id}')">Set Balance</button></div></div></div>`;
 });
 document.getElementById("list").innerHTML=html||"No users";
}
window.toggleDetail=(id)=>{document.getElementById("det-"+id).classList.toggle("show");};
window.setUserStatus=async(uid,status)=>{
 const reason=document.getElementById("reason-"+uid)?.value||prompt("Reason?")||status;
 if(!confirm(status.toUpperCase()+"? Reason: "+reason))return;
 await updateDoc(doc(db,"users",uid),{accountStatus:status,statusReason:reason,disabledAt:serverTimestamp(),disabledBy:"admin@gmail.com"});
 await addDoc(collection(db,"transactions"),{uid:uid,type:"account_"+status,amount:0,description:status.toUpperCase()+" by Admin - "+reason,status:"completed",createdAt:serverTimestamp()});
 alert(status.toUpperCase());loadUsers();
};
window.deleteUserFull=async(uid)=>{
 if(prompt("Type DELETE")!=="DELETE")return;
 if(!confirm("PERMANENT DELETE?"))return;
 await deleteDoc(doc(db,"users",uid));
 alert("Deleted");loadUsers();
};
window.setBal=async(uid)=>{const v=Number(document.getElementById("bal-"+uid).value);await updateDoc(doc(db,"users",uid),{balance:v});alert("Balance $"+v);loadUsers();};
async function loadTrades(){
 document.getElementById("title").textContent="Trades - EDITABLE";
 const snap=await getDocs(query(collection(db,"trades"),orderBy("createdAt","desc")));
 let html="";snap.forEach(d=>{
  const t=d.data();
  html+=`<div class="item"><b>${t.coin||""} - ${t.type||""} - $${t.amount||0}</b> - ${t.status||""}<br><span style="font-size:11px">User: ${t.username||""} UID:${t.uid}<br>ID:${d.id}</span><div style="margin-top:10px;background:#08162e;padding:10px;border-radius:10px"><label>STAKE</label><input id="stake-${d.id}" type="number" value="${t.amount||0}"><div class="editGrid"><div><label>STOP LOSS</label><input id="sl-${d.id}" type="number" value="${t.stopLossAmount||200}"></div><div><label>TAKE PROFIT</label><input id="tp-${d.id}" type="number" value="${t.takeProfitAmount||0}"></div></div><div style="display:flex;gap:6px;margin-top:8px"><button class="btn btnB" onclick="saveTrade('${d.id}')">SAVE</button><button class="btn btnG" onclick="approveTrade('${d.id}')">APPROVE WIN</button><button class="btn btnR" onclick="rejectTrade('${d.id}')">REJECT</button><button class="btn btnGray" onclick="del('trades','${d.id}')">Delete</button></div></div></div>`;
 });
 document.getElementById("list").innerHTML=html||"No trades";
}
window.saveTrade=async(id)=>{const stake=Number(document.getElementById(`stake-${id}`).value);const sl=Number(document.getElementById(`sl-${id}`).value);const tp=Number(document.getElementById(`tp-${id}`).value);await updateDoc(doc(db,"trades",id),{amount:stake,stopLossAmount:sl,takeProfitAmount:tp});alert("Saved");};
window.approveTrade=async(id)=>{if(!confirm("Approve WIN?"))return;const snap=await getDoc(doc(db,"trades",id));const t=snap.data();const total=Number(t.amount)+Number(t.takeProfitAmount||0);const uRef=doc(db,"users",t.uid);const u=(await getDoc(uRef)).data();await updateDoc(uRef,{balance:Number(u.balance||0)+total});await updateDoc(doc(db,"trades",id),{status:"completed",finalVerdict:"approve"});await addDoc(collection(db,"transactions"),{uid:t.uid,type:"trade_success",amount:total,description:`TRADE SUCCESSFUL ${t.coin} +${t.profitPct||0}% - $${total}`,status:"completed",tradeId:id,createdAt:serverTimestamp()});alert(`Approved $${total}`);loadTrades();};
window.rejectTrade=async(id)=>{if(!confirm("Reject? Only SL?"))return;const snap=await getDoc(doc(db,"trades",id));const t=snap.data();const sl=Number(t.stopLossAmount||0);const uRef=doc(db,"users",t.uid);const u=(await getDoc(uRef)).data();await updateDoc(uRef,{balance:Number(u.balance||0)+sl});await updateDoc(doc(db,"trades",id),{status:"completed",finalVerdict:"rejected"});await addDoc(collection(db,"transactions"),{uid:t.uid,type:"trade_loss",amount:sl,description:`TRADE LOSS ${t.coin} - $${sl} returned`,status:"completed",tradeId:id,createdAt:serverTimestamp()});alert("Rejected");loadTrades();};
async function loadTransactions(){document.getElementById("title").textContent="Transactions";const snap=await getDocs(query(collection(db,"transactions"),orderBy("createdAt","desc")));let html="";let c=0;snap.forEach(d=>{if(c++>150)return;const v=d.data();html+=`<div class="item"><b>${v.type||""} $${v.amount||0}</b><br><span style="font-size:11px">${v.description||""}<br>UID:${v.uid}</span><div style="display:flex;gap:6px;margin-top:6px"><button class="btn btnR" onclick="del('transactions','${d.id}')">Delete</button></div></div>`;});document.getElementById("list").innerHTML=html;}
async function loadTier(){document.getElementById("title").textContent="Tier Verifications";const snap=await getDocs(query(collection(db,"tierVerifications"),orderBy("createdAt","desc")));let html="";snap.forEach(d=>{const v=d.data();html+=`<div class="item"><b>Tier ${v.tier} ${v.type}</b><br><span style="font-size:11px">UID:${v.uid} Status:${v.status}</span><div style="margin-top:6px"><button class="btn btnG" onclick="approveTier('${d.id}',${v.tier},'${v.uid}')">Approve</button><button class="btn btnR" onclick="del('tierVerifications','${d.id}')">Delete</button></div></div>`;});document.getElementById("list").innerHTML=html||"No verifications";}
window.approveTier=async(id,tier,uid)=>{await updateDoc(doc(db,"tierVerifications",id),{status:"approved"});if(tier==2)await updateDoc(doc(db,"users",uid),{tier2Verified:true});if(tier==3)await updateDoc(doc(db,"users",uid),{tier3Verified:true});alert("Approved");loadTier();};
async function loadNotif(){
 document.getElementById("title").textContent="🔔 Trade Alerts";
 const snap=await getDocs(query(collection(db,"admin_notifications"),orderBy("createdAt","desc")));
 let html="";snap.forEach(d=>{const v=d.data();html+=`<div class="item" style="border-left:4px solid #f59e0b"><b>⏰ ${v.coin||""} ${v.tradeType||""}</b><br><span style="font-size:11px">${v.message||""}<br>Trade ID: ${v.tradeId||""}<br>${v.createdAt?.toDate?.()?.toLocaleString()||""}</span><div style="margin-top:8px"><button class="btn btnG" onclick="showTab('trades')">Go Verify</button><button class="btn btnR" onclick="del('admin_notifications','${d.id}')">Delete</button></div></div>`;});
 document.getElementById("list").innerHTML=html||"No alerts";
}
async function loadIndicators(){
 document.getElementById("title").textContent="📈 Trade Indicators / Infectors";
 const snap=await getDocs(query(collection(db,"trades"),where("status","==","active"),orderBy("createdAt","desc")));
 let html=`<div style="background:#0f1e38;padding:10px;border-radius:10px;margin-bottom:12px"><b>🔴 SELL = Red Line - BELOW entry = WIN</b><br><b>🟢 BUY = Green Line - ABOVE entry = WIN</b></div>`;
 let count=0;snap.forEach(d=>{if(count++>30)return;const t=d.data();const entry=t.entryPrice||0;html+=`<div class="item" style="border:1px solid ${t.type==="buy"?"#22c55e":"#ef4444"}"><b>${t.coin} ${t.type?.toUpperCase()} - Stake $${t.amount}</b><br><span style="font-size:11px">User: ${t.username||t.uid} - Entry: $${Number(entry).toFixed(2)} - Duration: ${t.duration||""}s</span><div style="margin-top:8px;display:flex;gap:6px"><button class="btn btnG" onclick="approveTrade('${d.id}')">Approve WIN</button><button class="btn btnR" onclick="rejectTrade('${d.id}')">Reject</button></div></div>`;});
 if(count===0)html+="<div class='item'>No active trades</div>";
 document.getElementById("list").innerHTML=html;
}
window.del=async(col,id)=>{if(!confirm("Delete?"))return;await deleteDoc(doc(db,col,id));alert("Deleted");if(col==="deposits")loadDeposits();if(col==="trades")loadTrades();if(col==="users")loadUsers();if(col==="transactions")loadTransactions();if(col==="tierVerifications")loadTier();if(col==="admin_notifications")loadNotif();};