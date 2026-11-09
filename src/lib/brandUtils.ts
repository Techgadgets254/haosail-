/**
 * Normalizes brand names across the application so that casing variations
 * (e.g., "LOGITECH", "logitech", "Logitech") map to a single, clean canonical brand name.
 */
export function normalizeBrandName(brand: string): string {
  if (!brand || !brand.trim()) return "HaoSail";
  const clean = brand.trim().toLowerCase();

  const brandOverrides: Record<string, string> = {
    haosail: "HaoSail",
    "haosail machinery": "HaoSail",
    caterpillar: "Caterpillar",
    cat: "Caterpillar",
    jcb: "JCB",
    sany: "Sany",
    xcmg: "XCMG",
    komatsu: "Komatsu",
    perkins: "Perkins",
    cummins: "Cummins",
    honda: "Honda",
    bosch: "Bosch",
    launch: "Launch",
    karcher: "Kärcher",
    lavor: "Lavor",
    bishamon: "Bishamon",
    makita: "Makita",
    dewalt: "DeWalt"
  };

  if (brandOverrides[clean]) {
    return brandOverrides[clean];
  }

  return clean
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
