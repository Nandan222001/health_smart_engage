const required = (key: string): string => {
  const value = import.meta.env[key] as string | undefined;
  if (!value) console.warn(`[env] Missing env variable: ${key}`);
  return value ?? "";
};

export const env = {
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined) || "/api",
  firebase: {
    apiKey: required("VITE_FIREBASE_API_KEY"),
    authDomain: required("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: required("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: required("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: required("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: required("VITE_FIREBASE_APP_ID"),
    measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined) ?? "",
  },
  auth: {
    enableDevTestAccounts:
      import.meta.env.DEV &&
      String(import.meta.env.VITE_ENABLE_DEV_TEST_ACCOUNTS ?? "false").toLowerCase() === "true",
    productAdminEmails: String(import.meta.env.VITE_PRODUCT_ADMIN_EMAILS ?? "")
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean),
    enableDevProductAdminFallback:
      import.meta.env.DEV &&
      String(import.meta.env.VITE_ENABLE_DEV_PRODUCT_ADMIN_FALLBACK ?? "true").toLowerCase() === "true",
    enableProdSuperadminHardcodedLogin:
      !import.meta.env.DEV &&
      String(import.meta.env.VITE_ENABLE_PROD_SUPERADMIN_HARDCODED_LOGIN ?? "false").toLowerCase() === "true",
  },
} as const;
