import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CartItem {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  nameEn: string;
  image: string;
  color: string;
  colorEn: string;
  size: string;
  unitPrice: number;
  qty: number;
}

const CART_KEY = "ladyfit-cart";
const CART_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

interface StoredCart {
  cartId: string;
  items: CartItem[];
  savedAt: number;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function loadCart(): StoredCart {
  const empty = (): StoredCart => ({ cartId: uid(), items: [], savedAt: Date.now() });
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Partial<StoredCart>;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > CART_TTL_MS) return empty();
    return {
      cartId: parsed.cartId ?? uid(),
      items: Array.isArray(parsed.items) ? parsed.items : [],
      savedAt: parsed.savedAt,
    };
  } catch {
    return empty();
  }
}

interface CartCtx {
  cartId: string;
  items: CartItem[];
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  updateItem: (variantId: string, patch: Partial<CartItem>) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
}

const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartId, setCartId] = useState<string>("");
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadCart();
    setCartId(stored.cartId);
    setItems(stored.items);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: StoredCart = { cartId, items, savedAt: Date.now() };
    localStorage.setItem(CART_KEY, JSON.stringify(payload));
  }, [cartId, items, hydrated]);

  const value = useMemo<CartCtx>(() => {
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
    const shipping = subtotal === 0 || subtotal >= 60 ? 0 : 4.9;
    return {
      cartId,
      items,
      open,
      setOpen,
      add: (item, qty = 1) => {
        setItems((prev) => {
          const found = prev.find((i) => i.variantId === item.variantId);
          if (found) {
            return prev.map((i) =>
              i.variantId === item.variantId ? { ...i, qty: i.qty + qty } : i,
            );
          }
          return [...prev, { ...item, qty }];
        });
        setOpen(true);
      },
      setQty: (variantId, qty) =>
        setItems((prev) =>
          prev.flatMap((i) =>
            i.variantId === variantId ? (qty <= 0 ? [] : [{ ...i, qty }]) : [i],
          ),
        ),
      remove: (variantId) => setItems((prev) => prev.filter((i) => i.variantId !== variantId)),
      updateItem: (variantId, patch) =>
        setItems((prev) => prev.map((i) => (i.variantId === variantId ? { ...i, ...patch } : i))),
      clear: () => setItems([]),
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal,
      shipping,
      total: subtotal + shipping,
    };
  }, [cartId, items, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
