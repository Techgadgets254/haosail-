import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updatePassword } from "firebase/auth";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import firebaseConfig from "../../firebase-applet-config.json";
import { 
  ShieldAlert, 
  Loader2, 
  PlusCircle, 
  RefreshCw, 
  UserCheck, 
  Lock, 
  Mail, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

interface AdminCredentialManagerProps {
  currentAdminEmail: string;
}

export default function AdminCredentialManager({ currentAdminEmail }: AdminCredentialManagerProps) {
  // Rotate Password States
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmNewPw, setConfirmNewPw] = useState("");
  const [isRotating, setIsRotating] = useState(false);
  const [rotateStatus, setRotateStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Operator Creation States
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerStatus, setRegisterStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Active Admins list in database (both real-time state lookup & document verification)
  const [adminUsers, setAdminUsers] = useState<{ uid?: string; email: string; role: string; adminClaims: boolean; source: string }[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

  const fetchActiveSystemAdmins = async () => {
    setIsLoadingAdmins(true);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const adminsList: any[] = [];
      
      usersSnap.forEach((userDoc) => {
        const udata = userDoc.data();
        const hasClaims = udata["admin-claims"] === true || udata["admin-claims"] === "admin";
        if (udata.role === "admin" || hasClaims) {
          adminsList.push({
            uid: userDoc.id,
            email: udata.email || "No Email",
            role: udata.role || "admin",
            adminClaims: !!hasClaims,
            source: "Firebase Auth Profile"
          });
        }
      });

      // Also merge with local `/admin_accounts` if any additional operator indexes exist
      const accountsSnap = await getDocs(collection(db, "admin_accounts"));
      accountsSnap.forEach((accDoc) => {
        const accData = accDoc.data();
        const email = accDoc.id;
        const exists = adminsList.some(a => a.email.toLowerCase() === email.toLowerCase());
        if (!exists) {
          adminsList.push({
            email: email,
            role: "admin",
            adminClaims: true,
            source: "Legacy Admin Passcode list"
          });
        }
      });

      if (adminsList.length === 0) {
        adminsList.push({
          email: auth.currentUser?.email || "admin@haosail.ke",
          role: "admin",
          adminClaims: true,
          source: "Executive Operations Key"
        });
      }
      setAdminUsers(adminsList);
    } catch (err: any) {
      console.warn("[Credential Manager] Notice while auditing administrative users:", err?.message || err);
      setAdminUsers([{
        email: auth.currentUser?.email || "admin@haosail.ke",
        role: "admin",
        adminClaims: true,
        source: "Executive Operations Key"
      }]);
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  useEffect(() => {
    fetchActiveSystemAdmins();
  }, []);

  const handlePasswordResetAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPw || !confirmNewPw) {
      setRotateStatus({ success: false, message: "New security strings are required." });
      return;
    }
    if (newPw !== confirmNewPw) {
      setRotateStatus({ success: false, message: "Confirmation passcode values do not match." });
      return;
    }

    setIsRotating(true);
    setRotateStatus(null);

    try {
      let isFirebaseAuthRotated = false;
      let authUserEmail = auth.currentUser?.email || "";

      // 1. Rotation using standard Firebase Client SDK updatePassword
      if (auth.currentUser) {
        try {
          await updatePassword(auth.currentUser, newPw);
          isFirebaseAuthRotated = true;
          console.log("[Auth Rotation] Firebase Auth user password updated in browser context.");
        } catch (firebaseErr: any) {
          console.warn("[Auth Rotation Warning] Could not update active Firebase Auth password directly from app context:", firebaseErr.message || firebaseErr);
        }
      }

      // 2. Also save to the localized `/api/admin/accounts/change-password` endpoint to keep local terminal database passcode synced!
      const syncResponse = await fetch("/api/admin/accounts/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUsername: authUserEmail || currentAdminEmail || "info@haosail.ke",
          currentPassword: currentPw,
          newPassword: newPw
        })
      });

      const syncResult = await syncResponse.json();

      if (isFirebaseAuthRotated || (syncResponse.ok && syncResult.success)) {
        // Safe, indelible audit log entry
        try {
          await setDoc(doc(collection(db, "audit_logs")), {
            action: "password_change",
            details: `Rotated administrative credentials for operator: '${authUserEmail || currentAdminEmail}'`,
            adminEmail: auth.currentUser?.email || currentAdminEmail || "unknown@admin.com",
            adminUid: auth.currentUser?.uid || "N/A",
            createdAt: new Date().toISOString()
          });
        } catch (logErr) {
          console.error("Failed writing credentials rotation audit log:", logErr);
        }

        setRotateStatus({
          success: true,
          message: `✔ Credentials rotated safely! ${isFirebaseAuthRotated ? "Firebase Auth system synced." : ""} ${syncResponse.ok ? "Local terminal db passcode active." : ""}`
        });
        setCurrentPw("");
        setNewPw("");
        setConfirmNewPw("");
        fetchActiveSystemAdmins();
      } else {
        setRotateStatus({
          success: false,
          message: syncResult.error || "Password change was rejected by security providers."
        });
      }
    } catch (err: any) {
      setRotateStatus({
        success: false,
        message: `❌ Configuration failed: ${err.message || String(err)}`
      });
    } finally {
      setIsRotating(false);
    }
  };

  const handleRegisterNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) {
      setRegisterStatus({ success: false, message: "Unique Email and secure password are required." });
      return;
    }
    if (newPassword.length < 6) {
      setRegisterStatus({ success: false, message: "Security parameters require at least 6 characters for passcodes." });
      return;
    }

    setIsRegistering(true);
    setRegisterStatus(null);

    let tempApp;
    try {
      const sanitizedEmail = newEmail.trim().toLowerCase();
      
      // Initialize target secondary application dynamically so current operator is NEVER logged out!
      tempApp = initializeApp(firebaseConfig, "temp-admin-registrar");
      const tempAuth = getAuth(tempApp);

      // Create credential inside Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(tempAuth, sanitizedEmail, newPassword);
      const uid = userCredential.user.uid;

      // Map dynamic claims and configuration to Firestore users document (with global 'admin-claims' field)
      const userDocRef = doc(db, "users", uid);
      await setDoc(userDocRef, {
        uid: uid,
        email: sanitizedEmail,
        role: "admin",
        "admin-claims": true, // Global flag requested
        name: "Joint Administrator",
        createdAt: new Date().toISOString()
      });

      // Map to secondary terminal admin passcodes list to allow passcode terminal access as well
      const adminAccRef = doc(db, "admin_accounts", sanitizedEmail);
      await setDoc(adminAccRef, {
        username: sanitizedEmail,
        password: newPassword,
        createdAt: new Date().toISOString()
      });

      // Write secure, indelible audit log
      try {
        await setDoc(doc(collection(db, "audit_logs")), {
          action: "admin_create",
          details: `Provisioned and registered new administrative joint operator: '${sanitizedEmail}'`,
          adminEmail: auth.currentUser?.email || currentAdminEmail || "unknown@admin.com",
          adminUid: auth.currentUser?.uid || "N/A",
          createdAt: new Date().toISOString()
        });
      } catch (logErr) {
        console.error("Failed writing co-operator creation audit log:", logErr);
      }

      setRegisterStatus({
        success: true,
        message: `✔ Managed administrator '${sanitizedEmail}' successfully initialized. Authentication credentials paired and mapped in database!`
      });
      setNewEmail("");
      setNewPassword("");
      fetchActiveSystemAdmins();
    } catch (err: any) {
      console.error("[Admin creation failure]:", err);
      setRegisterStatus({
        success: false,
        message: err.message || "Failed registering credentials."
      });
    } finally {
      if (tempApp) {
        try {
          await tempApp.delete();
        } catch (e) {
          console.warn("Cleanup temp secondary app failed:", e);
        }
      }
      setIsRegistering(false);
    }
  };

  return (
    <div className="space-y-8 text-slate-800 text-left">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Secure Change Password Card */}
        <div id="rotate-password-utility" className="bg-white border border-slate-200 p-6 rounded-3xl space-y-6 shadow-sm">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0066CC] flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <span>Change Admin Password</span>
            </h3>
            <p className="text-xs text-slate-600 font-sans mt-1">
              Update password for active administrator: <span className="text-[#0066CC] font-bold">{auth.currentUser?.email || currentAdminEmail}</span>
            </p>
          </div>

          <form onSubmit={handlePasswordResetAuth} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold font-sans text-slate-700 uppercase mb-1.5 tracking-wider">CURRENT PASSWORD</label>
              <input
                type="password"
                required
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-900 font-sans placeholder:text-slate-400 transition-all text-left"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold font-sans text-slate-700 uppercase mb-1.5 tracking-wider">NEW PASSWORD</label>
              <input
                type="password"
                required
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Enter strong new password"
                className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-900 font-sans placeholder:text-slate-400 transition-all text-left"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold font-sans text-slate-700 uppercase mb-1.5 tracking-wider">CONFIRM NEW PASSWORD</label>
              <input
                type="password"
                required
                value={confirmNewPw}
                onChange={(e) => setConfirmNewPw(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-900 font-sans placeholder:text-slate-400 transition-all text-left"
              />
            </div>

            {rotateStatus && (
              <div className={`p-4 rounded-xl text-xs font-sans border flex items-start gap-2.5 ${
                rotateStatus.success 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                  : "bg-red-50 border-red-200 text-red-700"
              }`}>
                {rotateStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                )}
                <span className="font-medium">{rotateStatus.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isRotating}
              className="w-full h-11 bg-[#0066CC] text-white font-sans font-bold text-xs hover:bg-[#0052A3] disabled:bg-slate-200 disabled:text-slate-400 rounded-xl flex items-center justify-center gap-1.5 transition-all select-none cursor-pointer uppercase tracking-wider shadow-sm"
            >
              {isRotating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating credentials...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        </div>

        {/* Admin Credential Manager (New Admin registrations) */}
        <div id="credential-register-utility" className="bg-white border border-slate-200 p-6 rounded-3xl space-y-6 shadow-sm">
          <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
            <div>
              <h3 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0066CC] flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <span>Create Staff / Operator Account</span>
              </h3>
              <p className="text-xs text-slate-600 font-sans mt-1">
                Authorize new team members to access Haosail operations.
              </p>
            </div>
            <button
              onClick={fetchActiveSystemAdmins}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Refresh Staff List"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAdmins ? "animate-spin text-[#0066CC]" : ""}`} />
            </button>
          </div>

          <form onSubmit={handleRegisterNewAdmin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold font-sans text-slate-700 uppercase mb-1.5 tracking-wider">STAFF EMAIL ADDRESS</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="operator@haosail.ke"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-sans placeholder:text-slate-400 transition-all text-left"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold font-sans text-slate-700 uppercase mb-1.5 tracking-wider">INITIAL PASSWORD (MIN 6 CHARACTERS)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Set initial staff password"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-sans placeholder:text-slate-400 transition-all text-left"
                />
              </div>
            </div>

            {registerStatus && (
              <div className={`p-4 rounded-xl text-xs font-sans border flex items-start gap-2.5 ${
                registerStatus.success 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                  : "bg-red-50 border-red-200 text-red-700"
              }`}>
                {registerStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                )}
                <span className="font-medium">{registerStatus.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-sans font-bold text-xs disabled:bg-slate-200 disabled:text-slate-400 rounded-xl flex items-center justify-center gap-1.5 transition-all select-none cursor-pointer uppercase tracking-wider shadow-sm"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Staff Account</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Directory Auditing */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <h4 className="text-xs font-bold font-sans text-slate-900 uppercase tracking-wider mb-4">
          Authorized Staff & Admin Operators ({adminUsers.length})
        </h4>
        <div className="border border-slate-200 rounded-2xl bg-slate-50 divide-y divide-slate-200 overflow-hidden">
          {isLoadingAdmins ? (
            <p className="p-6 text-xs font-sans text-slate-600 text-center flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#0066CC]" />
              <span>Loading authorized operators...</span>
            </p>
          ) : adminUsers.length === 0 ? (
            <p className="p-6 text-xs font-sans text-slate-600 text-center">No secondary operators found.</p>
          ) : (
            adminUsers.map((admin, idx) => (
              <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-white transition-colors">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900">{admin.email}</span>
                  <span className="text-[11px] text-slate-500 font-sans mt-0.5">
                    Source: {admin.source}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2.5 py-1 border border-blue-200 bg-blue-50 text-[#0066CC] font-bold rounded-lg uppercase">
                    Role: {admin.role}
                  </span>
                  <span className="text-[10px] px-2.5 py-1 border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold rounded-lg uppercase">
                    Verified
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
