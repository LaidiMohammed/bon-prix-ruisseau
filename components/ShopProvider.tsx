"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  readLS,
  writeLS,
  genOrderId,
  unitPrice,
  type CartItem,
  type Order,
  type OrderStatus,
} from "@/lib/orders";
import { deliveryFee } from "@/lib/delivery";

const CART_KEY = "bpr-cart-v2";
const ORDERS_KEY = "bpr-orders-v2";

const sameItem = (i: CartItem, productId: string, size: string, flocageLabel?: string) =>
  i.productId === productId && i.size === size && (i.flocageLabel ?? "") === (flocageLabel ?? "");

type ShopCtx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (productId: string, size: string, flocageLabel: string | undefined, qty: number) => void;
  clearCart: () => void;
  count: number;
  subtotal: number;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  orders: Order[];
  place: (
    draft: Omit<Order, "id" | "date" | "status" | "subtotal" | "fee" | "total">
  ) => Order;
  setStatus: (id: string, status: OrderStatus) => void;
  removeOrder: (id: string) => void;
};

const Ctx = createContext<ShopCtx | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readLS(CART_KEY, []));
  const [orders, setOrders] = useState<Order[]>(() => readLS(ORDERS_KEY, []));
  const [cartOpen, setCartOpen] = useState(false);

  const saveItems = useCallback((next: CartItem[]) => {
    setItems(next);
    writeLS(CART_KEY, next);
  }, []);

  const add = useCallback(
    (item: Omit<CartItem, "qty">, qty = 1) => {
      const found = items.find((i) =>
        sameItem(i, item.productId, item.size, item.flocageLabel)
      );
      const next = found
        ? items.map((i) =>
            sameItem(i, item.productId, item.size, item.flocageLabel)
              ? { ...i, qty: i.qty + qty }
              : i
          )
        : [...items, { ...item, qty }];
      saveItems(next);
      setCartOpen(true);
    },
    [items, saveItems]
  );

  const setQty = useCallback(
    (productId: string, size: string, flocageLabel: string | undefined, qty: number) => {
      saveItems(
        qty <= 0
          ? items.filter((i) => !sameItem(i, productId, size, flocageLabel))
          : items.map((i) =>
              sameItem(i, productId, size, flocageLabel) ? { ...i, qty } : i
            )
      );
    },
    [items, saveItems]
  );

  const clearCart = useCallback(() => saveItems([]), [saveItems]);

  const saveOrders = useCallback((next: Order[]) => {
    setOrders(next);
    writeLS(ORDERS_KEY, next);
  }, []);

  const place = useCallback(
    (
      draft: Omit<Order, "id" | "date" | "status" | "subtotal" | "fee" | "total">
    ) => {
      const subtotal = draft.items.reduce((n, i) => n + i.qty * unitPrice(i), 0);
      const fee = deliveryFee(draft.wilayaCode, draft.delivery);
      const order: Order = {
        ...draft,
        id: genOrderId(),
        date: new Date().toISOString(),
        status: "pending",
        subtotal,
        fee,
        total: subtotal + fee,
      };
      saveOrders([order, ...orders]);
      return order;
    },
    [orders, saveOrders]
  );

  const setStatus = useCallback(
    (id: string, status: OrderStatus) => {
      saveOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));
    },
    [orders, saveOrders]
  );

  const removeOrder = useCallback(
    (id: string) => saveOrders(orders.filter((o) => o.id !== id)),
    [orders, saveOrders]
  );

  const value = useMemo<ShopCtx>(
    () => ({
      items,
      add,
      setQty,
      clearCart,
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotal: items.reduce((n, i) => n + i.qty * unitPrice(i), 0),
      cartOpen,
      setCartOpen,
      orders,
      place,
      setStatus,
      removeOrder,
    }),
    [items, add, setQty, clearCart, cartOpen, orders, place, setStatus, removeOrder]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useShop() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}
