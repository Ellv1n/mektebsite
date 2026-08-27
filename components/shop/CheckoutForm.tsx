"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCart } from "./CartProvider";
import { variantLabel } from "@/lib/cart";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { formatQepik } from "@/lib/money";
import { OrderInputSchema } from "@/lib/validations/order";

/**
 * Sifariş forması (ecommerce.md §2.7).
 * Validasiya həm burada, həm də serverdə eyni Zod sxemi ilə aparılır (§6).
 */

const LAST_ORDER_KEY = "sederek-last-order";

/**
 * Telefon sahəsi: `+994` sahənin SOLUNDA sabit yazıdır — müştəri onu yazmır,
 * silə də bilmir, yalnız öz 9 rəqəmini daxil edir. Əvvəllər maska sahənin
 * içinə `+994` yazırdı və müştərilər öz nömrəsini onun üstünə yazmağa
 * çalışdıqda çaşırdı.
 *
 * Bu funksiya yazılanı `50 123 45 67` formasına salır; nömrəni kopyalayıb
 * yapışdıranda əvvəldəki ölkə kodu (994) və ya sıfır (0) atılır.
 */
function maskAzPhoneLocal(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("994")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  digits = digits.slice(0, 9);

  if (digits.length === 0) return "";

  return [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 7),
    digits.slice(7, 9),
  ]
    .filter((part) => part.length > 0)
    .join(" ");
}

/** Sahədəki yerli hissə → serverə göndərilən tam nömrə (`+994501234567`). */
function fullPhone(local: string): string {
  const digits = local.replace(/\D/g, "");
  return digits === "" ? "" : `+994${digits}`;
}

type Values = {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  address: string;
  email: string;
  note: string;
};

const EMPTY: Values = {
  firstName: "",
  lastName: "",
  phone: "",
  city: "",
  address: "",
  email: "",
  note: "",
};

export function CheckoutForm() {
  const router = useRouter();
  const {
    items,
    subtotalQepik,
    discountQepik,
    deliveryFeeQepik,
    untilFreeDeliveryQepik,
    totalQepik,
    promo,
    ready,
    clear,
  } = useCart();

  const [values, setValues] = useState<Values>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setErrorField(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setErrorField(null);

    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      phone: fullPhone(values.phone),
      city: values.city,
      address: values.address,
      email: values.email.trim() === "" ? null : values.email.trim(),
      note: values.note.trim() === "" ? null : values.note.trim(),
      promoCode: promo?.code ?? null,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        color: item.color,
        imageIndex: item.imageIndex,
        note: item.note,
      })),
    };

    const parsed = OrderInputSchema.safeParse(payload);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setError(issue?.message ?? "Məlumatlar tam deyil.");
      setErrorField(issue?.path?.[0] !== undefined ? String(issue.path[0]) : null);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as
        | { orderNumber?: string; trackingCode?: string; error?: string; field?: string }
        | null;

      if (!response.ok || !data?.orderNumber) {
        setError(data?.error ?? "Sifariş göndərilmədi. Yenidən cəhd edin.");
        setErrorField(data?.field ?? null);
        setSubmitting(false);
        return;
      }

      // Təşəkkür səhifəsində xülasə göstərmək üçün — səbət təmizlənməzdən əvvəl
      try {
        window.sessionStorage.setItem(
          LAST_ORDER_KEY,
          JSON.stringify({
            orderNumber: data.orderNumber,
            trackingCode: data.trackingCode ?? null,
            firstName: values.firstName,
            items: items.map((i) => ({
              name: i.name,
              quantity: i.quantity,
              priceQepik: i.priceQepik,
              color: i.color,
              variant: i.availableImages.length > 1 ? variantLabel(i.imageIndex) : null,
              note: i.note,
            })),
            subtotalQepik,
            discountQepik,
            deliveryFeeQepik,
            totalQepik,
            promoCode: promo?.code ?? null,
            discountPct: promo?.discountPct ?? 0,
          })
        );
      } catch {
        // Xülasə göstərilməsə də sifariş yaranıb — davam edirik
      }

      clear();
      const tracking = data.trackingCode
        ? `&kod=${encodeURIComponent(data.trackingCode)}`
        : "";
      router.push(`/sifaris/ugurlu?nomre=${encodeURIComponent(data.orderNumber)}${tracking}`);
    } catch {
      setError("Serverə qoşulmaq mümkün olmadı. İnternet bağlantınızı yoxlayın.");
      setSubmitting(false);
    }
  }

  // Yalnız səbət YÜKLƏNDİKDƏN sonra və boş olduqda bu görünüş çıxır.
  // Forma sahələri səbətdən asılı deyil — dərhal göstərilir.
  if (ready && items.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <p className="text-base font-medium text-gray-700">Səbətiniz boşdur</p>
        <p className="mt-1 text-sm text-gray-500">Sifariş vermək üçün əvvəlcə məhsul seçin.</p>
        <Link
          href="/mehsullar"
          className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white hover:bg-brand-700"
        >
          Məhsullara bax
        </Link>
      </div>
    );
  }

  const field =
    "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 disabled:bg-gray-50";
  const errFor = (name: string) => (errorField === name ? error : null);

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start" noValidate>
      <div className="space-y-5">
        <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <h2 className="mb-4 text-base font-bold text-gray-900">Əlaqə məlumatları</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ad" required error={errFor("firstName")}>
              <input
                value={values.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                disabled={submitting}
                autoComplete="given-name"
                className={field}
              />
            </Field>

            <Field label="Soyad" required error={errFor("lastName")}>
              <input
                value={values.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                disabled={submitting}
                autoComplete="family-name"
                className={field}
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field
              label="Telefon nömrəsi"
              required
              error={errFor("phone")}
              hint="Yalnız öz nömrənizi yazın: 50, 51, 55, 70, 77, 10, 99 ilə başlayan 9 rəqəm"
            >
              <div
                className={`flex items-stretch overflow-hidden rounded-lg border border-gray-300 transition focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200 ${
                  submitting ? "bg-gray-50" : "bg-white"
                }`}
              >
                {/* Ölkə kodu sabitdir — müştəri onu yazmır, silə də bilmir */}
                <span
                  aria-hidden="true"
                  className="flex select-none items-center border-r border-gray-300 bg-gray-50 px-3 text-base font-semibold text-gray-600"
                >
                  +994
                </span>
                <input
                  value={values.phone}
                  onChange={(e) => set("phone", maskAzPhoneLocal(e.target.value))}
                  disabled={submitting}
                  inputMode="tel"
                  autoComplete="tel-national"
                  aria-label="Telefon nömrəsi, ölkə kodundan sonrakı hissə"
                  placeholder="50 123 45 67"
                  className="w-full bg-transparent px-3 py-2.5 text-base outline-none disabled:bg-gray-50"
                />
              </div>
            </Field>
          </div>

          <div className="mt-4">
            <Field label="E-poçt" error={errFor("email")} hint="könüllü — sifariş təsdiqi üçün">
              <input
                type="email"
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
                disabled={submitting}
                autoComplete="email"
                placeholder="ad@example.com"
                className={field}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <h2 className="mb-4 text-base font-bold text-gray-900">Çatdırılma</h2>

          <Field label="Şəhər / Rayon" required error={errFor("city")}>
            <input
              value={values.city}
              onChange={(e) => set("city", e.target.value)}
              disabled={submitting}
              autoComplete="address-level2"
              placeholder="Bakı"
              className={field}
            />
          </Field>

          <div className="mt-4">
            <Field
              label="Çatdırılma ünvanı"
              required
              error={errFor("address")}
              hint="küçə, bina, mənzil"
            >
              <textarea
                rows={3}
                value={values.address}
                onChange={(e) => set("address", e.target.value)}
                disabled={submitting}
                autoComplete="street-address"
                placeholder="Nizami küçəsi 12, bina 3, mənzil 45"
                className={field}
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Sifarişə qeyd" error={errFor("note")} hint="könüllü">
              <textarea
                rows={2}
                value={values.note}
                onChange={(e) => set("note", e.target.value)}
                disabled={submitting}
                placeholder="məsələn: axşam saatlarında zəng edin"
                className={field}
              />
            </Field>
          </div>
        </section>

        {/* Ödəniş — yalnız bir seçim (ecommerce.md §2.7) */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <h2 className="mb-3 text-base font-bold text-gray-900">Ödəniş üsulu</h2>
          <label className="flex cursor-default items-center gap-3 rounded-lg border-2 border-brand-500 bg-brand-50 px-4 py-3">
            <input type="radio" name="payment" checked readOnly className="h-5 w-5 text-brand-600" />
            <span className="text-base font-semibold text-brand-800">{PAYMENT_METHOD_LABEL}</span>
          </label>
          <p className="mt-2 text-sm text-gray-500">
            Onlayn ödəniş yoxdur — məbləği kuryerə təhvil verərkən ödəyəcəksiniz.
          </p>
        </section>
      </div>

      {/* Xülasə */}
      <aside className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <h2 className="text-base font-bold text-gray-900">Sifarişiniz</h2>

        {!ready && (
          <div className="space-y-2" aria-busy="true">
            <div className="h-4 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
          </div>
        )}

        <ul className="max-h-72 space-y-3 overflow-y-auto">
          {items.map((item) => (
            <li key={item.key} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
              <div className="flex justify-between gap-2">
                <span className="text-sm font-medium text-gray-900">{item.name}</span>
                <span className="shrink-0 text-sm font-semibold text-gray-900">
                  {formatQepik(item.priceQepik * item.quantity)}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-gray-500">
                {item.quantity} ədəd · {item.color ?? "rəng seçilməyib"}
                {item.availableImages.length > 1 && ` · ${variantLabel(item.imageIndex)}`}
              </p>
              {item.note && <p className="mt-0.5 text-xs text-gray-500">Qeyd: {item.note}</p>}
            </li>
          ))}
        </ul>

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
            <dd
              className={
                deliveryFeeQepik === 0 ? "font-semibold text-green-700" : "font-medium text-gray-900"
              }
            >
              {deliveryFeeQepik === 0 ? "Pulsuz" : formatQepik(deliveryFeeQepik)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-gray-200 pt-3">
            <dt className="text-base font-bold text-gray-900">Yekun</dt>
            <dd className="text-xl font-extrabold text-gray-900">{formatQepik(totalQepik)}</dd>
          </div>
        </dl>

        {untilFreeDeliveryQepik > 0 && (
          <p className="rounded-lg border border-accent-200 bg-accent-50 px-3 py-2.5 text-sm text-accent-800">
            Daha <strong>{formatQepik(untilFreeDeliveryQepik)}</strong> dəyərində məhsul
            əlavə etsəniz çatdırılma pulsuz olar.
          </p>
        )}

        {error && !errorField && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !ready || items.length === 0}
          className="w-full rounded-xl bg-accent-500 px-6 py-3.5 text-base font-bold text-white transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:bg-accent-300"
        >
          {submitting ? "Göndərilir…" : "Sifarişi tamamla"}
        </button>

        <Link
          href="/sebet"
          className="block text-center text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          ← Səbətə qayıt
        </Link>
      </aside>
    </form>
  );
}

function Field({
  label,
  required = false,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
