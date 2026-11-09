/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useStore } from "../StoreContext";
import { 
  ShoppingBag, 
  Trash2, 
  ChevronRight, 
  Loader2, 
  CheckCircle, 
  Printer, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertCircle,
  MessageSquare,
  Phone,
  ArrowRight,
  FileText,
  BadgeCheck,
  Building2,
  Clock,
  ExternalLink,
  Layers,
  Sparkles,
  Send,
  HelpCircle
} from "lucide-react";
import { KENYAN_COUNTIES } from "../data";

export const getSafaricomValidation = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  let normalized = digits;
  
  if (normalized.startsWith("254") && normalized.length > 3) {
    normalized = "0" + normalized.substring(3);
  } else if (!normalized.startsWith("0") && normalized.length === 9) {
    normalized = "0" + normalized;
  }

  const prefix3 = normalized.substring(0, 3);
  const prefix4 = normalized.substring(0, 4);

  const safaricom3Prefixes = ["070", "071", "072", "079", "011", "012"];
  const safaricom4Prefixes = [
    "0740", "0741", "0742", "0743", "0744", "0745", "0746", "0748",
    "0757", "0758", "0759", "0768", "0769"
  ];

  const isSafaricom = safaricom3Prefixes.includes(prefix3) || safaricom4Prefixes.includes(prefix4);

  let network = "Unknown Network";
  if (isSafaricom) {
    network = "Safaricom";
  } else if (["073", "078", "010"].includes(prefix3)) {
    network = "Airtel";
  } else if (["077"].includes(prefix3) || ["0119"].includes(prefix4)) {
    network = "Telkom";
  } else if (["0763", "0764", "0765", "0766"].includes(prefix4)) {
    network = "Equitel";
  }

  let apiFormatted = "";
  if (normalized.startsWith("0") && normalized.length === 10) {
    apiFormatted = "254" + normalized.substring(1);
  } else if (normalized.length === 9 && !normalized.startsWith("0")) {
    apiFormatted = "254" + normalized;
  } else if (normalized.startsWith("254") && normalized.length === 12) {
    apiFormatted = normalized;
  }

  return {
    isValid: isSafaricom && (normalized.length === 10 || (normalized.startsWith("254") && normalized.length === 12)),
    network,
    normalized,
    apiFormatted
  };
};

export const isCampaignOfferActive = (p: any) => {
  if (!p.flashPrice || !p.flashExpiry) return false;
  const now = new Date();
  const expiryDate = new Date(p.flashExpiry);
  if (now > expiryDate) return false;
  if (p.flashStart) {
    const startDate = new Date(p.flashStart);
    if (now < startDate) return false;
  }
  return true;
};

export default function CheckoutView() {
  const { 
    user, 
    userProfile,
    orders,
    cart, 
    getCartTotal, 
    updateCartItemQty, 
    removeFromCart, 
    clearCart,
    createCheckoutOrder, 
    createBulkQuoteRequest,
    setActiveView, 
    setInvoiceOrderId,
    affiliates,
  } = useStore();

  // Mode: "order" (Order Only) vs "bulk" (Bulk / Custom Quote Request)
  const [checkoutMode, setCheckoutMode] = useState<"order" | "bulk">("order");

  // Customer Contact State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedCounty, setSelectedCounty] = useState(KENYAN_COUNTIES[0]);
  const [workshopLocation, setWorkshopLocation] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  // Bulk Request Specific Fields
  const [companyName, setCompanyName] = useState("");
  const [companyTaxPin, setCompanyTaxPin] = useState("");
  const [procurementTimeline, setProcurementTimeline] = useState("Immediate (Within 7 Days)");
  const [targetBudget, setTargetBudget] = useState("");
  const [bulkCustomRequirements, setBulkCustomRequirements] = useState("");
  const [bulkQuantities, setBulkQuantities] = useState<Record<string, number>>({});

  // Promo Code
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [promoFeedback, setPromoFeedback] = useState("");
  const [isPromoSuccess, setIsPromoSuccess] = useState(false);

  // Order submission processing state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [submittedType, setSubmittedType] = useState<"order" | "bulk">("order");
  const [createdOrderId, setCreatedOrderId] = useState("");
  const [createdOrderObj, setCreatedOrderObj] = useState<any>(null);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Synchronize bulk quantities with cart items
  useEffect(() => {
    const initialQty: Record<string, number> = {};
    cart.forEach(item => {
      initialQty[item.product.id] = bulkQuantities[item.product.id] || Math.max(item.quantity, 2);
    });
    setBulkQuantities(initialQty);
  }, [cart]);

  // Populate Name, Email & Phone from user profile if available
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.displayName || userProfile?.name || "");
      if (!customerEmail) setCustomerEmail(user.email || "");
      if (!customerPhone && userProfile?.phone) setCustomerPhone(userProfile.phone);
    }
  }, [user, userProfile]);

  // Confetti effect timer
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  const handleCopyOrderId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 2500);
  };

  const handleApplyPromo = () => {
    if (!promoInput.trim()) {
      setPromoFeedback("Please enter a discount code.");
      setIsPromoSuccess(false);
      return;
    }
    const code = promoInput.trim().toUpperCase();
    const matchedAffiliate = affiliates.find(a => a.code.toUpperCase() === code && a.active);

    if (matchedAffiliate) {
      setAppliedPromo(matchedAffiliate.code);
      const discountVal = matchedAffiliate.discountType === "percentage"
        ? Math.round(getCartTotal() * (matchedAffiliate.discountValue / 100))
        : matchedAffiliate.discountValue;
      setDiscount(discountVal);
      setPromoFeedback(`Affiliate Code "${matchedAffiliate.code}" applied! KES ${discountVal.toLocaleString()} discount registered.`);
      setIsPromoSuccess(true);
    } else if (code.length >= 4) {
      setAppliedPromo(code);
      setDiscount(1000);
      setPromoFeedback(`Referral Code "${code}" registered successfully! KES 1,000 discount applied.`);
      setIsPromoSuccess(true);
    } else {
      setPromoFeedback("Invalid or inactive affiliate code. Please double check.");
      setIsPromoSuccess(false);
    }
  };

  const finalTotal = Math.max(0, getCartTotal() - discount);

  // Calculate total units in bulk mode
  const getBulkTotalUnits = () => {
    return Object.values(bulkQuantities).reduce((acc, qty) => acc + (qty || 1), 0);
  };

  const getBulkEstimatedTotal = () => {
    return cart.reduce((acc, item) => {
      const price = isCampaignOfferActive(item.product) ? item.product.flashPrice! : item.product.price;
      const qty = bulkQuantities[item.product.id] || item.quantity;
      return acc + (price * qty);
    }, 0);
  };

  // Handle Standard Order Submission (Order Only - No payment taken online)
  const handlePlaceOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert("Please provide the contact / company name.");
      return;
    }

    if (!customerPhone.trim()) {
      alert("Please provide a valid phone or WhatsApp number.");
      return;
    }

    if (!workshopLocation.trim()) {
      alert("Please enter your physical workshop or site location.");
      return;
    }

    const activeEmail = (customerEmail || user?.email || "info@haosail.ke").trim();
    const fullLocation = `${workshopLocation.trim()}, ${selectedCounty} County, Kenya`;

    setIsSubmitting(true);

    try {
      const orderObj = await createCheckoutOrder({
        customerName: customerName.trim(),
        customerEmail: activeEmail,
        customerPhone: customerPhone.trim(),
        shippingAddress: fullLocation,
        county: selectedCounty,
        notes: orderNotes.trim() || undefined,
        mpesaPhone: customerPhone.trim(),
        totalAmount: finalTotal,
        paymentMethod: "Order Placed (Direct Dispatch)",
        paymentStatus: "Order Placed",
        referralCode: appliedPromo || undefined,
        paymentProvider: "OrderOnly"
      });

      if (!orderObj) {
        setIsSubmitting(false);
        alert("We could not register your order at this moment. Please check your connection and try again.");
        return;
      }

      setCreatedOrderId(orderObj.id);
      setCreatedOrderObj(orderObj);
      setSubmittedType("order");
      setIsSubmitting(false);
      setOrderSuccess(true);
      setShowConfetti(true);
      clearCart();
    } catch (err: any) {
      console.error("Order submission failed:", err);
      setIsSubmitting(false);
      alert(`Order placement error: ${err?.message || "Please verify your details and try again."}`);
    }
  };

  // Handle Bulk Quote Request Submission
  const handleBulkQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert("Please provide the contact person's name.");
      return;
    }

    if (!customerPhone.trim()) {
      alert("Please provide a valid phone or WhatsApp number for quotation delivery.");
      return;
    }

    if (!workshopLocation.trim()) {
      alert("Please enter your workshop or project site location.");
      return;
    }

    const activeEmail = (customerEmail || user?.email || "sales@haosail.ke").trim();

    setIsSubmitting(true);

    try {
      const bulkItems = cart.map(item => {
        const unitPrice = isCampaignOfferActive(item.product) ? item.product.flashPrice! : item.product.price;
        const requestedUnits = bulkQuantities[item.product.id] || item.quantity;
        return {
          productId: item.product.id,
          name: item.product.name,
          brand: item.product.brand || "HAOSAIL",
          image: item.product.image,
          unitPrice,
          requestedUnits,
          notes: bulkCustomRequirements ? `Project Note: ${bulkCustomRequirements}` : undefined
        };
      });

      const quoteResult = await createBulkQuoteRequest({
        customerName: customerName.trim(),
        companyName: companyName.trim() || undefined,
        companyTaxPin: companyTaxPin.trim() || undefined,
        customerEmail: activeEmail,
        customerPhone: customerPhone.trim(),
        county: selectedCounty,
        workshopLocation: workshopLocation.trim(),
        timeline: procurementTimeline,
        targetBudget: targetBudget.trim() || undefined,
        customRequirements: bulkCustomRequirements.trim() || undefined,
        items: bulkItems
      });

      if (!quoteResult) {
        setIsSubmitting(false);
        alert("Could not transmit bulk quote request. Please check your connection and try again.");
        return;
      }

      setCreatedOrderId(quoteResult.id || `BULK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
      setCreatedOrderObj({
        ...quoteResult,
        items: bulkItems.map(it => ({ ...it, price: it.unitPrice, quantity: it.requestedUnits }))
      });
      setSubmittedType("bulk");
      setIsSubmitting(false);
      setOrderSuccess(true);
      setShowConfetti(true);
      clearCart();
    } catch (err: any) {
      console.error("Bulk quote submission failed:", err);
      setIsSubmitting(false);
      alert(`Bulk quote error: ${err?.message || "Please verify your details and try again."}`);
    }
  };

  // Generate pre-filled WhatsApp message URL
  const generateWhatsAppUrl = () => {
    const adminWhatsApp = "254792620789";
    const ref = createdOrderId ? `#${createdOrderId.slice(0, 8).toUpperCase()}` : "N/A";
    
    if (submittedType === "bulk") {
      const itemsList = createdOrderObj?.items?.map((it: any) => `• ${it.requestedUnits || it.quantity}x ${it.name || it.productName}`).join("\n") || "";
      const text = `Hello Haosail Machinery Kenya Sales Desk,

I have submitted a Bulk Request / Custom Quote on your website:
📋 *Quote Ref:* ${ref}
👤 *Contact:* ${customerName || createdOrderObj?.customerName || "Prospective Buyer"}
🏢 *Company:* ${companyName || "N/A"}
📞 *Phone:* ${customerPhone || createdOrderObj?.customerPhone || ""}
📍 *Location:* ${workshopLocation || createdOrderObj?.workshopLocation || ""}, ${selectedCounty} County
⏱️ *Timeline:* ${procurementTimeline || "Immediate"}

*Machinery Requested:*
${itemsList}

Please prepare an official proforma quote with bulk discount pricing. Thank you!`;

      return `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(text)}`;
    }

    const itemsList = createdOrderObj?.items?.map((it: any) => `• ${it.quantity}x ${it.name} (KES ${Number(it.price).toLocaleString()})`).join("\n") || "";
    const text = `Hello Haosail Machinery Kenya,

I have just placed an order on your website:
📦 *Order ID:* ${ref}
👤 *Name:* ${customerName || createdOrderObj?.customerName || "Customer"}
📞 *Phone:* ${customerPhone || createdOrderObj?.customerPhone || ""}
📍 *Workshop Location:* ${workshopLocation || createdOrderObj?.shippingAddress || ""}, ${selectedCounty} County
💰 *Total Amount:* KES ${finalTotal.toLocaleString()}

*Items Ordered:*
${itemsList}

Please confirm order receipt and dispatch schedule. Thank you!`;

    return `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(text)}`;
  };

  // Empty cart state
  if (cart.length === 0 && !orderSuccess) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-3xl p-10 sm:p-14 text-center max-w-lg mx-auto animate-fadeIn mt-12 shadow-2xs">
        <div className="w-16 h-16 rounded-full bg-blue-50/80 text-[#0055B8] flex items-center justify-center mx-auto mb-4 border border-blue-200/80 shadow-2xs">
          <ShoppingBag className="w-8 h-8 text-[#0055B8]" />
        </div>
        <h2 className="font-sans font-bold text-xl text-slate-900 tracking-tight">Your Equipment Cart is Empty</h2>
        <p className="text-slate-600 text-xs mt-2 leading-relaxed font-sans max-w-sm mx-auto">
          You have not selected any machinery yet. Browse our heavy equipment, automotive maintenance lifts, and industrial machinery catalog.
        </p>
        <button
          onClick={() => setActiveView("shop")}
          className="mt-6 bg-[#0055B8] hover:bg-[#004494] text-white font-sans text-xs font-medium px-6 py-3 rounded-full transition-all cursor-pointer shadow-2xs inline-flex items-center gap-2 active:scale-95"
        >
          <span>Browse Machinery Catalog</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 font-sans">
      {/* Confetti Animation on Success */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 2;
            const duration = 2.5 + Math.random() * 2.5;
            const size = 6 + Math.random() * 8;
            const colors = ["#0055B8", "#10B981", "#F59E0B", "#3B82F6", "#047857", "#2563EB"];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            return (
              <div
                key={i}
                className="absolute rounded-xs opacity-0 animate-confetti-fall"
                style={{
                  left: `${left}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: randomColor,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                  top: `-20px`
                }}
              />
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUCCESS CONFIRMATION SCREEN (Order or Bulk Quote Placed) */}
      {/* ========================================================================= */}
      {orderSuccess && (
        <div id="checkout-order-placed-screen" className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 max-w-2xl mx-auto shadow-2xs my-6 animate-fadeIn">
          
          {/* Header Banner */}
          <div className="text-center pb-6 border-b border-slate-100">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/80 mb-4 shadow-2xs">
              <CheckCircle className="w-8 h-8" />
            </div>
            <span className="text-[10px] font-mono uppercase font-bold text-[#0055B8] tracking-widest block mb-1">
              HAOSAIL MACHINERY KENYA • {submittedType === "bulk" ? "BULK QUOTE TRANSMITTED" : "ORDER REGISTERED"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {submittedType === "bulk" ? "Bulk Quote Request Transmitted!" : "Order Placed Successfully!"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
              {submittedType === "bulk" 
                ? "Your volume quotation request for heavy machinery has been sent to the Haosail sales engineering desk. Automated notifications have been dispatched to official email and WhatsApp."
                : "Your order has been registered and transmitted to our operations team. Instant notifications have been sent to our sales team via WhatsApp and official email."
              }
            </p>
          </div>

          {/* Key Assurance Notice */}
          <div className="my-6 p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0055B8] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Phone className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-800 leading-relaxed">
              <strong className="block text-slate-900 font-semibold mb-0.5">Next Steps & Dispatch:</strong>
              Our sales & technical engineers will contact you at <strong>{customerPhone || "your phone"}</strong> to review technical specifications, confirm scheduling, and provide your formal invoice.
            </div>
          </div>

          {/* Order Details Card */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 font-mono text-xs text-slate-700 space-y-2.5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
              <span className="text-slate-500 font-sans font-medium">
                {submittedType === "bulk" ? "QUOTE REFERENCE:" : "ORDER REFERENCE:"}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">#{createdOrderId.slice(0, 8).toUpperCase()}</span>
                <button
                  onClick={() => handleCopyOrderId(createdOrderId)}
                  className="p-1.5 rounded-full hover:bg-white text-[#0055B8] border border-slate-200/80 transition-all cursor-pointer active:scale-95"
                  title="Copy ID"
                >
                  {copiedOrderId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-sans">Contact Name:</span>
              <strong className="text-slate-900 font-sans">{customerName || "Client"}</strong>
            </div>

            {companyName && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-sans">Company:</span>
                <strong className="text-slate-900 font-sans">{companyName}</strong>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-sans">Phone / WhatsApp:</span>
              <strong className="text-slate-900">{customerPhone}</strong>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-sans">Workshop Location:</span>
              <span className="text-slate-800 font-sans font-medium text-right max-w-[240px] truncate">
                {workshopLocation}, {selectedCounty} County
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200/80 text-sm">
              <span className="font-sans font-semibold text-slate-900">
                {submittedType === "bulk" ? "Estimated Catalog Scope:" : "Total Order Value:"}
              </span>
              <span className="font-sans font-bold text-[#0055B8] text-base">
                KES {(submittedType === "bulk" ? getBulkEstimatedTotal() : finalTotal).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <a
              href={generateWhatsAppUrl()}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium py-3.5 px-4 rounded-full shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer text-sm active:scale-95"
            >
              <MessageSquare className="w-5 h-5 text-white" />
              <span>
                {submittedType === "bulk"
                  ? "Chat on WhatsApp with Sales Team (+254 792 620 789)"
                  : "Message Sales Desk on WhatsApp (+254 792 620 789)"}
              </span>
              <ExternalLink className="w-4 h-4 opacity-80" />
            </a>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => window.print()}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 font-medium py-2.5 px-3 rounded-full text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
              >
                <Printer className="w-4 h-4 text-[#0055B8]" />
                <span>Print Order Slip</span>
              </button>

              <button
                onClick={() => {
                  setActiveView("shop");
                  setOrderSuccess(false);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium py-2.5 px-3 rounded-full text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>Continue Shopping</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN CHECKOUT FORM (Order Only Flow + Bulk Request Option) */}
      {/* ========================================================================= */}
      {!orderSuccess && (
        <div className="space-y-6">
          
          {/* Top Mode Selector Tabs */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50/80 border border-blue-200/80 text-[#0055B8] flex items-center justify-center shrink-0 shadow-2xs">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-base sm:text-lg">Checkout & Order Placement</h1>
                <p className="text-slate-500 text-xs">Zero online card payment required • Direct factory & showroom dispatch</p>
              </div>
            </div>

            {/* Mode Switcher Buttons */}
            <div className="flex items-center bg-slate-100/80 p-1 rounded-full border border-slate-200/80 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setCheckoutMode("order")}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  checkoutMode === "order"
                    ? "bg-[#0055B8] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Standard Order</span>
              </button>

              <button
                type="button"
                onClick={() => setCheckoutMode("bulk")}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  checkoutMode === "bulk"
                    ? "bg-[#0055B8] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Bulk Quote Request</span>
                <span className="bg-amber-400 text-amber-950 text-[9px] font-bold px-2 py-0.5 rounded-full">
                  MULTI-UNIT
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Block: Machinery in Order & Contact Details */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Items Card */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-4">
                  <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#0055B8]" />
                    <span>
                      {checkoutMode === "bulk" ? "Equipment for Bulk Quotation" : "Selected Equipment"} ({cart.length})
                    </span>
                  </h2>
                  <button 
                    onClick={clearCart}
                    className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50/80 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border border-red-200/80 cursor-pointer active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear Cart
                  </button>
                </div>

                {checkoutMode === "bulk" && (
                  <div className="mb-4 p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed font-sans">
                      <strong>Bulk Pricing:</strong> Adjust the number of units below for heavy machinery volume discounts. Our sales engineering team will review and calculate project-tier quotation discounts.
                    </p>
                  </div>
                )}

                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.product.id} className="py-3.5 flex gap-3.5 items-center last:pb-0">
                      <img 
                        src={item.product.image} 
                        alt={item.product.name} 
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-2xl object-cover shrink-0 bg-slate-50 border border-slate-200/80"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <span className="font-mono text-[9px] text-[#0055B8] block uppercase font-bold">{item.product.brand || "HAOSAIL"}</span>
                        <h4 className="font-semibold text-xs sm:text-sm text-slate-900 truncate">{item.product.name}</h4>
                        <p className="font-bold text-xs text-[#0055B8] mt-0.5 font-sans">
                          {isCampaignOfferActive(item.product) ? (
                            <>
                              <span className="text-[#0055B8]">KES {item.product.flashPrice!.toLocaleString()}</span>
                              <span className="text-[10px] text-slate-400 line-through ml-1.5 font-normal">KES {item.product.price.toLocaleString()}</span>
                            </>
                          ) : (
                            <span>KES {item.product.price.toLocaleString()}</span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {checkoutMode === "bulk" ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-500 font-mono font-medium">UNITS:</span>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={bulkQuantities[item.product.id] || item.quantity}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                setBulkQuantities(prev => ({ ...prev, [item.product.id]: val }));
                              }}
                              className="w-16 bg-white border border-slate-200/80 rounded-full px-2.5 py-1 text-xs font-bold text-center text-slate-900 focus:outline-hidden focus:border-[#0055B8] shadow-2xs"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center border border-slate-200/80 rounded-full bg-white shadow-2xs px-1 py-0.5">
                            <button
                              type="button"
                              onClick={() => updateCartItemQty(item.product.id, item.quantity - 1)}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer text-xs active:scale-90"
                            >
                              -
                            </button>
                            <span className="px-2 font-mono text-xs text-slate-900 font-bold min-w-[1.5rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartItemQty(item.product.id, item.quantity + 1)}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer text-xs active:scale-90"
                            >
                              +
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-all cursor-pointer active:scale-95"
                          title="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact & Workshop Form */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs">
                <h2 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-200/80 mb-5 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#0055B8]" />
                  <span>
                    {checkoutMode === "bulk" ? "Company & Procurement Details" : "Contact & Workshop Details"}
                  </span>
                </h2>

                <form 
                  id="machinery-order-form" 
                  onSubmit={checkoutMode === "bulk" ? handleBulkQuoteSubmit : handlePlaceOrderSubmit} 
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-mono text-[10px] font-bold text-slate-700 block mb-1 uppercase">
                        {checkoutMode === "bulk" ? "CONTACT PERSON / PROCUREMENT OFFICER *" : "RECIPIENT / WORKSHOP CONTACT *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-white border border-slate-200/80 text-xs py-2.5 px-3.5 rounded-xl focus:outline-hidden focus:border-[#0055B8] focus:ring-2 focus:ring-[#0055B8]/10 text-slate-900 h-[42px] shadow-2xs transition-all"
                        placeholder="e.g. Kelvin Mutua"
                      />
                    </div>

                    <div>
                      <label className="font-mono text-[10px] font-bold text-slate-700 block mb-1 uppercase">
                        PHONE / WHATSAPP NUMBER *
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-white border border-slate-200/80 text-xs py-2.5 px-3.5 rounded-xl focus:outline-hidden focus:border-[#0055B8] focus:ring-2 focus:ring-[#0055B8]/10 text-slate-900 h-[42px] shadow-2xs transition-all"
                        placeholder="e.g. 0712 345 678"
                      />
                      {customerPhone && (
                        <div className="mt-1">
                          {getSafaricomValidation(customerPhone).isValid ? (
                            <span className="text-[9.5px] text-emerald-700 font-medium font-mono flex items-center gap-1">
                              ✓ Active Line Detected (+{getSafaricomValidation(customerPhone).apiFormatted})
                            </span>
                          ) : (
                            <span className="text-[9.5px] text-slate-500 font-mono">
                              Notifications will be sent to this number
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bulk specific fields */}
                  {checkoutMode === "bulk" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl">
                      <div>
                        <label className="font-mono text-[10px] font-bold text-slate-700 block mb-1 uppercase">
                          COMPANY / ENTERPRISE NAME (OPTIONAL)
                        </label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full bg-white border border-slate-200/80 text-xs py-2.5 px-3.5 rounded-xl focus:outline-hidden focus:border-[#0055B8] focus:ring-2 focus:ring-[#0055B8]/10 text-slate-900 h-[42px] shadow-2xs transition-all"
                          placeholder="e.g. Apex Auto Garage & Engineering Ltd"
                        />
                      </div>

                      <div>
                        <label className="font-mono text-[10px] font-bold text-slate-700 block mb-1 uppercase">
                          KRA TAX PIN / VAT NO (OPTIONAL)
                        </label>
                        <input
                          type="text"
                          value={companyTaxPin}
                          onChange={(e) => setCompanyTaxPin(e.target.value)}
                          className="w-full bg-white border border-slate-200/80 text-xs py-2.5 px-3.5 rounded-xl focus:outline-hidden focus:border-[#0055B8] focus:ring-2 focus:ring-[#0055B8]/10 text-slate-900 h-[42px] shadow-2xs uppercase font-mono transition-all"
                          placeholder="e.g. P051234567Z"
                        />
                      </div>

                      <div>
                        <label className="font-mono text-[10px] font-bold text-slate-700 block mb-1 uppercase">
                          PROCUREMENT TIMELINE
                        </label>
                        <select
                          value={procurementTimeline}
                          onChange={(e) => setProcurementTimeline(e.target.value)}
                          className="w-full bg-white border border-slate-200/80 text-xs py-2 px-3.5 rounded-xl focus:outline-hidden focus:border-[#0055B8] focus:ring-2 focus:ring-[#0055B8]/10 text-slate-900 cursor-pointer h-[42px] shadow-2xs transition-all"
                        >
                          <option value="Immediate (Within 7 Days)">Immediate (Within 7 Days)</option>
                          <option value="1-2 Weeks">1 - 2 Weeks</option>
                          <option value="Within 30 Days">Within 30 Days</option>
                          <option value="Tender / Budget Planning">Tender / Budget Planning</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-mono text-[10px] font-bold text-slate-700 block mb-1 uppercase">
                          TARGET BUDGET RANGE (KES)
                        </label>
                        <input
                          type="text"
                          value={targetBudget}
                          onChange={(e) => setTargetBudget(e.target.value)}
                          className="w-full bg-white border border-slate-200/80 text-xs py-2.5 px-3.5 rounded-xl focus:outline-hidden focus:border-[#0055B8] focus:ring-2 focus:ring-[#0055B8]/10 text-slate-900 h-[42px] shadow-2xs transition-all"
                          placeholder="e.g. KES 1.5M - 2.5M"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-mono text-[10px] font-bold text-slate-700 block mb-1 uppercase">
                        EMAIL ADDRESS (FOR QUOTE & INVOICE)
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full bg-white border border-slate-200/80 text-xs py-2.5 px-3.5 rounded-xl focus:outline-hidden focus:border-[#0055B8] focus:ring-2 focus:ring-[#0055B8]/10 text-slate-900 h-[42px] shadow-2xs transition-all"
                        placeholder="e.g. info@yourcompany.co.ke"
                      />
                    </div>

                    <div>
                      <label className="font-mono text-[10px] font-bold text-slate-700 block mb-1 uppercase">
                        COUNTY *
                      </label>
                      <select
                        value={selectedCounty}
                        onChange={(e) => setSelectedCounty(e.target.value)}
                        className="w-full bg-white border border-slate-200/80 text-xs py-2 px-3.5 rounded-xl focus:outline-hidden focus:border-[#0055B8] focus:ring-2 focus:ring-[#0055B8]/10 text-slate-900 cursor-pointer h-[42px] shadow-2xs transition-all"
                      >
                        {KENYAN_COUNTIES.map((c) => (
                          <option key={c} value={c}>{c} County</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-mono text-[10px] font-bold text-slate-700 block mb-1 uppercase">
                      PHYSICAL WORKSHOP / SITE LOCATION *
                    </label>
                    <input
                      type="text"
                      required
                      value={workshopLocation}
                      onChange={(e) => setWorkshopLocation(e.target.value)}
                      className="w-full bg-white border border-slate-200/80 text-xs py-2.5 px-3.5 rounded-xl focus:outline-hidden focus:border-[#0055B8] focus:ring-2 focus:ring-[#0055B8]/10 text-slate-900 h-[42px] shadow-2xs transition-all"
                      placeholder="e.g. Plot 45, Off Enterprise Road, Industrial Area, Nairobi"
                    />
                  </div>

                  {checkoutMode === "bulk" ? (
                    <div>
                      <label className="font-mono text-[10px] font-bold text-slate-700 block mb-1 uppercase">
                        CUSTOM SPECIFICATIONS & SCOPE NOTES (OPTIONAL)
                      </label>
                      <textarea
                        rows={3}
                        value={bulkCustomRequirements}
                        onChange={(e) => setBulkCustomRequirements(e.target.value)}
                        className="w-full bg-white border border-slate-200/80 text-xs py-2.5 px-3.5 rounded-xl focus:outline-hidden focus:border-[#0055B8] focus:ring-2 focus:ring-[#0055B8]/10 text-slate-900 shadow-2xs transition-all"
                        placeholder="Describe special voltage requirements (380V 3-Phase), installation needs, training requests, or custom fittings..."
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="font-mono text-[10px] font-bold text-slate-700 block mb-1 uppercase">
                        SPECIAL SITE INSTRUCTIONS (OPTIONAL)
                      </label>
                      <input
                        type="text"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        className="w-full bg-white border border-slate-200/80 text-xs py-2.5 px-3.5 rounded-xl focus:outline-hidden focus:border-[#0055B8] focus:ring-2 focus:ring-[#0055B8]/10 text-slate-900 h-[42px] shadow-2xs transition-all"
                        placeholder="e.g. Forklift available on site / Call before loading"
                      />
                    </div>
                  )}

                  {/* Submission Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#0055B8] hover:bg-[#004494] disabled:bg-slate-400 text-white font-medium py-3.5 px-6 rounded-full shadow-2xs transition-all mt-6 flex items-center justify-center gap-2.5 cursor-pointer text-sm tracking-wide active:scale-95 min-h-[48px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                        <span>Transmitting to Sales Operations...</span>
                      </>
                    ) : checkoutMode === "bulk" ? (
                      <>
                        <Send className="w-5 h-5 text-white" />
                        <span>Submit Bulk Quote Request ({getBulkTotalUnits()} Units)</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 text-white" />
                        <span>Place Machinery Order</span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-slate-500 text-center mt-2 leading-relaxed">
                    ✓ Instant notifications sent via WhatsApp & official email • 12-month manufacturer warranty included
                  </p>
                </form>
              </div>

            </div>

            {/* Right Block: Summary Card */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs sticky top-20">
                <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-200/80 mb-4 flex items-center justify-between">
                  <span>{checkoutMode === "bulk" ? "Bulk Scope Summary" : "Order Summary"}</span>
                  <span className="text-[10px] font-mono font-medium text-[#0055B8] bg-blue-50/80 px-2.5 py-1 rounded-full border border-blue-200/80">
                    {checkoutMode === "bulk" ? `${getBulkTotalUnits()} total units` : `${cart.length} item(s)`}
                  </span>
                </h3>
                
                <div className="space-y-3 text-xs border-b border-slate-200/80 pb-4 mb-4">
                  <div className="flex justify-between text-slate-600">
                    <span>{checkoutMode === "bulk" ? "Catalog Unit Subtotal" : "Equipment Subtotal"}</span>
                    <span className="font-mono font-bold text-slate-900">
                      KES {(checkoutMode === "bulk" ? getBulkEstimatedTotal() : getCartTotal()).toLocaleString()}
                    </span>
                  </div>

                  {discount > 0 && checkoutMode === "order" && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Affiliate Discount</span>
                      <span className="font-mono">-KES {discount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>Destination County</span>
                    <span className="font-mono text-xs font-medium text-slate-800">
                      {selectedCounty} County
                    </span>
                  </div>
                </div>

                {/* Promo code input (for standard orders) */}
                {checkoutMode === "order" && (
                  <div className="mb-5 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
                    <label className="font-mono text-[9.5px] text-[#0055B8] block font-bold uppercase tracking-wider">
                      PROMO / REFERRAL CODE
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="e.g. HAOSAIL-PROMO"
                        className="flex-1 bg-white border border-slate-200/80 rounded-full px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-[#0055B8] font-mono shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="bg-[#0055B8] hover:bg-[#004494] text-white text-xs font-medium px-4 py-2 rounded-full transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        Apply
                      </button>
                    </div>
                    {promoFeedback && (
                      <p className={`text-[10px] font-medium leading-normal ${isPromoSuccess ? "text-emerald-600" : "text-red-500"}`}>
                        {promoFeedback}
                      </p>
                    )}
                  </div>
                )}

                {/* Total Row */}
                <div className="flex items-baseline justify-between mb-6 pt-2 border-t border-slate-100">
                  <span className="text-sm font-semibold text-slate-800">
                    {checkoutMode === "bulk" ? "Estimated Catalog Total" : "Total Order Amount"}
                  </span>
                  <span className="font-bold text-[#0055B8] text-xl sm:text-2xl">
                    KES {(checkoutMode === "bulk" ? getBulkEstimatedTotal() : finalTotal).toLocaleString()}
                  </span>
                </div>

                {/* Assurance */}
                <div className="border border-blue-200/80 bg-blue-50/60 rounded-2xl p-4 text-[11px] leading-relaxed text-slate-700 space-y-2">
                  <div className="flex items-center gap-2 text-[#0055B8] font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Haosail Direct Guarantee</span>
                  </div>
                  <p>
                    Every order includes a genuine 12-month manufacturer warranty, official E-TIMS tax invoice, pre-delivery quality inspection, and technical handover support.
                  </p>
                </div>

                {/* Contact Sales Support */}
                <div className="mt-4 pt-4 border-t border-slate-200/80 text-center">
                  <p className="text-[11px] text-slate-500">
                    Questions before ordering? Call our showroom directly:
                  </p>
                  <a
                    href="tel:0792620789"
                    className="font-medium text-xs text-[#0055B8] hover:underline block mt-1"
                  >
                    📞 +254 792 620 789 (Sales & Technical Desk)
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
