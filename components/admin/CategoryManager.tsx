"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ImageUploader } from "./ImageUploader";
import { CategoryInputSchema } from "@/lib/validations/category";

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  order: number;
  productCount: number;
};

type Draft = { name: string; order: string; image: string | null };

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-base outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 disabled:bg-gray-50";

export function CategoryManager({ categories }: { categories: AdminCategory[] }) {
  const router = useRouter();

  /** `null` — heç nə redaktə olunmur, `"new"` — yeni əlavə edilir, digər hallarda id. */
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ name: "", order: "0", image: null });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function startNew() {
    setEditing("new");
    setDraft({ name: "", order: String(categories.length), image: null });
    setError(null);
  }

  function startEdit(category: AdminCategory) {
    setEditing(category.id);
    setDraft({ name: category.name, order: String(category.order), image: category.image });
    setError(null);
  }

  function cancel() {
    setEditing(null);
    setError(null);
  }

  async function save() {
    setError(null);

    const payload = {
      name: draft.name,
      order: Number(draft.order.trim() === "" ? NaN : draft.order),
      image: draft.image,
    };

    const parsed = CategoryInputSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil.");
      return;
    }

    setBusy(true);
    try {
      const isNew = editing === "new";
      const response = await fetch(
        isNew ? "/api/admin/categories" : `/api/admin/categories/${editing}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(data?.error ?? "Yadda saxlanmadı.");
        return;
      }

      setEditing(null);
      router.refresh();
    } catch {
      setError("Serverə qoşulmaq mümkün olmadı.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(category: AdminCategory) {
    setError(null);

    if (category.productCount > 0) {
      setError(
        `"${category.name}" kateqoriyasında ${category.productCount} məhsul var. ` +
          "Əvvəlcə həmin məhsulları başqa kateqoriyaya köçürün və ya silin."
      );
      return;
    }

    if (!confirm(`"${category.name}" kateqoriyası silinsin?`)) return;

    setBusy(true);
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(data?.error ?? "Silinmədi.");
        return;
      }
      router.refresh();
    } catch {
      setError("Serverə qoşulmaq mümkün olmadı.");
    } finally {
      setBusy(false);
    }
  }

  const editor = (
    <div className="space-y-4 rounded-xl border border-brand-200 bg-brand-50/40 p-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Kateqoriyanın adı <span className="text-red-500">*</span>
          </label>
          <input
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            disabled={busy}
            autoFocus
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Sıra</label>
          <input
            inputMode="numeric"
            value={draft.order}
            onChange={(e) => setDraft((d) => ({ ...d, order: e.target.value }))}
            disabled={busy}
            className={inputClass}
          />
        </div>
      </div>

      <ImageUploader
        label="Kateqoriya şəkli (könüllü)"
        max={1}
        value={draft.image ? [draft.image] : []}
        onChange={(images) => setDraft((d) => ({ ...d, image: images[0] ?? null }))}
      />

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:bg-brand-400"
        >
          {busy ? "Saxlanılır…" : "Yadda saxla"}
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={busy}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-60"
        >
          Ləğv et
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {categories.length} kateqoriya · sıra nömrəsi saytdakı göstərilmə ardıcıllığını təyin edir
        </p>
        {editing !== "new" && (
          <button
            type="button"
            onClick={startNew}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            + Yeni kateqoriya
          </button>
        )}
      </div>

      {editing === "new" && editor}

      {error && editing === null && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <ul className="space-y-2">
        {categories.map((category) =>
          editing === category.id ? (
            <li key={category.id}>{editor}</li>
          ) : (
            <li
              key={category.id}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3"
            >
              <span className="w-8 shrink-0 text-center text-sm text-gray-400">
                {category.order}
              </span>

              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="48px"
                    className="object-contain p-0.5"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-[10px] text-gray-400">
                    şəkil yox
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">{category.name}</p>
                <p className="text-xs text-gray-500">
                  /{category.slug} ·{" "}
                  {category.productCount > 0
                    ? `${category.productCount} məhsul`
                    : "məhsul yoxdur"}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(category)}
                  disabled={busy}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Redaktə
                </button>
                <button
                  type="button"
                  onClick={() => remove(category)}
                  disabled={busy}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  Sil
                </button>
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
