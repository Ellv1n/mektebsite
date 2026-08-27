import { STORE_INFO } from "../constants";

/**
 * E-poçt şablonlarının ortaq hissələri.
 *
 * E-poçt klientlərinin çoxu `<style>` bloklarını silir — bütün stillər
 * elementin öz `style` atributundadır. Ona görə burada CSS class-ları yox,
 * hazır "stil sətirləri" saxlanılır.
 */

/** Müştərinin yazdığı mətn e-poçt HTML-inə birbaşa qoyulmur. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const CELL =
  "padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#1f2937;";

export const HEAD_CELL =
  "padding:8px 10px;background:#f3f4f6;border-bottom:2px solid #d1d5db;font-size:12px;" +
  "text-transform:uppercase;letter-spacing:.4px;color:#4b5563;text-align:left;";

/** Məhsul cədvəlinin sətirlərini qurur (təsdiq və bildiriş məktublarında eynidir). */
export type MailLineItem = {
  productName: string;
  quantity: number;
  priceQepik: number;
  color: string | null;
  /** Seçilmiş variantın adı, məs. "Variant 3" — tək şəkilli məhsulda null */
  variant: string | null;
  note: string | null;
};

/**
 * Məktubun ümumi çərçivəsi: başlıq zolağı, məzmun və mağaza əlaqə blokları.
 * `accent` başlıq zolağının rəngidir — status məktubunda statusa görə dəyişir.
 */
export function emailShell({
  title,
  subtitle,
  accent = "#2563eb",
  body,
}: {
  title: string;
  subtitle?: string;
  accent?: string;
  body: string;
}): string {
  return `<!doctype html>
<html lang="az">
<body style="margin:0;padding:20px;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">

    <div style="background:${accent};padding:20px 24px;">
      <h1 style="margin:0;font-size:20px;color:#ffffff;">${escapeHtml(title)}</h1>
      ${
        subtitle
          ? `<p style="margin:6px 0 0;font-size:14px;color:#e5e7eb;">${escapeHtml(subtitle)}</p>`
          : ""
      }
    </div>

    <div style="padding:20px 24px;">
      ${body}
    </div>

    <div style="border-top:1px solid #e5e7eb;background:#f9fafb;padding:16px 24px;font-size:13px;color:#6b7280;">
      <p style="margin:0 0 4px;font-weight:bold;color:#374151;">${escapeHtml(STORE_INFO.name)}</p>
      <p style="margin:0 0 3px;">${escapeHtml(STORE_INFO.address)}</p>
      <p style="margin:0 0 3px;">
        Telefon:
        <a href="tel:${escapeHtml(STORE_INFO.phoneHref)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(STORE_INFO.phone)}</a>
      </p>
      <p style="margin:0;">${escapeHtml(STORE_INFO.workingHours)}</p>
    </div>

  </div>
</body>
</html>`;
}

/** Sadə mətn variantının sonundakı mağaza məlumatı. */
export function storeFooterText(): string[] {
  return [
    "",
    "─".repeat(40),
    STORE_INFO.name,
    STORE_INFO.address,
    `Telefon: ${STORE_INFO.phone}`,
    STORE_INFO.workingHours,
  ];
}

/** Məktubun içindəki əsas düymə (link). */
export function buttonHtml(href: string, label: string, accent = "#2563eb"): string {
  return `<p style="margin:18px 0 0;">
    <a href="${escapeHtml(href)}"
       style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;
              padding:11px 20px;border-radius:8px;font-size:14px;font-weight:bold;">
      ${escapeHtml(label)}
    </a>
  </p>`;
}
