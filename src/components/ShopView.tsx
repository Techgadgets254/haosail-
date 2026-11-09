/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "../StoreContext";
import Pagination from "./Pagination";
import LazyImage from "./LazyImage";
import { normalizeBrandName } from "../lib/brandUtils";
import { 
  SlidersHorizontal, 
  RotateCcw, 
  Search, 
  AlertCircle,
  TrendingDown,
  TrendingUp,
  ArrowUpDown,
  BookOpen,
  Heart,
  Scale,
  Star,
  Tag,
  Loader2,
  Minus,
  Plus,
  ArrowUp,
  X,
  History,
  Mic,
  MicOff,
  Flame,
  Bell,
  LayoutGrid,
  List,
  Check,
  ChevronRight,
  Filter,
  Sparkles,
  ShoppingBag,
  Eye,
  CheckCircle2,
  RefreshCw,
  ArrowDown
} from "lucide-react";
import { Product } from "../types";
import { SUBCATEGORIES_BY_MAIN_CATEGORY, matchesSubcategory } from "../utils/categories";
import { formatKES } from "../utils/formatCurrency";

const isCampaignOfferActive = (p: any) => {
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

interface FlashCountdownProps {
  expiry: string;
}

const FlashCountdown: React.FC<FlashCountdownProps> = ({ expiry }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(expiry) - +new Date();
      if (difference <= 0) {
        return "Expired";
      }

      const hrs = Math.floor(difference / (1000 * 60 * 60));
      const mins = Math.floor((difference / 1000 / 60) % 60);
      const secs = Math.floor((difference / 1000) % 60);

      return `${hrs}h ${mins}m ${secs}s`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [expiry]);

  return (
    <span className="text-[10px] text-red-500 font-mono font-bold bg-red-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-red-200">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
      {timeLeft}
    </span>
  );
};

function highlightText(text: string, highlight: string) {
  if (!highlight || !highlight.trim()) {
    return <span>{text}</span>;
  }
  try {
    const cleanHighlight = highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${cleanHighlight})`, "gi");
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-blue-100 text-[#0055B8] font-bold rounded-xs px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  } catch (error) {
    return <span>{text}</span>;
  }
}

// Custom Levenshtein Distance helper for spell-checking
function getLevenshteinDistance(a: string, b: string): number {
  const tmp: number[][] = [];
  let i, j, al = a.length, bl = b.length, r;
  if (al === 0) return bl;
  if (bl === 0) return al;
  for (i = 0; i <= al; i++) tmp[i] = [i];
  for (j = 1; j <= bl; j++) tmp[0][j] = j;
  for (i = 1; i <= al; i++) {
    for (j = 1; j <= bl; j++) {
      r = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      tmp[i][j] = Math.min(tmp[i - 1][j] + 1, tmp[i][j - 1] + 1, tmp[i - 1][j - 1] + r);
    }
  }
  return tmp[al][bl];
}

// Custom Fuzzy Search ranker that searches name, category, and technical specifications
function fuzzyMatchProducts(products: Product[], query: string): Product[] {
  const qClean = query.trim().toLowerCase();
  if (!qClean) return products;

  const queryWords = qClean.split(/\s+/).filter(Boolean);
  if (queryWords.length === 0) return products;

  const scoredProducts = products.map(p => {
    let score = 0;
    const name = (p.name || "").toLowerCase();
    const brand = (p.brand || "").toLowerCase();
    const category = (p.category || "").toLowerCase();
    const desc = (p.description || "").toLowerCase();
    
    let specsStr = "";
    if (p.specifications) {
      specsStr = Object.entries(p.specifications)
        .map(([k, v]) => `${k} ${v}`)
        .join(" ")
        .toLowerCase();
    }

    queryWords.forEach(word => {
      if (name.includes(word)) {
        score += 50;
        if (name.startsWith(word)) score += 20;
      }
      if (brand.includes(word)) {
        score += 30;
      }
      if (category.includes(word)) {
        score += 40;
      }
      if (specsStr.includes(word)) {
        score += 45;
      }
      if (desc.includes(word)) {
        score += 10;
      }

      const nameWords = name.split(/\s+/).filter(Boolean);
      nameWords.forEach(nw => {
        if (nw.length >= 3 && Math.abs(nw.length - word.length) <= 2) {
          const distance = getLevenshteinDistance(nw, word);
          if (distance <= 1) {
            score += 25;
          } else if (distance === 2 && nw.length >= 5) {
            score += 10;
          }
        }
      });
      
      const brandWords = brand.split(/\s+/).filter(Boolean);
      brandWords.forEach(bw => {
        if (bw.length >= 3 && Math.abs(bw.length - word.length) <= 1) {
          const distance = getLevenshteinDistance(bw, word);
          if (distance <= 1) {
            score += 20;
          }
        }
      });
    });

    return { product: p, score };
  });

  return scoredProducts
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.product);
}

export default function ShopView() {
  const { 
    products, 
    searchQuery, 
    setSearchQuery, 
    setSelectedProductId, 
    setActiveView,
    addToCart,
    wishlist,
    toggleWishlist,
    compareList,
    toggleCompare,
    clearCompareList,
    productsLoading,
    refreshProducts
  } = useStore();

  const [selectedMainCategory, setSelectedMainCategory] = useState<string>("All");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("All");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<string>("default");
  const [onlyShowWishlist, setOnlyShowWishlist] = useState<boolean>(false);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);

  // Mobile Display Preferences (Defaults to 2-column compact grid on phone screens)
  const [mobileViewMode, setMobileViewMode] = useState<"grid" | "list">("grid");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  // Pull-to-refresh gesture & state
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshSuccess, setRefreshSuccess] = useState<boolean>(false);
  const touchStartY = useRef<number>(0);
  const isAtTopRef = useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 5) {
      isAtTopRef.current = true;
      touchStartY.current = e.touches[0].clientY;
    } else {
      isAtTopRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isAtTopRef.current || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;

    if (deltaY > 0 && window.scrollY <= 5) {
      setIsPulling(true);
      // Apply elastic damping: max 80px
      const damped = Math.min(80, deltaY * 0.45);
      setPullDistance(damped);
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || isRefreshing) return;
    if (pullDistance >= 55) {
      await triggerSync();
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  const triggerSync = async () => {
    try {
      setIsRefreshing(true);
      setPullDistance(55);
      if (refreshProducts) {
        await refreshProducts();
      }
      setRefreshSuccess(true);
      setTimeout(() => {
        setRefreshSuccess(false);
      }, 2500);
    } catch (err) {
      console.error("Manual sync failed", err);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  // Quick Buy modal states
  const [quickBuyProduct, setQuickBuyProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [quickBuyQuantity, setQuickBuyQuantity] = useState<number>(1);

  // Search History
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("tgk_recent_searches");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Voice Search Web Speech API
  const [isListening, setIsListening] = useState(false);
  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser. Please try Chrome or Safari.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      if (transcript) {
        setSearchQuery(transcript);
        addToHistory(transcript);
      }
    };
    
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const addToHistory = (query: string) => {
    const q = query.trim();
    if (!q || q.length < 2) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== q.toLowerCase());
      const updated = [q, ...filtered].slice(0, 5);
      try { localStorage.setItem("tgk_recent_searches", JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const removeFromHistory = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(q => q !== item);
      try { localStorage.setItem("tgk_recent_searches", JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const clearAllHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try { localStorage.removeItem("tgk_recent_searches"); } catch {}
  };

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedMainCategory, selectedSubcategory, selectedBrand, sortBy, onlyShowWishlist, onlyInStock, minPrice, maxPrice]);

  // Helper mapping to extract core category name
  const getProductMainCategory = (category: string) => {
    const catLower = (category || "").toLowerCase();
    if (catLower.includes("auto") || catLower.includes("lift") || catLower.includes("tire") || catLower.includes("aligner")) return "Auto Maintenance";
    if (catLower.includes("construction") || catLower.includes("concrete") || catLower.includes("compactor") || catLower.includes("mixer")) return "Construction Machinery";
    if (catLower.includes("wood") || catLower.includes("saw") || catLower.includes("carpentry") || catLower.includes("edge")) return "Woodworking";
    if (catLower.includes("metal") || catLower.includes("lathe") || catLower.includes("drill") || catLower.includes("milling")) return "Metal Working";
    if (catLower.includes("compressor") || catLower.includes("pump") || catLower.includes("washer")) return "Air Compressors & Pumps";
    if (catLower.includes("generator") || catLower.includes("welder") || catLower.includes("diesel")) return "Generators & Welders";
    return category || "Auto Maintenance";
  };

  // Category Metadata with icons
  const categoryMetaList = [
    { id: "All", label: "All Machinery", emoji: "🏭" },
    { id: "Auto Maintenance", label: "Car Lifts & Auto", emoji: "🚗" },
    { id: "Construction Machinery", label: "Construction & Mixers", emoji: "🏗️" },
    { id: "Woodworking", label: "Woodworking Saws", emoji: "🪵" },
    { id: "Metal Working", label: "Metal Working", emoji: "⚙️" },
    { id: "Air Compressors & Pumps", label: "Air Compressors", emoji: "💨" },
    { id: "Generators & Welders", label: "Generators & Welders", emoji: "⚡" }
  ];

  const availableSubcategories = useMemo(() => {
    if (selectedMainCategory === "All") return [];
    return SUBCATEGORIES_BY_MAIN_CATEGORY[selectedMainCategory] || [];
  }, [selectedMainCategory]);

  const brands = useMemo(() => {
    const matchingProducts = products.filter(p => {
      if (selectedMainCategory === "All") return true;
      return getProductMainCategory(p.category) === selectedMainCategory;
    });
    const list = new Set(matchingProducts.map(p => normalizeBrandName(p.brand)));
    return ["All", ...Array.from(list)];
  }, [products, selectedMainCategory]);

  // Active filters count calculation
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedMainCategory !== "All") count++;
    if (selectedSubcategory !== "All") count++;
    if (selectedBrand !== "All") count++;
    if (minPrice !== "" || maxPrice !== "") count++;
    if (onlyShowWishlist) count++;
    if (onlyInStock) count++;
    if (sortBy !== "default") count++;
    return count;
  }, [selectedMainCategory, selectedSubcategory, selectedBrand, minPrice, maxPrice, onlyShowWishlist, onlyInStock, sortBy]);

  // Reset filters
  const resetFilters = () => {
    setSelectedMainCategory("All");
    setSelectedSubcategory("All");
    setSelectedBrand("All");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("default");
    setSearchQuery("");
    setOnlyShowWishlist(false);
    setOnlyInStock(false);
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Fuzzy search
    if (searchQuery.trim() !== "") {
      result = fuzzyMatchProducts(result, searchQuery);
    }

    // Main Category
    if (selectedMainCategory !== "All") {
      result = result.filter(p => getProductMainCategory(p.category) === selectedMainCategory);
    }

    // Subcategory
    if (selectedSubcategory !== "All") {
      result = result.filter(p => matchesSubcategory(p, selectedSubcategory));
    }

    // Brand
    if (selectedBrand !== "All") {
      result = result.filter(p => normalizeBrandName(p.brand) === selectedBrand);
    }

    // In Stock Only
    if (onlyInStock) {
      result = result.filter(p => p.stock > 0);
    }

    // Price Range
    if (minPrice !== "") {
      result = result.filter(p => Number(p.price) >= Number(minPrice));
    }
    if (maxPrice !== "") {
      result = result.filter(p => Number(p.price) <= Number(maxPrice));
    }

    // Saved/Wishlist
    if (onlyShowWishlist) {
      result = result.filter(p => wishlist.includes(p.id));
    }

    // Sorting
    if (sortBy === "price-low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      result.sort((a, b) => {
        const valA = (a as any).createdAt || (a as any).updatedAt || a.id || "";
        const valB = (b as any).createdAt || (b as any).updatedAt || b.id || "";
        return valB.localeCompare(valA);
      });
    } else if (sortBy === "name-az") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name-za") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [products, searchQuery, selectedMainCategory, selectedSubcategory, selectedBrand, minPrice, maxPrice, sortBy, onlyShowWishlist, onlyInStock, wishlist]);

  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const getProductVariants = (product: Product) => {
    if (product.enableVariants === false) return null;
    const hasCustom = product.customVariants && product.customVariants.options && product.customVariants.options.length > 0;
    if (hasCustom) {
      return {
        label: product.customVariants!.label || "Available Options",
        options: product.customVariants!.options.map(opt => {
          const offset = opt.price - product.price;
          if (offset > 0) return `${opt.name} (+ KES ${offset.toLocaleString()})`;
          if (offset < 0) return `${opt.name} (- KES ${Math.abs(offset).toLocaleString()})`;
          return opt.name;
        })
      };
    }
    const cat = (product.category || "").toLowerCase();
    if (cat.includes("auto") || cat.includes("lift")) {
      return {
        label: "Power Configuration",
        options: ["380V 3-Phase Industrial Electric Motor", "220V Single-Phase Motor (+ KES 15,000)"]
      };
    }
    return null;
  };

  const handleQuickBuySubmit = () => {
    if (!quickBuyProduct) return;
    let finalPrice = quickBuyProduct.price;
    let finalName = quickBuyProduct.name;
    let finalId = quickBuyProduct.id;

    const priceMatch = selectedVariant.match(/\+\s*KES\s*([\d,]+)/i);
    const minusMatch = selectedVariant.match(/\-\s*KES\s*([\d,]+)/i);
    if (priceMatch) {
      finalPrice += parseInt(priceMatch[1].replace(/,/g, ""), 10);
    } else if (minusMatch) {
      finalPrice -= parseInt(minusMatch[1].replace(/,/g, ""), 10);
    }
    const cleanVariantName = selectedVariant.split(" (+")[0].split(" (-")[0];
    if (cleanVariantName) {
      finalName = `${quickBuyProduct.name} (${cleanVariantName})`;
      finalId = `${quickBuyProduct.id}-${cleanVariantName.replace(/[^a-zA-Z0-9]/g, "_")}`;
    }

    addToCart({ ...quickBuyProduct, id: finalId, name: finalName, price: finalPrice }, quickBuyQuantity);
    setQuickBuyProduct(null);
    setActiveView("checkout");
  };

  const pricePresets = [
    { label: "All Prices", min: "", max: "" },
    { label: "Under 150K", min: "", max: 150000 },
    { label: "150K - 500K", min: 150000, max: 500000 },
    { label: "500K - 1.5M", min: 500000, max: 1500000 },
    { label: "1.5M+", min: 1500000, max: "" }
  ];

  return (
    <div 
      id="shop-view-grid" 
      className="animate-fadeIn pb-16 touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Animated Indicator */}
      <AnimatePresence>
        {(isPulling || isRefreshing || refreshSuccess) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: isRefreshing ? 54 : Math.min(60, pullDistance),
              opacity: 1 
            }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="overflow-hidden flex items-center justify-center -mx-4 px-4 mb-3 bg-gradient-to-b from-blue-50/80 to-transparent border-b border-blue-100/50"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0055B8] py-2">
              {refreshSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-bounce" />
                  <span className="text-emerald-700 font-bold">Inventory &amp; prices synced with Firestore</span>
                </>
              ) : isRefreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 text-[#0055B8] animate-spin" />
                  <span>Syncing live inventory from Firestore...</span>
                </>
              ) : (
                <>
                  <ArrowDown 
                    className="w-4 h-4 transition-transform duration-200"
                    style={{ transform: `rotate(${Math.min(180, (pullDistance / 55) * 180)}deg)` }}
                  />
                  <span>
                    {pullDistance >= 55 
                      ? "Release to sync with Firestore" 
                      : "Pull down to sync inventory"}
                  </span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header & Live Search Bar */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="font-sans font-bold text-xl sm:text-2xl tracking-tight text-slate-900">
              Machinery Showroom
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-normal">
              Certified industrial machinery in Nairobi stock with 12-month warranty &amp; nationwide delivery
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={triggerSync}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 text-xs font-mono text-[#0055B8] bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 px-3.5 py-2 rounded-full font-medium transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-2xs"
              title="Sync inventory with Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden xs:inline">Sync Live Stock</span>
              <span className="xs:hidden">Sync</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-emerald-800 bg-emerald-50/80 border border-emerald-200/80 px-3.5 py-2 rounded-full font-medium shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Nairobi Showroom Live Stock</span>
            </div>
          </div>
        </div>

        {/* Live Search Box */}
        <div ref={searchContainerRef} className="mt-3 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addToHistory(searchQuery);
                setIsSearchFocused(false);
              }
            }}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search machinery (e.g., 2-Post Lift, 350L Mixer, Panel Saw, Screw Compressor)..."
            className="block w-full pl-10 pr-20 py-2.5 bg-white border border-slate-200/90 rounded-full text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0055B8] focus:ring-2 focus:ring-blue-100/50 transition-all font-sans shadow-2xs"
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
            <button
              onClick={handleVoiceSearch}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                isListening 
                  ? "bg-red-500 text-white animate-pulse" 
                  : "text-slate-400 hover:text-[#0055B8] hover:bg-slate-100"
              }`}
              title="Voice Search"
              type="button"
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                title="Clear Search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search History Dropdown */}
          <AnimatePresence>
            {isSearchFocused && recentSearches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute left-0 right-0 mt-1 bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden z-50 p-2 space-y-1 text-left"
              >
                <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Recent Searches</span>
                  <button
                    onClick={clearAllHistory}
                    className="text-[10px] font-mono text-[#0055B8] font-semibold cursor-pointer hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                {recentSearches.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSearchQuery(item);
                      setIsSearchFocused(false);
                    }}
                    className="flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-blue-50/60 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <History className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0055B8] shrink-0" />
                      <span className="text-xs text-slate-800 group-hover:text-[#0055B8] truncate">{item}</span>
                    </div>
                    <button
                      onClick={(e) => removeFromHistory(e, item)}
                      className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 2. Horizontal Scrollable Category Touch-Chips Bar */}
      <div className="mb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
          {categoryMetaList.map((cat) => {
            const isSelected = selectedMainCategory === cat.id;
            const count = cat.id === "All" 
              ? products.length 
              : products.filter(p => getProductMainCategory(p.category) === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedMainCategory(cat.id);
                  setSelectedSubcategory("All");
                  setSelectedBrand("All");
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 font-medium ${
                  isSelected
                    ? "bg-[#0055B8] text-white shadow-2xs font-semibold"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-300"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}

          {/* In-Stock Touch Chip */}
          <button
            onClick={() => setOnlyInStock(!onlyInStock)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 font-medium ${
              onlyInStock
                ? "bg-emerald-700 text-white shadow-2xs font-semibold"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>In Stock Nairobi</span>
          </button>

          {/* Saved Equipment Quick Tab */}
          <button
            onClick={() => setOnlyShowWishlist(!onlyShowWishlist)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 font-medium ${
              onlyShowWishlist
                ? "bg-rose-600 text-white shadow-2xs font-semibold"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${onlyShowWishlist ? "fill-white" : "text-rose-500"}`} />
            <span>Saved Units</span>
            {wishlist.length > 0 && (
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                onlyShowWishlist ? "bg-white/20 text-white" : "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold"
              }`}>
                {wishlist.length}
              </span>
            )}
          </button>
        </div>

        {/* Subcategories Horizontal Touch-Chips Bar (shown when category has subtypes) */}
        {availableSubcategories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <span className="text-[10px] font-mono uppercase font-semibold text-slate-400 dark:text-slate-500 shrink-0">Subtype:</span>
            <button
              onClick={() => setSelectedSubcategory("All")}
              className={`px-3 py-1 rounded-full text-xs font-mono transition-all shrink-0 cursor-pointer ${
                selectedSubcategory === "All"
                  ? "bg-blue-100 dark:bg-blue-950/80 text-[#0055B8] dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70"
              }`}
            >
              All Types
            </button>
            {availableSubcategories.map((subcat) => (
              <button
                key={subcat}
                onClick={() => setSelectedSubcategory(subcat)}
                className={`px-3 py-1 rounded-full text-xs font-mono transition-all shrink-0 cursor-pointer ${
                  selectedSubcategory === subcat
                    ? "bg-blue-100 dark:bg-blue-950/80 text-[#0055B8] dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70"
                }`}
              >
                {subcat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Streamlined Mobile Control Bar (`lg:hidden`): Filter, Sort, In-Stock, and View Switcher */}
      <div className="lg:hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2 mb-4 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Detailed Filters Trigger Button */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all cursor-pointer min-h-[40px] shrink-0 active:scale-95 ${
              activeFiltersCount > 0
                ? "bg-[#0055B8] text-white shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-white dark:bg-blue-900 text-[#0055B8] dark:text-blue-200 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Quick Sort Dropdown */}
          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium px-3.5 py-2 rounded-full focus:border-[#0055B8] focus:outline-hidden min-h-[40px] cursor-pointer"
            >
              <option value="default">Default Sort</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">New Arrivals</option>
              <option value="name-az">Model: A-Z</option>
            </select>
          </div>
        </div>

        {/* View Density Switcher (1-Column Detailed vs 2-Column Grid) */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-full p-1 shrink-0 border border-slate-200/80 dark:border-slate-700">
          <button
            onClick={() => setMobileViewMode("list")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer min-h-[36px] ${
              mobileViewMode === "list"
                ? "bg-white dark:bg-slate-700 text-[#0055B8] dark:text-blue-300 shadow-2xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
            title="1-Column Detailed View"
          >
            <List className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden xs:inline">Detailed</span>
          </button>

          <button
            onClick={() => setMobileViewMode("grid")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer min-h-[36px] ${
              mobileViewMode === "grid"
                ? "bg-white dark:bg-slate-700 text-[#0055B8] dark:text-blue-300 shadow-2xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
            title="2-Column Grid View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden xs:inline">Grid</span>
          </button>
        </div>
      </div>

      {/* 4. Active Filters Removable Chips Bar */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-4 text-xs">
          <span className="text-[11px] font-mono text-slate-500 font-semibold uppercase mr-1">Active:</span>

          {selectedMainCategory !== "All" && (
            <span className="inline-flex items-center gap-1 bg-blue-50 text-[#0055B8] border border-blue-200/80 px-2.5 py-1 rounded-full font-medium">
              <span>{selectedMainCategory}</span>
              <button onClick={() => { setSelectedMainCategory("All"); setSelectedSubcategory("All"); }} className="hover:text-blue-900 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedSubcategory !== "All" && (
            <span className="inline-flex items-center gap-1 bg-blue-50 text-[#0055B8] border border-blue-200/80 px-2.5 py-1 rounded-full font-medium">
              <span>{selectedSubcategory}</span>
              <button onClick={() => setSelectedSubcategory("All")} className="hover:text-blue-900 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedBrand !== "All" && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 border border-slate-200/80 px-2.5 py-1 rounded-full font-medium">
              <span>Brand: {selectedBrand}</span>
              <button onClick={() => setSelectedBrand("All")} className="hover:text-slate-900 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {(minPrice !== "" || maxPrice !== "") && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 border border-slate-200/80 px-2.5 py-1 rounded-full font-medium">
              <span>
                {minPrice !== "" ? `Min ${formatKES(Number(minPrice))}` : ""}
                {minPrice !== "" && maxPrice !== "" ? " - " : ""}
                {maxPrice !== "" ? `Max ${formatKES(Number(maxPrice))}` : ""}
              </span>
              <button onClick={() => { setMinPrice(""); setMaxPrice(""); }} className="hover:text-slate-900 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {onlyInStock && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
              <span>In Stock Only</span>
              <button onClick={() => setOnlyInStock(false)} className="hover:text-emerald-900 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {onlyShowWishlist && (
            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full font-medium">
              <span>Saved Only</span>
              <button onClick={() => setOnlyShowWishlist(false)} className="hover:text-rose-900 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={resetFilters}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline ml-1 cursor-pointer"
          >
            Reset All
          </button>
        </div>
      )}

      {/* 5. Main Content Grid (Desktop Sidebar + Product Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Desktop-Only Left Filter Sidebar (`hidden lg:block`) */}
        <div id="sidebar-filters" className="hidden lg:block space-y-6 sticky top-20">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#0055B8]" />
                Filter Catalog
              </span>
              <button 
                onClick={resetFilters} 
                className="text-xs font-semibold text-slate-500 hover:text-[#0055B8] flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* In-Stock Only Toggle */}
            <div className="flex items-center justify-between py-1">
              <label htmlFor="instock-toggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                In Stock Units Only
              </label>
              <input
                id="instock-toggle"
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="w-4 h-4 text-[#0055B8] rounded border-slate-300 focus:ring-[#0055B8] cursor-pointer"
              />
            </div>

            {/* Categories */}
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Categories
              </span>
              <div className="space-y-1">
                {categoryMetaList.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedMainCategory(cat.id);
                      setSelectedSubcategory("All");
                      setSelectedBrand("All");
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                      selectedMainCategory === cat.id
                        ? "bg-blue-50 text-[#0055B8] font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{cat.label}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {cat.id === "All" ? products.length : products.filter(p => getProductMainCategory(p.category) === cat.id).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subcategories (if selected) */}
            {availableSubcategories.length > 0 && (
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 space-y-2">
                <span className="text-[10px] font-mono font-bold text-[#0055B8] uppercase block">
                  {selectedMainCategory} Types
                </span>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setSelectedSubcategory("All")}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
                      selectedSubcategory === "All"
                        ? "bg-[#0055B8] text-white font-bold"
                        : "bg-white text-slate-700 border border-slate-200 hover:text-[#0055B8]"
                    }`}
                  >
                    All Types
                  </button>
                  {availableSubcategories.map(subcat => (
                    <button
                      key={subcat}
                      onClick={() => setSelectedSubcategory(subcat)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
                        selectedSubcategory === subcat
                          ? "bg-[#0055B8] text-white font-bold"
                          : "bg-white text-slate-700 border border-slate-200 hover:text-[#0055B8]"
                      }`}
                    >
                      {subcat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Brand Filter */}
            <div className="border-t border-slate-100 pt-3">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Brand / Manufacturer
              </span>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {brands.map(b => (
                  <button
                    key={b}
                    onClick={() => setSelectedBrand(b)}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                      selectedBrand === b
                        ? "bg-[#0055B8] text-white font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{b === "All" ? "All Brands" : b}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="border-t border-slate-100 pt-3">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Price Range (KES)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min KES"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none focus:border-[#0055B8]"
                />
                <input
                  type="number"
                  placeholder="Max KES"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none focus:border-[#0055B8]"
                />
              </div>
            </div>

            {/* Desktop Sort Dropdown */}
            <div className="border-t border-slate-100 pt-3">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Sort Order
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none cursor-pointer"
              >
                <option value="default">Default Showroom Order</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
                <option value="name-az">Name: A to Z</option>
              </select>
            </div>

          </div>
        </div>

        {/* Product Grid Area (`lg:col-span-3`) */}
        <div className="lg:col-span-3">

          {/* Results summary row */}
          <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-500">
            <span className="font-bold text-slate-800">
              {filteredProducts.length} {filteredProducts.length === 1 ? "machinery unit" : "machinery units"} found
            </span>
            <span className="hidden sm:inline text-[#0055B8] font-bold">
              Direct Showroom Dispatch
            </span>
          </div>

          {/* Loading State */}
          {productsLoading && products.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 animate-pulse">
                  <div className="aspect-4/3 bg-slate-100 rounded-xl" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-5 bg-slate-200 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto space-y-4 shadow-xs">
              <div className="w-12 h-12 bg-blue-50 text-[#0055B8] rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">No machinery matching your filter</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                We couldn't locate any machinery models with your current filter criteria. Try resetting categories or adjusting price ranges.
              </p>
              <button
                onClick={resetFilters}
                className="bg-[#0055B8] hover:bg-[#004494] text-white text-xs font-bold px-5 py-3 rounded-xl shadow-xs transition-all cursor-pointer min-h-[44px]"
              >
                Reset Catalog Filters
              </button>
            </div>
          ) : (
            <>
              {/* Product Cards Container: Responsive Grid that defaults to 2-column on mobile and 3-column on desktop */}
              <div className={
                mobileViewMode === "list"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5"
                  : "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2.5 sm:gap-4"
              }>
                {paginatedProducts.map((p) => {
                  const isLowStock = p.stock > 0 && p.stock <= 5;
                  const isOutOfStock = p.stock === 0;
                  const isBookmarked = wishlist.includes(p.id);

                  if (mobileViewMode === "list") {
                    // 1-COLUMN COMFORTABLE CARD (Mobile First & Tablet/Desktop Adaptive)
                    return (
                      <div
                        key={p.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#0055B8] dark:hover:border-blue-500 rounded-2xl p-4 transition-all shadow-xs hover:shadow-md flex flex-col justify-between group relative"
                      >
                        {/* Image Tap Area -> Direct Full Page View */}
                        <div 
                          onClick={() => {
                            setSelectedProductId(p.id);
                            setActiveView("product-details");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="relative w-full aspect-16/10 sm:aspect-4/3 bg-slate-50 dark:bg-slate-800/80 rounded-xl overflow-hidden p-3 flex items-center justify-center shrink-0 cursor-pointer border border-slate-100 dark:border-slate-700/80 mb-3"
                          title="View Full Machinery Details"
                        >
                          <LazyImage
                            src={p.image}
                            alt={p.name}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                          {isLowStock && (
                            <span className="absolute top-2.5 left-2.5 bg-amber-500 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shadow-xs">
                              Low Stock ({p.stock})
                            </span>
                          )}
                          {isOutOfStock && (
                            <span className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shadow-xs">
                              Sold Out
                            </span>
                          )}

                          {/* Wishlist Button (Generous 44px touch hit target) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist(p.id);
                            }}
                            className="absolute top-2 right-2 p-2.5 rounded-xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-xs text-slate-400 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors shadow-xs cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                            title={isBookmarked ? "Saved" : "Save item"}
                          >
                            <Heart className={`w-4 h-4 ${isBookmarked ? "fill-rose-500 text-rose-500" : ""}`} />
                          </button>
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-between min-w-0 space-y-2.5">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-mono font-bold text-[#0055B8] dark:text-blue-400 uppercase tracking-wider truncate">
                                {normalizeBrandName(p.brand)} • {p.category}
                              </span>
                            </div>

                            <h3 
                              onClick={() => {
                                setSelectedProductId(p.id);
                                setActiveView("product-details");
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-[#0055B8] dark:hover:text-blue-400 transition-colors cursor-pointer line-clamp-2 mt-0.5"
                              title="View Full Machinery Details"
                            >
                              {p.name}
                            </h3>

                            <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2 mt-1 leading-relaxed">
                              {p.description}
                            </p>
                          </div>

                          {/* Price & Action Row (Ergonomic ≥44px touch targets) */}
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-baseline justify-between mb-2.5">
                              <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase">SHOWROOM PRICE</span>
                              <span className="text-base sm:text-lg font-extrabold text-[#0055B8] dark:text-blue-400 font-mono">
                                {formatKES(p.price)}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => {
                                  setSelectedProductId(p.id);
                                  setActiveView("product-details");
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold py-3 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
                              >
                                <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                <span>Full Details</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (isOutOfStock) {
                                    setSelectedProductId(p.id);
                                    setActiveView("product-details");
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                  } else {
                                    const variants = getProductVariants(p);
                                    if (variants) {
                                      setQuickBuyProduct(p);
                                    } else {
                                      addToCart(p, 1);
                                    }
                                  }
                                }}
                                className={`text-xs font-bold py-3 px-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs min-h-[44px] ${
                                  isOutOfStock
                                    ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                    : "bg-[#0055B8] hover:bg-[#004494] text-white"
                                }`}
                              >
                                <ShoppingBag className="w-4 h-4" />
                                <span>{isOutOfStock ? "Inquire" : "Order"}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 2-COLUMN GRID CARD (Compact Mode)
                  return (
                    <div
                      key={p.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#0055B8] dark:hover:border-blue-500 rounded-2xl p-2.5 sm:p-3 transition-all shadow-xs flex flex-col justify-between group relative"
                    >
                      {/* Image Container with Badges -> Direct Full Page View */}
                      <div 
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setActiveView("product-details");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="relative aspect-4/3 bg-slate-50 dark:bg-slate-800/80 rounded-xl overflow-hidden p-2 flex items-center justify-center cursor-pointer border border-slate-100 dark:border-slate-700/80 mb-2"
                        title="View Full Machinery Details"
                      >
                        <LazyImage
                          src={p.image}
                          alt={p.name}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Stock Badges */}
                        {isLowStock && (
                          <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[8px] sm:text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs">
                            Low Stock ({p.stock})
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[8px] sm:text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs">
                            Sold Out
                          </span>
                        )}

                        {/* Wishlist Heart Top-Right Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(p.id);
                          }}
                          className="absolute top-1 right-1 p-2 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs text-slate-400 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors shadow-2xs cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                          title={isBookmarked ? "Remove from bookmarks" : "Save item"}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isBookmarked ? "fill-rose-500 text-rose-500" : ""}`} />
                        </button>
                      </div>

                      {/* Info */}
                      <div className="flex-1 flex flex-col justify-between space-y-1.5 sm:space-y-2">
                        <div>
                          <span className="text-[9px] sm:text-[10px] font-mono font-bold text-[#0055B8] dark:text-blue-400 uppercase tracking-wider block truncate">
                            {normalizeBrandName(p.brand)}
                          </span>

                          <h3
                            onClick={() => {
                              setSelectedProductId(p.id);
                              setActiveView("product-details");
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-[#0055B8] dark:hover:text-blue-400 transition-colors cursor-pointer line-clamp-2 leading-tight mt-0.5 min-h-[30px]"
                            title={p.name}
                          >
                            {p.name}
                          </h3>
                        </div>

                        {/* Price & CTA Button (min 44px touch targets) */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="mb-2">
                            <span className="text-[8px] font-mono text-slate-400 dark:text-slate-500 block leading-none">SHOWROOM PRICE</span>
                            <span className="text-xs sm:text-sm font-extrabold text-[#0055B8] dark:text-blue-400 font-mono">
                              {formatKES(p.price)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedProductId(p.id);
                                setActiveView("product-details");
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 min-h-[44px]"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                              <span>Details</span>
                            </button>

                            <button
                              onClick={() => {
                                if (isOutOfStock) {
                                  setSelectedProductId(p.id);
                                  setActiveView("product-details");
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                } else {
                                  const variants = getProductVariants(p);
                                  if (variants) {
                                    setQuickBuyProduct(p);
                                  } else {
                                    addToCart(p, 1);
                                  }
                                }
                              }}
                              className={`text-[11px] font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 min-h-[44px] shadow-xs ${
                                isOutOfStock
                                  ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                  : "bg-[#0055B8] hover:bg-[#004494] text-white"
                              }`}
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>{isOutOfStock ? "Inquire" : "Order"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredProducts.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
                itemNameSingular="machinery unit"
                itemNamePlural="machinery units"
                scrollToId="shop-view-grid"
              />
            </>
          )}

        </div>
      </div>

      {/* 6. Mobile Filter Centered Modal */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Centered Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[88vh] my-auto flex flex-col shadow-2xl z-10 overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 shrink-0">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#0055B8]" />
                  <h3 className="font-bold text-sm text-slate-900">Filter Machinery Catalog</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={resetFilters}
                    className="text-xs font-bold text-slate-500 hover:text-[#0055B8]"
                  >
                    Reset All
                  </button>
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-700 bg-white border border-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sheet Body (Scrollable) */}
              <div className="p-5 overflow-y-auto space-y-5 text-left">
                
                {/* In-Stock Only Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">In-Stock Machinery Only</span>
                    <span className="text-[11px] text-slate-500">Only show units ready for immediate Nairobi dispatch</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="w-5 h-5 text-[#0055B8] rounded border-slate-300 focus:ring-[#0055B8] cursor-pointer"
                  />
                </div>

                {/* Categories */}
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Machinery Category
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {categoryMetaList.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedMainCategory(cat.id);
                          setSelectedSubcategory("All");
                        }}
                        className={`p-2.5 rounded-xl text-xs text-left transition-all border ${
                          selectedMainCategory === cat.id
                            ? "bg-blue-50 border-[#0055B8] text-[#0055B8] font-bold"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="block text-sm mb-0.5">{cat.emoji}</span>
                        <span className="truncate block font-semibold">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subcategories (if selected) */}
                {availableSubcategories.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      {selectedMainCategory} Equipment Type
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setSelectedSubcategory("All")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                          selectedSubcategory === "All"
                            ? "bg-[#0055B8] text-white font-bold"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        All Types
                      </button>
                      {availableSubcategories.map(subcat => (
                        <button
                          key={subcat}
                          onClick={() => setSelectedSubcategory(subcat)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                            selectedSubcategory === subcat
                              ? "bg-[#0055B8] text-white font-bold"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {subcat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Brand Selection */}
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Manufacturer / Brand
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {brands.map(b => (
                      <button
                        key={b}
                        onClick={() => setSelectedBrand(b)}
                        className={`px-3 py-1.5 rounded-xl text-xs transition-all ${
                          selectedBrand === b
                            ? "bg-[#0055B8] text-white font-bold"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {b === "All" ? "All Brands" : b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Presets & Inputs */}
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Price Range (KES)
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    {pricePresets.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setMinPrice(preset.min as any);
                          setMaxPrice(preset.max as any);
                        }}
                        className="px-2 py-1.5 rounded-xl text-[11px] font-mono bg-slate-100 hover:bg-blue-50 text-slate-700 border border-slate-200 font-semibold text-center"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min KES"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Max KES"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono outline-none"
                    />
                  </div>
                </div>

                {/* Sort selector inside sheet */}
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Sort Sequence
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium outline-none"
                  >
                    <option value="default">Default Showroom Order</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="newest">Newest Arrivals</option>
                    <option value="name-az">Name: A to Z</option>
                  </select>
                </div>

              </div>

              {/* Sheet Sticky Apply Footer */}
              <div className="p-4 border-t border-slate-100 bg-white shrink-0 pb-[max(env(safe-area-inset-bottom,1rem),1rem)]">
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full bg-[#0055B8] hover:bg-[#004494] text-white font-bold text-xs py-3 rounded-2xl shadow-md transition-all cursor-pointer"
                >
                  Show {filteredProducts.length} Machinery Units
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Quick Buy Interactive Modal (Centered with no page scroll needed) */}
      {quickBuyProduct && (
        <div id="quick-buy-modal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 max-w-md w-full relative space-y-5 shadow-2xl my-auto max-h-[92vh] overflow-y-auto text-slate-900">
            <button
              onClick={() => setQuickBuyProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Product Header */}
            <div className="flex gap-3">
              <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden p-1.5 flex items-center justify-center shrink-0">
                <LazyImage
                  src={quickBuyProduct.image}
                  alt={quickBuyProduct.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono text-[#0055B8] font-bold uppercase">{quickBuyProduct.category}</span>
                <h3 className="font-bold text-sm text-slate-900 line-clamp-2">{quickBuyProduct.name}</h3>
                <span className="text-xs font-mono font-extrabold text-[#0055B8] mt-1 block">
                  {formatKES(quickBuyProduct.price)}
                </span>
              </div>
            </div>

            {/* Variant options if present */}
            {getProductVariants(quickBuyProduct) && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                  {getProductVariants(quickBuyProduct)?.label}
                </label>
                <div className="space-y-1.5">
                  {getProductVariants(quickBuyProduct)?.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSelectedVariant(option)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex justify-between items-center transition-all cursor-pointer border ${
                        selectedVariant === option
                          ? "bg-blue-50 border-[#0055B8] text-[#0055B8] font-bold"
                          : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      <span>{option.split(" (")[0]}</span>
                      {option.includes("(+") && (
                        <span className="text-[10px] font-mono text-[#0055B8] font-bold">
                          +{option.split("(+")[1].replace(")", "")}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center justify-between py-2 border-t border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700">Quantity</span>
              <div className="flex items-center gap-3 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                <button
                  disabled={quickBuyQuantity <= 1}
                  onClick={() => setQuickBuyQuantity(prev => prev - 1)}
                  className="text-slate-600 hover:text-slate-900 disabled:opacity-40 p-1 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold font-mono text-slate-900 w-4 text-center">
                  {quickBuyQuantity}
                </span>
                <button
                  onClick={() => setQuickBuyQuantity(prev => prev + 1)}
                  className="text-slate-600 hover:text-slate-900 p-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Total & Action */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-[9px] text-slate-400 font-mono block">TOTAL</span>
                <span className="text-base font-extrabold text-[#0055B8] font-mono">
                  {formatKES(quickBuyProduct.price * quickBuyQuantity)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setQuickBuyProduct(null)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuickBuySubmit}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0055B8] hover:bg-[#004494] shadow-xs cursor-pointer"
                >
                  Order Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
