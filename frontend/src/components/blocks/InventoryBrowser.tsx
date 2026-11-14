'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Catalog } from '@/lib/types';
import { euro, km } from '@/lib/format';
import CarCard from '../CarCard';
import { useWhatsApp } from '../WhatsAppProvider';

type Sort = 'new' | 'low' | 'high' | 'km';
type Tab = 'basic' | 'adv';
const PAGE = 24;
const PRICE_STEP = 2500;
const KM_STEPS = [50000, 100000, 150000, 200000];

const floorTo = (n: number, step: number) => Math.floor(n / step) * step;
const ceilTo = (n: number, step: number) => Math.ceil(n / step) * step;

export default function InventoryBrowser({ block, catalog, initial }: {
  block: any;
  catalog: Catalog;
  initial: { type: string; brand: string; model: string };
}) {
  const wa = useWhatsApp();
  const [tab, setTab] = useState<Tab>('basic');
  const [type, setType] = useState(initial.type);
  const [brand, setBrand] = useState(initial.brand);
  const [model, setModel] = useState(initial.model);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState('');
  const [kmMin, setKmMin] = useState('');
  const [kmMax, setKmMax] = useState('');
  const [fuel, setFuel] = useState('');
  const [trans, setTrans] = useState('');
  const [sort, setSort] = useState<Sort>('new');
  const [shown, setShown] = useState(PAGE);
  // Phones fold the whole filter panel behind a one-line summary bar.
  const [open, setOpen] = useState(false);

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

  // Narrowing the advanced filters shortens the list, so start the paging over.
  useEffect(() => { setShown(PAGE); }, [priceMin, priceMax, yearMin, yearMax, kmMin, kmMax, fuel, trans]);

  const inType = useMemo(() => cars.filter((c) => !type || c.type?.slug === type), [cars, type]);
  const inBrand = useMemo(() => inType.filter((c) => !brand || c.brand.slug === brand), [inType, brand]);
  const inModel = useMemo(() => inBrand.filter((c) => !model || c.model.slug === model), [inBrand, model]);
  const inRange = useMemo(() => inModel.filter((c) => (
    (!priceMin || c.price >= +priceMin) && (!priceMax || c.price <= +priceMax) &&
    (!yearMin || c.year >= +yearMin) && (!yearMax || c.year <= +yearMax) &&
    (!kmMin || c.mileage >= +kmMin) && (!kmMax || c.mileage <= +kmMax)
  )), [inModel, priceMin, priceMax, yearMin, yearMax, kmMin, kmMax]);

  const result = useMemo(() => {
    const list = inRange.filter((c) => (!fuel || c.fuel === fuel) && (!trans || c.transmission === trans));
    const by: Record<Sort, (a: typeof list[0], b: typeof list[0]) => number> = {
      new: (a, b) => b.createdAt.localeCompare(a.createdAt),
      low: (a, b) => a.price - b.price,
      high: (a, b) => b.price - a.price,
      km: (a, b) => a.mileage - b.mileage,
    };
    return [...list].sort(by[sort]);
  }, [inRange, fuel, trans, sort]);

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

  // Dropdown bounds follow the stock, so the ranges never offer an empty slice.
  const priceOpts = useMemo(() => {
    if (!cars.length) return [];
    const lo = floorTo(Math.min(...cars.map((c) => c.price)), PRICE_STEP);
    const hi = ceilTo(Math.max(...cars.map((c) => c.price)), PRICE_STEP);
    const out: number[] = [];
    for (let p = lo; p <= hi; p += PRICE_STEP) out.push(p);
    return out;
  }, [cars]);
  const yearOpts = useMemo(() => {
    if (!cars.length) return [];
    const lo = Math.min(...cars.map((c) => c.year));
    const hi = Math.max(...cars.map((c) => c.year));
    return Array.from({ length: hi - lo + 1 }, (_, i) => hi - i);
  }, [cars]);
  const kmOpts = useMemo(
    () => KM_STEPS.filter((s) => cars.some((c) => c.mileage > s) && cars.some((c) => c.mileage <= s)),
    [cars],
  );

  // Each chip row counts against the other rows, never against itself.
  const fuelChips = useMemo(() => {
    const base = inRange.filter((c) => !trans || c.transmission === trans);
    return [...new Set(inModel.map((c) => c.fuel).filter(Boolean))].sort()
      .map((name) => ({ name, n: base.filter((c) => c.fuel === name).length }))
      .filter((f) => f.n > 0 || f.name === fuel);
  }, [inRange, inModel, trans, fuel]);
  const transChips = useMemo(() => {
    const base = inRange.filter((c) => !fuel || c.fuel === fuel);
    return [...new Set(inModel.map((c) => c.transmission).filter(Boolean))].sort()
      .map((name) => ({ name, n: base.filter((c) => c.transmission === name).length }))
      .filter((t) => t.n > 0 || t.name === trans);
  }, [inRange, inModel, fuel, trans]);

  const heading = modelObj ? `${brandObj!.name} ${modelObj.name}` : brandObj ? brandObj.name : typeObj ? typeObj.name : 'Kaikki autot';
  const summary = [typeObj ? typeObj.name.toLowerCase() : 'kaikki tyypit', brandObj?.name || 'kaikki merkit', modelObj?.name || 'kaikki mallit'].join(' → ');
  const advActive = [priceMin || priceMax, yearMin || yearMax, kmMin || kmMax, fuel, trans].filter(Boolean).length;
  const hasFilter = !!(type || brand || model) || advActive > 0;
  const activeCount = [type, brand, model].filter(Boolean).length + advActive;

  const pickType = (slug: string) => {
    setType(slug);
    const stillHas = cars.some((c) => (!slug || c.type?.slug === slug) && c.brand.slug === brand && (!model || c.model.slug === model));
    if (!stillHas) {
      const brandHas = cars.some((c) => (!slug || c.type?.slug === slug) && c.brand.slug === brand);
      if (!brandHas) setBrand('');
      setModel('');
    }
  };
  const clearAdv = () => {
    setPriceMin(''); setPriceMax(''); setYearMin(''); setYearMax('');
    setKmMin(''); setKmMax(''); setFuel(''); setTrans('');
  };
  const clearAll = () => { setType(''); setBrand(''); setModel(''); clearAdv(); };

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

      <section className={`strip ${tab === 'adv' ? 'adv' : ''} ${open ? 'mob-open' : ''}`} aria-label="Rajaa autoja">
        <div className="wrap">
          {/* Phone only: collapses the tabs and rows below into a single line. */}
          <button type="button" className="fbar" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <span className="fbar-t">Rajaa autoja</span>
            {activeCount ? <span className="fbar-n">{activeCount}</span> : null}
            <span className="fbar-r">{result.length} {result.length === 1 ? 'auto' : 'autoa'}</span>
            <span className="fbar-c" aria-hidden="true" />
          </button>

          <div className="ftabs" role="tablist" aria-label="Hakutapa">
            <button type="button" className="ftab" role="tab" id="tab-basic" aria-selected={tab === 'basic'} aria-controls="panel-basic" onClick={() => setTab('basic')}>
              Perushaku
            </button>
            <button type="button" className="ftab" role="tab" id="tab-adv" aria-selected={tab === 'adv'} aria-controls="panel-adv" onClick={() => setTab('adv')}>
              Tarkennettu haku{advActive ? <sup>{advActive}</sup> : null}
            </button>
          </div>

          {tab === 'basic' ? (
            <div className="fpanel" role="tabpanel" id="panel-basic" aria-labelledby="tab-basic">
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
          ) : (
            <div className="fpanel" role="tabpanel" id="panel-adv" aria-labelledby="tab-adv">
              <div className="spine" aria-hidden="true" />
              <div className="frow">
                <div className="rl"><span className={`sg ${priceMin || priceMax ? 'on' : ''}`}>1</span><span className="t">Hinta</span></div>
                <div className="lane">
                  <div className="rng">
                    <span className="cap">Alkaen</span>
                    <select aria-label="Hinta alkaen" value={priceMin} onChange={(e) => setPriceMin(e.target.value)}>
                      <option value="">Ei rajaa</option>
                      {priceOpts.map((p) => <option key={p} value={p}>{euro(p)}</option>)}
                    </select>
                    <span className="dash" aria-hidden="true">–</span>
                    <span className="cap">Enintään</span>
                    <select aria-label="Hinta enintään" value={priceMax} onChange={(e) => setPriceMax(e.target.value)}>
                      <option value="">Ei rajaa</option>
                      {priceOpts.map((p) => <option key={p} value={p}>{euro(p)}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="frow">
                <div className="rl"><span className={`sg ${yearMin || yearMax ? 'on' : ''}`}>2</span><span className="t">Vuosimalli</span></div>
                <div className="lane">
                  <div className="rng">
                    <span className="cap">Alkaen</span>
                    <select aria-label="Vuosimalli alkaen" value={yearMin} onChange={(e) => setYearMin(e.target.value)}>
                      <option value="">Ei rajaa</option>
                      {yearOpts.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <span className="dash" aria-hidden="true">–</span>
                    <span className="cap">Enintään</span>
                    <select aria-label="Vuosimalli enintään" value={yearMax} onChange={(e) => setYearMax(e.target.value)}>
                      <option value="">Ei rajaa</option>
                      {yearOpts.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="frow">
                <div className="rl"><span className={`sg ${kmMin || kmMax ? 'on' : ''}`}>3</span><span className="t">Mittarilukema</span></div>
                <div className="lane" role="group" aria-label="Mittarilukema">
                  <button type="button" className="chip round" aria-pressed={!kmMin && !kmMax} onClick={() => { setKmMin(''); setKmMax(''); }}>Kaikki<sup>{inModel.length}</sup></button>
                  {kmOpts.map((s) => (
                    <button key={s} type="button" className="chip round" aria-pressed={!kmMin && kmMax === String(s)} onClick={() => { setKmMin(''); setKmMax(String(s)); }}>
                      alle {km(s)}<sup>{inModel.filter((c) => c.mileage <= s).length}</sup>
                    </button>
                  ))}
                  {/* The boxes write the same kmMin/kmMax the chips do, so a chip
                      fills the max box and a typed step lights its chip back up. */}
                  <div className="rng rng-num">
                    <span className="cap">Oma väli</span>
                    <input
                      type="number" inputMode="numeric" min={0} step={1000} placeholder="min"
                      aria-label="Mittarilukema alkaen" value={kmMin}
                      onChange={(e) => setKmMin(e.target.value)}
                    />
                    <span className="dash" aria-hidden="true">–</span>
                    <input
                      type="number" inputMode="numeric" min={0} step={1000} placeholder="max"
                      aria-label="Mittarilukema enintään" value={kmMax}
                      onChange={(e) => setKmMax(e.target.value)}
                    />
                    <span className="cap">km</span>
                  </div>
                </div>
              </div>
              <div className="frow">
                <div className="rl"><span className={`sg ${fuel ? 'on' : ''}`}>4</span><span className="t">Käyttövoima</span></div>
                <div className="lane" role="group" aria-label="Käyttövoima">
                  <button type="button" className="chip" aria-pressed={!fuel} onClick={() => setFuel('')}>Kaikki<sup>{inRange.filter((c) => !trans || c.transmission === trans).length}</sup></button>
                  {fuelChips.map((f) => (
                    <button key={f.name} type="button" className="chip" aria-pressed={fuel === f.name} onClick={() => setFuel(f.name)}>
                      {f.name}<sup>{f.n}</sup>
                    </button>
                  ))}
                </div>
              </div>
              <div className="frow">
                <div className="rl"><span className={`sg ${trans ? 'on' : ''}`}>5</span><span className="t">Vaihteisto</span></div>
                <div className="lane" role="group" aria-label="Vaihteisto">
                  <button type="button" className="chip round" aria-pressed={!trans} onClick={() => setTrans('')}>Kaikki<sup>{inRange.filter((c) => !fuel || c.fuel === fuel).length}</sup></button>
                  {transChips.map((t) => (
                    <button key={t.name} type="button" className="chip round" aria-pressed={trans === t.name} onClick={() => setTrans(t.name)}>
                      {t.name}<sup>{t.n}</sup>
                    </button>
                  ))}
                  {advActive ? <button type="button" className="clr adv-clr" onClick={clearAdv}>✕ Tyhjennä tarkennukset</button> : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="wrap res">
        <div className="res-bar">
          <div className="l">
            <strong aria-live="polite">{result.length} {result.length === 1 ? 'auto' : 'autoa'}</strong>
            <span className="m">{summary}</span>
            {hasFilter ? <button type="button" className="clr" onClick={clearAll}>✕ Tyhjennä</button> : null}
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
