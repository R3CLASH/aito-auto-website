'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Catalog } from '@/lib/types';
import CarCard from '../CarCard';
import { useWhatsApp } from '../WhatsAppProvider';

type Sort = 'new' | 'low' | 'high' | 'km';
const PAGE = 24;

export default function InventoryBrowser({ block, catalog, initial }: {
  block: any;
  catalog: Catalog;
  initial: { type: string; brand: string; model: string };
}) {
  const wa = useWhatsApp();
  const [type, setType] = useState(initial.type);
  const [brand, setBrand] = useState(initial.brand);
  const [model, setModel] = useState(initial.model);
  const [sort, setSort] = useState<Sort>('new');
  const [shown, setShown] = useState(PAGE);

  const { types, brands, cars } = catalog;
  const typeObj = types.find((t) => t.slug === type);
  const brandObj = brands.find((b) => b.slug === brand);
  const modelObj = brandObj?.models.find((m) => m.slug === model);

  // Keep the address bar in sync so filtered views can be shared and bookmarked.
  useEffect(() => {
    let path = '/autot';
    if (brand) path += `/${brand}`;
    if (brand && model) path += `/${model}`;
    const url = path + (type ? `?tyyppi=${type}` : '');
    if (url !== window.location.pathname + window.location.search) window.history.replaceState(null, '', url);
    setShown(PAGE);
  }, [type, brand, model]);

  const inType = useMemo(() => cars.filter((c) => !type || c.type?.slug === type), [cars, type]);
  const inBrand = useMemo(() => inType.filter((c) => !brand || c.brand.slug === brand), [inType, brand]);
  const result = useMemo(() => {
    const list = inBrand.filter((c) => !model || c.model.slug === model);
    const by: Record<Sort, (a: typeof list[0], b: typeof list[0]) => number> = {
      new: (a, b) => b.createdAt.localeCompare(a.createdAt),
      low: (a, b) => a.price - b.price,
      high: (a, b) => b.price - a.price,
      km: (a, b) => a.mileage - b.mileage,
    };
    return [...list].sort(by[sort]);
  }, [inBrand, model, sort]);

  const typeChips = [{ slug: '', name: 'Kaikki', img: null as any, n: cars.length }].concat(
    types.map((t) => ({ slug: t.slug, name: t.name, img: t.silhouette, n: cars.filter((c) => c.type?.slug === t.slug).length })),
  );
  const brandChips = brands
    .map((b) => ({ slug: b.slug, name: b.name, n: inType.filter((c) => c.brand.slug === b.slug).length }))
    .filter((b) => b.n > 0 || b.slug === brand);
  const modelChips = brandObj
    ? brandObj.models
        .map((m) => ({ slug: m.slug, name: m.name, n: inBrand.filter((c) => c.model.slug === m.slug).length }))
        .filter((m) => m.n > 0 || m.slug === model)
    : [];

  const pickType = (slug: string) => {
    setType(slug);
    const stillHas = cars.some((c) => (!slug || c.type?.slug === slug) && c.brand.slug === brand && (!model || c.model.slug === model));
    if (!stillHas) {
      const brandHas = cars.some((c) => (!slug || c.type?.slug === slug) && c.brand.slug === brand);
      if (!brandHas) setBrand('');
      setModel('');
    }
  };

  const heading = modelObj ? `${brandObj!.name} ${modelObj.name}` : brandObj ? brandObj.name : typeObj ? typeObj.name : 'Kaikki autot';
  const summary = [typeObj ? typeObj.name.toLowerCase() : 'kaikki tyypit', brandObj?.name || 'kaikki merkit', modelObj?.name || 'kaikki mallit'].join(' → ');
  const hasFilter = !!(type || brand || model);

  return (
    <>
      <section className="ttl">
        <div className="wrap ttl-in">
          <div style={{ minWidth: 0 }}>
            <nav className="crumbs up" aria-label="Murupolku">
              <Link href="/">Etusivu</Link><span>/</span>
              {brandObj ? <a href="/autot" onClick={(e) => { e.preventDefault(); setBrand(''); setModel(''); }}>Autot</a> : <span className="here">Autot</span>}
              {brandObj ? <><span>/</span>{modelObj ? <a href={`/autot/${brandObj.slug}`} onClick={(e) => { e.preventDefault(); setModel(''); }}>{brandObj.name}</a> : <span className="here">{brandObj.name}</span>}</> : null}
              {modelObj ? <><span>/</span><span className="here">{modelObj.name}</span></> : null}
            </nav>
            <div className="ttl-head">
              {brandObj?.logo ? (
                <span className="brand-logo up" key={brandObj.slug}>
                  <Image src={brandObj.logo.url} alt={`${brandObj.name} logo`} width={brandObj.logo.width} height={brandObj.logo.height} sizes="120px" />
                </span>
              ) : null}
              <h1 className="d wipe-now" key={heading}>{heading}</h1>
            </div>
          </div>
          <div className="ttl-count up u2">
            <span className="d">{result.length}</span>
            <span className="m">{result.length === 1 ? 'auto' : 'autoa'}<br />myynnissä</span>
          </div>
        </div>
      </section>

      <section className="strip" aria-label="Rajaa autoja">
        <div className="wrap">
          <div className="spine" aria-hidden="true" />
          <div className="frow">
            <div className="rl"><span className={`sg ${type ? 'on' : ''}`}>1</span><span className="t">Tyyppi</span></div>
            <div className="lane" role="group" aria-label="Ajoneuvotyyppi">
              {typeChips.map((t) => (
                <button key={t.slug || 'all'} type="button" className="chip" aria-pressed={type === t.slug} onClick={() => pickType(t.slug)}>
                  {t.img ? <Image className="ci" src={t.img.url} alt="" width={96} height={36} /> : null}
                  {t.name}<sup>{t.n}</sup>
                </button>
              ))}
            </div>
          </div>
          <div className="frow">
            <div className="rl"><span className={`sg ${brand ? 'on' : ''}`}>2</span><span className="t">Merkki</span></div>
            <div className="lane" role="group" aria-label="Merkki">
              <button type="button" className="pchip" aria-pressed={!brand} onClick={() => { setBrand(''); setModel(''); }}>
                <i>FIN</i><b>Kaikki</b><sup>{inType.length}</sup>
              </button>
              {brandChips.map((b) => (
                <button key={b.slug} type="button" className="pchip" aria-pressed={brand === b.slug} onClick={() => { setBrand(b.slug); setModel(''); }}>
                  <i>FIN</i><b>{b.name}</b><sup>{b.n}</sup>
                </button>
              ))}
            </div>
          </div>
          <div className="frow">
            <div className="rl"><span className={`sg ${model ? 'on' : ''}`}>3</span><span className="t">Malli</span></div>
            <div className="lane" role="group" aria-label="Malli">
              {brandObj ? (
                <>
                  <button type="button" className="chip round" aria-pressed={!model} onClick={() => setModel('')}>Kaikki mallit<sup>{inBrand.length}</sup></button>
                  {modelChips.map((m) => (
                    <button key={m.slug} type="button" className="chip round" aria-pressed={model === m.slug} onClick={() => setModel(m.slug)}>
                      {m.name}<sup>{m.n}</sup>
                    </button>
                  ))}
                </>
              ) : (
                <span className="hint">↑ Valitse merkki, niin sen mallit ilmestyvät tähän</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="wrap res">
        <div className="res-bar">
          <div className="l">
            <strong aria-live="polite">{result.length} {result.length === 1 ? 'auto' : 'autoa'}</strong>
            <span className="m">{summary}</span>
            {hasFilter ? <button type="button" className="clr" onClick={() => { setType(''); setBrand(''); setModel(''); }}>✕ Tyhjennä</button> : null}
          </div>
          <label className="field sort">Järjestä
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="new">Uusimmat ensin</option>
              <option value="low">Halvimmat ensin</option>
              <option value="high">Kalleimmat ensin</option>
              <option value="km">Vähiten ajetut</option>
            </select>
          </label>
        </div>

        {result.length ? (
          <>
            <div className="grid-cars">
              {result.slice(0, shown).map((c, i) => (
                <CarCard key={c.documentId} car={c} className="card-in" priority={i < 3} />
              ))}
            </div>
            {result.length > shown ? (
              <div style={{ textAlign: 'center', marginTop: 32 }}>
                <button className="btn btn-outline" type="button" onClick={() => setShown((s) => s + PAGE)}>
                  Näytä lisää ({result.length - shown})
                </button>
              </div>
            ) : null}
            {block.disclaimer ? <p className="disclaimer">{block.disclaimer}</p> : null}
          </>
        ) : (
          <div className="empty">
            <div className="d">{block.emptyTitle || 'Ei juuri nyt myynnissä'}</div>
            {block.emptyText ? <p>{block.emptyText}</p> : null}
            <button className="btn btn-wa" type="button" onClick={() => wa.open({ topic: 'Hakutoive', carText: heading === 'Kaikki autot' ? '' : heading })}>
              Jätä hakutoive WhatsAppiin
            </button>
          </div>
        )}
      </section>
    </>
  );
}
