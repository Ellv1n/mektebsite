"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { useCart } from "./CartProvider";
import { variantLabel } from "@/lib/cart";

/**
 * Səbətə əlavə etmə forması (ecommerce.md §2.4 — ⚠️ VACİB).
 *
 * Göstərilən sahələr:
 *   1. Variant   — məhsulun birdən çox şəkli varsa hansı variantın istəndiyi
 *                  (məs. eyni dəftərin 3 fərqli üzü). Seçim sifarişə düşür,
 *                  admin panelində "Variant 3" kimi görünür.
 *   2. Rəng      — admin siyahı veribsə dropdown + "Digər rəng yaz", yoxsa sərbəst mətn
 *   3. Əlavə qeyd — sərbəst mətn, məcburi deyil
 *
 * Məhsul səhifəsində variant seçimi qalereyadan idarə olunur — orada
 * `imageIndex` / `onImageIndexChange` ötürülür və forma öz kiçik şəkillərini
 * göstərmir (eyni seçim iki yerdə təkrarlanmasın).
 */

export type AddToCartProduct = {
  id: string;
  slug: string;
  name: string;
  /** Bütün variant şəkilləri — birincisi əsas şəkildir */
  images: string[];
  priceQepik: number;
  colors: string[];
  stock: number;
};

/** Dropdown-dakı "başqa rəng yazmaq istəyirəm" variantının daxili dəyəri. */
const OTHER_COLOR = "__diger__";

export function AddToCartForm({
  product,
  onAdded,
  compact = false,
  imageIndex: controlledIndex,
  onImageIndexChange,
}: {
  product: AddToCartProduct;
  onAdded?: () => void;
  compact?: boolean;
  /** Kənardan idarə olunan variant seçimi (məhsul səhifəsindəki qalereya) */
  imageIndex?: number;
  onImageIndexChange?: (index: number) => void;
}) {
  const { add } = useCart();

  const hasColorList = product.colors.length > 0;
  const outOfStock = product.stock <= 0;
  const hasVariants = product.images.length > 1;
  const controlled = controlledIndex !== undefined;

  const [quantity, setQuantity] = useState(1);
  const [ownIndex, setOwnIndex] = useState(0);
  const [colorChoice, setColorChoice] = useState(hasColorList ? product.colors[0] : OTHER_COLOR);
  const [customColor, setCustomColor] = useState("");
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);

  const imageIndex = controlled ? controlledIndex : ownIndex;

  const usingCustomColor = !hasColorList || colorChoice === OTHER_COLOR;
  const maxQuantity = product.stock > 0 ? Math.min(product.stock, 99) : 99;

  function selectImage(index: number) {
    if (controlled) onImageIndexChange?.(index);
    else setOwnIndex(index);
    setAdded(false);
  }

  function changeQuantity(delta: number) {
    setQuantity((q) => Math.min(Math.max(1, q + delta), maxQuantity));
    setAdded(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (outOfStock) return;

    const color = usingCustomColor ? customColor.trim() : colorChoice;

    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[imageIndex] ?? product.images[0] ?? null,
      imageIndex,
      priceQepik: product.priceQepik,
      quantity,
      color: color === "" ? null : color,
      note: note.trim() === "" ? null : note.trim(),
      stock: product.stock,
      availableColors: product.colors,
      availableImages: product.images,
    });

    setAdded(true);
    onAdded?.();
  }

  if (outOfStock) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-5 text-center">
        <p className="font-medium text-gray-700">Bu məhsul hazırda stokda yoxdur</p>
        <p className="mt-1 text-sm text-gray-500">
          Tezliklə yenidən gələcək — bir az sonra yoxlayın.
        </p>
      </div>
    );
  }

  const fieldClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-4" : "space-y-5"}>
      {/* 1. Variant — yalnız bir neçə şəkil varsa */}
      {hasVariants && (
        <div>
          <span className="mb-1.5 block text-sm font-medium text-gray-700">
            Variant{" "}
            <span className="font-normal text-gray-400">
              — hansı şəkildəki məhsulu istəyirsiniz?
            </span>
          </span>

          {controlled ? (
            <p className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm text-brand-800">
              Seçilmiş: <strong>{variantLabel(imageIndex)}</strong> — yuxarıdakı
              şəkillərdən birinə toxunaraq dəyişə bilərsiniz.
            </p>
          ) : (
            <ul className="grid grid-cols-4 gap-2">
              {product.images.map((src, index) => {
                const selected = index === imageIndex;
                return (
                  <li key={src}>
                    <button
                      type="button"
                      onClick={() => selectImage(index)}
                      aria-label={variantLabel(index)}
                      aria-pressed={selected}
                      className={`relative aspect-square w-full overflow-hidden rounded-lg border bg-white transition ${
                        selected
                          ? "border-brand-500 ring-2 ring-brand-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Image src={src} alt="" fill sizes="90px" className="object-contain p-1" />
                      <span
                        className={`absolute bottom-0 left-0 right-0 py-0.5 text-center text-[10px] font-semibold ${
                          selected ? "bg-brand-500 text-white" : "bg-white/85 text-gray-500"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* 2. Rəng */}
      <div>
        <label htmlFor={`color-${product.id}`} className="mb-1.5 block text-sm font-medium text-gray-700">
          Rəng
        </label>

        {hasColorList ? (
          <>
            <select
              id={`color-${product.id}`}
              value={colorChoice}
              onChange={(e) => {
                setColorChoice(e.target.value);
                setAdded(false);
              }}
              className={fieldClass}
            >
              {product.colors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
              <option value={OTHER_COLOR}>Digər rəng yaz…</option>
            </select>

            {usingCustomColor && (
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  setAdded(false);
                }}
                placeholder="İstədiyiniz rəngi yazın"
                maxLength={50}
                className={`${fieldClass} mt-2`}
              />
            )}
          </>
        ) : (
          <input
            id={`color-${product.id}`}
            type="text"
            value={customColor}
            onChange={(e) => {
              setCustomColor(e.target.value);
              setAdded(false);
            }}
            placeholder="Məsələn: açıq mavi"
            maxLength={50}
            className={fieldClass}
          />
        )}
      </div>

      {/* 3. Əlavə qeyd */}
      <div>
        <label htmlFor={`note-${product.id}`} className="mb-1.5 block text-sm font-medium text-gray-700">
          Əlavə qeyd <span className="font-normal text-gray-400">(könüllü)</span>
        </label>
        <textarea
          id={`note-${product.id}`}
          rows={compact ? 2 : 3}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setAdded(false);
          }}
          maxLength={500}
          placeholder="məsələn: üzərində maşın şəkli olsun"
          className={fieldClass}
        />
      </div>

      {/* Say */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">Say</span>
        <div className="flex items-center rounded-lg border border-gray-300">
          <button
            type="button"
            onClick={() => changeQuantity(-1)}
            disabled={quantity <= 1}
            aria-label="Sayı azalt"
            className="px-4 py-2 text-lg font-medium text-gray-600 disabled:opacity-30"
          >
            −
          </button>
          <span className="min-w-10 text-center text-base font-semibold text-gray-900">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => changeQuantity(1)}
            disabled={quantity >= maxQuantity}
            aria-label="Sayı artır"
            className="px-4 py-2 text-lg font-medium text-gray-600 disabled:opacity-30"
          >
            +
          </button>
        </div>
        {product.stock > 0 && product.stock <= 10 && (
          <span className="text-sm text-accent-600">Stokda {product.stock} ədəd qalıb</span>
        )}
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-accent-500 px-6 py-3.5 text-base font-bold text-white transition hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-300 focus:ring-offset-2"
      >
        Səbətə əlavə et
      </button>

      {added && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm"
        >
          <span className="font-medium text-green-800">
            Səbətə əlavə edildi{hasVariants ? ` — ${variantLabel(imageIndex)}` : ""}
          </span>
          <Link href="/sebet" className="font-semibold text-green-800 underline">
            Səbətə keç →
          </Link>
        </div>
      )}
    </form>
  );
}
