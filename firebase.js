import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { isSupported, getAnalytics } from 'firebase/analytics';

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

// Initialize Analytics only if supported in this environment
let analytics = null;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
    console.log('Firebase Analytics initialized successfully');
  } else {
    console.log('Firebase Analytics is not supported in this environment');
  }
}).catch(error => {
  console.error('Error checking Analytics support:', error);
});

const isDev = false; // Set to false for production mode

export { auth, db, storage, rtdb, analytics, isDev };
