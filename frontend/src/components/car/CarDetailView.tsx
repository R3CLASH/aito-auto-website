import Link from 'next/link';
import type { CarDetail, CarDetailTemplate, Catalog, SiteContext } from '@/lib/types';
import { euro, fmt, km } from '@/lib/format';
import { SITE_URL } from '@/lib/site';
import Plate from '../Plate';
import RichText from '../RichText';
import CarCard from '../CarCard';
import BlockRenderer from '../BlockRenderer';
import CarGallery from './CarGallery';
import CarCalculator from './CarCalculator';
import CarActions from './CarActions';
import CarStickyBar from './CarStickyBar';
import type { WaCar } from '../WhatsAppProvider';

function similar(car: CarDetail, catalog: Catalog) {
  const others = catalog.cars.filter((c) => c.documentId !== car.documentId);
  const out = others.filter((c) => c.model.slug === car.model.slug);
  for (const c of others.filter((c) => c.brand.slug === car.brand.slug)) if (out.length < 3 && !out.includes(c)) out.push(c);
  for (const c of others.filter((c) => c.type?.slug === car.type?.slug)) if (out.length < 3 && !out.includes(c)) out.push(c);
  return out.slice(0, 3);
}

export default function CarDetailView({ car, tpl, ctx, templateBlocks }: {
  car: CarDetail;
  tpl: CarDetailTemplate;
  ctx: SiteContext;
  templateBlocks: any[];
}) {
  const meta = `${car.year} · ${km(car.mileage)} · ${euro(car.price)}`;
  const waCar: WaCar = {
    documentId: car.documentId,
    title: car.title,
    meta,
    image: car.image?.url || car.placeholder?.url || null,
    url: car.href,
  };
  const specs: [string, string][] = [
    ['Vuosimalli', String(car.year)],
    ['Mittarilukema', km(car.mileage)],
    ['Käyttövoima', car.fuel],
    ['Vaihteisto', car.transmission],
    ['Vetotapa', car.drivetrain],
    ['Teho', car.powerKw ? `${car.powerKw} kW (${Math.round(car.powerKw * 1.36)} hv)` : ''],
    ['Väri', car.color],
    ['Katsastettu', car.inspectedUntil],
    ['CO₂ (WLTP)', car.co2 ? `${car.co2} g/km` : ''],
    ['Arvonlisävero', car.vatDeductible ? 'ALV-vähennyskelpoinen' : ''],
    ...car.extraSpecs.map((s) => [s.label, s.value] as [string, string]),
  ];
  const sim = similar(car, ctx.catalog);
  const badges = [car.type?.name, `${car.powerKw ? `${car.powerKw} kW` : ''}`].filter(Boolean);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: car.title,
    brand: { '@type': 'Brand', name: car.brand.name },
    model: car.model.name,
    vehicleModelDate: String(car.year),
    mileageFromOdometer: { '@type': 'QuantitativeValue', value: car.mileage, unitCode: 'KMT' },
    fuelType: car.fuel,
    vehicleTransmission: car.transmission,
    image: car.images.map((i) => `${SITE_URL}${i.url}`),
    url: `${SITE_URL}${car.href}`,
    offers: {
      '@type': 'Offer', price: car.price, priceCurrency: 'EUR',
      availability: car.sold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      seller: { '@type': 'AutoDealer', name: ctx.global.siteName },
    },
  };

  return (
    <>
      <section className="wrap cd-top">
        <nav className="cd-crumbs up" aria-label="Murupolku">
          <Link href="/">Etusivu</Link><span>/</span>
          <Link href="/autot">Autot</Link><span>/</span>
          <Link href={`/autot/${car.brand.slug}`}>{car.brand.name}</Link><span>/</span>
          <Link href={`/autot/${car.brand.slug}/${car.model.slug}`}>{car.model.name}</Link><span>/</span>
          <span className="here">{car.variant || car.title}</span>
        </nav>
        <div className="cd-grid">
          <CarGallery images={car.images} placeholder={car.placeholder} title={car.title} />
          <aside className="cd-aside">
            <div className="kick up">{[car.brand.name, car.model.name, car.type?.name].filter(Boolean).join(' · ')}</div>
            <h1 className="d up u2">{car.brand.name} {car.model.name}</h1>
            {car.variant ? <div className="var up u2">{car.variant}</div> : null}
            <div className="chips up u3">
              <span>{car.year}</span><span>{km(car.mileage)}</span><span>{car.fuel}</span><span>{car.transmission}</span>
              {badges.slice(1).map((b) => <span key={b}>{b}</span>)}
              {car.badge ? <span style={{ background: car.reserved ? '#b54708' : 'var(--navy)', color: '#fff', borderColor: 'transparent' }}>{car.badge}</span> : null}
            </div>
            <div className="price-row up u3">
              <div>
                <div className="lbl">Hinta</div>
                <Plate band="EUR" text={euro(car.price)} size="lg" />
              </div>
              {!car.sold ? (
                <a href="#laskuri">
                  <div className="lbl">kuukausierä alk.</div>
                  <div className="d">{fmt(car.monthly)} €<span>/kk</span></div>
                </a>
              ) : null}
            </div>
            {car.sold ? <div className="sold-note">Tämä auto on myyty.</div> : null}
            <CarActions car={waCar} sold={car.sold} />
            {(car.highlights.length || tpl.trustBadges.length) ? (
              <div className="trust">
                {[...car.highlights, ...tpl.trustBadges].map((t) => <span key={t}>{t}</span>)}
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      <section className="wrap cd-info">
        <div>
          <div className="eyebrow">Tekniset tiedot</div>
          <h2 className="d wipe">{tpl.specsTitle}</h2>
          <div className="specs">
            {specs.filter(([, v]) => v).map(([l, v]) => (
              <div className="spec" key={l}><span className="m">{l}</span><b>{v}</b></div>
            ))}
          </div>
        </div>
        {car.equipment.length ? (
          <div>
            <div className="eyebrow">Varusteet</div>
            <h2 className="d wipe">{tpl.equipmentTitle}</h2>
            <ul className="equip">{car.equipment.map((e) => <li key={e}>{e}</li>)}</ul>
          </div>
        ) : null}
      </section>

      {!car.sold ? (
        <CarCalculator price={car.price} finance={ctx.finance} eyebrow={tpl.calculatorEyebrow} title={tpl.calculatorTitle} car={waCar} />
      ) : null}

      {(car.description?.length || tpl.descriptionFallback) ? (
        <section className="cd-desc">
          <div className="wrap">
            <div className="eyebrow">{tpl.descriptionTitle}</div>
            {car.description?.length ? <RichText content={car.description} /> : <div className="prose"><p>{tpl.descriptionFallback}</p></div>}
          </div>
        </section>
      ) : null}

      {sim.length ? (
        <section className="wrap sec" style={{ paddingTop: 90 }}>
          <div className="sec-head">
            <h2 className="d h-sec wipe" style={{ fontSize: 'clamp(40px, 5vw, 72px)' }}>{tpl.similarTitle}</h2>
            <Link className="link-strong" href={`/autot/${car.brand.slug}/${car.model.slug}`}>Kaikki {car.brand.name} {car.model.name} →</Link>
          </div>
          <div className="grid-cars">{sim.map((c) => <CarCard key={c.documentId} car={c} className="rv" />)}</div>
        </section>
      ) : null}

      {templateBlocks.length ? <BlockRenderer blocks={templateBlocks} ctx={ctx} /> : null}

      {!car.sold ? <CarStickyBar car={waCar} price={euro(car.price)} monthly={car.monthly} /> : null}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </>
  );
}
