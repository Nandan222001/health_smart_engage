import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyClVRzELcI0VfU73bXQaXun58ZbMl6MLb0",
  authDomain: "saas-421ae.firebaseapp.com",
  projectId: "saas-421ae",
  storageBucket: "saas-421ae.firebasestorage.app",
  messagingSenderId: "101673631672",
  appId: "1:101673631672:web:02556aa4ca2f1f6209d94d",
  measurementId: "G-Z7JGPM0M4D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser environment)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export { analytics };
export default app;
