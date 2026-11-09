/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useStore } from "../StoreContext";
import { 
  ShieldCheck, 
  RotateCcw, 
  Truck, 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  FileText, 
  MapPin, 
  Phone, 
  Mail, 
  AlertCircle,
  PackageCheck,
  DollarSign,
  ArrowRight,
  ChevronRight,
  Send
} from "lucide-react";

export default function ReturnPolicyView() {
  const { setActiveView, user, orders } = useStore();
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState("");
  const [returnReason, setReturnReason] = useState("defective");
  const [returnNotes, setReturnNotes] = useState("");
  const [returnSubmitted, setReturnSubmitted] = useState(false);

  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const orderRef = selectedOrderForReturn || "General Order / Item";
    const msg = `Hello Haosail Kenya Return Team, I would like to initiate a return under your 30-Day Return Policy:\n\nOrder Ref: ${orderRef}\nReason: ${returnReason}\nNotes: ${returnNotes || "N/A"}\n\nPlease guide me on courier dispatch / store drop-off at Waiyaki Way.`;
    window.open(`https://wa.me/254792620789?text=${encodeURIComponent(msg)}`, "_blank");
    setReturnSubmitted(true);
  };

  return (
    <div id="return-policy-page" className="max-w-5xl mx-auto space-y-10 pb-16 font-sans">
      
      {/* Schema.org MerchantReturnPolicy JSON-LD script for Google Merchant Center Crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MerchantReturnPolicy",
            "name": "Haosail Kenya Official 30-Day Return & Refund Policy",
            "applicableCountry": "KE",
            "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
            "merchantReturnDays": 30,
            "returnMethod": [
              "https://schema.org/ReturnByMail",
              "https://schema.org/ReturnInStore"
            ],
            "returnFees": "https://schema.org/FreeReturn",
            "customerRemorseReturnFees": "https://schema.org/ReturnFeesCustomerResponsibility",
            "itemCondition": [
              "https://schema.org/NewCondition",
              "https://schema.org/RefurbishedCondition"
            ],
            "merchantReturnLink": "https://haosail.ke/return-policy",
            "refundType": "https://schema.org/FullRefund",
            "restockingFee": {
              "@type": "MonetaryAmount",
              "value": 0,
              "currency": "KES"
            },
            "returnShippingFeesAmount": {
              "@type": "MonetaryAmount",
              "value": 0,
              "currency": "KES"
            }
          })
        }}
      />

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#141414] via-[#0A0A0A] to-[#121212] border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0066CC]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0066CC]/10 border border-[#0066CC]/30 text-[#0066CC] text-xs font-mono font-bold uppercase tracking-wider">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Google Merchant Verified Policy</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif italic font-bold text-white tracking-tight leading-tight">
            Return &amp; Refund Policy
          </h1>

          <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-sans">
            At <strong className="text-white">Haosail Kenya</strong>, we stand behind the quality of every car lift, concrete mixer, compressor, generator, and wood working machine we deliver. If you are not 100% satisfied with your purchase, our straightforward 30-day return policy ensures a hassle-free exchange or full refund.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600">
            <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <MapPin className="w-3.5 h-3.5 text-[#0066CC]" />
              Waiyaki Way, Westlands, Nairobi, KE
            </span>
            <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              +254 792 620 789
            </span>
          </div>
        </div>
      </div>

      {/* Google Merchant Center Dedicated Policy Hub */}
      <div className="relative bg-gradient-to-r from-[#181510] via-[#121212] to-[#1c1810] border-2 border-[#0066CC]/40 rounded-3xl p-6 sm:p-10 shadow-[0_0_30px_rgba(197,160,89,0.12)] space-y-8 overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-[#0066CC]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-[#0066CC]/20">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0066CC]/15 border border-[#0066CC]/40 text-[#0066CC] text-[11px] font-mono font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Google Merchant Center Policy Hub</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif italic font-bold text-white">
              Official Store Return Policy Requirements
            </h2>
            <p className="text-xs text-slate-700">
              Verified merchant standards matching Google Merchant Center feeds &amp; Kenyan consumer protection laws
            </p>
          </div>

          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Google Merchant Approved</span>
          </div>
        </div>

        {/* 3 Core Fields Grid required by Google Merchant Center */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Field 1: Return Window */}
          <div className="bg-[#141414] border border-slate-200 hover:border-[#0066CC]/60 rounded-2xl p-6 space-y-3 transition-all shadow-lg group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#0066CC]/15 border border-[#0066CC]/30 flex items-center justify-center text-[#0066CC] group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 bg-[#0066CC]/10 text-[#0066CC] border border-[#0066CC]/20 rounded-md font-bold">
                Required Field #1
              </span>
            </div>
            
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">Return Window</h3>
              <p className="text-2xl font-bold text-white font-serif mt-1">30 Calendar Days</p>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed border-t border-slate-100 pt-3">
              Buyers have <strong className="text-white">30 days</strong> from the date of physical package delivery or in-store pickup to request a return or exchange.
            </p>
          </div>

          {/* Field 2: Return Cost */}
          <div className="bg-[#141414] border border-slate-200 hover:border-emerald-500/60 rounded-2xl p-6 space-y-3 transition-all shadow-lg group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-bold">
                Required Field #2
              </span>
            </div>

            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">Return Cost</h3>
              <p className="text-2xl font-bold text-emerald-400 font-serif mt-1">Free (KES 0)</p>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed border-t border-slate-100 pt-3">
              <strong className="text-emerald-400">100% Free</strong> return courier shipping for defective or wrong items. Flat KES 250 or free in-person drop-off for change of mind.
            </p>
          </div>

          {/* Field 3: Return Conditions */}
          <div className="bg-[#141414] border border-slate-200 hover:border-blue-500/60 rounded-2xl p-6 space-y-3 transition-all shadow-lg group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <PackageCheck className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md font-bold">
                Required Field #3
              </span>
            </div>

            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">Return Conditions</h3>
              <p className="text-xl font-bold text-white font-serif mt-1">New or Unused Condition</p>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed border-t border-slate-100 pt-3">
              Items must be in <strong className="text-white">original box</strong> with un-tampered security seals, matching serial numbers, charger cables, and receipt.
            </p>
          </div>

        </div>

        {/* Additional Merchant Policy Guarantee Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#0066CC] shrink-0" />
            <span className="text-slate-800">
              <strong className="text-white">Zero Restocking Fee (0%):</strong> We do not charge any hidden restocking, processing, or administration fees on approved returns.
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[#0066CC] font-bold shrink-0">
            <span>Refund Time: 3-5 Business Days</span>
          </div>
        </div>
      </div>

      {/* Google Merchant Center Structured Policy Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <FileText className="w-6 h-6 text-[#0066CC]" />
          <div>
            <h2 className="text-xl font-bold text-white font-serif">Google Merchant Specification Overview</h2>
            <p className="text-xs text-slate-500">Comprehensive summary of return parameters for customer transparency and Google Merchant compliance</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800 border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-mono uppercase tracking-wider">
                <th className="py-3 px-4">Policy Attribute</th>
                <th className="py-3 px-4">Specification Details</th>
                <th className="py-3 px-4">Applicable Conditions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr className="hover:bg-white">
                <td className="py-3.5 px-4 font-bold text-slate-800 font-mono">Return Window</td>
                <td className="py-3.5 px-4 font-semibold text-[#0066CC]">30 Calendar Days</td>
                <td className="py-3.5 px-4 text-slate-600">Applies to all heavy machinery, garage lifts, mixers, tools, and equipment.</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-3.5 px-4 font-bold text-slate-800 font-mono">Return Cost (Defective / Damaged)</td>
                <td className="py-3.5 px-4 font-semibold text-emerald-600">100% FREE (KES 0)</td>
                <td className="py-3.5 px-4 text-slate-600">If an item arrives damaged, defective, or misdescribed, Haosail Kenya covers courier costs.</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-3.5 px-4 font-bold text-slate-800 font-mono">Return Cost (Customer Remorse / Change of Mind)</td>
                <td className="py-3.5 px-4 font-semibold text-slate-800">Flat KES 250 Courier OR KES 0 In-Store</td>
                <td className="py-3.5 px-4 text-slate-600">Customer pays local courier shipping fee (KES 250) or drops off at Nairobi CBD shop for free.</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-3.5 px-4 font-bold text-slate-800 font-mono">Restocking Fee</td>
                <td className="py-3.5 px-4 font-semibold text-emerald-600">KES 0 (0%)</td>
                <td className="py-3.5 px-4 text-slate-600">No restocking fees charged on any returned items.</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-3.5 px-4 font-bold text-slate-800 font-mono">Accepted Item Condition</td>
                <td className="py-3.5 px-4 text-slate-800">New, Unused, or Like-New Original Packaging</td>
                <td className="py-3.5 px-4 text-slate-600">Must include original box, power cables, manuals, and serial numbers matching invoice.</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-3.5 px-4 font-bold text-slate-800 font-mono">Refund Method &amp; Currency</td>
                <td className="py-3.5 px-4 font-semibold text-[#0066CC]">Direct Bank Transfer / M-Pesa / Cash (KES)</td>
                <td className="py-3.5 px-4 text-slate-600">Full refund issued directly to buyer's Safaricom M-Pesa number or bank account.</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-3.5 px-4 font-bold text-slate-800 font-mono">Refund Processing Time</td>
                <td className="py-3.5 px-4 font-semibold text-emerald-600">3 to 5 Business Days</td>
                <td className="py-3.5 px-4 text-slate-600">Initiated immediately upon technical inspection and verification at our Nairobi office.</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-3.5 px-4 font-bold text-slate-800 font-mono">Return Locations</td>
                <td className="py-3.5 px-4 text-slate-800">Mail Courier or Physical Shop Drop-Off</td>
                <td className="py-3.5 px-4 text-slate-600">Haosail Kenya, Waiyaki Way, Westlands, Nairobi, KE.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Return Clauses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#0066CC]">
            <PackageCheck className="w-5 h-5" />
            <h3 className="text-lg font-bold text-slate-900 font-serif">1. Eligible Return Requirements</h3>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            To qualify for a 30-day return or exchange, your item must meet the following criteria:
          </p>
          <ul className="space-y-2.5 text-xs text-slate-700 list-disc list-inside">
            <li>Returned within <strong>30 calendar days</strong> of package delivery or pickup.</li>
            <li>Item is in original condition, with security seals, serial tags, and branding untampered.</li>
            <li>Accompanied by original shipping crate/packaging, power accessories, and Haosail tax invoice.</li>
            <li>Equipment operating log and warranty serial tag intact.</li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <Truck className="w-5 h-5" />
            <h3 className="text-lg font-bold text-slate-900 font-serif">2. Shipping &amp; Drop-Off Guidelines</h3>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            You can return products using either of these convenient Kenya methods:
          </p>
          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="font-bold text-slate-900 block mb-1">Option A: In-Store Drop-Off (Free - KES 0)</span>
              Bring the machinery or equipment directly to our Nairobi showroom &amp; service center at Haosail Kenya, Waiyaki Way, Westlands, Nairobi (Open Mon-Sat 8:00 AM - 6:00 PM).
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="font-bold text-slate-900 block mb-1">Option B: Courier Return Dispatch</span>
              Dispatch via Fargo Courier, G4S, or regional heavy freight service addressed to Haosail Kenya Logistics Desk, Nairobi.
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#0066CC]">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="text-lg font-bold text-slate-900 font-serif">3. Inspection &amp; Refund Processing</h3>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Once received, our certified technical team verifies hardware serial numbers and testing diagnostics within <strong>24 to 48 hours</strong>. Upon approval, your full refund is dispatched via M-Pesa or bank transfer within <strong>3 to 5 business days</strong>.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="w-5 h-5" />
            <h3 className="text-lg font-bold text-slate-900 font-serif">4. Non-Returnable Items &amp; Exceptions</h3>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            For industrial safety and structural integrity reasons, the following are non-refundable unless defective:
          </p>
          <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside">
            <li>Customized heavy fabrication or tailor-drilled machinery frames.</li>
            <li>Consumable fluids, lubricating oils, and opened grease canisters.</li>
            <li>Equipment damaged due to improper 3-phase wiring, lack of motor oil, physical impact, or unauthorized disassembly.</li>
          </ul>
        </div>

      </div>

      {/* Interactive Return Request Form */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-serif">Initiate a Return Request</h2>
            <p className="text-xs text-slate-500">Submit an online return notice under our 30-day guarantee to receive immediate courier dispatch details</p>
          </div>
          {user && (
            <button
              onClick={() => setActiveView("client-dashboard")}
              className="text-xs text-[#0066CC] border border-[#0066CC]/30 hover:bg-[#0066CC]/10 px-3 py-1.5 rounded-xl transition-colors font-mono font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Your Account Orders</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {returnSubmitted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Return Request Notice Opened</h3>
            <p className="text-xs text-slate-700 max-w-lg mx-auto">
              Our support team has opened your return notification on WhatsApp / Email. Please bring or ship your item to Haosail Kenya, Waiyaki Way, Westlands, Nairobi along with your order invoice.
            </p>
            <button
              onClick={() => setReturnSubmitted(false)}
              className="text-xs text-emerald-700 font-bold underline cursor-pointer font-mono pt-2"
            >
              Submit another request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitReturn} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-700 font-bold mb-1.5">
                  Order Number / Receipt Ref
                </label>
                {orders && orders.length > 0 ? (
                  <select
                    value={selectedOrderForReturn}
                    onChange={(e) => setSelectedOrderForReturn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0066CC]"
                  >
                    <option value="">-- Select Order or Enter Custom ID --</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        Order #{o.id.substring(0, 8).toUpperCase()} - KES {o.totalAmount?.toLocaleString()} ({new Date(o.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Order #HSL-89214 or Invoice No"
                    value={selectedOrderForReturn}
                    onChange={(e) => setSelectedOrderForReturn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0066CC]"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-700 font-bold mb-1.5">
                  Reason for Return
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0066CC]"
                >
                  <option value="Defective / Damaged Item (Free Return Shipping)">Defective / Damaged Item (Free Return Shipping KES 0)</option>
                  <option value="Incorrect Item Received (Free Return Shipping)">Incorrect Item Received (Free Return Shipping KES 0)</option>
                  <option value="Customer Remorse / Change of Mind (KES 250 / In-Store Free)">Customer Remorse / Change of Mind (30 Days)</option>
                  <option value="Size / Specification Exchange">Size / Specification Exchange</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-700 font-bold mb-1.5">
                Additional Notes / Equipment Serial Numbers
              </label>
              <textarea
                rows={3}
                placeholder="Provide any serial number details, condition notes, or preferred refund/exchange choice..."
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0066CC]"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <p className="text-[11px] text-slate-500">
                Need immediate help? Call support at <strong className="text-slate-900">+254 792 620 789</strong> or email <strong className="text-slate-900">sales@haosail.ke</strong>
              </p>
              <button
                type="submit"
                className="w-full sm:w-auto bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold text-xs px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
              >
                <span>Submit Return Notification</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Support Contact Footer */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
        <div className="space-y-1 text-center sm:text-left">
          <p className="text-slate-900 font-bold text-sm">Haosail Kenya Customer Care &amp; Machinery Logistics</p>
          <p>Waiyaki Way, Westlands, Nairobi, KE</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="mailto:sales@haosail.ke"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-800 font-semibold transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-[#0066CC]" />
            <span>Email Support</span>
          </a>
          <a
            href="https://wa.me/254792620789"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-emerald-800 font-bold transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp (+254 792 620 789)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
