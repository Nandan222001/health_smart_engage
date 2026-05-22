import { useState } from "react";
import { useNavigate } from "react-router";
import { useSearchParams } from "react-router";
import { useEffect } from "react";
import { Shield, Eye, EyeOff, Sparkles, ShieldCheck, Building2, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import loginBg from "@/assets/login-bg.jpg";
import { auth } from "@/config/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { resetThetaPasswordDirect, submitOnboardingAccessRequest } from "@/services/api";

const SUPER_ADMIN_EMAIL = "thetahsesuperadmin@gmail.com";
const PRODUCT_ADMIN_EMAILS = new Set(
  [
    SUPER_ADMIN_EMAIL,
    ...String(import.meta.env.VITE_PRODUCT_ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  ],
);

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, signup, loginWithGoogle, isAuthenticated, user, logout } = useAuth();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const isProductAdminEmail = PRODUCT_ADMIN_EMAILS.has(email.trim().toLowerCase());
  const forceLoginView = searchParams.get("force") === "1";

  useEffect(() => {
    if (!forceLoginView || !isAuthenticated) return;
    logout();
  }, [forceLoginView, isAuthenticated, logout]);

  useEffect(() => {
    if (!isAuthenticated || forceLoginView) return;
    const normalizedUserEmail = user?.email?.trim().toLowerCase() || "";
    const isProductAdminUser = PRODUCT_ADMIN_EMAILS.has(normalizedUserEmail);
    navigate(isProductAdminUser ? "/auth/onboarding/admin" : "/", { replace: true });
  }, [isAuthenticated, user?.email, navigate, forceLoginView]);

  useEffect(() => {
    const mode = (searchParams.get("mode") || "").toLowerCase();
    if (mode === "signup") {
      setAuthMode("signup");
    } else if (mode === "signin" || mode === "login") {
      setAuthMode("signin");
    }
  }, [searchParams]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOrgCode = orgCode.trim().toUpperCase();
    if (authMode === "signup") {
      if (!isProductAdminEmail && !normalizedOrgCode) {
        setError("Please enter your organization code to create account.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Password and confirm password do not match.");
        return;
      }
    }

    setLoading(true);
    try {
      let result;
      if (authMode === "signup") {
        if (isProductAdminEmail) {
          result = await signup(email, password);
        } else {
          try {
            await resetThetaPasswordDirect(normalizedEmail, password, normalizedOrgCode);
            result = await login(normalizedEmail, password, normalizedOrgCode);
          } catch (err) {
            const rawMessage = err instanceof Error ? err.message : "";
            const msg = rawMessage.toLowerCase();
            const isUnprovisioned =
              msg.includes("no approved onboarding profile found") ||
              msg.includes("no_submission_or_org_mismatch") ||
              msg.includes("organization code not found") ||
              msg.includes("org code not found");

            if (isUnprovisioned) {
              await submitOnboardingAccessRequest(normalizedEmail, normalizedOrgCode);
              setInfoMessage(
                "Your account request has been sent to your organization admin for approval. You can sign in after approval.",
              );
              setPassword("");
              setConfirmPassword("");
              setAuthMode("signin");
              return;
            }
            throw err;
          }
        }
      } else {
        result = await login(email, password);
      }

      if (result === "success") {
        if (PRODUCT_ADMIN_EMAILS.has(email.trim().toLowerCase())) {
          navigate("/auth/onboarding/admin", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } else if (result === "pending_approval") {
        setInfoMessage(
          authMode === "signup"
            ? "Account created. Access is pending admin approval."
            : "Your account is pending admin approval. You will be notified once access is granted.",
        );
      } else if (result === "user_not_found") {
        setError("No account found for this email. Create an account or contact your admin.");
      } else if (result === "password_setup_required") {
        if (authMode === "signin") {
          setAuthMode("signup");
          setPassword("");
          setConfirmPassword("");
          setInfoMessage("First-time login detected. Set your password once using 'Forgot with Theta', then sign in.");
        } else {
          setAuthMode("signin");
          setPassword("");
          setConfirmPassword("");
          setInfoMessage("This email is already registered. Use Sign in. If this is your first login, click 'Forgot with Theta' to set password. If this email is linked to Google, use Continue with Google.");
        }
      } else if (result === "network_error") {
        setError("Network issue while signing in. Check connection and try again.");
      } else if (result === "access_denied") {
        setError("Web app access is allowed only for Admin role. If your role is Site Engineer / Site Inspector / Worker, please login in the mobile app.");
      } else if (result === "invalid_credentials") {
        setError(
          authMode === "signup"
            ? "Could not create account. Email may already exist or password may be too weak."
            : "Invalid email or password. If this is your first login or recently changed password, use 'Forgot with Theta' and try again.",
        );
      } else {
        if (authMode === "signin") {
          if (isProductAdminEmail) {
            setError("Unable to sign in to admin web access right now. Please verify credentials and try again.");
          } else {
            setError("Unable to sign in right now. Please verify credentials and try again. If this is your first login, use 'Forgot with Theta' to set/reset password.");
          }
        } else {
          setError("Could not create account right now. Please try again.");
        }
      }
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "";
      const msg = rawMessage.toLowerCase();
      if (authMode === "signin") {
        if (isProductAdminEmail) {
          setError("Unable to sign in to admin web access right now. Please verify credentials and try again.");
        } else {
          setError("Unable to sign in right now. Please verify credentials and try again. If this is your first login, use 'Forgot with Theta' to set/reset password.");
        }
      } else {
        if (msg.includes("organization code not found") || msg.includes("org code not found")) {
          setError("Account request failed: organization code not found. Please verify the code and try again.");
        } else if (msg.includes("no approved onboarding profile found") || msg.includes("no_submission_or_org_mismatch")) {
          setError("Account setup failed. We could not map this email to your organization. Please retry with the correct org code or contact your org admin.");
        } else if (msg.includes("password reset is available only after admin approval") || msg.includes("pending")) {
          setError("Account setup is blocked until onboarding approval is complete for this organization.");
        } else if (msg.includes("api error") || msg.includes("error")) {
          setError(rawMessage || "Account setup failed. Please verify email, org code, and approval status.");
        } else {
          setError("Account setup failed. Please verify email and organization code, then try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setInfoMessage("");
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result === "success") {
        // Redirect is handled centrally by auth-state effect above.
        return;
      } else if (result === "pending_approval") {
        setInfoMessage(
          authMode === "signup"
            ? "Google account connected. Access is pending admin approval."
            : "Your account is pending admin approval. You will be notified once access is granted.",
        );
      } else if (result === "network_error") {
        setError("Network issue while using Google sign-in. Please try again.");
      } else if (result === "access_denied") {
        setError("Web app access is allowed only for Admin role. If your role is Site Engineer / Site Inspector / Worker, please login in the mobile app.");
      } else {
        setError(
          authMode === "signup"
            ? "Failed to create account with Google. Please try again."
            : "Failed to sign in with Google. Please try again.",
        );
      }
    } catch {
      setError("An error occurred during Google sign-in.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotGoogle = async () => {
    setError("");
    setInfoMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Enter your email first, then click Forgot password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      setInfoMessage("Password reset link sent. Check your email to create a new password.");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/user-not-found") {
        setError("No login account exists for this email yet. Ask admin to complete account provisioning.");
        return;
      }
      setError("Could not send reset link. Please try again.");
    }
  };

  const handleForgotTheta = async () => {
    setError("");
    setInfoMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOrgCode = orgCode.trim().toUpperCase();
    if (!normalizedEmail) {
      setError("Enter your email first, then use Forgot with Theta.");
      return;
    }

    try {
      const newPassword = window.prompt("Enter your new password (minimum 8 characters)") || "";
      if (!newPassword || newPassword.length < 8) {
        setError("Password reset cancelled. New password must be at least 8 characters.");
        return;
      }

      await resetThetaPasswordDirect(normalizedEmail, newPassword, normalizedOrgCode || undefined);
      setInfoMessage("Password changed successfully. Please sign in with your new password.");
      setPassword("");
      setConfirmPassword("");
      setAuthMode("signin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Theta password reset failed.");
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left Panel — Background Image with Overlay */}
      <div className="hidden lg:flex w-[55%] relative items-center justify-center overflow-hidden">
        {/* Background image */}
        <img
          src={loginBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(10,22,48,0.94) 0%, rgba(11,61,145,0.86) 50%, rgba(29,78,216,0.82) 100%)' }}
        />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.06]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-lg px-12">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
          >
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1
            className="text-white mb-4"
            style={{ fontSize: '42px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, letterSpacing: '-0.5px' }}
          >
            HSE Intelligence
          </h1>
          <p className="text-white/80 mb-16" style={{ fontSize: '18px', fontFamily: 'DM Sans, sans-serif' }}>
            Intelligent Safety. Proactive Protection.
          </p>

          <div className="space-y-6 text-left">
            {[
              { icon: Sparkles, title: "Real-time Monitoring", desc: "AI-powered violation tracking across all sites" },
              { icon: ShieldCheck, title: "Smart Compliance", desc: "Automated audit trails and regulatory reporting" },
              { icon: Building2, title: "Multi-site Management", desc: "Centralized control for enterprise-wide safety" },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}
                >
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-white text-[15px] block" style={{ fontWeight: 600 }}>{feature.title}</span>
                  <span className="text-white/60 text-[13px]">{feature.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom branding */}
          <div className="mt-20 text-white/40 text-[12px]">
            © 2026 HSE Intelligence Platform. Enterprise Edition.
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="w-full lg:w-[45%] bg-white flex flex-col items-center justify-center px-8 sm:px-16">
        <div className="w-full max-w-[400px]">
          {/* Small logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)' }}
            >
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-[14px]" style={{ color: '#0B3D91', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>
              HSE Intelligence
            </span>
          </div>

          <h1
            className="mb-2"
            style={{ fontSize: '28px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: '#0A0A0A' }}
          >
            {authMode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mb-8 text-[14px]" style={{ color: '#4A5568' }}>
            {authMode === "signin"
              ? "Sign in to access your safety workspace"
              : "Create an account to get started with your safety workspace"}
          </p>

          <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-lg" style={{ background: '#F3F7FF' }}>
            <button
              type="button"
              onClick={() => {
                setAuthMode("signin");
                setError("");
                setInfoMessage("");
              }}
              className="h-10 rounded-md text-[13px] font-semibold transition-all"
              style={{
                background: authMode === "signin" ? 'linear-gradient(135deg, #0B3D91, #1D4ED8)' : 'transparent',
                color: authMode === "signin" ? '#ffffff' : '#4A5568',
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("signup");
                setError("");
                setInfoMessage("");
              }}
              className="h-10 rounded-md text-[13px] font-semibold transition-all"
              style={{
                background: authMode === "signup" ? 'linear-gradient(135deg, #0B3D91, #1D4ED8)' : 'transparent',
                color: authMode === "signup" ? '#ffffff' : '#4A5568',
              }}
            >
              Create account
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-lg mb-6 text-[13px]"
              style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {infoMessage && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-lg mb-6 text-[13px]"
              style={{ background: '#EFF6FF', color: '#0B3D91', border: '1px solid #BFDBFE' }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {infoMessage}
            </div>
          )}

          {/* ─── Method 1: Credential Login (Active) ─── */}
          <form onSubmit={handleAuthSubmit} className="space-y-5">
            <div>
              <label
                className="block mb-1.5 text-[13px]"
                style={{ color: '#374151', fontWeight: 500 }}
              >
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="name@company.com"
                className="w-full h-11 px-4 rounded-lg border text-[14px] transition-all focus:outline-none"
                style={{ borderColor: '#E2E8E2', color: '#0A0A0A', background: '#fff' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#1D4ED8';
                  e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.16)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E2E8E2';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {authMode === "signup" && !isProductAdminEmail && (
              <div>
                <label
                  className="block mb-1.5 text-[13px]"
                  style={{ color: '#374151', fontWeight: 500 }}
                >
                  Organization Code
                </label>
                <input
                  type="text"
                  value={orgCode}
                  onChange={(e) => { setOrgCode(e.target.value.toUpperCase()); setError(""); }}
                  placeholder="e.g. IN_ACME_7A3F2C"
                  className="w-full h-11 px-4 rounded-lg border text-[14px] transition-all focus:outline-none"
                  style={{ borderColor: '#E2E8E2', color: '#0A0A0A', background: '#fff' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1D4ED8';
                    e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.16)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E2E8E2';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <p className="mt-1 text-[11px]" style={{ color: '#9CA3AF' }}>
                  Required for first-time account setup to map your email to the correct organization.
                </p>
              </div>
            )}

            <div>
              <label
                className="block mb-1.5 text-[13px]"
                style={{ color: '#374151', fontWeight: 500 }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  className="w-full h-11 px-4 pr-12 rounded-lg border text-[14px] transition-all focus:outline-none"
                  style={{ borderColor: '#E2E8E2', color: '#0A0A0A', background: '#fff' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1D4ED8';
                    e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.16)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E2E8E2';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 transition-colors"
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" style={{ color: '#9CA3AF' }} />
                    : <Eye className="w-4 h-4" style={{ color: '#9CA3AF' }} />
                  }
                </button>
              </div>
              {authMode === "signin" && (
                <div className="mt-2">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={handleForgotGoogle} className="text-[13px] hover:underline" style={{ color: '#1D4ED8', fontWeight: 500 }}>
                      Forgot with Google
                    </button>
                    <span style={{ color: '#9CA3AF', fontSize: 12 }}>|</span>
                    <button type="button" onClick={handleForgotTheta} className="text-[13px] hover:underline" style={{ color: '#0B3D91', fontWeight: 600 }}>
                      Forgot with Theta
                    </button>
                  </div>
                  <p className="mt-1 text-[11px]" style={{ color: '#6B7280' }}>
                    First-time login? Click <strong>Forgot with Theta</strong> to create your password, then sign in.
                  </p>
                </div>
              )}
            </div>

            {authMode === "signup" && (
              <div>
                <label
                  className="block mb-1.5 text-[13px]"
                  style={{ color: '#374151', fontWeight: 500 }}
                >
                  Confirm password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  className="w-full h-11 px-4 rounded-lg border text-[14px] transition-all focus:outline-none"
                  style={{ borderColor: '#E2E8E2', color: '#0A0A0A', background: '#fff' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1D4ED8';
                    e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.16)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E2E8E2';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg text-white text-[14px] transition-all flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-70"
              style={{
                background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)',
                fontWeight: 600,
              }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                authMode === "signin" ? "Sign in" : "Create account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-7">
            <div className="flex-1 h-px" style={{ background: '#E2E8E2' }} />
            <span className="px-4 text-[12px]" style={{ color: '#9CA3AF' }}>recommended</span>
            <div className="flex-1 h-px" style={{ background: '#E2E8E2' }} />
          </div>

          {/* ─── Method 2: Google Login (Enabled) ─── */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full h-11 rounded-lg border text-[14px] transition-all flex items-center justify-center gap-3 mb-3 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ borderColor: '#E2E8E2', color: '#4A5568', fontWeight: 500, background: '#fff' }}
            title={authMode === "signin" ? "Sign in with Google" : "Create account with Google"}
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {authMode === "signin" ? "Continue with Google" : "Create account with Google"}
              </>
            )}
          </button>

          <p className="text-[11px] mb-3" style={{ color: '#9CA3AF' }}>
            Google SSO is the primary access gate. Manual email sign-in/sign-up is also supported.
          </p>

          {/* ─── Method 3: Theta Login (Disabled) ─── */}
          <button
            disabled
            className="w-full h-11 rounded-lg border text-[14px] transition-all flex items-center justify-center gap-3 cursor-not-allowed opacity-50"
            style={{ borderColor: '#E2E8E2', color: '#4A5568', fontWeight: 500, background: '#FAFAFA' }}
            title="Theta SSO — Coming Soon"
          >
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-[11px] text-white"
              style={{ background: 'linear-gradient(135deg, #0B3D91, #3B82F6)', fontWeight: 700 }}
            >
              θ
            </div>
            Sign in with Theta
            <span
              className="text-[9px] px-2 py-0.5 rounded-full uppercase ml-1"
              style={{ background: '#E2E8E2', color: '#9CA3AF', fontWeight: 600 }}
            >
              Soon
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/auth/onboarding/form")}
            className="w-full h-11 rounded-lg border text-[14px] transition-all flex items-center justify-center gap-2 mt-3 hover:bg-blue-50"
            style={{ borderColor: '#BFDBFE', color: '#0B3D91', fontWeight: 600, background: '#F4F8FF' }}
            title="Open onboarding"
          >
            Onboarding
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => navigate("/auth/onboarding/tracker")}
            className="w-full h-11 rounded-lg border text-[14px] transition-all flex items-center justify-center gap-2 mt-3 hover:bg-blue-50"
            style={{ borderColor: '#C7D2FE', color: '#0B3D91', fontWeight: 600, background: '#FFFFFF' }}
            title="Track onboarding request"
          >
            Track Request
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Footer */}
          <p className="text-center mt-8 text-[13px]" style={{ color: '#9CA3AF' }}>
            {authMode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="hover:underline"
              style={{ color: '#1D4ED8', fontWeight: 500 }}
              onClick={() => {
                setAuthMode(authMode === "signin" ? "signup" : "signin");
                setError("");
                setInfoMessage("");
              }}
            >
              {authMode === "signin" ? "Create account" : "Sign in"}
            </button>
          </p>

          <p className="text-center mt-4 text-[11px]" style={{ color: '#C4C4C4' }}>
            Protected by enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  );
}
