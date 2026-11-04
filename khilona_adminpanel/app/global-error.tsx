'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#F7F7F5', color: '#111111', margin: 0 }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
          <strong>White Monkey Toys</strong>
          <h1 style={{ fontSize: 20, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: '#686868', fontSize: 14, margin: 0 }}>Please reload the page.</p>
          <button
            onClick={reset}
            style={{ background: '#111111', color: '#fff', border: 0, borderRadius: 999, padding: '10px 16px', fontWeight: 600, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
