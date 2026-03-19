import { create } from "zustand";
import { Restaurant } from "./definitions";
import { User } from "./types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAccessToken: (token) => set({ accessToken: token }),
  logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
}));

interface RestaurantState {
  restaurants: Restaurant[];
  setRestaurants: (restaurants: Restaurant[]) => void;
  addRestaurant: (restaurant: Restaurant) => void;
  updateRestaurant: (id: string, updates: Partial<Restaurant>) => void;
}

export const useRestaurantStore = create<RestaurantState>((set) => ({
  restaurants: [],
  setRestaurants: (restaurants) => set({ restaurants }),
  addRestaurant: (restaurant) =>
    set((state) => ({ restaurants: [restaurant, ...state.restaurants] })),
  updateRestaurant: (id, updates) =>
    set((state) => ({
      restaurants: state.restaurants.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),
}));

// ---------------------------------------------------------------------------
// Global Turnstile token store
// Turnstile tokens are single-use on the server. We store the most recently
// issued token here so any page/component can consume it. Once consumed it
// must be refreshed by a new Turnstile widget render.
// ---------------------------------------------------------------------------
interface TurnstileState {
  /** The current unused Turnstile token, or null if expired/consumed. */
  token: string | null;
  setToken: (token: string | null) => void;
  clearToken: () => void;
}

export const useTurnstileStore = create<TurnstileState>((set) => ({
  token: null,
  setToken: (token) => set({ token }),
  clearToken: () => set({ token: null }),
}));
