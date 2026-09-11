// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC292sXEWaqkHIv5jgQpt65zaW1Jrr4Gik",
  authDomain: "my-kid-monitor.firebaseapp.com",
  projectId: "my-kid-monitor",
  storageBucket: "my-kid-monitor.firebasestorage.app",
  messagingSenderId: "44036488311",
  appId: "1:44036488311:web:8916524822d11166231a72",
  measurementId: "G-CN7YTSRBDE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
