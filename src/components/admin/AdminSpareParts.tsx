import React, { useState, useEffect } from "react";
import { 
  Wrench, 
  Search, 
  Phone, 
  Mail, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  Tag, 
  Package, 
  AlertTriangle, 
  DollarSign, 
  MessageSquare, 
  MapPin, 
  ShieldAlert, 
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  X,
  FileSpreadsheet
} from "lucide-react";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { SparePartsRequest } from "../../types";

export default function AdminSpareParts() {
  const [requests, setRequests] = useState<SparePartsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUrgency, setFilterUrgency] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<SparePartsRequest | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit / Quote form state
  const [editStatus, setEditStatus] = useState<string>("submitted");
  const [editQuoteAmount, setEditQuoteAmount] = useState<string>("");
  const [editAdminNotes, setEditAdminNotes] = useState<string>("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    try {
      const colRef = collection(db, "spare_parts_requests");
      const unsub = onSnapshot(colRef, (snapshot) => {
        const list: SparePartsRequest[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        list.sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        });
        setRequests(list);
        setLoading(false);
      }, (err) => {
        console.warn("Could not listen to spare_parts_requests:", err);
        setLoading(false);
      });
      return () => unsub();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, []);

  const handleOpenEdit = (req: SparePartsRequest) => {
    setSelectedRequest(req);
    setEditStatus(req.status || "submitted");
    setEditQuoteAmount(req.quoteAmount ? String(req.quoteAmount) : "");
    setEditAdminNotes(req.adminNotes || "");
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest?.id) return;
    setSavingEdit(true);
    try {
      const reqRef = doc(db, "spare_parts_requests", selectedRequest.id);
      const updateData: any = {
        status: editStatus,
        adminNotes: editAdminNotes.trim(),
        updatedAt: new Date().toISOString()
      };
      if (editQuoteAmount.trim() !== "") {
        const parsed = Number(editQuoteAmount.replace(/[^0-9.]/g, ""));
        if (!isNaN(parsed) && parsed >= 0) {
          updateData.quoteAmount = parsed;
        }
      } else {
        updateData.quoteAmount = null;
      }

      await updateDoc(reqRef, updateData);
      setIsEditModalOpen(false);
      setSelectedRequest(null);
    } catch (err: any) {
      console.error("Failed to update spare parts request:", err);
      alert("Error updating request: " + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this spare parts request record?")) return;
    try {
      await deleteDoc(doc(db, "spare_parts_requests", id));
      if (selectedRequest?.id === id) {
        setIsEditModalOpen(false);
        setSelectedRequest(null);
      }
    } catch (err: any) {
      console.error("Failed to delete request:", err);
      alert("Delete failed: " + err.message);
    }
  };

  const handleExportCSV = () => {
    if (requests.length === 0) {
      alert("No spare parts requests available to export.");
      return;
    }
    const headers = [
      "Request ID",
      "Date",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Machinery Model",
      "Part Name",
      "Part OEM Code",
      "Quantity",
      "Urgency",
      "Status",
      "Quote Amount (KES)",
      "Location",
      "Serial Number",
      "Admin Notes"
    ];

    const rows = requests.map((r) => [
      `"${r.id || ""}"`,
      `"${r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-KE") : ""}"`,
      `"${(r.userName || "").replace(/"/g, '""')}"`,
      `"${(r.userEmail || "").replace(/"/g, '""')}"`,
      `"${(r.userPhone || "").replace(/"/g, '""')}"`,
      `"${(r.productName || "").replace(/"/g, '""')}"`,
      `"${(r.partName || "").replace(/"/g, '""')}"`,
      `"${(r.partNumber || "").replace(/"/g, '""')}"`,
      r.quantity || 1,
      `"${r.urgency || ""}"`,
      `"${r.status || ""}"`,
      r.quoteAmount || 0,
      `"${(r.workshopLocation || "").replace(/"/g, '""')}"`,
      `"${(r.machineSerialNumber || "").replace(/"/g, '""')}"`,
      `"${(r.adminNotes || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Haosail_Spare_Parts_Requests_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRequests = requests.filter((req) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      (req.userName || "").toLowerCase().includes(q) ||
      (req.userEmail || "").toLowerCase().includes(q) ||
      (req.userPhone || "").toLowerCase().includes(q) ||
      (req.productName || "").toLowerCase().includes(q) ||
      (req.partName || "").toLowerCase().includes(q) ||
      (req.partNumber || "").toLowerCase().includes(q) ||
      (req.machineSerialNumber || "").toLowerCase().includes(q) ||
      (req.workshopLocation || "").toLowerCase().includes(q) ||
      (req.id || "").toLowerCase().includes(q)
    );
    const matchesUrgency = filterUrgency === "all" || req.urgency === filterUrgency;
    const matchesStatus = filterStatus === "all" || req.status === filterStatus;
    return matchesSearch && matchesUrgency && matchesStatus;
  });

  const machineDownCount = requests.filter((r) => r.urgency === "machine_down").length;
  const pendingReviewCount = requests.filter((r) => r.status === "submitted" || r.status === "under_review").length;
  const quotedCount = requests.filter((r) => r.status === "quoted").length;
  const fulfilledCount = requests.filter((r) => r.status === "fulfilled" || r.status === "dispatched").length;

  const getUrgencyBadge = (urgency?: string) => {
    switch (urgency) {
      case "machine_down":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 animate-pulse">
            <ShieldAlert className="w-3 h-3 text-red-600 dark:text-red-400" />
            Machine Down
          </span>
        );
      case "urgent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Urgent Repair
          </span>
        );
      case "preventive":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950/40 text-[#0066CC] dark:text-[#3399FF] border border-blue-200 dark:border-blue-800">
            <Clock className="w-3 h-3 text-[#0066CC] dark:text-[#3399FF]" />
            Preventive
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Wrench className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            Routine
          </span>
        );
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "fulfilled":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Fulfilled
          </span>
        );
      case "dispatched":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950/40 text-[#0066CC] dark:text-[#3399FF] border border-blue-200 dark:border-blue-800">
            Dispatched / Ready
          </span>
        );
      case "quoted":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Quoted
          </span>
        );
      case "under_review":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Sourcing Parts
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950/40 text-[#0066CC] dark:text-[#3399FF] border border-blue-200 dark:border-blue-800">
            New Submission
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-200 animate-fadeIn font-sans">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#0066CC] dark:text-[#3399FF] uppercase tracking-wider">AFTER-SALES & FIELD SERVICES</span>
            {machineDownCount > 0 && (
              <span className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                {machineDownCount} Machine Down Alert{machineDownCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">Spare Parts & Repair Inquiries</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage genuine component requests for purchased machinery, issue quotations, and direct client dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-xs min-h-[40px]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Requests</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{requests.length}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending Review</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingReviewCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066CC] dark:text-[#3399FF]">Quoted / In Sourcing</span>
          <p className="text-2xl font-black text-[#0066CC] dark:text-[#3399FF] mt-1">{quotedCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Fulfilled & Dispatched</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{fulfilledCount}</p>
        </div>
      </div>

      {/* Search and Filters Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client, machine model, part description, serial no, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none min-h-[40px]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-[#0066CC] rounded-xl px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 font-bold focus:outline-none cursor-pointer min-h-[40px]"
          >
            <option value="all">All Urgencies</option>
            <option value="machine_down">Machine Down (Emergency)</option>
            <option value="urgent">Urgent Repair</option>
            <option value="preventive">Preventive Maintenance</option>
            <option value="routine">Routine Service</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-[#0066CC] rounded-xl px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 font-bold focus:outline-none cursor-pointer min-h-[40px]"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">New Submission</option>
            <option value="under_review">Under Review / Sourcing</option>
            <option value="quoted">Quoted</option>
            <option value="dispatched">Dispatched</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-xs">
          <Loader2 className="w-8 h-8 text-[#0066CC] animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Synchronizing spare parts inquiries ledger...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#0066CC] dark:text-[#3399FF] flex items-center justify-center mx-auto mb-3 border border-blue-100 dark:border-blue-800">
            <Wrench className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">No Spare Parts Requests Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || filterUrgency !== "all" || filterStatus !== "all"
              ? "No customer requests match your current search or filter criteria."
              : "When customers submit maintenance or replacement requests from their client dashboard, they will appear here in real-time."}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredRequests.map((req) => {
            const cleanPhone = (req.userPhone || "").replace(/[^0-9]/g, "");
            const whatsappNumber = cleanPhone.startsWith("0") ? `254${cleanPhone.slice(1)}` : cleanPhone;
            const whatsappText = encodeURIComponent(
              `Hello ${req.userName || "Customer"}, regarding your spare parts request #${(req.id || "").substring(0, 8).toUpperCase()} for ${req.productName} (${req.partName || "replacement parts"})${req.quoteAmount ? `. Official Quotation: KES ${Number(req.quoteAmount).toLocaleString()}` : ""}. How can our Haosail technical support assist you today?`
            );

            return (
              <div
                key={req.id}
                onClick={() => handleOpenEdit(req)}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 shadow-xs hover:border-[#0066CC] transition-all cursor-pointer ${
                  req.urgency === "machine_down" ? "border-red-200 dark:border-red-900 bg-red-50/10 dark:bg-red-950/10" : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        #{ (req.id || "").substring(0, 8).toUpperCase() }
                      </span>
                      {getUrgencyBadge(req.urgency)}
                      {getStatusBadge(req.status)}
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        {req.createdAt ? new Date(req.createdAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }) : ""}
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{req.productName}</span>
                      {req.orderId && (
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-normal">
                          (Order #{req.orderId.substring(0, 8).toUpperCase()})
                        </span>
                      )}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {req.quoteAmount ? (
                      <div className="text-right sm:mr-2">
                        <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Quoted Price</span>
                        <span className="text-xs sm:text-sm font-black text-[#0066CC] dark:text-[#3399FF]">
                          KES {Number(req.quoteAmount).toLocaleString()}
                        </span>
                      </div>
                    ) : null}

                    {whatsappNumber && (
                      <a
                        href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all min-h-[36px]"
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>
                    )}

                    <button
                      onClick={(e) => handleDelete(req.id!, e)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details Body */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 mt-3 text-xs">
                  <div className="md:col-span-8 space-y-2">
                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-[#0066CC] dark:text-[#3399FF]" />
                          {req.partName || "Component Needed"}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          Qty: <strong className="text-slate-800 dark:text-slate-200">{req.quantity || 1}</strong>
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line text-[11px]">
                        {req.partDescription}
                      </p>
                      {(req.partNumber || req.machineSerialNumber) && (
                        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          {req.partNumber && <span>OEM Code: <strong className="text-slate-700 dark:text-slate-300">{req.partNumber}</strong></span>}
                          {req.machineSerialNumber && <span>Serial No: <strong className="text-slate-700 dark:text-slate-300">{req.machineSerialNumber}</strong></span>}
                        </div>
                      )}
                    </div>

                    {req.adminNotes && (
                      <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900 rounded-xl p-2.5 text-[11px]">
                        <span className="font-bold text-[#0066CC] dark:text-[#3399FF] uppercase text-[9px] block tracking-wider">HaoSail Support Notes:</span>
                        <p className="text-slate-700 dark:text-slate-300 mt-0.5">{req.adminNotes}</p>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-4 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-3 space-y-1.5 text-[11px]">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] block">Client Contact</span>
                      <p className="font-bold text-slate-900 dark:text-white">{req.userName || "Customer"}</p>
                      <p className="text-slate-500 dark:text-slate-400 font-mono">{req.userEmail}</p>
                      {req.userPhone && <p className="text-slate-700 dark:text-slate-300 font-mono font-semibold">{req.userPhone}</p>}
                    </div>

                    {req.workshopLocation && (
                      <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700">
                        <span className="text-slate-400 dark:text-slate-500 text-[10px] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#0066CC] dark:text-[#3399FF]" />
                          Workshop Site
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 font-medium">{req.workshopLocation}</p>
                      </div>
                    )}

                    {req.photoUrl && (
                      <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700">
                        <a
                          href={req.photoUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#0066CC] dark:text-[#3399FF] hover:underline flex items-center gap-1 font-bold text-[10px]"
                        >
                          <span>View Attached Photo</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Quote Modal (Centered, no page scroll needed) */}
      {isEditModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-scaleUp my-auto max-h-[92vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-[#0066CC] dark:text-[#3399FF] uppercase tracking-wider">AFTER-SALES ACTION</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Update Spare Parts Request #{selectedRequest.id?.substring(0, 8).toUpperCase()}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1.5">
                  Request Processing Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none min-h-[42px]"
                >
                  <option value="submitted">Submitted (New Request)</option>
                  <option value="under_review">Under Review / Sourcing Parts</option>
                  <option value="quoted">Part Available & Quoted</option>
                  <option value="dispatched">Dispatched / Ready at Depot</option>
                  <option value="fulfilled">Fulfilled / Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1.5">
                  Quotation Amount (KES)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 dark:text-slate-500">KES</span>
                  <input
                    type="text"
                    placeholder="e.g. 15,000"
                    value={editQuoteAmount}
                    onChange={(e) => setEditQuoteAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl pl-12 pr-4 py-2.5 text-xs text-slate-900 dark:text-white font-mono font-bold focus:outline-none min-h-[42px]"
                  />
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                  Leave blank if quote is pending or free under factory warranty.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1.5">
                  Technician / Support Notes (Visible to Customer)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Genuine OEM seal kit in stock at Industrial Area warehouse. Estimated delivery: 24hrs via courier."
                  value={editAdminNotes}
                  onChange={(e) => setEditAdminNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-all cursor-pointer min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 min-h-[40px]"
                >
                  {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
