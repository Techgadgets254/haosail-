import React, { useState, useEffect, useRef } from "react";
import { 
  LayoutGrid, 
  Package, 
  Box, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  LogOut, 
  Search, 
  Bell, 
  ChevronDown, 
  Menu, 
  X, 
  Lock, 
  Unlock, 
  Download, 
  Plus, 
  ShieldCheck, 
  FileText, 
  Wrench, 
  Zap, 
  Trash2, 
  Camera,
  Upload,
  User,
  CheckCircle2
} from "lucide-react";
import { useStore } from "../StoreContext";
import { useAdminStore } from "./AdminStore";
import { collection, doc, setDoc, deleteDoc, updateDoc, writeBatch, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import HaosailLogo from "./HaosailLogo";

// Modular Subcomponents
import AdminOverview from "./admin/AdminOverview";
import AdminInventory from "./admin/AdminInventory";
import AdminOrders from "./admin/AdminOrders";
import AdminInquiries from "./admin/AdminInquiries";
import AdminSpareParts from "./admin/AdminSpareParts";
import AdminFlashOffers from "./admin/AdminFlashOffers";
import AdminTrashBin from "./admin/AdminTrashBin";
import AdminDiagnostics from "./admin/AdminDiagnostics";
import AdminCredentialManager from "./AdminCredentialManager";
import AuditLogTable from "./AuditLogTable";
import MetadataEditor from "./MetadataEditor";

export default function AdminDashboard() {
  const store = useStore();
  const adminStore = useAdminStore();

  // Prefer live real-time products and orders from AdminStoreProvider, fallback to StoreContext
  const products = adminStore?.liveProducts && adminStore.liveProducts.length > 0 
    ? adminStore.liveProducts 
    : store.products || [];

  const orders = adminStore?.liveOrders && adminStore.liveOrders.length > 0 
    ? adminStore.liveOrders 
    : store.orders || [];

  // Passcode Security gate (Default passcode 2026)
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem("haosail_admin_auth") === "true";
    } catch (e) {
      return false;
    }
  });
  const [authError, setAuthError] = useState("");

  // Active Tab
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [inboxSubTab, setInboxSubTab] = useState<"inquiries" | "spare_parts">("inquiries");
  const [settingsSubTab, setSettingsSubTab] = useState<"credentials" | "audit" | "seo" | "trash">("credentials");
  
  // Kenyan Currency default
  const [currencySymbol, setCurrencySymbol] = useState<string>("KES ");
  const [searchQuery, setSearchQuery] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [pendingPartsCount, setPendingPartsCount] = useState<number>(0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Logged-in Administrator Profile with local persistence
  const [adminProfile, setAdminProfile] = useState<{
    name: string;
    role: string;
    email: string;
    avatarUrl: string | null;
  }>(() => {
    try {
      const stored = localStorage.getItem("haosail_admin_profile");
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      name: "Operations Lead",
      role: "Store Administrator",
      email: "admin@haosail.ke",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=160"
    };
  });

  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [tempProfileName, setTempProfileName] = useState(adminProfile.name);
  const [tempProfileRole, setTempProfileRole] = useState(adminProfile.role);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time listener for pending spare parts requests
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, "spare_parts_requests"), (snapshot) => {
        let pending = 0;
        snapshot.forEach((d) => {
          const data = d.data();
          if (data.status === "submitted" || data.status === "under_review" || !data.status) {
            pending++;
          }
        });
        setPendingPartsCount(pending);
      }, (err) => {
        console.warn("Could not listen to spare parts count:", err);
      });
      return () => unsub();
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // Handle Passcode Submit
  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = passcode.trim();
    if (clean === "2026" || clean === "admin" || clean === "haosail2026") {
      setIsAuthenticated(true);
      setAuthError("");
      try {
        sessionStorage.setItem("haosail_admin_auth", "true");
      } catch (e) {}
    } else {
      setAuthError("Invalid access key. Default passcode is 2026.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem("haosail_admin_auth");
    } catch (e) {}
  };

  // Add Product to Firestore
  const handleAddProduct = async (productData: any) => {
    try {
      const newId = `prod_${Date.now()}`;
      await setDoc(doc(db, "products", newId), {
        ...productData,
        id: newId,
        createdAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("Failed to add product:", err);
      throw err;
    }
  };

  // Update Product (supports updating existing products and fallback seed items)
  const handleUpdateProduct = async (id: string, productData: any) => {
    try {
      const prodRef = doc(db, "products", id);
      const snap = await getDoc(prodRef);
      if (!snap.exists()) {
        const existing = products.find((p) => p.id === id);
        const fullData = {
          name: existing?.name || productData.name || "HaoSail Machinery Item",
          brand: existing?.brand || productData.brand || "HaoSail",
          category: existing?.category || productData.category || "Auto Maintenance",
          price: Number(productData.price ?? existing?.price ?? 0),
          stock: Math.max(0, Math.floor(Number(productData.stock ?? existing?.stock ?? 0))),
          description: existing?.description || productData.description || "HaoSail industrial workshop equipment",
          image: existing?.image || productData.image || "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800",
          sku: existing?.sku || productData.sku || `HS-${Math.floor(1000 + Math.random() * 9000)}`,
          ...productData,
          id,
          updatedAt: new Date().toISOString()
        };
        await setDoc(prodRef, fullData);
      } else {
        await updateDoc(prodRef, {
          ...productData,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error("Failed to update product:", err);
      throw err;
    }
  };

  // Delete Product (Move to trash)
  const handleDeleteProduct = async (id: string) => {
    const prod = products.find((p) => p.id === id);
    if (!prod) return;

    try {
      await setDoc(doc(db, "trash", id), {
        ...prod,
        deletedAt: new Date().toISOString(),
        deletedBy: "Admin Portal"
      });
      await deleteDoc(doc(db, "products", id));
    } catch (err: any) {
      console.error("Failed to move product to trash:", err);
      throw err;
    }
  };

  // Bulk Delete Products
  const handleBulkDelete = async (ids: string[]) => {
    try {
      const batch = writeBatch(db);
      ids.forEach((id) => {
        const prod = products.find((p) => p.id === id);
        if (prod) {
          batch.set(doc(db, "trash", id), {
            ...prod,
            deletedAt: new Date().toISOString(),
            deletedBy: "Admin Bulk Purge"
          });
          batch.delete(doc(db, "products", id));
        }
      });
      await batch.commit();
    } catch (err: any) {
      console.error("Bulk delete error:", err);
      throw err;
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, status: { paymentStatus?: string; shippingStatus?: string }) => {
    try {
      await updateDoc(doc(db, "orders", orderId), status);
    } catch (err: any) {
      console.error("Failed to update order status:", err);
      throw err;
    }
  };

  // Delete Order
  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, "orders", orderId));
    } catch (err: any) {
      console.error("Failed to delete order record:", err);
      throw err;
    }
  };

  // Export Catalog CSV
  const handleExportProductsCSV = () => {
    if (products.length === 0) {
      alert("No machinery records available to export.");
      return;
    }

    const headers = ["ID", "Name", "Brand", "Category", "Price", "Stock", "SKU"];
    const rows = products.map((p) => [
      `"${p.id || ""}"`,
      `"${(p.name || "").replace(/"/g, '""')}"`,
      `"${(p.brand || "").replace(/"/g, '""')}"`,
      `"${(p.category || "").replace(/"/g, '""')}"`,
      p.price || 0,
      p.stock || 0,
      `"${p.sku || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HaoSail_Machinery_Inventory_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Orders CSV
  const handleExportOrdersCSV = () => {
    if (orders.length === 0) {
      alert("No customer order records available to export.");
      return;
    }

    const headers = ["Order ID", "Customer Name", "Customer Email", "Total (KES)", "Payment Status", "Shipping Status", "Created At"];
    const rows = orders.map((o) => [
      `"${o.id || ""}"`,
      `"${(o.customerName || "").replace(/"/g, '""')}"`,
      `"${(o.customerEmail || "").replace(/"/g, '""')}"`,
      o.totalAmount || 0,
      `"${o.paymentStatus || "Pending"}"`,
      `"${o.shippingStatus || "Processing"}"`,
      `"${o.createdAt || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HaoSail_Orders_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import Products CSV
  const handleImportProductsCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const csvText = reader.result as string;
        const lines = csvText.split("\n").filter((l) => l.trim().length > 0);
        if (lines.length < 2) return;

        let importedCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(",").map((s) => s.replace(/^"|"$/g, "").trim());
          if (parts.length >= 4) {
            const name = parts[1] || parts[0];
            const brand = parts[2] || "HaoSail";
            const category = parts[3] || "Auto Maintenance";
            const price = Number(parts[4]) || 100000;
            const stock = Number(parts[5]) || 5;

            const newId = `imported_${Date.now()}_${i}`;
            await setDoc(doc(db, "products", newId), {
              id: newId,
              name,
              brand,
              category,
              price,
              stock,
              description: "Imported industrial equipment",
              image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800",
              createdAt: new Date().toISOString()
            });
            importedCount++;
          }
        }
        alert(`Successfully imported ${importedCount} machinery items.`);
      } catch (err) {
        console.warn("Import error:", err);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Generate Executive PDF Report
  const handleGeneratePdf = () => {
    const printWin = window.open("", "_blank");
    if (!printWin) {
      alert("Please allow popups to generate the printable executive report.");
      return;
    }

    const totalRev = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const lowStockList = products.filter((p) => (p.stock || 0) <= lowStockThreshold);

    const docHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>HaoSail Kenya - Operations & Inventory Audit</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0F172A; max-width: 850px; margin: auto; }
            .header { border-bottom: 3px solid #0055B8; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .logo { font-size: 24px; font-weight: 900; color: #0055B8; }
            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
            .kpi-box { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 15px; border-radius: 12px; }
            .kpi-title { font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: bold; }
            .kpi-val { font-size: 20px; font-weight: 900; color: #0F172A; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th { background: #F1F5F9; padding: 10px; text-align: left; font-weight: bold; color: #334155; }
            td { padding: 10px; border-bottom: 1px solid #E2E8F0; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; background: #DBEAFE; color: #1E40AF; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">HAOSAIL MACHINERY KENYA</div>
              <div style="font-size: 12px; color: #64748B; margin-top: 3px;">Executive Operations & Inventory Audit</div>
              <div style="font-size: 11px; color: #64748B;">Nairobi Headquarters &bull; Tel: +254 741 814041</div>
            </div>
            <div style="text-align: right;">
              <span class="badge">OFFICIAL AUDIT</span>
              <div style="font-size: 12px; color: #64748B; margin-top: 6px;">Generated: ${new Date().toLocaleString()}</div>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-box">
              <div class="kpi-title">Gross Volume</div>
              <div class="kpi-val" style="color: #0055B8;">KES ${totalRev.toLocaleString()}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-title">Total Orders</div>
              <div class="kpi-val">${orders.length}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-title">Catalog Models</div>
              <div class="kpi-val">${products.length}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-title">Stock Alerts</div>
              <div class="kpi-val" style="color: #DC2626;">${lowStockList.length}</div>
            </div>
          </div>

          <h3 style="font-size: 14px; text-transform: uppercase; color: #0F172A; margin-top: 30px;">Critical Stock Alert Items</h3>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Price (KES)</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              ${lowStockList.map((p) => `
                <tr>
                  <td><strong>${p.name}</strong></td>
                  <td>${p.category || "General"}</td>
                  <td>KES ${(Number(p.price) || 0).toLocaleString()}</td>
                  <td style="color: #DC2626; font-weight: bold;">${p.stock || 0} units</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWin.document.write(docHtml);
    printWin.document.close();
  };

  // Avatar Upload Handlers
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (JPG, PNG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const updated = { ...adminProfile, avatarUrl: base64 };
      setAdminProfile(updated);
      try {
        localStorage.setItem("haosail_admin_profile", JSON.stringify(updated));
      } catch (e) {}
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    const updated = { ...adminProfile, avatarUrl: null };
    setAdminProfile(updated);
    try {
      localStorage.setItem("haosail_admin_profile", JSON.stringify(updated));
    } catch (e) {}
  };

  const handleSaveProfileInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...adminProfile,
      name: tempProfileName.trim() || "Operations Lead",
      role: tempProfileRole.trim() || "Store Administrator"
    };
    setAdminProfile(updated);
    try {
      localStorage.setItem("haosail_admin_profile", JSON.stringify(updated));
    } catch (e) {}
    setIsEditProfileModalOpen(false);
  };

  // Initials generator for fallback avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || "AD";
  };

  // Clean Sidebar Navigation (Financial Wallet & Ledger removed per requirements)
  const SIDEBAR_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "product", label: "Inventory", icon: Package, badge: products.length },
    { id: "orders", label: "Orders", icon: Box, badge: orders.length },
    { id: "inbox", label: "Inbox", icon: MessageSquare, badge: pendingPartsCount > 0 ? pendingPartsCount : undefined },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const getPageTitle = () => {
    switch (activeTab) {
      case "dashboard": return "Operations Overview";
      case "product": return "Machinery Inventory";
      case "orders": return "Orders & Fulfillment";
      case "inbox": return "Customer Inbox & Spare Parts";
      case "analytics": return "Analytics & Diagnostics";
      case "settings": return "System Settings";
      default: return "Operations Overview";
    }
  };

  // If not authenticated, render login gate with official HaoSail branding
  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-xl space-y-6 text-center text-slate-900 dark:text-white">
          <div className="flex items-center justify-center">
            <HaosailLogo className="h-9" variant="dark" />
          </div>

          <div>
            <span className="text-[10px] font-bold text-[#0055B8] dark:text-blue-400 uppercase tracking-wider">
              OPERATIONS PORTAL
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">Admin Dashboard Login</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Enter your executive security passcode to access inventory controls, dispatch operations, and customer inquiries.
            </p>
          </div>

          {authError && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold text-red-700 dark:text-red-300">
              {authError}
            </div>
          )}

          <form onSubmit={handlePasscodeSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Security Passcode</label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Enter passcode (Default: 2026)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-[#0055B8] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#0055B8]/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white font-mono tracking-widest focus:outline-none min-h-[46px]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#0055B8] hover:bg-[#004494] text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer min-h-[46px]"
            >
              <Unlock className="w-4 h-4" />
              <span>Authenticate & Enter</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500">
            Handover passcode: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">2026</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-slate-950 text-slate-900 dark:text-slate-100 -mx-3 sm:-mx-6 lg:-mx-8 -my-4 sm:-my-8 p-3 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-6">
      
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Left Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 md:rounded-3xl md:border md:border-slate-200 dark:md:border-slate-800 md:shadow-xs ${
        mobileNavOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div>
          {/* Top Logo & Brand */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 mb-6">
            <HaosailLogo className="h-8" variant="dark" />

            <button
              onClick={() => setMobileNavOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all relative cursor-pointer min-h-[44px] ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950/50 text-[#0055B8] dark:text-blue-400"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#0055B8] dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`} />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.badge !== undefined && (
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isActive 
                          ? "bg-[#0055B8] dark:bg-blue-600 text-white" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}>
                        {item.badge}
                      </span>
                    )}

                    {isActive && (
                      <span className="w-1.5 h-6 rounded-full bg-[#0055B8] dark:bg-blue-500 absolute right-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Logged-in Admin Card */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div 
            onClick={() => {
              setTempProfileName(adminProfile.name);
              setTempProfileRole(adminProfile.role);
              setIsEditProfileModalOpen(true);
            }}
            className="flex items-center gap-3 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer group"
          >
            {adminProfile.avatarUrl ? (
              <img
                src={adminProfile.avatarUrl}
                alt={adminProfile.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#0055B8] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {getInitials(adminProfile.name)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-[#0055B8] dark:group-hover:text-blue-400">
                {adminProfile.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {adminProfile.role}
              </p>
            </div>
            <Camera className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0055B8] shrink-0" />
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer min-h-[40px]"
          >
            <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Backdrop overlay for mobile */}
      {mobileNavOpen && (
        <div 
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 space-y-6">
        
        {/* Top Header Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Left Title & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-2xs min-h-[42px] min-w-[42px] flex items-center justify-center"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {getPageTitle()}
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
                HaoSail Kenya Administrative Control & Warehouse Portal
              </p>
            </div>
          </div>

          {/* Center Search Bar */}
          <div className="flex-1 max-w-md w-full mx-auto sm:mx-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search inventory, orders, inquiries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-full pl-11 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0055B8] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#0055B8] shadow-2xs min-h-[42px]"
              />
            </div>
          </div>

          {/* Right User Profile and Notifications */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* User Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {adminProfile.avatarUrl ? (
                  <img
                    src={adminProfile.avatarUrl}
                    alt={adminProfile.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#0055B8] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {getInitials(adminProfile.name)}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white block leading-tight">
                    {adminProfile.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block leading-tight">
                    {adminProfile.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 text-xs space-y-1">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="font-bold text-slate-900 dark:text-white">{adminProfile.name}</p>
                    <p className="text-[10px] text-slate-400">{adminProfile.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setTempProfileName(adminProfile.name);
                      setTempProfileRole(adminProfile.role);
                      setIsEditProfileModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-2"
                  >
                    <Camera className="w-3.5 h-3.5 text-slate-400" />
                    <span>Change Profile Picture</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("settings");
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>System Settings</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 font-medium text-red-600 dark:text-red-400 cursor-pointer flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setActiveTab("inbox")}
                className="p-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition-colors cursor-pointer min-h-[42px] min-w-[42px] flex items-center justify-center"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {pendingPartsCount > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 absolute top-1.5 right-1.5 ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>
            </div>
          </div>

        </header>

        {/* Dynamic Viewport */}
        <main className="flex-1">
          {activeTab === "dashboard" && (
            <AdminOverview
              products={products}
              orders={orders}
              onNavigateTab={setActiveTab}
              onOpenAddModal={() => setActiveTab("product")}
              onGeneratePdf={handleGeneratePdf}
              lowStockThreshold={lowStockThreshold}
              setLowStockThreshold={setLowStockThreshold}
              currencySymbol={currencySymbol}
              setCurrencySymbol={setCurrencySymbol}
            />
          )}

          {activeTab === "product" && (
            <AdminInventory
              products={products}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onBulkDelete={handleBulkDelete}
              onExportCSV={handleExportProductsCSV}
              onImportCSV={handleImportProductsCSV}
              lowStockThreshold={lowStockThreshold}
            />
          )}

          {activeTab === "orders" && (
            <AdminOrders
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onDeleteOrder={handleDeleteOrder}
              onExportCSV={handleExportOrdersCSV}
            />
          )}

          {activeTab === "inbox" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Inbox Sub-navigation */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2">
                <button
                  onClick={() => setInboxSubTab("inquiries")}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                    inboxSubTab === "inquiries"
                      ? "bg-[#0055B8] text-white"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Price Quotes & Restock Requests
                </button>
                <button
                  onClick={() => setInboxSubTab("spare_parts")}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer min-h-[40px] ${
                    inboxSubTab === "spare_parts"
                      ? "bg-[#0055B8] text-white"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>Spare Parts Requests</span>
                  {pendingPartsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold">
                      {pendingPartsCount}
                    </span>
                  )}
                </button>
              </div>

              {inboxSubTab === "inquiries" ? <AdminInquiries /> : <AdminSpareParts />}
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6 animate-fadeIn">
              <AdminDiagnostics products={products} orders={orders} />
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Settings Sub-navigation */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSettingsSubTab("credentials")}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                    settingsSubTab === "credentials"
                      ? "bg-[#0055B8] text-white"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Access Keys & Roles
                </button>
                <button
                  onClick={() => setSettingsSubTab("audit")}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                    settingsSubTab === "audit"
                      ? "bg-[#0055B8] text-white"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Security Audit Logs
                </button>
                <button
                  onClick={() => setSettingsSubTab("seo")}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                    settingsSubTab === "seo"
                      ? "bg-[#0055B8] text-white"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Metadata & Google Merchant
                </button>
                <button
                  onClick={() => setSettingsSubTab("trash")}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                    settingsSubTab === "trash"
                      ? "bg-[#0055B8] text-white"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Trash Bin (60-Day Purge)
                </button>
              </div>

              {/* Subtab View */}
              {settingsSubTab === "credentials" && <AdminCredentialManager currentAdminEmail={adminProfile.email} />}
              {settingsSubTab === "audit" && <AuditLogTable />}
              {settingsSubTab === "seo" && <MetadataEditor />}
              {settingsSubTab === "trash" && <AdminTrashBin />}
            </div>
          )}
        </main>

      </div>

      {/* Administrator Profile Update Modal (Centered, no page scroll needed) */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-8 max-w-md w-full shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Admin Profile & Picture
              </h3>
              <button
                onClick={() => setIsEditProfileModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Avatar Showcase */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="relative">
                {adminProfile.avatarUrl ? (
                  <img
                    src={adminProfile.avatarUrl}
                    alt={adminProfile.name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-[#0055B8] shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#0055B8] text-white flex items-center justify-center font-bold text-2xl shadow-md">
                    {getInitials(tempProfileName)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-[#0055B8] hover:bg-[#004494] text-white rounded-full shadow-md cursor-pointer transition-transform hover:scale-105"
                  title="Upload picture"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#0055B8] dark:text-blue-400 font-bold text-xs hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  Upload New Photo
                </button>
                {adminProfile.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>

            {/* Profile Information Form */}
            <form onSubmit={handleSaveProfileInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Administrator Display Name
                </label>
                <input
                  type="text"
                  required
                  value={tempProfileName}
                  onChange={(e) => setTempProfileName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0055B8] min-h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Designation / Role Title
                </label>
                <input
                  type="text"
                  required
                  value={tempProfileRole}
                  onChange={(e) => setTempProfileRole(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0055B8] min-h-[42px]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer min-h-[42px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0055B8] hover:bg-[#004494] text-white shadow-md cursor-pointer transition-colors min-h-[42px]"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
