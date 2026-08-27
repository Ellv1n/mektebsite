/**
 * Tarix köməkçiləri — bütün göstərişlər **Bakı vaxtı** ilədir.
 * Azərbaycan 2016-cı ildən yay vaxtına keçmir, ona görə fərq sabit UTC+4-dür.
 */

const BAKU_OFFSET_MS = 4 * 60 * 60 * 1000;
export const BAKU_TZ = "Asia/Baku";

/** Bakı vaxtı ilə bugünkü günün başlanğıcı (UTC Date obyekti kimi). */
export function startOfTodayBaku(now: Date = new Date()): Date {
  const baku = new Date(now.getTime() + BAKU_OFFSET_MS);
  const midnightUtc = Date.UTC(
    baku.getUTCFullYear(),
    baku.getUTCMonth(),
    baku.getUTCDate()
  );
  return new Date(midnightUtc - BAKU_OFFSET_MS);
}

function parts(date: Date) {
  // en-GB locale-i dd/mm/yyyy verir — nəticəni özümüz formatlayırıq ki,
  // Node-un ICU məlumatından asılı olmayaq.
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: BAKU_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const out: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) {
    if (p.type !== "literal") out[p.type] = p.value;
  }
  return out;
}

/** `26.08.2026` */
export function formatBakuDate(date: Date): string {
  const p = parts(date);
  return `${p.day}.${p.month}.${p.year}`;
}

/** `26.08.2026, 14:35` */
export function formatBakuDateTime(date: Date): string {
  const p = parts(date);
  return `${p.day}.${p.month}.${p.year}, ${p.hour}:${p.minute}`;
}

/** Sifariş nömrəsi üçün Bakı vaxtı ilə cari il. */
export function currentYearBaku(now: Date = new Date()): number {
  return new Date(now.getTime() + BAKU_OFFSET_MS).getUTCFullYear();
}
