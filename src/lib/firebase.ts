import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBWsXGgEvDOa6y9j5LVtU6imULey9Bks8I",
  authDomain: "lumina-24eb0.firebaseapp.com",
  projectId: "lumina-24eb0",
  storageBucket: "lumina-24eb0.firebasestorage.app",
  messagingSenderId: "888450762276",
  appId: "1:888450762276:web:bd011d2708e29536b7bab1",
  measurementId: "G-LNVKDF5F8L"
};

const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
