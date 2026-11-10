'use client';

import { useWhatsApp, type WaCar } from '../WhatsAppProvider';
import { WhatsApp } from '../Icons';
import { SITE_URL } from '@/lib/site';

/** Prefilled email inquiry: the route for buyers who don't use WhatsApp. */
function inquiryHref(email: string, car: WaCar) {
  const subject = `Kysely autosta: ${car.title}`;
  const lines = ['Hei,', '', 'Olen kiinnostunut tästä autosta:', '', car.title, car.meta];
  if (car.url) lines.push(`${SITE_URL}${car.url}`);
  lines.push('', 'Ottaisitteko yhteyttä sähköpostilla.', '', 'Terveisin,');
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
}

export default function CarActions({ car, email, sold }: { car: WaCar; email: string; sold: boolean }) {
  const wa = useWhatsApp();
  if (sold) {
    return (
      <div className="cd-actions">
        <button className="btn btn-wa btn-lg" type="button" onClick={() => wa.open({ topic: 'Hakutoive', carText: car.title })}>
          <WhatsApp size={20} /> Etsi minulle samanlainen
        </button>
      </div>
    );
  }
  return (
    <div className="cd-actions">
      <button className="btn btn-wa btn-lg" type="button" onClick={() => wa.open({ topic: 'Kiinnostunut autosta', car })}>
        <WhatsApp size={20} /> Kysy tästä autosta WhatsAppissa
      </button>
      <div className="two">
        {email ? (
          <a className="btn btn-navy" href={inquiryHref(email, car)}>Kysy sähköpostilla</a>
        ) : (
          <button className="btn btn-navy" type="button" onClick={() => wa.open({ topic: 'Koeajo', car, title: 'Varaa koeajo' })}>Varaa koeajo</button>
        )}
        <a className="btn btn-outline" href="#laskuri">Laske erä</a>
      </div>
    </div>
  );
}
