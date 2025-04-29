import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "mentacrush-mvp.firebaseapp.com",
  projectId: "mentacrush-mvp",
  storageBucket: "mentacrush-mvp.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  databaseURL: "https://mentacrush-mvp.firebaseio.com" // Add this for Realtime Database
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const rtdb = getDatabase(app);

const isDev = true; // Force development mode for testing

export { auth, db, storage, rtdb, isDev };
