import Image from 'next/image';
import Link from 'next/link';
import type { SiteContext } from '@/lib/types';
import { monthlyPayment } from '@/lib/finance';
import { euro, fmt, pct, telHref, two } from '@/lib/format';
import CarCard from '../CarCard';
import Plate from '../Plate';
import SmartLink from '../SmartLink';
import WaButton from '../WaButton';
import RichText from '../RichText';
import { Arrow, CarOutline, ImageIcon } from '../Icons';

type P = { block: any; ctx: SiteContext };

/* ---------------------------------------------------------------- home */

export function Statement({ block }: P) {
  return (
    <section className="wrap stmt">
      {block.term || block.definition ? (
        <div className="stmt-term">{block.term}<br />{block.definition}</div>
      ) : null}
      <p className="rv">
        {block.text}
        {block.highlight ? <> <span className="hl">{block.highlight}</span></> : null}
        {block.muted ? <> <span className="mu">{block.muted}</span></> : null}
      </p>
    </section>
  );
}

export function BrandTicker({ block, ctx }: P) {
  const names = ctx.catalog.brands.map((b) => b.name);
  if (!names.length) return null;
  // Repeat enough times to fill wide screens, then duplicate for a seamless loop.
  const base: string[] = [];
  while (base.length < 8) base.push(...names);
  const row = [...base, ...base];
  return (
    <section className="ticker-wrap" aria-label={block.label || 'Merkit'}>
      <div className="ticker d" aria-hidden="true">
        {row.map((n, i) => (
          <span key={i} style={{ display: 'contents' }}>
            <span>{n}</span><span className="tk-sep">/</span>
          </span>
        ))}
      </div>
      <p className="sr-only">{names.join(', ')}</p>
    </section>
  );
}

export function VehicleTypesGrid({ block, ctx }: P) {
  const { types, cars } = ctx.catalog;
  return (
    <section className="wrap sec" style={{ paddingBottom: 40 }}>
      <div className="sec-head">
        <div>
          {block.eyebrow ? <div className="eyebrow">{block.eyebrow}</div> : null}
          <h2 className="d h-sec wipe">{block.title}</h2>
        </div>
        <Link className="link-strong" href="/autot">{block.linkLabel || 'Kaikki autot →'}</Link>
      </div>
      <div className="grid-4">
        {types.map((t) => {
          const n = cars.filter((c) => c.type?.slug === t.slug).length;
          return (
            <Link key={t.slug} className="type-card lift rv" href={`/autot?tyyppi=${t.slug}`}>
              <div className="pic">
                {t.silhouette ? <Image src={t.silhouette.url} alt="" width={t.silhouette.width} height={t.silhouette.height} sizes="(max-width: 700px) 90vw, 300px" /> : <CarOutline />}
              </div>
              <div className="meta">
                <div>
                  <div className="d">{t.name}</div>
                  <div className="m">{n} {n === 1 ? 'auto' : 'autoa'}</div>
                </div>
                <span className="go" aria-hidden="true">↗</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function LatestCars({ block, ctx }: P) {
  const limit = block.limit || 4;
  let list = block.featuredOnly ? ctx.catalog.cars.filter((c) => c.featured) : [];
  if (list.length < limit) {
    const rest = ctx.catalog.cars.filter((c) => !list.includes(c));
    list = [...list, ...rest];
  }
  list = list.slice(0, limit);
  if (!list.length) return null;
  return (
    <section className="wrap sec" style={{ paddingTop: 90 }}>
      <div className="sec-head">
        <div>
          {block.eyebrow ? <div className="eyebrow">{block.eyebrow}</div> : null}
          <h2 className="d h-sec wipe">{block.title}</h2>
        </div>
        {block.description ? <p>{block.description}</p> : null}
      </div>
      <div className="grid-cars">
        {list.map((c) => <CarCard key={c.documentId} car={c} className="rv" />)}
      </div>
    </section>
  );
}

export function ProcessRoad({ block }: P) {
  const steps: any[] = block.steps || [];
  return (
    <section className="on-dark sec" style={{ overflow: 'hidden' }}>
      <div className="wrap">
        {block.eyebrow ? <div className="eyebrow">{block.eyebrow}</div> : null}
        <h2 className="d h-sec wipe pre">{block.title}</h2>
      </div>
      <div className="road" aria-hidden="true" />
      <div className="wrap posts">
        {steps.map((s, i) => (
          <div key={s.id ?? i} className={`post rv ${i === steps.length - 1 ? 'last' : ''}`}>
            <div className="post-sign"><div className="m">KM</div><div className="d">{two(i + 1)}</div></div>
            <div className="post-pole" />
            <h3 className="d">{s.title}</h3>
            {s.text ? <p>{s.text}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function FinanceTeaser({ block, ctx }: P) {
  const f = ctx.finance;
  const price = block.examplePrice || ctx.catalog.cars[0]?.price || 25000;
  const r = monthlyPayment(price, f);
  return (
    <section className="wrap sec fin-sec">
      <div className="fin-card rv">
        <div className="m" style={{ marginTop: 0, letterSpacing: '.08em' }}>ESIMERKKILASKELMA</div>
        <div className="d big">{fmt(r.monthly)}<span> €/kk</span></div>
        <div className="m">
          {block.exampleLabel ? `${block.exampleLabel} ` : ''}{euro(price)} · käsiraha {euro(r.down)}<br />
          {r.term} kk · korko {pct(r.rate)} % · avausmaksu {euro(f.openingFee)} · {f.monthlyFee} €/kk
          {f.exampleNote ? <><br />{f.exampleNote}</> : null}
        </div>
      </div>
      <div className="fin-copy">
        {block.eyebrow ? <div className="eyebrow">{block.eyebrow}</div> : null}
        <h2 className="d wipe">{block.title}</h2>
        {block.text ? <p>{block.text}</p> : null}
        {block.buttonLabel ? (
          <SmartLink className="btn btn-navy cut" href={block.buttonUrl || '/autot'}>{block.buttonLabel} <Arrow /></SmartLink>
        ) : null}
      </div>
    </section>
  );
}

export function ServicesList({ block }: P) {
  const rows: any[] = block.rows || [];
  return (
    <section className="on-white sec" style={{ borderTop: '1px solid var(--line)' }}>
      <div className="wrap">
        <div className="sec-head">
          <div>
            {block.eyebrow ? <div className="eyebrow">{block.eyebrow}</div> : null}
            <h2 className="d h-sec wipe">{block.title}</h2>
          </div>
          {block.linkLabel ? <SmartLink className="link-strong" href={block.linkUrl || '/palvelut'}>{block.linkLabel}</SmartLink> : null}
        </div>
        <div className="srows">
          {rows.map((r, i) => (
            <SmartLink key={r.id ?? i} className="srow rv" href={r.url || block.linkUrl || '/palvelut'}>
              <span className="sn">{two(i + 1)}</span>
              <span className="d">{r.title}</span>
              {r.text ? <span className="tx">{r.text}</span> : null}
              <span className="ar" aria-hidden="true">→</span>
            </SmartLink>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaBanner({ block }: P) {
  return (
    <section className="cta-band">
      <div className="par" aria-hidden="true" />
      <div className="wrap cta-in">
        <h2 className="d rv">
          {block.title}
          {block.highlight ? <><br /><span>{block.highlight}</span></> : null}
        </h2>
        {block.action === 'link' && block.url ? (
          <SmartLink className="btn btn-white btn-lg rv" href={block.url}>{block.buttonLabel} <Arrow /></SmartLink>
        ) : (
          <WaButton className="btn btn-wa btn-lg rv" options={{ topic: 'Hakutoive' }}>{block.buttonLabel} <Arrow /></WaButton>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- generic */

export function PageHeader({ block }: P) {
  const dark = block.variant !== 'light';
  return (
    <section className={`ph ${dark ? 'dark' : 'light'}`}>
      <div className="wrap ph-in">
        <div>
          {block.eyebrow ? <div className="eyebrow up">{block.eyebrow}</div> : null}
          <h1 className="d up u2 pre">{block.title}</h1>
        </div>
        {block.intro ? <p className="up u3">{block.intro}</p> : null}
      </div>
    </section>
  );
}

export function RichTextSection({ block }: P) {
  return (
    <section className="wrap rt-sec">
      {block.title ? <h2 className="d h-sec" style={{ marginBottom: 24 }}>{block.title}</h2> : null}
      <RichText content={block.body} />
    </section>
  );
}

/* ---------------------------------------------------------------- about */

export function AboutHero({ block }: P) {
  return (
    <section className="wrap ab-hero">
      {block.eyebrow ? <div className="eyebrow up">{block.eyebrow}</div> : null}
      <h1 className="d up u2">
        {block.line1}
        {(block.highlight || block.line2) ? <br /> : null}
        {block.highlight ? <span>{block.highlight}</span> : null}{block.line2 ? ` ${block.line2}` : ''}
      </h1>
      <div className="ab-row">
        {block.text ? <p className="up u3">{block.text}</p> : null}
        {block.stampText ? (
          <div className="stamp hs" aria-hidden="true">
            <svg viewBox="0 0 200 200">
              <defs><path id="circ" d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0" /></defs>
              <text style={{ font: "600 15px 'IBM Plex Mono', monospace", letterSpacing: 5 }} fill="#16263D">
                <textPath href="#circ">{block.stampText}</textPath>
              </text>
            </svg>
            <div className="d">{block.stampYear}</div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function ImageBand({ block }: P) {
  return (
    <section className="wrap" style={{ paddingBottom: 100 }}>
      <div className="band rv">
        {block.image ? (
          <Image src={block.image.url} alt={block.alt || block.image.alt || ''} fill sizes="(max-width: 1300px) 100vw, 1240px" />
        ) : (
          <div className="ph-note"><ImageIcon /><span>[Lisää kuva Strapissa – 2100 × 900]</span></div>
        )}
        {block.plateText ? <Plate text={block.plateText} size="lg" /> : null}
      </div>
    </section>
  );
}

export function ValuesList({ block }: P) {
  const items: any[] = block.items || [];
  return (
    <section className="on-dark sec" style={{ overflow: 'hidden' }}>
      <div className="wrap">
        <div className="sec-head">
          <div>
            {block.eyebrow ? <div className="eyebrow">{block.eyebrow}</div> : null}
            <h2 className="d h-sec wipe pre">{block.title}</h2>
          </div>
          {block.intro ? <p style={{ color: '#b9c6d6' }}>{block.intro}</p> : null}
        </div>
        <div className="vals">
          {items.map((v, i) => (
            <div key={v.id ?? i} className="val sl">
              <span className="d L" aria-hidden="true">{v.letter}</span>
              <h3 className="d">{v.title}</h3>
              {v.text ? <p>{v.text}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Team({ block }: P) {
  const members: any[] = block.members || [];
  if (!members.length) return null;
  return (
    <section className="wrap sec">
      {block.eyebrow ? <div className="eyebrow">{block.eyebrow}</div> : null}
      <h2 className="d h-sec wipe" style={{ marginBottom: 40 }}>{block.title}</h2>
      <div className="grid-4">
        {members.map((m, i) => (
          <div key={m.id ?? i} className="team-card rv">
            <div className="pic">
              {m.photo ? <Image src={m.photo.url} alt={m.name} fill sizes="(max-width: 700px) 100vw, 320px" /> : <span className="m" style={{ fontSize: 12, color: 'var(--muted)' }}>[Henkilökuva]</span>}
              {m.plate ? <Plate text={m.plate} /> : null}
            </div>
            <div className="info">
              <div className="d">{m.name}</div>
              {m.role ? <div className="role">{m.role}</div> : null}
              {m.phone ? <div className="m"><a href={telHref(m.phone)}>{m.phone}</a></div> : null}
              {m.email ? <div className="m" style={{ marginTop: 4 }}><a href={`mailto:${m.email}`}>{m.email}</a></div> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function VisitCta({ block, ctx }: P) {
  const g = ctx.global;
  const open = g.openingHours.filter((h) => !h.closed && h.opens).map((h) => `${h.label.slice(0, 2)} ${h.opens}–${h.closes}`);
  return (
    <section className="visit">
      <div className="wrap">
        <div className="rv">
          {block.eyebrow ? <div className="eyebrow">{block.eyebrow}</div> : null}
          <h2 className="d">{g.street}<br />{g.city}</h2>
          <div className="m">{open.join(' · ')}</div>
        </div>
        <div className="rv" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <SmartLink className="btn btn-white cut" href={block.buttonUrl || '/yhteystiedot'}>{block.buttonLabel || 'Yhteystiedot'} <Arrow /></SmartLink>
          <WaButton className="btn btn-wa">WhatsApp</WaButton>
        </div>
      </div>
    </section>
  );
}
