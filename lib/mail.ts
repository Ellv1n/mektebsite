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
    // Gmail bəzən əlaqəni açıb cavab vermir. Açıq limitlər olmasa sorğu
    // dəqiqələrlə asılı qalır və admin paneldə "göndərildi" görünmür.
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
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

/** Neçə dəfə cəhd edilsin (ilk cəhd + təkrarlar) və aralardakı gözləmə. */
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = [1_000, 3_000];

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * E-poçt göndərir. Uğursuzluq halında da exception atmır —
 * nəticəni obyekt kimi qaytarır ki, çağıran tərəf sifarişi davam etdirsin.
 *
 * SMTP xətaları çox vaxt keçicidir (Gmail sürət limiti, qopmuş socket,
 * "greeting never received"). Ona görə uğursuz cəhd 2 dəfə təkrarlanır və
 * hər dəfə YENİ bağlantı ilə: köhnəlmiş transport keşi sıfırlanır.
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

  const from =
    process.env.SMTP_FROM?.trim() ||
    `"${STORE_INFO.name}" <${process.env.SMTP_USER!.trim()}>`;

  let lastReason = "naməlum xəta";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const info = await getTransport().sendMail({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text ?? htmlToPlainText(input.html),
      });

      if (attempt > 1) {
        console.log(`[mail] ${attempt}-ci cəhddə göndərildi → ${input.to}`);
      }
      return { sent: true, mode: "smtp", messageId: info.messageId };
    } catch (error) {
      lastReason = error instanceof Error ? error.message : String(error);
      console.error(
        `[mail] Cəhd ${attempt}/${MAX_ATTEMPTS} uğursuz (${input.to}): ${lastReason}`
      );

      // Bağlantı köhnəlmiş ola bilər — növbəti cəhd təzə transport ilə olsun
      cachedTransport = null;

      if (attempt < MAX_ATTEMPTS) {
        await wait(RETRY_DELAY_MS[attempt - 1] ?? 3_000);
      }
    }
  }

  // Sifariş bazaya artıq yazılıb — burada yalnız log-a yazırıq
  console.error(`[mail] E-poçt göndərilmədi (${MAX_ATTEMPTS} cəhd): ${lastReason}`);
  return { sent: false, mode: "error", reason: lastReason };
}
