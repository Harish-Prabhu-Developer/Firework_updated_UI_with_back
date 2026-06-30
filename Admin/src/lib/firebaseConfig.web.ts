// Admin/src/lib/firebaseConfig.web.ts
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCRW3P5cfp2tC5181z1cUgQlDxxwJdosOM",
  authDomain: "crackers-kingdom.firebaseapp.com",
  projectId: "crackers-kingdom",
  storageBucket: "crackers-kingdom.firebasestorage.app",
  messagingSenderId: "96958305522",
  appId: "1:96958305522:web:054a2df7ec74fa957c2c6b",
  measurementId: "G-JKT69HR98W"
};

// ── Web Push VAPID Key ──
// Generate this in Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
// Click "Generate key pair" and paste the public key here
export const VAPID_KEY = 'PASTE_YOUR_VAPID_PUBLIC_KEY';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics: any = null;

isSupported().then(yes => { if (yes) analytics = getAnalytics(app); }).catch(() => { });

export { app, analytics };
