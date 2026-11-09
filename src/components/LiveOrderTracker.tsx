import React, { useState, useEffect, useMemo } from "react";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Order } from "../types";
import { useStore } from "../StoreContext";
import { 
  Search, 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle, 
  FileText, 
  Loader2, 
  Calendar, 
  CreditCard, 
  ArrowRight,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
  PhoneCall,
  Navigation,
  ExternalLink,
  History,
  ChevronRight,
  Send,
  MessageSquare,
  Sparkles,
  Map
} from "lucide-react";
import { jsPDF } from "jspdf";

interface LiveOrderTrackerProps {
  initialOrderId?: string;
  onNavigateToShop?: () => void;
  onNavigateToServiceSchedules?: () => void;
}

export default function LiveOrderTracker({ 
  initialOrderId = "", 
  onNavigateToShop,
  onNavigateToServiceSchedules
}: LiveOrderTrackerProps) {
  const { orders } = useStore();
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  // Auto-track if initialOrderId is provided OR auto-load the most recent order from user history
  useEffect(() => {
    if (initialOrderId) {
      setOrderIdInput(initialOrderId);
      handleTrackOrder(initialOrderId);
    } else if (orders && orders.length > 0 && !trackedOrder) {
      const latestOrder = orders[0];
      if (latestOrder?.id) {
        setOrderIdInput(latestOrder.id);
        handleTrackOrder(latestOrder.id);
      }
    }
  }, [initialOrderId, orders]);

  // Real-time Firestore Sync for the tracked order
  useEffect(() => {
    if (!trackedOrder?.id) return;

    const unsubscribe = onSnapshot(
      doc(db, "orders", trackedOrder.id),
      (snapshot) => {
        if (snapshot.exists()) {
          setTrackedOrder({ id: snapshot.id, ...snapshot.data() } as Order);
        }
      },
      (err) => {
        console.warn("Real-time order tracking note:", err);
      }
    );

    return () => unsubscribe();
  }, [trackedOrder?.id]);

  const handleTrackOrder = async (targetId?: string) => {
    const id = (targetId || orderIdInput).trim();
    if (!id) {
      setErrorMsg("Please enter a valid Order Reference ID to initiate tracking.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setTrackedOrder(null);

    try {
      const docRef = doc(db, "orders", id);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const orderData = { id: snapshot.id, ...snapshot.data() } as Order;
        setTrackedOrder(orderData);
      } else {
        // Search in local store orders if doc ID format differs
        const found = orders.find(o => o.id.toLowerCase() === id.toLowerCase() || o.id.substring(0, 8).toLowerCase() === id.toLowerCase());
        if (found) {
          setTrackedOrder(found);
        } else {
          setErrorMsg(`No active order found with Reference ID: "${id}". Please check your invoice copy or select from your recent orders.`);
        }
      }
    } catch (err: any) {
      console.error("Error tracking order:", err);
      // Fallback to local store order if accessible
      const found = orders.find(o => o.id.toLowerCase() === id.toLowerCase() || o.id.substring(0, 8).toLowerCase() === id.toLowerCase());
      if (found) {
        setTrackedOrder(found);
      } else {
        setErrorMsg("Unable to fetch order data. Please ensure you are signed in or enter a valid reference ID.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStepNumber = (shippingStatus?: string, paymentStatus?: string) => {
    const s = (shippingStatus || "").toLowerCase();
    const p = (paymentStatus || "").toLowerCase();
    if (s === "delivered" || s === "completed") return 5;
    if (s === "dispatched" || s === "shipped" || s === "out for delivery" || s === "out_for_delivery") return 4;
    if (s === "processing" || s === "in warehouse") return 3;
    if (p.includes("paid") || p === "verified") return 2;
    return 1;
  };

  const activeStep = trackedOrder ? getStepNumber(trackedOrder.shippingStatus, trackedOrder.paymentStatus) : 1;

  const steps = [
    { num: 1, label: "Order Received", desc: "Registered in system & verified", icon: Clock },
    { num: 2, label: "Payment / Invoice Cleared", desc: "M-Pesa / Bank invoice verified", icon: CreditCard },
    { num: 3, label: "Warehouse Prep & Testing", desc: "Calibrated & packed in heavy crates", icon: Package },
    { num: 4, label: "Dispatched Heavy Freight", desc: "In transit on Kenya highway route", icon: Truck },
    { num: 5, label: "Delivered & Commissioned", desc: "Handed over & signed off at site", icon: CheckCircle }
  ];

  // Derive County & estimated delivery timeline
  const destinationCounty = useMemo(() => {
    if (!trackedOrder) return "Nairobi / Nationwide";
    const addr = (trackedOrder.shippingAddress || "").toLowerCase();
    if (addr.includes("mombasa")) return "Mombasa County (Coast Hub)";
    if (addr.includes("kisumu")) return "Kisumu County (Lake Region Hub)";
    if (addr.includes("nakuru")) return "Nakuru County (Rift Valley Hub)";
    if (addr.includes("eldoret") || addr.includes("uasin gishu")) return "Uasin Gishu / Eldoret";
    if (addr.includes("thika") || addr.includes("kiambu")) return "Kiambu / Thika Region";
    if (addr.includes("machakos") || addr.includes("athi river")) return "Machakos / Athi River";
    if (addr.includes("nanyuki") || addr.includes("nyeri")) return "Mount Kenya / Nyeri Hub";
    return "Nairobi CBD & County Metros";
  }, [trackedOrder]);

  const handleDownloadInvoicePDF = async () => {
    if (!trackedOrder) return;
    setIsDownloading(true);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const primaryColor = [0, 102, 204]; // Haosail Blue

      // 1. Header Banner
      doc.setFillColor(0, 102, 204);
      doc.rect(0, 0, 210, 42, "F");

      // 2. Branding
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.text("HAOSAIL KENYA", 15, 18);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text("INDUSTRIAL MACHINERY, HEAVY TOOLS & GARAGE EQUIPMENT", 15, 24);
      doc.text("Waiyaki Way, Westlands, Nairobi, Kenya", 15, 29);
      doc.text("Sales & Dispatch: +254 792 620 789 | Email: info@haosail.ke", 15, 34);

      // 3. Tax Invoice Badge
      doc.setFillColor(255, 255, 255);
      doc.rect(145, 10, 50, 24, "F");
      doc.setTextColor(0, 102, 204);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.text("OFFICIAL TAX INVOICE", 148, 16);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7.5);
      doc.text(`Ref: #${trackedOrder.id.substring(0, 8).toUpperCase()}`, 148, 22);
      doc.setFont("Helvetica", "normal");
      doc.text(`Date: ${trackedOrder.createdAt ? new Date(trackedOrder.createdAt).toLocaleDateString() : "Pending"}`, 148, 27);
      doc.text(`Status: ${trackedOrder.paymentStatus || "Pending"}`, 148, 31);

      // 4. Recipient Details
      doc.setTextColor(15, 23, 42);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.text("BILLED CUSTOMER & SITE", 15, 54);
      doc.text("DISPATCH LOGISTICS", 115, 54);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Client: ${trackedOrder.customerName || "Customer"}`, 15, 60);
      doc.text(`Email: ${trackedOrder.customerEmail || "N/A"}`, 15, 65);
      doc.text(`Phone: ${trackedOrder.customerPhone || "N/A"}`, 15, 70);

      let wrappedAddress = doc.splitTextToSize(trackedOrder.shippingAddress || "Nairobi Warehouse / Client Site", 80);
      doc.text(wrappedAddress, 115, 60);

      let currentY = 82;

      // 5. Line items table
      doc.setFillColor(241, 245, 249);
      doc.rect(15, currentY, 180, 8, "F");
      doc.setDrawColor(203, 213, 225);
      doc.line(15, currentY, 195, currentY);
      doc.line(15, currentY + 8, 195, currentY + 8);

      doc.setTextColor(15, 23, 42);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.text("Machinery / Item Description", 18, currentY + 5.5);
      doc.text("Qty", 125, currentY + 5.5);
      doc.text("Unit (KES)", 145, currentY + 5.5);
      doc.text("Total (KES)", 172, currentY + 5.5);

      currentY += 8;
      doc.setFont("Helvetica", "normal");

      (trackedOrder.items || []).forEach((item) => {
        if (currentY > 210) {
          doc.addPage();
          currentY = 20;
        }

        let fullName = `${item.brand || "HAOSAIL"} ${item.name}`;
        let wrappedName = doc.splitTextToSize(fullName, 100);

        doc.setFont("Helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(wrappedName, 18, currentY + 5);

        doc.setFont("Helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(String(item.quantity), 126, currentY + 5);
        doc.text(Number(item.price).toLocaleString(), 145, currentY + 5);

        doc.setFont("Helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(Number(item.price * item.quantity).toLocaleString(), 172, currentY + 5);

        let rowHeight = Math.max(9, wrappedName.length * 4.5 + 2);
        currentY += rowHeight;
        doc.setDrawColor(226, 232, 240);
        doc.line(15, currentY, 195, currentY);
      });

      // Total summary
      currentY += 6;
      doc.setFillColor(248, 250, 252);
      doc.rect(115, currentY, 80, 20, "F");
      doc.rect(115, currentY, 80, 20, "S");

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text("Order Subtotal:", 120, currentY + 6);
      doc.text("Shipping & Offloading:", 120, currentY + 11);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Grand Total (KES):", 120, currentY + 16);

      doc.text(`KES ${Number(trackedOrder.totalAmount || 0).toLocaleString()}`, 160, currentY + 6);
      doc.text("KES 0 (Included)", 160, currentY + 11);
      doc.setTextColor(0, 102, 204);
      doc.setFontSize(9);
      doc.text(`KES ${Number(trackedOrder.totalAmount || 0).toLocaleString()}`, 160, currentY + 16);

      // Warranty footer
      currentY += 28;
      doc.setFillColor(241, 245, 249);
      doc.rect(15, currentY, 180, 20, "F");
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(0, 102, 204);
      doc.text("12-MONTH FACTORY WARRANTY & COMMISSIONING GUARANTEE", 20, currentY + 6);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text("• All Haosail heavy equipment includes 12 months comprehensive structural and hydraulic factory warranty.", 20, currentY + 11);
      doc.text("• Free pre-shipment calibration, assembly verification, and genuine spare parts availability in Kenya.", 20, currentY + 15);

      doc.save(`Haosail_Kenya_Tax_Invoice_${trackedOrder.id.substring(0, 8)}.pdf`);
    } catch (e) {
      console.error("PDF download failed:", e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div id="live-tracking-section" className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[11px] font-mono font-bold text-[#0066CC] uppercase tracking-wider">
                Real-Time Firestore Logistics Stream
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Visual Delivery &amp; Consignment Tracking
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
              Track heavy machinery freight status, carrier vehicle routes, warehouse calibration milestones, and estimated county drop-off in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://wa.me/254792620789?text=Hello%20Haosail%20Dispatch%2C%20following%20up%20on%20my%20delivery%20status."
              target="_blank"
              rel="noreferrer"
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Dispatch Line (+254 792 620 789)</span>
            </a>
          </div>
        </div>

        {/* Quick Select from User's Active & Past Orders */}
        {orders && orders.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-mono font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#0066CC]" />
                Your Registered Orders ({orders.length})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Select order to view live timeline</span>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
              {orders.map((ord) => {
                const isSelected = trackedOrder?.id === ord.id;
                const isDelivered = (ord.shippingStatus || "").toLowerCase() === "delivered";

                return (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => {
                      setOrderIdInput(ord.id);
                      handleTrackOrder(ord.id);
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-2xl border text-left text-xs transition-all shrink-0 cursor-pointer ${
                      isSelected 
                        ? "bg-blue-50/90 border-[#0066CC] ring-2 ring-[#0066CC]/20 shadow-xs"
                        : "bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      isSelected ? "bg-[#0066CC] text-white" : "bg-white text-slate-700 border border-slate-200"
                    }`}>
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-mono font-bold block text-slate-900">
                        #{ord.id.substring(0, 8).toUpperCase()}
                      </span>
                      <span className={`text-[10px] font-bold block ${isDelivered ? "text-emerald-600" : "text-amber-600"}`}>
                        {ord.shippingStatus || "Processing"} • KES {Number(ord.totalAmount || 0).toLocaleString()}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search / Manual Track Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleTrackOrder();
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="Enter Order ID or Invoice No (e.g. ord_283928198 or #HSL-89214)..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 text-xs font-mono focus:bg-white focus:border-[#0066CC] focus:outline-hidden"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
            <button
              type="submit"
              disabled={isLoading || !orderIdInput.trim()}
              className="bg-[#0066CC] hover:bg-[#0052A3] disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-2 shrink-0 shadow-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Locating Consignment...</span>
                </>
              ) : (
                <>
                  <span>Track Consignment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {errorMsg && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Tracked Order Details */}
      {trackedOrder ? (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Order Summary Metric Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <span className="text-slate-500 text-[10px] font-mono uppercase block mb-1">Consignment ID</span>
              <span className="text-slate-900 font-mono font-bold text-sm">
                #{trackedOrder.id.substring(0, 8).toUpperCase()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {new Date(trackedOrder.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <span className="text-slate-500 text-[10px] font-mono uppercase block mb-1">Dispatch Status</span>
              <span className={`font-bold text-sm block ${
                trackedOrder.shippingStatus === "Delivered" ? "text-emerald-600" : "text-[#0066CC]"
              }`}>
                {trackedOrder.shippingStatus || "Processing"}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {destinationCounty}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <span className="text-slate-500 text-[10px] font-mono uppercase block mb-1">Payment Status</span>
              <span className={`font-bold text-sm block ${
                (trackedOrder.paymentStatus || "").toLowerCase().includes("paid") ? "text-emerald-600" : "text-amber-600"
              }`}>
                {trackedOrder.paymentStatus || "Pending"}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {trackedOrder.paymentMethod || "Pay on Delivery"}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <span className="text-slate-500 text-[10px] font-mono uppercase block mb-1">Total Valuation</span>
              <span className="text-slate-900 font-bold text-sm block">
                KES {Number(trackedOrder.totalAmount || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                Free Nationwide Shipping
              </span>
            </div>
          </div>

          {/* Interactive Multi-Stage Progress Timeline */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0066CC]" />
                <h3 className="font-bold text-sm text-slate-900">
                  Consignment Dispatch Milestones &amp; Live Progression
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Step {activeStep} of 5 Active
              </span>
            </div>

            {/* Visual Step Bar */}
            <div className="relative">
              {/* Desktop Bar */}
              <div className="hidden md:block absolute top-4 left-[10%] right-[10%] h-1 bg-slate-100 z-0">
                <div 
                  className="h-full bg-[#0066CC] transition-all duration-700 ease-out rounded-full"
                  style={{ width: `${((activeStep - 1) / 4) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-2 relative z-10">
                {steps.map((step) => {
                  const StepIcon = step.icon;
                  const isCompleted = activeStep >= step.num;
                  const isCurrent = activeStep === step.num;

                  return (
                    <div key={step.num} className="flex md:flex-col items-center gap-3.5 md:text-center">
                      <div 
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center border transition-all shrink-0 ${
                          isCompleted 
                            ? "bg-[#0066CC] border-[#0066CC] text-white shadow-xs"
                            : "bg-slate-100 border-slate-200 text-slate-400"
                        } ${isCurrent ? "ring-4 ring-blue-100" : ""}`}
                      >
                        <StepIcon className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5 text-left md:text-center">
                        <h4 className={`text-xs font-bold ${isCompleted ? "text-slate-900" : "text-slate-400"}`}>
                          {step.label}
                        </h4>
                        <p className="text-[10px] text-slate-500 max-w-xs md:max-w-[130px] mx-auto leading-tight">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Freight Route & Carrier Dispatch Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Carrier & Logistics Route */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[#0066CC]" />
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Freight Route &amp; Transit Waypoints
                  </h4>
                </div>
                <span className="text-[10px] font-mono font-bold bg-blue-50 text-[#0066CC] px-2 py-0.5 rounded-md">
                  HAOSAIL LOGISTICS NETWORK
                </span>
              </div>

              {/* Waypoint Route Flow */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0066CC] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    A
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-900 block">Origin: Haosail Nairobi Central Depot</span>
                    <span className="text-[11px] text-slate-500">Waiyaki Way, Westlands, Nairobi • Pre-shipment calibration checked</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                    Dispatched
                  </span>
                </div>

                <div className="w-0.5 h-4 bg-slate-300 ml-3" />

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0066CC] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    B
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-900 block">Regional Highway Corridor</span>
                    <span className="text-[11px] text-slate-500">Express heavy-haul truck route towards {destinationCounty}</span>
                  </div>
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-bold">
                    In Transit
                  </span>
                </div>

                <div className="w-0.5 h-4 bg-slate-300 ml-3" />

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    C
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-900 block">Destination Delivery &amp; Workshop Offloading</span>
                    <span className="text-[11px] text-slate-500">{trackedOrder.shippingAddress || "Client Site / Workshop Location"}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md font-bold">
                    Final Stage
                  </span>
                </div>
              </div>

              {/* Carrier Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-slate-500 text-[10px] font-mono uppercase block mb-0.5">Carrier Transport</span>
                  <span className="font-bold text-slate-900 block">{trackedOrder.courierName || "Haosail Dedicated Heavy Haulage"}</span>
                  <span className="text-[10px] text-[#0066CC] font-mono font-bold block mt-0.5">
                    Waybill: {trackedOrder.courierWaybill || `WB-${trackedOrder.id.substring(0, 6).toUpperCase()}`}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-slate-500 text-[10px] font-mono uppercase block mb-0.5">Estimated ETA</span>
                  <span className="font-bold text-slate-900 block">
                    {trackedOrder.shippingStatus === "Delivered" ? "Delivered to Site" : "Same-Day / 24 Hours"}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Direct to customer address</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-slate-500 text-[10px] font-mono uppercase block mb-0.5">Dispatch Driver Hotline</span>
                  <span className="font-bold text-slate-900 block">+254 792 620 789</span>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Haosail Logistics Desk</span>
                </div>
              </div>
            </div>

            {/* Right Column: Itemized Manifest & Quick Actions */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 mb-3">
                  Consignment Items ({trackedOrder.items?.length || 0})
                </h4>
                
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {(trackedOrder.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                      <img
                        src={item.image || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=200"}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover bg-white border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          Qty: {item.quantity} • KES {Number(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleDownloadInvoicePDF}
                  disabled={isDownloading}
                  className="w-full bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Invoice...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      <span>Download Tax Invoice PDF</span>
                    </>
                  )}
                </button>

                {onNavigateToServiceSchedules && (
                  <button
                    type="button"
                    onClick={onNavigateToServiceSchedules}
                    className="w-full bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#0066CC] font-bold text-xs py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#0066CC]" />
                    <span>View Equipment Service Schedules</span>
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>
      ) : (
        !isLoading && (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-10 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No Consignment Selected</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Please choose an order from your recent purchases above or enter your Order Reference ID to load the live delivery tracker.
            </p>
          </div>
        )
      )}
    </div>
  );
}
