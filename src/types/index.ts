import { User, Lead, Customer, Product, Order, OrderItem, FollowUp, Notification } from '@prisma/client';

export type UserWithoutPassword = Omit<User, 'password'>;

export type LeadWithFollowUps = Lead & {
  followUps: FollowUp[];
  customer?: Customer | null;
};

export type CustomerWithOrders = Customer & {
  orders: (Order & {
    items: (OrderItem & { product: Product })[];
  })[];
  followUps: FollowUp[];
};

export type OrderWithDetails = Order & {
  customer: Customer;
  items: (OrderItem & { product: Product })[];
};

export type FollowUpWithRelations = FollowUp & {
  lead?: Lead | null;
  customer?: Customer | null;
  order?: Order | null;
};

export interface DashboardStats {
  totalRevenue: number;
  ordersToday: number;
  leadsToday: number;
  upcomingFollowUps: number;
  refillReminders: number;
  topProducts: { name: string; sales: number; revenue: number }[];
  recentOrders: OrderWithDetails[];
  pendingFollowUps: FollowUpWithRelations[];
}

export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

export interface LeadConversionData {
  month: string;
  leads: number;
  converted: number;
  rate: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Form types
export interface CreateLeadInput {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  source: string;
  notes?: string;
  status: string;
  followUpDate?: string;
}

export interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  tags?: string[];
  notes?: string;
}

export interface CreateProductInput {
  name: string;
  variant?: string;
  sku: string;
  price: number;
  stock: number;
  description?: string;
  refillCycleDays: number;
}

export interface CreateOrderInput {
  customerId: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  paymentStatus: string;
  deliveryStatus: string;
  notes?: string;
}
