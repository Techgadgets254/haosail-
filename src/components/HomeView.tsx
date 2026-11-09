/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { useStore } from "../StoreContext";
import { motion, AnimatePresence } from "motion/react";
import CustomerTestimonials from "./CustomerTestimonials";
import { formatKES } from "../utils/formatCurrency";
import { 
  ArrowRight, 
  Heart, 
  ChevronDown, 
  Cpu, 
  ShieldCheck, 
  Tag, 
  Percent, 
  Flame, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Trash2, 
  Wrench, 
  HardHat, 
  Hammer, 
  Zap, 
  Cable, 
  PhoneCall, 
  CheckCircle2, 
  Building2, 
  Truck, 
  FileCheck, 
  Headphones, 
  Search, 
  Plus,
  Eye
} from "lucide-react";

export default function HomeView() {
  const { 
    products, 
    setActiveView, 
    setSelectedProductId, 
    addToCart,
    wishlist,
    toggleWishlist,
    setSearchQuery,
    userProfile,
    removeFlashOffer,
    clearAllFlashOffers,
    recordProductView
  } = useStore();

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [homeSortBy, setHomeSortBy] = useState<string>("featured");

  const [activePromoIndex, setActivePromoIndex] = useState(0);

  const promoProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    return products.filter(p => {
      if (!p.flashPrice || p.stock <= 0) return false;
      const now = new Date();
      if (p.flashExpiry) {
        const expiryDate = new Date(p.flashExpiry);
        if (now > expiryDate) return false;
      }
      return true;
    });
  }, [products]);

  useEffect(() => {
    if (promoProducts.length <= 1) return;
    const interval = setInterval(() => {
      setActivePromoIndex(prev => (prev + 1) % promoProducts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [promoProducts]);

  const getPromoText = (index: number, product: any) => {
    const cleanCategory = (product.category || "Industrial").replace(/New |Refurbished /g, "");
    const taglineText = `Certified authentic ${product.brand} ${cleanCategory} system, Safaricom M-Pesa verified with fast Nairobi showroom pickup or nationwide freight delivery.`;
    return {
      badge: product.flashBanner || "🔥 WAREHOUSE PROMO DEAL",
      title: product.name,
      tagline: taglineText
    };
  };

  const sectionVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.5, ease: "easeOut" } 
    }
  };

  const faqData = [
    {
      q: "How does placing an order and payment on delivery work?",
      a: "When checking out, enter your contact details and workshop delivery location. Your order is immediately registered and transmitted directly to our sales desk via WhatsApp and official email. Our technical team contacts you to verify specs and coordinate delivery. You only pay upon machinery handover, bank wire, or showroom collection."
    },
    {
      q: "What is the delivery timeline and coverage for heavy machinery across Kenya?",
      a: "We ship nationwide across all 47 counties of Kenya! Nairobi County addresses receive fast same-day or next-day site delivery from our Waiyaki Way warehouse. Deliveries to Mombasa, Kisumu, Nakuru, Eldoret, Nyeri, Thika, and upcountry hubs arrive within 24 to 48 hours via dedicated freight transport."
    },
    {
      q: "How does equipment warranty, testing, and technician commissioning work?",
      a: "All Haosail machinery—including 2-Post & 4-Post hydraulic car lifts, diesel concrete mixers, sliding table saws, air compressors, and silent diesel generators—comes with a 12-month factory warranty guarantee, genuine spare parts availability, and on-site commissioning by certified technicians upon request."
    },
    {
      q: "Can I request an official E-TIMS Tax Invoice or quotation for corporate purchases?",
      a: "Yes. Simply select 'Bank Wire / Corporate E-TIMS Proforma Invoice' at checkout or contact our sales department at sales@haosail.ke / +254 750 707038 with your KRA PIN details for an official stamped proforma quotation."
    },
    {
      q: "Where is the physical showroom and machinery warehouse located in Nairobi?",
      a: "Our main distribution center and machinery showroom is conveniently located along Waiyaki Way in Nairobi, Kenya. You are welcome to visit our showroom during business hours (Monday–Saturday 8:00 AM – 6:00 PM) for physical inspections, product demonstrations, and direct purchases."
    }
  ];

  const categories = [
    { name: "Auto Maintenance", desc: "Hydraulic 2-post & 4-post car lifts, tire changers, wheel balancers & diagnostic scanners", icon: Wrench },
    { name: "Construction Machinery", desc: "Heavy-duty diesel concrete mixers, plate compactors & tamping rammers", icon: HardHat },
    { name: "Wood Working Machinery", desc: "Precision sliding table saws, thickness planers & edge banding machines", icon: Hammer },
    { name: "Metal Working Machinery", desc: "Industrial metal lathes, hydraulic presses, drill presses & pipe benders", icon: Cpu },
    { name: "Air Compressors & Pumps", desc: "High-pressure piston air compressors, silent oil-free units & industrial pumps", icon: Cable },
    { name: "Generators & Power", desc: "Heavy-duty silent diesel generators & automatic transfer switch (ATS) systems", icon: Zap }
  ];

  const featured = useMemo(() => {
    let list = [...products];
    if (homeSortBy === "price-low") list.sort((a, b) => a.price - b.price);
    else if (homeSortBy === "price-high") list.sort((a, b) => b.price - a.price);
    else if (homeSortBy === "newest") list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    else if (homeSortBy === "name-az") list.sort((a, b) => a.name.localeCompare(b.name));
    return list.slice(0, 8);
  }, [products, homeSortBy]);

  const heroSelectorProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    // Priority order for Hero Showcase Carousel:
    // 1. Two-Post Car Lift
    // 2. Concrete Drum Mixer
    // 3. Multifunction Woodworking Machine
    // 4. 3D Wheel Alignment
    // 5. Heavy Duty Commercial Tire Changer
    const lift = products.find(p => p.name.toLowerCase().includes("two-post") || p.name.toLowerCase().includes("car lift"));
    const drumMixer = products.find(p => p.name.toLowerCase().includes("concrete mixer") || p.name.toLowerCase().includes("drum"));
    const woodMachine = products.find(p => p.name.toLowerCase().includes("woodworking") || p.name.toLowerCase().includes("table saw"));
    const align = products.find(p => p.name.toLowerCase().includes("alignment"));
    const tireChanger = products.find(p => p.name.toLowerCase().includes("tire changer"));

    const selected: typeof products[0][] = [];
    if (lift) selected.push(lift);
    if (drumMixer && !selected.some(s => s.id === drumMixer.id)) selected.push(drumMixer);
    if (woodMachine && !selected.some(s => s.id === woodMachine.id)) selected.push(woodMachine);
    if (align && !selected.some(s => s.id === align.id)) selected.push(align);
    if (tireChanger && !selected.some(s => s.id === tireChanger.id)) selected.push(tireChanger);

    for (const p of products) {
      if (selected.length >= 5) break;
      if (!selected.some(s => s.id === p.id)) {
        selected.push(p);
      }
    }
    return selected;
  }, [products]);

  const [selectedHeroIndex, setSelectedHeroIndex] = useState(0);
  const [isHeroAutoPlay, setIsHeroAutoPlay] = useState(true);

  useEffect(() => {
    if (!isHeroAutoPlay || heroSelectorProducts.length <= 1) return;
    const interval = setInterval(() => {
      setSelectedHeroIndex(prev => (prev + 1) % heroSelectorProducts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isHeroAutoPlay, heroSelectorProducts.length]);

  const handlePrevHero = () => {
    setSelectedHeroIndex(prev => (prev - 1 + heroSelectorProducts.length) % heroSelectorProducts.length);
  };

  const handleNextHero = () => {
    setSelectedHeroIndex(prev => (prev + 1) % heroSelectorProducts.length);
  };

  const activeHeroProduct = heroSelectorProducts[selectedHeroIndex] || products[0];

  return (
    <div id="home-view-container" className="animate-fadeIn space-y-12 pb-16">
      {/* 1. Hero Section - Styled with Showcase Carousel and One-by-One Machine Selector */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="relative overflow-hidden rounded-3xl sm:rounded-[36px] min-h-[520px] lg:min-h-[580px] p-6 sm:p-10 lg:p-14 shadow-2xl flex flex-col justify-between bg-gradient-to-r from-[#1B60BC] via-[#2F7BEA] to-[#7EA9EE] dark:from-[#0B1E38] dark:via-[#13305A] dark:to-[#1B427A] border border-blue-400/20"
      >
        {/* Giant Angled Brand Watermark */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none flex items-center justify-center">
          <span className="text-white/10 dark:text-white/5 font-black text-[100px] sm:text-[160px] md:text-[210px] lg:text-[270px] tracking-widest uppercase transform -rotate-12 translate-y-6 font-sans leading-none whitespace-nowrap">
            HAOSAIL
          </span>
        </div>

        {/* Ambient subtle light spheres */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top & Middle Grid: Copy on Left, Floating Machinery Carousel on Right */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto">
          {/* Left Column: Heading, Subtext, and Rounded Pill CTA */}
          <div className="lg:col-span-6 space-y-5 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-mono font-medium">
              <span>OFFICIAL KENYA MACHINERY SHOWROOM</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.08] max-w-lg drop-shadow-sm font-sans">
              Are you ready to lead the way
            </h1>

            <p className="text-blue-100/90 text-xs sm:text-sm md:text-base leading-relaxed max-w-md font-normal">
              Heavy-duty industrial machinery engineered for Kenya. Certified hydraulic car lifts, diesel concrete mixers, precision table saws, and high-output generators with 12-month factory warranty and fast nationwide freight delivery.
            </p>

            <div className="pt-2 flex items-center gap-4 flex-wrap">
              <button
                id="hero-shop-now-cta"
                onClick={() => {
                  setActiveView("shop");
                }}
                className="inline-flex items-center gap-2 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full bg-[#D7EEF7] hover:bg-white text-[#0A3D62] hover:text-[#0055B8] font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md hover:shadow-xl active:scale-95 cursor-pointer group"
              >
                <span>SHOP NOW</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => {
                  if (activeHeroProduct) {
                    setSelectedProductId(activeHeroProduct.id);
                    recordProductView(activeHeroProduct);
                    setActiveView("product-details");
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>View Specs</span>
              </button>
            </div>
          </div>

          {/* Right Column: Hero Product Carousel with Prev/Next Controls and Floating Drop Shadow */}
          <div 
            className="lg:col-span-6 flex flex-col items-center justify-center relative py-4 sm:py-8"
            onMouseEnter={() => setIsHeroAutoPlay(false)}
            onMouseLeave={() => setIsHeroAutoPlay(true)}
          >
            {/* Carousel Navigation Arrow - Left */}
            <button
              onClick={handlePrevHero}
              className="absolute left-0 sm:-left-3 z-20 p-2.5 sm:p-3 rounded-full bg-white/20 hover:bg-white text-white hover:text-[#0055B8] backdrop-blur-md border border-white/30 transition-all shadow-lg cursor-pointer active:scale-90"
              title="Previous Machine"
              aria-label="Previous Machine"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Carousel Navigation Arrow - Right */}
            <button
              onClick={handleNextHero}
              className="absolute right-0 sm:-right-3 z-20 p-2.5 sm:p-3 rounded-full bg-white/20 hover:bg-white text-white hover:text-[#0055B8] backdrop-blur-md border border-white/30 transition-all shadow-lg cursor-pointer active:scale-90"
              title="Next Machine"
              aria-label="Next Machine"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Floating Machinery Display */}
            <AnimatePresence mode="wait">
              {activeHeroProduct && (
                <motion.div
                  key={activeHeroProduct.id}
                  initial={{ opacity: 0, scale: 0.88, rotate: -20, y: 20 }}
                  animate={{ opacity: 1, scale: 1, rotate: -12, y: 0 }}
                  exit={{ opacity: 0, scale: 0.88, rotate: -5, y: -20 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="relative group cursor-pointer flex flex-col items-center"
                  onClick={() => {
                    setSelectedProductId(activeHeroProduct.id);
                    recordProductView(activeHeroProduct);
                    setActiveView("product-details");
                  }}
                  title={`Inspect ${activeHeroProduct.name}`}
                >
                  {/* Soft realistic floating shadow underneath */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-4/5 h-8 bg-black/25 dark:bg-black/50 blur-xl rounded-full transform scale-y-50 pointer-events-none" />
                  
                  <img
                    src={activeHeroProduct.image}
                    alt={activeHeroProduct.name}
                    className="w-72 sm:w-88 md:w-[420px] lg:w-[460px] h-60 sm:h-72 md:h-80 lg:h-[340px] object-contain filter drop-shadow-[0_25px_35px_rgba(0,0,0,0.35)] transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Carousel Slide Indicators & Active Tag */}
            <div className="mt-4 flex flex-col items-center gap-2 z-10">
              <div className="flex items-center gap-1.5">
                {heroSelectorProducts.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedHeroIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      selectedHeroIndex === idx 
                        ? "w-8 bg-white" 
                        : "w-2 bg-white/40 hover:bg-white/70"
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
              <span className="text-white/80 text-[11px] font-mono tracking-wider">
                {activeHeroProduct?.category} • KES {activeHeroProduct?.price.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Selector Strip: One-by-One Machine Carousel (matching user request: "on the select machnine make it one buy one like carrusel moving one by one") */}
        <div className="relative z-10 pt-5 sm:pt-6 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-white/90 text-xs font-mono">
            <span className="tracking-wide uppercase font-semibold">SELECT MACHINE</span>
            <span className="px-2 py-0.5 rounded-full bg-white/15 text-white text-[10px]">
              {selectedHeroIndex + 1} / {heroSelectorProducts.length}
            </span>
          </div>

          {/* One-by-One Machine Selection Carousel Controls & Active Card */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto max-w-md">
            <button
              onClick={handlePrevHero}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white text-white hover:text-[#0055B8] backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-xs"
              title="Previous Machine"
              aria-label="Previous Machine"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Single Active Card Moving One-By-One */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                {activeHeroProduct && (
                  <motion.div
                    key={activeHeroProduct.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="bg-white text-slate-900 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-3 shadow-xl ring-2 ring-white/60"
                  >
                    <div 
                      className="flex items-center gap-3 min-w-0 cursor-pointer"
                      onClick={() => {
                        setSelectedProductId(activeHeroProduct.id);
                        recordProductView(activeHeroProduct);
                        setActiveView("product-details");
                      }}
                    >
                      <img
                        src={activeHeroProduct.image}
                        alt={activeHeroProduct.name}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-contain bg-slate-50 p-1 shrink-0 border border-slate-100"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono font-bold text-[#0055B8] uppercase tracking-wider bg-blue-50 px-1.5 py-0.2 rounded">
                            {activeHeroProduct.category.split(" ")[0]}
                          </span>
                          <span className="text-[9px] text-emerald-600 font-semibold">In Stock</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 truncate max-w-[150px] sm:max-w-[200px] mt-0.5">
                          {activeHeroProduct.name}
                        </h4>
                        <p className="text-xs font-extrabold text-[#0055B8] font-mono">
                          KES {activeHeroProduct.price.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(activeHeroProduct);
                        }}
                        className="h-8 px-3 rounded-full bg-slate-900 hover:bg-[#0055B8] text-white flex items-center gap-1 font-bold text-xs shadow-xs transition-colors cursor-pointer active:scale-90"
                        title={`Add ${activeHeroProduct.name} to Quotation`}
                        aria-label={`Add ${activeHeroProduct.name} to cart`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Add</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={handleNextHero}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white text-white hover:text-[#0055B8] backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-xs"
              title="Next Machine"
              aria-label="Next Machine"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.section>

      {/* 2. Promotional Warehouse Flash Campaigns (If Active) */}
      {promoProducts.length > 0 && (
        <section className="relative overflow-hidden" id="motion-promotions-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5">
              <h2 className="font-sans font-bold text-xl sm:text-2xl tracking-tight text-slate-900">
                Special Warehouse Campaigns
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-mono">
                {activePromoIndex + 1} of {promoProducts.length} deals
              </span>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => setActivePromoIndex(prev => (prev - 1 + promoProducts.length) % promoProducts.length)}
                  className="p-2 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#0055B8] transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Previous Offer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setActivePromoIndex(prev => (prev + 1) % promoProducts.length)}
                  className="p-2 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#0055B8] transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Next Offer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 lg:p-10 relative shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            <AnimatePresence mode="wait">
              {promoProducts.map((product, idx) => {
                if (idx !== activePromoIndex) return null;
                const textInfo = getPromoText(idx, product);
                const promoPrice = product.flashPrice || product.price;
                const originalPrice = product.price;
                const discountPercent = originalPrice > 0 ? Math.round((1 - promoPrice / originalPrice) * 100) : 0;
                
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
                  >
                    <div className="md:col-span-7 space-y-4 text-left">
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="font-mono text-xs font-semibold text-[#0055B8] bg-blue-50/80 border border-blue-200/60 px-3 py-1 rounded-full uppercase flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          {textInfo.badge}
                        </span>
                        {discountPercent > 0 && (
                          <span className="font-mono text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                            SAVE {discountPercent}% PROMOTION
                          </span>
                        )}
                      </div>

                      <h3 className="font-sans font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                        {textInfo.title}
                      </h3>
                      
                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-xl">
                        {textInfo.tagline}
                      </p>

                      <div className="flex flex-wrap items-center gap-6 pt-1">
                        <div>
                          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block font-bold">PROMO PRICE</span>
                          <div className="flex items-baseline gap-2.5">
                            <span className="text-2xl sm:text-3xl font-extrabold text-[#0055B8] font-mono">
                              {formatKES(promoPrice)}
                            </span>
                            {discountPercent > 0 && (
                              <span className="text-sm text-slate-400 line-through font-mono">
                                {formatKES(originalPrice)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50/80 border border-emerald-200/80 px-3 py-1.5 rounded-full font-mono font-medium">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{product.stock} units ready in Nairobi</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2">
                        <button
                          onClick={() => {
                            setSelectedProductId(product.id);
                            setActiveView("product-details");
                            window.scrollTo(0, 0);
                          }}
                          className="bg-[#0055B8] hover:bg-[#004494] text-white font-medium text-xs px-5 py-3 rounded-full shadow-xs cursor-pointer transition-all flex items-center gap-2 min-h-[44px] active:scale-95"
                        >
                          <span>View Full Technical Specs</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-medium text-xs px-5 py-3 rounded-full transition-all cursor-pointer shadow-2xs min-h-[44px] active:scale-95"
                        >
                          Add to Equipment Order
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-5 flex justify-center md:justify-end">
                      <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4 max-w-[280px] w-full text-center">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-48 object-cover rounded-xl bg-white border border-slate-200/60"
                          referrerPolicy="no-referrer"
                        />
                        <div className="mt-3 flex justify-between items-center text-[10px] font-mono text-slate-400 font-semibold">
                          <span>HAOSAIL CERTIFIED</span>
                          <span className="text-[#0055B8]">100% FACTORY NEW</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* 3. Browse Machinery Categories Grid */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={sectionVariants}
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Industrial Machinery Categories
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              Select an equipment category to filter machines in our showroom and warehouse.
            </p>
          </div>
          <button 
            onClick={() => setActiveView("shop")} 
            className="text-xs sm:text-sm font-semibold text-[#0055B8] hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>View All Machinery</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            const count = products.filter(p => p.category.toLowerCase().includes(cat.name.toLowerCase().split(" ")[0])).length || 5;

            return (
              <div
                key={i}
                onClick={() => {
                  setSearchQuery(cat.name);
                  setActiveView("shop");
                }}
                className="bg-white border border-slate-200/80 hover:border-[#0055B8]/60 p-5 rounded-2xl cursor-pointer transition-all hover:shadow-xs group shadow-2xs"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-50 text-[#0055B8] border border-slate-200/80 flex items-center justify-center shrink-0 group-hover:bg-[#0055B8] group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0055B8] transition-colors truncate">
                        {cat.name}
                      </h3>
                      <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                        {count} Models
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* 4. Featured Machinery Inventory Grid */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={sectionVariants}
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 border-b border-slate-200/80 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Featured Machinery Inventory
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              Top quality heavy equipment ready for immediate delivery in Kenya.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 font-medium">Sort:</span>
            <select
              value={homeSortBy}
              onChange={(e) => setHomeSortBy(e.target.value)}
              className="bg-white border border-slate-200 text-slate-800 text-xs font-medium px-3 py-2 rounded-full focus:border-[#0055B8] focus:outline-none shadow-2xs"
            >
              <option value="featured">Featured Picks</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">New Arrivals</option>
              <option value="name-az">Model Name A-Z</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featured.map((p) => {
            const isSaved = wishlist.includes(p.id);

            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200/80 hover:border-[#0055B8]/60 rounded-2xl p-4 flex flex-col justify-between transition-all hover:shadow-xs group shadow-2xs"
              >
                <div>
                  <div className="relative overflow-hidden rounded-xl bg-slate-50 aspect-4/3 mb-3 border border-slate-100 cursor-pointer"
                    onClick={() => {
                      setSelectedProductId(p.id);
                      recordProductView(p);
                      setActiveView("product-details");
                    }}
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(p.id);
                      }}
                      className={`absolute top-2 right-2 p-1.5 rounded-full border transition-all cursor-pointer shadow-2xs ${
                        isSaved 
                          ? "bg-red-50 border-red-200 text-red-600" 
                          : "bg-white/90 border-slate-200/80 text-slate-400 hover:text-slate-700"
                      }`}
                      title="Save to Wishlist"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-red-500" : ""}`} />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-slate-900/90 text-white text-[9px] font-mono font-medium px-2 py-0.5 rounded-full shadow-2xs">
                      {p.brand}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono uppercase font-semibold text-[#0055B8] block truncate">
                    {p.category}
                  </span>

                  <h3
                    onClick={() => {
                      setSelectedProductId(p.id);
                      recordProductView(p);
                      setActiveView("product-details");
                    }}
                    className="font-sans font-semibold text-xs sm:text-sm text-slate-900 mt-1 cursor-pointer hover:text-[#0055B8] transition-colors line-clamp-2 leading-snug"
                  >
                    {p.name}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[9px] text-slate-400 font-mono block">PRICE</span>
                      <span className="font-mono font-bold text-[#0055B8] text-sm">
                        KES {p.price.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedProductId(p.id);
                          recordProductView(p);
                          setActiveView("product-details");
                        }}
                        className="bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-medium text-xs px-3 py-2 rounded-full transition-all cursor-pointer min-h-[38px] active:scale-95"
                        title="View Specs"
                      >
                        Specs
                      </button>
                      <button
                        onClick={() => {
                          recordProductView(p);
                          addToCart(p, 1);
                        }}
                        className="bg-[#0055B8] hover:bg-[#004494] text-white font-medium text-xs px-3.5 py-2 rounded-full transition-all cursor-pointer shadow-2xs flex items-center gap-1 min-h-[38px] active:scale-95"
                      >
                        <span>Order</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* 4. Customer Testimonials & Verified Contractors */}
      <CustomerTestimonials />

      {/* 7. Comprehensive Machinery FAQ & Trust Verification */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={sectionVariants}
        className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.03)]"
      >
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-mono font-semibold uppercase text-[#0055B8] tracking-widest block mb-1">
            FAQ &amp; SUPPORT
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-2">
            Everything you need to know about purchasing, warranty, M-Pesa payments, and nationwide delivery.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqData.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white transition-all shadow-2xs"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full text-left p-4 sm:p-5 font-sans font-semibold text-slate-900 flex justify-between items-center gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors text-sm"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#0055B8] shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Reassurance Banner */}
        <div className="mt-10 p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Need Technical Assistance or Machinery Demo?</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Our machinery engineers are available Monday to Saturday 8:00 AM – 6:00 PM along Waiyaki Way Nairobi.
              </p>
            </div>
          </div>
          <a
            href="tel:+254750707038"
            className="bg-[#0055B8] hover:bg-[#004494] text-white text-xs font-medium px-5 py-3 rounded-full shadow-2xs transition-all flex items-center gap-2 shrink-0 min-h-[44px] active:scale-95"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call +254 750 707038</span>
          </a>
        </div>
      </motion.section>
    </div>
  );
}
