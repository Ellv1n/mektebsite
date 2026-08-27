import { PAYMENT_METHOD_LABEL } from "../constants";
import { formatBakuDateTime } from "../date";
import { formatQepik } from "../money";
import { formatAzPhone } from "../phone";
import { CELL, escapeHtml, HEAD_CELL, type MailLineItem } from "./shared";

/**
 * Yeni sifariş bildirişi (ecommerce.md §2.8).
 *
 * E-poçt klientlərinin çoxu `<style>` bloklarını silir — bütün stillər
 * elementin öz `style` atributundadır.
 *
 * ⚠️ Hər məhsulun yanında VARİANT, RƏNG və QEYD mütləq göstərilir —
 * müştərinin hansı variantdan istədiyi buradan dərhal görünməlidir.
 */

/** Admin bildirişindəki məhsul sətri — təsdiq məktubu ilə eyni formadır. */
export type OrderEmailItem = MailLineItem;

export type OrderEmailData = {
  orderNumber: string;
  createdAt: Date;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  city: string;
  address: string;
  note: string | null;
  items: OrderEmailItem[];
  subtotalQepik: number;
  promoCode: string | null;
  discountPct: number;
  discountQepik: number;
  deliveryFeeQepik: number;
  totalQepik: number;
  adminUrl: string;
  /** Müştəriyə verilən gizli izləmə kodu (məs. "K7M2-P9XQ") */
  trackingCode: string;
  trackingUrl: string;
};

export function renderOrderEmail(data: OrderEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const customerName = `${data.firstName} ${data.lastName}`.trim();
  const subject = `Yeni sifariş #${data.orderNumber} — ${customerName}`;

  const rows = data.items
    .map(
      (item) => `
        <tr>
          <td style="${CELL}">${escapeHtml(item.productName)}</td>
          <td style="${CELL}text-align:center;">${item.quantity}</td>
          <td style="${CELL}text-align:right;white-space:nowrap;">${formatQepik(item.priceQepik)}</td>
          <td style="${CELL}">${item.color ? escapeHtml(item.color) : "<span style=\"color:#9ca3af;\">seçilməyib</span>"}</td>
          <td style="${CELL}">${item.variant ? escapeHtml(item.variant) : "<span style=\"color:#9ca3af;\">—</span>"}</td>
          <td style="${CELL}">${item.note ? escapeHtml(item.note) : "<span style=\"color:#9ca3af;\">—</span>"}</td>
        </tr>`
    )
    .join("");

  const discountRow =
    data.discountQepik > 0 && data.promoCode
      ? `<tr>
           <td style="padding:4px 0;color:#15803d;font-size:14px;">Endirim (${escapeHtml(data.promoCode)}, ${data.discountPct}%)</td>
           <td style="padding:4px 0;text-align:right;color:#15803d;font-size:14px;font-weight:600;">−${formatQepik(data.discountQepik)}</td>
         </tr>`
      : "";

  const html = `<!doctype html>
<html lang="az">
<body style="margin:0;padding:20px;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">

    <div style="background:#2563eb;padding:20px 24px;">
      <h1 style="margin:0;font-size:20px;color:#ffffff;">Yeni sifariş #${escapeHtml(data.orderNumber)}</h1>
      <p style="margin:6px 0 0;font-size:14px;color:#dbeafe;">${formatBakuDateTime(data.createdAt)} (Bakı vaxtı)</p>
      <p style="margin:10px 0 0;font-size:13px;color:#dbeafe;">
        Müştərinin izləmə kodu:
        <strong style="color:#ffffff;letter-spacing:1px;">${escapeHtml(data.trackingCode)}</strong>
      </p>
    </div>

    <div style="padding:20px 24px;">
      <h2 style="margin:0 0 10px;font-size:15px;color:#111827;">Müştəri</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:22px;">
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#6b7280;width:130px;">Ad, soyad</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;">${escapeHtml(customerName)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#6b7280;">Telefon</td>
          <td style="padding:4px 0;font-size:14px;">
            <a href="tel:${escapeHtml(data.phone)}" style="color:#2563eb;text-decoration:none;font-weight:600;">${escapeHtml(formatAzPhone(data.phone))}</a>
          </td>
        </tr>
        ${
          data.email
            ? `<tr>
                 <td style="padding:4px 0;font-size:14px;color:#6b7280;">E-poçt</td>
                 <td style="padding:4px 0;font-size:14px;"><a href="mailto:${escapeHtml(data.email)}" style="color:#2563eb;">${escapeHtml(data.email)}</a></td>
               </tr>`
            : ""
        }
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#6b7280;">Şəhər / Rayon</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;">${escapeHtml(data.city)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#6b7280;vertical-align:top;">Ünvan</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;">${escapeHtml(data.address)}</td>
        </tr>
        ${
          data.note
            ? `<tr>
                 <td style="padding:4px 0;font-size:14px;color:#6b7280;vertical-align:top;">Sifarişə qeyd</td>
                 <td style="padding:4px 0;font-size:14px;color:#111827;">${escapeHtml(data.note)}</td>
               </tr>`
            : ""
        }
      </table>

      <h2 style="margin:0 0 10px;font-size:15px;color:#111827;">Məhsullar</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr>
            <th style="${HEAD_CELL}">Məhsul</th>
            <th style="${HEAD_CELL}text-align:center;">Say</th>
            <th style="${HEAD_CELL}text-align:right;">Qiymət</th>
            <th style="${HEAD_CELL}">Rəng</th>
            <th style="${HEAD_CELL}">Variant</th>
            <th style="${HEAD_CELL}">Qeyd</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <table style="width:100%;max-width:320px;margin-left:auto;border-collapse:collapse;">
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#6b7280;">Ara cəmi</td>
          <td style="padding:4px 0;text-align:right;font-size:14px;color:#111827;">${formatQepik(data.subtotalQepik)}</td>
        </tr>
        ${discountRow}
        <tr>
          <td style="padding:4px 0;color:#6b7280;font-size:14px;">Çatdırılma</td>
          <td style="padding:4px 0;text-align:right;font-size:14px;font-weight:600;color:${data.deliveryFeeQepik === 0 ? "#15803d" : "#111827"};">
            ${data.deliveryFeeQepik === 0 ? "Pulsuz" : formatQepik(data.deliveryFeeQepik)}
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0 0;border-top:2px solid #e5e7eb;font-size:16px;font-weight:700;color:#111827;">Yekun</td>
          <td style="padding:10px 0 0;border-top:2px solid #e5e7eb;text-align:right;font-size:18px;font-weight:800;color:#111827;">${formatQepik(data.totalQepik)}</td>
        </tr>
      </table>

      <p style="margin:20px 0 0;padding:10px 14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;font-size:14px;color:#9a3412;">
        Ödəniş üsulu: <strong>${PAYMENT_METHOD_LABEL}</strong>
      </p>

      <p style="margin:22px 0 0;text-align:center;">
        <a href="${escapeHtml(data.adminUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:15px;font-weight:700;">
          Admin paneldə aç
        </a>
      </p>
    </div>
  </div>
</body>
</html>`;

  const textLines = [
    `Yeni sifariş #${data.orderNumber}`,
    `${formatBakuDateTime(data.createdAt)} (Bakı vaxtı)`,
    "",
    `Müştəri: ${customerName}`,
    `Telefon: ${formatAzPhone(data.phone)}`,
    ...(data.email ? [`E-poçt:  ${data.email}`] : []),
    `Ünvan:   ${data.city}, ${data.address}`,
    ...(data.note ? [`Qeyd:    ${data.note}`] : []),
    "",
    "Məhsullar:",
    ...data.items.map(
      (i) =>
        `  • ${i.productName} — ${i.quantity} ədəd × ${formatQepik(i.priceQepik)}` +
        ` | Rəng: ${i.color ?? "seçilməyib"}` +
        (i.variant ? ` | ${i.variant}` : "") +
        ` | Qeyd: ${i.note ?? "—"}`
    ),
    "",
    `Ara cəmi: ${formatQepik(data.subtotalQepik)}`,
    ...(data.discountQepik > 0 && data.promoCode
      ? [`Endirim (${data.promoCode}, ${data.discountPct}%): -${formatQepik(data.discountQepik)}`]
      : []),
    `Çatdırılma: ${data.deliveryFeeQepik === 0 ? "Pulsuz" : formatQepik(data.deliveryFeeQepik)}`,
    `Yekun: ${formatQepik(data.totalQepik)}`,
    "",
    `Ödəniş üsulu: ${PAYMENT_METHOD_LABEL}`,
    "",
    `İzləmə kodu: ${data.trackingCode}`,
    `İzləmə linki: ${data.trackingUrl}`,
    `Admin panel: ${data.adminUrl}`,
  ];

  return { subject, html, text: textLines.join("\n") };
}
