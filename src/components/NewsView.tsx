/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { 
  Newspaper, 
  Clock, 
  Share2, 
  Bookmark, 
  ArrowRight, 
  Truck, 
  Wrench, 
  Sparkles, 
  RefreshCw, 
  Search, 
  X, 
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Award,
  GitCompare,
  TrendingUp,
  Zap,
  Info,
  CheckCircle2
} from "lucide-react";
import { useStore } from "../StoreContext";
import { motion, AnimatePresence } from "motion/react";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl?: string;
  date: string;
  readTime: string;
  category: string;
  isFeatured?: boolean;
}

const FIXED_ARTICLES: Article[] = [
  {
    id: "art-1",
    title: "Guide: Choosing Between a 2-Post and 4-Post Car Lift for Kenyan Garages",
    excerpt: "Comprehensive comparison of 4-ton hydraulic two-post clear-floor lifts versus four-post alignment lifts for Nairobi auto repair workshops.",
    content: `When equipping a commercial automotive repair garage or service center in Kenya, choosing the correct vehicle lift is one of the most critical long-term capital investments.

1. Haosail 4.0T 2-Post Clear-Floor Lift:
The 2-post clear-floor configuration provides unobstructed undercarriage access. Mechanics can effortlessly work on transmissions, exhaust pipes, suspension control arms, and differentials. With dual hydraulic cylinders, synchronized steel cables, and automatic arm restraints, this model handles saloon cars, station wagons, and heavy SUVs (such as Land Cruisers and Prados). It requires a concrete floor slab with a minimum compressive strength of 3,000 PSI and a 150mm depth.

2. Haosail 5.0T 4-Post Wheel Alignment Lift:
The 4-post lift is the industry benchmark for commercial wheel alignment bays, heavy fleet maintenance, and transmission drops. Vehicles drive directly onto the reinforced steel runways, eliminating arm placement time. Integrated secondary air-jack beams allow technicians to lift wheels off the platform for brake and suspension inspections.

Technical Recommendation:
For general maintenance workshops, start with a 4.0-ton 2-post lift. For dedicated tire centres and alignment bays, a 5.0-ton 4-post lift delivers superior turnaround speed and safety. All units supplied by Haosail Kenya at our Nairobi Lokitaung Road depot include full installation and calibration services.`,
    imageUrl: "https://images.unsplash.com/photo-1613214149922-f1809c99b414?auto=format&fit=crop&q=80&w=800",
    date: "March 2026",
    readTime: "5 min read",
    category: "Auto Maintenance",
    isFeatured: true
  },
  {
    id: "art-2",
    title: "Selecting Heavy-Duty Diesel Concrete Mixers for Building Sites in Kenya",
    excerpt: "How 350L and 500L self-loading diesel concrete mixers with air-cooled engines handle off-grid construction in rural counties.",
    content: `Reliable on-site concrete batching is essential for building contractors across Kenya, particularly in areas where electrical grid connections are unstable or unavailable.

Key Features of Haosail Diesel Concrete Mixers:
- Heavy-Duty Cast-Iron Ring Gear: Ensures long operating life even when handling abrasive sand and granite aggregates.
- Air-Cooled 8HP to 12HP Diesel Engines: Engineered to run continuously in hot climatic conditions across Machakos, Kajiado, Nakuru, and coastal regions without overheating.
- Pneumatic Towing Wheels & Rigid Drawbar: Enables rapid site-to-site towing behind standard pickup trucks.
- Dual-Blade Mixing Drum Design: Guarantees uniform batch consistency for foundation footings, reinforced columns, and slab pours.

Maintenance Tip:
Wash the drum interior thoroughly with clean water immediately after every pour. Inspect engine oil levels daily using 15W-40 heavy-duty diesel lubricant to maximize piston and cylinder lifespan.`,
    imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&q=80&w=800",
    date: "March 2026",
    readTime: "4 min read",
    category: "Construction Machinery"
  },
  {
    id: "art-3",
    title: "Woodworking Workshop Setup: Precision Sliding Table Saws and Edge Banders",
    excerpt: "Essential machinery requirements for modern furniture joineries and interior fit-out contractors in Nairobi.",
    content: `Modern furniture manufacturing in Kenya is transitioning from manual circular saws to industrial sliding table panel saws and automatic curved-edge edge banders to achieve flawless chipboard and MDF cutting.

Advantages of Precision Sliding Table Saws:
1. Scoring Blade Mechanism: A high-RPM secondary scoring blade pre-cuts the bottom laminate before the main blade cuts through, eliminating chipped melamine edges.
2. Heavy Aluminum Sliding Carriage: Multi-chamber extruded aluminum carriages glide effortlessly on hardened chrome steel guide rails, ensuring straight cuts over 3,200mm sheet panels.
3. Digital Tilt & Height Display: Fast angle adjustments for 45-degree miter joints used in luxury cabinetry and acoustic panels.

Visit Haosail Kenya's showroom on Lokitaung Road in Nairobi Industrial Area to test-cut your own board samples on our live display units.`,
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800",
    date: "February 2026",
    readTime: "4 min read",
    category: "Woodworking"
  },
  {
    id: "art-4",
    title: "Plate Compactors & Tamping Rammers: Soil Sub-Base Compaction Standards",
    excerpt: "Why 90kg plate compactors powered by Honda GX160 engines are the standard for cabro paving and trench foundations.",
    content: `Proper soil and aggregate compaction prevents pavement settlement, cracking, and water pooling beneath interlocking paving blocks (cabro) and foundation slabs.

Comparison of Compactor Types:
- Vibratory Plate Compactors (90kg - 120kg): Best suited for granular soils, ballast, sand, and asphalt patching. Equipped with an integrated water sprinkler tank to prevent hot asphalt from sticking to the ductile iron base plate.
- Tamping Rammers (75kg - 85kg): Ideal for cohesive clays, narrow utility trenches, and post-hole consolidation where high-impact vertical jumping force (13.7 kN) is required.

All compactors distributed by Haosail Machinery Kenya feature genuine commercial engines, sealed oil-bath exciters, and rubberized vibration-isolation handles to minimize operator fatigue.`,
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800",
    date: "February 2026",
    readTime: "3 min read",
    category: "Construction Machinery"
  }
];

const DAILY_ARTICLES: Record<number, Article> = {
  0: {
    id: "dyn-0",
    title: "Sunday Digest: Routine Preventive Maintenance for Hydraulic 2-Post Auto Lifts",
    excerpt: "Weekly safety inspection checklist for auto repair garage owners: hydraulic fluid viscosity, steel cable tension, and safety lock engagement.",
    content: "Routine preventive maintenance is essential for auto garage safety. Daily checks should include inspecting hydraulic hose fittings for micro-leaks, verifying arm restraint teeth mesh properly, and lubricating carriage slide blocks with white lithium grease.",
    imageUrl: "https://images.unsplash.com/photo-1613214149922-f1809c99b414?auto=format&fit=crop&q=80&w=800",
    date: "Today's Bulletin",
    readTime: "3 min read",
    category: "Auto Maintenance"
  },
  1: {
    id: "dyn-1",
    title: "Monday Industry Brief: Heavy Tyre Changers and 3D Dynamic Wheel Balancers",
    excerpt: "How semi-automatic tire changers with helper assist arms protect alloy rims during run-flat tyre mounting.",
    content: "Modern SUVs and light commercial trucks in Kenya frequently feature low-profile run-flat tires with stiff sidewalls. Using a tire changer equipped with dual pneumatic helper arms prevents costly bead damage and rim scratches while cutting wheel turnaround time to under 4 minutes.",
    imageUrl: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800",
    date: "Today's Bulletin",
    readTime: "4 min read",
    category: "Auto Maintenance"
  },
  2: {
    id: "dyn-2",
    title: "Tuesday Technical: Rebar Benders and Straighteners on Kenyan Commercial Sites",
    excerpt: "High-volume steel reinforcement cutting and bending up to 32mm high-tensile TMT bars.",
    content: "On multi-storey construction projects in Nairobi and Mombasa, manual bar bending causes severe labor bottlenecks. Automatic rebar bending machines with digital angle presets allow operators to bend stirrups and structural column ties accurately in seconds.",
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800",
    date: "Today's Bulletin",
    readTime: "3 min read",
    category: "Construction Machinery"
  },
  3: {
    id: "dyn-3",
    title: "Wednesday Metalcraft: Fiber Laser Cutting Machines vs Plasma Cutters for Fabricators",
    excerpt: "Analyzing cutting speed, sheet metal edge finish, and gas consumption costs for steel fabrication workshops.",
    content: "Fiber laser cutters offer exceptional edge squareness and minimal heat-affected zones on stainless steel, carbon steel, and aluminum sheets up to 20mm. In contrast, heavy-duty CNC plasma cutters remain the cost-effective choice for thick structural I-beam and plate processing.",
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800",
    date: "Today's Bulletin",
    readTime: "4 min read",
    category: "Metal Working"
  },
  4: {
    id: "dyn-4",
    title: "Thursday Site Log: Vibratory Concrete Poker Screeds for Warehouse Floor Slabs",
    excerpt: "Eliminating air pockets and achieving laser-flat industrial warehouse floors with truss screeds and power trowels.",
    content: "High-traffic industrial logistics warehouses require ultra-dense concrete surfaces. Walk-behind and ride-on power trowels with combination blades provide the polished hard-wearing finish required for heavy forklift operation.",
    imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&q=80&w=800",
    date: "Today's Bulletin",
    readTime: "4 min read",
    category: "Construction Machinery"
  },
  5: {
    id: "dyn-5",
    title: "Friday Power: Silent Diesel Generator Load Sizing for Industrial Factories in Nairobi",
    excerpt: "How 50kVA to 150kVA canopy generators prevent production downtime in manufacturing plants during grid drops.",
    content: "Industrial machinery requires clean, regulated power output. Haosail canopy silent diesel generators come equipped with digital AVR voltage control and copper alternator windings designed to handle heavy motor starting currents smoothly.",
    imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800",
    date: "Today's Bulletin",
    readTime: "4 min read",
    category: "Generators"
  },
  6: {
    id: "dyn-6",
    title: "Saturday Specs: Rotary Screw Air Compressor vs Piston Compressor for Spray Booths",
    excerpt: "Analyzing why continuous spray painting and pneumatic tool operation requires 10 Bar rotary screw compressed air systems.",
    content: "Piston compressors operate on duty cycles, whereas rotary screw compressors deliver uninterrupted 100% continuous airflow with integrated refrigerated air dryers to eliminate moisture from paint lines. Visit Haosail Kenya on Lokitaung Road for expert compressor sizing.",
    imageUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&q=80&w=800",
    date: "Today's Bulletin",
    readTime: "3 min read",
    category: "Air Compressors"
  }
};

const CAR_LIFT_COMPARISONS = [
  {
    name: "Haosail 4.0T 2-Post Clear-Floor Lift (Garage Choice)",
    capacity: "4,000 kg",
    capacityPercent: 80,
    motor: "380V / 220V 2.2kW Hydraulic",
    locks: "Dual Electromagnetic Locks (99% Safety Score)",
    clearance: "Full 1,900mm Clearance",
    price: "KES 285,000",
    idealFor: "Commercial Auto Garages, SUV Engine & Gearbox Swaps"
  },
  {
    name: "Haosail 4.0T 2-Post Base-Plate Lift (Low Ceiling Bay)",
    capacity: "4,000 kg",
    capacityPercent: 80,
    motor: "220V Single Phase 2.2kW",
    locks: "Mechanical Safety Locks (95% Safety Score)",
    clearance: "1,800mm Clearance",
    price: "KES 245,000",
    idealFor: "SME Repair Shops with Under 3.8m Ceiling Clearance"
  },
  {
    name: "Haosail 5.0T 4-Post Wheel Alignment Lift (Heavy Duty)",
    capacity: "5,000 kg",
    capacityPercent: 100,
    motor: "380V 3.0kW Heavy Duty Hydraulics",
    locks: "Integrated Jacking Beams (98% Safety Score)",
    clearance: "3D Wheel Alignment Ready",
    price: "KES 520,000",
    idealFor: "Commercial Bus & Truck Fleets, Precision 3D Alignment"
  }
];

const MIXER_COMPARISONS = [
  {
    name: "Haosail 350L Diesel Concrete Mixer (Contractor Titan)",
    capacity: "350 Liters Batch",
    capacityPercent: 95,
    engine: "Air-cooled 8HP Diesel Engine",
    chassis: "Heavy Duty Cast-Iron Ring Gear",
    price: "KES 195,000",
    idealFor: "High-Volume Building Contractors & Road Construction"
  },
  {
    name: "Haosail 200L Electric Concrete Mixer (Site Portable)",
    capacity: "200 Liters Batch",
    capacityPercent: 65,
    engine: "220V 1.5kW Electric Motor",
    chassis: "Pneumatic Towing Wheels",
    price: "KES 115,000",
    idealFor: "Residential Paving, Plaster Mortar, Small Slabs"
  },
  {
    name: "Haosail 90kg Plate Compactor (Honda GX160)",
    capacity: "15.0 kN Compaction Force",
    capacityPercent: 85,
    engine: "Genuine Honda GX160 5.5HP",
    chassis: "Built-in Water Tank for Asphalt",
    price: "KES 95,000",
    idealFor: "Trench Compaction, Cabro Paving Sub-base Preparation"
  }
];

export default function NewsView() {
  const { setActiveView, addCustomNotification } = useStore();
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [comparisonTab, setComparisonTab] = useState<"lifts" | "mixers">("lifts");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshingWire, setIsRefreshingWire] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<"bulletins" | "compare">("bulletins");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const [savedArticleIds, setSavedArticleIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("tgk_saved_news");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [liveArticles, setLiveArticles] = useState<Article[]>([]);
  const [loadingNews, setLoadingNews] = useState<boolean>(false);

  const fetchLiveNews = async (showToast: boolean = false) => {
    setLoadingNews(true);
    try {
      const res = await fetch("/api/news/live");
      const data = await res.json();
      if (data && data.success && Array.isArray(data.articles)) {
        setLiveArticles(data.articles);
        if (showToast) {
          triggerToast("Live Kenyan machinery publications synchronized successfully!");
        }
      }
    } catch (err) {
      console.warn("Failed to load live news feed:", err);
    } finally {
      setLoadingNews(false);
    }
  };

  useEffect(() => {
    fetchLiveNews();

    const targetArticleId = localStorage.getItem("tgk_selected_article_id");
    if (targetArticleId) {
      setExpandedArticle(targetArticleId);
      localStorage.removeItem("tgk_selected_article_id");
      window.scrollTo({ top: 100, behavior: "smooth" });
    }
  }, []);

  const toggleSaveArticle = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated: string[] = [];
    setSavedArticleIds((prev) => {
      const isSaved = prev.includes(id);
      updated = isSaved ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("tgk_saved_news", JSON.stringify(updated));
      return updated;
    });

    const isCurrentlySaved = savedArticleIds.includes(id);
    const status = isCurrentlySaved ? "Removed from bookmarks" : "Saved to bookmarks";
    triggerToast(status);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/#news/${id}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        triggerToast("Article link copied to clipboard!");
        if (addCustomNotification) {
          addCustomNotification(`Article Link Copied: Reference ID ${id.toUpperCase()}`, id);
        }
      })
      .catch(() => {
        triggerToast("Could not copy link to clipboard.");
      });
  };

  const todayDateObj = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long", year: "numeric" }).format(todayDateObj);
  }, [todayDateObj]);

  const dailyArticle = useMemo(() => {
    const dayOfWeek = todayDateObj.getDay();
    return DAILY_ARTICLES[dayOfWeek];
  }, [todayDateObj]);

  const allArticles = useMemo(() => {
    const list = [...FIXED_ARTICLES];
    if (liveArticles.length > 0) {
      const map = new Map<string, Article>();
      liveArticles.forEach((a) => map.set(a.id, a));
      list.forEach((a) => {
        if (!map.has(a.id)) {
          map.set(a.id, a);
        }
      });
      return Array.from(map.values());
    }

    if (dailyArticle && !list.some((x) => x.id === dailyArticle.id)) {
      list.push(dailyArticle);
    }
    return list;
  }, [liveArticles, dailyArticle]);

  const handleRefreshWire = () => {
    setIsRefreshingWire(true);
    fetchLiveNews(false).then(() => {
      setIsRefreshingWire(false);
      triggerToast("News feed refreshed with Nairobi depot bulletins!");
    }).catch(() => {
      setIsRefreshingWire(false);
    });
  };

  const tags = ["All", "Auto Maintenance", "Construction Machinery", "Woodworking", "Metal Working", "Saved Bulletins"];

  const filteredArticles = useMemo(() => {
    let result = allArticles;

    if (selectedTag === "Saved Bulletins") {
      result = allArticles.filter((art) => savedArticleIds.includes(art.id));
    } else if (selectedTag !== "All") {
      result = allArticles.filter((art) => art.category === selectedTag);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((art) => 
        art.title.toLowerCase().includes(q) || 
        art.excerpt.toLowerCase().includes(q) || 
        art.content.toLowerCase().includes(q) ||
        art.category.toLowerCase().includes(q)
      );
    }

    return result;
  }, [selectedTag, savedArticleIds, searchQuery, allArticles]);

  const activeArticleObj = useMemo(() => {
    if (!expandedArticle) return null;
    return allArticles.find((a) => a.id === expandedArticle) || null;
  }, [expandedArticle, allArticles]);

  return (
    <div className="space-y-8 pb-16 font-sans text-slate-900 text-left max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-sans font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-2xl z-50 flex items-center gap-2 border border-slate-700"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="bg-blue-50 border border-blue-200 text-[#0066CC] font-mono text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <Newspaper className="w-3.5 h-3.5" />
                <span>Haosail Machinery News</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                <Calendar className="w-3 h-3 text-[#0066CC]" />
                <span>{todayStr}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Machinery Bulletins &amp; Technical Buying Guides
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Clear technical insights for Kenyan workshop owners, building contractors, and garage managers. Stay informed on car lift specs, concrete mixer maintenance, and Nairobi depot stock.
            </p>
          </div>

          {/* Search & Refresh Actions */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 focus-within:border-[#0066CC] focus-within:bg-white transition-all w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guides & bulletins..."
                className="bg-transparent border-0 font-sans text-xs text-slate-800 focus:outline-hidden w-full placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer ml-1 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={handleRefreshWire}
              disabled={isRefreshingWire}
              className="h-10 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#0066CC] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 shadow-2xs shrink-0"
              title="Refresh news bulletins"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingWire ? "animate-spin" : ""}`} />
              <span>{isRefreshingWire ? "Syncing..." : "Sync News"}</span>
            </button>
          </div>
        </div>

        {/* Segment Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => {
                setActiveSegment("bulletins");
                setExpandedArticle(null);
              }}
              className={`py-2 px-4 rounded-lg text-xs font-bold tracking-wide transition-all flex items-center gap-2 cursor-pointer ${
                activeSegment === "bulletins"
                  ? "bg-white text-[#0066CC] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>Technical Bulletins</span>
            </button>
            <button
              onClick={() => {
                setActiveSegment("compare");
                setExpandedArticle(null);
              }}
              className={`py-2 px-4 rounded-lg text-xs font-bold tracking-wide transition-all flex items-center gap-2 cursor-pointer ${
                activeSegment === "compare"
                  ? "bg-white text-[#0066CC] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Equipment Comparison Guides</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          {activeSegment === "bulletins" && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTag(tag);
                    setExpandedArticle(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer whitespace-nowrap ${
                    selectedTag === tag
                      ? "bg-[#0066CC] text-white border-[#0066CC] shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {tag}
                  {tag === "Saved Bulletins" && savedArticleIds.length > 0 && (
                    <span className="ml-1.5 bg-white/20 text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full">
                      {savedArticleIds.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Article Modal / Reader View */}
      {expandedArticle && activeArticleObj ? (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 max-w-4xl mx-auto space-y-6 shadow-md"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <button
              onClick={() => setExpandedArticle(null)}
              className="text-[#0066CC] hover:text-[#004494] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Back to Articles</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => toggleSaveArticle(activeArticleObj.id, e)}
                className={`text-xs font-bold py-1.5 px-3 rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${
                  savedArticleIds.includes(activeArticleObj.id)
                    ? "bg-blue-50 border-blue-200 text-[#0066CC]"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${savedArticleIds.includes(activeArticleObj.id) ? "fill-current text-[#0066CC]" : ""}`} />
                <span>{savedArticleIds.includes(activeArticleObj.id) ? "Saved" : "Save"}</span>
              </button>

              <button
                onClick={(e) => handleCopyLink(activeArticleObj.id, e)}
                className="text-xs font-bold py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {activeArticleObj.imageUrl && !imageErrors[activeArticleObj.id] && (
            <div className="w-full h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={activeArticleObj.imageUrl}
                alt={activeArticleObj.title}
                onError={() => setImageErrors((prev) => ({ ...prev, [activeArticleObj.id]: true }))}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-500">
              <span className="bg-blue-50 text-[#0066CC] border border-blue-200 font-bold px-2.5 py-0.5 rounded-md uppercase">
                {activeArticleObj.category}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {activeArticleObj.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {activeArticleObj.readTime}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {activeArticleObj.title}
            </h2>

            <div className="bg-blue-50/60 border-l-4 border-[#0066CC] p-4 rounded-r-xl text-slate-800 text-sm italic font-medium leading-relaxed">
              "{activeArticleObj.excerpt}"
            </div>

            <div className="text-slate-700 text-sm sm:text-base leading-relaxed space-y-4 pt-2 whitespace-pre-line">
              <p>{activeArticleObj.content}</p>
            </div>

            {/* Technical Highlights Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2 mt-6">
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                <Info className="w-4 h-4 text-[#0066CC]" />
                <span>Haosail Kenya Technical Support &amp; Depot Inquiries</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                For detailed machine specifications, site inspections, or live demonstrations, visit our Nairobi Industrial Area depot on Lokitaung Road or contact our engineering support desk directly.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
            <span className="text-[11px] font-mono text-slate-500">
              Reference Code: {activeArticleObj.id.toUpperCase()} • Haosail Machinery Kenya
            </span>

            <button
              onClick={() => {
                setExpandedArticle(null);
                setActiveView("shop");
              }}
              className="bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Explore Equipment In Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      ) : activeSegment === "compare" ? (
        /* Comparison Guides Tab */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Comparator Area */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 text-[#0066CC] mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Technical Benchmarks</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Machinery Specification Comparison
                  </h2>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                  <button
                    onClick={() => setComparisonTab("lifts")}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      comparisonTab === "lifts"
                        ? "bg-white text-[#0066CC] shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Auto Vehicle Lifts
                  </button>
                  <button
                    onClick={() => setComparisonTab("mixers")}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      comparisonTab === "mixers"
                        ? "bg-white text-[#0066CC] shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Mixers &amp; Compactors
                  </button>
                </div>
              </div>

              {/* Comparison Cards */}
              <div className="space-y-4">
                {comparisonTab === "lifts" ? (
                  CAR_LIFT_COMPARISONS.map((lift, idx) => (
                    <div 
                      key={idx} 
                      className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 hover:border-[#0066CC]/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h3 className="font-bold text-sm text-slate-900">{lift.name}</h3>
                        <span className="font-mono font-bold text-sm text-[#0066CC] bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          {lift.price}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono text-slate-600">
                          <span>Lifting Capacity</span>
                          <span className="font-bold text-slate-900">{lift.capacity}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#0066CC] rounded-full" style={{ width: `${lift.capacityPercent}%` }} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-xs">
                        <div>
                          <span className="text-slate-500 block">Motor &amp; Voltage:</span>
                          <span className="font-semibold text-slate-800">{lift.motor}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Safety Mechanism:</span>
                          <span className="font-semibold text-slate-800">{lift.locks}</span>
                        </div>
                      </div>

                      <div className="pt-2 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                        <span className="font-bold text-[#0066CC] mr-1">Recommended Application:</span>
                        <span>{lift.idealFor}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  MIXER_COMPARISONS.map((mixer, idx) => (
                    <div 
                      key={idx} 
                      className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 hover:border-[#0066CC]/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h3 className="font-bold text-sm text-slate-900">{mixer.name}</h3>
                        <span className="font-mono font-bold text-sm text-[#0066CC] bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          {mixer.price}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono text-slate-600">
                          <span>Batch Capacity / Output</span>
                          <span className="font-bold text-slate-900">{mixer.capacity}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${mixer.capacityPercent}%` }} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-xs">
                        <div>
                          <span className="text-slate-500 block">Engine / Power:</span>
                          <span className="font-semibold text-slate-800">{mixer.engine}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Chassis / Ring Gear:</span>
                          <span className="font-semibold text-slate-800">{mixer.chassis}</span>
                        </div>
                      </div>

                      <div className="pt-2 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                        <span className="font-bold text-[#0066CC] mr-1">Recommended Application:</span>
                        <span>{mixer.idealFor}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Showroom & Depot Info Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="p-2.5 bg-blue-50 text-[#0066CC] rounded-xl w-fit">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Nairobi Machinery Showroom &amp; Depot
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Inspect operational vehicle lifts, concrete mixers, and panel saws in person. Test run cycles and receive hands-on calibration training before order dispatch.
              </p>

              <div className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
                <p className="flex items-start gap-2">
                  <span className="font-bold text-[#0066CC] shrink-0">📍 Depot:</span>
                  <span>Industrial Area, Lokitaung Road (Indaa Business Park), Nairobi</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-[#0066CC] shrink-0">⏰ Hours:</span>
                  <span>Monday – Saturday: 8:00 AM – 6:00 PM</span>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 text-center">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block mb-1">Direct Sales Desk</span>
                <a 
                  href="tel:+254750707038" 
                  className="font-mono font-bold text-lg text-[#0066CC] hover:underline block"
                >
                  +254 750 707038
                </a>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* Bulletins List View */
        <div className="space-y-8">
          
          {/* Daily Spotlight Marquee */}
          {selectedTag === "All" && !searchQuery && dailyArticle && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-blue-50/50 border border-blue-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2 text-[#0066CC]">
                  <Zap className="w-4 h-4" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Today's Featured Bulletin</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                  {dailyArticle.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {dailyArticle.excerpt}
                </p>
              </div>

              <button
                onClick={() => setExpandedArticle(dailyArticle.id)}
                className="bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold text-xs py-3 px-5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 shadow-xs"
              >
                <span>Read Full Bulletin</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}

          {/* Articles Grid */}
          {loadingNews ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 animate-pulse">
                  <div className="h-44 bg-slate-100 rounded-xl w-full" />
                  <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-md w-full" />
                  <div className="h-3 bg-slate-100 rounded-md w-5/6" />
                </div>
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto space-y-3">
              <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-900 text-sm">No Bulletins Matched</h4>
              <p className="text-slate-500 text-xs">
                Try adjusting your search query or selecting a different category filter.
              </p>
              <button
                onClick={() => { setSelectedTag("All"); setSearchQuery(""); }}
                className="bg-[#0066CC] text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((art) => (
                <article
                  key={art.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-[#0066CC]/50 transition-all flex flex-col justify-between shadow-xs hover:shadow-sm group"
                >
                  <div>
                    {art.imageUrl && !imageErrors[art.id] ? (
                      <div className="h-44 overflow-hidden bg-slate-100 relative">
                        <img
                          src={art.imageUrl}
                          alt={art.title}
                          onError={() => setImageErrors((prev) => ({ ...prev, [art.id]: true }))}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-2.5 left-2.5 bg-slate-900/80 text-white text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md backdrop-blur-xs">
                          {art.category}
                        </span>
                      </div>
                    ) : (
                      <div className="h-32 bg-slate-50 border-b border-slate-100 flex items-center justify-center p-4">
                        <Wrench className="w-8 h-8 text-slate-300" />
                      </div>
                    )}

                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-[#0066CC]" /> {art.date}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-[#0066CC]" /> {art.readTime}</span>
                      </div>

                      <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-[#0066CC] transition-colors leading-snug line-clamp-2">
                        {art.title}
                      </h3>

                      <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">
                        {art.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-slate-100">
                    <button
                      onClick={() => {
                        setExpandedArticle(art.id);
                        window.scrollTo({ top: 100, behavior: "smooth" });
                      }}
                      className="text-[#0066CC] hover:text-[#004494] font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>Read Guide</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => toggleSaveArticle(art.id, e)}
                        className="p-1.5 text-slate-400 hover:text-[#0066CC] rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                        title={savedArticleIds.includes(art.id) ? "Remove bookmark" : "Save for later"}
                      >
                        <Bookmark className={`w-4 h-4 ${savedArticleIds.includes(art.id) ? "fill-current text-[#0066CC]" : ""}`} />
                      </button>

                      <button
                        onClick={(e) => handleCopyLink(art.id, e)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                        title="Copy article link"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
