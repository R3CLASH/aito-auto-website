'use client';

import { useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useWhatsApp } from '../WhatsAppProvider';
import { Arrow, ArrowLeft } from '../Icons';

type Form = {
  plate: string; mileage: string; car: string; year: string; price: string; notes: string;
  name: string; phone: string; email: string; consent: boolean; website: string;
};
const EMPTY: Form = { plate: '', mileage: '', car: '', year: '', price: '', notes: '', name: '', phone: '', email: '', consent: false, website: '' };
const digits = (v: string) => v.replace(/\D/g, '');

export default function SellCarForm({ title, consent, successTitle, successText }: {
  title: string; consent: string; successTitle: string; successText: string;
}) {
  const pathname = usePathname();
  const wa = useWhatsApp();
  const [f, setF] = useState<Form>(EMPTY);
  const [step, setStep] = useState<1 | 2>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [serverError, setServerError] = useState('');
  const headRef = useRef<HTMLHeadingElement>(null);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const plate = f.plate.trim().toUpperCase();
  const km = digits(f.mileage) ? `${Number(digits(f.mileage)).toLocaleString('fi-FI')} km` : '';
  const tradeIn = [plate, km].filter(Boolean).join(', ');
  const carTitle = [f.car.trim(), f.year.trim()].filter(Boolean).join(' ');

  const goTo = (s: 1 | 2) => {
    setStep(s);
    requestAnimationFrame(() => headRef.current?.focus());
  };

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (plate.replace(/[^A-Z0-9]/g, '').length < 2) er.plate = 'Kirjoita rekisterinumero';
    if (!digits(f.mileage)) er.mileage = 'Kerro kilometrit';
    setErrors(er);
    if (!Object.keys(er).length) goTo(2);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!f.name.trim()) er.name = 'Kirjoita nimesi';
    if (digits(f.phone).length < 6) er.phone = 'Tarkista puhelinnumero';
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) er.email = 'Tarkista sähköposti';
    if (consent && !f.consent) er.consent = 'Hyväksy tietojen käsittely';
    setErrors(er);
    if (Object.keys(er).length) return;

    const message = [
      carTitle ? `Auto: ${carTitle}` : '',
      digits(f.price) ? `Toivehinta: ${Number(digits(f.price)).toLocaleString('fi-FI')} €` : '',
      f.notes.trim() ? `Kunto ja lisätiedot: ${f.notes.trim()}` : '',
    ].filter(Boolean).join('\n');

    setStatus('sending');
    setServerError('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          channel: 'form', topic: 'Myy auto', name: f.name, phone: f.phone, email: f.email,
          tradeIn, carTitle, message, sourcePage: pathname, website: f.website,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Lähetys epäonnistui');
      setStatus('done');
    } catch (err) {
      setServerError((err as Error).message);
      setStatus('error');
    }
  };

  const openWa = () => wa.open({ topic: 'Myy auto', tradeIn: [tradeIn, carTitle].filter(Boolean).join(', '), title: 'Myy autosi meille' });

  if (status === 'done') {
    return (
      <div className="sell-card pop" role="status">
        <div className="sell-done">
          {plate ? <div className="sell-plate" aria-hidden="true"><span>FIN</span><b>{plate}</b></div> : null}
          <h2 className="d">{successTitle}</h2>
          {successText ? <p>{successText}</p> : null}
          <div className="actions">
            <button className="btn btn-wa" type="button" onClick={openWa}>Lähetä kuvat WhatsAppissa</button>
            <button className="btn btn-outline" type="button" onClick={() => { setF(EMPTY); setStep(1); setStatus('idle'); }}>Myy toinen auto</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sell-card up u3">
      <div className="sell-steps" aria-hidden="true">
        <span data-on={step === 1 || undefined}><b>1</b> Auto</span>
        <i />
        <span data-on={step === 2 || undefined}><b>2</b> Yhteystiedot</span>
      </div>

      {/* Keyed so a step change swaps the whole form instead of rewriting labels
          in place, which a browser translator's copies of the text would hide. */}
      {step === 1 ? (
        <form key="car" onSubmit={next} noValidate>
          <h2 className="d" ref={headRef} tabIndex={-1}>{title}</h2>
          <p className="sell-lead">Vaihe 1/2 – kerro autosta. Pakolliset kentät on merkitty tähdellä.</p>
          <div className="form-grid">
            <label className={`field full ${errors.plate ? 'invalid' : ''}`}>Rekisterinumero *
              <span className="plate-in">
                <span>FIN</span>
                <input type="text" maxLength={8} placeholder="ABC-123" value={f.plate} onChange={set('plate')} autoComplete="off" autoCapitalize="characters" aria-invalid={!!errors.plate} />
              </span>
              {errors.plate ? <span className="err">{errors.plate}</span> : null}
            </label>
            <label className={`field ${errors.mileage ? 'invalid' : ''}`}>Mittarilukema (km) *
              <input type="text" inputMode="numeric" placeholder="esim. 120 000" value={f.mileage} onChange={set('mileage')} aria-invalid={!!errors.mileage} />
              {errors.mileage ? <span className="err">{errors.mileage}</span> : null}
            </label>
            <label className="field">Toivehinta (€)
              <input type="text" inputMode="numeric" placeholder="valinnainen" value={f.price} onChange={set('price')} />
            </label>
            <label className="field">Merkki ja malli
              <input type="text" placeholder="esim. Toyota Corolla" value={f.car} onChange={set('car')} />
            </label>
            <label className="field">Vuosimalli
              <input type="text" inputMode="numeric" maxLength={4} placeholder="esim. 2018" value={f.year} onChange={set('year')} />
            </label>
            <label className="field full">Kunto ja lisätiedot
              <textarea rows={4} placeholder="Huoltohistoria, renkaat, viat, jäljellä oleva laina…" value={f.notes} onChange={set('notes')} />
            </label>
            <div className="actions full">
              <button className="btn btn-navy cut btn-lg" type="submit">Jatka yhteystietoihin <Arrow /></button>
            </div>
          </div>
        </form>
      ) : (
        <form key="contact" onSubmit={submit} noValidate>
          <h2 className="d" ref={headRef} tabIndex={-1}>Minne tarjous lähetetään?</h2>
          <p className="sell-lead">Vaihe 2/2 – <strong>{[tradeIn, carTitle].filter(Boolean).join(' · ')}</strong>{' '}
            <button className="link-btn" type="button" onClick={() => goTo(1)}>Muokkaa</button>
          </p>
          <div className="form-grid">
            <label className={`field ${errors.name ? 'invalid' : ''}`}>Nimi *
              <input type="text" autoComplete="name" value={f.name} onChange={set('name')} aria-invalid={!!errors.name} />
              {errors.name ? <span className="err">{errors.name}</span> : null}
            </label>
            <label className={`field ${errors.phone ? 'invalid' : ''}`}>Puhelin *
              <input type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} aria-invalid={!!errors.phone} />
              {errors.phone ? <span className="err">{errors.phone}</span> : null}
            </label>
            <label className={`field full ${errors.email ? 'invalid' : ''}`}>Sähköposti
              <input type="email" autoComplete="email" value={f.email} onChange={set('email')} aria-invalid={!!errors.email} />
              {errors.email ? <span className="err">{errors.email}</span> : null}
            </label>
            <label className="hp" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} /></label>
            {consent ? (
              <div className="full">
                <label className="check">
                  <input type="checkbox" checked={f.consent} onChange={set('consent')} />
                  <span>{consent}</span>
                </label>
                {errors.consent ? <span className="form-error" style={{ fontSize: 12 }}>{errors.consent}</span> : null}
              </div>
            ) : null}
            {status === 'error' ? <p className="form-error full" role="alert">{serverError || 'Lähetys epäonnistui.'} Voit myös lähettää tiedot WhatsAppissa.</p> : null}
            <div className="actions full">
              <button className="btn btn-outline btn-lg" type="button" onClick={() => goTo(1)}><ArrowLeft /> Takaisin</button>
              <button className="btn btn-navy cut btn-lg" type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? <span key="s">Lähetetään…</span> : <span key="i">Pyydä tarjous <Arrow /></span>}
              </button>
            </div>
            <button className="link-btn full sell-wa" type="button" onClick={openWa}>tai lähetä tiedot WhatsAppissa</button>
          </div>
        </form>
      )}
    </div>
  );
}
