import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDBIq5c3t0T2Ej45drpBvLOY18F4gdQsKs",
    authDomain: "localizacao-ff8f0.firebaseapp.com",
    projectId: "localizacao-ff8f0",
    storageBucket: "localizacao-ff8f0.firebasestorage.app",
    messagingSenderId: "833055076725",
    appId: "1:833055076725:web:cf914a742d3fb13fa6633c"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);