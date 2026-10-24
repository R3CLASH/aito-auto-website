'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { waLink } from '@/lib/format';
import { Arrow } from '../Icons';

type Form = { name: string; phone: string; email: string; topic: string; message: string; consent: boolean; website: string };
const EMPTY = (topic: string): Form => ({ name: '', phone: '', email: '', topic, message: '', consent: false, website: '' });

export default function ContactForm({ title, intro, consent, successTitle, successText, topics, whatsappNumber }: {
  title: string; intro: string; consent: string; successTitle: string; successText: string; topics: string[]; whatsappNumber: string;
}) {
  const pathname = usePathname();
  const topicList = ['Yleinen kysymys', ...topics.filter((t) => t !== 'Yleinen kysymys')];
  const [f, setF] = useState<Form>(EMPTY(topicList[0]));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [serverError, setServerError] = useState('');

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Kirjoita nimesi';
    if (f.phone.replace(/\D/g, '').length < 6) e.phone = 'Tarkista puhelinnumero';
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Tarkista sähköposti';
    if (!f.message.trim()) e.message = 'Kirjoita viesti';
    if (consent && !f.consent) e.consent = 'Hyväksy tietojen käsittely';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('sending');
    setServerError('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ channel: 'form', name: f.name, phone: f.phone, email: f.email, topic: f.topic, message: f.message, sourcePage: pathname, website: f.website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Lähetys epäonnistui');
      setStatus('done');
    } catch (err) {
      setServerError((err as Error).message);
      setStatus('error');
    }
  };

  const waLines = ['Uusi yhteydenotto – verkkosivut', '', `Nimi: ${f.name || '-'}`, `Puhelin: ${f.phone || '-'}`];
  if (f.email) waLines.push(`Sähköposti: ${f.email}`);
  waLines.push(`Aihe: ${f.topic}`, '', 'Viesti:', f.message || '-');
  const waText = waLines.join('\n');

  return (
    <div className="ct-form rv">
      {status === 'done' ? (
        <div className="ct-done pop" role="status">
          <div className="d">{successTitle}</div>
          <p>{successText}</p>
          <button className="btn btn-outline" type="button" onClick={() => { setF(EMPTY(topicList[0])); setStatus('idle'); }}>Lähetä uusi viesti</button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <h2 className="d">{title}</h2>
          {intro ? <p>{intro}</p> : null}
          <div className="form-grid">
            <label className={`field ${errors.name ? 'invalid' : ''}`}>Nimi *
              <input type="text" autoComplete="name" value={f.name} onChange={set('name')} />
              {errors.name ? <span className="err">{errors.name}</span> : null}
            </label>
            <label className={`field ${errors.phone ? 'invalid' : ''}`}>Puhelin *
              <input type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} />
              {errors.phone ? <span className="err">{errors.phone}</span> : null}
            </label>
            <label className={`field ${errors.email ? 'invalid' : ''}`}>Sähköposti
              <input type="email" autoComplete="email" value={f.email} onChange={set('email')} />
              {errors.email ? <span className="err">{errors.email}</span> : null}
            </label>
            <label className="field">Aihe
              <select value={f.topic} onChange={set('topic')}>{topicList.map((t) => <option key={t}>{t}</option>)}</select>
            </label>
            <label className={`field full ${errors.message ? 'invalid' : ''}`}>Viesti *
              <textarea rows={6} value={f.message} onChange={set('message')} />
              {errors.message ? <span className="err">{errors.message}</span> : null}
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
            {status === 'error' ? <p className="form-error full" role="alert">{serverError || 'Lähetys epäonnistui.'} Voit myös lähettää viestin WhatsAppissa.</p> : null}
            <div className="actions full">
              <button className="btn btn-navy cut btn-lg" type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Lähetetään…' : <>Lähetä viesti <Arrow /></>}
              </button>
              <a className="btn btn-outline-wa btn-lg" href={waLink(whatsappNumber, waText)} target="_blank" rel="noopener noreferrer">tai lähetä WhatsAppiin</a>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
