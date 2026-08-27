import fs from "node:fs/promises";
import path from "node:path";

import { PUBLIC_UPLOAD_DIR, UPLOAD_DIR } from "@/lib/uploads";

/**
 * `/uploads/...` şəkillərini diskdən oxuyub verir.
 *
 * NİYƏ LAZIMDIR: produksiyada (`next start`) Next `public/` qovluğunun siyahısını
 * yalnız server qalxanda bir dəfə oxuyur (`router-utils/filesystem.js` →
 * `publicFolderItems`). Server işləyəndən SONRA admin paneldən yüklənən şəkil bu
 * siyahıda olmadığı üçün 404 qaytarılırdı; `next/image` optimizatoru isə 404
 * səhifəsinin HTML-ni alıb "The requested resource isn't a valid image." (400)
 * xətası verirdi. Route handler hər sorğuda diskə baxdığı üçün yeni yüklənən
 * şəkil dərhal görünür — serveri yenidən başlatmaq lazım deyil.
 *
 * Build zamanı mövcud olan kataloq şəkilləri (`products/`, `categories/`) yenə də
 * statik olaraq verilir — Next statik faylı route-dan əvvəl yoxlayır, bura yalnız
 * tapılmayanlar düşür.
 */

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

// Hər sorğuda diskə baxılsın — keşlənmiş boş cavab qalmasın.
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ path: string[] }> };

function notFound() {
  return new Response("Şəkil tapılmadı.", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

/**
 * Sorğudakı yolu qovluğun içində qalmağa məcbur edir — `../` ilə kənara çıxmaq,
 * eləcə də gizli fayl adları (`.env` və s.) qadağandır.
 */
function safeJoin(root: string, segments: string[]): string | null {
  if (segments.some((s) => !s || s === "." || s === ".." || s.includes("\0"))) {
    return null;
  }
  const target = path.resolve(root, ...segments);
  const rootWithSep = path.resolve(root) + path.sep;
  return target.startsWith(rootWithSep) ? target : null;
}

export async function GET(_request: Request, { params }: Params) {
  const { path: rawSegments } = await params;

  let segments: string[];
  try {
    segments = rawSegments.map((s) => decodeURIComponent(s));
  } catch {
    return notFound();
  }

  const extension = path.extname(segments[segments.length - 1] ?? "").toLowerCase();
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) {
    // Yalnız şəkil verilir — başqa fayl tipləri üçün bu route açıq deyil.
    return notFound();
  }

  // Əvvəlcə yüklənən şəkillər qovluğu, sonra layihədəki kataloq şəkilləri.
  const roots = UPLOAD_DIR === PUBLIC_UPLOAD_DIR ? [UPLOAD_DIR] : [UPLOAD_DIR, PUBLIC_UPLOAD_DIR];

  for (const root of roots) {
    const filePath = safeJoin(root, segments);
    if (!filePath) return notFound();

    let file: Buffer;
    try {
      file = await fs.readFile(filePath);
    } catch {
      continue;
    }

    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(file.byteLength),
        // Fayl adları təsadüfidir və dəyişmir — uzun keş təhlükəsizdir.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  return notFound();
}
