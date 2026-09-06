// Firebase Configuration - UFO Dashboard
// Credentials sudah lengkap, tinggal pake!

const firebaseConfig = {
  apiKey: "AIzaSyBMokA92YiB87vwuqBREwNhHkkU_bXo8cI",
  authDomain: "ufokebonsariapps.firebaseapp.com",
  databaseURL: "https://ufokebonsariapps-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ufokebonsariapps",
  storageBucket: "ufokebonsariapps.firebasestorage.app",
  messagingSenderId: "663266923207",
  appId: "1:663266923207:web:5734d37ab5fe4fe73724e2"
};

// Initialize Firebase
if(!window.firebaseInitialized) {
  firebase.initializeApp(firebaseConfig);
  window.firebaseInitialized = true;
  console.log("✅ Firebase initialized successfully");
}

const db = firebase.database();
const storage = firebase.storage();

console.log("✅ Firebase DB & Storage ready");
