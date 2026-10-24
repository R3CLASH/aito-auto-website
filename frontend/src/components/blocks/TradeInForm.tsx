'use client';

import { useState } from 'react';
import { useWhatsApp } from '../WhatsAppProvider';

export default function TradeInForm() {
  const wa = useWhatsApp();
  const [plate, setPlate] = useState('');
  const [mileage, setMileage] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = [plate.trim().toUpperCase(), mileage.trim() ? `${mileage.trim()} km` : ''].filter(Boolean);
    wa.open({ topic: 'Vaihtoauto', tradeIn: parts.join(', '), title: 'Pyydä vaihtoautoarvio' });
  };

  return (
    <form className="trade cut" onSubmit={submit}>
      <label className="field" style={{ flex: '1 1 280px', minWidth: 0 }}>
        Rekisterinumero
        <span className="plate-in">
          <span>FIN</span>
          <input type="text" maxLength={8} placeholder="ABC-123" value={plate} onChange={(e) => setPlate(e.target.value)} autoComplete="off" />
        </span>
      </label>
      <label className="field" style={{ flex: '1 1 160px' }}>
        Mittarilukema (km)
        <input type="text" inputMode="numeric" placeholder="esim. 120 000" value={mileage} onChange={(e) => setMileage(e.target.value)} />
      </label>
      <button className="btn btn-wa" type="submit" style={{ flex: '1 1 200px', minHeight: 64 }}>Pyydä arvio WhatsAppissa</button>
    </form>
  );
}
