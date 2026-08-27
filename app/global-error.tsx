"use client";

/**
 * Ən son qoruma qatı — kök layout-un özü sınanda işə düşür.
 * Bu komponent öz `<html>` və `<body>` etiketlərini yazmalıdır,
 * ona görə burada Tailwind sinifləri yox, inline stil işlədilir.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="az">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: 'system-ui, "Segoe UI", Arial, sans-serif',
          background: "#f9fafb",
          color: "#1f2937",
        }}
      >
        <main style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>Saytda texniki problem var</h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 20px" }}>
            Bir az sonra yenidən cəhd edin. Problem davam edərsə bizimlə əlaqə saxlayın.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: 0,
              borderRadius: 10,
              padding: "12px 24px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Yenidən cəhd et
          </button>
          {error.digest && (
            <p style={{ marginTop: 20, fontSize: 12, color: "#9ca3af" }}>
              Xəta kodu: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
