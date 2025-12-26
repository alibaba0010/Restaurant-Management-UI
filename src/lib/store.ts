import { create } from "zustand";
import { Restaurant } from "./definitions";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

interface RestaurantState {
  restaurants: Restaurant[];
  setRestaurants: (restaurants: Restaurant[]) => void;
  addRestaurant: (restaurant: Restaurant) => void;
}

export const useRestaurantStore = create<RestaurantState>((set) => ({
  restaurants: [],
  setRestaurants: (restaurants) => set({ restaurants }),
  addRestaurant: (restaurant) =>
    set((state) => ({ restaurants: [restaurant, ...state.restaurants] })),
}));
