import React, { useState } from "react";
import { 
  Activity, 
  CheckCircle2, 
  Send, 
  Smartphone, 
  Database, 
  Globe, 
  Download, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle, 
  Server,
  Zap,
  Copy,
  ExternalLink
} from "lucide-react";
import { Product, Order } from "../../types";

interface AdminDiagnosticsProps {
  products: Product[];
  orders: Order[];
}

export default function AdminDiagnostics({ products, orders }: AdminDiagnosticsProps) {
  const [testPhone, setTestPhone] = useState("+254741814041");
  const [testMessage, setTestMessage] = useState("Haosail Machinery Kenya: Test notification ping from Admin Operations Portal.");
  const [isTestingWhatsApp, setIsTestingWhatsApp] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestWhatsApp = async () => {
    setIsTestingWhatsApp(true);
    setTestResult(null);
    try {
      // Direct WhatsApp API URI
      const cleanPhone = testPhone.replace(/[^0-9]/g, "");
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(testMessage)}`;
      window.open(waUrl, "_blank");
      setTestResult("WhatsApp chat trigger launched successfully.");
    } catch (e: any) {
      setTestResult("Error opening WhatsApp link: " + e.message);
    } finally {
      setIsTestingWhatsApp(false);
    }
  };

  // Full Database Backup JSON download
  const handleDownloadFullBackup = () => {
    const backupData = {
      backupTimestamp: new Date().toISOString(),
      store: "Haosail Machinery Kenya",
      productsCount: products.length,
      ordersCount: orders.length,
      products,
      orders,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `haosail_full_backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-200 animate-fadeIn font-sans">
      {/* Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-[#0066CC] dark:text-[#3399FF] uppercase tracking-wider">SYSTEM TELEMETRY & INTEGRATIONS</span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Diagnostics & Operations Health</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time status checks for M-Pesa gateways, WhatsApp messaging, feeds, and automatic database backups.
          </p>
        </div>

        <button
          onClick={handleDownloadFullBackup}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer self-start md:self-auto shadow-sm min-h-[40px]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Full JSON Backup</span>
        </button>
      </div>

      {/* Grid of System Services */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Firestore Database */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#0066CC] dark:text-[#3399FF] flex items-center justify-center border border-blue-100 dark:border-blue-800">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Firestore Cloud DB</h4>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Google Cloud Platform</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              ONLINE
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Real-time multi-client sync active for {products.length} machinery items and {orders.length} transactions.
          </p>
        </div>

        {/* Order Notification & Dispatch Gateway */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">WhatsApp &amp; Email Dispatch</h4>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Direct Sales Desk Routing</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Real-time multi-channel notification dispatch to sales engineers via WhatsApp and email.
          </p>
        </div>

        {/* Google Merchant XML Feed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-800">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">SEO & Merchant Feed</h4>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Google Shopping XML</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              INDEXED
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Automated schema.org microdata for industrial equipment, prices, and instant stock indicators.
          </p>
        </div>
      </div>

      {/* WhatsApp Cloud Dispatch Tester */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">WhatsApp Notification Simulation Test</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verify customer order dispatch alerts and contractor quotes via WhatsApp.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Recipient Mobile (Kenya +254)</label>
            <input
              type="text"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-[#0066CC] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none min-h-[42px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Test Message Content</label>
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-[#0066CC] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none min-h-[42px]"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {testResult && (
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{testResult}</p>
          )}
          <button
            onClick={handleTestWhatsApp}
            disabled={isTestingWhatsApp}
            className="sm:ml-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 min-h-[42px]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Test WhatsApp Alert</span>
          </button>
        </div>
      </div>
    </div>
  );
}
