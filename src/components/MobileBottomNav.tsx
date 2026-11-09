import React from "react";
import { useStore } from "../StoreContext";
import { 
  Home, 
  Package, 
  ShoppingBag, 
  Heart, 
  User,
  SlidersHorizontal,
  PhoneCall
} from "lucide-react";
import { motion } from "motion/react";

export default function MobileBottomNav() {
  const { 
    activeView, 
    setActiveView, 
    cart, 
    wishlist, 
    user, 
    setIsAuthModalOpen, 
    setAuthModalMode,
    setSearchQuery
  } = useStore();

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const navItems = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      action: () => {
        setSearchQuery("");
        setActiveView("home");
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      isActive: activeView === "home"
    },
    {
      id: "shop",
      label: "Machinery",
      icon: Package,
      action: () => {
        setActiveView("shop");
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      isActive: activeView === "shop" || activeView === "product-details",
      badge: null
    },
    {
      id: "cart",
      label: "Quotation",
      icon: ShoppingBag,
      action: () => {
        setActiveView("checkout");
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      isActive: activeView === "checkout",
      badge: cartItemCount > 0 ? cartItemCount : null
    },
    {
      id: "saved",
      label: "Saved",
      icon: Heart,
      action: () => {
        setActiveView("client-dashboard");
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      isActive: activeView === "client-dashboard",
      badge: wishlist.length > 0 ? wishlist.length : null
    },
    {
      id: "account",
      label: user ? "Account" : "Sign In",
      icon: User,
      action: () => {
        if (user) {
          setActiveView("client-dashboard");
        } else {
          setAuthModalMode("login");
          setIsAuthModalOpen(true);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      isActive: activeView === "client-dashboard" && !user
    }
  ];

  return (
    <nav 
      id="mobile-bottom-navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-lg border-t border-slate-200 shadow-2xl px-2 py-1.5 pb-[max(env(safe-area-inset-bottom,0.6rem),0.6rem)] select-none"
    >
      <div className="grid grid-cols-5 gap-1 items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer min-h-[46px] ${
                active 
                  ? "text-[#0055B8] font-bold" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {/* Active subtle indicator pill */}
              {active && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute -top-1.5 w-7 h-1 bg-[#0055B8] rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
                
                {/* Notification / Counter Badge */}
                {item.badge !== null && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#0055B8] text-white text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full min-w-[17px] h-[17px] flex items-center justify-center shadow-xs border border-white">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] mt-0.5 tracking-tight font-sans truncate max-w-full ${
                active ? "font-bold text-[#0055B8]" : "font-medium text-slate-600"
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
