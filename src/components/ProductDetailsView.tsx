/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { useStore } from "../StoreContext";
import LazyImage from "./LazyImage";
import { Helmet } from "./Helmet";
import { SocialShareManager } from "../services/SocialShareManager";
import { formatKES } from "../utils/formatCurrency";
import { 
  ArrowLeft, 
  ShoppingBag, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  Star, 
  Monitor,
  Bookmark,
  Share2,
  Facebook,
  Twitter,
  Instagram,
  Bell,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  X,
  Truck
} from "lucide-react";

export default function ProductDetailsView() {
  const { 
    products, 
    selectedProductId, 
    setSelectedProductId, 
    setActiveView, 
    addToCart,
    submitProductReview,
    wishlist,
    toggleWishlist,
    user,
    registerPriceAlert,
    registerProductRestockRequest,
    productReviews,
    recordProductView
  } = useStore();

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Restock Notification form state
  const [restockEmail, setRestockEmail] = useState("");
  const [restockWhatsapp, setRestockWhatsapp] = useState("");
  const [restockSubmitted, setRestockSubmitted] = useState(false);
  const [restockSubmitting, setRestockSubmitting] = useState(false);

  // Auto-fill user contact info if logged in
  React.useEffect(() => {
    if (user?.email) {
      setRestockEmail(user.email);
    }
  }, [user]);

  // Hover zoom magnifier state
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({
    transformOrigin: "center center",
    transform: "scale(1)"
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: "scale(2.2)"
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: "center center",
      transform: "scale(1)"
    });
  };

  // Form states for new review submission
  const [revName, setRevName] = useState("");
  const [revComment, setRevComment] = useState("");
  const [revRating, setRevRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | null>(null);

  // Form states for Price alerts
  const [priceAlertEmail, setPriceAlertEmail] = useState("whatsapp-only@haosail.ke");
  const [priceAlertWhatsapp, setPriceAlertWhatsapp] = useState("");
  const [priceAlertTarget, setPriceAlertTarget] = useState("");
  const [priceAlertSuccess, setPriceAlertSuccess] = useState(false);

  // Expanded FAQ trace
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Sync current user email and display name if available
  React.useEffect(() => {
    if (user?.email) {
      setPriceAlertEmail(user.email);
    } else {
      setPriceAlertEmail("whatsapp-only@haosail.ke");
    }
    if (user?.displayName) {
      setRevName(user.displayName);
    }
  }, [user]);

  // Pre-filled WhatsApp and share links
  const handlePriceAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToUse = priceAlertEmail || user?.email || "whatsapp-only@haosail.ke";
    if (!product || !priceAlertWhatsapp || !priceAlertTarget) return;
    const targetPrice = parseFloat(priceAlertTarget);
    if (isNaN(targetPrice) || targetPrice <= 0) return;

    const ok = await registerPriceAlert(
      product.id,
      product.name,
      emailToUse,
      priceAlertWhatsapp,
      targetPrice,
      product.price
    );
    if (ok) {
      setPriceAlertSuccess(true);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || (!restockEmail.trim() && !restockWhatsapp.trim())) return;
    setRestockSubmitting(true);
    try {
      const ok = await registerProductRestockRequest(
        product.id,
        product.name,
        product.image,
        restockEmail.trim(),
        restockWhatsapp.trim()
      );
      if (ok) {
        setRestockSubmitted(true);
      }
    } catch (err) {
      console.error("Error submitting restock request:", err);
    } finally {
      setRestockSubmitting(false);
    }
  };

  // Load selected product profile
  const product = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Record product view in browsing history
  const lastRecordedIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (product && product.id && product.id !== lastRecordedIdRef.current) {
      lastRecordedIdRef.current = product.id;
      recordProductView(product);
    }
  }, [product, recordProductView]);

  const isRefurbished = useMemo(() => {
    if (!product) return false;
    return product.category.toLowerCase().includes("refurbished") || 
           product.tags?.some(t => t.toLowerCase() === "refurbished") || 
           product.name.toLowerCase().includes("refurbished");
  }, [product]);

  // Construct a robust set of showcase images showing different angles and features
  const galleryImages = useMemo(() => {
    if (!product) return [];
    if (product.gallery && product.gallery.length > 0) {
      return [product.image, ...product.gallery];
    }
    
    // Fallback beautiful device angles and lifestyle showcases from Unsplash depending on category
    const cat = product.category.toLowerCase();
    
    if (cat.includes("auto") || cat.includes("lift")) {
      return [
        product.image,
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1504222490345-c075b6008014?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=600"
      ];
    } else if (cat.includes("construction") || cat.includes("mixer")) {
      return [
        product.image,
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600", // Profile / camera glass
        "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=600", // Elegant tactile side keys
        "https://images.unsplash.com/photo-1565849328263-1a7dd3218122?auto=format&fit=crop&q=80&w=600", // High brightness HDR panel
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=600"  // Device in active hand use
      ];
    } else if (cat.includes("printer")) {
      return [
        product.image,
        "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&q=80&w=600", // High capacity input feed tray
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=600", // Pristine color printer output
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600"  // Wireless touchscreen selection pad
      ];
    } else if (cat.includes("accessories") || cat.includes("charger") || cat.includes("cable") || cat.includes("hub")) {
      return [
        product.image,
        "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=600", // Connector contacts close-up
        "https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&q=80&w=600", // Safe thermal dissipation structure
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600"  // Packaging box and accessories
      ];
    } else {
      return [
        product.image,
        "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=600", // Isometric alignment specs
        "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&q=80&w=600", // Ambient office desktop setting
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600"  // Reflected camera detail layout
      ];
    }
  }, [product]);

  // Sync activeImage when product changes
  React.useEffect(() => {
    if (product) {
      setActiveImage(product.image);
    }
  }, [product]);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (galleryImages.length === 0) return;
    const currIndex = galleryImages.indexOf(activeImage || product.image);
    const prevIndex = currIndex <= 0 ? galleryImages.length - 1 : currIndex - 1;
    setActiveImage(galleryImages[prevIndex]);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (galleryImages.length === 0) return;
    const currIndex = galleryImages.indexOf(activeImage || product.image);
    const nextIndex = currIndex >= galleryImages.length - 1 ? 0 : currIndex + 1;
    setActiveImage(galleryImages[nextIndex]);
  };

  // Load database reviews from the top-level Firestore collection
  const dbReviews = useMemo(() => {
    if (!productReviews || !product) return [];
    return productReviews.filter(r => r.productId === product.id);
  }, [productReviews, product]);

  // Simulated static and dynamic reviews builder
  const displayedReviews = useMemo(() => {
    const base = [
      { name: "Edwin K. (Garage Owner)", rating: 5, date: "3 weeks ago", text: "Exceptional machinery quality. Processed our order and received the 2-post car lift delivered within 3 hours at our workshop along Waiyaki Way. Highly recommend Haosail Kenya for genuine equipment.", location: "Nairobi, KE" },
      { name: "Phyllis N. (Site Director)", rating: 5, date: "1 month ago", text: "Genuine machinery verified upon delivery. The hydraulic components perform flawlessly. Best local pricing for heavy industrial tools.", location: "Mombasa, KE" },
      { name: "Abdi H. (Fleet Director)", rating: 4, date: "2 months ago", text: "Clean transactional clearance. Checked specs thoroughly; they match the physical inventory sheet exactly. Stock levels are live, which is incredible.", location: "Kisumu, KE" }
    ];
    if (dbReviews && dbReviews.length > 0) {
      const customOnes = dbReviews.map(r => ({
        name: r.userName,
        rating: r.rating,
        date: new Date(r.createdAt).toLocaleDateString("en-KE", { day: 'numeric', month: 'short', year: 'numeric' }),
        text: r.comment,
        location: "Verified Buyer"
      }));
      return [...customOnes, ...base];
    }
    return base;
  }, [dbReviews]);

  const ratingAverage = useMemo(() => {
    if (!product) return 4.8;
    if (dbReviews.length === 0) return product.rating || 4.8;
    const total = dbReviews.reduce((sum, r) => sum + r.rating, 0);
    return Number((total / dbReviews.length).toFixed(1));
  }, [product, dbReviews]);

  const ratingDistribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<5 | 4 | 3 | 2 | 1, number>;
    displayedReviews.forEach(r => {
      const rate = Math.round(r.rating) as 5 | 4 | 3 | 2 | 1;
      if (counts[rate] !== undefined) {
        counts[rate]++;
      }
    });
    const total = displayedReviews.length || 1;
    return {
      5: { count: counts[5], percentage: Math.round((counts[5] / total) * 100) },
      4: { count: counts[4], percentage: Math.round((counts[4] / total) * 100) },
      3: { count: counts[3], percentage: Math.round((counts[3] / total) * 100) },
      2: { count: counts[2], percentage: Math.round((counts[2] / total) * 100) },
      1: { count: counts[1], percentage: Math.round((counts[1] / total) * 100) },
    };
  }, [displayedReviews]);

  const finalReviews = useMemo(() => {
    if (selectedRatingFilter === null) return displayedReviews;
    return displayedReviews.filter(r => Math.round(r.rating) === selectedRatingFilter);
  }, [displayedReviews, selectedRatingFilter]);

  if (!product) {
    return (
      <div className="text-center py-16 text-slate-900 bg-slate-50/60 rounded-3xl border border-slate-200/80 my-8">
        <p className="text-slate-600 font-sans text-sm">Product record not found in active catalog.</p>
        <button 
          onClick={() => setActiveView("shop")} 
          className="mt-4 bg-[#0055B8] hover:bg-[#004494] text-white rounded-full px-5 py-2.5 text-xs font-medium transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          Return to Showroom
        </button>
      </div>
    );
  }

  const getProductVariants = (p: typeof product) => {
    if (!p) return null;
    if (p.enableVariants === false) return null;

    const hasCustom = p.customVariants && p.customVariants.options && p.customVariants.options.length > 0;
    const hasOther = (p.variants && p.variants.length > 0) || (p.variantGroups && p.variantGroups.length > 0);

    // Default legacy product to omit default variants helper if not turned on explicitly
    if (p.enableVariants === undefined && !hasCustom && !hasOther) {
      return null;
    }

    if (hasCustom) {
      return {
        label: p.customVariants.label || "Available Feature Options",
        options: p.customVariants.options.map(opt => {
          const offset = opt.price - p.price;
          if (offset > 0) {
            return `${opt.name} (+ KES ${offset.toLocaleString()})`;
          } else if (offset < 0) {
            return `${opt.name} (- KES ${Math.abs(offset).toLocaleString()})`;
          } else {
            return opt.name;
          }
        })
      };
    }

    const cat = p.category.toLowerCase();
    if (cat.includes("auto") || cat.includes("lift")) {
      return {
        label: "Voltage & Power Configuration",
        options: ["380V 3-Phase Industrial Electric Motor", "220V Single-Phase High Torque Motor (+ KES 15,000)"]
      };
    }
    if (cat.includes("construction") || cat.includes("mixer")) {
      return {
        label: "Engine Power Option",
        options: ["Standard Electric Motor Drive", "Genuine Honda Petrol Engine (+ KES 25,000)", "Heavy Air-Cooled Diesel Engine (+ KES 35,000)"]
      };
    }
    return {
      label: "Device Customization Bundle Option",
      options: ["Standard Retail Box Edition", "Extended Premium Care Warranty Bundle (+ KES 4,500)"]
    };
  };

  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [selectedRam, setSelectedRam] = useState<string>("");
  const [selectedSsd, setSelectedSsd] = useState<string>("");
  
  // Custom multi-category selections state
  const [selectedSelections, setSelectedSelections] = useState<Record<string, string>>({});

  // Extract unique RAM and SSD configuration values
  const uniqueRams = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) return [];
    return Array.from(new Set(product.variants.map(v => v.ram).filter(Boolean)));
  }, [product]);

  const uniqueSsds = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) return [];
    return Array.from(new Set(product.variants.map(v => v.ssd).filter(Boolean)));
  }, [product]);

  const matchedVariant = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) return null;
    return product.variants.find(v => v.ram === selectedRam && v.ssd === selectedSsd) || product.variants[0];
  }, [product, selectedRam, selectedSsd]);

  const matchedVariantNew = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) return null;
    if (product.variantGroups && product.variantGroups.length > 0) {
      // Find exact selected combination
      const exact = product.variants.find(v => {
        if (!v.selections) return false;
        return Object.entries(selectedSelections).every(([grpName, optVal]) => {
          return v.selections[grpName] === optVal;
        });
      });
      return exact || product.variants[0];
    }
    return null;
  }, [product, selectedSelections]);

  React.useEffect(() => {
    if (product && product.variantGroups && product.variantGroups.length > 0) {
      const initialSelections: Record<string, string> = {};
      product.variantGroups.forEach(g => {
        initialSelections[g.name] = g.options[0] || "";
      });
      if (product.variants && product.variants.length > 0 && product.variants[0].selections) {
        setSelectedSelections({ ...product.variants[0].selections });
      } else {
        setSelectedSelections(initialSelections);
      }
    } else {
      setSelectedSelections({});
    }
  }, [product]);

  React.useEffect(() => {
    if (uniqueRams.length > 0) {
      setSelectedRam(uniqueRams[0]);
    } else {
      setSelectedRam("");
    }
  }, [uniqueRams]);

  React.useEffect(() => {
    if (uniqueSsds.length > 0) {
      setSelectedSsd(uniqueSsds[0]);
    } else {
      setSelectedSsd("");
    }
  }, [uniqueSsds]);

  const variantsInfo = useMemo(() => {
    return getProductVariants(product);
  }, [product]);

  React.useEffect(() => {
    if (variantsInfo && variantsInfo.options.length > 0) {
      setSelectedVariant(variantsInfo.options[0]);
    } else {
      setSelectedVariant("");
    }
  }, [variantsInfo]);

  const currentPrice = useMemo(() => {
    if (!product) return 0;
    if (product.variantGroups && product.variantGroups.length > 0) {
      return matchedVariantNew ? matchedVariantNew.price : product.price;
    }
    if (product.variants && product.variants.length > 0) {
      return matchedVariant ? matchedVariant.price : product.price;
    }
    let price = product.price;
    if (!selectedVariant) return price;

    const priceMatch = selectedVariant.match(/\+\s*KES\s*([\d,]+)/i);
    const minusMatch = selectedVariant.match(/\-\s*KES\s*([\d,]+)/i);
    if (priceMatch) {
       const premium = parseInt(priceMatch[1].replace(/,/g, ""), 10);
       price += premium;
    } else if (minusMatch) {
       const discount = parseInt(minusMatch[1].replace(/,/g, ""), 10);
       price -= discount;
    }
    return price;
  }, [product, selectedVariant, matchedVariant, matchedVariantNew]);

  const currentStock = useMemo(() => {
    if (!product) return 0;
    if (product.variantGroups && product.variantGroups.length > 0) {
      return matchedVariantNew ? matchedVariantNew.stock : product.stock;
    }
    if (product.variants && product.variants.length > 0) {
      return matchedVariant ? matchedVariant.stock : product.stock;
    }
    if (!selectedVariant || !variantsInfo) return product.stock;
    const idx = variantsInfo.options.indexOf(selectedVariant);
    if (idx === -1) return product.stock;
    const modStock = Math.max(1, (product.stock - idx * 2));
    return modStock;
  }, [product, selectedVariant, variantsInfo, matchedVariant, matchedVariantNew]);

  const priceHistoryData = useMemo(() => {
    if (!product) return [];
    
    const data = [];
    const basePrice = product.price;
    const now = new Date();
    
    // Create deterministic seeding based on product ID to make the chart perfectly stable
    const charSum = product.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayName = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      // Deterministic small fluctuation waves (within +2% to -4% of original retail price)
      const valueFactor = Math.sin((charSum + i) * 0.15) * 0.03 + Math.cos(i * 0.25) * 0.015;
      const fluctuatingPrice = Math.round(basePrice * (1 + valueFactor));
      
      data.push({
        date: dayName,
        price: fluctuatingPrice
      });
    }
    // Ground today's price exactly onto currentPrice
    if (data.length > 0) {
      data[data.length - 1].price = currentPrice || basePrice;
    }
    return data;
  }, [product, currentPrice]);

  const isLowStock = currentStock <= 5;
  const isOutOfStock = currentStock === 0;

  // Find related items (matching category, excluding current product, up to 3 items)
  const relatedItems = useMemo(() => {
    return products
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 3);
  }, [products, product]);

  // Handle adding custom quantity to bag
  const handleAddToBag = () => {
    let finalPrice = product.price;
    let finalName = product.name;
    let finalId = product.id;

    if (product.variantGroups && product.variantGroups.length > 0 && matchedVariantNew) {
      finalPrice = matchedVariantNew.price;
      const desc = Object.values(selectedSelections).filter(Boolean).join(" / ");
      finalName = `${product.name} (${desc})`;
      finalId = `${product.id}-${desc.replace(/[^a-zA-Z0-9]/g, "_")}`;
    } else if (product.variants && product.variants.length > 0 && matchedVariant) {
      finalPrice = matchedVariant.price;
      const desc = `${matchedVariant.ram} / ${matchedVariant.ssd}`;
      finalName = `${product.name} (${desc})`;
      finalId = `${product.id}-${desc.replace(/[^a-zA-Z0-9]/g, "_")}`;
    } else if (selectedVariant) {
      const cleanVariantName = selectedVariant.split(" (+")[0].split(" (-")[0];
      const priceMatch = selectedVariant.match(/\+\s*KES\s*([\d,]+)/i);
      const minusMatch = selectedVariant.match(/\-\s*KES\s*([\d,]+)/i);
      if (priceMatch) {
         const premium = parseInt(priceMatch[1].replace(/,/g, ""), 10);
         finalPrice += premium;
      } else if (minusMatch) {
         const discount = parseInt(minusMatch[1].replace(/,/g, ""), 10);
         finalPrice -= discount;
      }
      finalName = `${product.name} (${cleanVariantName})`;
      finalId = `${product.id}-${cleanVariantName.replace(/[^a-zA-Z0-9]/g, "_")}`;
    }

    const modifiedProduct = {
      ...product,
      id: finalId,
      name: finalName,
      price: finalPrice
    };

    addToCart(modifiedProduct, quantity);
    setActiveView("checkout");
  };

  // Submit dynamic review inside Firestore
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revComment.trim()) return;
    setSubmittingReview(true);
    try {
      await submitProductReview(product.id, revRating, revComment, revName);
      setReviewSuccess(true);
      setRevName("");
      setRevComment("");
      setRevRating(5);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!product) {
    return (
      <div className="p-8 text-center text-slate-500 space-y-4 font-sans bg-slate-50/60 rounded-3xl border border-slate-200/80 my-8">
        <p className="text-sm">Selected equipment profile was not found in active showroom inventory.</p>
        <button
          onClick={() => setActiveView("shop")}
          className="bg-[#0055B8] hover:bg-[#004494] text-white font-medium px-5 py-2.5 rounded-full text-xs transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          Return to Showroom
        </button>
      </div>
    );
  }

  return (
    <div id="product-details-container" className="animate-fadeIn">
      <Helmet 
        title={`${product.name} | Haosail Industrial Machinery Kenya`}
        description={product.description ? product.description.slice(0, 155) + "..." : `Buy ${product.name} online at Haosail Kenya. Quality industrial machinery, 12-month local warranty, and nationwide delivery.`}
        keywords={`${product.name}, ${product.brand || "Haosail"}, industrial machinery, specs, Haosail Kenya, Kenya machinery`}
        image={product.image}
        url={`https://haosail.ke/product/${product.id}`}
        product={product}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.name,
          "image": product.image ? (product.image.startsWith("http") ? product.image : `https://haosail.ke${product.image}`) : "https://haosail.ke/logo.png",
          "description": product.description || `Genuine ${product.name} with local warranty, available at Haosail Kenya.`,
          "brand": {
            "@type": "Brand",
            "name": product.brand || "Haosail"
          },
          "sku": product.id,
          "mpn": product.id,
          "offers": {
            "@type": "Offer",
            "url": `https://haosail.ke/product/${product.id}`,
            "priceCurrency": "KES",
            "price": currentPrice || product.price,
            "priceValidUntil": "2027-12-31",
            "itemCondition": "https://schema.org/NewCondition",
            "availability": currentStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "seller": {
              "@type": "Organization",
              "name": "Haosail Kenya",
              "url": "https://haosail.ke"
            }
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": ratingAverage,
            "reviewCount": displayedReviews.length || 1,
            "bestRating": "5",
            "worstRating": "1"
          },
          "review": displayedReviews.map((rev) => ({
            "@type": "Review",
            "author": {
              "@type": "Person",
              "name": rev.name || "Verified Buyer"
            },
            "datePublished": "2026-06-15",
            "reviewBody": rev.text || "Highly recommended quality product.",
            "reviewRating": {
              "@type": "Rating",
              "ratingValue": rev.rating || 5,
              "bestRating": "5",
              "worstRating": "1"
            }
          }))
        })
      }} />
      
      {/* Return to shop banner link */}
      <button
        onClick={() => setActiveView("shop")}
        className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-[#0055B8] mb-6 transition-colors cursor-pointer active:scale-95 group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        <span>Back to live machinery catalog</span>
      </button>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
        
        {/* Left Side: Media Display with interactive multi-image gallery slider */}
        <div className="lg:col-span-6 space-y-4 flex flex-col items-center">
          <div 
            className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-2xs h-64 sm:h-80 w-full max-w-sm sm:max-w-md mx-auto relative cursor-zoom-in group/zoom container-zoom-magnifier"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Main Interactive Zoomed Image */}
            <img
              src={activeImage || product.image}
              alt={product.name}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain p-4 transition-transform duration-75 ease-out"
              style={zoomStyle}
            />

            {/* Left Chevron Slide Trigger */}
            {galleryImages.length > 1 && (
              <button
                onClick={handlePrevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-[#0055B8] text-slate-700 hover:text-white p-2 rounded-full border border-slate-200/80 transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xs backdrop-blur-xs cursor-pointer z-20"
                aria-label="Previous showcase view"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Right Chevron Slide Trigger */}
            {galleryImages.length > 1 && (
              <button
                onClick={handleNextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-[#0055B8] text-slate-700 hover:text-white p-2 rounded-full border border-slate-200/80 transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xs backdrop-blur-xs cursor-pointer z-20"
                aria-label="Next showcase view"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Translucent Numeric Indicator overlay */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-3 right-4 bg-white/90 shadow-2xs text-slate-800 text-[10px] font-mono px-2.5 py-1 rounded-full border border-slate-200/80 select-none pointer-events-none z-20 font-bold">
                {galleryImages.indexOf(activeImage || product.image) + 1} / {galleryImages.length}
              </div>
            )}
          </div>
          
          {/* Enhanced Thumbnails list mapping up to 5 beautiful device angles */}
          {galleryImages.length > 1 && (
            <div className="flex justify-center gap-2 px-3 py-2 bg-slate-50/80 border border-slate-200/80 rounded-2xl overflow-x-auto w-full max-w-sm sm:max-w-md">
              {galleryImages.map((img, index) => {
                const isActive = (activeImage || product.image) === img;
                const viewLabels = ["Primary", "Ports/Side", "Detail/Profile", "Interface/Keys", "Setup/Box"];
                const label = viewLabels[index] || `View ${index + 1}`;

                return (
                  <button
                    key={index}
                    onClick={() => setActiveImage(img)}
                    className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border cursor-pointer shrink-0 transition-all bg-white ${
                      isActive 
                        ? "border-[#0055B8] ring-2 ring-blue-100" 
                        : "border-slate-200/80 hover:border-slate-300"
                    }`}
                    title={label}
                  >
                    <LazyImage src={img} alt={`${product.name} - ${label}`} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
          
          <div className="flex border border-slate-200/80 bg-slate-50/60 rounded-2xl p-4 items-center gap-3 w-full max-w-sm sm:max-w-md">
            <span className="p-2 rounded-full bg-blue-50 text-[#0055B8] border border-blue-200/80 shrink-0">
              <CheckCircle className="w-5 h-5 text-[#0055B8]" />
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-900 leading-tight">East Africa Warranty Verified</p>
              <p className="text-[11px] text-slate-600 mt-0.5 font-sans">This {product.brand} machinery is certified authentic and covered by a comprehensive 12-month manufacturer backing.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Specific Details and Dynamic Buy panel */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[#0055B8] font-mono text-[11px] uppercase font-bold tracking-widest bg-blue-50/80 px-3 py-1 rounded-full border border-blue-200/80">
                {product.brand} • {product.category}
              </span>
              <span className="text-[10px] font-mono font-medium uppercase px-3 py-1 rounded-full border bg-emerald-50/80 border-emerald-200/80 text-emerald-800">
                Warranty: 1 Year
              </span>
            </div>
            <h1 className="font-sans font-extrabold text-2xl sm:text-3xl tracking-tight text-slate-900 leading-tight mt-2">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => {
                  const starIndex = i + 1;
                  const isGold = starIndex <= Math.round(ratingAverage);
                  return (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${isGold ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} 
                    />
                  );
                })}
              </div>
              <span className="text-xs font-medium text-slate-600">({ratingAverage} Average • {displayedReviews.length} verified reviews)</span>
            </div>
          </div>

          <p className="font-sans text-slate-700 text-sm leading-relaxed border-t border-b border-slate-200 py-4">
            {product.description}
          </p>

          {/* Variants Selector Section */}
          {product.enableVariants !== false && (
            product.variantGroups && product.variantGroups.length > 0 ? (
              <div className="space-y-4 pt-2">
                {product.variantGroups.map((group) => (
                  <div key={group.name} className="space-y-2">
                    <span className="text-[#0055B8] font-mono text-[10px] uppercase font-bold tracking-wider block">
                      Choose {group.name}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((opt) => {
                        const isSelected = selectedSelections[group.name] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setSelectedSelections({
                                ...selectedSelections,
                                [group.name]: opt
                              });
                            }}
                            className={`px-4 py-2.5 rounded-full text-[11px] font-medium transition-all cursor-pointer border ${
                              isSelected
                                ? "bg-blue-50/80 border-[#0055B8] text-[#0055B8] shadow-2xs"
                                : "bg-white border-slate-200/80 hover:border-slate-300 text-slate-700"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : product.variants && product.variants.length > 0 ? (
              <div className="space-y-4 pt-2">
                {uniqueRams.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[#0055B8] font-mono text-[10px] uppercase font-bold tracking-wider block">
                      Choose Configuration
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {uniqueRams.map((ramOption) => (
                        <button
                          key={ramOption}
                          type="button"
                          onClick={() => setSelectedRam(ramOption)}
                          className={`px-4 py-2 rounded-full text-[11px] font-medium transition-all cursor-pointer border ${
                            selectedRam === ramOption
                              ? "bg-blue-50/80 border-[#0055B8] text-[#0055B8] shadow-2xs"
                              : "bg-white border-slate-200/80 hover:border-slate-300 text-slate-700"
                          }`}
                        >
                          {ramOption}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              variantsInfo && variantsInfo.options.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-[#0055B8] font-mono text-[10px] uppercase font-bold tracking-wider block">
                    {variantsInfo.label}
                  </span>
                  <div className="flex flex-col gap-2">
                    {variantsInfo.options.map((option) => {
                      const isSelected = selectedVariant === option;
                      const cleanOpt = option.split(" (")[0];
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setSelectedVariant(option)}
                          className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-medium flex justify-between items-center transition-all cursor-pointer border ${
                            isSelected
                              ? "bg-blue-50/80 border-[#0055B8] text-[#0055B8] shadow-2xs"
                              : "bg-white border-slate-200/80 hover:border-slate-300 text-slate-700"
                          }`}
                        >
                          <span>{cleanOpt}</span>
                          {option.includes("(+") && (
                            <span className="text-[10px] font-mono text-[#0055B8] font-bold">
                              +{option.split("(+")[1].replace(")", "")}
                            </span>
                          )}
                          {option.includes("(-") && (
                            <span className="text-[10px] font-mono text-emerald-600 font-bold">
                              -{option.split("(-")[1].replace(")", "")}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            )
          )}

          {/* Pricing and Stock Level metrics */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] text-slate-500 font-mono block leading-none mb-1 font-medium">UNIT RETAIL PRICE</span>
              <span className="font-sans font-bold text-2xl sm:text-3xl tracking-tight text-[#0055B8] block leading-none">
                {formatKES(currentPrice)}
              </span>
            </div>

            <div className="text-right shrink-0">
              {isOutOfStock ? (
                <div className="bg-slate-200 text-slate-700 font-mono text-[10px] font-medium px-3 py-1.5 rounded-full border border-slate-300">
                  OUT OF STOCK
                </div>
              ) : (
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-mono block mb-1 font-medium">WAREHOUSE STOCK</span>
                  <span className={`font-mono text-xs font-medium px-3 py-1 rounded-full border inline-block leading-none ${
                    isLowStock 
                      ? "bg-amber-50/80 text-amber-800 border-amber-300/80" 
                      : "bg-emerald-50/80 text-emerald-800 border-emerald-300/80"
                  }`}>
                    {isLowStock ? `Only ${currentStock} left in stock` : `${currentStock} units in stock`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quantity custom count and Add-to-bag section */}
          {!isOutOfStock && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs font-medium text-slate-700 tracking-wider">
                  QTY:
                </span>
                
                <div className="flex items-center border border-slate-200/80 rounded-full overflow-hidden bg-white shadow-2xs px-1 py-0.5">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold transition-colors cursor-pointer text-sm active:scale-90"
                  >
                    -
                  </button>
                  <span className="px-4 font-mono text-xs font-bold text-slate-900 min-w-[2rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => Math.min(currentStock, q + 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold transition-colors cursor-pointer text-sm active:scale-90"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddToBag}
                  className="flex-1 bg-[#0055B8] hover:bg-[#004494] text-white font-sans font-medium px-6 py-3.5 rounded-full transition-all shadow-2xs flex items-center justify-center gap-2.5 text-sm cursor-pointer active:scale-95 min-h-[48px]"
                >
                  <ShoppingBag className="w-4 h-4 text-white" />
                  <span>Buy Now / Order Equipment</span>
                </button>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.id)}
                    className={`px-4 py-3.5 rounded-full text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer border transition-all active:scale-95 min-h-[48px] ${
                      wishlist.includes(product.id)
                        ? "bg-blue-50/80 text-[#0055B8] border-[#0055B8]"
                        : "bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50"
                    }`}
                    title={wishlist.includes(product.id) ? "Saved to wishlist" : "Save product to view later"}
                  >
                    <Bookmark className={`w-4 h-4 ${wishlist.includes(product.id) ? "fill-current text-[#0055B8]" : "text-slate-600"}`} />
                    <span>{wishlist.includes(product.id) ? "Saved" : "Save Later"}</span>
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `Inquiring about ${product.name} (KES ${product.price.toLocaleString()}) on Haosail Machinery Kenya:\n${window.location.origin}/?product=${product.id}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#25D366]/10 border border-[#25D366]/30 text-[#128C7E] hover:bg-[#25D366]/20 px-4 py-3.5 rounded-full text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 min-h-[48px]"
                    title="Share directly via WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Secure Fulfillment & Payment badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200/80 text-[#0055B8] flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                  <span>Nationwide Freight Dispatch</span>
                </h5>
                <p className="text-[11px] text-slate-600 leading-normal font-sans mt-0.5">
                  Secured transport and direct dispatch across all 47 Kenyan counties.
                </p>
              </div>
            </div>

            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3">
              <span className="p-1 px-2 border border-blue-200/80 bg-blue-50 rounded-full text-[10px] font-mono font-medium shrink-0 text-[#0055B8] mt-0.5">
                ORDER
              </span>
              <p className="text-[11px] text-slate-600 leading-normal font-sans">
                Order directly with zero online payment. Instant WhatsApp & email notifications sent to our sales desk.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Bespoke Product FAQs Section */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mb-12 shadow-xs">
        <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-200">
          <MessageCircle className="w-5 h-5 text-[#0066CC]" />
          <h2 className="font-sans font-bold text-lg sm:text-xl tracking-tight text-slate-900">
            Product FAQs & Ordering Information
          </h2>
        </div>
        
        <div className="space-y-4">
          {[
            {
              q: `Is this ${product.name} brand new with warranty?`,
              a: `Yes, this is 100% brand-new, factory-certified industrial machinery sourced directly through official distribution networks with 12 months comprehensive manufacturer warranty.`
            },
            {
              q: "How long does shipping take within Nairobi and nationwide counties?",
              a: "Local Nairobi deliveries are dispatched immediately from our Waiyaki Way warehouse facility. Deliveries to upcountry counties (Mombasa, Kisumu, Eldoret, Nakuru, etc.) are securely freighted within 24 to 48 hours."
            },
            {
              q: "What payment methods are supported for machinery orders?",
              a: "We support direct Payment on Delivery, Bank Proforma Wire (RTGS / EFT) with compliant E-TIMS invoices, and Showroom collection for corporate and workshop buyers across Kenya."
            },
            {
              q: `How do I claim the 12-month manufacturer warranty for this ${product.brand} machine?`,
              a: `All ${product.brand} equipment carries an official 12-month warranty from authorized Kenyan technical service hubs. Your order's invoice and digital receipt provide instant verification for spare parts, maintenance, and diagnostics.`
            }
          ].map((item, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div 
                key={idx} 
                className="border border-slate-200 rounded-2xl overflow-hidden bg-white hover:border-slate-300 transition-all"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 text-slate-900 font-sans text-sm font-bold select-none cursor-pointer"
                >
                  <span>{item.q}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#0066CC] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>
                
                <div 
                  className={`transition-all duration-200 ease-in-out overflow-hidden ${
                    isExpanded ? "max-h-50 border-t border-slate-100 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="px-5 py-4 text-xs text-slate-600 leading-relaxed font-sans bg-slate-50/50">
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Verified Reviews & Interactive Submission Section */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mb-12 shadow-xs" id="client-reviews-section">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
          
          {/* Left Column: List Reviews (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <h3 className="font-sans font-bold text-lg sm:text-xl tracking-tight text-slate-900 pb-3 border-b border-slate-200 flex items-center justify-between">
              <span>Customer Reviews & Feedback</span>
              <span className="text-xs text-slate-500 font-mono font-medium uppercase tracking-wider">{displayedReviews.length} Verified Reviews</span>
            </h3>

            {/* Interactive Rating Summary & Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50 border border-slate-200 rounded-2xl p-5">
              {/* Average Rating Block */}
              <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-4">
                <span className="text-4xl font-extrabold text-slate-900 font-sans tracking-tight">{ratingAverage}</span>
                <div className="flex items-center gap-0.5 text-amber-500 my-1.5">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className={`w-3.5 h-3.5 ${idx < Math.round(ratingAverage) ? "fill-amber-500 text-amber-500" : "text-slate-300"}`} />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Average Customer Rating</span>
              </div>

              {/* Distribution bars */}
              <div className="md:col-span-8 space-y-2">
                {([5, 4, 3, 2, 1] as const).map((ratingNum) => {
                  const dist = ratingDistribution[ratingNum];
                  const isSelected = selectedRatingFilter === ratingNum;
                  return (
                    <button
                      key={ratingNum}
                      onClick={() => setSelectedRatingFilter(selectedRatingFilter === ratingNum ? null : ratingNum)}
                      className={`w-full flex items-center gap-3 text-left text-xs font-mono py-1 px-2 rounded-lg hover:bg-slate-200/60 transition-all group border ${
                        isSelected ? "bg-white border-[#0066CC]" : "border-transparent"
                      }`}
                    >
                      <span className="text-slate-700 text-[11px] w-6 shrink-0 flex items-center gap-0.5 font-bold">
                        {ratingNum} <Star className="w-3 h-3 fill-amber-500 text-amber-500 inline-block" />
                      </span>
                      <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden relative">
                        <div 
                          className="h-full rounded-full transition-all duration-500 bg-[#0066CC]"
                          style={{ width: `${dist.percentage}%` }}
                        />
                      </div>
                      <span className="text-slate-500 text-[10px] w-12 text-right shrink-0">
                        {dist.count} ({dist.percentage}%)
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter Indicator */}
            {selectedRatingFilter !== null && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="text-slate-700">
                    Showing <strong className="text-slate-900">{selectedRatingFilter} Star</strong> feedback only
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedRatingFilter(null)}
                  className="text-[#0066CC] hover:text-[#0052A3] font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 bg-white border border-blue-200 px-2 py-1 rounded-md transition-all cursor-pointer shadow-xs"
                >
                  Clear Filter
                </button>
              </div>
            )}

            {/* Reviews list */}
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2" id="reviews-list-hull">
              {finalReviews.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-2xl">
                  <p className="text-xs text-slate-500 font-mono">No verified {selectedRatingFilter}-star reviews found.</p>
                  <button 
                    onClick={() => setSelectedRatingFilter(null)}
                    className="mt-3 text-[#0066CC] hover:underline text-xs font-semibold cursor-pointer"
                  >
                    Display all reviews
                  </button>
                </div>
              ) : (
                finalReviews.map((rev, i) => (
                  <div key={i} className="border-b border-slate-100 pb-6 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-sans font-bold text-sm text-slate-900 leading-none">{rev.name}</h4>
                        <span className="font-mono text-[9px] text-[#0066CC] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200 mt-1.5 inline-block uppercase tracking-wider font-bold">
                          {rev.location} • Verified Buyer
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {[...Array(5)].map((_, idx) => (
                            <Star key={idx} className={`w-3 h-3 ${idx < rev.rating ? "fill-amber-500 text-amber-500" : "text-slate-200"}`} />
                          ))}
                        </div>
                        <span className="font-mono text-[9px] text-slate-400 mt-1 block">{rev.date}</span>
                      </div>
                    </div>
                    <p className="text-slate-700 text-xs mt-3 leading-relaxed font-sans">
                      {rev.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Write a Review Form (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 p-6 rounded-2xl self-start">
            <h3 className="font-sans font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0066CC]" />
              <span>Submit Equipment Review</span>
            </h3>

            {!user ? (
              <div className="bg-blue-50 border border-blue-200 text-[#0066CC] p-4 rounded-xl text-xs space-y-2 mt-4" id="review-signin-notice">
                <p className="font-bold">🔒 Member Sign In Required</p>
                <p className="text-slate-600 font-sans">Please sign in to submit customer feedback and ratings for this machinery product.</p>
              </div>
            ) : reviewSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs space-y-1 my-4">
                <p className="font-bold">✓ Feedback Logged Successfully!</p>
                <p className="text-slate-600 font-sans">Your review and star ratings have been recorded. Thank you for rating Haosail Machinery Kenya.</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-700 uppercase mb-1">
                    YOUR NAME
                  </label>
                  <input
                    type="text"
                    value={revName}
                    onChange={(e) => setRevName(e.target.value)}
                    placeholder="e.g. Dennis Omwenga"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#0066CC] text-slate-900 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-700 uppercase mb-1">
                    PRODUCT RATING
                  </label>
                  <div className="flex items-center gap-1.5 py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRevRating(star)}
                        className="text-amber-500 focus:outline-hidden hover:scale-110 active:scale-95 transition-all cursor-pointer"
                        title={`${star} Stars`}
                      >
                        <Star className={`w-6 h-6 ${star <= revRating ? "fill-amber-500 text-amber-500" : "text-slate-300"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-700 uppercase mb-1">
                    YOUR COMMENTS
                  </label>
                  <textarea
                    required
                    value={revComment}
                    onChange={(e) => setRevComment(e.target.value)}
                    placeholder="Describe equipment build quality, performance, delivery experience, etc."
                    rows={4}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs focus:outline-hidden focus:border-[#0066CC] text-slate-900 resize-none shadow-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-[#0066CC] hover:bg-[#0052A3] disabled:opacity-50 text-white font-sans font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  {submittingReview ? "Submitting review..." : "Submit Equipment Review"}
                </button>
              </form>
            )}
          </div>

        </div>
      </section>

      {/* Related items shelf */}
      {relatedItems.length > 0 && (
        <section className="mb-12">
          <h2 className="font-sans font-bold text-lg sm:text-xl tracking-tight text-slate-900 mb-6">
            Similar Related Machinery
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedProductId(item.id);
                  setQuantity(1);
                  window.scrollTo(0, 0);
                }}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden p-4 cursor-pointer hover:border-[#0066CC] transition-all flex gap-4 items-center group shadow-xs"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
                  <LazyImage
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                
                <div className="min-w-0 font-sans">
                  <span className="font-mono text-[9px] text-[#0066CC] font-bold block uppercase">{item.brand}</span>
                  <h3 className="text-xs text-slate-900 truncate mt-0.5 group-hover:text-[#0066CC] transition-colors font-bold">
                    {item.name}
                  </h3>
                  <span className="font-extrabold text-xs text-[#0066CC] block mt-1">
                    {formatKES(item.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
