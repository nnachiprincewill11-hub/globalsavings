import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, query, orderBy, getDocs, doc, getDoc, updateDoc, deleteDoc, addDoc, serverTimestamp, where, setDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
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
 const m={deposits:"tabDep",trades:"tabTrade",users:"tabUsers",transactions:"tabTrans",tierVerifications:"tabTier",admin_notifications:"tabNotif",trade_indicators:"tabInfect",online_users:"tabOnline",stocks:"tabStocks",user_balances:"tabBalances"};
 const tabId=m[t];
 if(tabId && document.getElementById(tabId)) document.getElementById(tabId).classList.add("active");
 if(t==="deposits")loadDeposits();
 if(t==="trades")loadTrades();
 if(t==="users")loadUsers();
 if(t==="transactions")loadTransactions();
 if(t==="tierVerifications")loadTier();
 if(t==="admin_notifications")loadNotif();
 if(t==="trade_indicators")loadIndicators();
 if(t==="online_users")loadOnlineUsers();
 if(t==="stocks")loadStocksMarket();
 if(t==="user_balances")loadUserBalances();
};
async function loadDeposits(){
 document.getElementById("title").textContent="Deposits - Approve = Add Money";
 const snap=await getDocs(query(collection(db,"deposits"),orderBy("createdAt","desc")));
 let html="";snap.forEach(d=>{const v=d.data();html+=`<div class="item"><b>$${v.amount}</b> - ${v.username||""}<br><span style="font-size:11px">UID:${v.uid} Status:${v.status}</span><div style="margin-top:8px"><button class="btn btnG" onclick="approveDeposit('${d.id}')">APPROVE</button><button class="btn btnR" onclick="rejectDeposit('${d.id}')">REJECT</button><button class="btn btnB" onclick="del('deposits','${d.id}')">Delete</button></div></div>`;});
 document.getElementById("list").innerHTML=html||"No deposits";
}
window.approveDeposit=async(id)=>{
 const dep= (await getDoc(doc(db,"deposits",id))).data();
 const uRef=doc(db,"users",dep.uid);const u=(await getDoc(uRef)).data();
 await updateDoc(uRef,{balance:Number(u.balance||0)+Number(dep.amount)});
 await updateDoc(doc(db,"deposits",id),{status:"completed",finalVerdict:"approve"});
 await addDoc(collection(db,"transactions"),{uid:dep.uid,type:"deposit_success",amount:dep.amount,description:`DEPOSIT SUCCESSFUL $${dep.amount}`,status:"completed",createdAt:serverTimestamp()});
 alert("Approved");loadDeposits();
};
window.rejectDeposit=async(id)=>{await updateDoc(doc(db,"deposits",id),{status:"rejected"});alert("Rejected");loadDeposits();};
async function loadUsers(){
 document.getElementById("title").textContent="Users - Disable / Pause / Delete - FULL DETAILS + Stocks Holdings";
 const snap=await getDocs(collection(db,"users"));
 let html="";snap.forEach(d=>{
  const u=d.data();const status=u.accountStatus||"active";
  let badge=status==="active"?`<span class="statusBadge activeS">ACTIVE</span>`:status==="disabled"?`<span class="statusBadge disabled">DISABLED</span>`:`<span class="statusBadge paused">PAUSED</span>`;
  let allDetailsHtml="";
  try{
    const allKeys=Object.keys(u).sort();
    allKeys.forEach(k=>{
      let v=u[k];
      if(v===null||v===undefined) v="";
      if(v && typeof v==="object" && v.toDate) { try{v=v.toDate().toLocaleString();}catch(e){v=JSON.stringify(v);} }
      else if(typeof v==="object") { try{v=JSON.stringify(v).substring(0,500);}catch(e){v=String(v);} }
      allDetailsHtml+=`<div class="rowD" style="background:#08162e;border-left:3px solid #22c55e;margin:2px 0"><b style="color:#5eead4;min-width:110px">${k}</b><span style="word-break:break-all;text-align:right;font-size:11px">${String(v).replace(/</g,"&lt;")}</span></div>`;
    });
  }catch(e){ allDetailsHtml="<div>Error: "+e.message+"</div>"; }
  html+=`<div class="item"><div onclick="toggleDetail('${d.id}')" style="cursor:pointer"><b>${u.fullName||u.username}</b> ${badge}<br>Balance: $${Number(u.balance||0).toFixed(2)} - ${u.email} <small style="color:#60a5fa">[Click to expand]</small></div><div id="det-${d.id}" class="detailBox">
  <div style="background:#122a4a;padding:10px;border-radius:10px;margin-bottom:10px;border:2px solid #22c55e"><b style="color:#22c55e">📋 FULL SIGNUP DETAILS</b></div>
  ${allDetailsHtml}
  <div class="rowD"><b>Email</b><span>${u.email}</span></div>
  <input id="reason-${d.id}" value="${u.statusReason||""}" placeholder="Reason">
  <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
  <button class="btn btnY" onclick="event.stopPropagation();setUserStatus('${d.id}','paused')">PAUSE</button>
  <button class="btn btnR" onclick="event.stopPropagation();setUserStatus('${d.id}','disabled')">DISABLE</button>
  <button class="btn btnG" onclick="event.stopPropagation();setUserStatus('${d.id}','active')">ENABLE</button>
  <button class="btn btnR" onclick="event.stopPropagation();deleteUserFull('${d.id}')">DELETE</button>
  <button class="btn btnB" onclick="event.stopPropagation();viewUserStocks('${d.id}')" style="background:#3b82f6">📊 VIEW STOCKS HOLDINGS</button>
  </div>
  <div style="margin-top:10px" class="editGrid"><input id="bal-${d.id}" type="number" value="${u.balance||0}"><button class="btn btnB" onclick="event.stopPropagation();setBal('${d.id}')">Set Balance</button></div>
  <div id="stocks-${d.id}" style="margin-top:12px;background:#08162e;padding:10px;border-radius:10px;border:1px solid #3b82f6;display:none"></div>
  <div style="margin-top:10px;background:#0f1e38;padding:10px;border-radius:10px"><b>ADD TRANSACTION</b><input id="tType-${d.id}" placeholder="Type"><input id="tAmt-${d.id}" type="number" placeholder="Amount"><input id="tDesc-${d.id}" placeholder="Description"><select id="tStat-${d.id}"><option value="completed">completed</option><option value="approved">approved</option><option value="pending">pending</option></select><button class="btn btnG" onclick="event.stopPropagation();addTransactionForUser('${d.id}')">ADD</button></div>
  </div></div>`;
 });
 document.getElementById("list").innerHTML=html||"No users";
}
window.toggleDetail=(id)=>{const el=document.getElementById("det-"+id);if(el) el.classList.toggle("show");};
window.setUserStatus=async(uid,status)=>{
 const reason=document.getElementById("reason-"+uid)?.value||status;
 await updateDoc(doc(db,"users",uid),{accountStatus:status,statusReason:reason,disabledAt:serverTimestamp()});
 await addDoc(collection(db,"transactions"),{uid:uid,type:"account_"+status,amount:0,description:status.toUpperCase()+" by Admin - "+reason,status:"completed",createdAt:serverTimestamp()});
 alert(status);loadUsers();
};
window.deleteUserFull=async(uid)=>{if(prompt("Type DELETE")!=="DELETE")return;await deleteDoc(doc(db,"users",uid));alert("Deleted");loadUsers();};
window.setBal=async(uid)=>{const v=Number(document.getElementById("bal-"+uid).value);await updateDoc(doc(db,"users",uid),{balance:v});alert("Bal $"+v);loadUsers();};
window.addTransactionForUser=async(uid)=>{
 const type=document.getElementById(`tType-${uid}`).value||"custom";
 const amt=Number(document.getElementById(`tAmt-${uid}`).value||0);
 const desc=document.getElementById(`tDesc-${uid}`).value||"Custom";
 const stat=document.getElementById(`tStat-${uid}`).value||"completed";
 await addDoc(collection(db,"transactions"),{uid:uid,type:type,amount:amt,description:desc,status:stat,createdAt:serverTimestamp()});
 alert("Added");loadUsers();
};
window.viewUserStocks=async(uid)=>{
  const container=document.getElementById(`stocks-${uid}`);
  if(!container) return;
  container.style.display=container.style.display==="none"?"block":"none";
  if(container.style.display==="none") return;
  container.innerHTML="Loading holdings...";
  try{
    const balSnap=await getDoc(doc(db,"userBalances",uid));
    const bal=balSnap.exists()?balSnap.data():{};
    let html=`<div style="background:#132a48;padding:8px;border-radius:8px;margin-bottom:8px"><b>Balances:</b> Main $${bal.mainBalance||0} | Stocks $${bal.stockBalance||0} | Gain $${bal.gain||0} | Pass: ${bal.tradePassword||"1234"}</div>`;
    const snap=await getDocs(query(collection(db,"portfolios"),where("uid","==",uid)));
    if(snap.empty){
      try{
        const subSnap=await getDocs(collection(db,`users/${uid}/holdings`));
        if(!subSnap.empty){
          html+=`<div><b>Holdings (subcollection):</b></div>`;
          subSnap.forEach(d=>{
            const h=d.data();
            html+=`<div class="rowD"><b>${h.symbol||d.id}</b><span>${h.quantity||0} shares @ $${h.avgPrice||0} = $${(h.quantity*h.avgPrice||0).toFixed(2)}</span></div>`;
          });
        } else {
          html+=`<div>No stock holdings found for this user.</div>`;
        }
      }catch(e){ html+=`<div>No holdings</div>`; }
    } else {
      html+=`<div><b>📊 ${snap.size} Different Stocks - Total Holdings:</b></div>`;
      let totalValue=0, totalShares=0;
      snap.forEach(d=>{
        const h=d.data();
        const livePrice=h.currentPrice||h.avgPrice||0;
        const value=(h.quantity||0)*livePrice;
        totalValue+=value;
        totalShares+=h.quantity||0;
        html+=`<div class="rowD" style="border-left:3px solid #3b82f6;background:#0f1e38;margin:4px 0;padding:8px;border-radius:6px">
        <div><b style="color:#60a5fa">${h.symbol}</b> ${h.name||""} <br><small style="color:#8aa0c2">${h.quantity} shares @ $${h.avgPrice} • Type: ${h.type||"stock"} • Gain: $${((livePrice-h.avgPrice)*h.quantity).toFixed(2)}</small></div>
        <div style="text-align:right"><b>$${value.toFixed(2)}</b><br><button class="btn btnR" onclick="deleteUserHolding('${d.id}')">Delete</button> <button class="btn btnB" onclick="editUserHolding('${d.id}')">Edit</button></div></div>`;
      });
      html+=`<div style="margin-top:8px;background:#0f3d1f;padding:8px;border-radius:8px"><b>Total Shares: ${totalShares} | Total Value: $${totalValue.toFixed(2)}</b></div>`;
    }
    container.innerHTML=html;
  }catch(e){ container.innerHTML="Error: "+e.message; }
};
window.deleteUserHolding=async(id)=>{if(!confirm("Delete this holding?"))return;await deleteDoc(doc(db,"portfolios",id));alert("Deleted holding");};
window.editUserHolding=async(id)=>{
  const qty=parseFloat(prompt("New quantity:"));
  if(!qty) return;
  const price=parseFloat(prompt("New avg price:"));
  if(!price) return;
  await updateDoc(doc(db,"portfolios",id),{quantity:qty,avgPrice:price,updatedAt:serverTimestamp()});
  alert("Updated");
};
async function loadTrades(){
 document.getElementById("title").textContent="Trades - EDITABLE";
 const snap=await getDocs(query(collection(db,"trades"),orderBy("createdAt","desc")));
 let html="";snap.forEach(d=>{
  const t=d.data();
  html+=`<div class="item"><b>${t.coin} ${t.type} $${t.amount}</b> - ${t.status}<br>UID:${t.uid}<br><div style="margin-top:10px;background:#08162e;padding:10px"><input id="stake-${d.id}" type="number" value="${t.amount||0}"><div class="editGrid"><input id="sl-${d.id}" type="number" value="${t.stopLossAmount||200}"><input id="tp-${d.id}" type="number" value="${t.takeProfitAmount||0}"></div><div style="display:flex;gap:6px;margin-top:8px"><button class="btn btnB" onclick="saveTrade('${d.id}')">SAVE</button><button class="btn btnG" onclick="approveTrade('${d.id}')">APPROVE WIN</button><button class="btn btnR" onclick="rejectTrade('${d.id}')">REJECT</button><button class="btn btnGray" onclick="del('trades','${d.id}')">Delete</button></div></div></div>`;
 });
 document.getElementById("list").innerHTML=html||"No trades";
}
window.saveTrade=async(id)=>{const stake=Number(document.getElementById(`stake-${id}`).value);const sl=Number(document.getElementById(`sl-${id}`).value);const tp=Number(document.getElementById(`tp-${id}`).value);await updateDoc(doc(db,"trades",id),{amount:stake,stopLossAmount:sl,takeProfitAmount:tp});alert("Saved");};
window.approveTrade=async(id)=>{const snap=await getDoc(doc(db,"trades",id));const t=snap.data();const total=Number(t.amount)+Number(t.takeProfitAmount||0);const uRef=doc(db,"users",t.uid);const u=(await getDoc(uRef)).data();await updateDoc(uRef,{balance:Number(u.balance||0)+total});await updateDoc(doc(db,"trades",id),{status:"completed",finalVerdict:"approve"});await addDoc(collection(db,"transactions"),{uid:t.uid,type:"trade_success",amount:total,description:`TRADE SUCCESSFUL ${t.coin} +${t.profitPct||0}% - $${total}`,status:"completed",tradeId:id,createdAt:serverTimestamp()});alert(`Approved $${total}`);loadTrades();};
window.rejectTrade=async(id)=>{const snap=await getDoc(doc(db,"trades",id));const t=snap.data();const sl=Number(t.stopLossAmount||0);const uRef=doc(db,"users",t.uid);const u=(await getDoc(uRef)).data();await updateDoc(uRef,{balance:Number(u.balance||0)+sl});await updateDoc(doc(db,"trades",id),{status:"completed",finalVerdict:"rejected"});await addDoc(collection(db,"transactions"),{uid:t.uid,type:"trade_loss",amount:sl,description:`TRADE LOSS - $${sl} returned`,status:"completed",tradeId:id,createdAt:serverTimestamp()});alert("Rejected");loadTrades();};async function loadTransactions(){
 document.getElementById("title").textContent="Transactions - FULL EDIT + ADD NEW";
 const usersSnap=await getDocs(collection(db,"users"));
 let userOptions="";usersSnap.forEach(u=>{const data=u.data();userOptions+=`<option value="${u.id}">${data.username||data.fullName||u.id} - ${data.email}</option>`;});
 let topForm=`<div class="card" style="background:#0f2d1e;border:1px solid #22c55e;margin-bottom:16px"><h3 style="color:#22c55e">➕ ADD NEW TRANSACTION</h3><select id="newTransUid"><option value="">-- Choose User --</option>${userOptions}</select><div class="editGrid"><input id="newTransType" placeholder="Type e.g. deposit_success"><input id="newTransAmt" type="number" placeholder="Amount"></div><textarea id="newTransDesc" placeholder="Description"></textarea><div class="editGrid"><select id="newTransStatus"><option value="completed">completed</option><option value="approved">approved</option><option value="processing">processing</option><option value="pending">pending</option><option value="rejected">rejected</option></select><input id="newTransCustomStatus" placeholder="Custom status"></div><button class="btn btnG" style="width:100%;padding:12px" onclick="createNewTransaction()">CREATE TRANSACTION</button></div>`;
 const snap=await getDocs(query(collection(db,"transactions"),orderBy("createdAt","desc")));
 let html=topForm;let c=0;
 snap.forEach(d=>{if(c++>100)return;const v=d.data();html+=`<div class="item" style="background:#0f1e38"><div style="font-size:10px">ID:${d.id} UID:${v.uid}</div><div class="editGrid"><input id="type-${d.id}" value="${(v.type||"").replace(/"/g,'&quot;')}"><input id="amt-${d.id}" type="number" value="${v.amount||0}"></div><textarea id="desc-${d.id}" style="height:60px">${(v.description||"")}</textarea><div class="editGrid"><select id="stat-${d.id}"><option value="completed" ${v.status==="completed"?"selected":""}>completed</option><option value="approved" ${v.status==="approved"?"selected":""}>approved</option><option value="processing" ${v.status==="processing"?"selected":""}>processing</option><option value="pending" ${v.status==="pending"?"selected":""}>pending</option><option value="rejected" ${v.status==="rejected"?"selected":""}>rejected</option></select><input id="uid-${d.id}" value="${v.uid||""}"></div><div style="display:flex;gap:6px;margin-top:8px"><button class="btn btnG" onclick="saveFullTransaction('${d.id}')">SAVE ALL</button><button class="btn btnB" onclick="setTransCompleted('${d.id}')">COMPLETED</button><button class="btn btnR" onclick="del('transactions','${d.id}')">Delete</button></div></div>`;});
 document.getElementById("list").innerHTML=html;
}
window.createNewTransaction=async()=>{
 const uid=document.getElementById("newTransUid").value;
 const type=document.getElementById("newTransType").value||"custom";
 const amt=Number(document.getElementById("newTransAmt").value||0);
 let desc=document.getElementById("newTransDesc").value||`${type} $${amt}`;
 let status=document.getElementById("newTransStatus").value;
 const custom=document.getElementById("newTransCustomStatus").value;if(custom)status=custom;
 if(!uid){alert("Select user");return;}
 await addDoc(collection(db,"transactions"),{uid:uid,type:type,amount:amt,description:desc,status:status,createdAt:serverTimestamp()});
 alert("Created");loadTransactions();
};
window.saveFullTransaction=async(id)=>{
 const type=document.getElementById(`type-${id}`).value;
 const amt=Number(document.getElementById(`amt-${id}`).value||0);
 const desc=document.getElementById(`desc-${id}`).value;
 let stat=document.getElementById(`stat-${id}`).value;
 const uid=document.getElementById(`uid-${id}`).value;
 await updateDoc(doc(db,"transactions",id),{type:type,amount:amt,description:desc,status:stat,uid:uid});
 alert("Saved");loadTransactions();
};
window.setTransCompleted=async(id)=>{await updateDoc(doc(db,"transactions",id),{status:"completed"});alert("Completed");loadTransactions();};
async function loadTier(){document.getElementById("title").textContent="Tier Verification - EDIT";const snap=await getDocs(query(collection(db,"tierVerifications"),orderBy("createdAt","desc")));let html="";snap.forEach(d=>{const v=d.data();html+=`<div class="item"><b>Tier ${v.tier}</b> UID:${v.uid} Status:${v.status}<br><button class="btn btnG" onclick="approveTier('${d.id}',${v.tier},'${v.uid}')">Approve</button><button class="btn btnR" onclick="del('tierVerifications','${d.id}')">Delete</button></div>`;});document.getElementById("list").innerHTML=html||"No verifications";}
window.approveTier=async(id,tier,uid)=>{await updateDoc(doc(db,"tierVerifications",id),{status:"approved"});if(tier==2)await updateDoc(doc(db,"users",uid),{tier2Verified:true});if(tier==3)await updateDoc(doc(db,"users",uid),{tier3Verified:true});alert("Approved");loadTier();};
async function loadNotif(){
 document.getElementById("title").textContent="🔔 Trade Alerts";
 const snap=await getDocs(query(collection(db,"admin_notifications"),orderBy("createdAt","desc")));
 let html="";snap.forEach(d=>{const v=d.data();html+=`<div class="item" style="border-left:4px solid #f59e0b"><b>⏰ ${v.coin} ${v.tradeType}</b><br>${v.message}<br>Trade ID:${v.tradeId}<br><button class="btn btnG" onclick="showTab('trades')">Go Verify</button><button class="btn btnR" onclick="del('admin_notifications','${d.id}')">Delete</button></div>`;});
 document.getElementById("list").innerHTML=html||"No alerts";
}
async function loadIndicators(){
 document.getElementById("title").textContent="📈 Trade Indicators";
 const snap=await getDocs(query(collection(db,"trades"),where("status","==","active"),orderBy("createdAt","desc")));
 let html=`<div style="background:#0f1e38;padding:10px;border-radius:10px;margin-bottom:12px"><b>🔴 SELL = Red Line BELOW = WIN</b><br><b>🟢 BUY = Green Line ABOVE = WIN</b></div>`;
 let count=0;snap.forEach(d=>{if(count++>30)return;const t=d.data();html+=`<div class="item" style="border:1px solid ${t.type==="buy"?"#22c55e":"#ef4444"}"><b>${t.coin} ${t.type?.toUpperCase()} $${t.amount}</b><br>User: ${t.username} Entry: $${Number(t.entryPrice||0).toFixed(2)}<br><button class="btn btnG" onclick="approveTrade('${d.id}')">Approve WIN</button><button class="btn btnR" onclick="rejectTrade('${d.id}')">Reject</button></div>`;});
 if(count===0)html+="<div class='item'>No active trades</div>";
 document.getElementById("list").innerHTML=html;
}
window.del=async(col,id)=>{if(!confirm("Delete?"))return;await deleteDoc(doc(db,col,id));alert("Deleted");if(col==="deposits")loadDeposits();if(col==="trades")loadTrades();if(col==="users")loadUsers();if(col==="transactions")loadTransactions();if(col==="tierVerifications")loadTier();if(col==="admin_notifications")loadNotif();if(col==="stocks")loadStocksMarket();if(col==="userBalances")loadUserBalances();};
async function loadOnlineUsers(){
  document.getElementById("title").textContent="🟢 Active Users Online - Live Tracking";
  const snap=await getDocs(collection(db,"users"));
  let html=`<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap"><div class="card" style="flex:1;min-width:120px;text-align:center"><b id="totalOnline" style="font-size:22px;color:#22c55e">0</b><br><small>Online Now</small></div><div class="card" style="flex:1;min-width:120px;text-align:center"><b id="totalUsers" style="font-size:22px">${snap.size}</b><br><small>Total Users</small></div></div><div style="display:grid;gap:8px">`;
  let onlineCount=0; const now=Date.now(); const fiveMin=now-(5*60*1000); const oneHour=now-(60*60*1000);
  snap.forEach(d=>{const u=d.data(); const last=u.lastActive?.toMillis?u.lastActive.toMillis():(u.lastActive||u.lastLogin||0); const isOnline=last>fiveMin; const recent=last>oneHour; if(isOnline)onlineCount++; const color=isOnline?"#22c55e":recent?"#f59e0b":"#64748b"; const text=isOnline?"ONLINE NOW":recent?"Recently Active":"Offline"; const dot=isOnline?"online":"offline"; html+=`<div class="item" style="border-left:4px solid ${color}"><span class="onlineDot ${dot}"></span><b>${u.fullName||u.username||u.email}</b> <span class="statusBadge" style="background:${color};color:white">${text}</span><br><small>${u.email} • Bal $${Number(u.balance||0).toFixed(2)} • Last: ${last?new Date(last).toLocaleString():"Never"}</small><div style="margin-top:6px"><button class="btn btnB" onclick="toggleDetail('${d.id}')">View</button> <a class="wa" href="https://wa.me/${u.phone||''}" target="_blank">WhatsApp</a> <button class="btn btnB" onclick="viewUserStocks('${d.id}')" style="background:#3b82f6">📊 Stocks</button></div><div id="det-${d.id}" class="detailBox"><div class="rowD"><b>UID</b><span>${d.id}</span></div><div class="rowD"><b>Email</b><span>${u.email}</span></div><div id="stocks-${d.id}" style="margin-top:8px"></div></div></div>`;});
  html+=`</div>`; document.getElementById("list").innerHTML=html;
  const oc=document.getElementById("onlineCount"); if(oc) oc.textContent=onlineCount;
  const to=document.getElementById("totalOnline"); if(to) to.textContent=onlineCount;
}
async function loadStocksMarket(){
  document.getElementById("title").innerHTML=`📊 Stocks Market - Edit All Assets <button class="btn btnG" onclick="openStockModal()" style="margin-left:8px">+ Add</button> <button class="btn btnB" onclick="seedStocks()">Seed 24</button>`;
  const snap=await getDocs(query(collection(db,"stocks"),orderBy("symbol")));
  let html=`<div style="margin-bottom:10px"><input id="stockSearch" placeholder="Search BTC, AAPL..." style="max-width:300px" oninput="filterStocks()"></div><div id="stocksGrid">`;
  if(snap.empty){html+=`<div class="item">No stocks. Click Seed 24.</div>`;}else{snap.forEach(d=>{const s=d.data(); const up=(s.change||0)>=0; html+=`<div class="stockCard" data-symbol="${s.symbol}" data-name="${s.name}"><div style="display:flex;gap:10px;align-items:center"><div style="width:36px;height:36px;background:#1e293b;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:bold">${s.symbol?.[0]||"?"}</div><div><b>${s.symbol}</b> <span class="badge ${s.type==="crypto"?"badge-crypto":"badge-stock"}">${s.type||"stock"}</span><br><small style="color:#8aa0c2">${s.name||""} • ${s.cap||""}</small></div></div><div style="text-align:right"><div class="stockPrice ${up?"up":"down"}">$${Number(s.price||0).toLocaleString()} <small>${up?"▲":"▼"} ${s.change||0}%</small></div><div style="margin-top:6px;display:flex;gap:4px;justify-content:flex-end"><button class="btn btnB" onclick="editStock('${d.id}')">Edit</button><button class="btn btnR" onclick="deleteStock('${d.id}')">Del</button><button class="btn btnY" onclick="updateStockPrice('${d.id}')">Price</button></div></div></div>`;});}
  html+=`</div>`; document.getElementById("list").innerHTML=html;
}
window.filterStocks=()=>{const term=document.getElementById("stockSearch")?.value?.toLowerCase()||"";document.querySelectorAll(".stockCard").forEach(card=>{const sym=card.dataset.symbol?.toLowerCase()||"";const name=card.dataset.name?.toLowerCase()||"";card.style.display=(sym.includes(term)||name.includes(term))?"flex":"none";});};
window.openStockModal=()=>{document.getElementById("stockModal").style.display="block";document.getElementById("stockModalTitle").textContent="Add New Asset";document.getElementById("stockSymbol").value="";document.getElementById("stockName").value="";document.getElementById("stockType").value="stock";document.getElementById("stockPrice").value="";document.getElementById("stockChange").value="";document.getElementById("stockCap").value="";document.getElementById("stockModal").dataset.editId="";};
window.closeStockModal=()=>{document.getElementById("stockModal").style.display="none";};
window.editStock=async(id)=>{const snap=await getDoc(doc(db,"stocks",id));if(!snap.exists())return alert("Not found");const s=snap.data();document.getElementById("stockModal").style.display="block";document.getElementById("stockModalTitle").textContent="Edit "+s.symbol;document.getElementById("stockSymbol").value=s.symbol||"";document.getElementById("stockName").value=s.name||"";document.getElementById("stockType").value=s.type||"stock";document.getElementById("stockPrice").value=s.price||0;document.getElementById("stockChange").value=s.change||0;document.getElementById("stockCap").value=s.cap||"";document.getElementById("stockModal").dataset.editId=id;};
window.saveStock=async()=>{const symbol=document.getElementById("stockSymbol").value.trim().toUpperCase();const name=document.getElementById("stockName").value.trim();const type=document.getElementById("stockType").value;const price=parseFloat(document.getElementById("stockPrice").value)||0;const change=parseFloat(document.getElementById("stockChange").value)||0;const cap=document.getElementById("stockCap").value.trim();if(!symbol||!name)return alert("Symbol and Name required");const editId=document.getElementById("stockModal").dataset.editId;const id=editId||symbol.toLowerCase();await setDoc(doc(db,"stocks",id),{symbol,name,type,price,change,cap,updatedAt:serverTimestamp()},{merge:true});document.getElementById("stockModal").dataset.editId="";closeStockModal();alert("Saved "+symbol);loadStocksMarket();};
window.deleteStock=async(id)=>{if(!confirm("Delete this asset?"))return;await deleteDoc(doc(db,"stocks",id));alert("Deleted");loadStocksMarket();};
window.updateStockPrice=async(id)=>{const newPrice=parseFloat(prompt("Enter new live price:"));if(!newPrice)return;await updateDoc(doc(db,"stocks",id),{price:newPrice,updatedAt:serverTimestamp()});alert("Price updated!");loadStocksMarket();};
window.seedStocks=async()=>{if(!confirm("Seed 24 default assets?"))return;const assets=[{symbol:"BTC",name:"Bitcoin",type:"crypto",price:68420,change:2.31,cap:"$1.35T"},{symbol:"ETH",name:"Ethereum",type:"crypto",price:2540,change:-0.84,cap:"$305B"},{symbol:"USDT",name:"Tether",type:"crypto",price:1,change:0.01,cap:"$119B"},{symbol:"BNB",name:"BNB",type:"crypto",price:605,change:1.2,cap:"$88B"},{symbol:"SOL",name:"Solana",type:"crypto",price:178,change:5.4,cap:"$84B"},{symbol:"XRP",name:"XRP",type:"crypto",price:0.58,change:-1.2,cap:"$32B"},{symbol:"DOGE",name:"Dogecoin",type:"crypto",price:0.14,change:3.1,cap:"$20B"},{symbol:"ADA",name:"Cardano",type:"crypto",price:0.45,change:-2.1,cap:"$16B"},{symbol:"AVAX",name:"Avalanche",type:"crypto",price:28,change:4.2,cap:"$11B"},{symbol:"SHIB",name:"Shiba Inu",type:"crypto",price:0.000025,change:6.5,cap:"$14B"},{symbol:"LINK",name:"Chainlink",type:"crypto",price:14.2,change:2.8,cap:"$8.4B"},{symbol:"LTC",name:"Litecoin",type:"crypto",price:72,change:1.1,cap:"$5.4B"},{symbol:"AAPL",name:"Apple Inc.",type:"stock",price:228.5,change:1.2,cap:"Technology"},{symbol:"MSFT",name:"Microsoft",type:"stock",price:415,change:0.8,cap:"Technology"},{symbol:"NVDA",name:"NVIDIA",type:"stock",price:875,change:3.4,cap:"Semiconductors"},{symbol:"GOOGL",name:"Alphabet",type:"stock",price:165,change:-0.3,cap:"Technology"},{symbol:"AMZN",name:"Amazon",type:"stock",price:178,change:1.5,cap:"Consumer"},{symbol:"META",name:"Meta Platforms",type:"stock",price:485,change:2.1,cap:"Technology"},{symbol:"TSLA",name:"Tesla",type:"stock",price:248,change:-1.4,cap:"Automotive"},{symbol:"NFLX",name:"Netflix",type:"stock",price:680,change:1.8,cap:"Entertainment"},{symbol:"SPY",name:"S&P 500 ETF",type:"stock",price:520,change:0.7,cap:"ETF"},{symbol:"GME",name:"GameStop",type:"stock",price:22,change:5.2,cap:"Meme"},{symbol:"AMD",name:"AMD",type:"stock",price:165,change:2.2,cap:"Semiconductors"},{symbol:"COIN",name:"Coinbase",type:"stock",price:245,change:4.5,cap:"Crypto Exchange"}];for(let a of assets){await setDoc(doc(db,"stocks",a.symbol.toLowerCase()),{...a,updatedAt:serverTimestamp()},{merge:true});}alert("Seeded 24 assets!");loadStocksMarket();};
async function loadUserBalances(){
  document.getElementById("title").innerHTML=`💰 User Stocks Balances - Edit Gain, Main, Stocks, Deposited`;
  const snap=await getDocs(collection(db,"userBalances"));
  let html=`<div style="margin-bottom:12px"><small style="color:#8aa0c2">Gain is editable here - changes reflect in user UI instantly. Trade Password default 1234.</small></div>`;
  if(snap.empty){html+=`<div class="item">No user balances yet.</div>`;}else{snap.forEach(d=>{const u=d.data(); html+=`<div class="card" style="border:1px solid #f59e0b"><b>User: ${d.id.substring(0,12)}...</b> • UID: ${u.uid||d.id}<br><div class="balanceGrid" style="margin-top:10px"><div class="balanceItem"><small>Main Balance</small><input id="main_${d.id}" value="${u.mainBalance||0}" type="number"></div><div class="balanceItem"><small>Stocks Balance</small><input id="stock_${d.id}" value="${u.stockBalance||0}" type="number"></div><div class="balanceItem"><small>Deposited</small><input id="dep_${d.id}" value="${u.depositedBalance||0}" type="number"></div><div class="balanceItem" style="border:1px solid #22c55e"><small style="color:#22c55e">Gain (Editable)</small><input id="gain_${d.id}" value="${u.gain||0}" type="number" style="border-color:#22c55e"></div><div class="balanceItem"><small>Trade Password</small><input id="pass_${d.id}" value="${u.tradePassword||'1234'}" placeholder="Trade password"></div></div><div style="margin-top:10px;display:flex;gap:6px"><button class="btn btnG" onclick="saveUserBalance('${d.id}')">Save All</button><button class="btn btnB" onclick="addBonus('${d.id}')">+ Add $1000</button><button class="btn btnR" onclick="del('userBalances','${d.id}')">Delete</button> <button class="btn btnB" onclick="viewUserStocks('${d.id}')" style="background:#3b82f6">📊 View Stocks</button></div><div id="stocks-${d.id}" style="margin-top:10px;display:none"></div></div>`;});}
  document.getElementById("list").innerHTML=html;
}
window.saveUserBalance=async(id)=>{const data={mainBalance:parseFloat(document.getElementById("main_"+id).value)||0,stockBalance:parseFloat(document.getElementById("stock_"+id).value)||0,depositedBalance:parseFloat(document.getElementById("dep_"+id).value)||0,gain:parseFloat(document.getElementById("gain_"+id).value)||0,tradePassword:document.getElementById("pass_"+id).value||"1234",updatedAt:serverTimestamp()};await setDoc(doc(db,"userBalances",id),data,{merge:true});try{await updateDoc(doc(db,"users",id),{balance:data.mainBalance});}catch(e){}alert("Saved for "+id);};
window.addBonus=async(id)=>{const amount=parseFloat(prompt("Add bonus amount:", "1000"));if(!amount)return;const ref=doc(db,"userBalances",id);const snap=await getDoc(ref);const current=snap.exists()?(snap.data().mainBalance||0):0;await setDoc(ref,{mainBalance:current+amount,uid:id,updatedAt:serverTimestamp()},{merge:true});try{await updateDoc(doc(db,"users",id),{balance:current+amount});}catch(e){}alert("Added $"+amount);loadUserBalances();};
setInterval(()=>{const title=document.getElementById("title")?.textContent||"";if(title.includes("Active Users Online"))loadOnlineUsers();},30000);