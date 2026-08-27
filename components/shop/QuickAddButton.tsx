"use client";

import { useEffect, useState } from "react";

import { AddToCartForm, type AddToCartProduct } from "./AddToCartForm";

/**
 * Məhsul kartındakı "Səbətə at" düyməsi (ecommerce.md §2.2).
 *
 * Birbaşa səbətə atmır — kiçik pəncərə açır, çünki §2.4-ə görə rəng,
 * kimin üçün və qeyd sahələri MÜTLƏQ göstərilməlidir.
 */
export function QuickAddButton({ product }: { product: AddToCartProduct }) {
  const [open, setOpen] = useState(false);

  // Escape ilə bağlansın, açıq ikən arxa fon sürüşməsin
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (product.stock <= 0) {
    return (
      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-lg bg-gray-100 px-3 py-2.5 text-sm font-semibold text-gray-400"
      >
        Stokda yoxdur
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg bg-accent-500 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-300"
      >
        Səbətə at
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${product.name} — səbətə əlavə et`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="text-base font-bold text-gray-900">{product.name}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Bağla"
                className="-mr-1 -mt-1 shrink-0 rounded-lg px-2 py-1 text-xl leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <AddToCartForm product={product} compact />
          </div>
        </div>
      )}
    </>
  );
}
