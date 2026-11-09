import React, { useState, useEffect } from "react";
import { 
  BellRing, 
  Search, 
  MessageSquare, 
  Phone, 
  Mail, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  RefreshCw, 
  Tag, 
  Package 
} from "lucide-react";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";

interface PriceAlertItem {
  id: string;
  email?: string;
  phone?: string;
  customerName?: string;
  productId?: string;
  productName?: string;
  targetPrice?: number;
  currentPrice?: number;
  createdAt?: string;
  status?: "pending" | "notified" | "contacted";
  notes?: string;
}

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState<PriceAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    try {
      const q = collection(db, "price_alerts");
      const unsub = onSnapshot(q, (snap) => {
        const list: PriceAlertItem[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        list.sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        });
        setInquiries(list);
        setLoading(false);
      }, (err) => {
        console.warn("Could not listen to price_alerts collection:", err);
        setLoading(false);
      });
      return () => unsub();
    } catch (e) {
      setLoading(false);
    }
  }, []);

  const handleUpdateStatus = async (id: string, status: "pending" | "notified" | "contacted") => {
    try {
      await updateDoc(doc(db, "price_alerts", id), { status });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this quotation inquiry?")) return;
    try {
      await deleteDoc(doc(db, "price_alerts", id));
    } catch (err) {
      console.error("Failed to delete inquiry:", err);
    }
  };

  const filtered = inquiries.filter((inq) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      (inq.customerName || "").toLowerCase().includes(q) ||
      (inq.email || "").toLowerCase().includes(q) ||
      (inq.phone || "").toLowerCase().includes(q) ||
      (inq.productName || "").toLowerCase().includes(q)
    );
    const matchesStatus = filterStatus === "all" || inq.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-200 animate-fadeIn font-sans">
      {/* Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-[#0066CC] dark:text-blue-400 uppercase tracking-wider">SALES LEADS & QUOTATIONS</span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Customer Price Inquiries & Alerts</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Direct customer inquiries, restock requests, and price drop notifications awaiting sales follow-up.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search inquiries by client name, machinery model, or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none min-h-[40px]"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full sm:w-52 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none cursor-pointer min-h-[40px]"
        >
          <option value="all">All Inquiry Statuses</option>
          <option value="pending">Pending Follow-up</option>
          <option value="contacted">Contacted via WhatsApp</option>
          <option value="notified">Notified / Concluded</option>
        </select>
      </div>

      {/* Loading & Empty States */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center text-slate-500 dark:text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-[#0066CC] mx-auto mb-2" />
          <span>Loading quotation leads...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center text-slate-500 dark:text-slate-400">
          <BellRing className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="font-medium">No customer inquiries found.</p>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout (visible on phones, hidden on md+) */}
          <div className="md:hidden space-y-3">
            {filtered.map((inq) => {
              const isContacted = inq.status === "contacted";
              const isNotified = inq.status === "notified";

              return (
                <div 
                  key={inq.id} 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block text-sm">
                        {inq.customerName || inq.email?.split("@")[0] || "Prospective Contractor"}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {inq.phone && <span className="font-mono">{inq.phone}</span>}
                        {inq.email && <span>&bull; {inq.email}</span>}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                      {inq.createdAt ? new Date(inq.createdAt).toLocaleDateString("en-KE", {
                        day: "2-digit",
                        month: "short"
                      }) : "Recent"}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Package className="w-4 h-4 text-[#0066CC] dark:text-blue-400 shrink-0" />
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">
                        {inq.productName || "General Machinery Catalog"}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      {inq.targetPrice ? (
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-xs">
                          KES {Number(inq.targetPrice).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Standard Price</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <select
                      value={inq.status || "pending"}
                      onChange={(e) => handleUpdateStatus(inq.id, e.target.value as any)}
                      className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border focus:outline-none cursor-pointer min-h-[36px] ${
                        isContacted
                          ? "bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800"
                          : isNotified
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      <option value="pending">Pending Follow-up</option>
                      <option value="contacted">Contacted on WhatsApp</option>
                      <option value="notified">Deal Closed / Notified</option>
                    </select>

                    <div className="flex items-center gap-1.5">
                      {inq.phone && (
                        <a
                          href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello! Thank you for your inquiry on the ${inq.productName || "Machinery"} with Haosail Machinery Kenya. How can we assist you with delivery and pricing?`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                          title="Chat on WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      )}

                      {inq.email && (
                        <a
                          href={`mailto:${inq.email}?subject=${encodeURIComponent(`Haosail Machinery Kenya: Quotation for ${inq.productName || "Equipment"}`)}`}
                          className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-[#0066CC] dark:text-blue-400 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                          title="Send Email Quotation"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        onClick={() => handleDelete(inq.id)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (hidden on mobile, visible on md+) */}
          <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-[11px] font-sans font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">CLIENT & CONTACT</th>
                    <th className="py-3.5 px-4">MACHINERY OF INTEREST</th>
                    <th className="py-3.5 px-4">TARGET BUDGET (KES)</th>
                    <th className="py-3.5 px-4">DATE LOGGED</th>
                    <th className="py-3.5 px-4">STATUS</th>
                    <th className="py-3.5 px-4 text-right">QUICK OUTREACH</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-sans">
                  {filtered.map((inq) => {
                    const isContacted = inq.status === "contacted";
                    const isNotified = inq.status === "notified";

                    return (
                      <tr key={inq.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        {/* Client */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {inq.customerName || inq.email?.split("@")[0] || "Prospective Contractor"}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {inq.phone && <span className="font-mono">{inq.phone}</span>}
                              {inq.email && <span>&bull; {inq.email}</span>}
                            </div>
                          </div>
                        </td>

                        {/* Machine */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-[#0066CC] dark:text-blue-400 shrink-0" />
                            <span className="font-bold text-slate-900 dark:text-white line-clamp-1">
                              {inq.productName || "General Machinery Catalog"}
                            </span>
                          </div>
                        </td>

                        {/* Target Price */}
                        <td className="py-3.5 px-4">
                          {inq.targetPrice ? (
                            <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                              KES {Number(inq.targetPrice).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">Standard Price</span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {inq.createdAt ? new Date(inq.createdAt).toLocaleDateString("en-KE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          }) : "Recent"}
                        </td>

                        {/* Status Dropdown */}
                        <td className="py-3.5 px-4">
                          <select
                            value={inq.status || "pending"}
                            onChange={(e) => handleUpdateStatus(inq.id, e.target.value as any)}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                              isContacted
                                ? "bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800"
                                : isNotified
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                            }`}
                          >
                            <option value="pending">Pending Follow-up</option>
                            <option value="contacted">Contacted on WhatsApp</option>
                            <option value="notified">Deal Closed / Notified</option>
                          </select>
                        </td>

                        {/* Quick Outreach */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {inq.phone && (
                              <a
                                href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello! Thank you for your inquiry on the ${inq.productName || "Machinery"} with Haosail Machinery Kenya. How can we assist you with delivery and pricing?`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 transition-colors"
                                title="Chat on WhatsApp"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </a>
                            )}

                            {inq.email && (
                              <a
                                href={`mailto:${inq.email}?subject=${encodeURIComponent(`Haosail Machinery Kenya: Quotation for ${inq.productName || "Equipment"}`)}`}
                                className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-[#0066CC] dark:text-blue-400 transition-colors"
                                title="Send Email Quotation"
                              >
                                <Mail className="w-4 h-4" />
                              </a>
                            )}

                            <button
                              onClick={() => handleDelete(inq.id)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                              title="Delete Lead"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
