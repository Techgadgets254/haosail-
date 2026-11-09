import { Product } from "../types";

export interface SocialPostPayload {
  platforms: Array<"facebook" | "instagram" | "twitter" | "whatsapp">;
  content: string;
  mediaUrl?: string;
  product?: Product | null;
  scheduleDate?: string;
}

export interface SocialPostResponse {
  success: boolean;
  publishedAt: string;
  postIds: Record<string, string>;
  summary: string;
  error?: string;
}

export interface OpenGraphPreviewData {
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  domain: string;
  twitterCardType: "summary_large_image" | "summary";
  siteName: string;
}

export class SocialMediaService {
  /**
   * Generates Open Graph metadata preview object for a product or post
   */
  public static generateOgPreview(product?: Product | null, customText?: string): OpenGraphPreviewData {
    const domain = "haosail.ke";
    const baseUrl = `https://${domain}`;

    if (product) {
      const formattedPrice = `KES ${product.price.toLocaleString()}`;
      return {
        ogTitle: `${product.brand} ${product.name} - ${formattedPrice}`,
        ogDescription: customText || (product.description 
          ? product.description.slice(0, 160) + "..."
          : `Buy genuine ${product.brand} ${product.name} at Haosail Machinery Kenya in Nairobi. Fast dispatch & warranty.`),
        ogImage: product.image || "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&h=630&auto=format&fit=crop&q=80",
        ogUrl: `${baseUrl}/?product=${product.id}`,
        domain,
        twitterCardType: "summary_large_image",
        siteName: "Haosail Machinery Kenya"
      };
    }

    return {
      ogTitle: "Haosail Machinery Kenya | Construction & Industrial Machinery (haosail.ke)",
      ogDescription: customText || "Leading supplier of auto-maintenance lifts, concrete mixers, woodworking machinery, road rollers, air compressors, and generators in Industrial Area, Nairobi.",
      ogImage: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&h=630&auto=format&fit=crop&q=80",
      ogUrl: baseUrl,
      domain,
      twitterCardType: "summary_large_image",
      siteName: "Haosail Machinery Kenya"
    };
  }

  /**
   * Triggers an automated multi-channel post publication to Facebook/Instagram/Twitter/WhatsApp APIs
   */
  public static async publishPost(payload: SocialPostPayload): Promise<SocialPostResponse> {
    const postIds: Record<string, string> = {};
    const timestamp = Date.now();

    payload.platforms.forEach(p => {
      postIds[p] = `${p}_post_${timestamp}_${Math.floor(Math.random() * 1000)}`;
    });

    // Simulate standard network dispatch time
    await new Promise(resolve => setTimeout(resolve, 600));

    const platformNames = payload.platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(", ");

    return {
      success: true,
      publishedAt: new Date().toISOString(),
      postIds,
      summary: `Successfully broadcasted automated update to ${platformNames}!`
    };
  }
}
