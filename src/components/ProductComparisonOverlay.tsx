import React, { useState } from "react";
import { useStore } from "../StoreContext";
import { Product } from "../types";
import { stripMarkdownSymbols } from "../lib/cleanAiMarkdown";
import { 
  X, 
  GitCompare, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  AlertCircle, 
  Star, 
  ChevronRight,
  HelpCircle,
  CheckCircle2,
  Bell
} from "lucide-react";

export default function ProductComparisonOverlay() {
  const { 
    compareList, 
    toggleCompare, 
    clearCompareList, 
    isCompareOverlayOpen, 
    setIsCompareOverlayOpen,
    products,
    addToCart,
    registerProductRestockRequest
  } = useStore();

  const [selectedProductToAdd, setSelectedProductToAdd] = useState("");
  const [restockModalProduct, setRestockModalProduct] = useState<Product | null>(null);
  const [restockEmail, setRestockEmail] = useState("");
  const [restockPhone, setRestockPhone] = useState("");
  const [restockSuccess, setRestockSuccess] = useState(false);

  if (!isCompareOverlayOpen) return null;

  // Filter out products already in compare list
  const availableProducts = products.filter(
    (p) => !compareList.some((cp) => cp.id === p.id)
  );

  const handleAddProductFromDropdown = (prodId: string) => {
    if (!prodId) return;
    const found = products.find((p) => p.id === prodId);
    if (found) {
      if (compareList.length >= 3) {
        alert("You can compare up to 3 products side-by-side.");
        return;
      }
      toggleCompare(found);
      setSelectedProductToAdd("");
    }
  };

  // Collect all unique specification keys across selected products
  const allSpecKeys = Array.from(
    new Set(
      compareList.flatMap((p) => Object.keys(p.specifications || {}))
    )
  );

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalProduct || !restockEmail) return;

    if (registerProductRestockRequest) {
      registerProductRestockRequest(
        restockModalProduct.id,
        restockModalProduct.name,
        restockModalProduct.image,
        restockEmail,
        restockPhone
      );
    }

    setRestockSuccess(true);
    setTimeout(() => {
      setRestockSuccess(false);
      setRestockModalProduct(null);
      setRestockEmail("");
      setRestockPhone("");
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn font-sans">
      <div 
        className="bg-slate-50 border border-slate-200 rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-white border-b border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0066CC]">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-sans font-extrabold text-lg sm:text-xl text-slate-900">
                  Product Comparison Matrix
                </h2>
                <span className="bg-blue-50 text-[#0066CC] border border-blue-200 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                  {compareList.length} / 3 Items
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                Inspect granular hardware specifications, pricing, and warranty details side-by-side
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Quick add product if less than 3 */}
            {compareList.length < 3 && (
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedProductToAdd}
                  onChange={(e) => handleAddProductFromDropdown(e.target.value)}
                  className="w-full sm:w-60 bg-white border border-slate-200 text-slate-800 rounded-xl text-xs py-2 px-3 focus:outline-hidden focus:border-[#0066CC] font-sans cursor-pointer shadow-2xs"
                >
                  <option value="">+ Add Product to Compare...</option>
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.brand}] {p.name} - KES {p.price.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {compareList.length > 0 && (
              <button
                type="button"
                onClick={clearCompareList}
                className="text-slate-500 hover:text-red-600 text-xs font-mono flex items-center gap-1 transition-colors px-2 py-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCompareOverlayOpen(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl transition-colors cursor-pointer border border-slate-200"
              title="Close Comparison Overlay"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-left">
          {compareList.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
              <GitCompare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-slate-800 font-bold text-base">No Products Selected for Comparison</h3>
              <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
                Select up to 3 items from the catalog or use the dropdown above to populate the specification matrix side-by-side.
              </p>
            </div>
          ) : (
            <>
              {/* Product Cards Header Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[0, 1, 2].map((index) => {
                  const product = compareList[index];

                  if (!product) {
                    return (
                      <div 
                        key={index} 
                        className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full min-h-[220px]"
                      >
                        <Plus className="w-8 h-8 text-slate-300 mb-2" />
                        <span className="text-slate-500 text-xs font-mono">Empty Slot {index + 1}</span>
                        <p className="text-slate-400 text-[11px] mt-1">Select a machine to compare side-by-side</p>
                      </div>
                    );
                  }

                  const isOutOfStock = product.stock <= 0;

                  return (
                    <div 
                      key={product.id} 
                      className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between relative group hover:border-[#0066CC]/50 transition-all shadow-xs"
                    >
                      <button
                        type="button"
                        onClick={() => toggleCompare(product)}
                        className="absolute top-3 right-3 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 p-1.5 rounded-lg transition-colors cursor-pointer z-10 border border-slate-200"
                        title="Remove from comparison"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="space-y-3">
                        <div className="relative h-32 bg-slate-50 rounded-xl p-2 flex items-center justify-center overflow-hidden border border-slate-100">
                          <img 
                            src={product.image} 
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" 
                          />
                        </div>

                        <div>
                          <span className="text-[10px] font-mono font-bold text-[#0066CC] uppercase block">
                            {product.brand}
                          </span>
                          <h4 className="font-sans font-bold text-sm text-slate-900 line-clamp-2 mt-0.5 leading-tight">
                            {product.name}
                          </h4>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-mono font-extrabold text-sm text-[#0066CC]">
                              KES {product.price.toLocaleString()}
                            </span>
                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md uppercase font-bold border ${
                              isOutOfStock 
                                ? "bg-red-50 text-red-600 border-red-200" 
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                              {isOutOfStock ? "Out of Stock" : "In Stock"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-3 border-t border-slate-100 flex gap-2">
                        {isOutOfStock ? (
                          <button
                            type="button"
                            onClick={() => setRestockModalProduct(product)}
                            className="w-full bg-blue-50 hover:bg-blue-100 text-[#0066CC] border border-blue-200 font-sans font-bold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>Notify Me</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(product, 1)}
                            className="w-full bg-[#0066CC] hover:bg-[#0052A3] text-white font-sans font-bold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add to Bag</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detailed Specs Comparison Matrix Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-slate-50 border-b border-slate-200 p-4 font-sans font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-[#0066CC]" />
                  <span>Technical Specifications Matrix</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead>
                      <tr className="border-b border-slate-200 bg-white">
                        <th className="p-3 sm:p-4 font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider w-1/4">
                          Specification Factor
                        </th>
                        {compareList.map((p) => (
                          <th key={p.id} className="p-3 sm:p-4 font-sans font-bold text-slate-900 text-xs border-l border-slate-100 bg-blue-50/40">
                            {p.brand} {p.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* Price Row */}
                      <tr className="bg-slate-50/60">
                        <td className="p-3 sm:p-4 font-mono text-slate-600 font-semibold">
                          Price (KES)
                        </td>
                        {compareList.map((p) => (
                          <td key={p.id} className="p-3 sm:p-4 font-mono font-bold text-[#0066CC] border-l border-slate-100">
                            KES {p.price.toLocaleString()}
                          </td>
                        ))}
                      </tr>

                      {/* Category Row */}
                      <tr>
                        <td className="p-3 sm:p-4 font-mono text-slate-600 font-semibold">
                          Category
                        </td>
                        {compareList.map((p) => (
                          <td key={p.id} className="p-3 sm:p-4 text-slate-800 border-l border-slate-100 font-mono">
                            {p.category}
                          </td>
                        ))}
                      </tr>

                      {/* Stock Status Row */}
                      <tr>
                        <td className="p-3 sm:p-4 font-mono text-slate-600 font-semibold">
                          Availability Status
                        </td>
                        {compareList.map((p) => (
                          <td key={p.id} className="p-3 sm:p-4 border-l border-slate-100 font-mono">
                            <span className={p.stock > 0 ? "text-emerald-700 font-bold" : "text-red-600 font-bold"}>
                              {p.stock > 0 ? `In Stock (${p.stock} units)` : "Out of Stock"}
                            </span>
                          </td>
                        ))}
                      </tr>

                      {/* Dynamic Specs Rows */}
                      {allSpecKeys.map((key) => {
                        const cleanKey = stripMarkdownSymbols(key);
                        const values = compareList.map((p) => p.specifications?.[key] || "—");
                        const areDifferent = new Set(values).size > 1 && values.some(v => v !== "—");

                        return (
                          <tr key={key} className={areDifferent ? "bg-blue-50/30" : ""}>
                            <td className="p-3 sm:p-4 font-mono text-slate-600 font-semibold capitalize flex items-center justify-between">
                              <span>{cleanKey}</span>
                              {areDifferent && (
                                <span className="text-[8px] font-mono text-[#0066CC] bg-blue-100/80 px-1.5 py-0.5 rounded-sm font-bold">
                                  Variant
                                </span>
                              )}
                            </td>
                            {compareList.map((p) => {
                              const rawVal = p.specifications?.[key] || "—";
                              const cleanVal = rawVal === "—" ? "—" : stripMarkdownSymbols(rawVal);
                              return (
                                <td key={p.id} className="p-3 sm:p-4 text-slate-800 border-l border-slate-100 font-sans leading-relaxed">
                                  {cleanVal}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 p-4 sm:p-5 flex items-center justify-between gap-4 shrink-0">
          <span className="text-slate-500 text-xs font-mono">
            Haosail Machinery Kenya • Equipment Specification Comparison
          </span>
          <button
            type="button"
            onClick={() => setIsCompareOverlayOpen(false)}
            className="bg-[#0066CC] hover:bg-[#0052A3] text-white font-sans font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Close Matrix Overlay
          </button>
        </div>
      </div>

      {/* Restock Prompt Modal inside Overlay if triggered */}
      {restockModalProduct && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-left space-y-4">
            <button
              onClick={() => setRestockModalProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0066CC] flex items-center justify-center border border-blue-100">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Notify Me When Restocked</h3>
                <p className="text-slate-500 text-xs">{restockModalProduct.name}</p>
              </div>
            </div>

            {restockSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs space-y-1">
                <p className="font-bold">✓ Request Submitted!</p>
                <p className="text-slate-600">We will alert you on email/WhatsApp immediately when stock is replenished at the depot.</p>
              </div>
            ) : (
              <form onSubmit={handleRestockSubmit} className="space-y-3 pt-2">
                <div>
                  <label className="text-[10px] font-mono text-slate-600 font-bold block mb-1">EMAIL ADDRESS *</label>
                  <input
                    type="email"
                    required
                    value={restockEmail}
                    onChange={(e) => setRestockEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#0066CC]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-600 font-bold block mb-1">WHATSAPP NUMBER (OPTIONAL)</label>
                  <input
                    type="tel"
                    value={restockPhone}
                    onChange={(e) => setRestockPhone(e.target.value)}
                    placeholder="+254 712 345678"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#0066CC]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                >
                  Confirm Restock Notification
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
