import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

import { badRequest } from "@/lib/api";
import { checkUpload, generateUploadName, UPLOAD_DIR } from "@/lib/uploads";

/**
 * Admin panelindən şəkil yükləmə (ecommerce.md §3.4, §6).
 * Fayllar `UPLOAD_DIR` qovluğuna (standart: `public/uploads/`) yazılır; cavabdakı
 * `/uploads/...` yolunu `app/uploads/[...path]/route.ts` verir.
 *
 * Route middleware ilə qorunur — sessiyasız buraya çatmaq mümkün deyil.
 */

// Bir sorğuda ən çox neçə fayl
const MAX_FILES = 10;

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return badRequest("Fayl göndərilmədi.");
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return badRequest("Fayl seçilməyib.");
  }
  if (files.length > MAX_FILES) {
    return badRequest(`Bir dəfəyə ən çox ${MAX_FILES} şəkil yükləmək olar.`);
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const urls: string[] = [];

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());

    const check = checkUpload(file.type, buffer.byteLength, buffer.subarray(0, 12));
    if (!check.ok) {
      // Faylın adını mesajda göstəririk ki, hansının problemli olduğu bilinsin
      const safeName = file.name.slice(0, 60).replace(/[\r\n]/g, "");
      return badRequest(`"${safeName}" — ${check.error}`);
    }

    const fileName = generateUploadName(check.extension);
    await fs.writeFile(path.join(UPLOAD_DIR, fileName), buffer);
    urls.push(`/uploads/${fileName}`);
  }

  return NextResponse.json({ ok: true, urls });
}
