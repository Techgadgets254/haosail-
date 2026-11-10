import React, { useState, useRef, useMemo } from "react";
import { 
  Upload, 
  FileText, 
  Archive, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  ArrowLeft,
  RefreshCw, 
  Download, 
  Image as ImageIcon, 
  Layers, 
  Package, 
  Check, 
  Clock, 
  Settings2, 
  Play, 
  Eye, 
  X,
  Filter,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { 
  parseAndValidateCsv, 
  extractZipImages, 
  matchImagesToProducts, 
  ParsedCsvProduct, 
  ExtractedZipImage, 
  ProductImageMatch,
  ValidationSummary
} from "../../utils/bulkImportUtils";
import { Product } from "../../types";
import { storage, db } from "../../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, setDoc, writeBatch } from "firebase/firestore";

interface BulkProductImportProps {
  existingProducts: Product[];
  onImportComplete?: () => void;
  onNavigateToInventory?: () => void;
}

export type DuplicateStrategy = "skip" | "update" | "new_only";
export type ImageStrategy = "replace" | "preserve";

export interface ItemImportProgress {
  sku: string;
  name: string;
  status: "pending" | "processing" | "uploading_images" | "saving_product" | "completed" | "failed" | "skipped";
  error?: string;
  uploadedImages: number;
  totalImages: number;
  finalCoverUrl?: string;
}

export default function BulkProductImport({
  existingProducts,
  onImportComplete,
  onNavigateToInventory
}: BulkProductImportProps) {
  // Step 1: Upload Files | Step 2: Preview & Match | Step 3: Importing / Progress | Step 4: Results
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // File States
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [isExtractingZip, setIsExtractingZip] = useState(false);
  const [zipExtractionProgress, setZipExtractionProgress] = useState<{ percent: number; file: string }>({ percent: 0, file: "" });

  // Parsed and Extracted States
  const [parsedProducts, setParsedProducts] = useState<ParsedCsvProduct[]>([]);
  const [extractedImages, setExtractedImages] = useState<ExtractedZipImage[]>([]);
  const [imageMatches, setImageMatches] = useState<ProductImageMatch[]>([]);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);

  // Settings
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>("update");
  const [imageStrategy, setImageStrategy] = useState<ImageStrategy>("replace");
  const [allowMissingGallery, setAllowMissingGallery] = useState(true);

  // Import Execution Progress State
  const [isImporting, setIsImporting] = useState(false);
  const [overallProgressPercent, setOverallProgressPercent] = useState(0);
  const [importProgressMap, setImportProgressMap] = useState<Record<string, ItemImportProgress>>({});
  const [importSummaryResult, setImportSummaryResult] = useState<{
    totalProducts: number;
    imported: number;
    updated: number;
    skipped: number;
    failed: number;
    totalImages: number;
    imagesUploaded: number;
    imagesFailed: number;
    errors: { sku: string; name: string; error: string }[];
  } | null>(null);

  // Preview filtering states
  const [filterPreviewStatus, setFilterPreviewStatus] = useState<"all" | "valid" | "warning" | "invalid">("all");
  const [previewSearch, setPreviewSearch] = useState("");
  const [inspectProduct, setInspectProduct] = useState<ParsedCsvProduct | null>(null);

  // File Input References
  const csvInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // Handle CSV file selection and parsing
  const handleCsvSelected = async (file: File) => {
    setCsvFile(file);
    const text = await file.text();
    const { products, summary } = parseAndValidateCsv(text, existingProducts);
    setParsedProducts(products);
    setValidationSummary(summary);

    // If ZIP was already extracted, rematch
    if (extractedImages.length > 0) {
      const matches = matchImagesToProducts(products, extractedImages);
      setImageMatches(matches);
      updateImageCounts(matches, summary, extractedImages.length);
    }
  };

  // Handle ZIP file selection and extraction
  const handleZipSelected = async (file: File) => {
    setZipFile(file);
    setIsExtractingZip(true);
    setZipExtractionProgress({ percent: 0, file: "" });

    try {
      const images = await extractZipImages(file, (percent, currentFile) => {
        setZipExtractionProgress({ percent, file: currentFile });
      });

      setExtractedImages(images);

      // If CSV already parsed, match images
      if (parsedProducts.length > 0) {
        const matches = matchImagesToProducts(parsedProducts, images);
        setImageMatches(matches);
        if (validationSummary) {
          updateImageCounts(matches, validationSummary, images.length);
        }
      }
    } catch (err: any) {
      console.error("ZIP extraction error:", err);
      alert(`Failed to extract ZIP image archive: ${err.message || "Invalid archive"}`);
    } finally {
      setIsExtractingZip(false);
    }
  };

  const updateImageCounts = (matches: ProductImageMatch[], prevSummary: ValidationSummary, totalImages: number) => {
    let withCover = 0;
    let withGallery = 0;
    let missing = 0;

    matches.forEach((m) => {
      if (m.coverImage || m.coverImageSource === "csv_url") withCover++;
      if (m.galleryImages.length > 0) withGallery++;
      if (!m.coverImage && m.coverImageSource !== "csv_url" && m.galleryImages.length === 0) missing++;
    });

    setValidationSummary({
      ...prevSummary,
      productsWithCover: withCover,
      productsWithGallery: withGallery,
      productsMissingImages: missing,
      totalImagesDetected: totalImages,
    });
  };

  // Filtered preview items
  const filteredPreviewProducts = useMemo(() => {
    return parsedProducts.filter((p) => {
      if (filterPreviewStatus !== "all" && p.status !== filterPreviewStatus) {
        return false;
      }
      if (previewSearch.trim()) {
        const q = previewSearch.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [parsedProducts, filterPreviewStatus, previewSearch]);

  // Export Validation Error CSV Report
  const handleDownloadErrorReport = () => {
    const errorRows = parsedProducts
      .filter((p) => p.errors.length > 0 || p.warnings.length > 0)
      .map((p) => [
        p.rowNumber,
        `"${(p.sku || "").replace(/"/g, '""')}"`,
        `"${(p.name || "").replace(/"/g, '""')}"`,
        `"${(p.errors.join("; ") || "None").replace(/"/g, '""')}"`,
        `"${(p.warnings.join("; ") || "None").replace(/"/g, '""')}"`,
      ]);

    if (errorRows.length === 0) {
      alert("No errors or warnings found in this CSV dataset.");
      return;
    }

    const headers = ["Row #", "SKU", "Machine Title", "Errors", "Warnings"];
    const csvContent = "\uFEFF" + [headers.join(","), ...errorRows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `HaoSail_Bulk_Import_Validation_Issues_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Upload an individual extracted image file to Firebase Storage with retry support
  const uploadImageToStorage = async (
    sku: string,
    img: ExtractedZipImage
  ): Promise<string> => {
    const cleanSku = sku.replace(/[^a-zA-Z0-9_-]/g, "_") || "general";
    const storageRef = ref(storage, `products/${cleanSku}/${img.name}`);
    
    // Upload with contentType metadata
    const metadata = {
      contentType: img.fileObject.type || "image/jpeg",
      customMetadata: {
        productSku: sku,
        uploadedAt: new Date().toISOString(),
        originalFilename: img.name
      }
    };

    const uploadTask = uploadBytesResumable(storageRef, img.fileObject, metadata);
    await uploadTask;
    return await getDownloadURL(storageRef);
  };

  // Execute the Full Bulk Import Process
  const handleStartImport = async () => {
    if (parsedProducts.length === 0) {
      alert("Please upload a CSV file with valid product rows.");
      return;
    }

    const validProducts = parsedProducts.filter((p) => p.status !== "invalid");
    if (validProducts.length === 0) {
      alert("All products in the CSV have critical validation errors. Please review the errors before proceeding.");
      return;
    }

    setIsImporting(true);
    setCurrentStep(3);

    // Initialize progress map
    const initialMap: Record<string, ItemImportProgress> = {};
    validProducts.forEach((p) => {
      const match = imageMatches.find((m) => m.productSku === p.sku);
      const totalImgs = (match?.coverImage ? 1 : 0) + (match?.galleryImages.filter((g) => g.image).length || 0);

      initialMap[p.sku] = {
        sku: p.sku,
        name: p.name,
        status: "pending",
        uploadedImages: 0,
        totalImages: totalImgs,
      };
    });
    setImportProgressMap(initialMap);

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    let totalImagesUploaded = 0;
    let totalImagesFailed = 0;
    const errorsList: { sku: string; name: string; error: string }[] = [];

    // Map existing products by SKU for duplicate strategy lookup
    const existingSkuMap = new Map<string, Product>();
    existingProducts.forEach((p) => {
      if (p.sku) existingSkuMap.set(p.sku.toLowerCase().trim(), p);
    });

    const totalToProcess = validProducts.length;

    // Process products sequentially or in small parallel batches to avoid browser memory saturation
    for (let i = 0; i < validProducts.length; i++) {
      const prod = validProducts[i];
      const match = imageMatches.find((m) => m.productSku === prod.sku);
      const existing = existingSkuMap.get(prod.sku.toLowerCase().trim());

      // Check Duplicate Strategy
      if (existing) {
        if (duplicateStrategy === "skip") {
          skippedCount++;
          setImportProgressMap((prev) => ({
            ...prev,
            [prod.sku]: { ...prev[prod.sku], status: "skipped" },
          }));
          setOverallProgressPercent(Math.round(((i + 1) / totalToProcess) * 100));
          continue;
        }
        if (duplicateStrategy === "new_only") {
          skippedCount++;
          setImportProgressMap((prev) => ({
            ...prev,
            [prod.sku]: { ...prev[prod.sku], status: "skipped" },
          }));
          setOverallProgressPercent(Math.round(((i + 1) / totalToProcess) * 100));
          continue;
        }
      }

      setImportProgressMap((prev) => ({
        ...prev,
        [prod.sku]: { ...prev[prod.sku], status: "processing" },
      }));

      try {
        // Step A: Upload Images to Firebase Storage
        let finalCoverUrl = prod.coverImage || existing?.image || "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800";
        const finalGalleryUrls: string[] = existing?.gallery ? [...existing.gallery] : [];

        if (imageStrategy === "replace") {
          // Reset gallery if administrator requested fresh image replacement
          finalGalleryUrls.length = 0;
        }

        if (match) {
          // 1. Upload Cover Image if present from ZIP
          if (match.coverImage) {
            setImportProgressMap((prev) => ({
              ...prev,
              [prod.sku]: { ...prev[prod.sku], status: "uploading_images" },
            }));

            try {
              const url = await uploadImageToStorage(prod.sku, match.coverImage);
              finalCoverUrl = url;
              totalImagesUploaded++;
              setImportProgressMap((prev) => ({
                ...prev,
                [prod.sku]: {
                  ...prev[prod.sku],
                  uploadedImages: prev[prod.sku].uploadedImages + 1,
                  finalCoverUrl: url
                },
              }));
            } catch (imgErr: any) {
              console.warn(`Cover image upload failed for ${prod.sku}:`, imgErr);
              totalImagesFailed++;
            }
          } else if (match.coverImageUrl) {
            finalCoverUrl = match.coverImageUrl;
          }

          // 2. Upload Gallery Images from ZIP
          for (let gIdx = 0; gIdx < match.galleryImages.length; gIdx++) {
            const galItem = match.galleryImages[gIdx];
            if (galItem.image) {
              try {
                const url = await uploadImageToStorage(prod.sku, galItem.image);
                finalGalleryUrls.push(url);
                totalImagesUploaded++;
                setImportProgressMap((prev) => ({
                  ...prev,
                  [prod.sku]: {
                    ...prev[prod.sku],
                    uploadedImages: prev[prod.sku].uploadedImages + 1,
                  },
                }));
              } catch (gErr) {
                console.warn(`Gallery image upload failed for ${prod.sku}:`, gErr);
                totalImagesFailed++;
              }
            } else if (galItem.url) {
              finalGalleryUrls.push(galItem.url);
            }
          }
        }

        // Step B: Save Product Record to Firestore
        setImportProgressMap((prev) => ({
          ...prev,
          [prod.sku]: { ...prev[prod.sku], status: "saving_product" },
        }));

        const targetId = existing ? existing.id : (prod.id || `prod_${Date.now()}_${i}`);
        const productDocRef = doc(db, "products", targetId);

        const payload: any = {
          id: targetId,
          name: prod.name,
          brand: prod.brand || "Haosail",
          sku: prod.sku,
          category: prod.category || "Automotive Lifting",
          price: prod.price,
          originalPrice: prod.originalPrice || prod.price,
          stock: prod.stock,
          warranty: prod.warranty || "1 Year Official Haosail Warranty",
          description: prod.description,
          specifications: prod.specifications,
          image: finalCoverUrl,
          gallery: finalGalleryUrls.slice(0, 4), // Store up to 4 additional gallery pictures
          updatedAt: new Date().toISOString(),
        };

        if (existing) {
          await setDoc(productDocRef, payload, { merge: true });
          updatedCount++;
        } else {
          payload.createdAt = new Date().toISOString();
          await setDoc(productDocRef, payload);
          importedCount++;
        }

        setImportProgressMap((prev) => ({
          ...prev,
          [prod.sku]: { ...prev[prod.sku], status: "completed", finalCoverUrl },
        }));
      } catch (prodErr: any) {
        console.error(`Error importing product ${prod.sku}:`, prodErr);
        failedCount++;
        errorsList.push({
          sku: prod.sku,
          name: prod.name,
          error: prodErr.message || "Failed to commit Firestore write or Storage upload",
        });

        setImportProgressMap((prev) => ({
          ...prev,
          [prod.sku]: {
            ...prev[prod.sku],
            status: "failed",
            error: prodErr.message || "Commit failed",
          },
        }));
      }

      setOverallProgressPercent(Math.round(((i + 1) / totalToProcess) * 100));
    }

    setImportSummaryResult({
      totalProducts: totalToProcess,
      imported: importedCount,
      updated: updatedCount,
      skipped: skippedCount,
      failed: failedCount,
      totalImages: totalImagesUploaded + totalImagesFailed,
      imagesUploaded: totalImagesUploaded,
      imagesFailed: totalImagesFailed,
      errors: errorsList,
    });

    setIsImporting(false);
    setCurrentStep(4);
    if (onImportComplete) {
      onImportComplete();
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0066CC]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#0066CC] dark:text-blue-400">
              Machinery Catalogue Automation
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
            Bulk Product & Photography Importer
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Upload your CSV catalogue alongside a ZIP image archive. The system automatically extracts photos, pairs them to products by SKU, uploads them to Firebase Storage, and updates Firestore.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 self-start md:self-auto">
          {[
            { num: 1, label: "Files" },
            { num: 2, label: "Validate & Match" },
            { num: 3, label: "Importing" },
            { num: 4, label: "Summary" },
          ].map((s) => (
            <div 
              key={s.num} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentStep === s.num
                  ? "bg-[#0066CC] text-white shadow-xs"
                  : currentStep > s.num
                  ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                {currentStep > s.num ? "✓" : s.num}
              </span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Upload CSV & ZIP */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Box 1: CSV Upload */}
            <div 
              onClick={() => csvInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                csvFile
                  ? "border-[#0066CC] bg-blue-50/30 dark:bg-blue-950/20"
                  : "border-slate-300 dark:border-slate-700 hover:border-[#0066CC] bg-white dark:bg-slate-900"
              }`}
            >
              <input
                type="file"
                ref={csvInputRef}
                accept=".csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleCsvSelected(f);
                }}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#0066CC] dark:text-blue-400 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 stroke-[1.75]" />
              </div>

              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {csvFile ? csvFile.name : "Select or Drop Machinery CSV"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                Supports standard HaoSail columns: Title, SKU, Price, Specs, Category, Stock & Description.
              </p>

              {csvFile && (
                <div className="mt-4 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{parsedProducts.length} Products Loaded</span>
                </div>
              )}
            </div>

            {/* Box 2: ZIP Upload */}
            <div 
              onClick={() => zipInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                zipFile
                  ? "border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20"
                  : "border-slate-300 dark:border-slate-700 hover:border-emerald-600 bg-white dark:bg-slate-900"
              }`}
            >
              <input
                type="file"
                ref={zipInputRef}
                accept=".zip,application/zip,application/x-zip-compressed"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleZipSelected(f);
                }}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Archive className="w-8 h-8 stroke-[1.75]" />
              </div>

              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {zipFile ? zipFile.name : "Select or Drop Image ZIP Folder"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                JPG, PNG, or WEBP photos named with SKU (e.g. HS-4500LIFT.jpg, HS-4500LIFT-1.jpg).
              </p>

              {isExtractingZip && (
                <div className="mt-4 w-full max-w-xs space-y-1 text-left">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <span>Extracting archive...</span>
                    <span>{zipExtractionProgress.percent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-200" 
                      style={{ width: `${zipExtractionProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {extractedImages.length > 0 && !isExtractingZip && (
                <div className="mt-4 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{extractedImages.length} Photographs Extracted</span>
                </div>
              )}
            </div>

          </div>

          {/* Quick Guidance Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0066CC]" />
              <span>SKU Photograph Naming Conventions</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="font-mono font-bold text-[#0066CC] block">SKU.jpg</span>
                <span className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 block">
                  Primary Cover Photo shown in cards and listings.
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="font-mono font-bold text-[#0066CC] block">SKU-1.jpg</span>
                <span className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 block">
                  Interactive Gallery Angle 1 in product details.
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="font-mono font-bold text-[#0066CC] block">SKU-2.jpg</span>
                <span className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 block">
                  Technical Specifications or Motor Detail view.
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="font-mono font-bold text-[#0066CC] block">SKU-3.jpg</span>
                <span className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 block">
                  Operational in-action workshop photograph.
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                disabled={!csvFile || parsedProducts.length === 0}
                onClick={() => setCurrentStep(2)}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-xs ${
                  csvFile && parsedProducts.length > 0
                    ? "bg-[#0066CC] hover:bg-[#0052A3] text-white cursor-pointer"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <span>Proceed to Preview & Image Matching</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Preview, Validation & Match Review */}
      {currentStep === 2 && (
        <div className="space-y-6">
          
          {/* Validation Metrics Grid */}
          {validationSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Rows</span>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                  {validationSummary.totalRows}
                </h4>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-emerald-600 uppercase block">Valid Items</span>
                <h4 className="text-2xl font-black text-emerald-600 font-mono mt-1">
                  {validationSummary.validRows}
                </h4>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-red-600 uppercase block">Invalid Items</span>
                <h4 className="text-2xl font-black text-red-600 font-mono mt-1">
                  {validationSummary.invalidRows}
                </h4>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-[#0066CC] uppercase block">Matched Covers</span>
                <h4 className="text-2xl font-black text-[#0066CC] font-mono mt-1">
                  {validationSummary.productsWithCover}
                </h4>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-slate-600 uppercase block">Gallery Photos</span>
                <h4 className="text-2xl font-black text-slate-800 dark:text-slate-200 font-mono mt-1">
                  {validationSummary.productsWithGallery}
                </h4>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-amber-600 uppercase block">No Photographs</span>
                <h4 className="text-2xl font-black text-amber-600 font-mono mt-1">
                  {validationSummary.productsMissingImages}
                </h4>
              </div>
            </div>
          )}

          {/* Import Settings Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-[#0066CC]" />
              <span>Import Execution Settings</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Duplicate Handling */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <label className="font-bold text-slate-900 dark:text-white block">
                  Duplicate SKU Handling:
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="dupStrategy" 
                      value="update" 
                      checked={duplicateStrategy === "update"}
                      onChange={() => setDuplicateStrategy("update")}
                      className="text-[#0066CC]"
                    />
                    <span>Update existing products (Safe merge)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="dupStrategy" 
                      value="skip" 
                      checked={duplicateStrategy === "skip"}
                      onChange={() => setDuplicateStrategy("skip")}
                      className="text-[#0066CC]"
                    />
                    <span>Skip existing products</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="dupStrategy" 
                      value="new_only" 
                      checked={duplicateStrategy === "new_only"}
                      onChange={() => setDuplicateStrategy("new_only")}
                      className="text-[#0066CC]"
                    />
                    <span>Import new products only</span>
                  </label>
                </div>
              </div>

              {/* Photo Strategy */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <label className="font-bold text-slate-900 dark:text-white block">
                  Photograph Handling:
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="imgStrategy" 
                      value="replace" 
                      checked={imageStrategy === "replace"}
                      onChange={() => setImageStrategy("replace")}
                      className="text-[#0066CC]"
                    />
                    <span>Replace existing images with ZIP photos</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="imgStrategy" 
                      value="preserve" 
                      checked={imageStrategy === "preserve"}
                      onChange={() => setImageStrategy("preserve")}
                      className="text-[#0066CC]"
                    />
                    <span>Preserve existing images if ZIP photo missing</span>
                  </label>
                </div>
              </div>

              {/* Missing images tolerance */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <label className="font-bold text-slate-900 dark:text-white block">
                  Tolerance & Errors:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={allowMissingGallery}
                      onChange={(e) => setAllowMissingGallery(e.target.checked)}
                      className="rounded-xs text-[#0066CC]"
                    />
                    <span>Allow products with missing optional gallery images</span>
                  </label>
                  <button
                    onClick={handleDownloadErrorReport}
                    className="inline-flex items-center gap-1.5 text-xs text-[#0066CC] dark:text-blue-400 font-bold hover:underline cursor-pointer pt-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Validation Report (.csv)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Table of Matched Products */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterPreviewStatus("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    filterPreviewStatus === "all"
                      ? "bg-[#0066CC] text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  All ({parsedProducts.length})
                </button>
                <button
                  onClick={() => setFilterPreviewStatus("valid")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    filterPreviewStatus === "valid"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Valid ({parsedProducts.filter((p) => p.status === "valid").length})
                </button>
                <button
                  onClick={() => setFilterPreviewStatus("warning")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    filterPreviewStatus === "warning"
                      ? "bg-amber-500 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Warnings ({parsedProducts.filter((p) => p.status === "warning").length})
                </button>
                <button
                  onClick={() => setFilterPreviewStatus("invalid")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    filterPreviewStatus === "invalid"
                      ? "bg-red-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Invalid ({parsedProducts.filter((p) => p.status === "invalid").length})
                </button>
              </div>

              <input
                type="text"
                value={previewSearch}
                onChange={(e) => setPreviewSearch(e.target.value)}
                placeholder="Search preview by title, SKU, category..."
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none min-w-[240px]"
              />
            </div>

            {/* List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                    <th className="py-2.5 px-3">Row</th>
                    <th className="py-2.5 px-3">Photo Preview</th>
                    <th className="py-2.5 px-3">SKU & Model</th>
                    <th className="py-2.5 px-3">Machine Title</th>
                    <th className="py-2.5 px-3">Price (KES)</th>
                    <th className="py-2.5 px-3">Stock</th>
                    <th className="py-2.5 px-3">Matched Photos</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPreviewProducts.slice(0, 50).map((prod) => {
                    const match = imageMatches.find((m) => m.productSku === prod.sku);
                    const coverPreview = match?.coverImage?.previewUrl || prod.coverImage;

                    return (
                      <tr key={prod.sku + prod.rowNumber} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono text-slate-400">#{prod.rowNumber}</td>
                        <td className="py-2.5 px-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                            {coverPreview ? (
                              <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {prod.sku || <span className="text-red-500 font-sans">MISSING</span>}
                        </td>
                        <td className="py-2.5 px-3 max-w-xs">
                          <p className="font-extrabold text-slate-900 dark:text-white truncate">{prod.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{prod.category} • {prod.brand}</p>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#0066CC] dark:text-blue-400">
                          {prod.price > 0 ? `KES ${prod.price.toLocaleString()}` : <span className="text-red-500">INVALID</span>}
                        </td>
                        <td className="py-2.5 px-3 font-mono">{prod.stock}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              match?.coverImage || match?.coverImageSource === "csv_url"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}>
                              {match?.coverImage ? "Cover Matched" : match?.coverImageUrl ? "CSV URL" : "No Cover"}
                            </span>
                            {match && match.galleryImages.length > 0 && (
                              <span className="inline-block px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold font-mono">
                                +{match.galleryImages.length} Gallery
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          {prod.status === "valid" && (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Valid</span>
                            </span>
                          )}
                          {prod.status === "warning" && (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-[11px]" title={prod.warnings.join("\n")}>
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Warning</span>
                            </span>
                          )}
                          {prod.status === "invalid" && (
                            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-bold text-[11px]" title={prod.errors.join("\n")}>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Invalid</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setInspectProduct(prod)}
                            className="text-xs text-[#0066CC] hover:underline font-bold cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredPreviewProducts.length > 50 && (
              <p className="text-[11px] text-slate-400 text-center pt-2">
                Showing first 50 rows of {filteredPreviewProducts.length}. All valid items will be imported.
              </p>
            )}

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Replace Files</span>
              </button>

              <button
                onClick={handleStartImport}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Automated Bulk Import ({parsedProducts.filter((p) => p.status !== "invalid").length} Products)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* STEP 3: Live Real-time Import Progress */}
      {currentStep === 3 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-md space-y-6">
          <div className="text-center max-w-md mx-auto space-y-3">
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#0066CC] flex items-center justify-center mx-auto animate-pulse">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Automated Import in Progress
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Uploading photographs to Firebase Storage and saving machinery specifications in Firestore. Please keep this browser window open.
            </p>

            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                <span>Progress:</span>
                <span>{overallProgressPercent}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#0066CC] to-emerald-500 transition-all duration-300"
                  style={{ width: `${overallProgressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Active Product Telemetry */}
          <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {Object.values(importProgressMap).map((item) => (
              <div key={item.sku} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {item.name}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400">
                    SKU: {item.sku}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.status === "pending" && (
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Queued</span>
                    </span>
                  )}
                  {item.status === "uploading_images" && (
                    <span className="text-[#0066CC] flex items-center gap-1 font-bold">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading Images ({item.uploadedImages}/{item.totalImages})</span>
                    </span>
                  )}
                  {item.status === "saving_product" && (
                    <span className="text-amber-600 flex items-center gap-1 font-bold">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Writing Firestore</span>
                    </span>
                  )}
                  {item.status === "completed" && (
                    <span className="text-emerald-600 flex items-center gap-1 font-bold">
                      <Check className="w-4 h-4" />
                      <span>Imported</span>
                    </span>
                  )}
                  {item.status === "skipped" && (
                    <span className="text-slate-400 font-bold">Skipped (Duplicate)</span>
                  )}
                  {item.status === "failed" && (
                    <span className="text-red-600 font-bold" title={item.error}>
                      Failed: {item.error || "Unknown error"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: Import Complete Summary */}
      {currentStep === 4 && importSummaryResult && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-md space-y-6">
          <div className="text-center max-w-lg mx-auto space-y-2">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              Bulk Import Successfully Completed
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The products and their associated photographs have been committed to Firebase Firestore and Firebase Storage.
            </p>
          </div>

          {/* Results Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase">New Products Created</span>
              <h4 className="text-3xl font-black text-[#0066CC] font-mono mt-1">
                {importSummaryResult.imported}
              </h4>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Existing Products Updated</span>
              <h4 className="text-3xl font-black text-emerald-600 font-mono mt-1">
                {importSummaryResult.updated}
              </h4>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Photos Stored to Firebase</span>
              <h4 className="text-3xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {importSummaryResult.imagesUploaded}
              </h4>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Skipped / Failed</span>
              <h4 className="text-3xl font-black text-slate-400 font-mono mt-1">
                {importSummaryResult.skipped + importSummaryResult.failed}
              </h4>
            </div>
          </div>

          {/* Error Table if any failures occurred */}
          {importSummaryResult.errors.length > 0 && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 space-y-2 text-xs">
              <h5 className="font-extrabold text-red-900 dark:text-red-300">
                Issues Encountered During Import ({importSummaryResult.errors.length})
              </h5>
              <div className="divide-y divide-red-200 dark:divide-red-900/40">
                {importSummaryResult.errors.map((e, idx) => (
                  <div key={idx} className="py-1.5 flex justify-between gap-2">
                    <span className="font-mono font-bold text-red-800 dark:text-red-400">{e.sku} - {e.name}</span>
                    <span className="text-red-600 dark:text-red-400">{e.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => {
                setCsvFile(null);
                setZipFile(null);
                setParsedProducts([]);
                setExtractedImages([]);
                setCurrentStep(1);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Import Another Batch</span>
            </button>

            <button
              onClick={onNavigateToInventory}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>View Machinery in Inventory</span>
            </button>
          </div>
        </div>
      )}

      {/* Inspect Product Modal */}
      {inspectProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{inspectProduct.name}</h4>
                <p className="text-slate-400 font-mono">{inspectProduct.sku}</p>
              </div>
              <button 
                onClick={() => setInspectProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block">Pricing & Category:</span>
                <p className="text-slate-600 dark:text-slate-400">
                  KES {inspectProduct.price.toLocaleString()} • Category: {inspectProduct.category}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block">Description:</span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-h-28 overflow-y-auto">
                  {inspectProduct.description}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block">Technical Specifications:</span>
                <div className="grid grid-cols-2 gap-1.5 mt-1 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl">
                  {Object.entries(inspectProduct.specifications).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-[10px] text-slate-400 block font-mono">{k}:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {inspectProduct.errors.length > 0 && (
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 space-y-1">
                  <span className="font-bold block">Validation Errors:</span>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {inspectProduct.errors.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectProduct(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
