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
  requiredRole: UserRole
): boolean => {
  const hierarchy: Record<UserRole, number> = {
    [UserRole.ADMIN]: 3,
    [UserRole.MANAGEMENT]: 2,
    [UserRole.USER]: 1,
  };

  return hierarchy[userRole] >= hierarchy[requiredRole];
};

export interface Menu {
  id: string;
  name: string;
  description: string;
  price: number;
  image_urls: string[];
  video_url?: string;
  restaurant_id: string;
  is_available: boolean;
  prep_time_minutes?: number;
  calories?: number;
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  phone_number: string;
  user_id: string;
  status: RestaurantStatus;
  created_at: string;
  updated_at: string;
}
