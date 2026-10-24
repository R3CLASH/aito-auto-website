import Link from 'next/link';
import Plate from '@/components/Plate';

export default function NotFound() {
  return (
    <section className="wrap" style={{ padding: '120px 16px 140px', textAlign: 'center' }}>
      <Plate text="404" size="xl" style={{ transform: 'rotate(-4deg)' }} />
      <h1 className="d" style={{ fontSize: 'clamp(56px, 9vw, 120px)', color: 'var(--navy)', marginTop: 40 }}>Väärä liittymä</h1>
      <p style={{ margin: '18px auto 30px', maxWidth: 440, color: 'var(--body)', fontSize: 18 }}>
        Etsimääsi sivua tai autoa ei löytynyt. Auto on ehkä jo myyty – katso muut myynnissä olevat autot.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link className="btn btn-navy cut" href="/autot">Selaa autoja</Link>
        <Link className="btn btn-outline" href="/">Etusivulle</Link>
      </div>
    </section>
  );
}
