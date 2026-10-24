'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { Catalog } from '@/lib/types';
import { Arrow } from '../Icons';

type Lite = { types: Catalog['types']; brands: Catalog['brands']; cars: { brand: string; model: string; type: string }[] };

export default function QuickSearch({ block, data }: { block: any; data: Lite }) {
  const router = useRouter();
  const [type, setType] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');

  const inType = useMemo(() => data.cars.filter((c) => !type || c.type === type), [data.cars, type]);
  const brands = data.brands.filter((b) => inType.some((c) => c.brand === b.slug));
  const models = (data.brands.find((b) => b.slug === brand)?.models || []).filter((m) =>
    inType.some((c) => c.brand === brand && c.model === m.slug));

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    let url = '/autot';
    if (brand) url += `/${brand}`;
    if (brand && model) url += `/${model}`;
    if (type) url += `?tyyppi=${type}`;
    router.push(url);
  };

  return (
    <section className="wrap qs">
      <form className="qs-box rv" onSubmit={go}>
        <div className="qs-head">
          <h2 className="d">{block.title}</h2>
          {block.hint ? <span>{block.hint}</span> : null}
        </div>
        <div className="qs-grid">
          <label className="field"><span><span className="num">01</span> Ajoneuvotyyppi</span>
            <select value={type} onChange={(e) => { setType(e.target.value); setBrand(''); setModel(''); }}>
              <option value="">Kaikki tyypit</option>
              {data.types.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
            </select>
          </label>
          <label className="field"><span><span className="num">02</span> Merkki</span>
            <select value={brand} onChange={(e) => { setBrand(e.target.value); setModel(''); }}>
              <option value="">Kaikki merkit</option>
              {brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
            </select>
          </label>
          <label className="field"><span><span className="num">03</span> Malli</span>
            <select value={model} onChange={(e) => setModel(e.target.value)} disabled={!brand}>
              <option value="">{brand ? 'Kaikki mallit' : 'Valitse ensin merkki'}</option>
              {models.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
            </select>
          </label>
          <button className="btn btn-navy" type="submit">{block.buttonLabel || 'Näytä autot'} <Arrow /></button>
        </div>
      </form>
    </section>
  );
}
