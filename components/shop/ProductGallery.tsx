"use client";

import Image from "next/image";
import { useState } from "react";

/** Məhsul şəkilləri qalereyası (ecommerce.md §2.3). */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

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
      </div>

      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2">
          {images.map((src, index) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Şəkil ${index + 1}`}
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
      )}
    </div>
  );
}
