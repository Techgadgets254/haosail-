import React, { useState, useMemo } from "react";
import { 
  Search, 
  Download, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Truck, 
  Package, 
  Phone, 
  ExternalLink, 
  Printer, 
  Trash2, 
  MessageSquare,
  AlertCircle,
  Eye,
  Filter,
  DollarSign,
  Send,
  Loader2,
  Check
} from "lucide-react";
import { Order } from "../../types";
import Pagination from "../Pagination";

interface AdminOrdersProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: { paymentStatus?: string; shippingStatus?: string }) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onExportCSV: () => void;
}

export default function AdminOrders({
  orders,
  onUpdateOrderStatus,
  onDeleteOrder,
  onExportCSV,
}: AdminOrdersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "failed" | "dispatched" | "delivered">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected Order for Full Receipt Modal
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isResending, setIsResending] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        (o.id || "").toLowerCase().includes(q) ||
        (o.customerName || "").toLowerCase().includes(q) ||
        (o.customerPhone || "").toLowerCase().includes(q) ||
        (o.mpesaReceiptNumber || "").toLowerCase().includes(q) ||
        (o.shippingAddress || "").toLowerCase().includes(q) ||
        (o.county || "").toLowerCase().includes(q)
      );

      let matchesStatus = true;
      const pStatus = String(o.paymentStatus || "").toUpperCase();
      const sStatus = String(o.shippingStatus || "").toUpperCase();

      if (statusFilter === "paid") {
        matchesStatus = pStatus.includes("PAID") || pStatus.includes("SUCCESS") || pStatus.includes("COMPLETED");
      } else if (statusFilter === "pending") {
        matchesStatus = pStatus.includes("PENDING");
      } else if (statusFilter === "failed") {
        matchesStatus = pStatus.includes("FAILED") || pStatus.includes("CANCELLED");
      } else if (statusFilter === "dispatched") {
        matchesStatus = sStatus === "DISPATCHED" || sStatus === "IN_TRANSIT";
      } else if (statusFilter === "delivered") {
        matchesStatus = sStatus === "DELIVERED";
      }

      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [orders, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  // Order Counts
  const counts = useMemo(() => {
    let paid = 0;
    let pending = 0;
    let dispatched = 0;
    let delivered = 0;

    orders.forEach((o) => {
      const p = String(o.paymentStatus || "").toUpperCase();
      const s = String(o.shippingStatus || "").toUpperCase();
      if (p.includes("PAID") || p.includes("SUCCESS") || p.includes("COMPLETED")) paid++;
      if (p.includes("PENDING")) pending++;
      if (s === "DISPATCHED" || s === "IN_TRANSIT") dispatched++;
      if (s === "DELIVERED") delivered++;
    });

    return { total: orders.length, paid, pending, dispatched, delivered };
  }, [orders]);

  const handlePrintInvoice = (order: Order) => {
    const printWin = window.open("", "_blank");
    if (!printWin) {
      alert("Please allow popups to generate and print invoices.");
      return;
    }

    const itemsHtml = (order.items || []).map((item) => `
      <tr style="border-bottom: 1px solid #E2E8F0;">
        <td style="padding: 10px 12px; font-weight: bold; color: #1E293B;">${item.name || "Machinery Item"}</td>
        <td style="padding: 10px 12px; text-align: center; color: #64748B;">${item.quantity || 1}</td>
        <td style="padding: 10px 12px; text-align: right; color: #1E293B;">KES ${(Number(item.price) || 0).toLocaleString()}</td>
        <td style="padding: 10px 12px; text-align: right; font-weight: bold; color: #0066CC;">KES ${((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString()}</td>
      </tr>
    `).join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Haosail Machinery - Invoice #${order.id.slice(0, 8).toUpperCase()}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0F172A; max-width: 800px; margin: auto; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0066CC; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 900; color: #0066CC; }
            .badge { background: #E0F2FE; color: #0369A1; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #F8FAFC; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; }
            .total-box { margin-top: 30px; text-align: right; border-top: 2px solid #E2E8F0; padding-top: 15px; }
            .footer { margin-top: 50px; font-size: 11px; color: #94A3B8; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">HAOSAIL MACHINERY KENYA</div>
              <p style="color: #64748B; font-size: 12px; margin: 4px 0 0 0;">Official Commercial Proforma Invoice &bull; E-TIMS Tax Compliant</p>
              <p style="color: #64748B; font-size: 11px; margin: 2px 0 0 0;">Waiyaki Way / Enterprise Road Showroom, Nairobi | Tel: +254 792 620 789</p>
            </div>
            <div class="badge">
              ${order.paymentStatus || "PENDING"}
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; margin-bottom: 25px; font-size: 12px;">
            <div>
              <strong style="color: #475569; font-size: 10px; text-transform: uppercase;">BILLED TO CUSTOMER:</strong>
              <div style="font-weight: bold; font-size: 14px; margin-top: 2px;">${order.customerName || "Customer"}</div>
              <div>Phone: ${order.customerPhone || "N/A"}</div>
              <div>Address: ${order.shippingAddress || "Nairobi, Kenya"}</div>
              ${order.notes ? `<div style="margin-top: 4px; color: #0284C7;">Notes: ${order.notes}</div>` : ""}
            </div>
            <div style="text-align: right;">
              <div><strong>Invoice Date:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-KE") : new Date().toLocaleDateString("en-KE")}</div>
              <div><strong>Order Reference:</strong> #${order.id.slice(0, 8).toUpperCase()}</div>
              <div><strong>Payment Terms:</strong> ${order.paymentMethod || "Pay on Delivery / Proforma"}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Equipment Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total-box">
            <div style="font-size: 13px; color: #64748B;">Transport & Freight: <strong style="color: #0066CC;">${order.county === "Nairobi" ? "FREE (Nairobi Delivery)" : "Standard Freight"}</strong></div>
            <div style="font-size: 18px; font-weight: 900; color: #0066CC; margin-top: 8px;">
              Total Payable: KES ${(Number(order.totalAmount) || 0).toLocaleString()}
            </div>
          </div>

          <div class="footer">
            <p>Thank you for choosing Haosail Machinery Kenya. Genuine 12-Month Warranty & Field Engineering Support Included.</p>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  const handleResendNotifications = async (order: Order) => {
    setIsResending(order.id);
    try {
      // 1. Email notification to techgadgetsk@gmail.com & info@haosail.ke
      await fetch("/api/order/notify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          customerName: order.customerName,
          customerEmail: order.customerEmail || "info@haosail.ke",
          customerPhone: order.customerPhone,
          totalAmount: order.totalAmount,
          items: order.items,
          shippingAddress: order.shippingAddress,
          county: order.county,
          notes: order.notes,
          paymentMethod: order.paymentMethod
        })
      });

      // 2. WhatsApp notification to 0792620789
      await fetch("/api/whatsapp/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          totalAmount: order.totalAmount,
          itemsCount: order.items?.length || 1,
          county: order.county || "Nairobi",
          paymentMethod: order.paymentMethod || "Pay on Delivery"
        })
      });

      setResendSuccess(order.id);
      setTimeout(() => setResendSuccess(null), 3000);
    } catch (err) {
      console.error("Resend notification error:", err);
      alert("Notification resend completed.");
    } finally {
      setIsResending(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-slate-800 dark:text-slate-200">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer, phone, order ID, or county..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0066CC] dark:focus:border-blue-500 font-sans min-h-[42px]"
          />
        </div>

        {/* CSV Export & Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportCSV}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer min-h-[42px]"
            title="Export Orders as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-[#0066CC] text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            All Orders ({counts.total})
          </button>

          <button
            onClick={() => { setStatusFilter("pending"); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === "pending"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50"
            }`}
          >
            Pending / Active ({counts.pending})
          </button>

          <button
            onClick={() => { setStatusFilter("paid"); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === "paid"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
            }`}
          >
            Paid / Cleared ({counts.paid})
          </button>

          <button
            onClick={() => { setStatusFilter("dispatched"); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === "dispatched"
                ? "bg-sky-600 text-white shadow-xs"
                : "bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50"
            }`}
          >
            Dispatched ({counts.dispatched})
          </button>

          <button
            onClick={() => { setStatusFilter("delivered"); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === "delivered"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50"
            }`}
          >
            Delivered ({counts.delivered})
          </button>
        </div>
      </div>

      {/* Orders Container: Responsive Desktop Table + Dedicated Mobile Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
        
        {/* 1. DESKTOP VIEW: Full Data Table (`hidden md:block`) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-[11px] font-sans font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">ORDER & TIME</th>
                <th className="py-3.5 px-4">CLIENT & CONTACT</th>
                <th className="py-3.5 px-4">EQUIPMENT ORDERED</th>
                <th className="py-3.5 px-4">TOTAL AMOUNT</th>
                <th className="py-3.5 px-4">PAYMENT STATUS</th>
                <th className="py-3.5 px-4">DISPATCH STATUS</th>
                <th className="py-3.5 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-sans">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500 dark:text-slate-400">
                    <Package className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-medium">No customer orders match this filter.</p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const pUpper = String(order.paymentStatus || "").toUpperCase();
                  const isPaid = pUpper.includes("PAID") || pUpper.includes("SUCCESS") || pUpper.includes("COMPLETED");
                  const isPending = pUpper.includes("PENDING");
                  const isDispatched = String(order.shippingStatus || "").toUpperCase() === "DISPATCHED";
                  const isDelivered = String(order.shippingStatus || "").toUpperCase() === "DELIVERED";
                  const cleanPhone = (order.customerPhone || "").replace(/[^0-9]/g, "");

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Order & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900 dark:text-white block">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                            {order.orderType === "bulk_quote" && (
                              <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded">
                                BULK
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-KE", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            }) : "Recent"}
                          </span>
                        </div>
                      </td>

                      {/* Client Details with WhatsApp & Phone */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {order.customerName || "Customer"}
                            </span>
                            {order.companyName && (
                              <span className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-1 rounded font-semibold">
                                {order.companyName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {order.customerPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone.startsWith("0") ? "254" + cleanPhone.substring(1) : cleanPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 font-mono font-bold"
                                title="Chat with customer on WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>{order.customerPhone}</span>
                              </a>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate max-w-xs mt-0.5">
                            📍 {order.shippingAddress || "Kenya"}
                          </span>
                        </div>
                      </td>

                      {/* Equipment List */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 max-w-xs">
                          {order.items?.slice(0, 2).map((it, idx) => (
                            <div key={idx} className="text-xs text-slate-800 dark:text-slate-200 line-clamp-1">
                              <span className="font-bold text-slate-900 dark:text-white">{it.quantity || 1}x</span> {it.name}
                            </div>
                          ))}
                          {(order.items?.length || 0) > 2 && (
                            <span className="text-[10px] text-[#0066CC] dark:text-blue-400 font-bold">
                              +{(order.items?.length || 0) - 2} more item(s)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Amount & Terms */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block font-mono">
                            KES {(Number(order.totalAmount) || 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block max-w-[130px] truncate" title={order.paymentMethod || "Pay on Delivery"}>
                            {order.paymentMethod || "Pay on Delivery"}
                          </span>
                        </div>
                      </td>

                      {/* Payment Status Dropdown */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={order.paymentStatus || "Pending (Pay on Delivery)"}
                          onChange={(e) => onUpdateOrderStatus(order.id, { paymentStatus: e.target.value })}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                            isPaid
                              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                              : isPending
                              ? "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                              : "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                          }`}
                        >
                          <option value="Pending (Pay on Delivery)">Pending (Pay on Delivery)</option>
                          <option value="Pending (Bank Proforma Invoice)">Pending (Bank Invoice)</option>
                          <option value="Paid">PAID (Clear & Confirmed)</option>
                          <option value="Cancelled">Cancelled / Failed</option>
                        </select>
                      </td>

                      {/* Dispatch Status Dropdown */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={order.shippingStatus || "Processing"}
                          onChange={(e) => onUpdateOrderStatus(order.id, { shippingStatus: e.target.value })}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                            isDelivered
                              ? "bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                              : isDispatched
                              ? "bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          <option value="Pending">Pending Review</option>
                          <option value="Processing">Processing Warehouse</option>
                          <option value="Dispatched">Dispatched on Route</option>
                          <option value="Delivered">Delivered & Signed</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleResendNotifications(order)}
                            disabled={isResending === order.id}
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                            title="Resend Admin Email & WhatsApp Alert"
                          >
                            {isResending === order.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                            ) : resendSuccess === order.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            onClick={() => setViewingOrder(order)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 hover:text-[#0066CC] dark:hover:text-blue-400 transition-colors cursor-pointer"
                            title="View Full Order Breakdown"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handlePrintInvoice(order)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 hover:text-[#0066CC] dark:hover:text-blue-400 transition-colors cursor-pointer"
                            title="Print Customer Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Delete record for Order #${order.id.toUpperCase()}?`)) {
                                onDeleteOrder(order.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete Order Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 2. MOBILE VIEW: Dedicated Order Cards (`md:hidden`) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800 p-3 space-y-3">
          {paginatedOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <Package className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-medium text-xs">No customer orders match this filter.</p>
            </div>
          ) : (
            paginatedOrders.map((order) => {
              const pUpper = String(order.paymentStatus || "").toUpperCase();
              const isPaid = pUpper.includes("PAID") || pUpper.includes("SUCCESS") || pUpper.includes("COMPLETED");
              const isPending = pUpper.includes("PENDING");
              const isDispatched = String(order.shippingStatus || "").toUpperCase() === "DISPATCHED";
              const isDelivered = String(order.shippingStatus || "").toUpperCase() === "DELIVERED";
              const cleanPhone = (order.customerPhone || "").replace(/[^0-9]/g, "");

              return (
                <div
                  key={order.id}
                  className="pt-3 first:pt-0 pb-3 bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-100 dark:border-slate-800 space-y-3"
                >
                  {/* Card Header: Order ID, Bulk tag, Time, and Total Amount */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        {order.orderType === "bulk_quote" && (
                          <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded">
                            BULK
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block mt-0.5">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-KE", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        }) : "Recent"}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm sm:text-base font-extrabold text-[#0066CC] dark:text-blue-400 font-mono block">
                        KES {(Number(order.totalAmount) || 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block max-w-[140px]">
                        {order.paymentMethod || "Pay on Delivery"}
                      </span>
                    </div>
                  </div>

                  {/* Customer Info & Contact */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {order.customerName || "Customer"}
                      </span>
                      {order.companyName && (
                        <span className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 px-1 rounded font-semibold truncate max-w-[120px]">
                          {order.companyName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      {order.customerPhone ? (
                        <a
                          href={`https://wa.me/${cleanPhone.startsWith("0") ? "254" + cleanPhone.substring(1) : cleanPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 font-mono font-bold"
                          title="WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>{order.customerPhone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">No phone</span>
                      )}

                      <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                        📍 {order.shippingAddress || "Kenya"}
                      </span>
                    </div>
                  </div>

                  {/* Equipment summary preview */}
                  <div className="text-xs space-y-0.5">
                    <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase block">Items:</span>
                    {order.items?.slice(0, 2).map((it, idx) => (
                      <div key={idx} className="text-xs text-slate-700 dark:text-slate-300 truncate">
                        <span className="font-bold text-slate-900 dark:text-white">{it.quantity || 1}x</span> {it.name}
                      </div>
                    ))}
                    {(order.items?.length || 0) > 2 && (
                      <span className="text-[10px] text-[#0066CC] dark:text-blue-400 font-bold block">
                        +{(order.items?.length || 0) - 2} more item(s)
                      </span>
                    )}
                  </div>

                  {/* Status Dropdowns: Payment & Dispatch */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase block mb-1">Payment</span>
                      <select
                        value={order.paymentStatus || "Pending (Pay on Delivery)"}
                        onChange={(e) => onUpdateOrderStatus(order.id, { paymentStatus: e.target.value })}
                        className={`w-full text-[11px] font-bold px-2 py-2 rounded-xl border focus:outline-none cursor-pointer min-h-[42px] ${
                          isPaid
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            : isPending
                            ? "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                            : "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                        }`}
                      >
                        <option value="Pending (Pay on Delivery)">Pending (Pay on Delivery)</option>
                        <option value="Pending (Bank Proforma Invoice)">Pending (Bank Invoice)</option>
                        <option value="Paid">PAID (Clear)</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase block mb-1">Dispatch</span>
                      <select
                        value={order.shippingStatus || "Processing"}
                        onChange={(e) => onUpdateOrderStatus(order.id, { shippingStatus: e.target.value })}
                        className={`w-full text-[11px] font-bold px-2 py-2 rounded-xl border focus:outline-none cursor-pointer min-h-[42px] ${
                          isDelivered
                            ? "bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                            : isDispatched
                            ? "bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <option value="Pending">Pending Review</option>
                        <option value="Processing">Processing</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </div>
                  </div>

                  {/* Actions Toolbar: Touch Friendly */}
                  <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleResendNotifications(order)}
                      disabled={isResending === order.id}
                      className="bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 py-2 rounded-xl flex items-center justify-center gap-1 min-h-[40px] text-[10px] font-bold cursor-pointer"
                      title="Resend Alert"
                    >
                      {isResending === order.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : resendSuccess === order.id ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Alert</span>
                    </button>

                    <button
                      onClick={() => setViewingOrder(order)}
                      className="bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#0066CC] dark:text-blue-300 py-2 rounded-xl flex items-center justify-center gap-1 min-h-[40px] text-[10px] font-bold cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>

                    <button
                      onClick={() => handlePrintInvoice(order)}
                      className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2 rounded-xl flex items-center justify-center gap-1 min-h-[40px] text-[10px] font-bold cursor-pointer"
                      title="Print Invoice"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete record for Order #${order.id.toUpperCase()}?`)) {
                          onDeleteOrder(order.id);
                        }
                      }}
                      className="bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 py-2 rounded-xl flex items-center justify-center gap-1 min-h-[40px] text-[10px] font-bold cursor-pointer"
                      title="Delete Order"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        {filteredOrders.length > itemsPerPage && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredOrders.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* View Order Modal (Centered, no page scroll needed) */}
      {viewingOrder && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn font-sans overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-8 shadow-2xl space-y-5 text-slate-900 dark:text-white my-auto max-h-[92vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#0066CC] dark:text-blue-400 uppercase tracking-wider font-mono">ORDER SPECIFICATION</span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Order #{viewingOrder.id.slice(0, 8).toUpperCase()}
                </h3>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                Close
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-2 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Customer:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{viewingOrder.customerName || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Phone:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{viewingOrder.customerPhone || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Delivery Address:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-right">{viewingOrder.shippingAddress || "Nairobi"}</span>
                </div>
                {viewingOrder.notes && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Site Instructions:</span>
                    <span className="font-bold text-[#0066CC] dark:text-blue-400 text-right">{viewingOrder.notes}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Payment Terms:</span>
                  <span className="font-bold text-amber-800 dark:text-amber-400">{viewingOrder.paymentMethod || "Pay on Delivery"}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[11px] mb-2">Itemized Equipment:</h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                  {viewingOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center bg-white dark:bg-slate-900">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{item.name}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.quantity || 1} x KES {(Number(item.price) || 0).toLocaleString()}</span>
                      </div>
                      <span className="font-bold text-[#0066CC] dark:text-blue-400">
                        KES {((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Total Order Amount:</span>
                <span className="text-lg font-extrabold text-[#0066CC] dark:text-blue-400">
                  KES {(Number(viewingOrder.totalAmount) || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <a
                href={`https://wa.me/${(viewingOrder.customerPhone || "").replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm min-h-[44px]"
              >
                <MessageSquare className="w-4 h-4 text-white" />
                <span>WhatsApp Client</span>
              </a>

              <button
                onClick={() => handlePrintInvoice(viewingOrder)}
                className="bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm min-h-[44px]"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
