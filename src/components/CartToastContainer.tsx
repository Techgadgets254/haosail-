/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "../StoreContext";
import { ShoppingBag, X, Check } from "lucide-react";

export default function CartToastContainer() {
  const { cartToasts, dismissCartToast, setActiveView } = useStore();

  return (
    <div className="fixed top-20 right-4 z-[999] pointer-events-none flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0">
      <AnimatePresence>
        {cartToasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: -10, scale: 0.95, x: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="pointer-events-auto w-full bg-white border border-slate-200 rounded-2xl p-4 shadow-xl flex items-start gap-3 relative overflow-hidden group font-sans text-left"
          >
            {/* Success check badge */}
            <div className="bg-blue-50 text-[#0066CC] border border-blue-100 p-2 rounded-xl shrink-0 flex items-center justify-center">
              <Check className="h-4 w-4" />
            </div>

            {/* Product image */}
            <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
              <img
                src={toast.productImage}
                alt={toast.productName}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Title & info description */}
            <div className="flex-1 min-w-0 pr-4">
              <h4 className="text-slate-900 text-xs font-bold truncate">
                Added to Cart
              </h4>
              <p className="text-slate-600 text-[11px] mt-0.5 truncate">
                {toast.productName}
              </p>
              <div className="flex items-center justify-between mt-2.5">
                <span className="text-[#0066CC] font-mono text-xs font-bold">
                  KES {toast.price.toLocaleString()}
                </span>
                <button
                  onClick={() => setActiveView("checkout")}
                  className="flex items-center gap-1 text-[10px] font-sans font-bold uppercase tracking-wider text-white bg-[#0066CC] hover:bg-[#0052A3] transition-colors cursor-pointer px-2.5 py-1 rounded-lg shadow-xs"
                >
                  <ShoppingBag className="h-3 w-3" />
                  <span>View Order</span>
                </button>
              </div>
            </div>

            {/* Dismiss trigger */}
            <button
              onClick={() => dismissCartToast(toast.id)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-1"
              title="Close notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
