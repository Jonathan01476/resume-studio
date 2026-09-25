'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="empty-page">
      <span className="eyebrow">FOLIO / CONNECTION</span>
      <h1>We couldn’t load this document.</h1>
      <p>Your saved work is unchanged. Check your connection and try again.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
