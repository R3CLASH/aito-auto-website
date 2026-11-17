'use client';

import { useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Arrow } from '../Icons';

const MAX_PHOTOS = 3;
const MAX_BYTES = 7 * 1024 * 1024;

const RESOLUTIONS = [
  ['korjaus', 'Korjaus'],
  ['hinnanalennus', 'Hinnanalennus'],
  ['kaupan-purku', 'Kaupan purku'],
  ['ei-tiedossa', 'En osaa sanoa'],
] as const;

type Form = {
  name: string; phone: string; email: string;
  plate: string; purchaseDate: string; salesperson: string; mileageAtPurchase: string; mileageNow: string;
  faultStarted: string; description: string; repairsDone: string; resolution: string;
  consent: boolean; website: string;
};
const EMPTY: Form = {
  name: '', phone: '', email: '', plate: '', purchaseDate: '', salesperson: '', mileageAtPurchase: '', mileageNow: '',
  faultStarted: '', description: '', repairsDone: '', resolution: 'ei-tiedossa', consent: false, website: '',
};

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} Mt`;

export default function ComplaintForm({ block }: { block: any }) {
  const pathname = usePathname();
  const [f, setF] = useState<Form>(EMPTY);
  const [photos, setPhotos] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [serverError, setServerError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const consent: string = block.consentText || '';

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const addPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []).filter((file) => file.type.startsWith('image/'));
    setPhotos((p) => [...p, ...picked].slice(0, MAX_PHOTOS));
    e.target.value = '';
  };
  const total = photos.reduce((s, p) => s + p.size, 0);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Kirjoita nimesi';
    if (f.phone.replace(/\D/g, '').length < 6) e.phone = 'Tarkista puhelinnumero';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Tarkista sähköposti';
    if (f.plate.replace(/[^a-z0-9]/gi, '').length < 2) e.plate = 'Kirjoita rekisterinumero';
    if (f.description.trim().length < 10) e.description = 'Kuvaile vika muutamalla lauseella';
    if (total > MAX_BYTES) e.photos = `Kuvien yhteiskoko saa olla enintään ${mb(MAX_BYTES)}`;
    if (consent && !f.consent) e.consent = 'Hyväksy tietojen käsittely';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const body = new FormData();
    for (const [k, v] of Object.entries(f)) if (k !== 'consent') body.append(k, String(v));
    body.append('sourcePage', pathname);
    photos.forEach((p) => body.append('photos', p, p.name));
    setStatus('sending');
    setServerError('');
    try {
      const res = await fetch('/api/complaints', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Lähetys epäonnistui');
      setStatus('done');
    } catch (err) {
      setServerError((err as Error).message);
      setStatus('error');
    }
  };

  const field = (k: keyof Form, label: string, input: React.ReactNode, cls = '') => (
    <label className={`field ${cls} ${errors[k] ? 'invalid' : ''}`}>{label}
      {input}
      {errors[k] ? <span className="err">{errors[k]}</span> : null}
    </label>
  );

  return (
    <section className="wrap cmp-sec" id="lomake">
      <div className="cmp-head">
        <h2 className="d h-sec">{block.title || 'Reklamaatiolomake'}</h2>
        {block.intro ? <p>{block.intro}</p> : null}
      </div>

      {status === 'done' ? (
        <div className="cmp-card cmp-done pop" role="status">
          <h3 className="d">{block.successTitle || 'Reklamaatio vastaanotettu'}</h3>
          {block.successText ? <p>{block.successText}</p> : null}
          <button className="btn btn-outline" type="button" onClick={() => { setF(EMPTY); setPhotos([]); setStatus('idle'); }}>Tee uusi reklamaatio</button>
        </div>
      ) : (
        <form className="cmp-card" onSubmit={submit} noValidate>
          <fieldset>
            <legend><span>01</span> Yhteystiedot</legend>
            <div className="form-grid">
              {field('name', 'Nimi *', <input type="text" autoComplete="name" value={f.name} onChange={set('name')} />)}
              {field('phone', 'Puhelin *', <input type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} />)}
              {field('email', 'Sähköposti *', <input type="email" autoComplete="email" value={f.email} onChange={set('email')} />)}
            </div>
          </fieldset>

          <fieldset>
            <legend><span>02</span> Auto ja kauppa</legend>
            <div className="form-grid">
              {field('plate', 'Rekisterinumero *', (
                <span className="plate-in">
                  <span>FIN</span>
                  <input type="text" maxLength={8} placeholder="ABC-123" value={f.plate} onChange={set('plate')} autoComplete="off" autoCapitalize="characters" />
                </span>
              ))}
              {field('purchaseDate', 'Ostopäivä', <input type="date" value={f.purchaseDate} onChange={set('purchaseDate')} />)}
              {field('salesperson', 'Myyjän nimi', <input type="text" placeholder="jos tiedossa" value={f.salesperson} onChange={set('salesperson')} />)}
              {field('mileageAtPurchase', 'Mittarilukema ostettaessa (km)', <input type="text" inputMode="numeric" placeholder="esim. 120 000" value={f.mileageAtPurchase} onChange={set('mileageAtPurchase')} />)}
              {field('mileageNow', 'Mittarilukema nyt (km)', <input type="text" inputMode="numeric" placeholder="esim. 123 500" value={f.mileageNow} onChange={set('mileageNow')} />)}
            </div>
          </fieldset>

          <fieldset>
            <legend><span>03</span> Vika</legend>
            <div className="form-grid">
              {field('faultStarted', 'Milloin vika ilmeni?', <input type="date" value={f.faultStarted} onChange={set('faultStarted')} />)}
              {field('description', 'Vian kuvaus *', (
                <textarea rows={6} placeholder="Mitä tapahtuu, milloin ja missä tilanteessa? Miltä vika näyttää, kuulostaa tai tuntuu? Näkyykö mittaristossa varoitusvaloja?" value={f.description} onChange={set('description')} />
              ), 'full')}
              {field('repairsDone', 'Onko autoa jo tarkastettu tai korjattu vian vuoksi?', (
                <textarea rows={3} placeholder="Korjaamo, päivämäärä ja mitä tehtiin – jätä tyhjäksi, jos ei" value={f.repairsDone} onChange={set('repairsDone')} />
              ), 'full')}
            </div>
            <div className="cmp-choice full" role="radiogroup" aria-label="Toivottu ratkaisu">
              <span className="cmp-label">Toivottu ratkaisu</span>
              <div className="cmp-opts">
                {RESOLUTIONS.map(([value, label]) => (
                  <label key={value} className="cmp-opt" data-on={f.resolution === value || undefined}>
                    <input type="radio" name="resolution" value={value} checked={f.resolution === value} onChange={set('resolution')} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend><span>04</span> Kuvat <small>valinnainen</small></legend>
            <p className="cmp-hint">Enintään {MAX_PHOTOS} kuvaa, yhteensä {mb(MAX_BYTES)}. Esimerkiksi varoitusvalot mittaristossa tai vuotokohta.</p>
            {photos.length ? (
              <ul className="cmp-files">
                {photos.map((p, i) => (
                  <li key={`${p.name}-${i}`}>
                    <span>{p.name}</span><span className="m">{mb(p.size)}</span>
                    <button type="button" className="link-btn" onClick={() => setPhotos((all) => all.filter((_, j) => j !== i))}>Poista</button>
                  </li>
                ))}
              </ul>
            ) : null}
            {photos.length < MAX_PHOTOS ? (
              <>
                <input ref={fileRef} className="sr-only" id="cmp-photos" type="file" accept="image/*" multiple onChange={addPhotos} />
                <label htmlFor="cmp-photos" className="btn btn-outline">Lisää kuvia</label>
              </>
            ) : null}
            {errors.photos ? <p className="form-error" role="alert">{errors.photos}</p> : null}
          </fieldset>

          <label className="hp" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} /></label>
          {consent ? (
            <div>
              <label className="check">
                <input type="checkbox" checked={f.consent} onChange={set('consent')} />
                <span>{consent}</span>
              </label>
              {errors.consent ? <span className="form-error" style={{ fontSize: 12 }}>{errors.consent}</span> : null}
            </div>
          ) : null}
          {status === 'error' ? <p className="form-error" role="alert">{serverError || 'Lähetys epäonnistui.'} Voit myös lähettää reklamaation sähköpostilla osoitteeseen info@aitoautooy.fi.</p> : null}
          {Object.keys(errors).length ? <p className="form-error" role="alert">Tarkista punaisella merkityt kentät.</p> : null}
          <div className="actions">
            <button className="btn btn-navy cut btn-lg" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? <span key="s">Lähetetään…</span> : <span key="i">Lähetä reklamaatio <Arrow /></span>}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
