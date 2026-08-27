"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { formatQepik } from "@/lib/money";

/**
 * Təşəkkür səhifəsinin məzmunu (ecommerce.md §2.7).
 *
 * Xülasə `sessionStorage`-dən oxunur — sifariş nömrəsi ardıcıl olduğu üçün
 * onu URL-dən bazadan sorğulamaq başqasının məlumatını göstərə bilərdi.
 */

const LAST_ORDER_KEY = "sederek-last-order";

type Summary = {
  orderNumber: string;
  trackingCode?: string | null;
  firstName: string;
  /**
   * Təsdiq məktubunun getdiyi ünvan. E-poçt indi məcburidir, amma bu sahə
   * könüllü qalır: brauzerdə əvvəlki formatda saxlanmış xülasələr də açılsın.
   */
  email?: string | null;
  items: {
    name: string;
    quantity: number;
    priceQepik: number;
    color: string | null;
    /** Məhsulun bir neçə variantı varsa — "Variant 3", yoxsa null */
    variant: string | null;
    note: string | null;
  }[];
  subtotalQepik: number;
  discountQepik: number;
  deliveryFeeQepik?: number;
  totalQepik: number;
  promoCode: string | null;
  discountPct: number;
};

export function OrderSuccess({
  orderNumber,
  trackingCode,
}: {
  orderNumber: string;
  trackingCode: string | null;
}) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  const code = trackingCode ?? summary?.trackingCode ?? null;

  async function copyCode() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard icazəsi yoxdursa istifadəçi kodu əl ilə seçib kopyalaya bilər
    }
  }

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(LAST_ORDER_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Summary;
        // Yalnız bu sifarişə aid xülasəni göstəririk
        if (data?.orderNumber === orderNumber) setSummary(data);
      }
    } catch {
      setSummary(null);
    }
    setLoaded(true);
  }, [orderNumber]);

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl border border-green-200 bg-green-50 px-6 py-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-3xl text-white">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-green-900">Sifarişiniz qəbul edildi!</h1>
        <p className="mt-2 text-base text-green-800">
          Sifariş nömrəniz:{" "}
          <strong className="font-extrabold">#{orderNumber}</strong>
        </p>
        <p className="mt-3 text-sm text-green-800">
          Sizinlə tezliklə telefonla əlaqə saxlanılacaq.
        </p>
        {summary?.email && (
          <p className="mt-1.5 text-sm text-green-800">
            Təsdiq məktubu <strong>{summary.email}</strong> ünvanına göndərildi.
          </p>
        )}
      </div>

      {/* İzləmə kodu — sifarişi saytda görmək üçün yeganə açardır */}
      {code && (
        <div className="mt-4 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 p-5 text-center">
          <p className="text-sm font-semibold text-brand-900">İzləmə kodunuz</p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
            <code className="select-all rounded-xl border border-brand-300 bg-white px-5 py-3 font-mono text-2xl font-bold tracking-[0.2em] text-brand-800">
              {code}
            </code>
            <button
              type="button"
              onClick={copyCode}
              className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              {copied ? "Kopyalandı ✓" : "Kopyala"}
            </button>
          </div>

          <p className="mx-auto mt-3 max-w-sm text-sm text-brand-900">
            <strong>Bu kodu saxlayın.</strong> Sifarişinizin hansı mərhələdə olduğunu
            görmək üçün yeganə açardır — bərpa etmək mümkün deyil.
          </p>

          <Link
            href={`/izle/${encodeURIComponent(code)}`}
            className="mt-4 inline-block rounded-xl border border-brand-400 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
          >
            Sifarişi indi izlə →
          </Link>
        </div>
      )}

      {loaded && summary && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <h2 className="mb-3 text-base font-bold text-gray-900">Sifarişin xülasəsi</h2>

          <ul className="space-y-3">
            {summary.items.map((item, index) => (
              <li key={index} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between gap-2">
                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  <span className="shrink-0 text-sm font-semibold text-gray-900">
                    {formatQepik(item.priceQepik * item.quantity)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {item.quantity} ədəd · Rəng: {item.color ?? "seçilməyib"}
                  {item.variant && ` · ${item.variant}`}
                </p>
                {item.note && <p className="mt-0.5 text-xs text-gray-500">Qeyd: {item.note}</p>}
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Ara cəmi</dt>
              <dd className="font-medium text-gray-900">{formatQepik(summary.subtotalQepik)}</dd>
            </div>
            {summary.promoCode && summary.discountQepik > 0 && (
              <div className="flex justify-between">
                <dt className="text-green-700">
                  Endirim ({summary.promoCode}, {summary.discountPct}%)
                </dt>
                <dd className="font-medium text-green-700">
                  −{formatQepik(summary.discountQepik)}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-600">Çatdırılma</dt>
              <dd
                className={
                  (summary.deliveryFeeQepik ?? 0) === 0
                    ? "font-semibold text-green-700"
                    : "font-medium text-gray-900"
                }
              >
                {(summary.deliveryFeeQepik ?? 0) === 0
                  ? "Pulsuz"
                  : formatQepik(summary.deliveryFeeQepik ?? 0)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-gray-200 pt-3">
              <dt className="text-base font-bold text-gray-900">Yekun</dt>
              <dd className="text-xl font-extrabold text-gray-900">
                {formatQepik(summary.totalQepik)}
              </dd>
            </div>
          </dl>

          <p className="mt-4 rounded-lg bg-accent-50 px-3 py-2.5 text-sm text-accent-800">
            {PAYMENT_METHOD_LABEL}
          </p>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/mehsullar"
          className="inline-block rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-700"
        >
          Alış-verişə davam et
        </Link>
      </div>
    </div>
  );
}
