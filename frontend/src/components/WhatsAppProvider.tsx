'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { waLink } from '@/lib/format';
import { Arrow, Close, WhatsApp } from './Icons';

export type WaCar = {
  documentId: string;
  title: string;
  meta: string; // "2021 · 58 000 km · 27 900 €"
  image?: string | null;
  url?: string;
};

export type WaOptions = {
  topic?: string;
  car?: WaCar;
  carText?: string;
  tradeIn?: string;
  calculation?: Record<string, unknown>;
  calcText?: string;
  title?: string;
};

type Ctx = { open: (o?: WaOptions) => void };
const WaContext = createContext<Ctx>({ open: () => {} });
export const useWhatsApp = () => useContext(WaContext);

type Form = { name: string; phone: string; email: string; topic: string; carText: string; tradeIn: string; message: string; website: string };

export default function WhatsAppProvider({ number, topics, siteUrl, children }: {
  number: string;
  topics: string[];
  siteUrl: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [opts, setOpts] = useState<WaOptions | null>(null);
  const [form, setForm] = useState<Form>({ name: '', phone: '', email: '', topic: topics[0] || 'Kiinnostunut autosta', carText: '', tradeIn: '', message: '', website: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [sent, setSent] = useState(false);
  const firstInput = useRef<HTMLInputElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const open = useCallback((o: WaOptions = {}) => {
    lastFocus.current = document.activeElement as HTMLElement;
    setOpts(o);
    setSent(false);
    setErrors({});
    setForm((f) => ({
      ...f,
      topic: o.topic || f.topic || topics[0] || 'Kiinnostunut autosta',
      carText: o.carText ?? (o.car ? '' : f.carText),
      tradeIn: o.tradeIn ?? f.tradeIn,
    }));
  }, [topics]);

  const close = useCallback(() => {
    setOpts(null);
    lastFocus.current?.focus?.();
  }, []);

  useEffect(() => {
    if (!opts) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(() => firstInput.current?.focus(), 50);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [opts, close]);

  const topicList = useMemo(() => {
    const t = [...topics];
    if (opts?.topic && !t.includes(opts.topic)) t.unshift(opts.topic);
    return t.length ? t : ['Kiinnostunut autosta', 'Muu asia'];
  }, [topics, opts?.topic]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const message = useMemo(() => {
    const L: string[] = ['Uusi yhteydenotto – verkkosivut', ''];
    L.push(`Nimi: ${form.name || '-'}`, `Puhelin: ${form.phone || '-'}`);
    if (form.email) L.push(`Sähköposti: ${form.email}`);
    L.push(`Aihe: ${form.topic}`);
    if (opts?.car) {
      L.push('', `Auto: ${opts.car.title}`, opts.car.meta);
      if (opts.car.url) L.push(`${siteUrl}${opts.car.url}`);
    } else if (form.carText) {
      L.push(`Auto / toive: ${form.carText}`);
    }
    if (opts?.calcText) L.push('', `Laskelma: ${opts.calcText}`);
    if (form.tradeIn) L.push(`Vaihtoauto: ${form.tradeIn}`);
    L.push('', 'Viesti:', form.message || '-', '', `Sivu: ${pathname}`);
    return L.join('\n');
  }, [form, opts, pathname, siteUrl]);

  const href = waLink(number, message);

  const onSend = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = 'Kirjoita nimesi';
    if (form.phone.replace(/\D/g, '').length < 6) errs.phone = 'Tarkista puhelinnumero';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Tarkista sähköposti';
    setErrors(errs);
    if (Object.keys(errs).length) { e.preventDefault(); return; }

    // Save the lead in Strapi in the background; WhatsApp opens through the link itself.
    fetch('/api/leads', {
      method: 'POST',
      keepalive: true,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        channel: 'whatsapp',
        name: form.name, phone: form.phone, email: form.email, topic: form.topic,
        message: form.message, tradeIn: form.tradeIn,
        carTitle: opts?.car?.title || form.carText,
        carDocumentId: opts?.car?.documentId,
        calculation: opts?.calculation,
        sourcePage: pathname,
        website: form.website,
      }),
    }).catch(() => {});
    setSent(true);
  };

  return (
    <WaContext.Provider value={{ open }}>
      {children}

      <button className="btn wa-fab" type="button" aria-label="Kysy WhatsAppissa" onClick={() => open()}>
        <span className="wa-dot"><WhatsApp /></span>
        <span className="lbl">Kysy WhatsAppissa</span>
      </button>

      {opts ? (
        <div className="modal-bg fade" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className="modal pop" role="dialog" aria-modal="true" aria-labelledby="wa-title">
            <div className="modal-head">
              <div>
                <div>
                  <div className="m">WHATSAPP</div>
                  <h2 id="wa-title" className="d">{opts.title || (opts.car ? 'Kysy tästä autosta' : 'Lähetä meille viesti')}</h2>
                  <p>{opts.car ? 'Auton tiedot tulevat viestiin automaattisesti.' : 'Täytä tiedot – vastaamme aukioloaikoina.'}</p>
                </div>
                <button type="button" className="x-btn" aria-label="Sulje" onClick={close}><Close /></button>
              </div>
            </div>

            {opts.car ? (
              <div className="modal-car">
                {opts.car.image ? <img src={opts.car.image} alt="" /> : null}
                <div style={{ fontSize: 14, lineHeight: 1.45 }}>
                  <strong>{opts.car.title}</strong><br />
                  <span className="m">{opts.car.meta}{opts.calcText ? ` · ${opts.calcText}` : ''}</span>
                </div>
              </div>
            ) : null}

            {sent ? (
              <div className="modal-body" style={{ textAlign: 'center', padding: '40px 22px' }}>
                <div className="d" style={{ fontSize: 64, color: 'var(--azure)' }}>Kiitos!</div>
                <p style={{ margin: '12px auto 22px', maxWidth: 380, color: 'var(--body)', lineHeight: 1.55 }}>
                  WhatsApp avautui uuteen ikkunaan valmiin viestin kanssa. Paina siellä vielä lähetä, niin vastaamme pian.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a className="btn btn-wa" href={href} target="_blank" rel="noopener noreferrer">Avaa WhatsApp uudelleen</a>
                  <button className="btn btn-outline" type="button" onClick={close}>Sulje</button>
                </div>
              </div>
            ) : (
              <div className="modal-body form-grid">
                <label className={`field ${errors.name ? 'invalid' : ''}`}>Nimi *
                  <input ref={firstInput} type="text" autoComplete="name" value={form.name} onChange={set('name')} />
                  {errors.name ? <span className="err">{errors.name}</span> : null}
                </label>
                <label className={`field ${errors.phone ? 'invalid' : ''}`}>Puhelin *
                  <input type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />
                  {errors.phone ? <span className="err">{errors.phone}</span> : null}
                </label>
                <label className={`field ${errors.email ? 'invalid' : ''}`}>Sähköposti
                  <input type="email" autoComplete="email" value={form.email} onChange={set('email')} />
                  {errors.email ? <span className="err">{errors.email}</span> : null}
                </label>
                <label className="field">Aihe
                  <select value={form.topic} onChange={set('topic')}>
                    {topicList.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </label>
                {!opts.car ? (
                  <label className="field full">Auto / hakutoive (valinnainen)
                    <input type="text" placeholder="esim. Honda Accord 2021" value={form.carText} onChange={set('carText')} />
                  </label>
                ) : null}
                {opts.car || opts.tradeIn !== undefined ? (
                  <label className="field full">Vaihtoauto (valinnainen)
                    <input type="text" placeholder="merkki, malli, vuosi, km" value={form.tradeIn} onChange={set('tradeIn')} />
                  </label>
                ) : null}
                <label className="field full">Viesti
                  <textarea rows={4} value={form.message} onChange={set('message')} />
                </label>
                <label className="hp" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} /></label>
                <a className="btn btn-wa btn-lg full" href={href} target="_blank" rel="noopener noreferrer" onClick={onSend}>
                  Avaa WhatsApp ja lähetä <Arrow />
                </a>
                <p className="fine full">
                  Viesti avautuu WhatsAppiin valmiiksi täytettynä – kaikki tiedot tulevat meille yhdellä kertaa. Käsittelemme tietoja <a href="/tietosuojaseloste">tietosuojaselosteen</a> mukaisesti.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </WaContext.Provider>
  );
}
