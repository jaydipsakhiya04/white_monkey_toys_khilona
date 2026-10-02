"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#FFFCF7", color: "#1D1B2F", margin: 0 }}>
        <main style={{ maxWidth: 520, margin: "15vh auto", padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: "#5E5A6E" }}>Please try again in a moment.</p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              background: "#C9461F",
              color: "#fff",
              border: 0,
              borderRadius: 12,
              padding: "12px 20px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
