"use client";

import { useState } from "react";

import { AddToCartForm, type AddToCartProduct } from "./AddToCartForm";
import { ProductGallery } from "./ProductGallery";

/**
 * Məhsul səhifəsinin alış bloku.
 *
 * Qalereya ilə səbət formasını BİR seçim üzərində birləşdirir: müştəri
 * qalereyada 3-cü şəkli seçirsə, səbətə də həmin variant düşür. Əvvəllər
 * qalereya sadəcə baxış üçün idi və sifariş həmişə əsas şəkillə gedirdi —
 * admin panelində müştərinin hansı variantı istədiyi bilinmirdi.
 *
 * `children` serverdə render olunan məlumat blokudur (ad, qiymət, təsvir) —
 * client komponentə prop kimi ötürülür, ona görə server komponenti olaraq qalır.
 */
export function ProductPurchase({
  product,
  children,
  footer,
}: {
  product: AddToCartProduct;
  /** Formadan YUXARIDA göstərilən blok (ad, qiymət, təsvir) */
  children: React.ReactNode;
  /** Formadan AŞAĞIDA göstərilən blok (ödəniş və çatdırılma qeydləri) */
  footer?: React.ReactNode;
}) {
  const [imageIndex, setImageIndex] = useState(0);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <ProductGallery
        images={product.images}
        name={product.name}
        active={imageIndex}
        onActiveChange={setImageIndex}
      />

      <div>
        {children}

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <AddToCartForm
            product={product}
            imageIndex={imageIndex}
            onImageIndexChange={setImageIndex}
          />
        </div>

        {footer}
      </div>
    </div>
  );
}
