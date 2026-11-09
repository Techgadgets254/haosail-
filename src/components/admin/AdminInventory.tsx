import React, { useState, useMemo, useRef } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Upload, 
  Download, 
  FileText,
  Loader2,
  X, 
  AlertTriangle, 
  ExternalLink,
  ChevronDown,
  ArrowUpDown,
  Check,
  CheckSquare,
  Package,
  Layers,
  Image as ImageIcon
} from "lucide-react";
import { Product } from "../../types";
import Pagination from "../Pagination";
import { compressAndConvertToWebP } from "../../utils/imageCompressor";

export const MACHINERY_CATEGORIES = [
  "Automotive Lifting",
  "Tyre & Wheel Service",
  "Construction & Earthmoving",
  "Woodworking Equipment",
  "Metal Working & Fabrication",
  "Air Compressors & Generators",
  "Agricultural Machinery",
  "Diagnostics & Workshop Tools"
];

interface AdminInventoryProps {
  products: Product[];
  onAddProduct: (productData: any) => Promise<void>;
  onUpdateProduct: (id: string, productData: any) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onExportCSV: () => void;
  onImportCSV: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate?: () => void;
  lowStockThreshold: number;
}

export default function AdminInventory({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBulkDelete,
  onExportCSV,
  onImportCSV,
  onDownloadTemplate,
  lowStockThreshold,
}: AdminInventoryProps) {
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Sorting
  const [sortField, setSortField] = useState<"name" | "price" | "stock" | "brand">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form Fields
  const [formData, setFormData] = useState({
    name: "",
    brand: "Haosail",
    sku: "",
    category: MACHINERY_CATEGORIES[0],
    price: 0,
    originalPrice: 0,
    stock: 10,
    warranty: "1 Year Official Haosail Warranty",
    description: "",
    specificationsStr: "",
    image: "",
    gallery1: "",
    gallery2: "",
    gallery3: "",
    gallery4: "",
  });

  const csvInputRef = useRef<HTMLInputElement>(null);

  // Quick In-Line Price/Stock edit state
  const [editingInlineId, setEditingInlineId] = useState<string | null>(null);
  const [inlinePrice, setInlinePrice] = useState<number>(0);
  const [inlineStock, setInlineStock] = useState<number>(0);

  // Handle open add modal
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      brand: "Haosail",
      sku: `HS-${Math.floor(1000 + Math.random() * 9000)}`,
      category: MACHINERY_CATEGORIES[0],
      price: 0,
      originalPrice: 0,
      stock: 5,
      warranty: "1 Year Official Haosail Warranty",
      description: "",
      specificationsStr: "Power: 3.0kW / 380V 3-Phase\nCapacity: Heavy Duty Industrial Grade\nWarranty: 1 Year Comprehensive Parts & Labor",
      image: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&q=80&w=800",
      gallery1: "",
      gallery2: "",
      gallery3: "",
      gallery4: "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    
    let specsText = "";
    if (prod.specifications && typeof prod.specifications === "object") {
      specsText = Object.entries(prod.specifications)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
    }

    setFormData({
      name: prod.name || "",
      brand: prod.brand || "Haosail",
      sku: prod.sku || `HS-${prod.id.slice(0, 6).toUpperCase()}`,
      category: prod.category || MACHINERY_CATEGORIES[0],
      price: Number(prod.price) || 0,
      originalPrice: Number(prod.originalPrice) || 0,
      stock: Number(prod.stock) || 0,
      warranty: prod.warranty || "1 Year Official Haosail Warranty",
      description: prod.description || "",
      specificationsStr: specsText,
      image: prod.image || "",
      gallery1: prod.gallery?.[0] || "",
      gallery2: prod.gallery?.[1] || "",
      gallery3: prod.gallery?.[2] || "",
      gallery4: prod.gallery?.[3] || "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  // Standard Machinery Description & Specifications Template Helper
  const handleApplySpecTemplate = () => {
    if (!formData.name.trim()) {
      setFormError("Please enter a Machine Title first to generate specifications.");
      return;
    }

    setFormError("");
    const brand = formData.brand || "Haosail";
    const name = formData.name;
    const cat = formData.category || "Workshop Equipment";

    setFormData((prev) => ({
      ...prev,
      description: prev.description || `The ${brand} ${name} is engineered for professional operations in industrial workshops, garages, and commercial service centers across Kenya.\n\nBuilt with heavy-gauge structural steel and certified safety components, it provides dependable performance, high continuous duty cycle, and low maintenance overhead.`,
      specificationsStr: prev.specificationsStr || `Category: ${cat}\nPower Supply: 380V 3-Phase / 220V 50Hz\nConstruction: Heavy-Duty Structural Steel\nOperating Duty: Continuous Commercial Rating\nWarranty: 1 Year Official Haosail Warranty & On-Site Support`
    }));
  };

  // Handle Image Upload & WebP compression (Supports up to 5 slots)
  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>, field: "image" | "gallery1" | "gallery2" | "gallery3" | "gallery4") => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64WebP = await compressAndConvertToWebP(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85,
        forceFormat: "image/webp"
      });
      setFormData((prev) => ({ ...prev, [field]: base64WebP }));
    } catch (err) {
      console.error("Image upload failed:", err);
      setFormError("Failed to process image. Ensure image is under 10MB.");
    }
  };

  // Batch Multi-Image Upload (Upload up to 5 images in one click)
  const handleMultipleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      const slots: ("image" | "gallery1" | "gallery2" | "gallery3" | "gallery4")[] = [
        "image",
        "gallery1",
        "gallery2",
        "gallery3",
        "gallery4"
      ];

      // Identify empty slots first
      const emptySlots = slots.filter((slot) => !formData[slot]);
      const targetSlots = emptySlots.length > 0 ? emptySlots : slots;

      for (let i = 0; i < Math.min(files.length, targetSlots.length); i++) {
        const base64WebP = await compressAndConvertToWebP(files[i], {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.85,
          forceFormat: "image/webp"
        });
        const currentSlot = targetSlots[i];
        setFormData((prev) => ({ ...prev, [currentSlot]: base64WebP }));
      }
    } catch (err) {
      console.error("Batch image upload failed:", err);
      setFormError("Failed to process some images.");
    }
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Machine Name is required.");
      return;
    }
    if (Number(formData.price) <= 0) {
      setFormError("Selling Price must be greater than 0 KES.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      // Parse specifications text into dictionary object
      const specObj: Record<string, string> = {};
      if (formData.specificationsStr) {
        formData.specificationsStr.split("\n").forEach((line) => {
          const idx = line.indexOf(":");
          if (idx > 0) {
            const k = line.slice(0, idx).trim();
            const v = line.slice(idx + 1).trim();
            if (k && v) specObj[k] = v;
          }
        });
      }

      const galleryList: string[] = [];
      if (formData.gallery1) galleryList.push(formData.gallery1);
      if (formData.gallery2) galleryList.push(formData.gallery2);
      if (formData.gallery3) galleryList.push(formData.gallery3);
      if (formData.gallery4) galleryList.push(formData.gallery4);

      const productPayload = {
        name: formData.name.trim(),
        brand: formData.brand.trim() || "Haosail",
        sku: formData.sku.trim() || `HS-${Math.floor(1000 + Math.random() * 9000)}`,
        category: formData.category,
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice) || Number(formData.price),
        stock: Math.max(0, Math.floor(Number(formData.stock))),
        warranty: formData.warranty,
        description: formData.description,
        specifications: specObj,
        image: formData.image || "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&q=80&w=800",
        gallery: galleryList,
      };

      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, productPayload);
      } else {
        await onAddProduct(productPayload);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "Failed to save machinery record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick In-Line Save
  const handleSaveInline = async (prodId: string) => {
    try {
      await onUpdateProduct(prodId, {
        price: inlinePrice,
        stock: inlineStock
      });
      setEditingInlineId(null);
    } catch (err) {
      alert("Failed to update pricing/stock in-line.");
    }
  };

  // Filter and Sort Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        (p.name || "").toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
      );

      // Category
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;

      // Stock status
      let matchesStock = true;
      const s = Number(p.stock) || 0;
      if (stockFilter === "in_stock") matchesStock = s > lowStockThreshold;
      else if (stockFilter === "low_stock") matchesStock = s > 0 && s <= lowStockThreshold;
      else if (stockFilter === "out_of_stock") matchesStock = s <= 0;

      return matchesSearch && matchesCategory && matchesStock;
    }).sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === "price" || sortField === "stock") {
        return sortDirection === "asc" ? (Number(valA) || 0) - (Number(valB) || 0) : (Number(valB) || 0) - (Number(valA) || 0);
      }

      valA = String(valA || "").toLowerCase();
      valB = String(valB || "").toLowerCase();
      return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [products, searchQuery, selectedCategory, stockFilter, sortField, sortDirection, lowStockThreshold]);

  // Paginated View
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  // Toggle selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedProducts.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-200 animate-fadeIn">
      {/* Header Controls Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-[#0066CC] dark:text-blue-400 uppercase tracking-wider">CATALOG & STOCK CONTROL</span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Machinery Inventory Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Showing {filteredProducts.length} machines ({products.length} total in database)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <input
            type="file"
            ref={csvInputRef}
            onChange={onImportCSV}
            accept=".csv"
            className="hidden"
          />

          {onDownloadTemplate && (
            <button
              onClick={onDownloadTemplate}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold px-3.5 sm:px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer min-h-[44px] shadow-2xs"
              title="Download empty Excel CSV template with all admin fields"
            >
              <FileText className="w-3.5 h-3.5 text-[#0066CC] dark:text-blue-400" />
              <span>Excel Template</span>
            </button>
          )}

          <button
            onClick={() => csvInputRef.current?.click()}
            className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold px-3.5 sm:px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer min-h-[44px]"
            title="Upload CSV to add new or update existing products in bulk"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Bulk Upload CSV</span>
          </button>
          
          <button
            onClick={onExportCSV}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold px-3.5 sm:px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer min-h-[44px]"
            title="Export all current catalog products to CSV / Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold px-4 sm:px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer min-h-[44px]"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Add Machinery</span>
          </button>
        </div>
      </div>

      {/* Bulk Update Banner with Excel Instructions */}
      <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#0066CC] text-white flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-blue-950 dark:text-blue-200">
              Bulk Machinery Update via Excel / CSV
            </h4>
            <p className="text-blue-800 dark:text-blue-300/80 mt-0.5 leading-relaxed">
              Export existing products, edit prices, stock, titles, specifications, or cover images directly in Excel, then click <strong className="font-bold text-[#0066CC] dark:text-blue-300">Bulk Upload CSV</strong>. Existing IDs/SKUs are updated automatically and new rows are inserted instantly.
            </p>
          </div>
        </div>

        {onDownloadTemplate && (
          <button
            onClick={onDownloadTemplate}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 text-[#0066CC] dark:text-blue-300 font-bold text-xs shrink-0 cursor-pointer shadow-2xs self-start md:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Template (.csv)</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
          {/* Search Field */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search machinery by name, model, SKU, or brand..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-[#0066CC] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none min-h-[42px]"
            />
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-[#0066CC] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none cursor-pointer min-h-[42px]"
            >
              <option value="All">All Categories ({products.length})</option>
              {MACHINERY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Stock Filter Dropdown */}
          <div className="md:col-span-3">
            <select
              value={stockFilter}
              onChange={(e) => { setStockFilter(e.target.value as any); setCurrentPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-[#0066CC] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none cursor-pointer min-h-[42px]"
            >
              <option value="all">All Stock Levels</option>
              <option value="in_stock">In Stock (&gt; {lowStockThreshold} units)</option>
              <option value="low_stock">Low Stock (≤ {lowStockThreshold} units)</option>
              <option value="out_of_stock">Out of Stock (0 units)</option>
            </select>
          </div>
        </div>

        {/* Category Quick Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => { setSelectedCategory("All"); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === "All"
                ? "bg-[#0066CC] text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            All Categories
          </button>
          {MACHINERY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#0066CC] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-[#0066CC] dark:text-blue-400" />
            <span className="text-xs font-bold text-blue-950 dark:text-blue-200">
              {selectedIds.length} machine(s) selected
            </span>
          </div>
          <button
            onClick={() => {
              if (confirm(`Move ${selectedIds.length} items to Trash?`)) {
                onBulkDelete(selectedIds);
                setSelectedIds([]);
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm min-h-[40px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Move to Trash</span>
          </button>
        </div>
      )}

      {/* Machinery Inventory Container: Responsive Desktop Table + Dedicated Mobile Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
        
        {/* 1. DESKTOP VIEW: Full Data Table (`hidden md:block`) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-[11px] font-sans font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === paginatedProducts.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 dark:border-slate-600 text-[#0066CC] focus:ring-[#0066CC] cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">MACHINE & MODEL</th>
                <th className="py-3.5 px-4">CATEGORY</th>
                <th className="py-3.5 px-4 cursor-pointer" onClick={() => {
                  setSortField("price");
                  setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                }}>
                  <div className="flex items-center gap-1">
                    <span>SELLING PRICE</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4 cursor-pointer" onClick={() => {
                  setSortField("stock");
                  setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                }}>
                  <div className="flex items-center gap-1">
                    <span>STOCK (UNITS)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-sans">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500 dark:text-slate-400">
                    <Package className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-medium">No machinery matches your search criteria.</p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((prod) => {
                  const stockNum = Number(prod.stock) || 0;
                  const isLow = stockNum <= lowStockThreshold && stockNum > 0;
                  const isOut = stockNum <= 0;
                  const isEditingThis = editingInlineId === prod.id;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Checkbox */}
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(prod.id)}
                          onChange={() => handleToggleSelect(prod.id)}
                          className="rounded border-slate-300 dark:border-slate-600 text-[#0066CC] focus:ring-[#0066CC] cursor-pointer"
                        />
                      </td>

                      {/* Image & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                            <img
                              src={prod.image || "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&q=80&w=200"}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">
                              {prod.name}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{prod.brand || "Haosail"}</span>
                              <span>&bull;</span>
                              <span className="font-mono text-slate-400 dark:text-slate-500">SKU: {prod.sku || prod.id.slice(0, 6).toUpperCase()}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg text-[11px] font-semibold">
                          {prod.category || "General Machinery"}
                        </span>
                      </td>

                      {/* Price (with inline edit) */}
                      <td className="py-3.5 px-4">
                        {isEditingThis ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={inlinePrice}
                              onChange={(e) => setInlinePrice(Number(e.target.value))}
                              className="w-24 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs font-bold text-slate-900 dark:text-white"
                            />
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              KES {(Number(prod.price) || 0).toLocaleString()}
                            </span>
                            {prod.originalPrice && Number(prod.originalPrice) > Number(prod.price) && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 line-through block">
                                KES {Number(prod.originalPrice).toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Stock (with inline edit) */}
                      <td className="py-3.5 px-4">
                        {isEditingThis ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={inlineStock}
                              onChange={(e) => setInlineStock(Number(e.target.value))}
                              className="w-16 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs font-bold text-slate-900 dark:text-white"
                            />
                            <button
                              onClick={() => handleSaveInline(prod.id)}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                              title="Save Changes"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingInlineId(null)}
                              className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                              isOut 
                                ? "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800" 
                                : isLow 
                                ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800" 
                                : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            }`}>
                              {stockNum} units
                            </span>
                            <button
                              onClick={() => {
                                setEditingInlineId(prod.id);
                                setInlinePrice(Number(prod.price) || 0);
                                setInlineStock(stockNum);
                              }}
                              className="text-[10px] text-[#0066CC] dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                            >
                              Quick Edit
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(prod)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 hover:text-[#0066CC] dark:hover:text-blue-400 transition-colors cursor-pointer"
                            title="Edit Machinery Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Move "${prod.name}" to Trash bin?`)) {
                                onDeleteProduct(prod.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                            title="Move to Trash"
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

        {/* 2. MOBILE VIEW: Dedicated Card Layout (`md:hidden`) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800 p-3 space-y-3">
          {paginatedProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <Package className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-medium text-xs">No machinery matches your criteria.</p>
            </div>
          ) : (
            paginatedProducts.map((prod) => {
              const stockNum = Number(prod.stock) || 0;
              const isLow = stockNum <= lowStockThreshold && stockNum > 0;
              const isOut = stockNum <= 0;
              const isEditingThis = editingInlineId === prod.id;
              const isSelected = selectedIds.includes(prod.id);

              return (
                <div 
                  key={prod.id}
                  className={`pt-3 first:pt-0 pb-3 bg-white dark:bg-slate-900 rounded-2xl p-3 border transition-all ${
                    isSelected ? "border-[#0066CC] bg-blue-50/20 dark:bg-blue-950/20" : "border-slate-100 dark:border-slate-800"
                  }`}
                >
                  {/* Card Header: Checkbox, Thumbnail, Title & Category */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(prod.id)}
                      className="mt-1 rounded border-slate-300 dark:border-slate-600 text-[#0066CC] focus:ring-[#0066CC] cursor-pointer min-w-[20px] min-h-[20px]"
                    />

                    <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                      <img
                        src={prod.image || "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&q=80&w=200"}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono font-bold text-[#0066CC] dark:text-blue-400 uppercase tracking-wider truncate">
                          {prod.brand || "Haosail"}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
                          {prod.sku || prod.id.slice(0, 6).toUpperCase()}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 leading-tight mt-0.5">
                        {prod.name}
                      </h4>

                      <span className="inline-block mt-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {prod.category || "General Machinery"}
                      </span>
                    </div>
                  </div>

                  {/* Card Body: Price & Stock Status (with Inline Editing) */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    {/* Price Block */}
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase block">Price</span>
                      {isEditingThis ? (
                        <input
                          type="number"
                          value={inlinePrice}
                          onChange={(e) => setInlinePrice(Number(e.target.value))}
                          className="w-28 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs font-bold text-slate-900 dark:text-white mt-0.5"
                        />
                      ) : (
                        <span className="text-xs sm:text-sm font-extrabold text-[#0066CC] dark:text-blue-400 font-mono">
                          KES {(Number(prod.price) || 0).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Stock Status Block */}
                    <div className="text-right">
                      <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase block">Stock Units</span>
                      {isEditingThis ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <input
                            type="number"
                            value={inlineStock}
                            onChange={(e) => setInlineStock(Number(e.target.value))}
                            className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs font-bold text-slate-900 dark:text-white"
                          />
                          <button
                            onClick={() => handleSaveInline(prod.id)}
                            className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingInlineId(null)}
                            className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          isOut 
                            ? "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800" 
                            : isLow 
                            ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800" 
                            : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        }`}>
                          {stockNum} units
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Action Buttons: Full Touch Ergonomics */}
                  {!isEditingThis && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          setEditingInlineId(prod.id);
                          setInlinePrice(Number(prod.price) || 0);
                          setInlineStock(stockNum);
                        }}
                        className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold py-2 px-2 rounded-xl flex items-center justify-center gap-1 min-h-[40px] cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Quick Edit</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(prod)}
                        className="bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#0066CC] dark:text-blue-300 text-[11px] font-semibold py-2 px-2 rounded-xl flex items-center justify-center gap-1 min-h-[40px] cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Edit Full</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Move "${prod.name}" to Trash bin?`)) {
                            onDeleteProduct(prod.id);
                          }
                        }}
                        className="bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-[11px] font-semibold py-2 px-2 rounded-xl flex items-center justify-center gap-1 min-h-[40px] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        {filteredProducts.length > itemsPerPage && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredProducts.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Add / Edit Machine Modal (Vertically & horizontally centered with no page scroll needed) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-8 space-y-6 my-auto text-slate-900 text-left">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-bold text-[#0066CC] uppercase tracking-wider">
                  {editingProduct ? "EDIT RECORD" : "NEW MACHINE SPECIFICATION"}
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingProduct ? "Update Machinery Item" : "Add Machine to Inventory"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Machine Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Haosail 4.0 Ton Two-Post Clear Floor Hydraulic Car Lift"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Haosail"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* SKU & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">SKU / Model Number</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="HS-4000LIFT"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none cursor-pointer"
                  >
                    {MACHINERY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Selling Price (KES) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">MSRP / Original Price (KES)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Stock Quantity (Units)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Warranty */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Warranty & Service Period</label>
                <input
                  type="text"
                  value={formData.warranty}
                  onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                  placeholder="1 Year Official Haosail Warranty & Free Setup Consultation"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              {/* Auto-Fill Specifications Template Callout */}
              <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#0066CC]" />
                    <span>Auto-Fill Spec & Description Template</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Insert standard industrial equipment boilerplate descriptions and specification keys based on machine name.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleApplySpecTemplate}
                  className="bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Insert Template</span>
                </button>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Machinery Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed equipment description..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl p-3.5 text-xs text-slate-900 leading-relaxed focus:outline-none"
                />
              </div>

              {/* Technical Specifications (Key: Value) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Technical Specifications (One per line, Format: Key: Value)
                </label>
                <textarea
                  rows={4}
                  value={formData.specificationsStr}
                  onChange={(e) => setFormData({ ...formData, specificationsStr: e.target.value })}
                  placeholder="Power: 380V 3-Phase\nLifting Capacity: 4000kg\nLifting Height: 1900mm\nTotal Height: 3750mm"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl p-3.5 text-xs text-slate-900 font-mono leading-relaxed focus:outline-none"
                />
              </div>

              {/* 5-Image Machinery Photo Uploader */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Machinery Photos (Up to 5 Images)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Slot 1 is the primary cover image. Slots 2–5 power the full-page product interactive gallery.
                    </p>
                  </div>
                  
                  {/* Batch Upload Button */}
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0066CC] text-xs font-bold border border-blue-200 cursor-pointer transition-all self-start sm:self-auto shrink-0 shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Multiple Files</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleMultipleImages}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 5 Slots Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {[
                    { key: "image" as const, label: "1. Cover Image", isCover: true },
                    { key: "gallery1" as const, label: "2. Gallery Angle", isCover: false },
                    { key: "gallery2" as const, label: "3. Specifications", isCover: false },
                    { key: "gallery3" as const, label: "4. In-Action", isCover: false },
                    { key: "gallery4" as const, label: "5. Detail / Motor", isCover: false },
                  ].map((slot, index) => {
                    const currentImg = formData[slot.key];
                    return (
                      <div 
                        key={slot.key}
                        className={`rounded-2xl border p-2 flex flex-col justify-between transition-all ${
                          currentImg 
                            ? "bg-slate-50 border-slate-300" 
                            : "bg-slate-50/50 border-dashed border-slate-300 hover:border-[#0066CC]"
                        }`}
                      >
                        {/* Slot Header Label */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] font-mono font-bold truncate ${
                            slot.isCover ? "text-[#0066CC]" : "text-slate-600"
                          }`}>
                            {slot.label}
                          </span>
                          {currentImg && (
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, [slot.key]: "" }))}
                              className="text-slate-400 hover:text-red-600 p-0.5 rounded cursor-pointer transition-colors"
                              title="Clear photo slot"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Thumbnail or Drop Area */}
                        {currentImg ? (
                          <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-white border border-slate-200 mb-2 group">
                            <img 
                              src={currentImg} 
                              alt={`Slot ${index + 1}`} 
                              className="w-full h-full object-contain p-1"
                            />
                            {slot.isCover && (
                              <span className="absolute bottom-1 left-1 bg-[#0066CC] text-white text-[8px] font-mono font-bold px-1.5 py-0.2 rounded shadow-xs">
                                COVER
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="aspect-4/3 rounded-xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center p-2 mb-2 text-slate-400 text-center">
                            <ImageIcon className="w-5 h-5 mb-1 text-slate-300" />
                            <span className="text-[9px] font-mono">Empty Slot</span>
                          </div>
                        )}

                        {/* Upload & URL Controls */}
                        <div className="space-y-1.5">
                          <label className="w-full py-1.5 px-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs">
                            <Upload className="w-3 h-3 text-[#0066CC]" />
                            <span>{currentImg ? "Replace" : "Upload File"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageFile(e, slot.key)}
                              className="hidden"
                            />
                          </label>
                          <input
                            type="text"
                            placeholder="or paste URL..."
                            value={currentImg}
                            onChange={(e) => setFormData(prev => ({ ...prev, [slot.key]: e.target.value }))}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-[10px] text-slate-700 font-mono focus:border-[#0066CC] focus:outline-none"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Machinery...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? "Update Machine" : "Save Machine to Catalog"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
