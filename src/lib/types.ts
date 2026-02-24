/**
 * UserRole represents the different roles in the system.
 * Matches the backend implementation in internal/common/types/roles.go
 */
export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  MANAGEMENT = "management",
}

/**
 * UserStatus represents the different statuses a user can have.
 * Matches the backend implementation in internal/common/types/status.go
 */
export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PENDING = "pending",
  SUSPENDED = "suspended",
  DELETED = "deleted",
}

/**
 * RestaurantStatus represents the different statuses a restaurant can have.
 */
export enum RestaurantStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  BLOCKED = "blocked",
  DELETED = "deleted",
}

/**
 * OrderStatus represents the current state of an order.
 * Matches backend internal/common/types/status.go
 */
export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PREPARING = "preparing",
  READY = "ready",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

/**
 * PaymentStatus represents the state of a payment for an order.
 */
export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SUCCESS = "success",
  PAID = "paid", // Alias for success
  FAILED = "failed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
  REFUNDING = "refunding",
  PARTIALLY_REFUNDED = "partially_refunded",
}

/**
 * PaymentProvider represents the payment provider.
 */
export enum PaymentProvider {
  MONNIFY = "monnify",
  PAYSTACK = "paystack",
  FLUTTERWAVE = "flutterwave",
}

/**
 * OrderType represents the type of fulfillment for an order.
 */
export enum OrderType {
  DELIVERY = "delivery",
  PICKUP = "pickup",
  DINE_IN = "dine_in",
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  address?: string;
  avatar_url?: string;
  phone_number?: string;
  created_at: string;
  updated_at: string;
}

// Helper to check if a role has at least the required permission level
export const hasPermission = (
  userRole: UserRole,
  requiredRole: UserRole,
): boolean => {
  const hierarchy: Record<UserRole, number> = {
    [UserRole.ADMIN]: 3,
    [UserRole.MANAGEMENT]: 2,
    [UserRole.USER]: 1,
  };

  return hierarchy[userRole] >= hierarchy[requiredRole];
};

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Menu {
  id: string;
  name: string;
  description: string;
  price: string;
  image_urls: string[];
  video_url?: string;
  restaurant_id: string;
  is_available: boolean;
  prep_time_minutes?: number;
  calories?: number;
  stock_quantity: number;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  allergens?: string[];
  tags?: string[];
  categories?: MenuCategory[];
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  phone_number?: string;
  avatar_url?: string;
  user_id: string;
  status: RestaurantStatus;
  capacity?: number;
  delivery_available: boolean;
  takeaway_available: boolean;
  rating?: number;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  user_id: string;
  restaurant_id: string;
  subtotal: number;
  service_charge: number;
  service_charge_percent: string;
  total_amount: number;
  currency: string;
  status: OrderStatus;
  order_type: OrderType;
  payment_status: PaymentStatus;
  payment_provider?: PaymentProvider;
  delivery_address: string;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  services: {
    postgres: string;
    redis: string;
  };
}
