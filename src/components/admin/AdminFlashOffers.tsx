import React, { useState, useEffect } from "react";
import { 
  Zap, 
  Plus, 
  Trash2, 
  Clock, 
  Calendar, 
  Tag, 
  Check, 
  X, 
  AlertCircle, 
  Loader2, 
  Package 
} from "lucide-react";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { Product } from "../../types";

interface FlashOffer {
  id: string;
  productId: string;
  productName: string;
  originalPrice: number;
  flashPrice: number;
  discountBadge: string;
  headline: string;
  expiresAt: string;
  active: boolean;
  image?: string;
}

interface AdminFlashOffersProps {
  products: Product[];
}

export default function AdminFlashOffers({ products }: AdminFlashOffersProps) {
  const [offers, setOffers] = useState<FlashOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    productId: products[0]?.id || "",
    flashPrice: 0,
    headline: "LIMITED WORKSHOP FLASH DEAL",
    discountBadge: "20% OFF",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });

  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, "flash_offers"), (snap) => {
        const list: FlashOffer[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        setOffers(list);
        setLoading(false);
      }, (err) => {
        console.warn("Flash offers snapshot error:", err);
        setLoading(false);
      });
      return () => unsub();
    } catch (e) {
      setLoading(false);
    }
  }, []);

  const handleOpenCreate = () => {
    const firstProd = products[0];
    setFormData({
      productId: firstProd?.id || "",
      flashPrice: firstProd ? Math.round(Number(firstProd.price) * 0.85) : 0,
      headline: "HAOSAIL KENYA PROMO DISCOUNT",
      discountBadge: "15% OFF",
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const handleSelectProduct = (prodId: string) => {
    const p = products.find((x) => x.id === prodId);
    if (p) {
      setFormData((prev) => ({
        ...prev,
        productId: prodId,
        flashPrice: Math.round(Number(p.price) * 0.85),
      }));
    }
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedProd = products.find((p) => p.id === formData.productId);
    if (!selectedProd) {
      alert("Please choose a valid machine.");
      return;
    }

    setSubmitting(true);
    try {
      const offerId = `flash_${selectedProd.id}`;
      const payload: FlashOffer = {
        id: offerId,
        productId: selectedProd.id,
        productName: selectedProd.name,
        originalPrice: Number(selectedProd.price),
        flashPrice: Number(formData.flashPrice),
        discountBadge: formData.discountBadge,
        headline: formData.headline,
        expiresAt: formData.expiresAt,
        active: true,
        image: selectedProd.image,
      };

      await setDoc(doc(db, "flash_offers", offerId), payload);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert("Failed to publish flash promotion: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm("Remove this equipment from active flash sale?")) return;
    try {
      await deleteDoc(doc(db, "flash_offers", offerId));
    } catch (err) {
      console.error("Failed to delete flash offer:", err);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-200 animate-fadeIn font-sans">
      {/* Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-[#0066CC] dark:text-blue-400 uppercase tracking-wider">PROMOTIONS & DISCOUNT CAMPAIGNS</span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Flash Sales & Discount Deals</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage high-visibility discount banners and countdown deals displayed on the client storefront.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer self-start md:self-auto min-h-[40px]"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Launch Flash Deal</span>
        </button>
      </div>

      {/* Active Flash Deals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-500 dark:text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#0066CC] mx-auto mb-2" />
            <span>Loading active campaigns...</span>
          </div>
        ) : offers.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 sm:p-12 text-center text-slate-500 dark:text-slate-400">
            <Zap className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Active Flash Sales</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Launch a limited-time equipment discount to drive immediate contractor conversions.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Deal</span>
            </button>
          </div>
        ) : (
          offers.map((offer) => {
            const savings = (offer.originalPrice || 0) - (offer.flashPrice || 0);

            return (
              <div
                key={offer.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/60 rounded-3xl p-5 sm:p-6 shadow-xs transition-all relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold">
                      <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400" />
                      {offer.discountBadge || "PROMO"}
                    </span>

                    <button
                      onClick={() => handleDeleteOffer(offer.id)}
                      className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                      title="End Promotion"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                      <img
                        src={offer.image || "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&q=80&w=200"}
                        alt={offer.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">
                        {offer.productName}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {offer.headline}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 space-y-1.5 mb-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Regular Store Price:</span>
                      <span className="text-slate-400 dark:text-slate-500 line-through font-mono">
                        KES {Number(offer.originalPrice).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-800 dark:text-slate-200 font-bold">Promotional Flash Price:</span>
                      <span className="text-sm font-extrabold text-[#0066CC] dark:text-blue-400 font-mono">
                        KES {Number(offer.flashPrice).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-bold">
                      <span>Buyer Saves:</span>
                      <span>KES {savings.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>Ends: {offer.expiresAt || "Ongoing"}</span>
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active on Web</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Flash Sale Modal (Centered, no page scroll needed) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-8 shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-[#0066CC] dark:text-blue-400 uppercase tracking-wider">NEW CAMPAIGN</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Launch Machinery Flash Offer</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Select Machine *</label>
                <select
                  value={formData.productId}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none cursor-pointer min-h-[40px]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (KES {Number(p.price).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Flash Price (KES) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.flashPrice}
                    onChange={(e) => setFormData({ ...formData, flashPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none min-h-[40px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Discount Badge</label>
                  <input
                    type="text"
                    value={formData.discountBadge}
                    onChange={(e) => setFormData({ ...formData, discountBadge: e.target.value })}
                    placeholder="e.g. 20% OFF"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none min-h-[40px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Promotion Headline</label>
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  placeholder="e.g. SPECIAL WORKSHOP CLEARANCE OFFER"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Expiration Date</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none min-h-[40px]"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer min-h-[38px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 min-h-[38px]"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  <span>Publish Flash Offer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
