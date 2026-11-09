import React from "react";
import { useStore } from "../StoreContext";
import { GitCompare, X, Trash2, ArrowRight } from "lucide-react";

export default function FloatingCompareBar() {
  const { 
    compareList, 
    toggleCompare, 
    clearCompareList, 
    setIsCompareOverlayOpen 
  } = useStore();

  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-blue-200 dark:border-blue-900/60 rounded-2xl p-3 sm:p-4 shadow-2xl animate-slideUp font-sans text-slate-900 dark:text-white flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#0055B8] dark:text-blue-400 shrink-0">
          <GitCompare className="w-4 h-4" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-900 dark:text-white">Compare Machinery</span>
            <span className="bg-[#0055B8] text-white font-mono font-extrabold text-[9px] px-2 py-0.5 rounded-full">
              {compareList.length}/3 Selected
            </span>
          </div>

          <div className="flex gap-1.5 mt-1 overflow-x-auto">
            {compareList.map((product) => (
              <div 
                key={product.id}
                className="relative group bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 flex items-center gap-1 shrink-0"
              >
                <img 
                  src={product.image} 
                  alt={product.name} 
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 object-contain" 
                />
                <span className="text-[10px] font-mono text-slate-800 dark:text-slate-200 max-w-[70px] truncate hidden sm:inline">
                  {product.brand}
                </span>
                <button
                  type="button"
                  onClick={() => toggleCompare(product)}
                  className="text-slate-400 hover:text-red-500 p-0.5 cursor-pointer"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={clearCompareList}
          className="text-slate-500 hover:text-red-500 dark:text-slate-400 text-[10px] font-mono px-2 py-1 transition-colors cursor-pointer hidden sm:block"
        >
          Clear
        </button>

        <button
          type="button"
          onClick={() => setIsCompareOverlayOpen(true)}
          className="bg-[#0055B8] hover:bg-[#004494] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
        >
          <span>Compare Specs</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
