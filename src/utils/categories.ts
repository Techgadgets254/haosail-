/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from "../types";

export const SUBCATEGORIES_BY_MAIN_CATEGORY: Record<string, string[]> = {
  "All": [
    "Car Lifts & Hoists",
    "Wheel Alignment",
    "Tire Changers & Balancers",
    "Concrete Equipment",
    "Compactor & Rollers",
    "Multifunction Carpentry",
    "Panel & Table Saws",
    "Industrial Compressors",
    "High Pressure Washers",
    "Silent Diesel Generators"
  ],
  "All Machinery": [
    "Car Lifts & Hoists",
    "Wheel Alignment",
    "Tire Changers & Balancers",
    "Concrete Equipment",
    "Compactor & Rollers",
    "Multifunction Carpentry",
    "Panel & Table Saws",
    "Industrial Compressors",
    "High Pressure Washers",
    "Silent Diesel Generators"
  ],
  "Auto Maintenance": [
    "Car Lifts & Hoists",
    "Wheel Alignment",
    "Tire Changers & Balancers",
    "Garage & Wash Systems"
  ],
  "Construction Machinery": [
    "Concrete Equipment",
    "Compactor & Rollers",
    "Steel Benders & Cutters",
    "Power Trowels & Finishers"
  ],
  "Woodworking": [
    "Multifunction Carpentry",
    "Panel & Table Saws",
    "Planers & Thicknessers",
    "Edge Banders"
  ],
  "Metal Working": [
    "Metal Band Saws",
    "Magnetic Drills",
    "Hydraulic Presses"
  ],
  "Air Compressors & Pumps": [
    "Industrial Compressors",
    "High Pressure Washers",
    "Water & Slurry Pumps"
  ],
  "Generators & Welders": [
    "Silent Diesel Generators",
    "Engine Welding Generators",
    "Portable Gasoline Generators"
  ]
};

/**
 * Checks if a product matches a given subcategory, checking product.subcategory or intelligent fallback keywords.
 */
export function matchesSubcategory(product: Product, subcategory: string): boolean {
  if (!subcategory || subcategory === "All") return true;

  if (product.subcategory && product.subcategory.toLowerCase() === subcategory.toLowerCase()) {
    return true;
  }

  const name = product.name.toLowerCase();
  const desc = (product.description || "").toLowerCase();
  const sub = subcategory.toLowerCase();

  if (sub.includes("lift") || sub.includes("hoist")) {
    return name.includes("lift") || name.includes("hoist") || desc.includes("lift") || desc.includes("clear floor");
  }

  if (sub.includes("alignment")) {
    return name.includes("alignment") || desc.includes("3d wheel alignment");
  }

  if (sub.includes("tire") || sub.includes("balancer") || sub.includes("changer")) {
    return name.includes("tire") || name.includes("balancer") || name.includes("changer") || desc.includes("tire");
  }

  if (sub.includes("concrete")) {
    return name.includes("concrete") || name.includes("mixer") || desc.includes("concrete");
  }

  if (sub.includes("compactor") || sub.includes("roller") || sub.includes("rammer")) {
    return name.includes("compactor") || name.includes("roller") || name.includes("rammer") || desc.includes("compaction");
  }

  if (sub.includes("multifunction") || sub.includes("carpentry") || sub.includes("woodworking")) {
    return name.includes("multifunction") || name.includes("carpentry") || name.includes("planer") || desc.includes("woodworking");
  }

  if (sub.includes("saw")) {
    return name.includes("saw") || name.includes("panel") || desc.includes("sawing");
  }

  if (sub.includes("compressor")) {
    return name.includes("compressor") || desc.includes("compressor") || desc.includes("bar pressure");
  }

  if (sub.includes("washer") || sub.includes("pump")) {
    return name.includes("washer") || name.includes("pump") || desc.includes("water pressure");
  }

  if (sub.includes("generator") || sub.includes("welder")) {
    return name.includes("generator") || name.includes("welder") || name.includes("welding") || desc.includes("kva");
  }

  return false;
}
