import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  Clock,
  User,
  Filter
} from "lucide-react";

interface AuthEvent {
  id: string;
  eventType: string;
  status: "success" | "failed";
  email: string;
  userId?: string;
  errorMessage?: string;
  createdAt: string;
}

export default function AuditLogTable() {
  const [events, setEvents] = useState<AuthEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchEmail, setSearchEmail] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "auth_events"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: AuthEvent[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as AuthEvent);
      });
      setEvents(list);
      setLoading(false);
    }, (error) => {
      console.warn("Auth events logs notice:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Filtering logic
  const filteredEvents = events.filter((ev) => {
    const matchesEmail = ev.email?.toLowerCase().includes(searchEmail.toLowerCase());
    const matchesType = typeFilter === "all" || ev.eventType === typeFilter;
    const matchesStatus = statusFilter === "all" || ev.status === statusFilter;
    return matchesEmail && matchesType && matchesStatus;
  });

  // Pagination index builders
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

  // Auto reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchEmail, typeFilter, statusFilter]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-slate-800">
      
      {/* Header section with Shield indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[#0066CC]">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="font-sans font-bold text-lg tracking-tight text-slate-900">
              AUTHENTICATION AUDIT LOGS
            </h2>
            <p className="text-xs text-slate-600 font-sans mt-0.5">
              Live monitoring of user registry actions, sign-in attempts, and credential resets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono py-1.5 px-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span>REAL-TIME STREAMING ACTIVE</span>
        </div>
      </div>

      {/* Control panel containing Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        {/* Search input field */}
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search auditing events by client email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 transition-all font-sans"
          />
        </div>

        {/* Filter type dropdown */}
        <div className="md:col-span-3">
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 appearance-none focus:outline-none focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 transition-all font-sans cursor-pointer font-medium"
            >
              <option value="all">Any Security Action</option>
              <option value="login">Account Sign-In (Email)</option>
              <option value="google_login">Google SSO Authentication</option>
              <option value="signup">New Space SignUp</option>
              <option value="password_reset_request_generated">Password Reset Requested (15m Expiry)</option>
              <option value="password_reset_completed">Password Reset Completed</option>
              <option value="password_reset_expired">Password Reset Expired / Blocked</option>
              <option value="auto_logout_inactivity">Auto-Logout (35m Inactivity)</option>
            </select>
            <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Filter Status */}
        <div className="md:col-span-3">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 appearance-none focus:outline-none focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 transition-all font-sans cursor-pointer font-medium"
            >
              <option value="all">Any Status Result</option>
              <option value="success">Success Handshake (✔)</option>
              <option value="failed">Failed/Rejected Attempt (✖)</option>
            </select>
            <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table section */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white">
        {loading ? (
          <div className="py-16 text-center text-slate-600 space-y-3 font-sans text-xs">
            <RefreshCw className="w-5 h-5 mx-auto animate-spin text-[#0066CC]" />
            <p>Gathering authentication event records...</p>
          </div>
        ) : paginatedEvents.length === 0 ? (
          <div className="py-16 text-center text-slate-600 font-sans text-xs">
            <p>No logged security actions match the filtering parameters.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 text-[11px] font-sans font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">TIMESTAMP</th>
                <th className="py-3.5 px-4">ACTION MODULE</th>
                <th className="py-3.5 px-4">CLIENT IDENTITY</th>
                <th className="py-3.5 px-4">USER ID</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4">HANDSHAKE DETAIL / EXCEPTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-sans">
              {paginatedEvents.map((ev) => {
                const isSuccess = ev.status === "success";
                
                // Read format string
                let actionLabel = ev.eventType;
                if (ev.eventType === "login") actionLabel = "Email Sign-In";
                if (ev.eventType === "signup") actionLabel = "New Registration";
                if (ev.eventType === "password_reset" || ev.eventType === "password_reset_direct") actionLabel = "Password Reset Request";
                if (ev.eventType === "password_reset_request_generated" || ev.eventType === "password_reset_email_sent") actionLabel = "Password Reset Email (15m Expiry)";
                if (ev.eventType === "password_reset_completed" || ev.eventType === "password_reset_complete") actionLabel = "Password Reset Completed";
                if (ev.eventType === "password_reset_expired") actionLabel = "Password Reset Expired (>15m)";
                if (ev.eventType === "auto_logout_inactivity") actionLabel = "Auto-Logout (35m Idle)";
                if (ev.eventType === "google_login") actionLabel = "Google SSO Auth";

                return (
                  <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {new Date(ev.createdAt).toLocaleString("en-KE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      })}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900">
                        {actionLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-800 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 font-medium">
                        <User className="w-3.5 h-3.5 text-[#0066CC]" />
                        {ev.email || "anonymous-attempt"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap max-w-[120px] truncate">
                      {ev.userId || "—"}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isSuccess ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-sans font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          SUCCESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-sans font-bold bg-red-50 text-red-700 border border-red-200">
                          <XCircle className="w-3 h-3 text-red-600" />
                          FAILED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={ev.errorMessage || "Completed successfully"}>
                      {isSuccess ? (
                        <span className="text-emerald-700 font-medium">Clear Authorization Handshake</span>
                      ) : (
                        <span className="text-red-600 font-mono text-[11px] font-bold">
                          {ev.errorMessage || "Request Rejected"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer block */}
      {filteredEvents.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-5 text-xs font-sans text-slate-600">
          <div>
            Showing <span className="text-slate-900 font-bold font-mono">{startIndex + 1}</span> to{" "}
            <span className="text-slate-900 font-bold font-mono">
              {Math.min(startIndex + itemsPerPage, filteredEvents.length)}
            </span>{" "}
            of <span className="text-slate-900 font-bold font-mono">{filteredEvents.length}</span> security events
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 px-3 rounded-lg bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1 font-bold text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>PREVIOUS</span>
            </button>
            <span className="font-mono text-slate-700 font-bold py-1 px-3 bg-slate-100 rounded-lg border border-slate-200">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 px-3 rounded-lg bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1 font-bold text-xs"
            >
              <span>NEXT</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
