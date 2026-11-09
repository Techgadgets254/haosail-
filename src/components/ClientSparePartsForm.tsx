import React, { useState, useEffect } from "react";
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Loader2,
  Package,
  MapPin,
  Phone,
  User,
  Mail,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Plus,
  Search,
  Check,
  ChevronRight,
  Info,
  Layers,
  History,
  FileText
} from "lucide-react";
import { collection, addDoc, onSnapshot, query, where, orderBy, doc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useStore } from "../StoreContext";
import { Order, Product, SparePartsRequest, UserProfile } from "../types";

export interface ClientSparePartsFormProps {
  orders?: Order[];
  products?: Product[];
  user?: any;
  userProfile?: UserProfile | null;
  initialSelectedProduct?: {
    name: string;
    id?: string;
    image?: string;
    orderId?: string;
    purchaseDate?: string;
  } | null;
  prefilledMachine?: {
    name: string;
    id?: string;
    image?: string;
    orderId?: string;
    purchaseDate?: string;
  } | null;
  onClearInitialProduct?: () => void;
  onClearPrefill?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

const COMMON_PART_SUGGESTIONS = [
  "Hydraulic Cylinder Seal Kit",
  "Lifting Cable / Wire Rope (10-12mm)",
  "Air Filter / Oil Filter Element",
  "Electric Motor Capacitor / Switch",
  "Tyre Changer Jaw Clamps & Plastic Protectors",
  "3D Wheel Alignment Sensor / Clamp Pins",
  "Sliding Table Saw Blade & Rip Fence Lock",
  "Air Compressor Piston Rings & Pressure Switch",
  "Hydraulic Hose / Quick Coupler Assembly",
  "Safety Locking Pin & Solenoid Valve"
];

export default function ClientSparePartsForm({
  orders: propOrders,
  products: propProducts,
  user: propUser,
  userProfile: propUserProfile,
  initialSelectedProduct,
  prefilledMachine,
  onClearInitialProduct,
  onClearPrefill,
  onNavigateToTab
}: ClientSparePartsFormProps) {
  const store = useStore();
  const orders = propOrders || store.orders || [];
  const products = propProducts || store.products || [];
  const user = propUser || store.user;
  const userProfile = propUserProfile !== undefined ? propUserProfile : store.userProfile;

  const targetInitialProduct = prefilledMachine || initialSelectedProduct;

  const [activeSubTab, setActiveSubTab] = useState<"new_request" | "history">("new_request");
  
  // Form fields
  const [selectedItemKey, setSelectedItemKey] = useState<string>("");
  const [customMachineName, setCustomMachineName] = useState<string>("");
  const [partName, setPartName] = useState<string>("");
  const [partNumber, setPartNumber] = useState<string>("");
  const [partDescription, setPartDescription] = useState<string>("");
  const [machineSerialNumber, setMachineSerialNumber] = useState<string>("");
  const [workshopLocation, setWorkshopLocation] = useState<string>(
    userProfile?.company || userProfile?.garageName || userProfile?.address || ""
  );
  const [userPhone, setUserPhone] = useState<string>(
    userProfile?.phone || ""
  );
  const [urgency, setUrgency] = useState<"routine" | "preventive" | "urgent" | "machine_down">("routine");
  const [quantity, setQuantity] = useState<number>(1);
  const [photoUrl, setPhotoUrl] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [lastSubmittedId, setLastSubmittedId] = useState<string>("");

  // Customer's requests history
  const [myRequests, setMyRequests] = useState<SparePartsRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Extract previously bought items from customer orders
  const previouslyBoughtItems = React.useMemo(() => {
    const itemsList: Array<{
      key: string;
      productId: string;
      productName: string;
      productImage?: string;
      orderId: string;
      purchaseDate: string;
      quantity: number;
    }> = [];

    const seen = new Set<string>();

    orders.forEach((order) => {
      const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-KE") : "";
      if (Array.isArray(order.items)) {
        order.items.forEach((it, idx) => {
          const key = `${order.id || "order"}_${it.id || it.name}_${idx}`;
          const dedupKey = `${it.name}_${order.id}`;
          if (!seen.has(dedupKey)) {
            seen.add(dedupKey);
            itemsList.push({
              key,
              productId: it.id || "",
              productName: it.name,
              productImage: it.image,
              orderId: order.id || "",
              purchaseDate: orderDate,
              quantity: it.quantity || 1
            });
          }
        });
      }
    });

    return itemsList;
  }, [orders]);

  // Handle initial preselected product
  useEffect(() => {
    if (targetInitialProduct) {
      const matched = previouslyBoughtItems.find(
        (b) => b.productName.toLowerCase() === targetInitialProduct.name.toLowerCase() ||
               (targetInitialProduct.orderId && b.orderId === targetInitialProduct.orderId)
      );

      if (matched) {
        setSelectedItemKey(matched.key);
      } else {
        setSelectedItemKey("custom");
        setCustomMachineName(targetInitialProduct.name);
      }
      setActiveSubTab("new_request");
    }
  }, [targetInitialProduct, previouslyBoughtItems]);

  // Auto-populate phone and workshop location if available from userProfile
  useEffect(() => {
    if (userProfile) {
      if (!userPhone && userProfile.phone) {
        setUserPhone(userProfile.phone);
      }
      if (!workshopLocation && (userProfile.address || userProfile.company || userProfile.garageName)) {
        setWorkshopLocation(userProfile.company || userProfile.garageName || userProfile.address || "");
      }
    }
  }, [userProfile]);

  // Real-time listener for user's own spare parts requests
  useEffect(() => {
    if (!user) {
      setLoadingRequests(false);
      return;
    }

    try {
      const colRef = collection(db, "spare_parts_requests");
      const unsub = onSnapshot(colRef, (snapshot) => {
        const list: SparePartsRequest[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as any;
          // Filter client side if necessary by userId or email
          const matchesUser = data.userId === user.uid ||
            (data.userEmail && user.email && data.userEmail.toLowerCase() === user.email.toLowerCase());

          if (matchesUser) {
            list.push({ id: d.id, ...data });
          }
        });

        list.sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        });

        setMyRequests(list);
        setLoadingRequests(false);
      }, (err) => {
        console.warn("Could not fetch user spare parts requests:", err);
        setLoadingRequests(false);
      });

      return () => unsub();
    } catch (e) {
      console.error(e);
      setLoadingRequests(false);
    }
  }, [user]);

  // Selected item object
  const currentSelectedItem = previouslyBoughtItems.find((b) => b.key === selectedItemKey);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to submit a spare parts request.");
      return;
    }

    const machineName = currentSelectedItem ? currentSelectedItem.productName : customMachineName.trim();
    if (!machineName) {
      alert("Please select a previously purchased machine or enter your machinery model.");
      return;
    }

    if (!partDescription.trim()) {
      alert("Please provide a description of the spare part or breakdown symptoms.");
      return;
    }

    setSubmitting(true);
    try {
      const newRequest: Omit<SparePartsRequest, "id"> = {
        userId: user.uid || "guest_user",
        userName: userProfile?.name || user.displayName || user.email?.split("@")[0] || "HaoSail Customer",
        userEmail: user.email || "customer@haosail.ke",
        userPhone: userPhone.trim() || undefined,
        orderId: currentSelectedItem?.orderId || undefined,
        productId: currentSelectedItem?.productId || undefined,
        productName: machineName,
        productImage: currentSelectedItem?.productImage || undefined,
        purchaseDate: currentSelectedItem?.purchaseDate || undefined,
        partName: partName.trim() || undefined,
        partNumber: partNumber.trim() || undefined,
        partDescription: partDescription.trim(),
        machineSerialNumber: machineSerialNumber.trim() || undefined,
        workshopLocation: workshopLocation.trim() || undefined,
        urgency,
        quantity: Math.max(1, quantity),
        photoUrl: photoUrl.trim() || undefined,
        status: "submitted",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "spare_parts_requests"), newRequest);
      setLastSubmittedId(docRef.id);
      setSubmitSuccess(true);

      // Reset form
      setPartName("");
      setPartNumber("");
      setPartDescription("");
      setMachineSerialNumber("");
      setQuantity(1);
      setPhotoUrl("");
      if (onClearInitialProduct) onClearInitialProduct();
    } catch (err: any) {
      console.error("Failed to submit spare parts request:", err);
      alert("Could not submit request: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getUrgencyBadge = (urg: string) => {
    switch (urg) {
      case "machine_down":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-200">
            <ShieldAlert className="w-3 h-3 text-red-600" />
            Machine Down (Emergency)
          </span>
        );
      case "urgent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Urgent Repair
          </span>
        );
      case "preventive":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-[#0066CC] border border-blue-200">
            <Clock className="w-3 h-3 text-[#0066CC]" />
            Preventive Replacement
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
            <Wrench className="w-3 h-3 text-slate-500" />
            Routine Maintenance
          </span>
        );
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "fulfilled":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Fulfilled
          </span>
        );
      case "dispatched":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-[#0066CC] border border-blue-200 flex items-center gap-1">
            <Package className="w-3 h-3 text-[#0066CC]" />
            Dispatched / Ready at Depot
          </span>
        );
      case "quoted":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-600" />
            Quotation Ready
          </span>
        );
      case "under_review":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            Sourcing Parts
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-[#0066CC] border border-blue-200 flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#0066CC]" />
            Submitted / In Queue
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-[#0066CC] uppercase tracking-wider">AFTER-SALES & MAINTENANCE PORTAL</span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">Request Genuine Spare Parts & Maintenance</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Select your previously purchased machinery below to request factory OEM replacement parts, hydraulic seal kits, cables, electrical components, or technical repair dispatch.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => {
              setActiveSubTab("new_request");
              setSubmitSuccess(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "new_request"
                ? "bg-[#0066CC] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Request</span>
          </button>

          <button
            onClick={() => setActiveSubTab("history")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "history"
                ? "bg-[#0066CC] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>My Requests ({myRequests.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: SUBMIT NEW REQUEST */}
      {activeSubTab === "new_request" && (
        <div className="space-y-6">
          {submitSuccess ? (
            <div className="bg-white border border-emerald-200 rounded-3xl p-8 sm:p-10 text-center shadow-xs space-y-4 animate-scaleUp">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">REQUEST LOGGED SUCCESSFULLY</span>
                <h3 className="text-xl font-black text-slate-900 mt-1">Spare Parts Request Submitted</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Your reference ID is <strong className="font-mono text-slate-900">#{lastSubmittedId.substring(0, 8).toUpperCase()}</strong>. Our technical parts division at Enterprise Road, Nairobi will review stock blueprints and follow up promptly.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveSubTab("history")}
                  className="bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>View Live Request Status</span>
                </button>

                <button
                  onClick={() => setSubmitSuccess(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs transition-all border border-slate-200 cursor-pointer"
                >
                  Submit Another Part Request
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* STEP 1: Select Machinery */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#0066CC] text-white text-xs font-bold flex items-center justify-center">1</span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Select Machinery Requiring Maintenance / Parts
                    </h3>
                  </div>
                  {previouslyBoughtItems.length > 0 && (
                    <span className="text-[11px] font-bold text-[#0066CC]">
                      {previouslyBoughtItems.length} Registered Purchased Machine{previouslyBoughtItems.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {previouslyBoughtItems.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">
                      Click to choose one of your previously purchased machines from HaoSail:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {previouslyBoughtItems.map((item) => {
                        const isSelected = selectedItemKey === item.key;
                        return (
                          <div
                            key={item.key}
                            onClick={() => {
                              setSelectedItemKey(item.key);
                              setCustomMachineName("");
                            }}
                            className={`border rounded-2xl p-3.5 flex items-start gap-3 transition-all cursor-pointer ${
                              isSelected
                                ? "bg-blue-50/60 border-[#0066CC] ring-2 ring-[#0066CC]/20 shadow-xs"
                                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                            }`}
                          >
                            <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center p-1">
                              {item.productImage ? (
                                <img
                                  src={item.productImage}
                                  alt={item.productName}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.target as any).style.display = "none";
                                  }}
                                />
                              ) : (
                                <Package className="w-6 h-6 text-slate-400" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-mono text-slate-400">
                                  Order #{item.orderId.substring(0, 6).toUpperCase()}
                                </span>
                                {isSelected && (
                                  <span className="w-4 h-4 rounded-full bg-[#0066CC] text-white flex items-center justify-center">
                                    <Check className="w-2.5 h-2.5" />
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">
                                {item.productName}
                              </h4>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Purchased: {item.purchaseDate}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Custom Machine Option Card */}
                      <div
                        onClick={() => setSelectedItemKey("custom")}
                        className={`border rounded-2xl p-3.5 flex items-center gap-3 transition-all cursor-pointer ${
                          selectedItemKey === "custom"
                            ? "bg-blue-50/60 border-[#0066CC] ring-2 ring-[#0066CC]/20 shadow-xs"
                            : "bg-slate-50 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="w-14 h-14 rounded-xl bg-slate-200/70 border border-slate-300 shrink-0 flex items-center justify-center text-slate-600">
                          <Wrench className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900">
                            Other Machinery / Model
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Specify another HaoSail model manually
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedItemKey === "custom" && (
                      <div className="pt-2 animate-fadeIn">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Machinery Model / Equipment Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. HaoSail 4.5 Ton 2-Post Clearfloor Hydraulic Lift (Model HS-CL45)"
                          value={customMachineName}
                          onChange={(e) => setCustomMachineName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-[#0066CC] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">No purchase history recorded under this account.</span>
                        <p className="text-[11px] text-blue-800 mt-0.5">
                          You can still request spare parts or maintenance service by entering your machine model or selecting from our machinery catalog below.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Machinery Model / Equipment Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. HaoSail 4.5 Ton Hydraulic 2-Post Lift, 3D Wheel Aligner, Tyre Changer..."
                        value={customMachineName}
                        onChange={(e) => setCustomMachineName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 2: Spare Part Specifications & Problem Report */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#0066CC] text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Part Specifications & Breakdown Details
                  </h3>
                </div>

                {/* Common suggestions chip strip */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Quick Suggestions (Click to fill):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_PART_SUGGESTIONS.map((suggestion) => (
                      <button
                        type="button"
                        key={suggestion}
                        onClick={() => setPartName(suggestion)}
                        className="bg-slate-100 hover:bg-blue-50 hover:text-[#0066CC] hover:border-blue-200 border border-slate-200 text-slate-700 text-[10px] font-medium px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                      >
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Part / Component Name Needed *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hydraulic Cylinder Oil Seal Kit / Main Motor Switch"
                      value={partName}
                      onChange={(e) => setPartName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Part Number / OEM Code (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. HS-SK-4500 or stamped part code"
                      value={partNumber}
                      onChange={(e) => setPartNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Machine Serial Number / Frame Tag (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. HS-2024-8839 (Found on machinery metal nameplate)"
                      value={machineSerialNumber}
                      onChange={(e) => setMachineSerialNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Quantity Required
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 bg-slate-50 border border-slate-300 focus:border-[#0066CC] rounded-xl py-2 text-center text-xs font-bold text-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Urgency Level Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Urgency & Operational Impact *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setUrgency("routine")}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        urgency === "routine"
                          ? "bg-slate-100 border-slate-400 ring-2 ring-slate-400/20"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-900 block">Routine</span>
                      <span className="text-[10px] text-slate-500">Scheduled maintenance overhaul</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUrgency("preventive")}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        urgency === "preventive"
                          ? "bg-blue-50 border-[#0066CC] ring-2 ring-[#0066CC]/20"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-xs font-bold text-[#0066CC] block">Preventive</span>
                      <span className="text-[10px] text-slate-500">Worn, replacing before failure</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUrgency("urgent")}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        urgency === "urgent"
                          ? "bg-amber-50 border-amber-400 ring-2 ring-amber-400/20"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-xs font-bold text-amber-700 block">Urgent Repair</span>
                      <span className="text-[10px] text-slate-500">Production slowed down</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUrgency("machine_down")}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        urgency === "machine_down"
                          ? "bg-red-50 border-red-500 ring-2 ring-red-500/20 animate-pulse"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-xs font-extrabold text-red-700 block flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                        Machine Down
                      </span>
                      <span className="text-[10px] text-slate-500">Total stoppage / Priority 1</span>
                    </button>
                  </div>
                </div>

                {/* Problem Description */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Describe Symptoms / Specific Breakdown Reason *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide details about the issue: e.g., Oil leaking from right cylinder seal, motor humming without turning, cable showing frayed strands, error code on display screen..."
                    value={partDescription}
                    onChange={(e) => setPartDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Photo URL */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Photo URL or Image Reference (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/broken-part-photo.jpg"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    You can paste a link to a photo of the damaged component or nameplate to speed up part matching.
                  </span>
                </div>
              </div>

              {/* STEP 3: Delivery Location & Contact Person */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#0066CC] text-white text-xs font-bold flex items-center justify-center">3</span>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Workshop Location & Contact Dispatch
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Contact Phone / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0712 345 678 or 2547XXXXXXXX"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Workshop Site / Physical Delivery Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Enterprise Road, Industrial Area, Nairobi / Nyali, Mombasa"
                      value={workshopLocation}
                      onChange={(e) => setWorkshopLocation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-blue-50/60 border border-blue-200 rounded-3xl p-5 shadow-xs">
                <div className="text-xs text-blue-950 space-y-0.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#0066CC]" />
                    HaoSail Genuine Factory Guarantee
                  </p>
                  <p className="text-[11px] text-blue-800">
                    All replacement components are precision-engineered to factory tolerance with guaranteed fitment.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto bg-[#0066CC] hover:bg-[#0052A3] text-white font-sans text-xs font-bold px-8 py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transmitting Blueprint Request...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Spare Parts Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* VIEW 2: MY REQUESTS HISTORY & TRACKING */}
      {activeSubTab === "history" && (
        <div className="space-y-4">
          {loadingRequests ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
              <Loader2 className="w-8 h-8 text-[#0066CC] animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Loading your spare parts requests...</p>
            </div>
          ) : myRequests.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0066CC] flex items-center justify-center mx-auto border border-blue-100">
                <Wrench className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">No Spare Parts Requests Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You have not submitted any spare parts or repair requests. Click below to submit your first request for your purchased equipment.
              </p>
              <button
                onClick={() => setActiveSubTab("new_request")}
                className="mt-2 bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold px-5 py-2.5 rounded-xl text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Submit Spare Part Request</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myRequests.map((req) => {
                const whatsappMsg = encodeURIComponent(
                  `Hello HaoSail Technical Support, I am following up on my Spare Parts Request #${(req.id || "").substring(0, 8).toUpperCase()} for ${req.productName} (${req.partName || "Replacement Part"}).`
                );

                return (
                  <div
                    key={req.id}
                    className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 hover:border-slate-300 transition-all"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            #{ (req.id || "").substring(0, 8).toUpperCase() }
                          </span>
                          {getUrgencyBadge(req.urgency)}
                          {getStatusBadge(req.status)}
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                          {req.productName}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/254718718888?text=${whatsappMsg}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp Support</span>
                        </a>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                      <div className="md:col-span-8 space-y-3">
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Wrench className="w-3.5 h-3.5 text-[#0066CC]" />
                              {req.partName || "Component Needed"}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              Qty: <strong className="text-slate-900">{req.quantity || 1}</strong>
                            </span>
                          </div>

                          <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-line">
                            {req.partDescription}
                          </p>

                          {(req.partNumber || req.machineSerialNumber) && (
                            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200 text-[11px] font-mono text-slate-500">
                              {req.partNumber && <span>Part Code: <strong className="text-slate-800">{req.partNumber}</strong></span>}
                              {req.machineSerialNumber && <span>Serial No: <strong className="text-slate-800">{req.machineSerialNumber}</strong></span>}
                            </div>
                          )}
                        </div>

                        {/* Support / Admin Remarks */}
                        {req.adminNotes && (
                          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 text-xs text-blue-950">
                            <span className="font-bold uppercase tracking-wider text-[10px] text-[#0066CC] block mb-1">
                              HaoSail Technical Team Response:
                            </span>
                            <p className="text-slate-700 leading-relaxed">{req.adminNotes}</p>
                          </div>
                        )}
                      </div>

                      {/* Side Status & Pricing */}
                      <div className="md:col-span-4 space-y-3">
                        {req.quoteAmount ? (
                          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 text-center space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                              Official Quote
                            </span>
                            <p className="text-xl font-black text-emerald-700">
                              KES {Number(req.quoteAmount).toLocaleString()}
                            </p>
                            <p className="text-[10px] text-emerald-600">
                              Genuine OEM Part with Warranty
                            </p>
                          </div>
                        ) : (
                          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center text-slate-500 space-y-1">
                            <Clock className="w-5 h-5 mx-auto text-slate-400" />
                            <span className="text-[11px] font-bold block text-slate-700">Pricing Under Review</span>
                            <p className="text-[10px]">Technical team checking warehouse stock</p>
                          </div>
                        )}

                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-[11px] space-y-1 text-slate-600">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Submitted On</span>
                          <p className="font-mono text-slate-800">
                            {req.createdAt ? new Date(req.createdAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }) : ""}
                          </p>
                          {req.workshopLocation && (
                            <p className="pt-1 text-slate-500 border-t border-slate-200/60">
                              Site: <strong className="text-slate-700">{req.workshopLocation}</strong>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
