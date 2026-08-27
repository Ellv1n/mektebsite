import nodemailer, { type Transporter } from "nodemailer";

import { STORE_INFO } from "./constants";

/**
 * E-poçt göndərişi.
 *
 * LOKAL İNKİŞAF: .env-də SMTP_HOST boşdursa heç nə göndərilmir —
 * e-poçtun məzmunu terminal konsoluna çap olunur. Beləliklə SMTP qurmadan
 * da sifariş axınını başdan-sona test etmək mümkündür.
 *
 * ⚠️ Bu modul HEÇ VAXT exception atmır. Sifariş e-poçt xətasına görə
 * ləğv olunmamalıdır (ecommerce.md §2.8) — xəta yalnız log-a yazılır.
 */

export type MailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type MailResult =
  | { sent: true; mode: "smtp"; messageId: string }
  | { sent: false; mode: "console"; reason: string }
  | { sent: false; mode: "error"; reason: string };

/** SMTP dəyərləri .env-də doldurulubmu? */
export function isMailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_PORT?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASSWORD?.trim()
  );
}

let cachedTransport: Transporter | null = null;

function getTransport(): Transporter {
  if (cachedTransport) return cachedTransport;

  const port = Number(process.env.SMTP_PORT);
  cachedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST!.trim(),
    port,
    // 465 → implicit TLS, 587 → STARTTLS
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER!.trim(),
      pass: process.env.SMTP_PASSWORD!.trim(),
    },
  });

  return cachedTransport;
}

/** Konsola oxunaqlı şəkildə çap edir — SMTP qurulmayanda işə düşür. */
function printToConsole(input: MailInput) {
  const line = "─".repeat(64);
  console.log(`\n${line}`);
  console.log("📧  E-POÇT (SMTP qurulmayıb — göndərilmədi, yalnız çap olunur)");
  console.log(line);
  console.log(`Kimə:    ${input.to}`);
  console.log(`Mövzu:   ${input.subject}`);
  console.log(line);
  console.log(input.text ?? htmlToPlainText(input.html));
  console.log(`${line}\n`);
}

/** HTML-dən sadə mətn çıxarır (konsol çapı üçün kifayətdir). */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\/(tr|div|p|h[1-6]|table)>/gi, "\n")
    .replace(/<\/td>/gi, "\t")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join("\n");
}

/**
 * E-poçt göndərir. Uğursuzluq halında da exception atmır —
 * nəticəni obyekt kimi qaytarır ki, çağıran tərəf sifarişi davam etdirsin.
 */
export async function sendMail(input: MailInput): Promise<MailResult> {
  if (!isMailConfigured()) {
    printToConsole(input);
    return {
      sent: false,
      mode: "console",
      reason: "SMTP dəyərləri .env-də boşdur — konsola çap olundu",
    };
  }

  try {
    const from =
      process.env.SMTP_FROM?.trim() ||
      `"${STORE_INFO.name}" <${process.env.SMTP_USER!.trim()}>`;

    const info = await getTransport().sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text ?? htmlToPlainText(input.html),
    });

    return { sent: true, mode: "smtp", messageId: info.messageId };
  } catch (error) {
    // Sifariş bazaya artıq yazılıb — burada yalnız log-a yazırıq
    const reason = error instanceof Error ? error.message : String(error);
    console.error("[mail] E-poçt göndərilmədi:", reason);
    return { sent: false, mode: "error", reason };
  }
}
