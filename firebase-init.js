console.log('Firebase Init Script Starting...');

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBZJYT8U392L9gJ2JNfP4sk2VCfpke7yo8",
  authDomain: "my-store-manager-8697b.firebaseapp.com",
  projectId: "my-store-manager-8697b",
  storageBucket: "my-store-manager-8697b.firebasestorage.app",
  messagingSenderId: "990849651692",
  appId: "1:990849651692:web:f9a424276483258337a6c9",
  measurementId: "G-KB2VEXMQQJ"
};

let app, auth, db, analytics;

try {
  // Initialize Firebase (Check if already initialized)
  if (getApps().length > 0) {
      app = getApp();
      console.log('Firebase App already initialized.');
  } else {
      app = initializeApp(firebaseConfig);
      console.log('Firebase App initialized new instance.');
  }
  
  analytics = getAnalytics(app);
  auth = getAuth(app);
  db = getFirestore(app);
  
  console.log('%c Firebase Configured Successfully! ', 'background: #22c55e; color: #fff; padding: 5px; border-radius: 4px;');
} catch (error) {
  console.error("Firebase Initialization Error:", error);
}

export { app, auth, db, analytics };