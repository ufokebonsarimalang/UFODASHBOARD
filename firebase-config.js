// Firebase Configuration
// Replace dengan credentials dari Firebase Console Anda

const firebaseConfig = {
  apiKey: "AIzaSyDxxxxxxxxxxxxxxxxxxxxxx", // Ganti dengan API key Anda
  authDomain: "ufodashboard-xxxxx.firebaseapp.com",
  databaseURL: "https://ufodashboard-xxxxx-default-rtdb.firebaseio.com",
  projectId: "ufodashboard-xxxxx",
  storageBucket: "ufodashboard-xxxxx.appspot.com",
  messagingSenderId: "xxxxxxxxxxxxxxx",
  appId: "1:xxxxxxxxxxxxx:web:xxxxxxxxxxxxxxx"
};

// Initialize Firebase
if(!window.firebaseInitialized) {
  firebase.initializeApp(firebaseConfig);
  window.firebaseInitialized = true;
}

const db = firebase.database();
const storage = firebase.storage();

console.log("✅ Firebase initialized successfully");