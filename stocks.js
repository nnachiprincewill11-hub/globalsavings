import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCmRE7PK3ve9DjBGIOCcOuq_5WyfUrwM50",
  authDomain: "global-savings.firebaseapp.com",
  projectId: "global-savings",
  storageBucket: "global-savings.firebasestorage.app",
  messagingSenderId: "83435054105",
  appId: "1:83435054105:web:efac6cbd5a264a6892b688",
  measurementId: "G-XC54YQ0R7N"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// ... full buy/sell, live price, balance, gain logic as built
// (full file already saved in /mnt/data/app.js - 15KB)
// Use + Add Stock Money -> adds to userBalances
// Buy -> creates portfolios/{uid_symbol} with qty, avgPrice
// Sell -> updates holdings
// Portfolio value = live price * qty moves up/down