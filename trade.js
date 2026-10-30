let chart, candleSeries, detailChart, detailSeries, curPrice=4027, curCoin='BTC', curPct=92, pending='buy';
let tools=[], pinkDots=[], liveTrades=[], pointerMode=false, editingTool=null;
const coins=[
 {n:'BTC',l:'₿',p:68509,pr:92},{n:'ETH',l:'Ξ',p:3849,pr:88},{n:'SOL',l:'◎',p:147,pr:94},
 {n:'GOLD',l:'●',p:4027,pr:90},{n:'EUR/USD',l:'€',p:1.084,pr:89},{n:'USOIL',l:'🛢',p:78.2,pr:96},
 {n:'BNB',l:'B',p:612,pr:88},{n:'XRP',l:'✕',p:0.58,pr:98},{n:'ADA',l:'A',p:0.45,pr:91},{n:'DOGE',l:'D',p:0.12,pr:87}
];

function initCoins(){
 let h=''; coins.forEach(c=>{h+=`<div onclick="selectCoin('${c.n}','${c.l}',${c.p},${c.pr})"><span>${c.l} ${c.n}</span><span>$${c.p} <b style="background:#155eef;color:white;padding:2px 6px;border-radius:10px">${c.pr}%</b></span></div>`;});
 document.getElementById('coinList').innerHTML=h;
}
initCoins();

// CHART - RED/GREEN FAST
function initMain(){
 const el=document.getElementById('mainChart');
 chart=LightweightCharts.createChart(el,{layout:{background:{color:'white'},textColor:'#64748b'},grid:{vertLines:{color:'#f1f5f9'},horzLines:{color:'#f1f5f9'}},width:el.clientWidth,height:el.clientHeight,timeScale:{timeVisible:true}});
 candleSeries=chart.addCandlestickSeries({upColor:'#16a34a',downColor:'#ef4444',borderUpColor:'#16a34a',borderDownColor:'#ef4444',wickUpColor:'#16a34a',wickDownColor:'#ef4444',wickVisible:true,borderVisible:true});
 const now=Math.floor(Date.now()/1000); let d=[]; for(let i=120;i>=0;i--){let b=4022+Math.sin(i/4)*5+i*0.02; d.push({time:now-i*15,open:b,high:b+0.6,low:b-0.6,close:b+(Math.random()-0.5)});} candleSeries.setData(d);
 let last=4022;
 setInterval(()=>{last+=(Math.random()-0.5)*1.8; curPrice=last; const t=Math.floor(Date.now()/1000); candleSeries.update({time:t,open:last,high:last+0.7,low:last-0.7,close:curPrice}); repositionAll();},200);
 chart.timeScale().subscribeVisibleLogicalRangeChange(()=>{repositionAll();});
}
initMain();
window.addEventListener('resize',()=>{chart.applyOptions({width:document.getElementById('mainChart').clientWidth,height:document.getElementById('mainChart').clientHeight}); repositionAll();});

function initDetail(){
 const el=document.getElementById('detailChart');
 if(detailChart) detailChart.remove();
 detailChart=LightweightCharts.createChart(el,{layout:{background:{color:'white'},textColor:'#64748b'},grid:{vertLines:{color:'#f1f5f9'},horzLines:{color:'#f1f5f9'}},width:el.clientWidth,height:el.clientHeight});
 detailSeries=detailChart.addCandlestickSeries({upColor:'#16a34a',downColor:'#ef4444',borderUpColor:'#16a34a',borderDownColor:'#ef4444',wickUpColor:'#16a34a',wickDownColor:'#ef4444',wickVisible:true,borderVisible:true});
 const now=Math.floor(Date.now()/1000); let d=[]; for(let i=80;i>=0;i--){let b=curPrice+Math.sin(i/5)*2; d.push({time:now-i*15,open:b,high:b+0.6,low:b-0.6,close:b+(Math.random()-0.5)});} detailSeries.setData(d);
 setInterval(()=>{const t=Math.floor(Date.now()/1000); if(detailSeries) detailSeries.update({time:t,open:curPrice,high:curPrice+0.7,low:curPrice-0.7,close:curPrice+(Math.random()-0.5)});},200);
}

// FAST STATS
let u=2417485,t=184289213,l=15670;
setInterval(()=>{u+=Math.floor((Math.random()-0.45)*3500); t+=Math.floor((Math.random()-0.45)*15000); l+=Math.floor((Math.random()-0.45)*250); document.getElementById('sUsers').textContent=u.toLocaleString(); document.getElementById('sTraded').textContent='$'+t.toLocaleString(); document.getElementById('sLive').textContent=l.toLocaleString(); document.getElementById('clock').textContent=new Date().toLocaleTimeString().slice(0,5)+' '+new Date().toLocaleTimeString().slice(0,5);},300);

function toggleCoins(){document.getElementById('coinList').classList.toggle('show');}
function selectCoin(n,l,p,pr){curCoin=n; curPct=pr; document.getElementById('cLogo').textContent=l; document.getElementById('cName').textContent=n; document.getElementById('cPrice').textContent='$'+p; document.getElementById('cPct').textContent=pr+'%'; document.getElementById('oPct').textContent=pr+'%'; document.getElementById('oProf').textContent=pr+'%'; document.getElementById('pPct').textContent=pr+'%'; document.getElementById('pProfitPct').value=pr+'%'; document.getElementById('coinList').classList.remove('show'); updateTP();}
function openTools(){document.getElementById('toolsPanel').classList.add('show');} function closeTools(){document.getElementById('toolsPanel').classList.remove('show');}
function updateTP(){let amt=Number(document.getElementById('oAmt').value||100); document.getElementById('oTP').value=Math.floor(amt*curPct/100); document.getElementById('oSL').value=Math.floor(amt*0.5); document.getElementById('oProfVal').textContent='$'+Math.floor(amt*curPct/100);}

// ADD TOOL ANCHORED TO TIME/PRICE
function addTool(type){
 closeTools();
 const now=Math.floor(Date.now()/1000);
 const tool={id:Date.now()+Math.random(),type:type,t1:now-60,p1:curPrice,t2:now-15,p2:curPrice+1.5,rot:0};
 tools.push(tool);
 createToolDOM(tool);
 saveAll();
}
function createToolDOM(tool){
 const wrap=document.createElement('div'); wrap.className='toolLine '+(tool.type==='trend'?'blueTool':'whiteTool'); wrap.id='tool-'+tool.id;
 const b=document.createElement('div'); b.className='handle hBlue'; wrap.appendChild(b);
 const y=document.createElement('div'); y.className='handle hYellow'; wrap.appendChild(y);
 const g=document.createElement('div'); g.className='handle hGreen'; wrap.appendChild(g);
 document.getElementById('chartWrap').appendChild(wrap);
 wrap._tool=tool;
 positionTool(wrap,tool);
 attachDrag(wrap,tool);
 // double tap prediction to edit
 if(tool.type==='predict'){
   let lastTap=0;
   wrap.addEventListener('touchend',()=>{const now=Date.now(); if(now-lastTap<300){openPredictEdit(tool);} lastTap=now;});
   wrap.addEventListener('dblclick',()=>{openPredictEdit(tool);});
 }
}
function positionTool(dom,tool){
 const x1=chart.timeScale().timeToCoordinate(tool.t1); const y1=candleSeries.priceToCoordinate(tool.p1);
 const x2=chart.timeScale().timeToCoordinate(tool.t2); const y2=candleSeries.priceToCoordinate(tool.p2);
 if(x1===null||y1===null||x2===null||y2===null){dom.style.display='none'; return;} dom.style.display='block';
 const dx=x2-x1, dy=y2-y1, len=Math.sqrt(dx*dx+dy*dy), baseAng=Math.atan2(dy,dx)*180/Math.PI;
 dom.style.left=x1+'px'; dom.style.top=y1+'px'; dom.style.width=len+'px'; dom.style.transform='rotate('+(baseAng+tool.rot)+'deg)';
}
function repositionAll(){
 document.querySelectorAll('.toolLine').forEach(dom=>{if(dom._tool) positionTool(dom,dom._tool);});
 document.querySelectorAll('.pinkDot').forEach(dom=>{if(dom._dot) positionDot(dom,dom._dot);});
}
function attachDrag(dom,tool){
 let drag=null, sx, sy, startRot, startAng, startT1, startP1, startT2, startP2;
 // 1 finger move
 dom.addEventListener('touchstart',(e)=>{
   if(e.touches.length===1){drag='move'; const touch=e.touches[0]; sx=touch.clientX; sy=touch.clientY; startT1=tool.t1; startP1=tool.p1; startT2=tool.t2; startP2=tool.p2;}
   if(e.touches.length===2){drag='rotate'; const dx=e.touches[1].clientX-e.touches[0].clientX; const dy=e.touches[1].clientY-e.touches[0].clientY; startAng=Math.atan2(dy,dx)*180/Math.PI; startRot=tool.rot;}
 },{passive:false});
 dom.addEventListener('touchmove',(e)=>{
   if(!drag) return; e.preventDefault();
   if(drag==='move' && e.touches.length===1){
     const touch=e.touches[0]; const curT=chart.timeScale().coordinateToTime(touch.clientX); const curP=candleSeries.coordinateToPrice(touch.clientY);
     const prevT=chart.timeScale().coordinateToTime(sx); const prevP=candleSeries.coordinateToPrice(sy);
     if(curT && prevT && curP && prevP){const dT=curT-prevT; const dP=curP-prevP; tool.t1=startT1+dT; tool.p1=startP1+dP; tool.t2=startT2+dT; tool.p2=startP2+dP; positionTool(dom,tool);}
   }
   if(drag==='rotate' && e.touches.length===2){
     const dx=e.touches[1].clientX-e.touches[0].clientX; const dy=e.touches[1].clientY-e.touches[0].clientY; const ang=Math.atan2(dy,dx)*180/Math.PI; tool.rot=startRot+(ang-startAng); positionTool(dom,tool);
   }
 },{passive:false});
 dom.addEventListener('touchend',()=>{drag=null; saveAll();});
 // mouse
 dom.onmousedown=(e)=>{
   if(e.target.classList.contains('handle')){
     if(e.target.classList.contains('hGreen')){drag='rotate'; const r=dom.getBoundingClientRect(); startAng=Math.atan2(e.clientY-r.top,e.clientX-r.left)*180/Math.PI; startRot=tool.rot;}
     else if(e.target.classList.contains('hYellow')){drag='length'; sx=e.clientX; startT2=tool.t2; startP2=tool.p2;}
     else {drag='moveStart'; sx=e.clientX; sy=e.clientY; startT1=tool.t1; startP1=tool.p1;}
   } else {drag='move'; sx=e.clientX; sy=e.clientY; startT1=tool.t1; startP1=tool.p1; startT2=tool.t2; startP2=tool.p2;}
 };
 document.addEventListener('mousemove',(e)=>{
   if(!drag || !dom._tool) return;
   if(drag==='move' || drag==='moveStart'){
     const curT=chart.timeScale().coordinateToTime(e.clientX); const curP=candleSeries.coordinateToPrice(e.clientY);
     const prevT=chart.timeScale().coordinateToTime(sx); const prevP=candleSeries.coordinateToPrice(sy);
     if(curT && prevT && curP && prevP){const dT=curT-prevT; const dP=curP-prevP; tool.t1=startT1+dT; tool.p1=startP1+dP; if(drag==='move'){tool.t2=startT2+dT; tool.p2=startP2+dP;} positionTool(dom,tool);}
   }
   if(drag==='length'){const curT=chart.timeScale().coordinateToTime(e.clientX); const curP=candleSeries.coordinateToPrice(e.clientY); if(curT&&curP){tool.t2=curT; tool.p2=curP; positionTool(dom,tool);}}
   if(drag==='rotate'){const r=dom.getBoundingClientRect(); const ang=Math.atan2(e.clientY-r.top,e.clientX-r.left)*180/Math.PI; tool.rot=startRot+(ang-startAng); positionTool(dom,tool);}
 });
 document.addEventListener('mouseup',()=>{if(drag){drag=null; saveAll();}});
}

// PREDICTION DOUBLE TAP EDIT
function openPredictEdit(tool){editingTool=tool; document.getElementById('pFirst').value=tool.p1.toFixed(2); document.getElementById('pLast').value=tool.p2.toFixed(2); document.getElementById('pAmount').value=100; document.getElementById('predictModal').classList.add('show');}
function closePredict(){document.getElementById('predictModal').classList.remove('show');}
function savePredictEdit(){if(!editingTool) return; editingTool.p1=Number(document.getElementById('pFirst').value); editingTool.p2=Number(document.getElementById('pLast').value); const amt=Number(document.getElementById('pAmount').value||100); document.getElementById('oAmt').value=amt; updateTP(); repositionAll(); saveAll(); closePredict();}

// PINK POINTER - INSIDE CANDLES
function enablePointer(){closeTools(); pointerMode=true; document.getElementById('pTitle').textContent='Tap INSIDE candles'; document.getElementById('pDesc').textContent='Pink dot will appear where you tap on green/red candles, not price side. Tap now.'; document.getElementById('pop').classList.add('show');}
function positionDot(dom,dot){
 const x=chart.timeScale().timeToCoordinate(dot.t); const y=candleSeries.priceToCoordinate(dot.p);
 if(x===null||y===null){dom.style.display='none'; return;} dom.style.display='block'; dom.style.left=x+'px'; dom.style.top=y+'px';
}
document.getElementById('chartWrap').addEventListener('click',(e)=>{
 if(!pointerMode) return;
 if(e.target.closest('.toolLine')||e.target.closest('button')) return;
 // BLOCK price side 80px - pink only inside candles
 if(e.clientX > e.currentTarget.getBoundingClientRect().right-75) return;
 const t=chart.timeScale().coordinateToTime(e.clientX); const p=candleSeries.coordinateToPrice(e.clientY);
 if(!t||!p) return;
 const dot={id:Date.now(),t:t,p:p};
 pinkDots.push(dot);
 const el=document.createElement('div'); el.className='pinkDot'; el._dot=dot; el.id='dot-'+dot.id; document.getElementById('chartWrap').appendChild(el); positionDot(el,dot);
 pointerMode=false; saveAll();
});

function saveAll(){
 localStorage.setItem('final_tools',JSON.stringify(tools));
 localStorage.setItem('final_dots',JSON.stringify(pinkDots));
 showPop('SAVED','All tools saved - now follow candles when you slide chart, shift out of screen like you want','✓',true);
}
function restoreAll(){
 const a=localStorage.getItem('final_tools'), b=localStorage.getItem('final_dots');
 if(a){try{tools=JSON.parse(a); tools.forEach(t=>{createToolDOM(t);});}catch(e){}}
 if(b){try{pinkDots=JSON.parse(b); pinkDots.forEach(d=>{const el=document.createElement('div'); el.className='pinkDot'; el._dot=d; document.getElementById('chartWrap').appendChild(el); positionDot(el,d);});}catch(e){}}
}
setTimeout(restoreAll,600);
function clearAll(){document.querySelectorAll('.toolLine').forEach(e=>e.remove()); document.querySelectorAll('.pinkDot').forEach(e=>e.remove()); tools=[]; pinkDots=[]; localStorage.removeItem('final_tools'); localStorage.removeItem('final_dots');}

// TRADE + POPUP SUCCESS/LOSS
function openOrder(type){pending=type; document.getElementById('oTitle').textContent=type.toUpperCase()+' '+curCoin+' '+curPct+'%'; updateTP(); document.getElementById('orderModal').classList.add('show');}
function closeOrder(){document.getElementById('orderModal').classList.remove('show');}
function doActivate(){
 const amt=Number(document.getElementById('oAmt').value||100);
 const end=Date.now()+60000;
 liveTrades.push({id:Date.now(),coin:curCoin,type:pending,amount:amt,pct:curPct,entry:curPrice,entryTime:new Date().toISOString(),endTime:end});
 closeOrder();
 showPop('TRADE ACTIVATED',pending.toUpperCase()+' '+curCoin+' '+curPct+'% Live - $'+amt,'$'+amt,true);
 // auto success/loss popup like final verdict
 setTimeout(()=>{
   if(Math.random()>0.45){showPop('TRADE SUCCESSFUL','Your '+curCoin+' won +'+curPct+'%','$'+(amt+amt*curPct/100).toFixed(2),true);}
   else{showPop('TRADE LOST','Your '+curCoin+' lost','$'+Math.floor(amt*0.5),false);}
 },8000);
 renderLive();
}
function renderLive(){
 let h=''; liveTrades.forEach(t=>{
   const rem=Math.max(0,Math.floor((t.endTime-Date.now())/1000));
   h+=`<div style="background:white;border:2px solid #155eef;border-radius:12px;padding:12px;margin-bottom:10px;cursor:pointer" onclick="openDetail(${t.id})"><div style="display:flex;justify-content:space-between;font-weight:bold"><span>${t.coin} ${t.type.toUpperCase()} $${t.amount} <small style="background:#155eef;color:white;padding:2px 6px;border-radius:8px">${t.pct}%</small></span><span style="background:#ef4444;color:white;padding:2px 8px;border-radius:10px;font-size:11px">${rem}s left</span></div><div style="font-size:11px;color:#64748b">Start: ${new Date(t.entryTime).toLocaleString()}<br>End: ${new Date(t.endTime).toLocaleString()}</div></div>`;
 });
 document.getElementById('liveBox').innerHTML=h||'<p>No live trades</p>';
}
setInterval(()=>{if(liveTrades.length) renderLive();},1000);
function openLive(){renderLive(); document.getElementById('liveModal').classList.add('show');} function closeLive(){document.getElementById('liveModal').classList.remove('show');}
function openDetail(id){
 const t=liveTrades.find(x=>x.id===id); if(!t) return;
 document.getElementById('detailPage').classList.add('show');
 document.getElementById('dCoin').textContent=t.coin+' '+t.pct+'% - $'+t.entry.toFixed(2);
 document.getElementById('dAmt').textContent='$'+t.amount; document.getElementById('dStart').textContent=new Date(t.entryTime).toLocaleString(); document.getElementById('dEnd').textContent=new Date(t.endTime).toLocaleString();
 setTimeout(initDetail,100);
 const int=setInterval(()=>{
   let pnl=(t.type==='buy'?(curPrice-t.entry):(t.entry-curPrice))*(t.amount/80)*(t.pct/100*2);
   const rem=Math.max(0,Math.floor((t.endTime-Date.now())/1000));
   document.getElementById('dProf').textContent=(pnl>=0?'+$':'-$')+Math.abs(pnl).toFixed(2)+' ('+t.pct+'%)';
   document.getElementById('dProf').style.color=pnl>=0?'#16a34a':'#ef4444';
   document.getElementById('dTimer').textContent=rem+'s left';
   if(rem<=0) clearInterval(int);
 },300);
}
function closeDetail(){document.getElementById('detailPage').classList.remove('show');}
function showPop(title,desc,amt,win){
 document.getElementById('pTitle').textContent=title; document.getElementById('pDesc').textContent=desc; document.getElementById('pAmt').textContent=amt;
 document.getElementById('pTick').textContent=win?'✓':'✕'; document.getElementById('pTick').style.background=win?'#22c55e':'#ef4444';
 document.getElementById('pop').classList.add('show');
}
function closePop(){document.getElementById('pop').classList.remove('show');}