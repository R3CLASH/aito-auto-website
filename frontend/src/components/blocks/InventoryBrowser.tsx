'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Catalog } from '@/lib/types';
import { euro, km } from '@/lib/format';
import CarCard from '../CarCard';
import { useWhatsApp } from '../WhatsAppProvider';

type Sort = 'new' | 'low' | 'high' | 'km';
type Tab = 'basic' | 'adv';
/** Which dropdown is open, or '' for none. */
type Key = '' | 'type' | 'brand' | 'model' | 'price' | 'inst' | 'year' | 'km' | 'fuel' | 'trans';

const PAGE = 24;
const KM_STEPS = [50000, 100000, 150000, 200000];
// A fixed span, not one derived from the stock: a buyer looking for a 1998 car
// should be able to pick that year and be told there are none, rather than find
// the option missing. Newest first, so the common choices sit at the top.
const YEAR_MAX = 2023;
const YEAR_MIN = 1980;
const YEAR_OPTS = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MAX - i);

const BASIC_KEYS: Key[] = ['type', 'brand', 'model'];
const ADV_KEYS: Key[] = ['price', 'inst', 'year', 'km', 'fuel', 'trans'];
const LABEL: Record<string, string> = {
  type: 'Tyyppi', brand: 'Merkki', model: 'Malli', price: 'Hinta', inst: 'Kuukausierä',
  year: 'Vuosimalli', km: 'Mittarilukema', fuel: 'Käyttövoima', trans: 'Vaihteisto',
};

/** "Kaikki" / "yli 10 000 €" / "alle 25 000 €" / "10 000–25 000 €" */
function span(lo: string, hi: string, fmt: (n: number) => string) {
  if (!lo && !hi) return 'Kaikki';
  if (lo && hi) return `${fmt(+lo)}–${fmt(+hi)}`;
  return lo ? `yli ${fmt(+lo)}` : `alle ${fmt(+hi)}`;
}

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
  const [instMin, setInstMin] = useState('');
  const [instMax, setInstMax] = useState('');
  const [fuel, setFuel] = useState('');
  const [trans, setTrans] = useState('');
  const [sort, setSort] = useState<Sort>('new');
  const [shown, setShown] = useState(PAGE);
  const [openKey, setOpenKey] = useState<Key>('');

  const dockRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const trigRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const [popX, setPopX] = useState(0);

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
  useEffect(() => { setShown(PAGE); },
    [priceMin, priceMax, yearMin, yearMax, kmMin, kmMax, instMin, instMax, fuel, trans]);

  const inType = useMemo(() => cars.filter((c) => !type || c.type?.slug === type), [cars, type]);
  const inBrand = useMemo(() => inType.filter((c) => !brand || c.brand.slug === brand), [inType, brand]);
  const inModel = useMemo(() => inBrand.filter((c) => !model || c.model.slug === model), [inBrand, model]);
  const inRange = useMemo(() => inModel.filter((c) => (
    (!priceMin || c.price >= +priceMin) && (!priceMax || c.price <= +priceMax) &&
    (!yearMin || c.year >= +yearMin) && (!yearMax || c.year <= +yearMax) &&
    (!kmMin || c.mileage >= +kmMin) && (!kmMax || c.mileage <= +kmMax) &&
    (!instMin || c.monthly >= +instMin) && (!instMax || c.monthly <= +instMax)
  )), [inModel, priceMin, priceMax, yearMin, yearMax, kmMin, kmMax, instMin, instMax]);

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

  // The km presets still follow the stock, so no preset ever returns nothing.
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
  const advActive = [priceMin || priceMax, yearMin || yearMax, kmMin || kmMax,
    instMin || instMax, fuel, trans].filter(Boolean).length;
  const hasFilter = !!(type || brand || model) || advActive > 0;

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
    setKmMin(''); setKmMax(''); setInstMin(''); setInstMax(''); setFuel(''); setTrans('');
  };
  const clearAll = () => { setType(''); setBrand(''); setModel(''); clearAdv(); };
  const clearOne = (k: Key) => {
    if (k === 'type') pickType('');
    if (k === 'brand') { setBrand(''); setModel(''); }
    if (k === 'model') setModel('');
    if (k === 'price') { setPriceMin(''); setPriceMax(''); }
    if (k === 'inst') { setInstMin(''); setInstMax(''); }
    if (k === 'year') { setYearMin(''); setYearMax(''); }
    if (k === 'km') { setKmMin(''); setKmMax(''); }
    if (k === 'fuel') setFuel('');
    if (k === 'trans') setTrans('');
  };

  /* ------------------------------------------------------- dropdown plumbing */

  const close = useCallback((refocus?: boolean) => {
    setOpenKey((k) => {
      if (refocus && k) trigRef.current[k]?.focus();
      return '';
    });
  }, []);

  // The popover is a sibling of the rail, not a child: the rail scrolls
  // sideways on narrow screens and would otherwise clip it. That buys us
  // freedom from overflow at the cost of placing it by hand.
  useLayoutEffect(() => {
    if (!openKey) return;
    const place = () => {
      const dock = dockRef.current, trig = trigRef.current[openKey], pop = popRef.current;
      if (!dock || !trig || !pop) return;
      const d = dock.getBoundingClientRect();
      const t = trig.getBoundingClientRect();
      setPopX(Math.round(Math.max(0, Math.min(t.left - d.left, d.width - pop.offsetWidth))));
    };
    place();
    const rail = railRef.current;
    window.addEventListener('resize', place);
    rail?.addEventListener('scroll', place, { passive: true });
    return () => {
      window.removeEventListener('resize', place);
      rail?.removeEventListener('scroll', place);
    };
  }, [openKey]);

  useEffect(() => {
    if (!openKey) return;
    const onDown = (e: PointerEvent) => {
      if (!dockRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(true); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openKey, close]);

  const value: Record<string, string> = {
    type: typeObj?.name || 'Kaikki',
    brand: brandObj?.name || 'Kaikki',
    model: modelObj?.name || (brandObj ? 'Kaikki mallit' : 'Valitse merkki'),
    price: span(priceMin, priceMax, euro),
    inst: span(instMin, instMax, (n) => `${n} €/kk`),
    year: span(yearMin, yearMax, String),
    km: span(kmMin, kmMax, km),
    fuel: fuel || 'Kaikki',
    trans: trans || 'Kaikki',
  };
  const isOn: Record<string, boolean> = {
    type: !!type, brand: !!brand, model: !!model,
    price: !!(priceMin || priceMax), inst: !!(instMin || instMax),
    year: !!(yearMin || yearMax), km: !!(kmMin || kmMax), fuel: !!fuel, trans: !!trans,
  };

  const trigger = (k: Key) => (
    <button
      key={k}
      type="button"
      ref={(el) => { trigRef.current[k] = el; }}
      className="fdrop"
      data-on={isOn[k] || undefined}
      data-open={openKey === k || undefined}
      aria-expanded={openKey === k}
      aria-controls="fpop"
      aria-haspopup="true"
      onClick={() => setOpenKey((cur) => (cur === k ? '' : k))}
    >
      <span className="fd-l">{LABEL[k]}</span>
      <span className="fd-v">{value[k]}</span>
      <svg className="fd-c" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d="M3.5 6 8 10.5 12.5 6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
      </svg>
    </button>
  );

  const numRange = (
    lo: string, setLo: (v: string) => void, hi: string, setHi: (v: string) => void,
    label: string, unit: string, step: number,
  ) => (
    <div className="fp-range">
      <label className="fp-f">
        <span>Alkaen</span>
        <input type="number" inputMode="numeric" min={0} step={step} placeholder="min"
          aria-label={`${label} alkaen`} value={lo} onChange={(e) => setLo(e.target.value)} />
      </label>
      <span className="fp-dash" aria-hidden="true" />
      <label className="fp-f">
        <span>Enintään</span>
        <input type="number" inputMode="numeric" min={0} step={step} placeholder="max"
          aria-label={`${label} enintään`} value={hi} onChange={(e) => setHi(e.target.value)} />
      </label>
      <span className="fp-u">{unit}</span>
    </div>
  );

  const popBody = () => {
    switch (openKey) {
      case 'type':
        return (
          <div className="fp-wrap">
            {typeChips.map((t) => (
              <button key={t.slug || 'all'} type="button" className="chip" aria-pressed={type === t.slug} onClick={() => pickType(t.slug)}>
                {t.img ? <Image className="ci" src={t.img.url} alt="" width={96} height={36} /> : null}
                {t.name}<sup>{t.n}</sup>
              </button>
            ))}
          </div>
        );
      case 'brand':
        return (
          <div className="fp-wrap">
            <button type="button" className="pchip" aria-pressed={!brand} onClick={() => { setBrand(''); setModel(''); }}>
              <i>FIN</i><b>Kaikki</b><sup>{inType.length}</sup>
            </button>
            {brandChips.map((b) => (
              <button key={b.slug} type="button" className="pchip" aria-pressed={brand === b.slug} onClick={() => { setBrand(b.slug); setModel(''); }}>
                <i>FIN</i><b>{b.name}</b><sup>{b.n}</sup>
              </button>
            ))}
          </div>
        );
      case 'model':
        return brandObj ? (
          <div className="fp-wrap">
            <button type="button" className="chip round" aria-pressed={!model} onClick={() => setModel('')}>Kaikki mallit<sup>{inBrand.length}</sup></button>
            {modelChips.map((m) => (
              <button key={m.slug} type="button" className="chip round" aria-pressed={model === m.slug} onClick={() => setModel(m.slug)}>
                {m.name}<sup>{m.n}</sup>
              </button>
            ))}
          </div>
        ) : (
          <p className="fp-hint">Valitse ensin merkki, niin sen mallit ilmestyvät tähän.</p>
        );
      case 'price':
        return numRange(priceMin, setPriceMin, priceMax, setPriceMax, 'Hinta', '€', 500);
      case 'inst':
        return numRange(instMin, setInstMin, instMax, setInstMax, 'Kuukausierä', '€/kk', 10);
      case 'year':
        return (
          <div className="fp-range">
            <label className="fp-f">
              <span>Alkaen</span>
              <select aria-label="Vuosimalli alkaen" value={yearMin} onChange={(e) => setYearMin(e.target.value)}>
                <option value="">Ei rajaa</option>
                {YEAR_OPTS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
            <span className="fp-dash" aria-hidden="true" />
            <label className="fp-f">
              <span>Enintään</span>
              <select aria-label="Vuosimalli enintään" value={yearMax} onChange={(e) => setYearMax(e.target.value)}>
                <option value="">Ei rajaa</option>
                {YEAR_OPTS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
          </div>
        );
      case 'km':
        return (
          <>
            <div className="fp-wrap">
              <button type="button" className="chip round" aria-pressed={!kmMin && !kmMax} onClick={() => { setKmMin(''); setKmMax(''); }}>Kaikki<sup>{inModel.length}</sup></button>
              {kmOpts.map((s) => (
                <button key={s} type="button" className="chip round" aria-pressed={!kmMin && kmMax === String(s)} onClick={() => { setKmMin(''); setKmMax(String(s)); }}>
                  alle {km(s)}<sup>{inModel.filter((c) => c.mileage <= s).length}</sup>
                </button>
              ))}
            </div>
            {/* The boxes write the same kmMin/kmMax the presets do, so a preset
                fills the max box and a typed step lights its chip back up. */}
            {numRange(kmMin, setKmMin, kmMax, setKmMax, 'Mittarilukema', 'km', 1000)}
          </>
        );
      case 'fuel':
        return (
          <div className="fp-wrap">
            <button type="button" className="chip" aria-pressed={!fuel} onClick={() => setFuel('')}>Kaikki<sup>{inRange.filter((c) => !trans || c.transmission === trans).length}</sup></button>
            {fuelChips.map((f) => (
              <button key={f.name} type="button" className="chip" aria-pressed={fuel === f.name} onClick={() => setFuel(f.name)}>
                {f.name}<sup>{f.n}</sup>
              </button>
            ))}
          </div>
        );
      case 'trans':
        return (
          <div className="fp-wrap">
            <button type="button" className="chip round" aria-pressed={!trans} onClick={() => setTrans('')}>Kaikki<sup>{inRange.filter((c) => !fuel || c.fuel === fuel).length}</sup></button>
            {transChips.map((t) => (
              <button key={t.name} type="button" className="chip round" aria-pressed={trans === t.name} onClick={() => setTrans(t.name)}>
                {t.name}<sup>{t.n}</sup>
              </button>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const keys = tab === 'basic' ? BASIC_KEYS : ADV_KEYS;

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
          <div className="ftabs" role="tablist" aria-label="Hakutapa">
            <button type="button" className="ftab" role="tab" id="tab-basic" aria-selected={tab === 'basic'} aria-controls="panel-basic"
              onClick={() => { setTab('basic'); close(); }}>
              Perushaku
            </button>
            <button type="button" className="ftab" role="tab" id="tab-adv" aria-selected={tab === 'adv'} aria-controls="panel-adv"
              onClick={() => { setTab('adv'); close(); }}>
              Tarkennettu haku{advActive ? <sup>{advActive}</sup> : null}
            </button>
          </div>

          <div
            className="fdock"
            ref={dockRef}
            role="tabpanel"
            id={tab === 'basic' ? 'panel-basic' : 'panel-adv'}
            aria-labelledby={tab === 'basic' ? 'tab-basic' : 'tab-adv'}
          >
            <div className="frail" ref={railRef}>
              {keys.map(trigger)}
              {hasFilter ? (
                <button type="button" className="clr fclr" onClick={() => { clearAll(); close(); }}>✕ Tyhjennä kaikki</button>
              ) : null}
            </div>

            {openKey ? (
              <div className="fpop" id="fpop" ref={popRef} style={{ left: popX }} role="group" aria-label={LABEL[openKey]}>
                <div className="fpop-h">
                  <span className="fpop-t">{LABEL[openKey]}</span>
                  <strong className="fpop-n" aria-live="polite">{result.length} {result.length === 1 ? 'auto' : 'autoa'}</strong>
                  {isOn[openKey] ? (
                    <button type="button" className="fpop-r" onClick={() => clearOne(openKey)}>Tyhjennä</button>
                  ) : null}
                  <button type="button" className="fpop-x" onClick={() => close(true)} aria-label="Sulje">
                    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                      <path d="m4 4 8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
                    </svg>
                  </button>
                </div>
                {popBody()}
              </div>
            ) : null}
          </div>
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
