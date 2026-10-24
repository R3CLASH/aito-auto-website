import type { ServiceItem } from '@/lib/types';
import { two } from '@/lib/format';
import SmartLink from '../SmartLink';
import { Arrow } from '../Icons';
import TradeInForm from './TradeInForm';

export default function ServicesDetail({ block, services }: { block: any; services: ServiceItem[] }) {
  if (!services.length) return null;
  return (
    <section className="wrap svc-sec">
      <nav className="idx" aria-label="Palvelut">
        <div className="eyebrow">{block.indexLabel || 'Sisällys'}</div>
        {services.map((s, i) => (
          <a key={s.slug} href={`#${s.slug}`}><span>{two(i + 1)}</span>{s.title}</a>
        ))}
      </nav>
      <div className="svc-list">
        {services.map((s, i) => (
          <article key={s.slug} id={s.slug} className="svc rv">
            <div className="svc-h">
              <span className="d big" aria-hidden="true">{two(i + 1)}</span>
              <h2 className="d">{s.title}</h2>
            </div>
            <div className="svc-rule" />
            {s.body ? <p>{s.body}</p> : s.summary ? <p>{s.summary}</p> : null}
            {s.facts.length ? (
              <ul className="facts">
                {s.facts.map((f, j) => <li key={j}><div className="m">{f.label}</div><b>{f.value}</b></li>)}
              </ul>
            ) : null}
            {s.special === 'trade-in-form' ? <TradeInForm /> : null}
            {s.ctaLabel && s.ctaUrl ? <SmartLink className="btn btn-navy" href={s.ctaUrl}>{s.ctaLabel} <Arrow /></SmartLink> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
