"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useCart } from "./CartProvider";
import { variantLabel, type CartItem } from "@/lib/cart";
import { formatQepik } from "@/lib/money";

const OTHER_COLOR = "__diger__";

/**
 * Səbətdəki bir sətir (ecommerce.md §2.5).
 * Say dəyişdirilə, seçimlər (variant / rəng / qeyd) redaktə edilə, sətir silinə bilər.
 */
export function CartItemRow({ item }: { item: CartItem }) {
  const { updateQuantity, updateOptions, remove } = useCart();
  const [editing, setEditing] = useState(false);
  const [noteDraft, setNoteDraft] = useState(item.note ?? "");

  const hasColorList = item.availableColors.length > 0;
  const hasVariants = item.availableImages.length > 1;
  const colorInList = item.color !== null && item.availableColors.includes(item.color);
  const [customColor, setCustomColor] = useState(colorInList ? "" : (item.color ?? ""));

  // Sətir birləşdikdən sonra qeyd sahəsi yeni dəyərlə uyğunlaşsın
  useEffect(() => {
    setNoteDraft(item.note ?? "");
  }, [item.note]);

  const lineTotal = item.priceQepik * item.quantity;
  const fieldClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

  function handleColorSelect(value: string) {
    if (value === OTHER_COLOR) {
      setCustomColor("");
      updateOptions(item.key, { color: null });
      return;
    }
    updateOptions(item.key, { color: value });
  }

  return (
    <li className="p-4">
      <div className="flex gap-3">
        <Link
          href={`/mehsul/${item.slug}`}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white"
        >
          {item.image ? (
            <Image src={item.image} alt={item.name} fill sizes="80px" className="object-contain p-1" />
          ) : (
            <span className="flex h-full items-center justify-center text-[10px] text-gray-300">
              şəkil yox
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <Link
              href={`/mehsul/${item.slug}`}
              className="text-sm font-medium text-gray-900 hover:text-brand-700 sm:text-base"
            >
              {item.name}
            </Link>
            <button
              type="button"
              onClick={() => remove(item.key)}
              aria-label={`${item.name} məhsulunu səbətdən sil`}
              className="shrink-0 rounded-lg px-2 py-1 text-sm text-gray-400 transition hover:bg-red-50 hover:text-red-600"
            >
              Sil
            </button>
          </div>

          <p className="mt-0.5 text-sm text-gray-500">{formatQepik(item.priceQepik)} / ədəd</p>

          {/* Seçilmiş variantlar — həmişə görünür */}
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            <li>
              <span className="text-gray-400">Rəng:</span>{" "}
              <span className="font-medium">{item.color ?? "seçilməyib"}</span>
            </li>
            {hasVariants && (
              <li>
                <span className="text-gray-400">Variant:</span>{" "}
                <span className="font-medium">{variantLabel(item.imageIndex)}</span>
              </li>
            )}
          </ul>
          {item.note && (
            <p className="mt-1 text-sm text-gray-600">
              <span className="text-gray-400">Qeyd:</span> {item.note}
            </p>
          )}

          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            aria-expanded={editing}
            className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            {editing ? "Redaktəni bağla" : "Seçimləri dəyiş"}
          </button>

          {/* Say və məbləğ */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center rounded-lg border border-gray-300">
              <button
                type="button"
                onClick={() => updateQuantity(item.key, item.quantity - 1)}
                aria-label="Sayı azalt"
                className="px-3 py-1.5 text-lg font-medium text-gray-600 hover:bg-gray-50"
              >
                −
              </button>
              <span className="min-w-9 text-center text-sm font-semibold text-gray-900">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => updateQuantity(item.key, item.quantity + 1)}
                disabled={item.stock > 0 && item.quantity >= item.stock}
                aria-label="Sayı artır"
                className="px-3 py-1.5 text-lg font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30"
              >
                +
              </button>
            </div>

            <span className="text-base font-bold text-gray-900">{formatQepik(lineTotal)}</span>
          </div>

          {item.stock > 0 && item.quantity >= item.stock && (
            <p className="mt-1.5 text-xs text-accent-600">
              Stokda cəmi {item.stock} ədəd var
            </p>
          )}
        </div>
      </div>

      {/* Seçimlərin redaktəsi */}
      {editing && (
        <div className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Rəng</label>
            {hasColorList ? (
              <>
                <select
                  value={colorInList ? (item.color as string) : OTHER_COLOR}
                  onChange={(e) => handleColorSelect(e.target.value)}
                  className={fieldClass}
                >
                  {item.availableColors.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                  <option value={OTHER_COLOR}>Digər rəng yaz…</option>
                </select>
                {!colorInList && (
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    onBlur={() =>
                      updateOptions(item.key, {
                        color: customColor.trim() === "" ? null : customColor.trim(),
                      })
                    }
                    placeholder="İstədiyiniz rəngi yazın"
                    maxLength={50}
                    className={`${fieldClass} mt-2`}
                  />
                )}
              </>
            ) : (
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                onBlur={() =>
                  updateOptions(item.key, {
                    color: customColor.trim() === "" ? null : customColor.trim(),
                  })
                }
                placeholder="Məsələn: açıq mavi"
                maxLength={50}
                className={fieldClass}
              />
            )}
          </div>

          {hasVariants && (
            <div>
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Variant</span>
              <ul className="grid grid-cols-4 gap-2">
                {item.availableImages.map((src, index) => {
                  const selected = index === item.imageIndex;
                  return (
                    <li key={src}>
                      <button
                        type="button"
                        onClick={() => updateOptions(item.key, { imageIndex: index, image: src })}
                        aria-label={variantLabel(index)}
                        aria-pressed={selected}
                        className={`relative aspect-square w-full overflow-hidden rounded-lg border bg-white transition ${
                          selected
                            ? "border-brand-500 ring-2 ring-brand-200"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Image src={src} alt="" fill sizes="70px" className="object-contain p-1" />
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
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Əlavə qeyd <span className="font-normal text-gray-400">(könüllü)</span>
            </label>
            <textarea
              rows={2}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              onBlur={() =>
                updateOptions(item.key, {
                  note: noteDraft.trim() === "" ? null : noteDraft.trim(),
                })
              }
              maxLength={500}
              placeholder="məsələn: üzərində maşın şəkli olsun"
              className={fieldClass}
            />
          </div>

          <p className="text-xs text-gray-500">
            Dəyişikliklər avtomatik yadda saxlanılır.
          </p>
        </div>
      )}
    </li>
  );
}
