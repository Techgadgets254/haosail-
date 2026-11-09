import { useMemo } from "react";
import { Product } from "../types";

export interface SeoData {
  title: string;
  description: string;
  keywords: string;
  image: string;
  url: string;
  type: string;
}

/**
 * Custom React Hook that dynamically calculates route-specific SEO and Open Graph (OG) metadata
 * for social media link sharing previews (WhatsApp, Twitter, Facebook, LinkedIn, Instagram).
 */
export function useDynamicSeo(
  activeView: string,
  activeProduct: Product | null = null
): SeoData {
  return useMemo(() => {
    // High-resolution OG image assets
    const defaultSiteImage = "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&h=630&auto=format&fit=crop&q=80";
    const shopOgImage = "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=1200&h=630&auto=format&fit=crop&q=80";
    const checkoutOgImage = "https://images.unsplash.com/photo-1556742049-0a67568d0d9f?w=1200&h=630&auto=format&fit=crop&q=80";
    const clientOgImage = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&auto=format&fit=crop&q=80";
    const adminOgImage = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&auto=format&fit=crop&q=80";
    const newsOgImage = "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=630&auto=format&fit=crop&q=80";

    const formatHighResImage = (imgUrl?: string) => {
      if (!imgUrl) return defaultSiteImage;
      if (imgUrl.includes("images.unsplash.com")) {
        return imgUrl.replace(/w=\d+/, "w=1200").replace(/q=\d+/, "q=80");
      }
      return imgUrl;
    };

    if (activeView === "product-details" && activeProduct) {
      const pImage = formatHighResImage(activeProduct.image || activeProduct.gallery?.[0]);
      const formattedPrice = `KES ${activeProduct.price.toLocaleString()}`;
      const stockStatus = activeProduct.stock > 0 ? `In Stock (${activeProduct.stock} units)` : "Available - Request Quote";
      const cleanDesc = activeProduct.description 
        ? activeProduct.description.replace(/\s+/g, " ").slice(0, 150) + "..."
        : `Buy genuine ${activeProduct.brand} ${activeProduct.name} at Haosail Machinery Kenya in Nairobi.`;

      return {
        title: `${activeProduct.name} (${formattedPrice}) | Haosail Machinery Kenya`,
        description: `Buy ${activeProduct.brand} ${activeProduct.name} for ${formattedPrice} in Nairobi. ${stockStatus}. ${cleanDesc} M-Pesa & Bank wire accepted.`,
        keywords: `${activeProduct.name}, ${activeProduct.brand}, ${activeProduct.category}, industrial machinery Nairobi, Haosail Machinery Kenya, construction equipment Kenya`,
        image: pImage,
        url: `https://haosail.ke/?product=${activeProduct.id}`,
        type: "product"
      };
    }

    switch (activeView) {
      case "home":
        return {
          title: "Haosail Machinery Kenya | Construction & Industrial Equipment (haosail.ke)",
          description: "Leading supplier of auto-maintenance lifts, concrete mixers, woodworking machinery, road rollers, air compressors, and generators in Industrial Area, Nairobi, Kenya.",
          keywords: "Haosail Machinery Kenya, haosail.ke, car lift Nairobi, concrete mixer Kenya, woodworking machines Nairobi, road rollers Kenya, generators Nairobi",
          image: defaultSiteImage,
          url: "https://haosail.ke/",
          type: "website"
        };
      case "shop":
        return {
          title: "Machinery Catalog & Industrial Equipment | Haosail Machinery Kenya",
          description: "Explore Haosail's full range of car lifts, 3D wheel aligners, concrete mixers, plate compactors, woodworking panel saws, air compressors, and silent diesel generators.",
          keywords: "Buy car lift Nairobi, construction equipment Kenya, woodworking machines Nairobi, plate compactor Kenya, Haosail Machinery showroom",
          image: shopOgImage,
          url: "https://haosail.ke/?view=shop",
          type: "website"
        };
      case "product-details":
        return {
          title: "Technical Specifications & Stock | Haosail Machinery Kenya",
          description: "View technical specifications, motor ratings, factory warranty terms, and request direct site delivery across Kenya.",
          keywords: "Industrial machinery specs Nairobi, Haosail warranty Kenya, car lift price Nairobi, concrete mixer specs",
          image: shopOgImage,
          url: "https://haosail.ke/?view=product-details",
          type: "product"
        };
      case "checkout":
        return {
          title: "Order Checkout & Payment | Haosail Machinery Kenya",
          description: "Secure your machinery order via M-Pesa or Bank Wire with direct showroom pickup in Industrial Area, Nairobi or flatbed crane transport.",
          keywords: "M-Pesa machinery payment, Haosail checkout Kenya, machinery delivery Nairobi",
          image: checkoutOgImage,
          url: "https://haosail.ke/?view=checkout",
          type: "website"
        };
      case "client-dashboard":
        return {
          title: "Client Portal & Maintenance Hub | Haosail Machinery Kenya",
          description: "Track equipment order dispatches, download official tax invoices, register 12-month warranties, and request technical support.",
          keywords: "Haosail order tracking, download invoice Kenya, machinery maintenance Nairobi",
          image: clientOgImage,
          url: "https://haosail.ke/?view=client-dashboard",
          type: "website"
        };
      case "admin-dashboard":
        return {
          title: "Admin Console & Inventory Control | Haosail Machinery Kenya",
          description: "Management dashboard for Haosail inventory, order tracking, technical service logs, and customer communications.",
          keywords: "Haosail admin console, machinery stock control Nairobi",
          image: adminOgImage,
          url: "https://haosail.ke/?view=admin-dashboard",
          type: "website"
        };
      case "news":
        return {
          title: "Machinery Insights & Technical Guides | Haosail Machinery Kenya",
          description: "Technical guides, garage setup advice, contractor machinery maintenance tips, and industry news from Haosail Kenya.",
          keywords: "Haosail blogs Kenya, garage setup guide Nairobi, construction machinery maintenance Kenya",
          image: newsOgImage,
          url: "https://haosail.ke/?view=news",
          type: "article"
        };
      case "return-policy":
        return {
          title: "12-Month Haosail Factory Warranty & Support | Haosail Machinery Kenya",
          description: "Haosail Machinery Kenya 12-month factory warranty coverage, technical training guarantee, and spare parts support in Nairobi.",
          keywords: "Haosail warranty Kenya, machinery return policy Nairobi, equipment warranty Kenya",
          image: defaultSiteImage,
          url: "https://haosail.ke/return-policy",
          type: "website"
        };
      default:
        return {
          title: "Haosail Machinery Kenya | Construction & Industrial Equipment",
          description: "Industrial machinery, auto-maintenance lifts, woodworking, compressors, and generators in Nairobi, Kenya.",
          keywords: "Haosail Machinery Kenya, haosail.ke, industrial equipment Nairobi",
          image: defaultSiteImage,
          url: "https://haosail.ke/",
          type: "website"
        };
    }
  }, [activeView, activeProduct]);
}

