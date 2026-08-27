"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  cartCount,
  cartItemKey,
  cartSubtotalQepik,
  parseStoredCart,
  parseStoredPromo,
  type AppliedPromo,
  type CartItem,
  type CartItemInput,
} from "@/lib/cart";
import { CART_STORAGE_KEY, PROMO_STORAGE_KEY } from "@/lib/constants";
import {
  amountUntilFreeDeliveryQepik,
  calcDeliveryFeeQepik,
  calcDiscountQepik,
} from "@/lib/money";

export type PromoResult = { ok: true } | { ok: false; error: string };

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotalQepik: number;
  /** Hydration bitibmi — server render zamanı səbət boş görünür */
  ready: boolean;

  promo: AppliedPromo | null;
  discountQepik: number;
  /** Endirimdən sonrakı məhsul məbləği (çatdırılma daxil deyil) */
  goodsQepik: number;
  deliveryFeeQepik: number;
  /** Pulsuz çatdırılmaya nə qədər qalıb (0 = artıq pulsuzdur) */
  untilFreeDeliveryQepik: number;
  /** Ödəniləcək yekun məbləğ — çatdırılma daxil */
  totalQepik: number;

  add: (item: CartItemInput) => void;
  updateQuantity: (key: string, quantity: number) => void;
  updateOptions: (
    key: string,
    options: Partial<Pick<CartItem, "color" | "note" | "image" | "imageIndex">>
  ) => void;
  remove: (key: string) => void;
  clear: () => void;

  applyPromo: (code: string) => Promise<PromoResult>;
  removePromo: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  const [ready, setReady] = useState(false);

  // Səbət yalnız brauzerdə yüklənir — SSR ilə uyğunsuzluq (hydration xətası) olmasın
  useEffect(() => {
    try {
      setItems(parseStoredCart(window.localStorage.getItem(CART_STORAGE_KEY)));
      setPromo(parseStoredPromo(window.localStorage.getItem(PROMO_STORAGE_KEY)));
    } catch {
      setItems([]);
      setPromo(null);
    }
    setReady(true);
  }, []);

  // Hər dəyişiklikdə yadda saxla ki, səhifə yeniləndikdə itməsin (§2.5)
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      if (promo) {
        window.localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(promo));
      } else {
        window.localStorage.removeItem(PROMO_STORAGE_KEY);
      }
    } catch {
      // Yaddaş dolu və ya bloklanıbsa səbət yenə də işləməyə davam etsin
    }
  }, [items, promo, ready]);

  const add = useCallback((input: CartItemInput) => {
    const key = cartItemKey(input);
    setItems((prev) => {
      const index = prev.findIndex((i) => i.key === key);

      // Eyni açar — say artır. Fərqli variant/rəng/qeyd → yeni sətir.
      if (index >= 0) {
        const next = [...prev];
        const merged = next[index].quantity + input.quantity;
        next[index] = {
          ...next[index],
          quantity: input.stock > 0 ? Math.min(merged, input.stock) : merged,
          priceQepik: input.priceQepik,
          stock: input.stock,
        };
        return next;
      }

      return [...prev, { ...input, key }];
    });
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) =>
      prev.flatMap((item) => {
        if (item.key !== key) return [item];
        if (quantity < 1) return [];
        const capped = item.stock > 0 ? Math.min(quantity, item.stock) : quantity;
        return [{ ...item, quantity: capped }];
      })
    );
  }, []);

  const updateOptions = useCallback(
    (key: string, options: Partial<Pick<CartItem, "color" | "note" | "image" | "imageIndex">>) => {
      setItems((prev) => {
        const index = prev.findIndex((i) => i.key === key);
        if (index < 0) return prev;

        const updated = { ...prev[index], ...options };
        updated.key = cartItemKey(updated);

        // Redaktədən sonra başqa sətirlə eyniləşibsə — birləşdiririk
        const twinIndex = prev.findIndex((i, idx) => idx !== index && i.key === updated.key);
        if (twinIndex < 0) {
          const next = [...prev];
          next[index] = updated;
          return next;
        }

        const merged = prev[twinIndex].quantity + updated.quantity;
        return prev
          .map((item, idx) =>
            idx === twinIndex
              ? {
                  ...item,
                  quantity: item.stock > 0 ? Math.min(merged, item.stock) : merged,
                }
              : item
          )
          .filter((_, idx) => idx !== index);
      });
    },
    []
  );

  const remove = useCallback((key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setPromo(null);
  }, []);

  /**
   * Promokodu serverdə yoxlayır. Bir sifarişdə yalnız BİR kod işlədilə bilər —
   * yeni kod tətbiq ediləndə köhnəsi əvəz olunur (§2.6).
   */
  const applyPromo = useCallback(async (code: string): Promise<PromoResult> => {
    const trimmed = code.trim();
    if (trimmed === "") {
      return { ok: false, error: "Promokodu daxil edin" };
    }

    try {
      const response = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });

      const data = (await response.json().catch(() => null)) as
        | { code?: string; discountPct?: number; error?: string }
        | null;

      if (!response.ok || !data?.code || typeof data.discountPct !== "number") {
        return { ok: false, error: data?.error ?? "Promokod düzgün deyil" };
      }

      setPromo({ code: data.code, discountPct: data.discountPct });
      return { ok: true };
    } catch {
      return { ok: false, error: "Serverə qoşulmaq mümkün olmadı" };
    }
  }, []);

  const removePromo = useCallback(() => setPromo(null), []);

  const value = useMemo<CartContextValue>(() => {
    const subtotalQepik = cartSubtotalQepik(items);
    // Səbət boşdursa endirim də göstərilmir
    const discountQepik =
      promo && items.length > 0 ? calcDiscountQepik(subtotalQepik, promo.discountPct) : 0;

    // Çatdırılma haqqı endirimdən SONRAKI məbləğə görə hesablanır
    const goodsQepik = subtotalQepik - discountQepik;
    const deliveryFeeQepik = calcDeliveryFeeQepik(goodsQepik);

    return {
      items,
      count: cartCount(items),
      subtotalQepik,
      ready,
      promo,
      discountQepik,
      goodsQepik,
      deliveryFeeQepik,
      untilFreeDeliveryQepik: amountUntilFreeDeliveryQepik(goodsQepik),
      totalQepik: goodsQepik + deliveryFeeQepik,
      add,
      updateQuantity,
      updateOptions,
      remove,
      clear,
      applyPromo,
      removePromo,
    };
  }, [items, promo, ready, add, updateQuantity, updateOptions, remove, clear, applyPromo, removePromo]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart yalnız <CartProvider> daxilində işlədilə bilər.");
  }
  return context;
}
