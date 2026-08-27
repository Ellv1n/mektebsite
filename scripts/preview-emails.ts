/**
 * E-poçt şablonlarının önizləməsi:  npm run mail:preview
 *
 * Sifariş vermədən, SMTP qurmadan hər üç məktubu nümunə məlumatla qurur və
 * `mail-preview/` qovluğuna HTML fayl kimi yazır (qovluq git-ə düşmür).
 * Şablonu dəyişəndə brauzerdə açıb necə göründüyünü dərhal görmək üçündür.
 */

import fs from "node:fs";
import path from "node:path";

import { renderOrderConfirmationEmail } from "../lib/email/order-confirmation";
import { renderOrderEmail } from "../lib/email/order-notification";
import { renderOrderStatusEmail } from "../lib/email/order-status";
import type { MailLineItem } from "../lib/email/shared";

const OUT_DIR = path.join(process.cwd(), "mail-preview");

const items: MailLineItem[] = [
  {
    productName: "Dəftər 60 vərəq, kvadrat",
    quantity: 2,
    priceQepik: 250,
    color: "mavi",
    variant: "Variant 3",
    note: "üzərində maşın şəkli olsun",
  },
  {
    productName: "Akvarel boya, 12 rəng",
    quantity: 1,
    priceQepik: 690,
    color: null,
    variant: null,
    note: null,
  },
];

const money = {
  subtotalQepik: 1190,
  promoCode: "TABIB2026",
  discountPct: 10,
  discountQepik: 119,
  deliveryFeeQepik: 500,
  totalQepik: 1571,
};

const createdAt = new Date("2026-08-27T10:15:00Z");
const trackingCode = "K7M2-P9XQ";
const trackingUrl = "http://localhost:3000/izle/K7M2P9XQ";

const files: { name: string; html: string; subject: string }[] = [
  {
    name: "1-admin-bildirisi.html",
    ...renderOrderEmail({
      orderNumber: "2026-0042",
      createdAt,
      firstName: "Aysel",
      lastName: "Məmmədova",
      phone: "+994501234567",
      email: "aysel@example.com",
      city: "Bakı",
      address: "Nizami küç. 12, mənzil 34",
      note: "Zəngdən əvvəl mesaj yazın",
      items,
      ...money,
      adminUrl: "http://localhost:3000/admin/sifarisler/abc",
      trackingCode,
      trackingUrl,
    }),
  },
  {
    name: "2-musteri-tesdiqi.html",
    ...renderOrderConfirmationEmail({
      orderNumber: "2026-0042",
      createdAt,
      firstName: "Aysel",
      city: "Bakı",
      address: "Nizami küç. 12, mənzil 34",
      note: "Zəngdən əvvəl mesaj yazın",
      items,
      ...money,
      trackingCode,
      trackingUrl,
    }),
  },
  ...(["CONFIRMED", "SHIPPING", "DELIVERED", "CANCELLED"] as const).map((status, index) => ({
    name: `3-${index + 1}-status-${status.toLowerCase()}.html`,
    ...renderOrderStatusEmail({
      orderNumber: "2026-0042",
      firstName: "Aysel",
      status,
      totalQepik: money.totalQepik,
      trackingCode,
      trackingUrl,
    }),
  })),
];

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const file of files) {
  fs.writeFileSync(path.join(OUT_DIR, file.name), file.html, "utf8");
  console.log(`✓ ${file.name}  —  "${file.subject}"`);
}

console.log(`\nFayllar: ${OUT_DIR}`);
