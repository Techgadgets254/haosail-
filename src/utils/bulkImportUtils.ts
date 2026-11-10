import Papa from "papaparse";
import JSZip from "jszip";
import { Product } from "../types";

export interface ParsedCsvProduct {
  id?: string;
  name: string;
  brand: string;
  sku: string;
  category: string;
  price: number;
  originalPrice: number;
  stock: number;
  warranty: string;
  description: string;
  specifications: Record<string, string>;
  rawSpecs?: string;
  coverImage?: string;
  galleryImages: string[];
  rowNumber: number;
  errors: string[];
  warnings: string[];
  status: "valid" | "warning" | "invalid";
}

export interface ExtractedZipImage {
  name: string; // filename e.g. "HS-4500LIFT.jpg"
  cleanName: string; // lowercase without extension
  extension: string;
  blob: Blob;
  size: number;
  previewUrl: string;
  fileObject: File;
}

export interface ProductImageMatch {
  productSku: string;
  productName: string;
  coverImage: ExtractedZipImage | null;
  coverImageSource: "zip" | "csv_url" | "existing" | "none";
  coverImageUrl?: string;
  galleryImages: {
    image: ExtractedZipImage | null;
    url?: string;
    source: "zip" | "csv_url" | "existing";
  }[];
  totalMatchedImages: number;
  status: "full" | "cover_only" | "missing_cover" | "no_images";
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateSkusInCsv: string[];
  duplicateSkusInDatabase: string[];
  missingSkus: number;
  productsWithCover: number;
  productsWithGallery: number;
  productsMissingImages: number;
  totalImagesDetected: number;
}

const SUPPORTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

// Clean SKU / string for case-insensitive and dash-normalized comparison
export function normalizeSku(sku: string): string {
  return (sku || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Parse Key: Value specifications from CSV string
export function parseSpecifications(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!raw) return result;

  // Supports pipes "|" or newlines "\n" or semicolons ";"
  const lines = raw.includes("|") ? raw.split("|") : raw.includes("\n") ? raw.split("\n") : raw.split(";");

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx > 0) {
      const key = trimmed.slice(0, colonIdx).trim();
      const val = trimmed.slice(colonIdx + 1).trim();
      if (key && val) {
        result[key] = val;
      }
    } else {
      // If no colon, use generic key
      result[`Spec ${Object.keys(result).length + 1}`] = trimmed;
    }
  });

  return result;
}

// Parse CSV text using Papa Parse with strict validation
export function parseAndValidateCsv(
  csvText: string,
  existingProducts: Product[]
): {
  products: ParsedCsvProduct[];
  summary: ValidationSummary;
} {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });

  const rows = parsed.data;
  const existingSkuMap = new Set(
    existingProducts
      .filter((p) => p.sku)
      .map((p) => normalizeSku(p.sku as string))
  );

  const seenCsvSkus = new Map<string, number>(); // normalizedSku -> count
  const duplicateSkusInCsv = new Set<string>();
  const duplicateSkusInDatabase = new Set<string>();

  const resultProducts: ParsedCsvProduct[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +1 for 0-index, +1 for header
    const errors: string[] = [];
    const warnings: string[] = [];

    // Header locator helper
    const getVal = (...aliases: string[]): string => {
      for (const key of Object.keys(row)) {
        const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
        for (const alias of aliases) {
          const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (cleanKey === cleanAlias || cleanKey.includes(cleanAlias)) {
            return (row[key] || "").trim();
          }
        }
      }
      return "";
    };

    const id = getVal("id", "productid");
    const name = getVal("machinetitle", "title", "name", "productname");
    const brand = getVal("brand", "manufacturer") || "Haosail";
    const sku = getVal("sku", "modelnumber", "model");
    const category = getVal("category") || "Automotive Lifting";
    const rawPrice = getVal("sellingprice", "price");
    const rawOriginalPrice = getVal("originalprice", "msrp", "wasprice");
    const rawStock = getVal("stockquantity", "stock", "quantity", "qty");
    const warranty = getVal("warranty") || "1 Year Official Haosail Warranty";
    const description = getVal("description", "desc");
    const rawSpecs = getVal("technicalspecifications", "specifications", "specs");
    const coverImage = getVal("coverimageurl", "coverimage", "image", "photourl");
    const g1 = getVal("galleryimage2", "gallery1", "image2");
    const g2 = getVal("galleryimage3", "gallery2", "image3");
    const g3 = getVal("galleryimage4", "gallery3", "image4");
    const g4 = getVal("galleryimage5", "gallery4", "image5");

    // 1. Validate Required Fields
    if (!name) {
      errors.push("Missing required field: Machine Title");
    }

    if (!sku) {
      errors.push("Missing required field: SKU / Model Number");
    } else {
      const normSku = normalizeSku(sku);
      const count = seenCsvSkus.get(normSku) || 0;
      seenCsvSkus.set(normSku, count + 1);
      if (count > 0) {
        duplicateSkusInCsv.add(sku);
        errors.push(`Duplicate SKU in CSV: "${sku}" appears multiple times`);
      }

      if (existingSkuMap.has(normSku)) {
        duplicateSkusInDatabase.add(sku);
        warnings.push(`SKU already exists in database: "${sku}" (will update if selected)`);
      }
    }

    // 2. Validate Price Formatting & Types
    let price = 0;
    if (!rawPrice) {
      errors.push("Missing required field: Selling Price");
    } else {
      const cleanPrice = rawPrice.replace(/[^0-9.]/g, "");
      const parsedPrice = parseFloat(cleanPrice);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        errors.push(`Invalid Selling Price: "${rawPrice}" is not a positive number`);
      } else {
        price = parsedPrice;
      }
    }

    let originalPrice = price;
    if (rawOriginalPrice) {
      const cleanOrig = rawOriginalPrice.replace(/[^0-9.]/g, "");
      const parsedOrig = parseFloat(cleanOrig);
      if (!isNaN(parsedOrig) && parsedOrig >= 0) {
        originalPrice = parsedOrig;
      }
    }

    // 3. Validate Stock
    let stock = 0;
    if (rawStock) {
      const cleanStock = rawStock.replace(/[^0-9]/g, "");
      const parsedStock = parseInt(cleanStock, 10);
      if (isNaN(parsedStock) || parsedStock < 0) {
        warnings.push(`Invalid Stock Quantity "${rawStock}". Defaulting to 0.`);
        stock = 0;
      } else {
        stock = parsedStock;
      }
    }

    const specifications = parseSpecifications(rawSpecs);

    const galleryImages: string[] = [];
    if (g1) galleryImages.push(g1);
    if (g2) galleryImages.push(g2);
    if (g3) galleryImages.push(g3);
    if (g4) galleryImages.push(g4);

    const status = errors.length > 0 ? "invalid" : warnings.length > 0 ? "warning" : "valid";

    resultProducts.push({
      id: id || undefined,
      name,
      brand,
      sku,
      category,
      price,
      originalPrice,
      stock,
      warranty,
      description: description || `Official ${brand} ${name}. Commercial grade industrial machinery.`,
      specifications,
      rawSpecs,
      coverImage: coverImage || undefined,
      galleryImages,
      rowNumber,
      errors,
      warnings,
      status,
    });
  });

  const totalRows = resultProducts.length;
  const invalidRows = resultProducts.filter((p) => p.status === "invalid").length;
  const validRows = totalRows - invalidRows;
  const missingSkus = resultProducts.filter((p) => !p.sku).length;

  return {
    products: resultProducts,
    summary: {
      totalRows,
      validRows,
      invalidRows,
      duplicateSkusInCsv: Array.from(duplicateSkusInCsv),
      duplicateSkusInDatabase: Array.from(duplicateSkusInDatabase),
      missingSkus,
      productsWithCover: 0,
      productsWithGallery: 0,
      productsMissingImages: 0,
      totalImagesDetected: 0,
    },
  };
}

// Extract images from uploaded ZIP file safely
export async function extractZipImages(
  zipFile: File,
  onProgress?: (percent: number, currentFile: string) => void
): Promise<ExtractedZipImage[]> {
  const jszip = new JSZip();
  const zip = await jszip.loadAsync(zipFile);
  const images: ExtractedZipImage[] = [];

  const fileEntries: { path: string; entry: JSZip.JSZipObject }[] = [];
  zip.forEach((path, entry) => {
    if (!entry.dir) {
      fileEntries.push({ path, entry });
    }
  });

  const total = fileEntries.length;
  let processed = 0;

  for (const { path, entry } of fileEntries) {
    processed++;
    // Path traversal check
    if (path.includes("..") || path.startsWith("/")) {
      continue;
    }

    // Ignore macOS hidden __MACOSX and .DS_Store files
    if (path.includes("__MACOSX") || path.endsWith(".DS_Store")) {
      continue;
    }

    const filename = path.split("/").pop() || path;
    const lowerName = filename.toLowerCase();
    const ext = SUPPORTED_IMAGE_EXTENSIONS.find((e) => lowerName.endsWith(e));

    if (!ext) {
      continue; // Skip non-images
    }

    if (onProgress) {
      onProgress(Math.round((processed / total) * 100), filename);
    }

    const cleanBase = filename.slice(0, filename.length - ext.length);
    const blob = await entry.async("blob");

    // Enforce reasonable single file size limit (25MB max)
    if (blob.size > 25 * 1024 * 1024) {
      console.warn(`Skipping ${filename}: exceeds 25MB limit.`);
      continue;
    }

    let mimeType = "image/jpeg";
    if (ext === ".png") mimeType = "image/png";
    if (ext === ".webp") mimeType = "image/webp";

    const typedBlob = blob.type ? blob : new Blob([blob], { type: mimeType });
    const previewUrl = URL.createObjectURL(typedBlob);
    const fileObject = new File([typedBlob], filename, { type: mimeType });

    images.push({
      name: filename,
      cleanName: cleanBase.toLowerCase(),
      extension: ext,
      blob: typedBlob,
      size: blob.size,
      previewUrl,
      fileObject,
    });
  }

  return images;
}

// Match extracted ZIP images to parsed CSV products using SKU and naming patterns
export function matchImagesToProducts(
  products: ParsedCsvProduct[],
  extractedImages: ExtractedZipImage[]
): ProductImageMatch[] {
  // Index extracted images by normalized name
  const imageMap = new Map<string, ExtractedZipImage>();
  extractedImages.forEach((img) => {
    imageMap.set(normalizeSku(img.cleanName), img);
    imageMap.set(img.name.toLowerCase(), img);
  });

  return products.map((prod) => {
    const normSku = normalizeSku(prod.sku);

    // Candidates for cover image:
    // 1. Exact SKU match: HS-4500LIFT.jpg -> normSku
    // 2. Exact filename referenced in CSV if any
    let cover: ExtractedZipImage | null = null;
    let coverSource: "zip" | "csv_url" | "existing" | "none" = "none";
    let coverUrl: string | undefined = prod.coverImage;

    if (imageMap.has(normSku)) {
      cover = imageMap.get(normSku) || null;
      coverSource = "zip";
    } else if (prod.coverImage && imageMap.has(prod.coverImage.toLowerCase())) {
      cover = imageMap.get(prod.coverImage.toLowerCase()) || null;
      coverSource = "zip";
    } else if (prod.coverImage && prod.coverImage.startsWith("http")) {
      coverSource = "csv_url";
    }

    // Gallery images:
    // Suffixes: -1, -2, -3, -4 or _1, _2, _3, _4
    const matchedGallery: {
      image: ExtractedZipImage | null;
      url?: string;
      source: "zip" | "csv_url" | "existing";
    }[] = [];

    // Check ZIP for suffix matches: 1 to 4
    for (let slot = 1; slot <= 4; slot++) {
      const patternDash = `${normSku}${slot}`;
      const patternHyphen = `${normSku}g${slot}`;

      let foundImg: ExtractedZipImage | null = null;

      // Find any extracted image whose normalized clean name matches normSku + slot
      // e.g. "hs4500lift1", "hs4500lift-1", "hs4500lift_1"
      for (const img of extractedImages) {
        const normImg = normalizeSku(img.cleanName);
        if (
          normImg === `${normSku}${slot}` ||
          normImg === `${normSku}gallery${slot}` ||
          normImg === `${normSku}angle${slot}` ||
          normImg === `${normSku}detail${slot}` ||
          normImg === `${normSku}0${slot}`
        ) {
          foundImg = img;
          break;
        }
      }

      // Check if CSV had explicit filename or URL for this slot
      const csvGalleryUrl = prod.galleryImages[slot - 1];
      if (foundImg) {
        matchedGallery.push({ image: foundImg, source: "zip" });
      } else if (csvGalleryUrl && imageMap.has(csvGalleryUrl.toLowerCase())) {
        matchedGallery.push({ image: imageMap.get(csvGalleryUrl.toLowerCase()) || null, source: "zip" });
      } else if (csvGalleryUrl && csvGalleryUrl.startsWith("http")) {
        matchedGallery.push({ image: null, url: csvGalleryUrl, source: "csv_url" });
      }
    }

    const totalMatched = (cover ? 1 : coverUrl ? 1 : 0) + matchedGallery.length;

    let status: "full" | "cover_only" | "missing_cover" | "no_images" = "no_images";
    if (cover || coverSource === "csv_url") {
      status = matchedGallery.length > 0 ? "full" : "cover_only";
    } else if (matchedGallery.length > 0) {
      status = "missing_cover";
    }

    return {
      productSku: prod.sku,
      productName: prod.name,
      coverImage: cover,
      coverImageSource: coverSource,
      coverImageUrl: coverUrl,
      galleryImages: matchedGallery,
      totalMatchedImages: totalMatched,
      status,
    };
  });
}
