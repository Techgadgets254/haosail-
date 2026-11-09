/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import { useStore } from "../StoreContext";
import PrintView from "./PrintView";
import { printInvoiceIframe } from "../utils/printInvoice";
import { 
  ShoppingBag, 
  Printer, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Truck, 
  Package, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Search,
  ExternalLink,
  Mail,
  Loader2,
  Bookmark,
  Download,
  XCircle,
  FileText,
  MessageSquare,
  Wrench,
  Building2,
  RefreshCw,
  Eye,
  CheckCircle2,
  Layers,
  PhoneCall,
  User as UserIcon,
  HardHat
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import LiveOrderTracker from "./LiveOrderTracker";
import ClientSparePartsForm from "./ClientSparePartsForm";
import MachineryServiceSchedules from "./MachineryServiceSchedules";
import { Order, Product, BulkQuoteRequest } from "../types";
import { jsPDF } from "jspdf";
import ProfileEditor from "./ProfileEditor";

/** Visual Order Progress Tracker component mapping Firestore order statuses */
export function OrderProgressTracker({ shippingStatus, paymentStatus }: { shippingStatus?: string; paymentStatus?: string }) {
  const ship = (shippingStatus || "").trim().toLowerCase();
  const pay = (paymentStatus || "").trim().toLowerCase();

  const isCancelled = ship === "cancelled" || pay === "cancelled" || pay === "failed";

  let currentStep = 1;
  if (isCancelled) {
    currentStep = -1;
  } else if (ship === "delivered" || ship === "completed") {
    currentStep = 4;
  } else if (ship === "shipped" || ship === "in transit" || ship === "out for delivery" || ship === "dispatched") {
    currentStep = 3;
  } else if (ship === "processing" || ship === "packed" || pay === "paid" || pay === "success" || pay === "completed") {
    currentStep = 2;
  } else {
    currentStep = 1;
  }

  const steps = [
    { id: 1, label: "Order Registered", desc: "Sales Notified", icon: Clock },
    { id: 2, label: "Processing", desc: "Warehouse Inspection", icon: Package },
    { id: 3, label: "Freight Dispatch", desc: "In Transit / Carrier", icon: Truck },
    { id: 4, label: "Delivered & Handover", desc: "Commissioned", icon: CheckCircle },
  ];

  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-xs flex items-center gap-3 no-print">
        <XCircle className="w-5 h-5 text-red-600 shrink-0" />
        <div>
          <p className="font-bold uppercase tracking-wide text-xs">Order Status: Cancelled</p>
          <p className="text-[11px] text-red-600/80 mt-0.5">This machinery order was cancelled or archived.</p>
        </div>
      </div>
    );
  }

  const progressPercent = Math.min(100, Math.max(0, ((currentStep - 1) / 3) * 100));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 no-print shadow-xs mb-4">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#0066CC]" />
          <span className="font-sans font-bold text-xs text-slate-900 uppercase tracking-wider">
            Dispatch &amp; Delivery Timeline
          </span>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0066CC] border border-blue-200 font-bold uppercase">
          Status: {shippingStatus || "Pending"}
        </span>
      </div>

      <div className="relative my-4 px-2">
        <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-slate-100 rounded-full z-0" />
        <div 
          className="absolute top-1/2 left-6 -translate-y-1/2 h-1 bg-[#0066CC] rounded-full z-0 transition-all duration-500"
          style={{ width: `calc(${progressPercent}% * 0.84)` }}
        />

        <div className="relative z-10 flex justify-between items-center">
          {steps.map((step) => {
            const Icon = step.icon;
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center text-center">
                <div 
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all border ${
                    isCompleted
                      ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs"
                      : isCurrent
                      ? "bg-[#0066CC] text-white border-[#0066CC] font-bold shadow-sm ring-4 ring-blue-100"
                      : "bg-slate-100 text-slate-400 border-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] sm:text-[11px] font-bold mt-2 font-sans ${
                  isCurrent ? "text-[#0066CC]" : isCompleted ? "text-emerald-700" : "text-slate-500"
                }`}>
                  {step.label}
                </span>
                <span className="text-[9px] font-mono text-slate-500 mt-0.5 hidden sm:block">
                  {step.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  const { 
    user, 
    orders, 
    products,
    invoiceOrderId, 
    setInvoiceOrderId, 
    setActiveView,
    setSelectedProductId,
    addToCart,
    wishlist,
    toggleWishlist,
    loginWithGoogle
  } = useStore();

  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Delivered" | "Cancelled">("All");

  // Tabs for ClientDashboard
  const [activeTab, setActiveTab] = useState<"orders" | "quotes" | "tracking" | "service_schedules" | "spare_parts" | "bookmarks" | "profile">("orders");
  const [sparePartsPrefill, setSparePartsPrefill] = useState<{
    name: string;
    id?: string;
    image?: string;
    orderId?: string;
    purchaseDate?: string;
  } | null>(null);

  // Bulk Quotes State
  const [bulkQuotes, setBulkQuotes] = useState<BulkQuoteRequest[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);

  // Email resending state
  const [resendingEmailId, setResendingEmailId] = useState<string | null>(null);
  const [emailResentSuccess, setEmailResentSuccess] = useState<string | null>(null);

  const userId = user?.uid;
  const userEmail = user?.email;

  // Load user bulk quotes from Firestore
  useEffect(() => {
    if (!userId && !userEmail) return;
    setQuotesLoading(true);

    try {
      const quotesCol = collection(db, "bulk_quotes");
      const q = userId 
        ? query(quotesCol, where("userId", "==", userId))
        : query(quotesCol, where("customerEmail", "==", userEmail));

      const unsub = onSnapshot(q, (snapshot) => {
        const list: BulkQuoteRequest[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as BulkQuoteRequest);
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setBulkQuotes(list);
        setQuotesLoading(false);
      }, (err) => {
        console.warn("Firestore bulk quotes listener note:", err);
        setQuotesLoading(false);
      });

      return () => unsub();
    } catch (e) {
      setQuotesLoading(false);
    }
  }, [userId, userEmail]);

  // Background Firestore listener for live product quantities and low stock badge detection
  const [firestoreStockMap, setFirestoreStockMap] = useState<Record<string, number>>({});
  const LOW_STOCK_THRESHOLD = 5;

  useEffect(() => {
    try {
      const prodCol = collection(db, "products");
      const unsub = onSnapshot(prodCol, (snapshot) => {
        const stockMap: Record<string, number> = {};
        snapshot.forEach((d) => {
          const data = d.data();
          if (typeof data.stock === "number") {
            stockMap[d.id] = data.stock;
          }
        });
        setFirestoreStockMap(stockMap);
      }, (err) => {
        console.warn("Firestore products stock listener notice:", err);
      });
      return () => unsub();
    } catch (e) {
      console.warn("Could not attach products stock listener:", e);
    }
  }, []);

  // Helper to retrieve live stock
  const getLiveProductStock = (prod: Product) => {
    if (typeof firestoreStockMap[prod.id] === "number") {
      return firestoreStockMap[prod.id];
    }
    return prod.stock ?? 10;
  };

  // Filter orders relevant to current client
  const clientOrders = useMemo(() => {
    return orders.filter(ord => {
      if (user) {
        if (ord.userId === user.uid) return true;
        if (ord.customerEmail && user.email && ord.customerEmail.toLowerCase() === user.email.toLowerCase()) return true;
      }
      return false;
    });
  }, [orders, user]);

  // Filter by query and status
  const filteredOrders = useMemo(() => {
    return clientOrders.filter((order) => {
      const matchesSearch = 
        order.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        (order.customerName && order.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase())) ||
        (order.shippingAddress && order.shippingAddress.toLowerCase().includes(orderSearchQuery.toLowerCase())) ||
        order.items?.some(i => i.name.toLowerCase().includes(orderSearchQuery.toLowerCase()));

      let matchesStatus = true;
      const status = (order.shippingStatus || "Pending").toLowerCase();
      if (statusFilter === "Pending") {
        matchesStatus = status === "pending" || status === "processing";
      } else if (statusFilter === "Delivered") {
        matchesStatus = status === "delivered" || status === "completed";
      } else if (statusFilter === "Cancelled") {
        matchesStatus = status === "cancelled";
      }

      return matchesSearch && matchesStatus;
    });
  }, [clientOrders, orderSearchQuery, statusFilter]);

  // Wishlist products
  const bookmarkedProducts = useMemo(() => {
    return products.filter(p => wishlist.includes(p.id));
  }, [products, wishlist]);

  const lowStockBookmarksCount = useMemo(() => {
    return bookmarkedProducts.filter(p => {
      const s = getLiveProductStock(p);
      return s > 0 && s <= LOW_STOCK_THRESHOLD;
    }).length;
  }, [bookmarkedProducts, firestoreStockMap]);

  // Metrics
  const totalSpend = useMemo(() => {
    return clientOrders.reduce((acc, ord) => acc + (Number(ord.totalAmount) || 0), 0);
  }, [clientOrders]);

  const activeOrdersCount = useMemo(() => {
    return clientOrders.filter(o => (o.shippingStatus || "pending").toLowerCase() !== "delivered" && (o.shippingStatus || "pending").toLowerCase() !== "cancelled").length;
  }, [clientOrders]);

  // View product details in shop
  const handleViewProduct = (productId?: string) => {
    if (productId) {
      setSelectedProductId(productId);
    }
    setActiveView("product-details");
  };

  // Handle WhatsApp Order Follow-up
  const handleSendOrderToWhatsApp = (order: Order) => {
    const itemsList = (order.items || []).map(i => `• ${i.name} (x${i.quantity}) - KES ${(i.price * i.quantity).toLocaleString()}`).join("\n");
    const msg = `Hello Haosail Machinery Sales Desk,

I would like to follow up on my machinery order:
🆔 *Order ID:* #${order.id.substring(0, 8).toUpperCase()}
👤 *Client Name:* ${order.customerName}
📞 *Phone:* ${order.customerPhone}
📍 *Delivery County:* ${order.county || "Nairobi"}
🏢 *Company:* ${order.companyName || "N/A"}

*Machinery Items:*
${itemsList}

💰 *Total Amount:* KES ${Number(order.totalAmount || 0).toLocaleString()}
💳 *Terms:* ${order.paymentMethod || "Pay on Delivery / Proforma Invoice"}

Please let me know the estimated delivery and commissioning schedule. Thank you!`;

    const url = `https://wa.me/254750707038?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  // Handle Resend Email Notification
  const handleResendEmail = async (order: Order) => {
    setResendingEmailId(order.id);
    try {
      const res = await fetch("/api/order/notify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          order: order,
          updateType: "Client Requested Copy"
        })
      });
      if (res.ok) {
        setEmailResentSuccess(order.id);
        setTimeout(() => setEmailResentSuccess(null), 4000);
      } else {
        alert("Email notification server was contacted. Our sales desk is reviewing your order.");
      }
    } catch (e) {
      console.error(e);
      alert("Notification request sent.");
    } finally {
      setResendingEmailId(null);
    }
  };

  // Download PDF Invoice
  const handleDownloadInvoicePdf = (order: Order) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const primaryColor: [number, number, number] = [0, 102, 204];
      const darkColor: [number, number, number] = [15, 23, 42];

      // Header Banner
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 32, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(16);
      doc.text("HAOSAIL MACHINERY KENYA", 15, 14);

      doc.setFontSize(9);
      doc.setFont("Helvetica", "normal");
      doc.text("Official Tax Invoice & Equipment Proforma", 15, 21);
      doc.text("Waiyaki Way, Nairobi • Tel: +254 750 707 038 • info@haosail.ke", 15, 26);

      // Order Reference Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(145, 10, 50, 18, "FD");

      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`INVOICE #${order.id.slice(0, 8).toUpperCase()}`, 148, 16);
      doc.setFontSize(8);
      doc.setFont("Helvetica", "normal");
      doc.text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString()}`, 148, 21);
      doc.text(`Status: ${(order.shippingStatus || "PENDING").toUpperCase()}`, 148, 25);

      // Client & Delivery Details
      doc.setFontSize(9);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("BILLED RECIPIENT & WORKSHOP LOCATION", 15, 42);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(`Client Name: ${order.customerName}`, 15, 48);
      doc.text(`Phone: ${order.customerPhone}`, 15, 53);
      if (order.companyName) doc.text(`Company / Workshop: ${order.companyName}`, 15, 58);
      if (order.companyTaxPin) doc.text(`KRA PIN: ${order.companyTaxPin}`, 15, 63);
      doc.text(`Delivery County & Address: ${order.county || "Nairobi"} - ${order.shippingAddress || "Depot Collection"}`, 15, order.companyName ? 68 : 58);

      let currentY = order.companyName ? 78 : 68;

      // Table Header
      doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.rect(15, currentY, 180, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("ITEM DESCRIPTION & BRAND", 20, currentY + 5.5);
      doc.text("QTY", 120, currentY + 5.5);
      doc.text("UNIT (KES)", 140, currentY + 5.5);
      doc.text("TOTAL (KES)", 170, currentY + 5.5);
      currentY += 8;

      // Table Rows
      (order.items || []).forEach((item, idx) => {
        const isEven = idx % 2 === 0;
        if (isEven) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, currentY, 180, 7.5, "F");
        }
        doc.setDrawColor(241, 245, 249);
        doc.line(15, currentY + 7.5, 195, currentY + 7.5);

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(item.name.slice(0, 48), 20, currentY + 5);

        doc.setFont("Helvetica", "normal");
        doc.text(String(item.quantity || 1), 125, currentY + 5);
        doc.text(Number(item.price || 0).toLocaleString(), 140, currentY + 5);
        doc.text((Number(item.price || 0) * (item.quantity || 1)).toLocaleString(), 170, currentY + 5);

        currentY += 7.5;
      });

      // Total Summary
      currentY += 6;
      doc.setFillColor(238, 242, 255);
      doc.rect(120, currentY, 75, 16, "F");
      doc.setTextColor(0, 102, 204);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`GRAND TOTAL: KES ${Number(order.totalAmount || 0).toLocaleString()}`, 125, currentY + 7);
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Terms: ${order.paymentMethod || "Pay on Delivery / Proforma Wire"}`, 125, currentY + 12);

      // Footer
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text("Haosail Machinery Kenya • Waiyaki Way Distribution Center • 12-Month Official Warranty", 105, 288, { align: "center" });

      doc.save(`Haosail_Invoice_${order.id.slice(0, 8).toUpperCase()}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Could not generate PDF directly. You can use the Print button.");
    }
  };

  // If viewing a full invoice print view
  if (invoiceOrderId) {
    const invOrder = orders.find(o => o.id === invoiceOrderId);
    if (invOrder) {
      return (
        <div className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 max-w-5xl mx-auto">
          <button
            onClick={() => setInvoiceOrderId(null)}
            className="mb-6 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs py-2 px-4 rounded-xl border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <PrintView order={invOrder} />
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-20">
      
      {/* Top Banner Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-4">
        <div data-theme-preserve className="bg-gradient-to-br from-slate-900 via-slate-900 to-[#002D62] text-white rounded-3xl p-6 sm:p-8 shadow-2xs border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-medium tracking-wider text-blue-300 uppercase px-2.5 py-1 rounded-full bg-blue-950/60 border border-blue-400/20">
                HAOSAIL CLIENT PORTAL
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Client &amp; Fleet Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Manage machinery dispatches, fleet quotations, and spare parts requests directly with Haosail Kenya engineers.
            </p>
          </div>

          {/* Quick Helpline Hotline Box */}
          <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center gap-4 shrink-0">
            <div className="w-11 h-11 rounded-full bg-white text-[#0055B8] flex items-center justify-center font-medium shadow-2xs">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-sky-200 font-medium block">
                DIRECT SALES &amp; DISPATCH LINE
              </span>
              <a 
                href="https://wa.me/254750707038" 
                target="_blank" 
                rel="noreferrer"
                className="text-sm font-medium text-white hover:text-sky-200 transition-colors flex items-center gap-1"
              >
                <span>+254 750 707 038</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-[10px] text-blue-100/70 block">Waiyaki Way, Nairobi Distribution Hub</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2">
        
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Total Equipment Orders</span>
              <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0055B8] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {clientOrders.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Registered in your account
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Active Dispatches</span>
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-600">
              {activeOrdersCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              In transit / warehouse processing
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Bulk Quotations</span>
              <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {bulkQuotes.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Fleet &amp; project proformas
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Saved Machinery</span>
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Bookmark className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              {bookmarkedProducts.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Bookmarked for review &amp; specs
            </p>
          </div>
        </div>

        {/* Depot Inventory Alert Banner */}
        {lowStockBookmarksCount > 0 && (
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-amber-900">
                  Depot Inventory Alert: {lowStockBookmarksCount} of your saved machinery {lowStockBookmarksCount === 1 ? "unit is" : "units are"} running low in Nairobi stock
                </h4>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Stock levels under {LOW_STOCK_THRESHOLD} units can sell out rapidly. Place your dispatch order or bulk request to secure allocations.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("bookmarks")}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium px-4 py-2 rounded-full transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95"
            >
              Inspect Saved Items
            </button>
          </div>
        )}

        {/* Dashboard Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-1.5 shadow-2xs flex flex-wrap items-center gap-1 mb-6">
          {[
            { id: "orders", label: "Orders & Dispatches", icon: ShoppingBag, count: clientOrders.length },
            { id: "tracking", label: "Live Tracking", icon: Truck },
            { id: "service_schedules", label: "Service Schedules", icon: Clock },
            { id: "spare_parts", label: "Spare Parts", icon: Wrench },
            { id: "quotes", label: "Bulk Quotes", icon: FileText, count: bulkQuotes.length },
            { id: "bookmarks", label: "Saved Machinery", icon: Bookmark, count: bookmarkedProducts.length },
            { id: "profile", label: "Profile", icon: Building2 }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#0055B8] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                    isActive ? "bg-white text-[#0055B8]" : "bg-slate-200/80 text-slate-700"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Orders & Dispatches */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            
            {/* Search and Filters Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Order ID, item name, or county..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:border-[#0066CC] transition-all"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500 font-mono">Filter:</span>
                {(["All", "Pending", "Delivered", "Cancelled"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      statusFilter === status
                        ? "bg-slate-900 text-white font-bold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Listing */}
            {filteredOrders.length > 0 ? (
              <div className="space-y-6">
                {filteredOrders.map((order) => {
                  const isDelivered = (order.shippingStatus || "").toLowerCase() === "delivered";
                  const isResending = resendingEmailId === order.id;
                  const isEmailSuccess = emailResentSuccess === order.id;

                  return (
                    <div 
                      key={order.id}
                      className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs hover:border-slate-300 transition-all space-y-5"
                    >
                      {/* Order Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 text-[#0066CC] flex items-center justify-center font-bold">
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-slate-900">
                                ORDER #{order.id.slice(0, 8).toUpperCase()}
                              </span>
                              <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                                isDelivered 
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-blue-50 text-[#0066CC] border-blue-200"
                              }`}>
                                {order.shippingStatus || "Pending Dispatch"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 font-sans">
                              Placed on {new Date(order.createdAt || Date.now()).toLocaleDateString("en-KE", { day: 'numeric', month: 'short', year: 'numeric' })} • Billed to: <strong>{order.customerName}</strong> ({order.customerPhone})
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                          <button
                            onClick={() => handleResendEmail(order)}
                            disabled={isResending}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            title="Resend email copy of this order"
                          >
                            {isResending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5 text-[#0066CC]" />}
                            <span>{isEmailSuccess ? "Email Sent!" : "Resend Email"}</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveTab("service_schedules");
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                            title="View service schedules for this machinery"
                          >
                            <Clock className="w-3.5 h-3.5 text-[#0066CC]" />
                            <span>Service Schedule</span>
                          </button>

                          <button
                            onClick={() => handleDownloadInvoicePdf(order)}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Download official PDF invoice"
                          >
                            <Download className="w-3.5 h-3.5 text-[#0066CC]" />
                            <span>PDF Invoice</span>
                          </button>

                          <button
                            onClick={() => setInvoiceOrderId(order.id)}
                            className="bg-blue-50 hover:bg-blue-100 text-[#0066CC] border border-blue-200 text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Print Tax Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print</span>
                          </button>
                        </div>
                      </div>

                      {/* Progress Tracker */}
                      <OrderProgressTracker shippingStatus={order.shippingStatus} paymentStatus={order.paymentStatus} />

                      {/* Ordered Machinery Items List */}
                      <div className="space-y-3">
                        <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                          Machinery Units &amp; Equipment
                        </span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(order.items || []).map((item, iIdx) => (
                            <div 
                              key={iIdx}
                              className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {item.image ? (
                                  <img 
                                    src={item.image} 
                                    alt={item.name} 
                                    className="w-12 h-12 rounded-xl object-contain bg-white border border-slate-200 shrink-0 p-1"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                                    <Package className="w-6 h-6" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <h4 className="font-bold text-xs text-slate-900 truncate">
                                    {item.name}
                                  </h4>
                                  <p className="text-[10px] text-slate-500 font-mono">
                                    Qty: <strong>{item.quantity}</strong> • Unit: KES {Number(item.price || 0).toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={() => handleViewProduct(item.productId)}
                                className="bg-white hover:bg-blue-50 text-[#0066CC] border border-slate-200 hover:border-blue-300 text-[11px] font-bold py-1.5 px-2.5 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                                title="View equipment details"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#0066CC]" />
                                <span>View Details</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Order Details & Pricing Bar */}
                      <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1 text-xs text-slate-600 font-sans">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-[#0066CC] shrink-0" />
                            <span>Destination: <strong>{order.county || "Nairobi"}</strong> • {order.shippingAddress || "Depot Collection"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Payment Terms: <strong>{order.paymentMethod || "Pay on Delivery / Proforma Wire"}</strong></span>
                          </div>
                        </div>

                        <div className="text-right self-end sm:self-auto">
                          <span className="text-[10px] font-mono text-slate-500 uppercase block">Total Amount</span>
                          <span className="text-xl font-extrabold text-[#0066CC]">
                            KES {Number(order.totalAmount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#0066CC] flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="text-base font-bold text-slate-900">No Orders Found</h3>
                  <p className="text-xs text-slate-500">
                    {orderSearchQuery 
                      ? "No orders match your filter criteria." 
                      : "You haven't placed any machinery orders yet. Browse our verified heavy equipment catalog."}
                  </p>
                </div>
                <button
                  onClick={() => setActiveView("shop")}
                  className="bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-all shadow-sm cursor-pointer inline-flex items-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  <span>Browse Equipment Catalog</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Bulk & Fleet Quotes */}
        {activeTab === "quotes" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#0066CC]" />
                    <span>Bulk &amp; Fleet Quotations</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track custom quotations requested for multiple heavy equipment units, commercial workshop fitouts, and construction contracts.
                  </p>
                </div>

                <button
                  onClick={() => setActiveView("shop")}
                  className="bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                >
                  <span>Request New Quote</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {quotesLoading ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0066CC]" />
                  <span className="text-xs font-mono">Loading quotations...</span>
                </div>
              ) : bulkQuotes.length > 0 ? (
                <div className="space-y-4 mt-6">
                  {bulkQuotes.map((quote) => (
                    <div 
                      key={quote.id}
                      className="border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-all bg-slate-50/50 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900">
                              REF: {quote.id.slice(0, 10).toUpperCase()}
                            </span>
                            <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                              {quote.status || "Under Technical Review"}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Submitted on {new Date(quote.createdAt || Date.now()).toLocaleDateString()} • Workshop: {quote.workshopLocation || "Kenya"}
                          </span>
                        </div>

                        <a
                          href={`https://wa.me/254750707038?text=${encodeURIComponent(
                            `Hello Haosail Sales, following up on Bulk Quote REF: ${quote.id} for ${quote.customerName} (${quote.companyName || "Workshop"}).`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-auto"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat on WhatsApp</span>
                        </a>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                          Requested Units:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(quote.items || []).map((it, idx) => (
                            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-2.5 text-xs flex justify-between items-center">
                              <span className="font-bold text-slate-800 truncate mr-2">{it.name}</span>
                              <span className="font-mono font-bold text-[#0066CC] shrink-0">{it.requestedUnits} Units</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {quote.customRequirements && (
                        <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 font-sans">
                          <strong>Project Requirements / Notes:</strong> {quote.customRequirements}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 space-y-3">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-xs">No bulk quote requests submitted yet. Use the "Bulk Quote" option in checkout to request fleet pricing.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Track Shipment */}
        {activeTab === "tracking" && (
          <div className="space-y-6">
            <LiveOrderTracker 
              onNavigateToShop={() => setActiveView("shop")}
              onNavigateToServiceSchedules={() => setActiveTab("service_schedules")}
            />
          </div>
        )}

        {/* Tab 3: Machinery Maintenance & Recommended Service Schedules */}
        {activeTab === "service_schedules" && (
          <div className="space-y-6">
            <MachineryServiceSchedules
              orders={clientOrders}
              products={products}
              user={user}
              onNavigateToShop={() => setActiveView("shop")}
              onNavigateToSpareParts={(prefill) => {
                if (prefill) {
                  setSparePartsPrefill(prefill);
                }
                setActiveTab("spare_parts");
              }}
            />
          </div>
        )}

        {/* Tab 4: Spare Parts & Service */}
        {activeTab === "spare_parts" && (
          <div className="space-y-6">
            <ClientSparePartsForm 
              orders={clientOrders}
              products={products}
              user={user}
              initialSelectedProduct={sparePartsPrefill ? {
                name: sparePartsPrefill.name,
                id: sparePartsPrefill.id,
                image: sparePartsPrefill.image,
                orderId: sparePartsPrefill.orderId,
                purchaseDate: sparePartsPrefill.purchaseDate
              } : undefined}
            />
          </div>
        )}

        {/* Tab 5: Saved Machinery & Bookmarks */}
        {activeTab === "bookmarks" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-[#0066CC]" />
                    <span>Saved Machinery &amp; Bookmarks</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quickly review bookmarked equipment models, compare units, or add to your order.
                  </p>
                </div>
              </div>

              {bookmarkedProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bookmarkedProducts.map((p) => {
                    const currentStock = getLiveProductStock(p);
                    const isLowStock = currentStock > 0 && currentStock <= LOW_STOCK_THRESHOLD;
                    const isOutOfStock = currentStock <= 0;

                    return (
                      <div 
                        key={p.id}
                        className="border border-slate-200 rounded-2xl p-4 bg-white hover:border-[#0066CC] transition-all space-y-3 flex flex-col justify-between relative shadow-xs"
                      >
                        <div>
                          <div className="h-40 bg-slate-50 rounded-xl overflow-hidden p-2 flex items-center justify-center border border-slate-100 mb-3 relative">
                            <img 
                              src={p.image} 
                              alt={p.name} 
                              className="max-h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                            
                            {/* Low Stock Badge */}
                            {isLowStock && (
                              <div className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Low Stock ({currentStock} left)</span>
                              </div>
                            )}

                            {isOutOfStock && (
                              <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shadow-xs">
                                Out of Stock
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-mono font-bold text-[#0066CC] uppercase">{p.brand} • {p.category}</span>
                            {isLowStock && (
                              <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm border border-amber-200">
                                ⚠️ Depot Alert
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-xs text-slate-900 line-clamp-2 mt-1">
                            {p.name}
                          </h4>
                          <div className="text-base font-extrabold text-[#0066CC] mt-2">
                            KES {p.price.toLocaleString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleViewProduct(p.id)}
                            className="flex-1 bg-blue-50 hover:bg-blue-100 text-[#0066CC] font-bold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#0066CC]" />
                            <span>View Unit</span>
                          </button>

                          <button
                            onClick={() => {
                              addToCart(p, 1);
                              setActiveView("checkout");
                            }}
                            className="flex-1 bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Order</span>
                          </button>

                          <button
                            onClick={() => toggleWishlist(p.id)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Remove bookmark"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 space-y-3">
                  <Bookmark className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-xs">No saved machinery yet. Click the bookmark icon on any equipment in the catalog to save it here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Company & Workshop Profile */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <ProfileEditor />
          </div>
        )}

      </div>

    </div>
  );
}
