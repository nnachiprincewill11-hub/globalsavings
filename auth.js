import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const configured = firebaseConfig.apiKey !== "PASTE_YOUR_FIREBASE_WEB_API_KEY_HERE"
  && firebaseConfig.projectId !== "PASTE_YOUR_PROJECT_ID_HERE"
  && firebaseConfig.appId !== "PASTE_YOUR_APP_ID_HERE";
let auth = null;
if (configured) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}
function showMessage(message, isError = false) {
  const el = document.getElementById("auth-message");
  if (!el) return;
  el.textContent = message;
  el.style.background = isError ? "#fff0f0" : "#eef6ff";
  el.style.color = isError ? "#a11b1b" : "#174c8d";
  el.classList.add("show");
}
function firebaseError(error) {
  const map = {
    "auth/email-already-in-use": "That email already has an account. Try logging in instead.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Choose a stronger password with at least 6 characters.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/too-many-requests": "Too many attempts. Please wait a little and try again.",
    "auth/network-request-failed": "Network issue. Check your connection and try again."
  };
  return map[error.code] || "We couldn't complete that request. Check your Firebase setup and try again.";
}
const registerForm = document.getElementById("register-form");
registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!auth) return showMessage("Add your Firebase web config to firebase-config.js first.", true);
  const data = new FormData(registerForm);
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim();
  const password = String(data.get("password") || "");
  const confirmPassword = String(data.get("confirmPassword") || "");
  if (password !== confirmPassword) return showMessage("The passwords do not match.", true);
  const button = registerForm.querySelector('button[type="submit"]');
  button.disabled = true; button.textContent = "Creating account…";
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    showMessage("Account created successfully. You can now log in.");
    registerForm.reset();
  } catch (error) { showMessage(firebaseError(error), true); }
  finally { button.disabled = false; button.textContent = "Create Account"; }
});
const loginForm = document.getElementById("login-form");
loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!auth) return showMessage("Add your Firebase web config to firebase-config.js first.", true);
  const data = new FormData(loginForm);
  const email = String(data.get("email") || "").trim();
  const password = String(data.get("password") || "");
  const button = loginForm.querySelector('button[type="submit"]');
  button.disabled = true; button.textContent = "Logging in…";
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showMessage("Login successful. Authentication is working. A protected member dashboard can be added next.");
  } catch (error) { showMessage(firebaseError(error), true); }
  finally { button.disabled = false; button.textContent = "Log In"; }
});
document.getElementById("reset-password")?.addEventListener("click", async (event) => {
  event.preventDefault();
  if (!auth) return showMessage("Add your Firebase web config to firebase-config.js first.", true);
  const email = String(loginForm?.elements.email?.value || "").trim();
  if (!email) return showMessage("Enter your email address first, then choose Forgot password.", true);
  try { await sendPasswordResetEmail(auth, email); showMessage("If that email is registered, a password reset email will be sent."); }
  catch (error) { showMessage(firebaseError(error), true); }
});
