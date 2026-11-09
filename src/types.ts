/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: "Auto Maintenance" | "Construction Machinery" | "Woodworking" | "Metal Working" | "Air Compressors & Pumps" | "Generators & Welders" | "All Machinery" | string;
  subcategory?: string;
  price: number;
  originalPrice?: number;
  warranty?: string;
  stock: number;
  description: string;
  image: string;
  sku?: string;
  gallery?: string[]; // Up to 5 images total (image + 4 extra gallery images)
  specifications: Record<string, string>;
  tags?: string[];
  rating?: number;
  enableVariants?: boolean;
  customVariants?: {
    label: string;
    options: {
      name: string;
      price: number;
    }[];
  };
  variants?: {
    id: string;
    ram?: string;
    ssd?: string;
    sku?: string;
    selections?: Record<string, string>;
    price: number;
    stock: number;
  }[];
  variantGroups?: {
    name: string;
    options: string[];
  }[];
  reviews?: {
    id: string;
    userName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }[];
  flashPrice?: number | null;
  flashStart?: string | null;
  flashExpiry?: string | null;
  flashBanner?: string | null;
  createdAt?: any;
  updatedAt?: any;
}

export interface OrderItem {
  id?: string;
  productId: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  email?: string;
  customerPhone: string;
  shippingAddress: string;
  county?: string;
  notes?: string;
  items: OrderItem[];
  totalAmount: number;
  mpesaPhone: string;
  mpesaReceiptNumber?: string;
  paymentMethod?: string;
  receiptNo?: string;
  paymentStatus: "Pending" | "Paid" | "Failed" | string;
  shippingStatus: "Processing" | "Shipped" | "Delivered" | string;
  referralCode?: string;
  paymentProvider?: string;
  courierName?: string;
  courierWaybill?: string;
  courierPhone?: string;
  orderType?: "standard" | "bulk_quote" | string;
  companyName?: string;
  companyTaxPin?: string;
  timeline?: string;
  targetBudget?: string;
  quoteStatus?: "pending" | "quoted" | "accepted" | "rejected" | string;
  createdAt?: any;
  updatedAt?: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: "admin" | "customer";
  wishlist?: string[];
  phone?: string;
  address?: string;
  company?: string;
  garageName?: string;
  createdAt?: any;
}

export interface Affiliate {
  id: string;
  name: string;
  email: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  active: boolean;
  createdAt: string;
}

export interface ProductReview {
  id?: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ActivityLog {
  id?: string;
  type: "page_view" | "search";
  target: string;
  userId?: string;
  createdAt: string;
}

export interface TransactionFeedback {
  id?: string;
  orderId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CompanyProfile {
  id?: string;
  name: string;
  logoUrl: string;
  taxPin: string;
  address: string;
  email: string;
  phone: string;
  updatedAt: string;
}

export interface CartToast {
  id: string;
  productName: string;
  productImage: string;
  price: number;
}

export interface BrowsingHistoryItem {
  id?: string;
  userId: string;
  productId: string;
  productName?: string;
  category?: string;
  brand?: string;
  viewedAt: string;
}

export interface SparePartsRequest {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  orderId?: string;
  productId?: string;
  productName: string;
  productImage?: string;
  productSku?: string;
  purchaseDate?: string;
  partName?: string;
  partNumber?: string;
  partDescription: string;
  machineSerialNumber?: string;
  workshopLocation?: string;
  urgency: "routine" | "preventive" | "urgent" | "machine_down";
  quantity: number;
  photoUrl?: string;
  status: "submitted" | "under_review" | "quoted" | "dispatched" | "fulfilled" | "cancelled";
  quoteAmount?: number;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BulkQuoteRequest {
  id?: string;
  userId?: string;
  customerName: string;
  companyName?: string;
  companyTaxPin?: string;
  customerEmail: string;
  customerPhone: string;
  county: string;
  workshopLocation: string;
  timeline?: string;
  targetBudget?: string;
  customRequirements?: string;
  items: {
    productId: string;
    name: string;
    brand: string;
    image: string;
    unitPrice: number;
    requestedUnits: number;
    notes?: string;
  }[];
  estimatedTotal?: number;
  status: "pending" | "reviewing" | "quoted" | "closed";
  createdAt: string;
  updatedAt?: string;
}




