'use client';

import { useEffect, useState } from 'react';
import { fmt } from '@/lib/format';
import { WhatsApp } from '../Icons';
import { useWhatsApp, type WaCar } from '../WhatsAppProvider';

/** Phone-only bottom bar on car pages: price + monthly + WhatsApp, appears after the first screen. */
export default function CarStickyBar({ car, price, monthly }: { car: WaCar; price: string; monthly: number }) {
  const wa = useWhatsApp();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className={`cd-sticky ${show ? 'on' : ''}`} aria-hidden={!show}>
      <a href="#laskuri" className="cd-sticky-price" tabIndex={show ? 0 : -1}>
        <span className="m">{price}</span>
        <strong>{fmt(monthly)} €/kk</strong>
      </a>
      <button type="button" className="btn btn-wa" tabIndex={show ? 0 : -1} onClick={() => wa.open({ topic: 'Kiinnostunut autosta', car })}>
        <WhatsApp size={20} /> Kysy
      </button>
    </div>
  );
}
