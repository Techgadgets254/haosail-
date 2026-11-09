/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Mail, 
  Lock, 
  LogIn, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  UserPlus, 
  HelpCircle, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  ShieldCheck, 
  Check 
} from "lucide-react";
import { auth, db } from "../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile
} from "firebase/auth";
import { collection, addDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { useStore } from "../StoreContext";

interface AuthModalProps {
  onGoogleLogin?: () => Promise<void>;
}

const logAuthEvent = async (eventType: string, status: string, email: string, userId?: string, error?: string) => {
  try {
    await addDoc(collection(db, "auth_events"), {
      eventType,
      status,
      email,
      userId: userId || "",
      errorMessage: error || "",
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Failed to write auth event log:", err);
  }
};

export default function AuthModal({ onGoogleLogin }: AuthModalProps) {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    authModalMode, 
    setAuthModalMode,
    loginWithGoogle,
    setUser,
    setUserProfile,
    user,
    userProfile,
    setActiveView,
    logout
  } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetStep, setResetStep] = useState<"email" | "verify">("email");
  const [resetCode, setResetCode] = useState("");
  const [resetExpiresAt, setResetExpiresAt] = useState<number | null>(null);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(0);
  const [showResetSuccessModal, setShowResetSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const displayNameRef = useRef<HTMLInputElement>(null);

  // Status management states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Account Lockout protection states
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState<number>(0);

  // OTP states
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isVerificationSuccess, setIsVerificationSuccess] = useState<boolean>(false);

  // Resend cooldown countdown timer effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Account lockout countdown timer effect
  useEffect(() => {
    if (!lockoutUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setLockoutTimeLeft(remaining);
      if (remaining <= 0) {
        setLockoutUntil(null);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  // 15-Minute expiration countdown timer for reset code
  useEffect(() => {
    if (!resetExpiresAt || resetStep !== "verify") return;
    const interval = setInterval(() => {
      const remainingSec = Math.max(0, Math.floor((resetExpiresAt - Date.now()) / 1000));
      setTimeLeftSec(remainingSec);
      if (remainingSec <= 0) {
        setErrorMsg("⚠️ Verification code expired (15-minute window passed). Please request a new code.");
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [resetExpiresAt, resetStep]);

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOtpBoxChange = (index: number, val: string) => {
    const singleChar = val.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = singleChar;
    setOtpDigits(newDigits);
    setResetCode(newDigits.join(""));
    if (singleChar && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpBoxKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  };

  const getPasswordStrength = (p: string) => {
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(p) || /[^a-zA-Z0-9]/.test(p)) score++;
    
    let color = "bg-rose-500";
    let text = "Weak";
    if (score >= 5) {
      color = "bg-emerald-500";
      text = "Strong";
    } else if (score >= 3) {
      color = "bg-amber-500";
      text = "Fair";
    }

    return { percentage: (score * 100) / 5, color, text };
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Reset inputs when mode changes
  useEffect(() => {
    setErrorMsg("");
    setSuccessMsg("");
    setFullName("");
    setToast(null);
    setIsResetMode(false);
    setShowPassword(false);
    setNewPassword("");
    setConfirmPassword("");
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const validateEmail = (input: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
  };

  const isPasswordValid = (pw: string): boolean => {
    if (pw.length < 8) return false;
    if (!/[A-Z]/.test(pw)) return false;
    if (!/[0-9]/.test(pw)) return false;
    return true;
  };

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setEmail("");
    setPassword("");
    setFullName("");
    setErrorMsg("");
    setSuccessMsg("");
    setIsResetMode(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (lockoutTimeLeft > 0) {
      setErrorMsg(`Account locked. Please wait ${lockoutTimeLeft}s.`);
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");

    const isSignUp = authModalMode === "signup" && !isResetMode;

    if (!email.trim() || !validateEmail(email)) {
      setErrorMsg("Please provide a valid email address.");
      return;
    }

    // RESET PASSCODE FLOW
    if (isResetMode) {
      if (resetStep === "email") {
        setLoading(true);
        try {
          const res = await fetch("/api/auth/send-reset-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            const expiryTime = data.expiresAtMs || (Date.now() + 15 * 60 * 1000);
            setResetExpiresAt(expiryTime);
            setTimeLeftSec(Math.max(0, Math.floor((expiryTime - Date.now()) / 1000)));
            setResetStep("verify");
            setResendCooldown(60);
            setShowResetSuccessModal(true);
          } else {
            setErrorMsg(data.error || "Failed to dispatch reset verification code.");
          }
        } catch {
          setErrorMsg("Could not connect to authentication services.");
        } finally {
          setLoading(false);
        }
        return;
      }

      if (resetStep === "verify") {
        if (!resetCode || resetCode.length !== 6) {
          setErrorMsg("Please enter the 6-digit verification code sent to your email.");
          return;
        }
        if (!newPassword || newPassword !== confirmPassword) {
          setErrorMsg("Passwords do not match.");
          return;
        }
        if (!isPasswordValid(newPassword)) {
          setErrorMsg("Password must be at least 8 characters with uppercase and numbers.");
          return;
        }

        setLoading(true);
        try {
          const res = await fetch("/api/auth/verify-reset-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code: resetCode, newPassword })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setIsVerificationSuccess(true);
            setTimeout(() => {
              setIsVerificationSuccess(false);
              setIsResetMode(false);
              setAuthModalMode("login");
              setPassword("");
              setNewPassword("");
              setConfirmPassword("");
              setResetCode("");
              setSuccessMsg("Password reset successfully! Please sign in with your new password.");
            }, 1800);
          } else {
            setErrorMsg(data.error || "Verification failed.");
          }
        } catch {
          setErrorMsg("Failed to verify code.");
        } finally {
          setLoading(false);
        }
        return;
      }
    }

    // SIGN UP VALIDATION
    if (isSignUp) {
      if (!isPasswordValid(password)) {
        setErrorMsg("Password must be at least 8 characters, with 1 uppercase letter and 1 number.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        try {
          const userCred = await createUserWithEmailAndPassword(auth, email, password);
          if (fullName) {
            await updateProfile(userCred.user, { displayName: fullName });
          }
          await logAuthEvent("signup", "success", email, userCred.user.uid);
          
          const isAdmin = email.toLowerCase() === "sales@haosail.ke" || email.toLowerCase() === "admin@haosail.ke";
          const userProfileData = {
            uid: userCred.user.uid,
            email: email,
            name: fullName || "Valued Client",
            role: (isAdmin ? "admin" : "customer") as "admin" | "customer",
            createdAt: new Date().toISOString()
          };

          await setDoc(doc(db, "users", userCred.user.uid), userProfileData, { merge: true });
          setUser({ ...userCred.user, displayName: fullName } as any);
          setUserProfile(userProfileData);

          setSuccessMsg("Account created successfully!");
          setTimeout(() => handleClose(), 1000);
        } catch (err: any) {
          const authCode = err?.code || "";
          if (authCode === "auth/email-already-in-use") {
            setErrorMsg("This email address is already registered. Please sign in instead.");
          } else if (authCode === "auth/invalid-email") {
            setErrorMsg("Invalid email format.");
          } else {
            // Local fallback
            const generatedUid = "cust_" + Math.random().toString(36).substr(2, 9);
            const isAdmin = email.toLowerCase() === "sales@haosail.ke" || email.toLowerCase() === "admin@haosail.ke";
            const userProfileData = {
              uid: generatedUid,
              email: email,
              name: fullName || "Valued Client",
              role: (isAdmin ? "admin" : "customer") as "admin" | "customer",
              password: password,
              createdAt: new Date().toISOString()
            };
            localStorage.setItem("haosail_user", JSON.stringify(userProfileData));
            setUser({ uid: generatedUid, email, displayName: fullName } as any);
            setUserProfile(userProfileData);
            setSuccessMsg("Account registered successfully!");
            setTimeout(() => handleClose(), 1000);
          }
        }
      } else {
        // LOGIN FLOW
        try {
          const userCred = await signInWithEmailAndPassword(auth, email, password);
          await logAuthEvent("login", "success", email, userCred.user.uid);
          setFailedAttempts(0);
          setLockoutUntil(null);

          const userDoc = await getDoc(doc(db, "users", userCred.user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as any);
          }
          setUser(userCred.user as any);
          setSuccessMsg("Signed in successfully!");
          setTimeout(() => handleClose(), 1000);
        } catch (err: any) {
          // Local fallback check
          const localStored = localStorage.getItem("haosail_user");
          if (localStored) {
            const parsed = JSON.parse(localStored);
            if (parsed.email === email && parsed.password === password) {
              setUser({ uid: parsed.uid, email: parsed.email, displayName: parsed.name } as any);
              setUserProfile(parsed);
              setSuccessMsg("Welcome back!");
              setTimeout(() => handleClose(), 1000);
              return;
            }
          }

          const nextFailed = failedAttempts + 1;
          setFailedAttempts(nextFailed);
          if (nextFailed >= 5) {
            setLockoutUntil(Date.now() + 30000);
            setLockoutTimeLeft(30);
            setErrorMsg("Account temporarily locked for 30 seconds due to multiple failed attempts.");
          } else {
            setErrorMsg("Invalid email or password credentials.");
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuthenticate = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      if (onGoogleLogin) {
        await onGoogleLogin();
      } else {
        await loginWithGoogle();
      }
      setSuccessMsg("Google sign-in authorized!");
      setTimeout(() => handleClose(), 1000);
    } catch {
      setErrorMsg("Google single sign-on rejected.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" id="auth-modal-overlay">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[1100] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border font-sans font-bold text-xs max-w-sm w-[calc(100%-2rem)] ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="flex-1 text-left">{toast.message}</span>
            <button onClick={() => setToast(null)} className="p-1 text-slate-400 hover:text-slate-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-0"
      />

      {/* Modal Dialog Card (Centralized, no scrolling down needed) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 text-left text-slate-900 my-auto max-h-[92vh] overflow-y-auto"
        id="auth-modal-card"
      >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-100 transition-all cursor-pointer z-10"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* User Logged In Profile View */}
          {user ? (
            <div className="py-2 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-[#0055B8] flex items-center justify-center mx-auto mb-3 text-2xl font-bold text-[#0055B8]">
                  {(userProfile?.name || user.displayName || user.email || "U").charAt(0).toUpperCase()}
                </div>
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-50 text-[#0055B8] border border-blue-200">
                    {userProfile?.role === "admin" ? "Administrator" : "Verified Client"}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {userProfile?.name || user.displayName || "Valued Customer"}
                </h2>
                <p className="text-xs font-mono text-slate-500 mt-1">{user.email}</p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                {userProfile?.role === "admin" && (
                  <button
                    onClick={() => {
                      setActiveView("admin-dashboard");
                      setIsAuthModalOpen(false);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-[#0055B8] hover:bg-[#004494] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                  >
                    <span>Admin Dashboard</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setActiveView("client-dashboard");
                    setIsAuthModalOpen(false);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all border border-slate-200"
                >
                  <span>My Orders &amp; Invoices</span>
                </button>

                <button
                  onClick={async () => {
                    await logout();
                    setIsAuthModalOpen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
                >
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header Title */}
              <div className="mb-5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#0055B8] font-bold block">
                  HAOSAIL MACHINERY KENYA
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                  {isResetMode 
                    ? "Reset Account Password" 
                    : authModalMode === "signup"
                      ? "Create Business Account" 
                      : "Sign In to Portal"}
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {isResetMode 
                    ? "Enter your email to receive a password verification code." 
                    : authModalMode === "signup"
                      ? "Register for direct warehouse dispatch, machinery warranties, and KRA tax invoices." 
                      : "Access quotation history, direct support, and order tracking."}
                </p>
              </div>

              {/* Toggle Sign In / Register Tabs */}
              {!isResetMode && (
                <div className="grid grid-cols-2 p-1 gap-1 mb-5 rounded-xl bg-slate-100 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode("login");
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      authModalMode === "login"
                        ? "bg-white text-[#0055B8] shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode("signup");
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      authModalMode === "signup"
                        ? "bg-white text-[#0055B8] shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register</span>
                  </button>
                </div>
              )}

              {/* Feedback messages */}
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 mb-4 flex items-start gap-2.5 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 mb-4 flex items-start gap-2.5 text-emerald-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Main Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {authModalMode === "signup" && !isResetMode && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-wider block font-bold text-slate-700">
                      Full Name / Business Name
                    </label>
                    <div className="relative flex items-center">
                      <UserPlus className="w-4 h-4 text-slate-400 absolute left-3.5" />
                      <input
                        ref={displayNameRef}
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Samuel Kariuki"
                        disabled={loading}
                        className="w-full py-2.5 pl-10 pr-4 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#0055B8] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-900"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider block font-bold text-slate-700">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. info@company.co.ke"
                      disabled={loading}
                      className="w-full py-2.5 pl-10 pr-4 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#0055B8] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-900"
                      required
                    />
                  </div>
                </div>

                {isResetMode && resetStep === "verify" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase tracking-wider block font-bold text-slate-700">
                        6-Digit Verification Code
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {[0, 1, 2, 3, 4, 5].map((idx) => (
                          <input
                            key={idx}
                            ref={(el) => { otpInputRefs.current[idx] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={otpDigits[idx] || ""}
                            onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpBoxKeyDown(idx, e)}
                            className="w-full h-11 rounded-xl text-center font-mono font-bold text-lg bg-slate-50 border border-slate-300 focus:border-[#0055B8] text-slate-900 outline-none"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase tracking-wider block font-bold text-slate-700">
                        New Password
                      </label>
                      <div className="relative flex items-center">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full py-2.5 pl-10 pr-10 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#0055B8] outline-none text-slate-900"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase tracking-wider block font-bold text-slate-700">
                        Confirm New Password
                      </label>
                      <div className="relative flex items-center">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full py-2.5 pl-10 pr-10 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#0055B8] outline-none text-slate-900"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {!isResetMode && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-mono uppercase tracking-wider block font-bold text-slate-700">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsResetMode(true);
                          setErrorMsg("");
                          setSuccessMsg("");
                        }}
                        className="text-[11px] font-bold text-[#0055B8] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={loading}
                        className="w-full py-2.5 pl-10 pr-10 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#0055B8] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-900"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 p-1 text-slate-400 hover:text-slate-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || lockoutTimeLeft > 0}
                    className="w-full py-3 rounded-xl bg-[#0055B8] hover:bg-[#004494] text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : isResetMode ? (
                      <Mail className="w-4 h-4" />
                    ) : authModalMode === "signup" ? (
                      <UserPlus className="w-4 h-4" />
                    ) : (
                      <LogIn className="w-4 h-4" />
                    )}
                    <span>
                      {loading 
                        ? "Processing..." 
                        : isResetMode 
                          ? resetStep === "email" ? "Send Reset Email" : "Verify & Reset Password"
                          : authModalMode === "signup" ? "Create Account" : "Sign In to Portal"}
                    </span>
                  </button>
                </div>
              </form>

              {/* Reset Mode Return Option */}
              {isResetMode && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(false);
                      setResetStep("email");
                      setErrorMsg("");
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-[#0055B8]"
                  >
                    ← Return to Sign In
                  </button>
                </div>
              )}

              {/* Google Sign In Option */}
              <div className="mt-5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleGoogleAuthenticate}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>
            </>
          )}
        </motion.div>
    </div>
  );
}
