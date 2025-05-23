import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
// Analytics import completely removed to prevent React Native crash

const firebaseConfig = {
  apiKey: "AIzaSyCqsCUma9iMboUdHnL8Jrtph1sR2O0Mrjk",
  authDomain: "mentacrush.firebaseapp.com",
  databaseURL: "https://mentacrush-default-rtdb.firebaseio.com",
  projectId: "mentacrush",
  storageBucket: "mentacrush.firebasestorage.app",
  messagingSenderId: "737673462489",
  appId: "1:737673462489:web:ff3c4fdf27fa6e62e074c8",
  measurementId: "G-QLQ0C4BEH7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const rtdb = getDatabase(app);

// Analytics initialization completely removed to prevent React Native crash
// Mock analytics object to maintain API compatibility
const analytics = null;

const isDev = false; // Set to false for production mode

export { auth, db, storage, rtdb, analytics, isDev };
