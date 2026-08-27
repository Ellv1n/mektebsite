"use client";

import Image from "next/image";
import { useState } from "react";

import { variantLabel } from "@/lib/cart";

/**
 * Məhsul şəkilləri qalereyası (ecommerce.md §2.3).
 *
 * `active` / `onActiveChange` verilibsə qalereya kənardan idarə olunur —
 * məhsul səhifəsində seçilən şəkil eyni zamanda sifariş ediləcək VARİANTdır,
 * ona görə seçim səbət forması ilə paylaşılır.
 */
export function ProductGallery({
  images,
  name,
  active: controlledActive,
  onActiveChange,
}: {
  images: string[];
  name: string;
  active?: number;
  onActiveChange?: (index: number) => void;
}) {
  const [ownActive, setOwnActive] = useState(0);
  const controlled = controlledActive !== undefined;
  const active = controlled ? controlledActive : ownActive;

  function select(index: number) {
    if (controlled) onActiveChange?.(index);
    else setOwnActive(index);
  }

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-300">
        şəkil yoxdur
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-white">
        <Image
          src={images[active]}
          alt={`${name} — şəkil ${active + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 500px"
          priority
          className="object-contain p-4"
        />
        {controlled && images.length > 1 && (
          <span className="absolute left-3 top-3 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">
            {variantLabel(active)}
          </span>
        )}
      </div>

      {images.length > 1 && (
        <>
          <ul className="mt-3 grid grid-cols-5 gap-2">
            {images.map((src, index) => (
              <li key={src}>
                <button
                  type="button"
                  onClick={() => select(index)}
                  aria-label={controlled ? variantLabel(index) : `Şəkil ${index + 1}`}
                  aria-current={index === active}
                  className={`relative aspect-square w-full overflow-hidden rounded-lg border bg-white transition ${
                    index === active
                      ? "border-brand-500 ring-2 ring-brand-200"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="90px"
                    className="object-contain p-1"
                  />
                </button>
              </li>
            ))}
          </ul>

          {controlled && (
            <p className="mt-2 text-sm text-gray-500">
              Bu məhsulun {images.length} variantı var — səbətə hansı şəkli seçmisinizsə
              o düşəcək.
            </p>
          )}
        </>
      )}
    </div>
  );
}
