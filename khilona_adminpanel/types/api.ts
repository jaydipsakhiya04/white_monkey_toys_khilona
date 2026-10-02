// Types mirrored from docs/API_CONTRACT.md — keep in sync with the backend contract.

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

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ['UNPAID', 'PAID', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type PaymentMethod = 'CASH_ON_DELIVERY';
export type AdminRole = 'SUPER_ADMIN' | 'ADMIN';
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

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

export type StoreInput = Partial<Omit<Store, 'id' | 'currency' | 'createdAt' | 'updatedAt'>>;

export type ProductImage = { id: string; url: string; alt: string | null; position: number };

export type AdminProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export type AuthResponse = { accessToken: string; expiresIn: number; admin: AdminProfile };

// ---------- Dashboard ----------
export type Dashboard = {
  orders: {
    total: number;
    today: number;
    byStatus: Record<OrderStatus, number>;
    deliveredRevenue: number;
    openValue: number;
  };
  products: { total: number; active: number; inactive: number; outOfStock: number; lowStock: number; featured: number };
  categories: { total: number; active: number };
  recentOrders: AdminOrderListItem[];
  lowStockProducts: {
    id: string;
    name: string;
    sku: string | null;
    stock: number;
    thumbnailUrl: string | null;
    lowStockThreshold: number;
  }[];
  ordersLast14Days: { date: string; count: number; total: number }[];
};

// ---------- Uploads ----------
export type UploadFolder = 'products' | 'categories' | 'store';
export type UploadResult = { url: string; width: number; height: number; size: number; contentType: string };

// ---------- Categories ----------
export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  parentId: string | null;
  parent: { id: string; name: string } | null;
  productCount: number; // incl. sub-categories
  directProductCount: number;
  childrenCount: number;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CategoryOption = { id: string; name: string; parentId: string | null; isActive: boolean };

export type CategoryInput = {
  name: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  parentId?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export type CategoryListParams = {
  search?: string;
  status?: 'active' | 'inactive';
  parentId?: string;
  sort?: 'sortOrder' | 'name' | 'newest' | 'products';
  page?: number;
  limit?: number;
};

// ---------- Products ----------
export type AdminProductListItem = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  thumbnailUrl: string | null;
  price: number;
  salePrice: number | null;
  stock: number;
  stockStatus: StockStatus;
  lowStockThreshold: number;
  isActive: boolean;
  isFeatured: boolean;
  hasVariants: boolean;
  variantsCount: number;
  sortOrder: number;
  category: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
};

export type AdminProductVariant = {
  id: string;
  title: string;
  options: Record<string, string>;
  sku: string | null;
  price: number | null;
  salePrice: number | null;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  position: number;
};

export type AdminProductDetail = AdminProductListItem & {
  shortDescription: string | null;
  description: string | null;
  specifications: { label: string; value: string }[];
  seoTitle: string | null;
  seoDescription: string | null;
  images: ProductImage[];
  options: { name: string; values: string[] }[];
  variants: AdminProductVariant[];
  ordersCount: number;
};

export type ProductInput = {
  name: string;
  slug?: string;
  categoryId: string;
  shortDescription?: string | null;
  description?: string | null;
  sku?: string | null;
  price: number;
  salePrice?: number | null;
  stock?: number;
  lowStockThreshold?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  specifications?: { label: string; value: string }[];
  images?: { url: string; alt?: string | null }[];
  options?: { name: string; values: string[] }[];
  variants?: {
    options: Record<string, string>;
    sku?: string | null;
    price?: number | null;
    salePrice?: number | null;
    stock: number;
    imageUrl?: string | null;
    isActive?: boolean;
  }[];
};

export type ProductSort =
  | 'newest'
  | 'oldest'
  | 'name_asc'
  | 'name_desc'
  | 'price_asc'
  | 'price_desc'
  | 'stock_asc'
  | 'sortOrder';

export type ProductListParams = {
  search?: string;
  categoryId?: string;
  status?: 'active' | 'inactive';
  stock?: 'in' | 'low' | 'out';
  featured?: 'true' | 'false';
  sort?: ProductSort;
  page?: number;
  limit?: number;
};

export type BulkProductAction = 'activate' | 'deactivate' | 'feature' | 'unfeature' | 'delete';

// ---------- Orders ----------
export type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customerName: string;
  customerPhone: string;
  city: string;
  itemsCount: number;
  total: number;
  itemsPreview: string[];
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  id: string;
  productId: string | null;
  variantId: string | null;
  categoryName: string | null;
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
};

export type OrderHistoryEntry = {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  changedByName: string | null;
  createdAt: string;
};

export type AdminOrderDetail = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  customerId: string | null;
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
  latitude: number | null;
  longitude: number | null;
  customerNote: string | null;
  adminNote: string | null;
  items: OrderItem[];
  itemsCount: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  confirmedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  stockRestored: boolean;
  history: OrderHistoryEntry[];
  allowedTransitions: OrderStatus[];
  contact: { callUrl: string; whatsappUrl: string; alternateCallUrl: string | null; mapsUrl: string | null };
  customerOrdersCount: number;
};

export type OrderSort = 'newest' | 'oldest' | 'total_desc' | 'total_asc';

export type OrderListParams = {
  status?: OrderStatus;
  search?: string;
  from?: string;
  to?: string;
  sort?: OrderSort;
  page?: number;
  limit?: number;
};

export type OrderStatusCounts = Record<OrderStatus | 'ALL', number>;

// ---------- Admins ----------
export type AdminCreateInput = { name: string; email: string; password: string; phone?: string; role: AdminRole };
export type AdminUpdateInput = { name?: string; phone?: string; role?: AdminRole; isActive?: boolean; password?: string };
