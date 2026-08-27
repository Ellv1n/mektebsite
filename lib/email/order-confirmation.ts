import { PAYMENT_METHOD_LABEL, STORE_INFO } from "../constants";
import { formatBakuDateTime } from "../date";
import { formatQepik } from "../money";
import {
  buttonHtml,
  CELL,
  emailShell,
  escapeHtml,
  HEAD_CELL,
  storeFooterText,
  type MailLineItem,
} from "./shared";

/**
 * MÜŞTƏRİYƏ göndərilən sifariş təsdiqi (ecommerce.md §2.8).
 *
 * Admin bildirişindən (order-notification.ts) fərqi:
 *   - müştəri dilində yazılır, məbləğ və ünvan təsdiq üçün təkrarlanır
 *   - içində izləmə kodu və izləmə linki var
 *   - müştərinin telefon nömrəsi kimi daxili məlumatlar təkrar sadalanmır
 *
 * E-poçt sahəsi könüllüdür — bu məktub yalnız müştəri ünvan yazıbsa gedir.
 */

export type OrderConfirmationData = {
  orderNumber: string;
  createdAt: Date;
  firstName: string;
  city: string;
  address: string;
  note: string | null;
  items: MailLineItem[];
  subtotalQepik: number;
  promoCode: string | null;
  discountPct: number;
  discountQepik: number;
  deliveryFeeQepik: number;
  totalQepik: number;
  /** Göstəriş forması, məs. "K7M2-P9XQ" */
  trackingCode: string;
  trackingUrl: string;
};

const MUTED = '<span style="color:#9ca3af;">—</span>';

export function renderOrderConfirmationEmail(data: OrderConfirmationData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Sifarişiniz qəbul edildi — #${data.orderNumber}`;

  const rows = data.items
    .map(
      (item) => `
        <tr>
          <td style="${CELL}">${escapeHtml(item.productName)}</td>
          <td style="${CELL}text-align:center;">${item.quantity}</td>
          <td style="${CELL}">${item.variant ? escapeHtml(item.variant) : MUTED}</td>
          <td style="${CELL}">${item.color ? escapeHtml(item.color) : MUTED}</td>
          <td style="${CELL}text-align:right;white-space:nowrap;">${formatQepik(
            item.priceQepik * item.quantity
          )}</td>
        </tr>${
          item.note
            ? `
        <tr>
          <td colspan="5" style="${CELL}background:#f9fafb;font-size:13px;color:#6b7280;">
            Qeyd: ${escapeHtml(item.note)}
          </td>
        </tr>`
            : ""
        }`
    )
    .join("");

  const totalRow = (label: string, value: string, style = "") =>
    `<tr>
       <td style="padding:4px 0;font-size:14px;color:#6b7280;${style}">${label}</td>
       <td style="padding:4px 0;text-align:right;font-size:14px;font-weight:600;color:#111827;${style}">${value}</td>
     </tr>`;

  const body = `
      <p style="margin:0 0 12px;font-size:15px;color:#111827;">
        Salam, ${escapeHtml(data.firstName)}!
      </p>
      <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.6;">
        Sifarişiniz qəbul edildi və işlənməyə göndərildi. Tezliklə sizinlə
        telefonla əlaqə saxlayıb sifarişi təsdiqləyəcəyik.
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#6b7280;width:150px;">Sifariş nömrəsi</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:bold;">#${escapeHtml(data.orderNumber)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#6b7280;">Tarix</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;">${formatBakuDateTime(data.createdAt)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#6b7280;">İzləmə kodu</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:bold;letter-spacing:1px;">${escapeHtml(data.trackingCode)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#6b7280;">Ödəniş</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;">${escapeHtml(PAYMENT_METHOD_LABEL)}</td>
        </tr>
      </table>

      <h2 style="margin:0 0 8px;font-size:15px;color:#111827;">Məhsullar</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
        <thead>
          <tr>
            <th style="${HEAD_CELL}">Məhsul</th>
            <th style="${HEAD_CELL}text-align:center;">Say</th>
            <th style="${HEAD_CELL}">Variant</th>
            <th style="${HEAD_CELL}">Rəng</th>
            <th style="${HEAD_CELL}text-align:right;">Məbləğ</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        ${totalRow("Ara cəmi", formatQepik(data.subtotalQepik))}
        ${
          data.discountQepik > 0 && data.promoCode
            ? `<tr>
                 <td style="padding:4px 0;font-size:14px;color:#15803d;">Endirim (${escapeHtml(data.promoCode)}, ${data.discountPct}%)</td>
                 <td style="padding:4px 0;text-align:right;font-size:14px;font-weight:600;color:#15803d;">−${formatQepik(data.discountQepik)}</td>
               </tr>`
            : ""
        }
        ${totalRow(
          "Çatdırılma",
          data.deliveryFeeQepik === 0 ? "Pulsuz" : formatQepik(data.deliveryFeeQepik)
        )}
        <tr>
          <td style="padding:10px 0 0;border-top:2px solid #e5e7eb;font-size:16px;font-weight:bold;color:#111827;">Yekun</td>
          <td style="padding:10px 0 0;border-top:2px solid #e5e7eb;text-align:right;font-size:18px;font-weight:bold;color:#111827;">${formatQepik(data.totalQepik)}</td>
        </tr>
      </table>

      <h2 style="margin:0 0 8px;font-size:15px;color:#111827;">Çatdırılma ünvanı</h2>
      <p style="margin:0 0 4px;font-size:14px;color:#374151;">${escapeHtml(data.city)}, ${escapeHtml(data.address)}</p>
      ${
        data.note
          ? `<p style="margin:0;font-size:14px;color:#6b7280;">Qeydiniz: ${escapeHtml(data.note)}</p>`
          : ""
      }

      ${buttonHtml(data.trackingUrl, "Sifarişi izlə")}

      <p style="margin:14px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
        İzləmə kodunuzu saxlayın — sifarişin hansı mərhələdə olduğunu istənilən
        vaxt bu kodla yoxlaya bilərsiniz. Sualınız varsa
        <a href="tel:${escapeHtml(STORE_INFO.phoneHref)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(STORE_INFO.phone)}</a>
        nömrəsinə zəng edin.
      </p>`;

  const text = [
    `Sifarişiniz qəbul edildi — #${data.orderNumber}`,
    "",
    `Salam, ${data.firstName}!`,
    "Sifarişiniz qeydə alındı. Tezliklə sizinlə telefonla əlaqə saxlayacağıq.",
    "",
    `Tarix: ${formatBakuDateTime(data.createdAt)}`,
    `İzləmə kodu: ${data.trackingCode}`,
    `İzləmə linki: ${data.trackingUrl}`,
    `Ödəniş: ${PAYMENT_METHOD_LABEL}`,
    "",
    "Məhsullar:",
    ...data.items.map(
      (i) =>
        `  • ${i.productName} — ${i.quantity} ədəd × ${formatQepik(i.priceQepik)}` +
        (i.variant ? ` | ${i.variant}` : "") +
        ` | Rəng: ${i.color ?? "seçilməyib"}` +
        (i.note ? ` | Qeyd: ${i.note}` : "")
    ),
    "",
    `Ara cəmi: ${formatQepik(data.subtotalQepik)}`,
    ...(data.discountQepik > 0 && data.promoCode
      ? [`Endirim (${data.promoCode}, ${data.discountPct}%): -${formatQepik(data.discountQepik)}`]
      : []),
    `Çatdırılma: ${data.deliveryFeeQepik === 0 ? "Pulsuz" : formatQepik(data.deliveryFeeQepik)}`,
    `Yekun: ${formatQepik(data.totalQepik)}`,
    "",
    `Ünvan: ${data.city}, ${data.address}`,
    ...(data.note ? [`Qeydiniz: ${data.note}`] : []),
    ...storeFooterText(),
  ].join("\n");

  return { subject, html: emailShell({ title: subject, body }), text };
}
