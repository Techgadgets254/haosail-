/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from "./types";

export const DEFAULT_PRODUCTS: Omit<Product, "id">[] = [
  {
    name: "HaoSail 4.5-Ton Clear Floor Two-Post Car Lift (Hydraulic)",
    brand: "HaoSail",
    category: "Auto Maintenance",
    subcategory: "Car Lifts & Hoists",
    price: 385000,
    stock: 8,
    description: "Industrial grade heavy-duty two-post clear-floor vehicle lift. Engineered for auto garages and tire service centers across Kenya. Features dual hydraulic cylinders, automatic arm restraints, magnetic safety release locks, and overhead safety shut-off bar.",
    image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800",
    specifications: {
      "Lifting Capacity": "4,500 kg (4.5 Ton)",
      "Max Lifting Height": "1,900 mm",
      "Minimum Height": "110 mm",
      "Lifting Time": "50 seconds",
      "Motor Power": "2.2 kW (380V Three-Phase or 220V Single-Phase)",
      "Safety Mechanism": "Magnetic Dual-Point Safety Locks & Overhead Shut-off",
      "Warranty": "12 Months Haosail Factory Warranty & On-site Installation Support"
    }
  },
  {
    name: "HaoSail 3D Computerized High-Precision Wheel Alignment Machine",
    brand: "HaoSail",
    category: "Auto Maintenance",
    subcategory: "Wheel Alignment",
    price: 650000,
    stock: 5,
    description: "Next-generation 3D dual-camera wheel alignment system. Includes high-resolution optical cameras, passive target plates (no electronic components on wheels), calibration-free target boards, and a workstation cabinet preloaded with 40,000+ worldwide vehicle specifications.",
    image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800",
    specifications: {
      "Technology": "High-Precision 3D Dual-Camera Measurement System",
      "Target Boards": "Passive High-Durability Targets (Zero Electronic Drift)",
      "Measurement Accuracy": "±0.01° Toe & Camber Precision",
      "Software Database": "40,000+ Global Vehicle Alignment Specs (Free Lifetime Updates)",
      "Display Console": "Ergonomic Mobile Metal Cabinet + 32-inch HD LED Monitor",
      "Warranty": "12 Months Haosail Warranty & Free Technician Training in Nairobi"
    }
  },
  {
    name: "HaoSail Heavy Duty Commercial Tire Changer Machine (10\" - 24\")",
    brand: "HaoSail",
    category: "Auto Maintenance",
    subcategory: "Tire Changers & Balancers",
    price: 245000,
    stock: 12,
    description: "Professional auto garage pneumatic tire changer. Designed for passenger cars, SUVs, and light commercial vehicles. Features pneumatic tilting arm, heavy-duty bead breaker arm with 2,500 kg pressure force, and non-marring wheel rim protectors.",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800",
    specifications: {
      "Rim Clamping Outer": "10\" - 21\"",
      "Rim Clamping Inner": "12\" - 24\"",
      "Max Wheel Diameter": "1,040 mm",
      "Max Wheel Width": "355 mm (14 inches)",
      "Bead Breaker Cylinder Force": "2,500 kg pneumatic force",
      "Operating Air Pressure": "8 - 10 bar (116 - 145 PSI)",
      "Motor Power": "1.1 kW heavy copper motor"
    }
  },
  {
    name: "HaoSail Digital Dynamic Computerized Wheel Balancer Machine",
    brand: "HaoSail",
    category: "Auto Maintenance",
    subcategory: "Tire Changers & Balancers",
    price: 195000,
    stock: 10,
    description: "Microprocessor-controlled digital wheel balancing system for automobile and SUV tires. Features automatic distance and rim diameter input, multi-balancing modes (ALU-1, ALU-2, ALU-3, Static & Dynamic), and quick self-calibration routine.",
    image: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=800",
    specifications: {
      "Max Wheel Weight": "65 kg",
      "Rim Diameter": "10\" - 24\"",
      "Rim Width": "1.5\" - 20\"",
      "Balancing Precision": "±1g",
      "Rotation Speed": "200 RPM",
      "Measuring Cycle": "8 seconds",
      "Includes": "Full set of precision centering cones + quick nut handle"
    }
  },
  {
    name: "HaoSail Diesel Engine Concrete Mixer 350L (Heavy Duty Tilting Drum)",
    brand: "HaoSail",
    category: "Construction Machinery",
    subcategory: "Concrete Equipment",
    price: 285000,
    stock: 15,
    description: "Lister-type heavy duty site concrete mixer powered by an air-cooled diesel engine. Ideal for civil engineering contractors, housing construction, and infrastructure projects across Kenya. Features thick steel drum plates, towable site chassis, and smooth gear tilt mechanism.",
    image: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&q=80&w=800",
    specifications: {
      "Drum Capacity": "350 Litres Unmixed / 260 Litres Batch Yield",
      "Engine": "Haosail 8HP Air-Cooled Direct Injection Diesel Engine",
      "Drum Speed": "20 - 22 RPM",
      "Mobility": "Heavy Steel Frame + 4 Pneumatic Towing Tires",
      "Discharge": "Manual Hand-Wheel Tilt Gear Discharge",
      "Weight": "380 kg heavy steel frame"
    }
  },
  {
    name: "HaoSail Walk-Behind Vibratory Road Roller 1-Ton (Hydrostatic Drive)",
    brand: "HaoSail",
    category: "Construction Machinery",
    subcategory: "Compactor & Rollers",
    price: 1250000,
    stock: 4,
    description: "Compact 1-Ton hydrostatic walk-behind vibratory road roller. Built for trench compaction, asphalt road repairs, driveway paving, and foundation site leveling. Features infinitely variable speed hydrostatic drive, hydraulic steering, and 25kN compaction force.",
    image: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=800",
    specifications: {
      "Operating Weight": "1,000 kg (1.0 Ton)",
      "Drum Width": "700 mm steel vibration drum",
      "Excitation Force": "25 kN centrifugal vibration",
      "Engine": "Genuine Honda GX390 Gasoline or Haosail Diesel (13HP)",
      "Drive Mechanism": "Full Hydrostatic Infinitely Variable Transmission",
      "Water Tank": "30L corrosion-proof sprinkler tank"
    }
  },
  {
    name: "HaoSail Reversible Heavy Duty Plate Compactor 160kg",
    brand: "HaoSail",
    category: "Construction Machinery",
    subcategory: "Compactor & Rollers",
    price: 175000,
    stock: 18,
    description: "High-impact forward and reversible plate compactor for soil, gravel, paving stones, and road base preparation. Features heavy wear-resistant cast ductile iron base plate, wrap-around protection cage, and anti-vibration handle grips.",
    image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800",
    specifications: {
      "Operating Weight": "160 kg",
      "Plate Dimension": "700 mm x 500 mm",
      "Centrifugal Force": "30.5 kN vibration impact",
      "Travel Speed": "Up to 25 meters/min",
      "Engine": "Genuine Honda GX270 9HP or Haosail Diesel Engine",
      "Control": "Hydraulic Forward & Reversible Direction Lever"
    }
  },
  {
    name: "HaoSail Heavy Duty Tamping Rammer (Jump Jack Soil Compactor)",
    brand: "HaoSail",
    category: "Construction Machinery",
    subcategory: "Compactor & Rollers",
    price: 145000,
    stock: 14,
    description: "High-impact jumping jack tamping rammer for clay soil, utility trenches, pipe laying, and tight space foundation compaction. Powered by 4-stroke petrol engine with heavy polyurethane bellows and oil bath system.",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800",
    specifications: {
      "Operating Weight": "78 kg",
      "Impact Force": "14 kN per blow",
      "Jumping Stroke": "40 - 85 mm stroke height",
      "Shoe Size": "330 mm x 285 mm steel reinforced foot",
      "Engine": "Honda GX160 5.5HP 4-Stroke OHV Petrol Engine",
      "Bellows": "German-grade high elasticity polyurethane bellows"
    }
  },
  {
    name: "HaoSail Automatic Steel Bar Bender & Cutter Machine (12mm - 32mm)",
    brand: "HaoSail",
    category: "Construction Machinery",
    subcategory: "Steel Benders & Cutters",
    price: 320000,
    stock: 7,
    description: "Heavy duty electric-hydraulic rebar bending and shearing machine. Bends high-tensile steel bars up to 32mm diameter for column links, beam reinforcement, and foundation stirrups. Features foot pedal operation, angle setting pins (0° to 180°), and emergency stop.",
    image: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=800",
    specifications: {
      "Bending Range": "12 mm to 32 mm deformed steel bar (BS4449 Grade 500)",
      "Bending Angle": "0° to 180° preset dial angles",
      "Motor Power": "3.0 kW 415V Three-Phase 50Hz copper motor",
      "Operation": "Dual Foot Pedal Switch + Manual Dial Lock",
      "Machine Weight": "340 kg heavy iron casing"
    }
  },
  {
    name: "HaoSail Multifunction Woodworking Machine 6-in-1 (Universal Carpentry Workstation)",
    brand: "HaoSail",
    category: "Woodworking",
    subcategory: "Multifunction Carpentry",
    price: 395000,
    stock: 9,
    description: "HaoSail's flagship space-saving carpentry workshop machine. Combines 6 core woodworking tools into a single heavy cast-iron table: Surface Planer, Thicknesser, Circular Sawing Table, Slot Mortiser, Tenoner, and Tool Grinder.",
    image: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&q=80&w=800",
    specifications: {
      "6 Functions": "Surface Planing, Thicknessing, Circular Sawing, Mortising, Tenoning, Cutter Sharpening",
      "Planing Width": "300 mm max planing width",
      "Thicknessing Height": "10 - 160 mm thickness capacity",
      "Saw Blade Diameter": "300 mm max blade diameter",
      "Motor Power": "2.2 kW (3.0 HP) Heavy Duty Induction Motor",
      "Table Construction": "Precision Ground Cast Iron Bed (280 kg total weight)"
    }
  },
  {
    name: "HaoSail Precision Sliding Table Panel Saw 3200mm",
    brand: "HaoSail",
    category: "Woodworking",
    subcategory: "Panel & Table Saws",
    price: 850000,
    stock: 3,
    description: "Industrial precision panel saw with 3,200mm sliding aluminum carriage. Designed for high-volume furniture production, MDF board cutting, plywood, and solid wood processing. Features main saw blade + independent scoring saw blade to prevent chip-out.",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800",
    specifications: {
      "Sliding Table Length": "3,200 mm multi-chamber aluminum profile",
      "Max Cutting Width": "1,250 mm rip fence capacity",
      "Main Saw Blade": "300 mm diameter (4,000 / 6,000 RPM)",
      "Scoring Saw Blade": "120 mm diameter (8,000 RPM)",
      "Saw Tilting": "0° - 45° angular tilt with digital readout screen",
      "Main Motor Power": "5.5 kW / Scoring Motor: 0.75 kW"
    }
  },
  {
    name: "HaoSail 200L Industrial Air Compressor 10HP (Tri-Cylinder Belt Driven)",
    brand: "HaoSail",
    category: "Air Compressors & Pumps",
    subcategory: "Industrial Compressors",
    price: 225000,
    stock: 11,
    description: "Heavy industrial stationary air compressor unit. Ideal for commercial auto spray painting, pneumatic impact wrenches, sandblasting, tire workshops, and factory automation line pneumatic air supply.",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800",
    specifications: {
      "Tank Capacity": "200 Litres Heavy-Gauge Steel Vessel",
      "Motor Power": "7.5 kW / 10 HP (415V Three-Phase)",
      "Max Air Pressure": "10 - 12.5 bar (145 - 180 PSI)",
      "Air Displacement": "900 Litres/min (31.8 CFM)",
      "Pump Head": "Tri-Cylinder Cast Iron Heavy Duty Air Pump Head",
      "Safety Valve": "ASME Certified Pressure Relief & Auto Cut-Off Switch"
    }
  },
  {
    name: "HaoSail Commercial High-Pressure Washer System 250 Bar (Triplex Ceramic Pump)",
    brand: "HaoSail",
    category: "Air Compressors & Pumps",
    subcategory: "High Pressure Washers",
    price: 165000,
    stock: 16,
    description: "Heavy duty petrol/diesel powered commercial pressure washer. Built for commercial car washes, construction site equipment degreasing, paving stone cleaning, and truck chassis cleaning across Kenya.",
    image: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=80&w=800",
    specifications: {
      "Working Pressure": "250 Bar / 3,600 PSI water jet pressure",
      "Water Flow Rate": "15 Litres/minute (900 L/hour)",
      "Engine": "Haosail 13 HP Commercial Engine with Low-Oil Cutout",
      "Pump Spec": "Heavy Commercial Ceramic Plunger Triplex Pump Head",
      "Accessories": "10m Steel-Braided Hose + Industrial Gun + 4 Quick-Change Nozzles"
    }
  },
  {
    name: "HaoSail Silent Soundproof Diesel Generator 15kVA (Smartgen Auto-Start)",
    brand: "HaoSail",
    category: "Generators & Welders",
    subcategory: "Silent Diesel Generators",
    price: 920000,
    stock: 6,
    description: "Soundproof weatherproof canopy diesel generator set. Features 100% copper wire brushless alternator, Smartgen digital control panel with automatic mains failure (AMF) auto-transfer switch interface, and low fuel consumption.",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
    specifications: {
      "Prime Power Rating": "15 kVA / 12 kW",
      "Standby Power Rating": "16.5 kVA",
      "Engine": "Haosail 4-Cylinder Water-Cooled Industrial Diesel Engine",
      "Alternator": "100% Copper Brushless Self-Excitation AVR Alternator",
      "Noise Level": "68 dBA @ 7 meters (Heavy Acoustic Insulation Canopy)",
      "Fuel Tank Capacity": "85 Litres (Provides 14+ hours continuous load)"
    }
  },
  {
    name: "HaoSail Heavy Duty Engine Diesel Welding Generator 250A",
    brand: "HaoSail",
    category: "Generators & Welders",
    subcategory: "Engine Welding Generators",
    price: 410000,
    stock: 8,
    description: "Mobile dual-function engine driven welder and power generator. Provides 250A DC arc welding power for structural site welding while simultaneously supplying 5kW auxiliary 230V electricity for grinders and site lighting.",
    image: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=800",
    specifications: {
      "Welding Current": "50A to 250A DC Arc Welding output",
      "Electrode Range": "2.0 mm to 5.0 mm continuous welding rod duty",
      "Auxiliary Power Output": "5.0 kW 230V Single-Phase AC auxiliary power socket",
      "Engine": "Haosail Direct-Injection Air-Cooled Diesel Engine",
      "Frame": "Heavy Steel Site Trolley Chassis with Pneumatic Wheels"
    }
  },
  {
    name: "HaoSail 50-Ton Hydraulic Workshop Shop Press",
    brand: "HaoSail",
    category: "Metal Working",
    subcategory: "Hydraulic Presses",
    price: 185000,
    stock: 7,
    description: "Heavy duty 50-ton hydraulic workshop press for bearing pressing, gear removal, metal straightening, and bushing installation in industrial auto garages and manufacturing plants.",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800",
    specifications: {
      "Pressing Capacity": "50 Tons hydraulic pressure",
      "Ram Stroke": "200 mm stroke length",
      "Working Range": "0 to 920 mm adjustable bed height",
      "Bed Width": "730 mm internal clearance",
      "Pump Type": "Dual-Speed Manual Hand & Foot Hydraulic Pump",
      "Frame Construction": "Heavy C-Channel Welded Steel Frame"
    }
  }
];

export const KENYAN_COUNTIES = [
  "Nairobi", "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita Taveta", "Garissa",
  "Wajir", "Mandera", "Marsabit", "Isiolo", "Meru", "Tharaka-Nithi", "Embu", "Kitui",
  "Machakos", "Makueni", "Nyandarua", "Nyeri", "Kirinyaga", "Murang'a", "Kiambu", "Turkana",
  "West Pokot", "Samburu", "Trans Nzoia", "Uasin Gishu", "Elgeyo Marakwet", "Nandi", "Baringo",
  "Laikipia", "Nakuru", "Narok", "Kajiado", "Kericho", "Bomet", "Kakamega", "Vihiga",
  "Bungoma", "Busia", "Siaya", "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira"
];

export const MPESA_GATEWAYS = [
  { name: "MegaPay Express Direct", code: "megapay", status: "Active", ping: "12ms" },
  { name: "Safaricom Daraja API", code: "daraja", status: "Active", ping: "18ms" },
  { name: "Lipa Na M-Pesa Buy Goods", code: "till", status: "Active", ping: "15ms" }
];
