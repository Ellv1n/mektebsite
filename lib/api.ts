import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/**
 * API route-lar üçün ortaq köməkçilər.
 * Bütün xəta mesajları Azərbaycan dilindədir (ecommerce.md §0).
 */

/** Zod xətasından ilk mesajı götürüb 400 cavabı qaytarır. */
export function zodErrorResponse(error: ZodError) {
  const issue = error.issues[0];
  return NextResponse.json(
    {
      error: issue?.message ?? "Göndərilən məlumatlar düzgün deyil.",
      field: issue?.path?.[0] !== undefined ? String(issue.path[0]) : undefined,
    },
    { status: 400 }
  );
}

export function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Body-ni JSON kimi oxuyur; format pozuqdursa `null` qaytarır. */
export async function readJsonBody(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
