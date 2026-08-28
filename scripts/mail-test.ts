/**
 * SMTP-nin işlədiyini birbaşa yoxlamaq üçün:
 *
 *   npm run mail:test -- unvan@example.com
 *
 * Sifariş vermədən, admin panelə girmədən real status məktubu göndərir və
 * nəticəni (uğur / səbəb) terminala yazır. Serverdə "məktub gəlmir" halında
 * problemin SMTP-də, yoxsa sifarişin özündə olduğunu bir addımda ayırır.
 *
 * .env dəyərləri Node-un öz `--env-file` bayrağı ilə yüklənir (package.json-a bax).
 */

import { renderOrderStatusEmail } from "../lib/email/order-status";
import { isMailConfigured, sendMail } from "../lib/mail";

const to = process.argv[2]?.trim();

if (!to || !to.includes("@")) {
  console.error("İstifadə:  npm run mail:test -- unvan@example.com");
  process.exit(1);
}

const missing = (["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD"] as const).filter(
  (key) => !process.env[key]?.trim()
);

console.log("SMTP_HOST:", process.env.SMTP_HOST || "(boş)");
console.log("SMTP_PORT:", process.env.SMTP_PORT || "(boş)");
console.log("SMTP_USER:", process.env.SMTP_USER || "(boş)");
console.log("SMTP_PASSWORD:", process.env.SMTP_PASSWORD ? "(doludur)" : "(boş)");
console.log("SMTP_FROM:", process.env.SMTP_FROM || "(boş — SMTP_USER işlədiləcək)");
console.log("NEXT_PUBLIC_SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL || "(boş)");
console.log("");

if (!isMailConfigured()) {
  console.error(`⚠ SMTP qurulmayıb — boş olan dəyərlər: ${missing.join(", ")}`);
  console.error("  Məktub göndərilməyəcək, yalnız konsola çap olunacaq.\n");
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";

const { subject, html, text } = renderOrderStatusEmail({
  orderNumber: "TEST-0001",
  firstName: "Test",
  status: "SHIPPING",
  totalQepik: 1571,
  trackingCode: "TEST-KODU",
  trackingUrl: `${siteUrl}/izle/TESTKODU`,
});

async function main() {
  const result = await sendMail({ to, subject, html, text });

  if (result.sent) {
    console.log(`✓ Göndərildi → ${to}   (messageId: ${result.messageId})`);
  } else if (result.mode === "console") {
    console.log("• SMTP qurulmayıb — məktub yuxarıda konsola çap olundu.");
  } else {
    console.error(`✗ Göndərilmədi: ${result.reason}`);
    process.exit(1);
  }
}

main();
