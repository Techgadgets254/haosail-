import React, { useState, useMemo } from "react";
import { 
  TrendingUp, 
  Download, 
  Plus, 
  ArrowUpRight, 
  Star, 
  MessageSquare, 
  ShoppingBag, 
  Clock, 
  Calendar, 
  ChevronDown, 
  LineChart as LineChartIcon, 
  BarChart2, 
  ShieldCheck,
  ChevronRight,
  Filter,
  Package,
  Wrench,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { Product, Order } from "../../types";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from "recharts";

interface AdminOverviewProps {
  products: Product[];
  orders: Order[];
  onNavigateTab: (tab: string) => void;
  onOpenAddModal: () => void;
  onGeneratePdf: () => void;
  lowStockThreshold: number;
  setLowStockThreshold: (val: number) => void;
  currencySymbol?: string;
  setCurrencySymbol?: (sym: string) => void;
}

export default function AdminOverview({
  products,
  orders,
  onNavigateTab,
  onOpenAddModal,
  onGeneratePdf,
  lowStockThreshold,
  setLowStockThreshold,
  currencySymbol = "KES ",
  setCurrencySymbol
}: AdminOverviewProps) {
  // Chart visual mode: Line (spline areas) or Bar
  const [chartMode, setChartMode] = useState<"line" | "bar">("line");
  const [dateRange, setDateRange] = useState("Past 60 Days");

  // Selected top machinery item for showcase
  const topProduct = useMemo(() => {
    if (products && products.length > 0) {
      return products[0];
    }
    return {
      id: "prod_top",
      name: "HaoSail 4.5-Ton Clear Floor Two-Post Car Lift",
      price: 385000,
      stock: 8,
      image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800",
      category: "Auto Maintenance"
    };
  }, [products]);

  // Operational & order volume calculations strictly from live Firestore state
  const metrics = useMemo(() => {
    const paidOrders = orders.filter((o) => {
      const p = String(o.paymentStatus || "").toUpperCase();
      return p === "PAID" || p === "SUCCESS" || p === "COMPLETED";
    });

    const liveTotalRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const liveItemsPurchased = orders.reduce((sum, o) => {
      const itemSum = o.items ? o.items.reduce((s, it) => s + (Number(it.quantity) || 1), 0) : 1;
      return sum + itemSum;
    }, 0);

    const pendingOrdersCount = orders.filter((o) => {
      const p = String(o.paymentStatus || "").toUpperCase();
      return p === "PENDING" || p === "" || !p;
    }).length;

    const lowStockItems = products.filter((p) => Number(p.stock || 0) <= lowStockThreshold);

    return {
      grossSales: liveTotalRevenue,
      netSales: Math.round(liveTotalRevenue * 0.94),
      itemsPurchased: liveItemsPurchased,
      pendingOrdersCount,
      totalOrders: orders.length,
      lowStockCount: lowStockItems.length
    };
  }, [orders, products, lowStockThreshold]);

  // Dynamic Chart dataset aggregated from live orders
  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) {
      return [];
    }

    // Group orders by month/date or past 7 intervals
    const map = new Map<string, { label: string; volume: number; ordersCount: number }>();
    
    // Sort orders ascending by date
    const sorted = [...orders].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ta - tb;
    });

    sorted.forEach((o) => {
      const date = o.createdAt ? new Date(o.createdAt) : new Date();
      const label = date.toLocaleDateString([], { month: "short", day: "numeric" });
      const current = map.get(label) || { label, volume: 0, ordersCount: 0 };
      current.volume += Number(o.totalAmount) || 0;
      current.ordersCount += 1;
      map.set(label, current);
    });

    return Array.from(map.values()).map((item, idx) => ({
      day: String(idx + 1),
      label: item.label,
      volume: item.volume,
      orange: Number((item.volume / 1000000).toFixed(2)),
      orders: item.ordersCount,
      valStr: item.volume >= 1000000 
        ? `${(item.volume / 1000000).toFixed(1)}M` 
        : item.volume >= 1000 
        ? `${(item.volume / 1000).toFixed(0)}k` 
        : `${item.volume}`
    }));
  }, [orders]);

  // Recent Orders List strictly from live Firestore state (no fake mock records)
  const recentOrdersList = useMemo(() => {
    if (!orders || orders.length === 0) {
      return [];
    }

    return orders.slice(0, 6).map((o, idx) => ({
      id: o.id || `ord_${idx}`,
      name: o.customerName || "Customer",
      item: o.items?.[0]?.name || "Machinery Item",
      qty: o.items?.[0]?.quantity || 1,
      amount: Number(o.totalAmount) || 0,
      status: o.shippingStatus || "Processing",
      time: o.createdAt 
        ? new Date(o.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })
        : "Recent",
      image: o.items?.[0]?.image || products[0]?.image || "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=120"
    }));
  }, [orders, products]);

  return (
    <div className="space-y-6 animate-fadeIn pb-8 font-sans">
      {/* Quick Action Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Currency:</span>
          <span className="inline-flex items-center px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs text-[#0055B8] dark:text-blue-400 shadow-2xs">
            KES (Kenyan Shillings)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onGeneratePdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer shadow-2xs min-h-[36px]"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Export Report</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0055B8] hover:bg-[#004494] text-white font-bold text-xs transition-all cursor-pointer shadow-2xs min-h-[36px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Machinery</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (8 of 12) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Row 1: Top 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Card 1: Gross Orders Value */}
            <div className="bg-[#0055B8] rounded-3xl p-5 text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[120px]">
              <svg className="absolute -right-4 -bottom-6 w-32 h-32 opacity-20 pointer-events-none text-white" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="5">
                <circle cx="50" cy="50" r="18" />
                <circle cx="50" cy="50" r="32" />
                <circle cx="50" cy="50" r="48" />
              </svg>

              <div>
                <span className="text-xs font-semibold text-blue-100 block">Total Order Volume</span>
                <h3 className="text-2xl sm:text-3xl font-black font-mono tracking-tight mt-2 text-white">
                  {currencySymbol}{metrics.grossSales.toLocaleString()}
                </h3>
              </div>
              <span className="text-[10px] text-blue-200 mt-2 font-medium">Invoiced & Completed</span>
            </div>

            {/* Card 2: Machinery Units Sold */}
            <div className="bg-[#1B6B4D] rounded-3xl p-5 text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[120px]">
              <svg className="absolute -right-4 -bottom-6 w-32 h-32 opacity-20 pointer-events-none text-white" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="5">
                <circle cx="50" cy="50" r="18" />
                <circle cx="50" cy="50" r="32" />
                <circle cx="50" cy="50" r="48" />
              </svg>

              <div>
                <span className="text-xs font-semibold text-emerald-100 block">Units Dispatched</span>
                <h3 className="text-2xl sm:text-3xl font-black font-mono tracking-tight mt-2 text-white">
                  {metrics.itemsPurchased.toLocaleString()}
                </h3>
              </div>
              <span className="text-[10px] text-emerald-200 mt-2 font-medium">Heavy workshop machines</span>
            </div>

            {/* Card 3: Active Orders & Enquiries */}
            <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-5 text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[120px]">
              <svg className="absolute -right-4 -bottom-6 w-32 h-32 opacity-15 pointer-events-none text-white" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="5">
                <circle cx="50" cy="50" r="18" />
                <circle cx="50" cy="50" r="32" />
                <circle cx="50" cy="50" r="48" />
              </svg>

              <div>
                <span className="text-xs font-semibold text-slate-300 block">Total Orders</span>
                <h3 className="text-2xl sm:text-3xl font-black font-mono tracking-tight mt-2 text-white">
                  {metrics.totalOrders.toLocaleString()}
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 mt-2 font-medium">
                {metrics.pendingOrdersCount} awaiting fulfillment
              </span>
            </div>

          </div>

          {/* Row 2: Sales & Dispatch Telemetry Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Sales & Quotation Volume
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Monthly machinery procurement and fulfilled orders
                </p>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
                <button
                  onClick={() => setChartMode("line")}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    chartMode === "line"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Line View"
                >
                  <LineChartIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setChartMode("bar")}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    chartMode === "bar"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Bar View"
                >
                  <BarChart2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Recharts Area Container */}
            <div className="h-64 w-full pt-4">
              {chartData.length === 0 ? (
                <div className="h-full w-full rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-800/20">
                  <BarChart2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2 stroke-[1.5]" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Sales Activity Chart</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 max-w-xs">
                    As client equipment orders are confirmed, dynamic dispatch telemetry curves will populate automatically.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {chartMode === "line" ? (
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0055B8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0055B8" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}M`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0F172A", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                        formatter={(val: any) => [`KES ${(Number(val) * 1000000).toLocaleString()}`, "Volume"]}
                      />
                      <Area type="monotone" dataKey="orange" stroke="#0055B8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBlue)" />
                    </AreaChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}M`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0F172A", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                        formatter={(val: any) => [`KES ${(Number(val) * 1000000).toLocaleString()}`, "Volume"]}
                      />
                      <Bar dataKey="orange" fill="#0055B8" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>

          </div>

          {/* Row 3: Machinery Showcase and Performance */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Top Machinery Card (5 cols) */}
            <div className="md:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#0055B8] dark:text-blue-400 uppercase tracking-wider block">
                  Featured Equipment
                </span>

                <div className="mt-3 relative rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 aspect-4/3 flex items-center justify-center p-2 border border-slate-100 dark:border-slate-800">
                  <img
                    src={topProduct.image}
                    alt={topProduct.name}
                    loading="lazy"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>

                <div className="mt-3">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2">
                    {topProduct.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Available stock: <span className="font-semibold text-slate-700 dark:text-slate-300">{topProduct.stock || 0} units</span>
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <span className="inline-block bg-[#0055B8] hover:bg-[#004494] text-white font-black font-mono text-sm px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs">
                  {currencySymbol}{Number(topProduct.price || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Performance Metrics Box (7 cols) */}
            <div className="md:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
              
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 shadow-2xs">
                  <span>{dateRange}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              {/* 2x2 Metric Grid with Real Live Data */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Catalog Products</span>
                  <h4 className="text-2xl font-black text-[#0055B8] dark:text-blue-400 font-mono mt-1">{products.length}</h4>
                </div>

                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Orders Placed</span>
                  <h4 className="text-2xl font-black text-[#0055B8] dark:text-blue-400 font-mono mt-1">{orders.length}</h4>
                </div>

                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Fulfillment Rate</span>
                  <h4 className="text-2xl font-black text-[#1B6B4D] dark:text-emerald-400 font-mono mt-1">
                    {orders.length > 0 
                      ? `${Math.round(((orders.length - metrics.pendingOrdersCount) / orders.length) * 100)}%` 
                      : "100%"}
                  </h4>
                </div>

                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Warehouse Inventory</span>
                  <h4 className="text-2xl font-black text-[#1B6B4D] dark:text-emerald-400 font-mono mt-1">
                    {products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0)}
                  </h4>
                </div>
              </div>

              {/* Customer Rating and Verification */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Customer Satisfaction</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">5.0 / 5.0</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">HaoSail Kenya Verified</span>
                </div>
              </div>

              {/* Status Action Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <button
                  onClick={() => onNavigateTab("inbox")}
                  className="bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-left p-2.5 rounded-2xl flex items-center gap-2.5 transition-colors cursor-pointer min-h-[44px]"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-slate-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h6 className="text-[11px] font-bold text-amber-900 dark:text-amber-300 leading-tight">Spare Parts Requests</h6>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-tight mt-0.5">
                      Review customer maintenance tickets
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => onNavigateTab("orders")}
                  className="bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-left p-2.5 rounded-2xl flex items-center gap-2.5 transition-colors cursor-pointer min-h-[44px]"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-slate-800 text-[#1B6B4D] dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h6 className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 leading-tight">Order Fulfillment</h6>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 leading-tight mt-0.5">
                      {metrics.pendingOrdersCount} awaiting dispatch
                    </p>
                  </div>
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* Right Column (4 of 12): Operations, Stock Health & Recent Orders */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Operations & Inventory Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Warehouse Operations</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0055B8] dark:text-blue-400">
                Nairobi Hub
              </span>
            </div>

            {/* Inventory Status Banner */}
            <div className="bg-gradient-to-br from-[#0055B8] to-[#003B80] rounded-2xl p-5 text-white shadow-md space-y-3">
              <div className="flex items-center justify-between text-xs text-blue-100">
                <span>Active Machinery Catalog</span>
                <button 
                  onClick={() => onNavigateTab("product")}
                  className="hover:underline cursor-pointer hover:text-white font-bold"
                >
                  View Inventory
                </button>
              </div>

              <div>
                <h4 className="text-3xl font-black font-mono text-white tracking-tight">
                  {products.length} Models
                </h4>
                <p className="text-xs text-blue-200 mt-1">
                  Automotive lifts, tire machines & workshop tools
                </p>
              </div>

              <div className="pt-2 border-t border-blue-400/30 flex items-center justify-between text-xs">
                <span className="text-blue-200">Stock Alerts:</span>
                <span className={`font-bold px-2 py-0.5 rounded-md ${
                  metrics.lowStockCount > 0 ? "bg-amber-400 text-amber-950" : "bg-emerald-500 text-white"
                }`}>
                  {metrics.lowStockCount} items below {lowStockThreshold} units
                </span>
              </div>
            </div>

            {/* Recent Orders Section */}
            <div className="pt-2 flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Recent Machinery Orders</h4>
              <button
                onClick={() => onNavigateTab("orders")}
                className="text-xs text-[#0055B8] dark:text-blue-400 hover:underline font-bold cursor-pointer"
              >
                All Orders
              </button>
            </div>

            {/* Recent Orders List */}
            {recentOrdersList.length === 0 ? (
              <div className="py-8 px-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
                <ShoppingBag className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 stroke-[1.5]" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Orders Placed Yet</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Incoming client equipment purchases and dispatch requests will show here in real-time.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentOrdersList.map((ord) => (
                  <div key={ord.id} className="py-2.5 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={ord.image}
                        alt={ord.name}
                        loading="lazy"
                        className="w-10 h-10 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-700"
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                            {ord.name}
                          </h5>
                          <span className="w-4 h-4 rounded-full bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 font-mono font-bold text-[9px] flex items-center justify-center shrink-0">
                            {ord.qty}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {ord.item}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-slate-900 dark:text-white font-mono block">
                        {currencySymbol}{Number(ord.amount).toLocaleString()}
                      </span>
                      <span className={`text-[10px] font-bold block mt-0.5 ${
                        ord.status === "Delivered" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                      }`}>
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
