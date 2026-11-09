/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useStore } from "../StoreContext";
import HaosailLogo from "./HaosailLogo";
import { 
  CreditCard, 
  ShieldCheck, 
  Truck, 
  Mail, 
  Send, 
  CheckCircle2,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  ArrowUp,
  MapPin,
  PhoneCall
} from "lucide-react";

export default function Footer() {
  const { setActiveView, subscribeNewsletter } = useStore();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [stockArrivals, setStockArrivals] = useState(true);
  const [priceDrops, setPriceDrops] = useState(true);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const ok = await subscribeNewsletter(email, { stockArrivals, priceDrops });
      if (ok) {
        setStatus("success");
        setEmail("");
        setTimeout(() => setStatus("idle"), 6000);
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <footer id="storefront-footer" className="bg-[#002D62] text-slate-200 font-sans border-t border-[#002047]">
      
      {/* Newsletter Block */}
      <div className="border-b border-blue-900/60 bg-[#00224A] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Newsletter CTA */}
            <div className="lg:col-span-5 space-y-2">
              <div className="flex items-center gap-2 text-sky-300">
                <Mail className="w-4 h-4" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest">Haosail Machinery Kenya</span>
              </div>
              <h3 className="text-white text-lg sm:text-xl font-bold tracking-tight">
                Machinery Arrivals &amp; Direct Quotations
              </h3>
              <p className="text-xs text-blue-100/80 leading-relaxed max-w-md">
                Receive instant stock notifications for heavy car lifts, diesel concrete mixers, sliding table saws, air compressors, and genuine spare parts shipments.
              </p>
            </div>

            {/* Newsletter Subscription input */}
            <div className="lg:col-span-7">
              <form onSubmit={handleSubscribe} className="relative max-w-md lg:ml-auto w-full">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-200" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter business email for equipment updates..."
                      disabled={status === "loading" || status === "success"}
                      data-theme-preserve
                      className="w-full bg-white/10 border border-blue-400/40 focus:outline-none focus:border-white focus:bg-white/15 text-xs py-3 pl-10 pr-4 rounded-xl text-white placeholder-blue-200 transition-all font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status === "loading" || status === "success"}
                    className="bg-[#0066CC] hover:bg-[#0052A3] disabled:opacity-50 text-white px-5 py-3 rounded-xl font-sans text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 shadow-md"
                  >
                    {status === "loading" ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : status === "success" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <>
                        <span>Subscribe</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>

                {/* Subscription Topic Checkboxes */}
                <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3.5 pl-1 text-[11px] font-mono text-blue-200">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={stockArrivals}
                      onChange={(e) => setStockArrivals(e.target.checked)}
                      className="accent-[#0066CC] rounded border-blue-400 bg-blue-900 cursor-pointer w-3.5 h-3.5"
                    />
                    <span>New Stock Arrivals</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={priceDrops}
                      onChange={(e) => setPriceDrops(e.target.checked)}
                      className="accent-[#0066CC] rounded border-blue-400 bg-blue-900 cursor-pointer w-3.5 h-3.5"
                    />
                    <span>Direct Factory Pricing</span>
                  </label>
                </div>

                {/* Validation feedbacks */}
                {status === "success" && (
                  <p className="mt-2 text-[11px] text-emerald-300 font-mono animate-fadeIn flex items-center gap-1.5">
                    ✓ Subscription confirmed! We will keep you updated.
                  </p>
                )}
                {status === "error" && (
                  <p className="mt-2 text-[11px] text-rose-300 font-mono animate-fadeIn">
                    ⚠ Failed to register. Please check your connection or try again.
                  </p>
                )}
              </form>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Core Value Proposition Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 border-b border-blue-900/60 pb-10 mb-10">
          <div className="flex gap-3.5 items-start">
            <div className="bg-white/10 border border-blue-400/30 p-3 rounded-xl text-sky-300 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs sm:text-sm">47 Counties Delivery</h4>
              <p className="text-[11px] text-blue-100/70 mt-0.5 leading-normal">Fast site dispatch across Nairobi &amp; upcountry transport nationwide.</p>
            </div>
          </div>

          <div className="flex gap-3.5 items-start">
            <div className="bg-white/10 border border-blue-400/30 p-3 rounded-xl text-sky-300 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs sm:text-sm flex items-center gap-1.5">
                <span>E-TIMS Tax Compliant</span>
                <span className="text-[9px] bg-sky-400/20 text-sky-200 font-mono px-1 rounded font-bold">KRA</span>
              </h4>
              <p className="text-[11px] text-blue-100/70 mt-0.5 leading-normal">Official tax invoices &amp; corporate proforma quotations generated instantly.</p>
            </div>
          </div>

          <div className="flex gap-3.5 items-start">
            <div className="bg-white/10 border border-blue-400/30 p-3 rounded-xl text-sky-300 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs sm:text-sm">Pay on Delivery &amp; Wire</h4>
              <p className="text-[11px] text-blue-100/70 mt-0.5 leading-normal">Zero online risk: pay upon machinery delivery, bank wire, or showroom collection.</p>
            </div>
          </div>

          <div className="flex gap-3.5 items-start">
            <div className="bg-white/10 border border-blue-400/30 p-3 rounded-xl text-sky-300 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs sm:text-sm">12-Month Warranty</h4>
              <p className="text-[11px] text-blue-100/70 mt-0.5 leading-normal">100% authentic equipment with spare parts support &amp; technician servicing.</p>
            </div>
          </div>
        </div>

        {/* Brand Meta and Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="md:col-span-2 space-y-3">
            <HaosailLogo variant="light" className="h-9" />
            <p className="text-xs text-blue-100/80 max-w-sm leading-relaxed">
              Haosail Machinery Co., Ltd (Kenya) is a premier supplier of heavy hydraulic vehicle lifts, woodworking machines, diesel concrete mixers, plate compactors, industrial air compressors, and silent diesel power generators.
            </p>
          </div>

          <div>
            <h5 className="text-white font-bold text-xs tracking-wider uppercase mb-4">Machinery Divisions</h5>
            <div className="space-y-2 text-xs">
              {["Auto Maintenance & Car Lifts", "Construction Machinery", "Woodworking Equipment", "Metal Working Machinery", "Air Compressors & Pumps", "Generators & Power Systems"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveView("shop");
                  }}
                  className="block hover:text-white text-blue-200/80 transition-colors cursor-pointer text-left"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h5 className="text-white font-bold text-xs tracking-wider uppercase mb-4">Showroom &amp; Depot</h5>
            <div className="space-y-3 text-xs text-blue-100/80 font-mono">
              <div>
                <p className="text-white font-bold mb-1">Nairobi Distribution Hub</p>
                <p className="leading-relaxed">
                  Enterprise Road / Commercial Hub,<br />
                  Industrial Area,<br />
                  <span className="text-sky-300 font-bold">Nairobi, Kenya</span>
                </p>
              </div>
              <div>
                <p className="text-white font-bold">Direct Sales Hotline</p>
                <p>Phone: +254 750 707038</p>
                <p>Email: sales@haosail.ke / info@haosail.ke</p>
              </div>
            </div>
          </div>

        </div>

        <div className="border-t border-blue-900/60 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div>
            <p className="text-blue-200/70">© {new Date().getFullYear()} Haosail Machinery Co., Ltd (Kenya). All rights reserved.</p>
            <div className="flex gap-4 mt-3 justify-center md:justify-start">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-white text-blue-300 transition-colors" title="Haosail Machinery Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white text-blue-300 transition-colors" title="Haosail Machinery on X">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white text-blue-300 transition-colors" title="Haosail Machinery Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-white text-blue-300 transition-colors" title="Haosail Machinery YouTube Channel">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
              }}
              className="text-blue-100 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-400/30 bg-white/5 text-xs font-mono font-bold"
            >
              <ArrowUp className="w-3.5 h-3.5 text-sky-300" />
              <span>Return to Top</span>
            </button>
            <span className="text-blue-400/40 hidden sm:inline">|</span>
            <button
              type="button"
              onClick={() => setActiveView("admin-dashboard")}
              className="text-blue-200 hover:text-white transition-all cursor-pointer flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-400/20 bg-white/5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sky-300" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Admin Console</span>
            </button>
            <span className="text-blue-400/40 hidden sm:inline">|</span>
            <button
              type="button"
              onClick={() => setActiveView("return-policy")}
              className="hover:text-white text-sky-300 font-bold transition-colors cursor-pointer"
            >
              30-Day Return &amp; Warranty Policy
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
