import React, { useState, useMemo } from "react";
import { Order, Product } from "../types";
import { 
  Wrench, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Download, 
  MessageSquare, 
  ChevronRight, 
  Package, 
  Layers, 
  Activity,
  Zap,
  RotateCcw,
  Sparkles
} from "lucide-react";
import { jsPDF } from "jspdf";

interface MachineryServiceSchedulesProps {
  orders: Order[];
  products: Product[];
  user: any;
  onNavigateToSpareParts: (prefill?: {
    name: string;
    id?: string;
    image?: string;
    orderId?: string;
    purchaseDate?: string;
  }) => void;
  onNavigateToShop: () => void;
}

interface ServiceMilestone {
  id: string;
  intervalHours: number;
  intervalDays: number;
  title: string;
  category: "Break-In" | "Preventive" | "Major Overhaul" | "Annual Recertification";
  description: string;
  criticalTasks: string[];
  recommendedParts: string[];
  urgency: "due_soon" | "upcoming" | "routine" | "completed";
  dueDaysRemaining: number;
  dueDate: string;
}

interface MachineProfile {
  machineId: string;
  orderId: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  purchaseDate: string;
  warrantyExpiryDate: string;
  isWarrantyActive: boolean;
  estimatedHoursRun: number;
  milestones: ServiceMilestone[];
}

export default function MachineryServiceSchedules({
  orders,
  products,
  user,
  onNavigateToSpareParts,
  onNavigateToShop
}: MachineryServiceSchedulesProps) {
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "due_soon" | "preventive" | "annual">("all");
  const [isExporting, setIsExporting] = useState(false);

  // Extract all purchased industrial machines from completed/active orders
  const purchasedMachines = useMemo(() => {
    const list: MachineProfile[] = [];

    orders.forEach((order) => {
      const orderDateStr = order.createdAt || new Date().toISOString();
      const orderDate = new Date(orderDateStr);
      const now = new Date();
      const daysSincePurchase = Math.max(1, Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      // Assume average commercial workshop usage: 6 operating hours/day on working days (~4.5 hrs/day overall)
      const estimatedHoursRun = Math.min(5000, Math.floor(daysSincePurchase * 4.5));

      // Calculate 12-month warranty expiry
      const warrantyExpiry = new Date(orderDate);
      warrantyExpiry.setFullYear(warrantyExpiry.getFullYear() + 1);
      const isWarrantyActive = now < warrantyExpiry;

      (order.items || []).forEach((item, itemIdx) => {
        // Find product catalog entry
        const catalogProd = products.find(p => p.id === item.productId || p.name.toLowerCase() === item.name.toLowerCase());
        
        const machineId = `${order.id}-${item.productId || itemIdx}`;
        const machineName = item.name;
        const brand = item.brand || catalogProd?.brand || "HAOSAIL";
        const category = catalogProd?.category || "Industrial Machinery";
        const image = item.image || catalogProd?.image || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=700";

        // Generate tailored maintenance milestones based on machine purchase date
        const milestones: ServiceMilestone[] = [
          {
            id: `m-50-${machineId}`,
            intervalHours: 50,
            intervalDays: 30,
            title: "50-Hour / 30-Day Break-In Service",
            category: "Break-In",
            description: "Initial operational break-in check, fluid flush, and structural fastener retorquing after commissioning.",
            criticalTasks: [
              "Inspect and retorque all anchor bolts and column mounting bolts",
              "Check hydraulic fluid purity and bleed any trapped air in cylinders",
              "Verify equal tension on dual synchronization steel cables (lifts)",
              "Inspect electrical contactors, motor terminals, and limit switches"
            ],
            recommendedParts: ["ISO 46 Hydraulic Oil (10L)", "Fastener Retorque Kit", "Contact Cleaner"],
            urgency: daysSincePurchase > 30 ? "completed" : "due_soon",
            dueDaysRemaining: Math.max(0, 30 - daysSincePurchase),
            dueDate: new Date(orderDate.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
          },
          {
            id: `m-250-${machineId}`,
            intervalHours: 250,
            intervalDays: 90,
            title: "250-Hour / 90-Day Preventive Service",
            category: "Preventive",
            description: "Regular operational lubrication, air/oil filter inspection, and hydraulic pressure verification.",
            criticalTasks: [
              "Clean or replace intake air filter cartridges and compressor strainers",
              "Grease all pivot pins, slider blocks, and bearing bushings with high-temp EP2 grease",
              "Test pneumatic pressure regulator and moisture drain valves",
              "Inspect rubber pads, guide blocks, and turntable jaws for wear"
            ],
            recommendedParts: ["Air Filter Element", "EP-2 Heavy Duty Grease Cartridge", "Rubber Arm Pad Set"],
            urgency: daysSincePurchase > 90 ? "completed" : daysSincePurchase >= 75 ? "due_soon" : "upcoming",
            dueDaysRemaining: Math.max(0, 90 - daysSincePurchase),
            dueDate: new Date(orderDate.getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()
          },
          {
            id: `m-500-${machineId}`,
            intervalHours: 500,
            intervalDays: 180,
            title: "500-Hour / 180-Day Semi-Annual Overhaul",
            category: "Major Overhaul",
            description: "Comprehensive hydraulic fluid changeout, valve block inspection, and seal leak diagnostic.",
            criticalTasks: [
              "Complete drain and flush of hydraulic reservoir with fresh ISO 46/68 oil",
              "Inspect hydraulic cylinder piston seals and rod wipers for weepage",
              "Inspect motor drive belts for micro-cracks and recalibrate pulley alignment",
              "Perform full safety locking ratchet drop test under simulated load"
            ],
            recommendedParts: ["Hydraulic Piston Seal Kit", "V-Belt Replacement Set", "20L Industrial Hydraulic Oil"],
            urgency: daysSincePurchase > 180 ? "completed" : daysSincePurchase >= 150 ? "due_soon" : "routine",
            dueDaysRemaining: Math.max(0, 180 - daysSincePurchase),
            dueDate: new Date(orderDate.getTime() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString()
          },
          {
            id: `m-1000-${machineId}`,
            intervalHours: 1000,
            intervalDays: 365,
            title: "1,000-Hour / Annual Safety Recertification",
            category: "Annual Recertification",
            description: "Mandatory annual statutory safety audit, load calibration, and factory warranty renewal inspection.",
            criticalTasks: [
              "Conduct 110% rated load capacity proof-test with Haosail calibrated weights",
              "Ultrasonic weld inspection on main upright masts and structural carriage arms",
              "Recalibrate electronic wheel balancer optical encoders and digital load cells",
              "Issue official 12-Month Haosail Kenya Workplace Safety Compliance Certificate"
            ],
            recommendedParts: ["Annual Maintenance Overhaul Kit", "Sync Cable Pair Replacement", "Safety Interlock Switch"],
            urgency: daysSincePurchase > 365 ? "due_soon" : daysSincePurchase >= 330 ? "due_soon" : "routine",
            dueDaysRemaining: Math.max(0, 365 - daysSincePurchase),
            dueDate: new Date(orderDate.getTime() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()
          }
        ];

        list.push({
          machineId,
          orderId: order.id,
          name: machineName,
          brand,
          category,
          image,
          purchaseDate: orderDate.toLocaleDateString(),
          warrantyExpiryDate: warrantyExpiry.toLocaleDateString(),
          isWarrantyActive,
          estimatedHoursRun,
          milestones
        });
      });
    });

    return list;
  }, [orders, products]);

  // Selected Machine (defaults to first machine if available)
  const currentMachine = useMemo(() => {
    if (selectedMachineId) {
      return purchasedMachines.find(m => m.machineId === selectedMachineId) || purchasedMachines[0] || null;
    }
    return purchasedMachines[0] || null;
  }, [selectedMachineId, purchasedMachines]);

  // Filter milestones for current machine
  const displayedMilestones = useMemo(() => {
    if (!currentMachine) return [];
    if (activeFilter === "all") return currentMachine.milestones;
    if (activeFilter === "due_soon") return currentMachine.milestones.filter(m => m.urgency === "due_soon");
    if (activeFilter === "preventive") return currentMachine.milestones.filter(m => m.category === "Preventive" || m.category === "Break-In");
    if (activeFilter === "annual") return currentMachine.milestones.filter(m => m.category === "Annual Recertification" || m.category === "Major Overhaul");
    return currentMachine.milestones;
  }, [currentMachine, activeFilter]);

  // Download printable PDF Service Schedule & Checklist
  const handleDownloadChecklist = (machine: MachineProfile) => {
    setIsExporting(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Header Banner
      doc.setFillColor(0, 102, 204);
      doc.rect(0, 0, 210, 38, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(16);
      doc.text("HAOSAIL KENYA - INDUSTRIAL MACHINERY SERVICE SCHEDULE", 15, 16);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text("Factory Recommended Preventive Maintenance Protocol & Engineering Log", 15, 23);
      doc.text("Engineering Desk: +254 750 707 038 | Email: info@haosail.ke | Waiyaki Way, Nairobi", 15, 29);

      // Equipment Specs Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, 44, 180, 28, "F");
      doc.rect(15, 44, 180, 28, "S");

      doc.setTextColor(15, 23, 42);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`Equipment: ${machine.brand} ${machine.name}`, 20, 52);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Order Reference: #${machine.orderId.substring(0, 8).toUpperCase()}`, 20, 59);
      doc.text(`Commissioning Date: ${machine.purchaseDate}`, 20, 65);
      doc.text(`Estimated Running Meter: ~${machine.estimatedHoursRun} Hours`, 110, 59);
      doc.text(`Warranty Coverage: ${machine.isWarrantyActive ? "Active (Until " + machine.warrantyExpiryDate + ")" : "Standard Support"}`, 110, 65);

      let currentY = 80;

      // Milestones loop
      machine.milestones.forEach((milestone, idx) => {
        if (currentY > 230) {
          doc.addPage();
          currentY = 20;
        }

        // Milestone Title Bar
        doc.setFillColor(241, 245, 249);
        doc.rect(15, currentY, 180, 8, "F");
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(0, 102, 204);
        doc.text(`Milestone ${idx + 1}: ${milestone.title} (Due: ${milestone.dueDate})`, 18, currentY + 5.5);

        currentY += 12;

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text("Critical Service Checkpoints:", 18, currentY);
        currentY += 4.5;

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        milestone.criticalTasks.forEach((task) => {
          doc.text(`[  ]  ${task}`, 22, currentY);
          currentY += 4.5;
        });

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Recommended Spare Parts: ${milestone.recommendedParts.join(", ")}`, 22, currentY);
        currentY += 8;
      });

      // Footer Sign-Off
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setDrawColor(203, 213, 225);
      doc.line(15, currentY + 10, 195, currentY + 10);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("Certified by Haosail Kenya Technical Services. Always use genuine factory replacement parts.", 105, currentY + 16, { align: "center" });

      doc.save(`Haosail_Service_Schedule_${machine.name.replace(/\s+/g, "_")}.pdf`);
    } catch (e) {
      console.error("Failed to generate service schedule PDF:", e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0066CC] flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Machinery Maintenance &amp; Recommended Service Schedules
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl">
              Automated operational service timetables calculated for your purchased industrial machinery. Keep equipment calibrated, extend service life, and schedule factory-certified Haosail technicians directly.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {currentMachine && (
              <button
                onClick={() => handleDownloadChecklist(currentMachine)}
                disabled={isExporting}
                className="bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#0066CC] border border-slate-200 font-bold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? "Exporting..." : "Download Checklist PDF"}</span>
              </button>
            )}

            <a
              href="https://wa.me/254750707038?text=Hello%20Haosail%20Engineering%20Desk%2C%20I%20would%20like%20to%20schedule%20a%20technician%20visit%20for%20machinery%20maintenance."
              target="_blank"
              rel="noreferrer"
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Book Engineer (+254 750 707 038)</span>
            </a>
          </div>
        </div>

        {/* Machine Selector Pills */}
        {purchasedMachines.length > 0 ? (
          <div className="mt-6">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Select Fleet Unit ({purchasedMachines.length} Registered Machines):
            </span>
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
              {purchasedMachines.map((m) => {
                const isSelected = (currentMachine?.machineId === m.machineId);
                return (
                  <button
                    key={m.machineId}
                    onClick={() => setSelectedMachineId(m.machineId)}
                    className={`flex items-center gap-3 p-2.5 pr-4 rounded-2xl border text-left transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/80 border-[#0066CC] ring-2 ring-[#0066CC]/20 shadow-xs"
                        : "bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <img 
                      src={m.image} 
                      alt={m.name} 
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-white shrink-0" 
                    />
                    <div>
                      <span className={`text-xs font-bold block max-w-[180px] truncate ${isSelected ? "text-[#0066CC]" : "text-slate-900"}`}>
                        {m.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        Order #{m.orderId.substring(0, 8).toUpperCase()} • ~{m.estimatedHoursRun} Hrs
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-6 p-6 bg-blue-50/60 border border-blue-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-[#0066CC] flex items-center justify-center border border-blue-200 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">No Purchased Heavy Machinery Found Yet</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  When you purchase 2-post lifts, tire changers, air compressors, or heavy workshop equipment, automated service timetables appear here.
                </p>
              </div>
            </div>
            <button
              onClick={onNavigateToShop}
              className="bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Browse Industrial Catalog</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Machine Schedule Details */}
      {currentMachine && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Machine Health & Telemetry Card */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <img
                  src={currentMachine.image}
                  alt={currentMachine.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200 bg-slate-50"
                />
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#0066CC] uppercase bg-blue-50 px-2 py-0.5 rounded-md">
                    {currentMachine.brand}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-2">
                    {currentMachine.name}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                    Order Ref: #{currentMachine.orderId.substring(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Machinery Metrics */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Commissioning Date
                  </span>
                  <span className="font-mono font-bold text-slate-800">{currentMachine.purchaseDate}</span>
                </div>

                <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Estimated Operating Meter
                  </span>
                  <span className="font-mono font-bold text-[#0066CC]">~{currentMachine.estimatedHoursRun} Run Hours</span>
                </div>

                <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Factory Warranty Status
                  </span>
                  <span className={`font-bold text-[11px] px-2 py-0.5 rounded-md ${
                    currentMachine.isWarrantyActive 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {currentMachine.isWarrantyActive ? "Active 12-Month Coverage" : "Standard Factory Support"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs py-2">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-500" />
                    Fleet Status
                  </span>
                  <span className="font-bold text-xs text-emerald-600 flex items-center gap-1">
                    Operational &amp; Calibrated
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => onNavigateToSpareParts({
                    name: currentMachine.name,
                    image: currentMachine.image,
                    orderId: currentMachine.orderId,
                    purchaseDate: currentMachine.purchaseDate
                  })}
                  className="w-full bg-blue-50 hover:bg-blue-100 text-[#0066CC] font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Request Factory Spare Parts / Kits</span>
                </button>

                <a
                  href={`https://wa.me/254750707038?text=${encodeURIComponent(
                    `Hello Haosail Kenya, I would like to book a certified technician to inspect my ${currentMachine.brand} ${currentMachine.name} (Order Ref: #${currentMachine.orderId.substring(0, 8)}).`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 border border-slate-200 font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dispatch Technician on WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Safety Guidelines Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-[#0066CC]" />
                <span>Haosail Heavy Equipment Maintenance Rules</span>
              </div>
              <ul className="text-[11px] text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
                <li>Never operate hydraulic lifts without bleeding air during the initial 50 hours.</li>
                <li>Use only ISO VG 46 (cold climate) or ISO VG 68 anti-wear hydraulic oil.</li>
                <li>Ensure equal cable tensioning every 90 days to prevent carriage tilt.</li>
                <li>Keep records of all maintenance stamps to retain warranty eligibility.</li>
              </ul>
            </div>
          </div>

          {/* Right 2 Columns: Maintenance Milestones & Timetable */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: "all", label: "All Service Milestones" },
                { id: "due_soon", label: "Due Soon / Priority" },
                { id: "preventive", label: "Routine & Preventive" },
                { id: "annual", label: "Major Overhaul & Annual" }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id as any)}
                  className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    activeFilter === f.id
                      ? "bg-[#0066CC] text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Milestones Cards */}
            <div className="space-y-4">
              {displayedMilestones.map((milestone, idx) => {
                const isDueSoon = milestone.urgency === "due_soon";
                const isCompleted = milestone.urgency === "completed";

                return (
                  <div
                    key={milestone.id}
                    className={`bg-white border rounded-3xl p-6 transition-all space-y-4 shadow-xs ${
                      isDueSoon
                        ? "border-amber-300 ring-2 ring-amber-100"
                        : isCompleted
                        ? "border-emerald-200 bg-emerald-50/10"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {/* Milestone Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isDueSoon
                            ? "bg-amber-100 text-amber-800"
                            : isCompleted
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-50 text-[#0066CC]"
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{milestone.title}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                              isDueSoon
                                ? "bg-amber-100 text-amber-800"
                                : isCompleted
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-700"
                            }`}>
                              {isDueSoon ? "Action Recommended" : isCompleted ? "Cycle Passed" : "Scheduled Ahead"}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                            Target Operating Window: {milestone.intervalHours} Hours / {milestone.intervalDays} Days • Estimated Due: {milestone.dueDate}
                          </span>
                        </div>
                      </div>

                      {/* WhatsApp Schedule Button */}
                      <a
                        href={`https://wa.me/254750707038?text=${encodeURIComponent(
                          `Hello Haosail Engineering, I would like to schedule the "${milestone.title}" for my ${currentMachine.brand} ${currentMachine.name} (Order #${currentMachine.orderId.substring(0, 8)}).`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#0066CC] border border-slate-200 text-xs font-bold py-1.5 px-3 rounded-xl transition-all flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5 text-[#0066CC]" />
                        <span>Schedule Service</span>
                      </a>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                      {milestone.description}
                    </p>

                    {/* Critical Tasks */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                      <span className="text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider block">
                        Mandatory Inspection Checkpoints:
                      </span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                        {milestone.criticalTasks.map((task, tIdx) => (
                          <li key={tIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#0066CC] mt-0.5 shrink-0" />
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommended Parts */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono text-slate-500 font-bold">Required Parts:</span>
                        {milestone.recommendedParts.map((p, pIdx) => (
                          <span key={pIdx} className="bg-white border border-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded-lg text-[11px]">
                            {p}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => onNavigateToSpareParts({
                          name: `${currentMachine.name} - ${milestone.recommendedParts[0]}`,
                          image: currentMachine.image,
                          orderId: currentMachine.orderId,
                          purchaseDate: currentMachine.purchaseDate
                        })}
                        className="text-xs font-bold text-[#0066CC] hover:underline flex items-center gap-1 cursor-pointer shrink-0 self-start sm:self-auto"
                      >
                        <span>Order Parts Kit</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
