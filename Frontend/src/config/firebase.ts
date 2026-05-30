import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;

const FIREBASE_ENABLED = Boolean(apiKey && projectId);

let app: FirebaseApp | null = null;
let analytics: unknown = null;

if (FIREBASE_ENABLED) {
  try {
    app = initializeApp({
      apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
      projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
      appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
    });
    if (typeof window !== "undefined" && import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
      import("firebase/analytics").then(({ getAnalytics }) => {
        try { analytics = getAnalytics(app!); } catch { /* analytics optional */ }
      });
    }
  } catch (e) {
    console.warn("[firebase] Initialization failed:", e);
    app = null;
  }
}

export const auth: Auth = app ? getAuth(app) : ({
  currentUser: null,
  onAuthStateChanged: (nextOrObserver: unknown) => {
    if (typeof nextOrObserver === "function") nextOrObserver(null);
    else if (nextOrObserver && typeof (nextOrObserver as { next?: unknown }).next === "function")
      (nextOrObserver as { next: (u: null) => void }).next(null);
    return () => {};
  },
  signOut: () => Promise.resolve(),
} as unknown as Auth);
export const googleProvider = new GoogleAuthProvider();
export const db: Firestore = app ? getFirestore(app) : ({} as Firestore);

export { analytics };
export default app;
