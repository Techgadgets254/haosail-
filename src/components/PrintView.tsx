import React from "react";
import { Order } from "../types";
import { Printer, ShieldCheck, MapPin, Phone, Mail } from "lucide-react";
import { printInvoiceIframe } from "../utils/printInvoice";
import HaosailLogo from "./HaosailLogo";

interface PrintViewProps {
  order: Order;
  onClose?: () => void;
  onPrint?: () => void;
}

export const PrintView: React.FC<PrintViewProps> = ({ order, onClose, onPrint }) => {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      printInvoiceIframe(order);
    }
  };

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : new Date().toLocaleDateString("en-GB");

  const subtotal = (order.items || []).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const totalAmount = order.totalAmount || subtotal;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-2 sm:p-4 overflow-y-auto print-modal-wrapper">
      <div data-theme-preserve className="bg-white text-zinc-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print-modal-content">
        {/* Top Control Bar (Hidden when printed) */}
        <div className="bg-zinc-900 text-white p-4 flex items-center justify-between no-print border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#0066CC]" />
            <span className="font-bold text-sm tracking-wide">Official Tax Invoice & Order Receipt Preview</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Printable Document Body */}
        <div id="print-invoice-area" className="p-6 sm:p-10 bg-white text-zinc-900 overflow-y-auto flex-1 font-sans">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-zinc-900 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <HaosailLogo className="h-10" />
              </div>
              <div className="mt-4 text-xs text-zinc-600 space-y-0.5 leading-relaxed">
                <p className="font-semibold text-zinc-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Industrial Area, Lokitaung Road (Indaa Business Park, Dakar Rd)</span>
                </p>
                <p className="pl-4">Nairobi, Kenya • Website: https://haosail.ke</p>
                <p className="pl-4 flex items-center gap-3 mt-1 text-zinc-700 font-medium">
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-zinc-800" /> +254 750 707038 / 0732 002244</span>
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-zinc-800" /> info@haosail.ke</span>
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right w-full sm:w-auto bg-zinc-50 p-4 rounded-xl border border-zinc-200">
              <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">OFFICIAL TAX RECEIPT / INVOICE</div>
              <div className="text-lg font-black text-zinc-900 font-mono mt-0.5">#{order.id ? order.id.slice(0, 10).toUpperCase() : "HS-ORD"}</div>
              <div className="mt-2 text-xs text-zinc-600 space-y-0.5">
                <p><strong className="text-zinc-800">Date Issued:</strong> {formattedDate}</p>
                <p><strong className="text-zinc-800">Payment Provider:</strong> {order.paymentProvider || "M-Pesa / Bank Wire"}</p>
                {order.receiptNo && (
                  <p className="text-emerald-700 font-semibold font-mono">
                    <strong>Payment Clear Ref:</strong> {order.receiptNo}
                  </p>
                )}
              </div>
              <div className="mt-3 pt-2 border-t border-zinc-200 flex items-center justify-end gap-2">
                <div className="text-right">
                  <div className="text-[8px] font-mono font-bold text-zinc-900 uppercase">Verification QR</div>
                  <div className="text-[7px] font-mono text-zinc-500">Scan for Order Ref</div>
                </div>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(order.id || "HS-ORD")}`}
                  alt={`QR Code for Order ${order.id}`}
                  className="w-12 h-12 rounded-md border border-zinc-300 p-0.5 bg-white object-contain shrink-0 block"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

          {/* Customer & Shipping Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-zinc-200 text-xs">
            <div>
              <span className="text-zinc-400 uppercase font-mono font-bold tracking-wider text-[10px] block mb-1">Billed To</span>
              <p className="font-bold text-sm text-zinc-900">{order.customerName || "Valued Client"}</p>
              <p className="text-zinc-600 mt-0.5">{order.customerEmail}</p>
              <p className="text-zinc-600">{order.customerPhone || order.mpesaPhone || "+254 750 707038"}</p>
            </div>

            <div>
              <span className="text-zinc-400 uppercase font-mono font-bold tracking-wider text-[10px] block mb-1">Shipping & Dispatch Location</span>
              <p className="font-semibold text-zinc-800">{order.shippingAddress || "Showroom Pickup - Industrial Area Nairobi / Crane Transit"}</p>
              <p className="text-zinc-500 mt-1">Delivery Status: <span className="font-bold text-emerald-700 uppercase">{order.shippingStatus || "Processing"}</span> | Payment Status: <span className="font-bold text-emerald-700 uppercase">{order.paymentStatus || "Paid"}</span></p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="py-6">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-zinc-100 text-zinc-700 font-mono uppercase text-[10px] tracking-wider border-b-2 border-zinc-300">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Equipment / Machinery Description</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-right">Unit Price</th>
                  <th className="py-3 px-3 text-right">Total (KES)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {(order.items || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50">
                    <td className="py-3 px-3 font-mono text-zinc-400">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-zinc-900">{item.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{item.brand}</p>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-zinc-800">{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono text-zinc-700">KES {Number(item.price).toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900">
                      KES {Number(item.price * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start pt-4 border-t-2 border-zinc-900 gap-6 text-xs">
            <div className="space-y-2 max-w-xs">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Authorized Manufacturer Guarantee</span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-snug">
                  All equipment supplied by Haosail Machinery Kenya includes 12-Month Factory Warranty and technical training support.
                </p>
              </div>
            </div>

            <div className="w-full sm:w-64 space-y-2 font-mono">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal:</span>
                <span>KES {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-zinc-600 gap-2">
                <span>Courier / Transport:</span>
                <span className="text-zinc-900 font-bold text-right text-[11px]">
                  {(order.shippingAddress || "").toLowerCase().includes("nairobi")
                    ? "KES 0 (FREE - Local Nairobi Dispatch)"
                    : "Communicated by Haosail Logistics"}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-zinc-900 pt-2 border-t border-zinc-300">
                <span>Total Amount:</span>
                <span>KES {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Store Policies & Fiscal Clearance Section */}
          <div className="mt-8 pt-6 border-t-2 border-zinc-200">
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2 text-xs">
              <p className="font-extrabold text-amber-800 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                OFFICIAL SERVICE POLICIES: 12-MONTH FACTORY WARRANTY & TECHNICAL SUPPORT
              </p>
              <ul className="text-zinc-700 text-[11px] leading-relaxed space-y-1 pl-1">
                <li>• <strong>WARRANTY COVERAGE:</strong> 12 Months (1 Year) Haosail factory warranty on all industrial motors, hydraulic pumps, and mechanical gearboxes.</li>
                <li>• <strong>TECHNICAL TRAINING:</strong> Free operational guidance and technical setup training provided by Haosail engineers in Nairobi.</li>
                <li>• <strong>SPARE PARTS GUARANTEE:</strong> Original replacement parts and wear components stocked locally in Nairobi for immediate maintenance response.</li>
                <li>• <strong>INSPECTION & TESTING:</strong> All machinery undergoes strict pre-delivery factory inspection prior to customer handover.</li>
              </ul>
            </div>
          </div>

          {/* Footer & Signature Line */}
          <div className="mt-8 pt-6 border-t border-zinc-200 flex flex-col sm:flex-row justify-between items-end text-[10px] text-zinc-500">
            <div>
              <p className="font-bold text-zinc-700">Haosail Machinery Co., Ltd (Kenya)</p>
              <p>Industrial Area, Lokitaung Road, Nairobi, Kenya • Phone: +254 750 707038 • Email: info@haosail.ke</p>
              <p className="mt-1 italic">Thank you for trusting Haosail Kenya for your industrial and construction machinery solutions.</p>
            </div>

            <div className="mt-6 sm:mt-0 text-right flex flex-col items-center sm:items-end">
              <div className="stamp-box text-center">
                {order.paymentStatus === "Paid" || (order.paymentStatus || "").toUpperCase() === "SUCCESS" || (order.paymentStatus || "").toUpperCase() === "COMPLETED" ? (
                  <div className="paid-stamp-badge inline-block border-2 border-double border-emerald-700 text-emerald-700 bg-emerald-50 px-4 py-1.5 rounded-lg font-mono font-black text-sm tracking-widest uppercase -rotate-3 shadow-inner">
                    ✓ PAID & VERIFIED
                  </div>
                ) : (
                  <div className="inline-block border-2 border-double border-red-700 text-red-700 bg-red-50 px-4 py-1.5 rounded-lg font-mono font-black text-sm tracking-widest uppercase -rotate-3 shadow-inner">
                    ⚠ PENDING PAYMENT
                  </div>
                )}
                <p className="text-[9px] uppercase tracking-wider text-zinc-600 font-extrabold font-mono text-center mt-1">
                  Official Store Clearance Stamp
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintView;
