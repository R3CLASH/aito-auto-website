'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="wrap" style={{ padding: '120px 16px 140px', textAlign: 'center' }}>
      <h1 className="d" style={{ fontSize: 'clamp(48px, 8vw, 100px)', color: 'var(--navy)' }}>Hetkellinen häiriö</h1>
      <p style={{ margin: '18px auto 30px', maxWidth: 440, color: 'var(--body)', fontSize: 18 }}>
        Sivun lataus epäonnistui. Yritä hetken päästä uudelleen.
      </p>
      <button className="btn btn-navy" type="button" onClick={reset}>Yritä uudelleen</button>
    </section>
  );
}
