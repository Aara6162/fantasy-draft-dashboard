// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCkptb4M_tWHExnoLr5W6hxbGbPmDOxqBg",
  authDomain: "fantasy-draft-aarav.firebaseapp.com",
  projectId: "fantasy-draft-aarav",
  storageBucket: "fantasy-draft-aarav.firebasestorage.app",
  messagingSenderId: "604970787954",
  appId: "1:604970787954:web:86a0505f0ca0ce05be0eeb",
  measurementId: "G-H1WYFC5RNL"
};

// 1. Initialize the Firebase App
const app = initializeApp(firebaseConfig);

// 2. Initialize and EXPORT Auth (This fixes the 'auth' error)
export const auth = getAuth(app);

// 3. Initialize and EXPORT Firestore (This allows saving teams)
export const db = getFirestore(app);

export default app;