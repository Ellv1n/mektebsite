"use client";

import Link from "next/link";
import { useState } from "react";

import { useCart } from "./CartProvider";
import { DEFAULT_GENDER, GENDER_LABELS, GENDERS, type Gender } from "@/lib/constants";

/**
 * Səbətə əlavə etmə forması (ecommerce.md §2.4 — ⚠️ VACİB).
 *
 * Üç sahə mütləq göstərilir:
 *   1. Rəng      — admin siyahı veribsə dropdown + "Digər rəng yaz", yoxsa sərbəst mətn
 *   2. Kimin üçün — Oğlan / Qız / Fərqi yoxdur
 *   3. Əlavə qeyd — sərbəst mətn, məcburi deyil
 */

export type AddToCartProduct = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
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
}: {
  product: AddToCartProduct;
  onAdded?: () => void;
  compact?: boolean;
}) {
  const { add } = useCart();

  const hasColorList = product.colors.length > 0;
  const outOfStock = product.stock <= 0;

  const [quantity, setQuantity] = useState(1);
  const [colorChoice, setColorChoice] = useState(hasColorList ? product.colors[0] : OTHER_COLOR);
  const [customColor, setCustomColor] = useState("");
  const [gender, setGender] = useState<Gender>(DEFAULT_GENDER);
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);

  const usingCustomColor = !hasColorList || colorChoice === OTHER_COLOR;
  const maxQuantity = product.stock > 0 ? Math.min(product.stock, 99) : 99;

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
      image: product.image,
      priceQepik: product.priceQepik,
      quantity,
      color: color === "" ? null : color,
      gender,
      note: note.trim() === "" ? null : note.trim(),
      stock: product.stock,
      availableColors: product.colors,
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
      {/* 1. Rəng */}
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

      {/* 2. Kimin üçün */}
      <fieldset>
        <legend className="mb-1.5 block text-sm font-medium text-gray-700">Kimin üçün</legend>
        <div className="grid grid-cols-3 gap-2">
          {GENDERS.map((value) => {
            const selected = gender === value;
            return (
              <label
                key={value}
                className={`cursor-pointer rounded-lg border px-2 py-2.5 text-center text-sm font-medium transition ${
                  selected
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-gray-300 text-gray-600 hover:border-gray-400"
                }`}
              >
                <input
                  type="radio"
                  name={`gender-${product.id}`}
                  value={value}
                  checked={selected}
                  onChange={() => {
                    setGender(value);
                    setAdded(false);
                  }}
                  className="sr-only"
                />
                {GENDER_LABELS[value]}
              </label>
            );
          })}
        </div>
      </fieldset>

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
          <span className="font-medium text-green-800">Səbətə əlavə edildi</span>
          <Link href="/sebet" className="font-semibold text-green-800 underline">
            Səbətə keç →
          </Link>
        </div>
      )}
    </form>
  );
}
