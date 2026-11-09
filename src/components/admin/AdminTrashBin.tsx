import React, { useState, useEffect } from "react";
import { 
  Trash2, 
  RotateCcw, 
  AlertTriangle, 
  Package, 
  Loader2, 
  Search, 
  ShieldAlert,
  CheckCircle2
} from "lucide-react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "../../firebase";
import { Product } from "../../types";

export default function AdminTrashBin() {
  const [trashItems, setTrashItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, "trash"), (snap) => {
        const list: any[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });
        list.sort((a, b) => {
          const tA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
          const tB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
          return tB - tA;
        });
        setTrashItems(list);
        setLoading(false);
      }, (err) => {
        console.warn("Trash snapshot error:", err);
        setLoading(false);
      });
      return () => unsub();
    } catch (e) {
      setLoading(false);
    }
  }, []);

  // Restore single item
  const handleRestore = async (item: any) => {
    setActionInProgress(true);
    try {
      const prodData = { ...item };
      delete prodData.deletedAt;
      delete prodData.deletedBy;
      delete prodData.id;

      // Put back in products
      await setDoc(doc(db, "products", item.id), prodData);
      // Remove from trash
      await deleteDoc(doc(db, "trash", item.id));
    } catch (err: any) {
      console.error(err);
      alert("Failed to restore machine: " + err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  // Permanently delete single item
  const handlePermanentDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete "${name}"? This action cannot be undone.`)) return;
    setActionInProgress(true);
    try {
      await deleteDoc(doc(db, "trash", id));
    } catch (err: any) {
      console.error(err);
      alert("Failed to permanently delete item: " + err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  // Empty entire trash
  const handleEmptyTrash = async () => {
    if (trashItems.length === 0) return;
    if (!confirm(`Permanently purge ALL ${trashItems.length} deleted items from database?`)) return;

    setActionInProgress(true);
    try {
      const batch = writeBatch(db);
      trashItems.forEach((it) => {
        batch.delete(doc(db, "trash", it.id));
      });
      await batch.commit();
    } catch (err: any) {
      console.error(err);
      alert("Failed to empty trash: " + err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  const filtered = trashItems.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    return !q || (
      (item.name || "").toLowerCase().includes(q) ||
      (item.brand || "").toLowerCase().includes(q) ||
      (item.category || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-200 animate-fadeIn font-sans">
      {/* Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">RECOVERY & ARCHIVE</span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Machinery Trash Bin</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Safely restore accidentally removed machinery or permanently purge records.
          </p>
        </div>

        {trashItems.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            disabled={actionInProgress}
            className="bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer self-start md:self-auto disabled:opacity-50 min-h-[40px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Empty Entire Trash ({trashItems.length})</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search deleted machinery items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none min-h-[40px]"
          />
        </div>
      </div>

      {/* Loading & Empty States */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center text-slate-500 dark:text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-[#0066CC] mx-auto mb-2" />
          <span>Loading trash items...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center text-slate-500 dark:text-slate-400">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="font-medium">Trash bin is clean. No deleted machinery records.</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards (Phones) */}
          <div className="md:hidden space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                    <img
                      src={item.image || "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&q=80&w=150"}
                      alt={item.name}
                      className="w-full h-full object-cover grayscale opacity-70"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs line-clamp-1">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {item.category || "Machinery"}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">ID: {item.id}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Deleted price: </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      KES {(Number(item.price) || 0).toLocaleString()}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                    {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString("en-KE", {
                      day: "2-digit",
                      month: "short"
                    }) : "Recently"}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleRestore(item)}
                    disabled={actionInProgress}
                    className="flex-1 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[36px]"
                    title="Restore to Live Catalog"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    <span>Restore</span>
                  </button>

                  <button
                    onClick={() => handlePermanentDelete(item.id, item.name)}
                    disabled={actionInProgress}
                    className="flex-1 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[36px]"
                    title="Purge permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (hidden on mobile, visible on md+) */}
          <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-[11px] font-sans font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">DELETED MACHINERY ITEM</th>
                    <th className="py-3.5 px-4">CATEGORY</th>
                    <th className="py-3.5 px-4">ORIGINAL PRICE</th>
                    <th className="py-3.5 px-4">DELETED AT</th>
                    <th className="py-3.5 px-4 text-right">RECOVERY ACTIONS</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-sans">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Item details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                            <img
                              src={item.image || "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&q=80&w=150"}
                              alt={item.name}
                              className="w-full h-full object-cover grayscale opacity-70"
                            />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</h4>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">ID: {item.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[11px] font-semibold">
                          {item.category || "Machinery"}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        KES {(Number(item.price) || 0).toLocaleString()}
                      </td>

                      {/* Deleted Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString("en-KE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        }) : "Recently"}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRestore(item)}
                            disabled={actionInProgress}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            title="Restore to Live Catalog"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                            <span>Restore</span>
                          </button>

                          <button
                            onClick={() => handlePermanentDelete(item.id, item.name)}
                            disabled={actionInProgress}
                            className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            title="Purge permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
