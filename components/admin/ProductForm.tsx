"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ImageUploader } from "./ImageUploader";
import { parseColorList, ProductInputSchema } from "@/lib/validations/product";

export type ProductFormValues = {
  id?: string;
  name: string;
  categoryId: string;
  price: string;
  salePrice: string;
  description: string;
  colorsText: string;
  images: string[];
  stock: string;
  isActive: boolean;
  isFeatured: boolean;
};

export type CategoryOption = { id: string; name: string };

const EMPTY: ProductFormValues = {
  name: "",
  categoryId: "",
  price: "",
  salePrice: "",
  description: "",
  colorsText: "",
  images: [],
  stock: "0",
  isActive: true,
  isFeatured: false,
};

/** Boş sətri `null`, doldurulmuş sətri rəqəmə çevirir. */
function optionalNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed.replace(",", "."));
  return Number.isFinite(value) ? value : NaN;
}

export function ProductForm({
  categories,
  initial,
}: {
  categories: CategoryOption[];
  initial?: ProductFormValues;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [values, setValues] = useState<ProductFormValues>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const colorChips = useMemo(() => parseColorList(values.colorsText), [values.colorsText]);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldError(null);

    const payload = {
      name: values.name,
      categoryId: values.categoryId,
      price: optionalNumber(values.price) ?? NaN,
      salePrice: optionalNumber(values.salePrice),
      description: values.description.trim() === "" ? null : values.description,
      colors: colorChips,
      images: values.images,
      stock: optionalNumber(values.stock) ?? NaN,
      isActive: values.isActive,
      isFeatured: values.isFeatured,
    };

    // Client tərəfdə eyni Zod sxemi ilə yoxlayırıq (ecommerce.md §6)
    const parsed = ProductInputSchema.safeParse(payload);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setError(issue?.message ?? "Məlumatlar düzgün deyil.");
      setFieldError(issue?.path?.[0] !== undefined ? String(issue.path[0]) : null);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        isEdit ? `/api/admin/products/${initial!.id}` : "/api/admin/products",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = (await response.json().catch(() => null)) as
        | { error?: string; field?: string }
        | null;

      if (!response.ok) {
        setError(data?.error ?? "Yadda saxlanmadı.");
        setFieldError(data?.field ?? null);
        setSaving(false);
        return;
      }

      router.push("/admin/mehsullar");
      router.refresh();
    } catch {
      setError("Serverə qoşulmaq mümkün olmadı.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initial?.id) return;
    if (!confirm(`"${values.name}" məhsulu silinsin? Bu əməliyyat geri qaytarılmır.`)) return;

    setError(null);
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/products/${initial.id}`, { method: "DELETE" });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(data?.error ?? "Silinmədi.");
        setDeleting(false);
        return;
      }

      router.push("/admin/mehsullar");
      router.refresh();
    } catch {
      setError("Serverə qoşulmaq mümkün olmadı.");
      setDeleting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 disabled:bg-gray-50";

  function errorFor(field: string) {
    return fieldError === field ? error : null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <ImageUploader value={values.images} onChange={(v) => set("images", v)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Əsas məlumat */}
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-6 lg:col-span-2">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">
              Məhsulun adı <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              disabled={saving}
              className={inputClass}
            />
            <FieldError message={errorFor("name")} />
          </div>

          <div>
            <label htmlFor="categoryId" className="mb-1.5 block text-sm font-medium text-gray-700">
              Kateqoriya <span className="text-red-500">*</span>
            </label>
            <select
              id="categoryId"
              value={values.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              disabled={saving}
              className={inputClass}
            >
              <option value="">— Seçin —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <FieldError message={errorFor("categoryId")} />
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700">
              Təsvir
            </label>
            <textarea
              id="description"
              rows={5}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              disabled={saving}
              className={inputClass}
            />
            <FieldError message={errorFor("description")} />
          </div>

          <div>
            <label htmlFor="colors" className="mb-1.5 block text-sm font-medium text-gray-700">
              Mövcud rənglər
            </label>
            <input
              id="colors"
              value={values.colorsText}
              onChange={(e) => set("colorsText", e.target.value)}
              disabled={saving}
              placeholder="qırmızı, mavi, yaşıl"
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Vergüllə ayırın. Bu siyahı müştəri tərəfindəki rəng seçimini doldurur. Boş
              qoysanız müştəri rəngi sərbəst yazacaq.
            </p>
            {colorChips.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {colorChips.map((color) => (
                  <li
                    key={color}
                    className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
                  >
                    {color}
                  </li>
                ))}
              </ul>
            )}
            <FieldError message={errorFor("colors")} />
          </div>
        </div>

        {/* Qiymət və stok */}
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <div>
            <label htmlFor="price" className="mb-1.5 block text-sm font-medium text-gray-700">
              Qiymət (₼) <span className="text-red-500">*</span>
            </label>
            <input
              id="price"
              inputMode="decimal"
              value={values.price}
              onChange={(e) => set("price", e.target.value)}
              disabled={saving}
              placeholder="0.00"
              className={inputClass}
            />
            <FieldError message={errorFor("price")} />
          </div>

          <div>
            <label htmlFor="salePrice" className="mb-1.5 block text-sm font-medium text-gray-700">
              Endirimli qiymət (₼)
            </label>
            <input
              id="salePrice"
              inputMode="decimal"
              value={values.salePrice}
              onChange={(e) => set("salePrice", e.target.value)}
              disabled={saving}
              placeholder="boş qoyun"
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Doldursanız saytda köhnə qiymət üstündən xətli görünəcək.
            </p>
            <FieldError message={errorFor("salePrice")} />
          </div>

          <div>
            <label htmlFor="stock" className="mb-1.5 block text-sm font-medium text-gray-700">
              Stok sayı <span className="text-red-500">*</span>
            </label>
            <input
              id="stock"
              inputMode="numeric"
              value={values.stock}
              onChange={(e) => set("stock", e.target.value)}
              disabled={saving}
              className={inputClass}
            />
            <FieldError message={errorFor("stock")} />
          </div>

          <div className="space-y-3 border-t border-gray-200 pt-4">
            <Toggle
              id="isActive"
              checked={values.isActive}
              onChange={(v) => set("isActive", v)}
              disabled={saving}
              label="Aktiv"
              hint="Deaktiv məhsul saytda görünmür."
            />
            <Toggle
              id="isFeatured"
              checked={values.isFeatured}
              onChange={(v) => set("isFeatured", v)}
              disabled={saving}
              label="Seçilmiş (populyar)"
              hint="Ana səhifədəki populyar məhsullar bölməsində görünür."
            />
          </div>
        </div>
      </div>

      {error && !fieldError && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving || deleting}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-base font-semibold text-white transition hover:bg-brand-700 disabled:bg-brand-400"
        >
          {saving ? "Yadda saxlanılır…" : isEdit ? "Dəyişiklikləri saxla" : "Məhsulu əlavə et"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin/mehsullar")}
          disabled={saving || deleting}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-base font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
        >
          Ləğv et
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving || deleting}
            className="ml-auto rounded-lg border border-red-300 px-5 py-2.5 text-base font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
          >
            {deleting ? "Silinir…" : "Məhsulu sil"}
          </button>
        )}
      </div>
    </form>
  );
}

function FieldError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-sm text-red-600">
      {message}
    </p>
  );
}

function Toggle({
  id,
  checked,
  onChange,
  disabled,
  label,
  hint,
}: {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
      />
      <label htmlFor={id} className="text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-gray-500">{hint}</span>}
      </label>
    </div>
  );
}
