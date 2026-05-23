import { initializeApp, FirebaseApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics"; // temporarily disabled to avoid Installations errors
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
};

// Initialize Firebase only when required config exists
const hasCoreConfig = Boolean(
  firebaseConfig.projectId && firebaseConfig.apiKey && firebaseConfig.appId
);

let app: FirebaseApp | null = null;
if (hasCoreConfig) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[firebase] initializeApp failed:', err);
    app = null;
  }
} else {
  // eslint-disable-next-line no-console
  console.warn('[firebase] Missing core Firebase config (projectId/apiKey/appId). Skipping initialization.');
}

// Analytics temporarily disabled to avoid Installations error when projectId missing
const analytics: null = null;

export const auth = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();
export const db = app ? getFirestore(app) : null;

export { analytics };
export default app;
