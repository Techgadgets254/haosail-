/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useStore } from "../StoreContext";
import HaosailLogo from "./HaosailLogo";
import { 
  ShoppingBag, 
  User as UserIcon, 
  LogOut, 
  Search, 
  Settings, 
  Home, 
  LogIn,
  Newspaper,
  X,
  Menu,
  PhoneCall,
  MapPin,
  Tag,
  Package,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Truck,
  Sun,
  Moon,
  Monitor,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Header() {
  const { 
    user, 
    userProfile, 
    cart, 
    activeView, 
    setActiveView, 
    logout,
    searchQuery,
    setSearchQuery,
    products,
    setSelectedProductId,
    setIsAuthModalOpen,
    setAuthModalMode,
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme
  } = useStore();

  const [desktopFocused, setDesktopFocused] = useState(false);
  const [mobileFocused, setMobileFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const profileRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Sync local search when global searchQuery changes
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounce search query update
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 150);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trimmedQuery = localSearch.trim().toLowerCase();

  // Search suggestions calculations
  const suggestions = React.useMemo(() => {
    if (!trimmedQuery) {
      const popularCats = Array.from(new Set(products.map(p => p.category))).slice(0, 4);
      const featuredProds = products.filter(p => p.stock > 0).slice(0, 3);
      return {
        categories: popularCats.map(c => ({
          name: c,
          count: products.filter(p => p.category === c).length
        })),
        products: featuredProds,
        isDefault: true
      };
    }

    const categoriesWithCounts = Array.from(new Set(products.map(p => p.category)))
      .filter(cat => cat.toLowerCase().includes(trimmedQuery))
      .map(cat => ({
        name: cat,
        count: products.filter(p => p.category === cat).length
      }));

    const matchingProducts = products.filter(p => 
      p.name.toLowerCase().includes(trimmedQuery) ||
      p.brand.toLowerCase().includes(trimmedQuery) ||
      p.category.toLowerCase().includes(trimmedQuery) ||
      (p.sku && p.sku.toLowerCase().includes(trimmedQuery))
    ).slice(0, 5);

    return {
      categories: categoriesWithCounts,
      products: matchingProducts,
      isDefault: false
    };
  }, [trimmedQuery, products]);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
    if (activeView !== "shop") {
      setActiveView("shop");
    }
  };

  return (
    <>
      {/* Main Storefront Header */}
      <header id="storefront-header" className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 sm:h-18 flex items-center justify-between gap-4 sm:gap-6">
            
            {/* Official Brand Logo */}
            <div 
              id="brand-logo"
              className="cursor-pointer shrink-0 py-1"
              onClick={() => { 
                setActiveView("home"); 
                setLocalSearch(""); 
                setSearchQuery(""); 
              }}
            >
              <HaosailLogo className="h-9 sm:h-10" />
            </div>

            {/* Desktop Center: Prominent, High-Contrast Search Bar */}
            <div id="header-search" className="hidden md:flex flex-1 max-w-lg relative">
              <div className="relative w-full group">
                <Search className="w-4 h-4 text-slate-400 group-focus-within:text-[#0055B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={handleSearchChange}
                  onFocus={() => setDesktopFocused(true)}
                  onBlur={() => setTimeout(() => setDesktopFocused(false), 200)}
                  placeholder="Search catalog: car lifts, concrete mixers, saws..."
                  className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm py-2 pl-10 pr-12 rounded-full border border-slate-200/80 focus:border-[#0055B8] focus:ring-3 focus:ring-blue-500/15 transition-all font-sans outline-none shadow-xs"
                />
                {localSearch ? (
                  <button 
                    onClick={() => { setLocalSearch(""); setSearchQuery(""); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs p-1 rounded-full cursor-pointer hover:bg-slate-200/60 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden lg:flex items-center gap-0.5 text-[10px] font-mono text-slate-400 bg-white/80 border border-slate-200/80 px-1.5 py-0.5 rounded">
                    <span>⌘</span>
                    <span>K</span>
                  </div>
                )}
              </div>

              {/* Desktop Predictive Search Suggestions Dropdown */}
              {desktopFocused && (suggestions.categories.length > 0 || suggestions.products.length > 0) && (
                <div 
                  className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-[0_16px_36px_rgba(0,0,0,0.08)] overflow-hidden z-50 text-left py-2 max-h-[30rem] overflow-y-auto"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                    <span>{suggestions.isDefault ? "Suggested Categories" : `Results (${suggestions.products.length + suggestions.categories.length})`}</span>
                    <span className="text-[#0055B8]">Live Index</span>
                  </div>

                  {/* Categories */}
                  {suggestions.categories.length > 0 && (
                    <div className="p-3">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <Tag className="w-3 h-3 text-[#0055B8]" />
                        <span>Categories</span>
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {suggestions.categories.map((cat, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setLocalSearch(cat.name);
                              setSearchQuery(cat.name);
                              setActiveView("shop");
                              setDesktopFocused(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-700 bg-slate-50/80 hover:bg-blue-50/80 hover:text-[#0055B8] border border-slate-200/70 hover:border-blue-200 transition-all flex items-center justify-between font-medium cursor-pointer"
                          >
                            <span className="truncate">{cat.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white text-slate-500 font-semibold shrink-0 ml-1 border border-slate-200/60">
                              {cat.count}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestions.categories.length > 0 && suggestions.products.length > 0 && (
                    <div className="border-t border-slate-100" />
                  )}

                  {/* Matching Products */}
                  {suggestions.products.length > 0 && (
                    <div className="p-3">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <Package className="w-3 h-3 text-[#0055B8]" />
                        <span>Machinery Matches</span>
                      </span>
                      <div className="space-y-1">
                        {suggestions.products.map((prod) => (
                          <button
                            key={prod.id}
                            onClick={() => {
                              setSelectedProductId(prod.id);
                              setActiveView("product-details");
                              setDesktopFocused(false);
                            }}
                            className="w-full text-left p-2 rounded-xl text-xs hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all flex items-center gap-3 cursor-pointer group"
                          >
                            <img 
                              src={prod.image} 
                              alt={prod.name} 
                              className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200/80"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 truncate group-hover:text-[#0055B8] transition-colors">{prod.name}</p>
                              <div className="flex items-center justify-between mt-0.5 text-[11px] font-mono">
                                <span className="text-[#0055B8] font-bold">KES {prod.price.toLocaleString()}</span>
                                <span className={prod.stock > 0 ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"}>
                                  {prod.stock > 0 ? `${prod.stock} in stock` : "Out of stock"}
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {trimmedQuery && (
                    <div className="p-3 pt-1.5 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setActiveView("shop");
                          setDesktopFocused(false);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#0055B8] hover:bg-[#004494] text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>View all catalog results for "{trimmedQuery}"</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Desktop Navigation Links & Action Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              
              {/* Primary Nav Links with Apple pill tabs */}
              <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold">
                <button
                  onClick={() => { setActiveView("home"); setSearchQuery(""); }}
                  className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                    activeView === "home"
                      ? "text-[#0055B8] bg-blue-50/80 border border-blue-200/60 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => { setActiveView("shop"); setSearchQuery(""); }}
                  className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                    activeView === "shop"
                      ? "text-[#0055B8] bg-blue-50/80 border border-blue-200/60 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  Shop Catalogue
                </button>
                <button
                  onClick={() => { setActiveView("news"); setSearchQuery(""); }}
                  className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                    activeView === "news"
                      ? "text-[#0055B8] bg-blue-50/80 border border-blue-200/60 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  News
                </button>
              </nav>

              {/* System-Aware Dark Mode Toggle Button & Dropdown */}
              <div className="relative" ref={themeMenuRef}>
                <button
                  id="theme-mode-toggle"
                  onClick={() => setShowThemeMenu(!showThemeMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all font-medium text-xs cursor-pointer border border-slate-200/80 dark:border-slate-700 shadow-xs active:scale-95"
                  title={`Theme: ${theme.toUpperCase()} (${resolvedTheme} active)`}
                  aria-label="Toggle display theme mode"
                >
                  {theme === "system" ? (
                    <Monitor className="w-3.5 h-3.5 text-blue-500" />
                  ) : resolvedTheme === "dark" ? (
                    <Moon className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span className="hidden xl:inline text-[11px] font-mono capitalize">
                    {theme}
                  </span>
                </button>

                <AnimatePresence>
                  {showThemeMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      className="absolute right-0 top-full mt-2 w-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_16px_36px_rgba(0,0,0,0.12)] p-1.5 z-50 text-left"
                    >
                      <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                        Theme Mode
                      </div>
                      {[
                        { id: "light", label: "Light", icon: Sun, color: "text-amber-500" },
                        { id: "dark", label: "Dark", icon: Moon, color: "text-amber-400" },
                        { id: "system", label: "System", icon: Monitor, color: "text-blue-500" },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isActive = theme === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setTheme(item.id as any);
                              setShowThemeMenu(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                              isActive
                                ? "bg-blue-50 dark:bg-blue-950/60 text-[#0055B8] dark:text-blue-400 font-bold"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                              <span>{item.label}</span>
                            </div>
                            {isActive && <Check className="w-3.5 h-3.5 text-[#0055B8] dark:text-blue-400" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Shopping Cart Button */}
              <button
                id="cart-button"
                onClick={() => setActiveView("checkout")}
                className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all font-semibold text-xs cursor-pointer border border-slate-200/80 dark:border-slate-700 shadow-xs hover:border-slate-300"
                title="View Quotation & Cart"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#0055B8]" />
                <span className="hidden sm:inline text-xs font-medium">Cart</span>
                {cartItemCount > 0 && (
                  <span className="bg-[#0055B8] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center font-mono">
                    {cartItemCount}
                  </span>
                )}
              </button>

              {/* User Account / Auth Dropdown */}
              <div className="relative" ref={profileRef}>
                {user ? (
                  <div>
                    <button
                      onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                      className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border border-slate-200/80 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                    >
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt="User" 
                          className="w-6 h-6 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-blue-50 text-[#0055B8] rounded-full flex items-center justify-center font-bold text-[11px]">
                          {user.displayName?.charAt(0) || "U"}
                        </div>
                      )}
                      <span className="hidden md:inline text-xs font-semibold text-slate-800">
                        {userProfile?.role === "admin" ? "Admin" : "Account"}
                      </span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    <AnimatePresence>
                      {showProfileDropdown && (
                        <motion.div 
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          className="absolute right-0 top-full mt-2 w-56 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-[0_16px_36px_rgba(0,0,0,0.08)] py-2 z-50 text-left"
                        >
                          <div className="px-4 py-2.5 border-b border-slate-100">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {user.displayName || "Valued Client"}
                            </p>
                            <p className="text-[11px] font-mono text-slate-500 truncate">{user.email}</p>
                            {userProfile?.role === "admin" && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-mono rounded-full bg-blue-50 text-[#0055B8] font-bold border border-blue-200/60">
                                ADMIN CONSOLE
                              </span>
                            )}
                          </div>

                          {userProfile?.role === "admin" && (
                            <button
                              onClick={() => {
                                setActiveView("admin-dashboard");
                                setShowProfileDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium cursor-pointer"
                            >
                              <Settings className="w-3.5 h-3.5 text-[#0055B8]" />
                              <span>Admin Dashboard</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setActiveView("client-dashboard");
                              setShowProfileDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium cursor-pointer"
                          >
                            <UserIcon className="w-3.5 h-3.5 text-[#0055B8]" />
                            <span>My Orders &amp; Invoices</span>
                          </button>

                          <button
                            onClick={() => {
                              logout();
                              setShowProfileDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-medium cursor-pointer border-t border-slate-100 mt-1"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAuthModalMode("login"); setIsAuthModalOpen(true); }}
                    className="bg-[#0055B8] hover:bg-[#004494] text-white font-medium text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>

              {/* Mobile Hamburger Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-full text-slate-700 hover:bg-slate-100 border border-slate-200/80 cursor-pointer flex items-center justify-center transition-colors"
                title="Toggle navigation"
                aria-label="Toggle navigation"
              >
                {mobileMenuOpen ? <X className="w-4 h-4 text-slate-900" /> : <Menu className="w-4 h-4 text-slate-900" />}
              </button>

            </div>

          </div>
        </div>

        {/* 3. Mobile Search Bar - Modern pill container */}
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-slate-200/60 bg-white/90">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={localSearch}
              onChange={handleSearchChange}
              onFocus={() => setMobileFocused(true)}
              onBlur={() => setTimeout(() => setMobileFocused(false), 200)}
              placeholder="Search machinery, car lifts, mixers..."
              className="w-full bg-slate-100/90 text-slate-900 placeholder-slate-400 text-xs py-2.5 pl-10 pr-8 rounded-full border border-slate-200/80 focus:border-[#0055B8] focus:bg-white focus:ring-3 focus:ring-blue-500/15 outline-none transition-all font-sans"
            />
            {localSearch && (
              <button
                onClick={() => { setLocalSearch(""); setSearchQuery(""); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs p-1 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Mobile Predictive search dropdown */}
            {mobileFocused && (suggestions.categories.length > 0 || suggestions.products.length > 0) && (
              <div 
                className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-[0_16px_36px_rgba(0,0,0,0.08)] overflow-hidden z-50 text-left py-2 max-h-72 overflow-y-auto"
                onMouseDown={(e) => e.preventDefault()}
              >
                {suggestions.categories.length > 0 && (
                  <div className="p-3">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Categories</span>
                    <div className="space-y-1">
                      {suggestions.categories.map((cat, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setLocalSearch(cat.name);
                            setSearchQuery(cat.name);
                            setActiveView("shop");
                            setMobileFocused(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-blue-50 hover:text-[#0055B8] flex items-center justify-between font-medium transition-colors"
                        >
                          <span>{cat.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{cat.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {suggestions.products.length > 0 && (
                  <div className="p-3 border-t border-slate-100">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Products</span>
                    <div className="space-y-1">
                      {suggestions.products.map((prod) => (
                        <button
                          key={prod.id}
                          onClick={() => {
                            setSelectedProductId(prod.id);
                            setActiveView("product-details");
                            setMobileFocused(false);
                          }}
                          className="w-full text-left p-2 rounded-xl text-xs hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                        >
                          <img 
                            src={prod.image} 
                            alt={prod.name} 
                            className="w-9 h-9 rounded-lg object-cover bg-slate-100 border border-slate-200/80" 
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 truncate">{prod.name}</p>
                            <p className="text-[10px] font-mono text-[#0055B8] font-bold">KES {prod.price.toLocaleString()}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 4. Streamlined Mobile Hamburger Drawer Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-3 text-sm font-semibold shadow-[0_12px_32px_rgba(0,0,0,0.06)]"
            >
              {/* Primary Catalog Links */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block px-3">
                  Shop Catalogue &amp; News
                </span>
                <button
                  onClick={() => { setActiveView("home"); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
                    activeView === "home" ? "bg-blue-50 text-[#0055B8] font-bold" : "text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Home className="w-4 h-4 text-[#0055B8]" />
                  <span>Home</span>
                </button>
                <button
                  onClick={() => { setActiveView("shop"); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
                    activeView === "shop" ? "bg-blue-50 text-[#0055B8] font-bold" : "text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Package className="w-4 h-4 text-[#0055B8]" />
                  <span>Shop Catalogue</span>
                </button>
                <button
                  onClick={() => { setActiveView("news"); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
                    activeView === "news" ? "bg-blue-50 text-[#0055B8] font-bold" : "text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Newspaper className="w-4 h-4 text-[#0055B8]" />
                  <span>News</span>
                </button>
              </div>

              {/* Client Services & Invoices */}
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block px-3">
                  Client Hub &amp; Terms
                </span>
                <button
                  onClick={() => { setActiveView("client-dashboard"); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
                    activeView === "client-dashboard" ? "bg-blue-50 text-[#0055B8] font-bold" : "text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-[#0055B8]" />
                  <span>Orders &amp; Quotations</span>
                </button>
                <button
                  onClick={() => { setActiveView("return-policy"); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <Truck className="w-4 h-4 text-[#0055B8]" />
                  <span>Warranty &amp; Delivery Terms</span>
                </button>
                {!user && (
                  <button
                    onClick={() => {
                      setAuthModalMode("login");
                      setIsAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-[#0055B8] hover:bg-blue-50 flex items-center gap-2.5 font-bold transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In / Create Account</span>
                  </button>
                )}
              </div>

              {/* Appearance / Theme Switcher in Mobile Drawer */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block px-3">
                  Appearance
                </span>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  {[
                    { id: "light", label: "Light", icon: Sun, color: "text-amber-500" },
                    { id: "dark", label: "Dark", icon: Moon, color: "text-amber-400" },
                    { id: "system", label: "System", icon: Monitor, color: "text-blue-500" },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = theme === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setTheme(item.id as any)}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Direct Call to Showroom */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2">
                <a
                  href="tel:+254750707038"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white font-medium shadow-xs active:scale-[0.99] transition-transform"
                >
                  <PhoneCall className="w-4 h-4 text-blue-400" />
                  <span>Showroom Sales: +254 750 707038</span>
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
