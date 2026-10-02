/**
 * Types mirrored from docs/API_CONTRACT.md (public storefront subset).
 * Keep in sync with the backend contract.
 */

export type ApiSuccess<T> = { success: true; message: string; data: T };

export type ApiFieldError = { field?: string; message: string };

export type ApiErrorBody = {
  success: false;
  statusCode: number;
  message: string;
  errors: ApiFieldError[];
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type Paginated<T> = { items: T[]; meta: PaginationMeta };

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";
export type PaymentMethod = "CASH_ON_DELIVERY";
export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type Store = {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  googleMapLink: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  website: string | null;
  openingTime: string | null;
  closingTime: string | null;
  workingDays: string | null;
  isOpen: boolean;
  closedMessage: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroCtaLabel: string | null;
  announcement: string | null;
  shippingPolicy: string | null;
  returnPolicy: string | null;
  privacyPolicy: string | null;
  termsAndConditions: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicStore = Store & {
  isOpenNow: boolean;
  whatsappUrl: string | null;
  phoneUrl: string | null;
};

export type CategoryRef = { id: string; name: string; slug: string };

export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  productCount: number;
  children: CategorySummary[];
};

export type CategoryDetail = CategorySummary & {
  seoTitle: string | null;
  seoDescription: string | null;
  parent: CategoryRef | null;
  children: CategorySummary[];
  updatedAt: string;
};

export type ProductCard = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  price: number;
  salePrice: number | null;
  effectivePrice: number;
  discountPercent: number;
  minPrice: number;
  maxPrice: number;
  stock: number;
  inStock: boolean;
  stockStatus: StockStatus;
  isFeatured: boolean;
  hasVariants: boolean;
  category: CategoryRef;
  createdAt: string;
};

export type ProductImage = { id: string; url: string; alt: string | null; position: number };

export type ProductOptionGroup = {
  id: string;
  name: string;
  position: number;
  values: { id: string; value: string; position: number }[];
};

export type ProductVariant = {
  id: string;
  title: string;
  sku: string | null;
  price: number;
  salePrice: number | null;
  effectivePrice: number;
  discountPercent: number;
  stock: number;
  inStock: boolean;
  imageUrl: string | null;
  optionValueIds: string[];
  options: Record<string, string>;
};

export type ProductDetail = Omit<ProductCard, "category"> & {
  description: string | null;
  sku: string | null;
  specifications: { label: string; value: string }[];
  images: ProductImage[];
  options: ProductOptionGroup[];
  variants: ProductVariant[];
  category: CategoryRef & { parent: CategoryRef | null };
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
};

export type ProductSort = "featured" | "newest" | "price_asc" | "price_desc" | "name_asc" | "name_desc";

export type ProductQuery = {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  options?: string; // "Color:Red,Age:3+"
  sort?: ProductSort;
  page?: number;
  limit?: number;
};

export type ProductFacets = {
  priceRange: { min: number; max: number };
  options: { name: string; values: string[] }[];
  categories: (CategoryRef & { count: number })[];
  total: number;
};

export type SitemapData = {
  products: { slug: string; updatedAt: string }[];
  categories: { slug: string; updatedAt: string }[];
};

export type CartItemInput = { productId: string; variantId?: string | null; quantity: number };

export type CartLineStatus = "OK" | "QUANTITY_ADJUSTED" | "OUT_OF_STOCK" | "UNAVAILABLE" | "VARIANT_REQUIRED";

export type CartLine = {
  productId: string;
  variantId: string | null;
  requestedQuantity: number;
  quantity: number;
  maxQuantity: number;
  status: CartLineStatus;
  message: string | null;
  product: { id: string; name: string; slug: string; thumbnailUrl: string | null; sku: string | null } | null;
  variant: { id: string; title: string; options: Record<string, string>; imageUrl: string | null } | null;
  unitMrp: number;
  unitPrice: number;
  lineTotal: number;
};

export type CartValidation = {
  items: CartLine[];
  summary: { itemsCount: number; subtotal: number; discount: number; shippingFee: number; total: number };
  hasIssues: boolean;
};

export type CreateOrderInput = {
  customerName: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  googleMapsLink?: string;
  locationLink?: string;
  latitude?: number;
  longitude?: number;
  note?: string;
  items: CartItemInput[];
};

export type PublicOrder = {
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  alternatePhone: string | null;
  customerEmail: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string | null;
  googleMapsLink: string | null;
  locationLink: string | null;
  customerNote: string | null;
  items: {
    productName: string;
    productSlug: string | null;
    variantTitle: string | null;
    options: { name: string; value: string }[];
    imageUrl: string | null;
    sku: string | null;
    quantity: number;
    unitMrp: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  itemsCount: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  history: { status: OrderStatus; createdAt: string }[];
};

export type HealthStatus = { status: "ok"; database: "up" | "down"; uptime: number; timestamp: string };
