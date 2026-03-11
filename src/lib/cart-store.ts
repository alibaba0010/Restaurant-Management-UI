import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Menu } from "./types";

export interface CartItem extends Menu {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Menu, quantity?: number) => void;
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

      addItem: (item, quantity = 1) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((i) => i.id === item.id);

        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity;
          if (newQuantity > item.stock_quantity) {
            alert(`Sorry, only ${item.stock_quantity} units available.`);
            return;
          }
          set({
            items: currentItems.map((i) =>
              i.id === item.id ? { ...i, quantity: newQuantity } : i,
            ),
          });
        } else {
          if (quantity > item.stock_quantity) {
            alert(`Sorry, only ${item.stock_quantity} units available.`);
            return;
          }
          set({
            items: [...currentItems, { ...item, quantity }],
          });
        }
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
        }));
      },

      updateQuantity: (itemId, info) => {
        set((state) => {
          const newItems = state.items
            .map((i) => {
              if (i.id === itemId) {
                let newQuantity = i.quantity;
                if (info === "increment") {
                  if (i.quantity < i.stock_quantity) {
                    newQuantity = i.quantity + 1;
                  } else {
                    alert(`Sorry, only ${i.stock_quantity} units available.`);
                  }
                } else {
                  newQuantity = i.quantity - 1;
                }
                return { ...i, quantity: Math.max(0, newQuantity) };
              }
              return i;
            })
            .filter((i) => i.quantity > 0);

          return { items: newItems };
        });
      },

      clearCart: () => set({ items: [] }),

      totalItems: () =>
        get().items.reduce((acc, item) => acc + item.quantity, 0),
      totalPrice: () =>
        get().items.reduce(
          (acc, item) => acc + Number(item.price) * item.quantity,
          0,
        ),
    }),
    {
      name: "cart-storage",
    },
  ),
);
