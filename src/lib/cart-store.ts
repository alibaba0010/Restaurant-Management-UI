import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Menu } from "./types";

export interface CartItem extends Menu {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  restaurantId: string | null; // Start with one restaurant constraint for simplicity
  addItem: (item: Menu) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, info: "increment" | "decrement") => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,

      addItem: (item) => {
        const { items, restaurantId } = get();

        // If cart has items from another restaurant, confirm reset (simplified: just error or reset)
        // For now, if different restaurant, we'll replace the cart or warn.
        // Let's implement auto-reset for better UX in this MVP, or stick to same restaurant logic.
        if (restaurantId && restaurantId !== item.restaurant_id) {
          // Optional: throw error or handle UI confirmation.
          // For now, we will allow mixed cart but the backend might reject Order.
          // Actually, best practice is to clear cart if restaurant changes or support multi-restaurant orders (complex).
          // Let's enforce single restaurant for simplicity.
          if (
            !confirm(
              "Adding items from a different restaurant will clear your current cart. Continue?",
            )
          ) {
            return;
          }
          set({ items: [], restaurantId: item.restaurant_id });
        }

        const currentItems = get().items;
        const existingItem = currentItems.find((i) => i.id === item.id);

        if (existingItem) {
          set({
            items: currentItems.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
            ),
          });
        } else {
          set({
            items: [...currentItems, { ...item, quantity: 1 }],
            restaurantId: item.restaurant_id,
          });
        }
      },

      removeItem: (itemId) => {
        set((state) => {
          const newItems = state.items.filter((i) => i.id !== itemId);
          return {
            items: newItems,
            restaurantId: newItems.length === 0 ? null : state.restaurantId,
          };
        });
      },

      updateQuantity: (itemId, info) => {
        set((state) => {
          const newItems = state.items
            .map((i) => {
              if (i.id === itemId) {
                const newQuantity =
                  info === "increment" ? i.quantity + 1 : i.quantity - 1;
                return { ...i, quantity: Math.max(0, newQuantity) };
              }
              return i;
            })
            .filter((i) => i.quantity > 0);

          return {
            items: newItems,
            restaurantId: newItems.length === 0 ? null : state.restaurantId,
          };
        });
      },

      clearCart: () => set({ items: [], restaurantId: null }),

      totalItems: () =>
        get().items.reduce((acc, item) => acc + item.quantity, 0),
      totalPrice: () =>
        get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    {
      name: "cart-storage",
    },
  ),
);
