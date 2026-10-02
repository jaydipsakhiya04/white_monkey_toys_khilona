'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#FAFAF9', color: '#18181B', margin: 0 }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
          <strong style={{ letterSpacing: '0.14em' }}>KHILONA</strong>
          <h1 style={{ fontSize: 20, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: '#71717A', fontSize: 14, margin: 0 }}>Please reload the page.</p>
          <button
            onClick={reset}
            style={{ background: '#E4572E', color: '#fff', border: 0, borderRadius: 8, padding: '10px 16px', fontWeight: 600, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
