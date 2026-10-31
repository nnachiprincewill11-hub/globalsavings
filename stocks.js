// firebaseConfig = YOUR global-savings config (already inserted)
// Uses your rules:
// stocks: read if signedIn, write if isMyAdmin()
// stockHoldings: create if uid == auth.uid
// stockPortfolio: isOwner(uid)

document.getElementById("confirmBuy").onclick = async()=>{
  // deduct from main
  await updateDoc(userRef,{balance: increment(-amount)});
  // add to stock balance
  await setDoc(portRef,{stockBalance: increment(amount)},{merge:true});
  // create holding showing gain = (current - buy)*qty
}

window.approveSell = async(tradeId, holdingId, uid, amount)=>{
  // admin only
  await setDoc(portRef,{stockBalance: increment(-amount)},{merge:true});
  await setDoc(userRef,{balance: increment(amount)},{merge:true});
}