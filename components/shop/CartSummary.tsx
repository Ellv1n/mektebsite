"use client";

import Link from "next/link";
import { useState } from "react";

import { useCart } from "./CartProvider";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { formatQepik } from "@/lib/money";

/**
 * Səbətin yekun bloku: promokod + məbləğlər (ecommerce.md §2.5, §2.6).
 *
 * Göstəriş formatı spesifikasiyada dəqiq verilib:
 *   Ara cəmi:                50.00 ₼
 *   Endirim (RTH2026, 10%):  -5.00 ₼
 *   Yekun:                   45.00 ₼
 */
export function CartSummary() {
  const {
    subtotalQepik,
    discountQepik,
    deliveryFeeQepik,
    untilFreeDeliveryQepik,
    totalQepik,
    promo,
    applyPromo,
    removePromo,
  } = useCart();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleApply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setChecking(true);

    const result = await applyPromo(code);
    if (!result.ok) {
      setError(result.error);
    } else {
      setCode("");
    }
    setChecking(false);
  }

  return (
    <aside className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <h2 className="text-base font-bold text-gray-900">Sifarişin xülasəsi</h2>

      {/* Promokod */}
      {promo ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-green-800">{promo.code} tətbiq edildi</p>
            <p className="text-xs text-green-700">{promo.discountPct}% endirim</p>
          </div>
          <button
            type="button"
            onClick={removePromo}
            className="shrink-0 text-sm font-medium text-green-800 underline"
          >
            Ləğv et
          </button>
        </div>
      ) : (
        <form onSubmit={handleApply}>
          <label htmlFor="promo" className="mb-1.5 block text-sm font-medium text-gray-700">
            Promokod
          </label>
          <div className="flex gap-2">
            <input
              id="promo"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(null);
              }}
              placeholder="Kodu daxil edin"
              maxLength={32}
              autoCapitalize="characters"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base uppercase outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
            <button
              type="submit"
              disabled={checking}
              className="shrink-0 rounded-lg border border-brand-300 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-60"
            >
              {checking ? "…" : "Tətbiq et"}
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {error}
            </p>
          )}
        </form>
      )}

      {/* Məbləğlər */}
      <dl className="space-y-2 border-t border-gray-200 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-600">Ara cəmi</dt>
          <dd className="font-medium text-gray-900">{formatQepik(subtotalQepik)}</dd>
        </div>

        {promo && discountQepik > 0 && (
          <div className="flex justify-between">
            <dt className="text-green-700">
              Endirim ({promo.code}, {promo.discountPct}%)
            </dt>
            <dd className="font-medium text-green-700">−{formatQepik(discountQepik)}</dd>
          </div>
        )}

        <div className="flex justify-between">
          <dt className="text-gray-600">Çatdırılma</dt>
          <dd className={deliveryFeeQepik === 0 ? "font-semibold text-green-700" : "font-medium text-gray-900"}>
            {deliveryFeeQepik === 0 ? "Pulsuz" : formatQepik(deliveryFeeQepik)}
          </dd>
        </div>

        <div className="flex items-baseline justify-between border-t border-gray-200 pt-3">
          <dt className="text-base font-bold text-gray-900">Yekun</dt>
          <dd className="text-xl font-extrabold text-gray-900">{formatQepik(totalQepik)}</dd>
        </div>
      </dl>

      {/* Pulsuz çatdırılmaya təşviq */}
      {untilFreeDeliveryQepik > 0 ? (
        <p className="rounded-lg border border-accent-200 bg-accent-50 px-3 py-2.5 text-sm text-accent-800">
          Daha <strong>{formatQepik(untilFreeDeliveryQepik)}</strong> dəyərində məhsul əlavə
          edin — çatdırılma pulsuz olsun.
        </p>
      ) : (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm font-medium text-green-800">
          Çatdırılma pulsuzdur
        </p>
      )}

      <Link
        href="/sifaris"
        className="block w-full rounded-xl bg-accent-500 px-6 py-3.5 text-center text-base font-bold text-white transition hover:bg-accent-600"
      >
        Sifarişi tamamla
      </Link>

      <p className="text-center text-xs text-gray-500">{PAYMENT_METHOD_LABEL}</p>

      <Link
        href="/mehsullar"
        className="block text-center text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        ← Alış-verişə davam et
      </Link>
    </aside>
  );
}
