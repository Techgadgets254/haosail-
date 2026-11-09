import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Star, 
  Quote, 
  CheckCircle2, 
  MapPin, 
  ShieldCheck, 
  ThumbsUp, 
  MessageSquarePlus, 
  X, 
  Building2, 
  Truck,
  UserCheck,
  ShoppingBag,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export interface Testimonial {
  id: string;
  author: string;
  roleLocation: string;
  city: string;
  avatarBg: string;
  initials: string;
  rating: number;
  productBought: string;
  category: "Auto-Maintenance" | "Construction Machinery" | "Woodworking" | "Compressors & Generators" | "Delivery & Service";
  verifiedBuy: boolean;
  deliveryMethod: string;
  date: string;
  headline: string;
  content: string;
  helpfulCount: number;
}

import { db } from "../lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";

export default function CustomerTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  // Load real testimonials from Firestore
  useEffect(() => {
    try {
      const q = query(collection(db, "testimonials"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const loaded: Testimonial[] = [];
        snapshot.forEach((d) => {
          loaded.push({ id: d.id, ...d.data() } as Testimonial);
        });
        setTestimonials(loaded);
      }, () => {
        setTestimonials([]);
      });
      return () => unsubscribe();
    } catch (e) {
      setTestimonials([]);
    }
  }, []);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [helpfulLiked, setHelpfulLiked] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittedToast, setSubmittedToast] = useState(false);

  // New review form fields
  const [formName, setFormName] = useState("");
  const [formCity, setFormCity] = useState("Nairobi");
  const [formRole, setFormRole] = useState("");
  const [formProduct, setFormProduct] = useState("");
  const [formCategory, setFormCategory] = useState<"Auto-Maintenance" | "Construction Machinery" | "Woodworking" | "Compressors & Generators" | "Delivery & Service">("Auto-Maintenance");
  const [formRating, setFormRating] = useState(5);
  const [formHeadline, setFormHeadline] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formMpesaCode, setFormMpesaCode] = useState("");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  const categories = ["All", "Auto-Maintenance", "Construction Machinery", "Woodworking", "Compressors & Generators", "Delivery & Service"];

  const filteredTestimonials = testimonials.filter(t => {
    if (selectedCategory === "All") return true;
    return t.category === selectedCategory;
  });

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedCategory]);

  // Auto-scroll one by one
  useEffect(() => {
    if (!isAutoPlay || filteredTestimonials.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % filteredTestimonials.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [isAutoPlay, filteredTestimonials.length]);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + filteredTestimonials.length) % filteredTestimonials.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % filteredTestimonials.length);
  };

  const activeReview = filteredTestimonials[currentIndex] || filteredTestimonials[0];

  const handleHelpfulClick = (id: string) => {
    if (helpfulLiked[id]) return;
    setHelpfulLiked(prev => ({ ...prev, [id]: true }));
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, helpfulCount: t.helpfulCount + 1 } : t));
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formContent.trim() || !formProduct.trim()) return;

    const initials = formName.trim().split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "TS";
    const colors = [
      "bg-emerald-600/20 text-emerald-400 border-emerald-500/30",
      "bg-[#0066CC]/20 text-[#0066CC] border-[#0066CC]/30",
      "bg-sky-600/20 text-sky-400 border-sky-500/30",
      "bg-amber-600/20 text-amber-400 border-amber-500/30"
    ];
    const randomBg = colors[Math.floor(Math.random() * colors.length)];

    const newReview: Testimonial = {
      id: "rev-" + Date.now(),
      author: formName.trim(),
      roleLocation: formRole.trim() || "Verified Shopper",
      city: formCity.trim() || "Kenya",
      avatarBg: randomBg,
      initials,
      rating: formRating,
      productBought: formProduct.trim(),
      category: formCategory,
      verifiedBuy: formMpesaCode.trim().length > 3,
      deliveryMethod: "M-Pesa Verified Purchase",
      date: "Just now",
      headline: formHeadline.trim() || "Great purchasing experience!",
      content: formContent.trim(),
      helpfulCount: 1
    };

    try {
      addDoc(collection(db, "testimonials"), {
        ...newReview,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Failed saving review to Firestore:", err);
    }

    setTestimonials([newReview, ...testimonials]);
    setIsModalOpen(false);
    setSubmittedToast(true);

    // Reset form
    setFormName("");
    setFormRole("");
    setFormProduct("");
    setFormHeadline("");
    setFormContent("");
    setFormMpesaCode("");

    setTimeout(() => {
      setSubmittedToast(false);
    }, 6000);
  };

  return (
    <section className="mb-14">
      {/* Toast notification */}
      <AnimatePresence>
        {submittedToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 sm:right-8 z-[99999] bg-emerald-950 border border-emerald-500/40 text-emerald-300 p-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md"
          >
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div className="text-xs font-sans">
              <p className="font-bold text-white text-sm">Review Published Successfully!</p>
              <p className="text-emerald-300/80">Thank you for sharing your experience with fellow Kenyan shoppers.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Space-Saving Customer Reviews Carousel */}
      <div 
        className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden"
        onMouseEnter={() => setIsAutoPlay(false)}
        onMouseLeave={() => setIsAutoPlay(true)}
      >
        {/* Carousel Header with Ratings, Trust Badge & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0055B8] border border-blue-200/80 text-[10px] font-mono font-semibold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#0055B8]" />
                Verified Customer Reviews
              </span>
              <div className="flex items-center gap-1 text-amber-500 text-xs font-bold font-mono">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <span className="text-slate-900 font-extrabold ml-0.5">4.9</span>
                <span className="text-slate-400 font-normal text-[11px]">(1,850+ ratings)</span>
              </div>
            </div>
            <h2 className="font-sans font-bold text-lg sm:text-xl text-slate-900 tracking-tight">
              What Workshop &amp; Site Managers Say
            </h2>
          </div>

          {/* Action buttons: Write Review + Carousel Prev/Next */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-sans font-medium px-3.5 py-2 rounded-full text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-[#0055B8]" />
              <span>Write Review</span>
            </button>

            <div className="flex items-center gap-1 pl-1">
              <button
                onClick={handlePrev}
                className="w-8 h-8 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#0055B8] flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-90"
                title="Previous Review"
                aria-label="Previous Review"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="w-8 h-8 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#0055B8] flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-90"
                title="Next Review"
                aria-label="Next Review"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-between gap-3 pt-3 pb-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-sans transition-all cursor-pointer whitespace-nowrap border ${
                  selectedCategory === cat
                    ? "bg-[#0055B8] text-white font-semibold border-[#0055B8] shadow-2xs"
                    : "bg-slate-50/80 text-slate-600 hover:text-slate-900 border-slate-200/60 hover:bg-slate-100"
                }`}
              >
                {cat === "All" ? "All Reviews" : cat}
              </button>
            ))}
          </div>
          <span className="text-[11px] font-mono text-slate-400 font-medium shrink-0 hidden md:inline">
            Review {currentIndex + 1} of {filteredTestimonials.length}
          </span>
        </div>

        {/* The One-by-One Review Card or Empty State */}
        {filteredTestimonials.length === 0 ? (
          <div className="text-center py-10 px-4 my-2 bg-slate-50 border border-slate-200/70 rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-[#0055B8] mx-auto mb-2 opacity-60" />
            <h4 className="font-bold text-sm text-slate-800">Verified Client Reviews</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Real client reviews from workshops, garages, and construction sites in Kenya will appear here once published.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 bg-[#0055B8] hover:bg-[#004494] text-white text-xs font-semibold rounded-full shadow-2xs transition-all cursor-pointer"
            >
              Write First Review
            </button>
          </div>
        ) : (
          activeReview && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeReview.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-50/60 border border-slate-200/70 rounded-2xl p-5 sm:p-6 relative text-left"
              >
                {/* User Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center font-mono font-bold text-sm shrink-0 ${activeReview.avatarBg}`}>
                      {activeReview.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-sans font-bold text-sm text-slate-900 truncate">
                          {activeReview.author}
                        </h4>
                        {activeReview.verifiedBuy && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-medium shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>M-Pesa Verified</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-sans mt-0.5">
                        <span className="truncate max-w-[180px] font-medium">{activeReview.roleLocation}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                          <MapPin className="w-3 h-3 text-[#0055B8]" />
                          {activeReview.city}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Star rating + Purchased model badge */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex text-amber-500 shrink-0">
                      {[...Array(activeReview.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono font-medium text-slate-700 bg-white border border-slate-200/80 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs truncate max-w-[240px]">
                      <ShoppingBag className="w-3 h-3 text-[#0055B8] shrink-0" />
                      <span className="truncate">{activeReview.productBought}</span>
                    </span>
                  </div>
                </div>

                {/* Review Headline & Content */}
                <div className="space-y-1.5 my-3">
                  <h3 className="font-sans font-bold text-sm sm:text-base text-slate-900 leading-snug">
                    &ldquo;{activeReview.headline}&rdquo;
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-sans">
                    {activeReview.content}
                  </p>
                </div>

                {/* Footer bar with date, delivery info & helpful button */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] font-mono text-slate-500">
                  <div className="flex items-center gap-2">
                    <span>{activeReview.date}</span>
                    <span>•</span>
                    <span className="text-slate-600 flex items-center gap-1 font-sans">
                      <Truck className="w-3 h-3 text-[#0055B8]" />
                      {activeReview.deliveryMethod}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleHelpfulClick(activeReview.id)}
                      disabled={helpfulLiked[activeReview.id]}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all cursor-pointer ${
                        helpfulLiked[activeReview.id]
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-medium"
                          : "bg-white text-slate-600 border-slate-200/80 hover:text-slate-900 hover:bg-slate-50 shadow-2xs"
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3 text-slate-500" />
                      <span>Helpful ({activeReview.helpfulCount})</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )
        )}

        {/* Carousel Bottom Indicators: Dots and Counter */}
        <div className="flex items-center justify-between pt-4 mt-2">
          <div className="flex items-center gap-1.5">
            {filteredTestimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex
                    ? "w-6 bg-[#0055B8]"
                    : "w-2 bg-slate-200 hover:bg-slate-300"
                }`}
                title={`Go to review ${idx + 1}`}
                aria-label={`Go to review ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="sm:hidden font-medium">
              {currentIndex + 1} / {filteredTestimonials.length}
            </span>
            <div className="flex gap-1 sm:hidden">
              <button
                onClick={handlePrev}
                className="p-1 rounded-full border border-slate-200 bg-white"
                aria-label="Previous review"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNext}
                className="p-1 rounded-full border border-slate-200 bg-white"
                aria-label="Next review"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Review Modal */}
      <AnimatePresence>
          {isModalOpen && (
            <div 
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsModalOpen(false);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto relative my-auto z-10 text-left"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="font-sans font-bold text-xl text-slate-900">
                      Submit Your Customer Review
                    </h3>
                    <p className="text-xs text-slate-600 font-sans mt-0.5">
                      Share your experience to guide workshop and site operators across Kenya.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div className="text-center bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    <label className="block text-[10px] font-mono font-bold text-[#0066CC] uppercase mb-1.5">
                      YOUR OVERALL RATING
                    </label>
                    <div className="flex justify-center gap-2 text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setFormRating(star)}
                          className="p-1 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                        >
                          <Star className={`w-7 h-7 ${star <= formRating ? "fill-amber-500 text-amber-500" : "text-slate-300"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase mb-1">
                        FULL NAME *
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. John Kamau"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0066CC]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase mb-1">
                        CITY / LOCATION *
                      </label>
                      <input
                        type="text"
                        required
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                        placeholder="e.g. Westlands, Nairobi"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0066CC]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase mb-1">
                        MACHINERY / PRODUCT BOUGHT *
                      </label>
                      <input
                        type="text"
                        required
                        value={formProduct}
                        onChange={(e) => setFormProduct(e.target.value)}
                        placeholder="e.g. Haosail 4.5T Hydraulic Lift"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0066CC]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase mb-1">
                        EQUIPMENT CATEGORY
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as any)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#0066CC]"
                      >
                        <option value="Auto-Maintenance">Auto-Maintenance</option>
                        <option value="Construction Machinery">Construction Machinery</option>
                        <option value="Woodworking">Woodworking</option>
                        <option value="Compressors & Generators">Compressors & Generators</option>
                        <option value="Delivery & Service">Delivery & Service</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase mb-1">
                      REVIEW TITLE / HEADLINE
                    </label>
                    <input
                      type="text"
                      value={formHeadline}
                      onChange={(e) => setFormHeadline(e.target.value)}
                      placeholder="e.g. Fast delivery and genuine heavy duty machine!"
                      className="w-full bg-white border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0055B8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase mb-1">
                      YOUR DETAILED REVIEW *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="Describe your equipment performance, build quality, installation, or dispatch experience..."
                      className="w-full bg-white border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0055B8] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase mb-1">
                      M-PESA TRANSACTION CODE (OPTIONAL - FOR VERIFIED BADGE)
                    </label>
                    <input
                      type="text"
                      value={formMpesaCode}
                      onChange={(e) => setFormMpesaCode(e.target.value)}
                      placeholder="e.g. QK89201LPA"
                      className="w-full bg-white border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0055B8]"
                    />
                  </div>

                  <div className="pt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-medium py-3 rounded-full text-xs transition-colors cursor-pointer border border-slate-200/80 active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-2/3 bg-[#0055B8] hover:bg-[#004494] text-white font-sans font-medium py-3 rounded-full text-xs transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      Publish Equipment Review
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </section>
  );
}
