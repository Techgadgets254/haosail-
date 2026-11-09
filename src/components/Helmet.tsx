import { useEffect, useState } from "react";
import { Product } from "../types";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

interface HelmetProps {
  title: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  product?: Product;
}

export function Helmet({ title, description, keywords, image, url, type, product }: HelmetProps) {
  const [googleSiteVerification, setGoogleSiteVerification] = useState("");

  useEffect(() => {
    const fetchSiteMetadata = async () => {
      try {
        const seoRef = doc(db, "seo_metadata", "site");
        const snap = await getDoc(seoRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.googleSiteVerification) {
            setGoogleSiteVerification(data.googleSiteVerification);
          }
        }
      } catch (err) {
        console.error("Error loading verification meta:", err);
      }
    };
    fetchSiteMetadata();
  }, []);

  useEffect(() => {
    const defaultDesc = "Haosail Machinery Kenya (haosail.ke) provides construction machinery, auto-maintenance lifts, woodworking equipment, air compressors, and generators in Industrial Area, Nairobi.";
    
    // Dynamically derive attributes based on product data if present
    const activeTitle = product ? `${product.name} | Haosail Machinery Kenya` : title;
    const activeDesc = product?.description || description || defaultDesc;
    
    let productImgUrl = "";
    if (product?.image) {
      productImgUrl = product.image.startsWith("http") 
        ? product.image 
        : `https://haosail.ke${product.image.startsWith("/") ? "" : "/"}${product.image}`;
    }
    const activeImage = productImgUrl || image || "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=1200";
    const activeUrl = product ? `https://haosail.ke/product/${product.id}` : (url || window.location.href);
    const activeType = product ? "product" : (type || "website");

    // 1. Update Browser Dynamic Document Title
    document.title = activeTitle;

    // Helper to set or create meta property/name tags
    const setMetaTag = (attributeName: "name" | "property", value: string, content: string) => {
      let element = document.querySelector(`meta[${attributeName}="${value}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attributeName, value);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    if (googleSiteVerification) {
      setMetaTag("name", "google-site-verification", googleSiteVerification);
    }

    // 2. Standard Description and Keywords
    setMetaTag("name", "description", activeDesc);
    if (keywords) {
      setMetaTag("name", "keywords", keywords);
    }

    // 3. OpenGraph tags (Optimized for WhatsApp, Facebook, LinkedIn previews)
    setMetaTag("property", "og:title", activeTitle);
    setMetaTag("property", "og:description", activeDesc);
    setMetaTag("property", "og:image", activeImage);
    setMetaTag("property", "og:image:secure_url", activeImage);
    setMetaTag("property", "og:url", activeUrl);
    setMetaTag("property", "og:type", activeType);
    setMetaTag("property", "og:site_name", "Haosail Machinery Kenya");
    setMetaTag("property", "og:locale", "en_KE");

    // 4. Twitter Card tags
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", activeTitle);
    setMetaTag("name", "twitter:description", activeDesc);
    setMetaTag("name", "twitter:image", activeImage);
    setMetaTag("name", "twitter:site", "@HaosailKenya");
    setMetaTag("name", "twitter:creator", "@HaosailKenya");

    // 5. Dynamic JSON-LD structured data injection for Product Crawling
    if (product) {
      let scriptElement = document.getElementById("helmet-jsonld") as HTMLScriptElement;
      if (!scriptElement) {
        scriptElement = document.createElement("script");
        scriptElement.id = "helmet-jsonld";
        scriptElement.type = "application/ld+json";
        document.head.appendChild(scriptElement);
      }

      const ratingValue = product.rating || 4.9;
      const availability = (product.stock !== undefined && product.stock > 0) 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock";

      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "image": product.image ? (product.image.startsWith("http") ? product.image : `https://haosail.ke${product.image}`) : "https://haosail.ke/logo.png",
        "description": product.description || `Genuine ${product.name} with 12-month factory warranty, available at Haosail Machinery Kenya.`,
        "brand": {
          "@type": "Brand",
          "name": product.brand || "HaoSail"
        },
        "sku": product.id,
        "mpn": product.id,
        "offers": {
          "@type": "Offer",
          "url": `https://haosail.ke/product/${product.id}`,
          "priceCurrency": "KES",
          "price": product.price,
          "priceValidUntil": "2027-12-31",
          "itemCondition": "https://schema.org/NewCondition",
          "availability": availability,
          "seller": {
            "@type": "Organization",
            "name": "Haosail Machinery Kenya",
            "url": "https://haosail.ke"
          }
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": ratingValue,
          "reviewCount": product.reviews?.length || 5,
          "bestRating": "5",
          "worstRating": "1"
        }
      };

      scriptElement.textContent = JSON.stringify(jsonLd);
    } else {
      const existingScript = document.getElementById("helmet-jsonld");
      if (existingScript) {
        existingScript.remove();
      }
    }

    return () => {
      // Cleanup dynamically created script on unmount
      const existingScript = document.getElementById("helmet-jsonld");
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [title, description, keywords, image, url, product, googleSiteVerification]);

  return null;
}
