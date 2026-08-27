import { ORDER_STATUS_LABELS, STORE_INFO, type OrderStatusValue } from "../constants";
import { formatQepik } from "../money";
import { buttonHtml, emailShell, escapeHtml, storeFooterText } from "./shared";

/**
 * Admin sifarişin statusunu dəyişdikdə MÜŞTƏRİYƏ gedən məktub (ecommerce.md §3.5).
 *
 * Hər status üçün ayrı mətn və rəng var — müştəri mövzu sətrindən nə baş
 * verdiyini görməlidir. E-poçt sahəsi könüllü olduğuna görə məktub yalnız
 * müştəri ünvan yazıbsa göndərilir.
 */

type StatusCopy = {
  /** Mövzu sətrindəki qısa ifadə */
  headline: string;
  message: string;
  accent: string;
};

const COPY: Record<OrderStatusValue, StatusCopy> = {
  NEW: {
    headline: "Sifarişiniz yenidən işlənir",
    message:
      "Sifarişiniz yenidən “Yeni” statusuna qaytarıldı və növbədən keçir. " +
      "Tezliklə sizinlə əlaqə saxlayacağıq.",
    accent: "#ea580c",
  },
  CONFIRMED: {
    headline: "Sifarişiniz təsdiqləndi",
    message:
      "Sifarişiniz təsdiqləndi və yığılmağa başladı. Yola düşdükdə sizə " +
      "yenidən məlumat verəcəyik.",
    accent: "#2563eb",
  },
  SHIPPING: {
    headline: "Sifarişiniz yola çıxdı",
    message:
      "Sifarişiniz kuryerə təhvil verildi. Kuryer çatdırılmadan əvvəl " +
      "sizinlə telefonla əlaqə saxlayacaq — nömrənizin əlçatan olmasına diqqət edin.",
    accent: "#d97706",
  },
  DELIVERED: {
    headline: "Sifarişiniz çatdırıldı",
    message:
      "Sifarişiniz ünvana çatdırıldı. Bizi seçdiyiniz üçün təşəkkür edirik! " +
      "Məhsullarla bağlı sualınız olarsa bizə yazın.",
    accent: "#15803d",
  },
  CANCELLED: {
    headline: "Sifarişiniz ləğv edildi",
    message:
      "Sifarişiniz ləğv edildi. Bu, gözlənilmədən baş veribsə və ya səhv " +
      "olduğunu düşünürsünüzsə, bizimlə əlaqə saxlayın — sifarişi bərpa edə bilərik.",
    accent: "#b91c1c",
  },
};

export type OrderStatusEmailData = {
  orderNumber: string;
  firstName: string;
  status: OrderStatusValue;
  totalQepik: number;
  /** Göstəriş forması, məs. "K7M2-P9XQ" */
  trackingCode: string;
  trackingUrl: string;
};

export function renderOrderStatusEmail(data: OrderStatusEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const copy = COPY[data.status];
  const subject = `Sifariş #${data.orderNumber} — ${ORDER_STATUS_LABELS[data.status]}`;

  const body = `
      <p style="margin:0 0 12px;font-size:15px;color:#111827;">
        Salam, ${escapeHtml(data.firstName)}!
      </p>
      <p style="margin:0 0 18px;font-size:14px;color:#4b5563;line-height:1.6;">
        ${escapeHtml(copy.message)}
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#6b7280;width:150px;">Sifariş nömrəsi</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:bold;">#${escapeHtml(data.orderNumber)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#6b7280;">Yeni status</td>
          <td style="padding:4px 0;font-size:14px;font-weight:bold;color:${copy.accent};">${escapeHtml(
            ORDER_STATUS_LABELS[data.status]
          )}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#6b7280;">Məbləğ</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;">${formatQepik(data.totalQepik)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#6b7280;">İzləmə kodu</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;letter-spacing:1px;">${escapeHtml(data.trackingCode)}</td>
        </tr>
      </table>

      ${buttonHtml(data.trackingUrl, "Sifarişi izlə", copy.accent)}

      <p style="margin:14px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
        Sualınız varsa
        <a href="tel:${escapeHtml(STORE_INFO.phoneHref)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(STORE_INFO.phone)}</a>
        nömrəsinə zəng edin.
      </p>`;

  const text = [
    `${copy.headline} — sifariş #${data.orderNumber}`,
    "",
    `Salam, ${data.firstName}!`,
    copy.message,
    "",
    `Yeni status: ${ORDER_STATUS_LABELS[data.status]}`,
    `Məbləğ: ${formatQepik(data.totalQepik)}`,
    `İzləmə kodu: ${data.trackingCode}`,
    `İzləmə linki: ${data.trackingUrl}`,
    ...storeFooterText(),
  ].join("\n");

  return {
    subject,
    html: emailShell({ title: copy.headline, subtitle: `Sifariş #${data.orderNumber}`, accent: copy.accent, body }),
    text,
  };
}
