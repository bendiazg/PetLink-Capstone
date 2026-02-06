import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";



const firebaseConfig = {
  apiKey: "AIzaSyAKMN34mes5cTk8R1m1yiDLzopMjb03tjQ",
  authDomain: "petlink-13330.firebaseapp.com",
  projectId: "petlink-13330",
  storageBucket: "petlink-13330.firebasestorage.app",
  messagingSenderId: "713799801773",
  appId: "1:713799801773:web:cb98b16f764f20e8059f24"
};

const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);