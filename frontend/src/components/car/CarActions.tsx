'use client';

import { useWhatsApp, type WaCar } from '../WhatsAppProvider';
import { WhatsApp } from '../Icons';

export default function CarActions({ car, sold }: { car: WaCar; sold: boolean }) {
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
        <button className="btn btn-navy" type="button" onClick={() => wa.open({ topic: 'Koeajo', car, title: 'Varaa koeajo' })}>Varaa koeajo</button>
        <a className="btn btn-outline" href="#laskuri">Laske erä</a>
      </div>
    </div>
  );
}
