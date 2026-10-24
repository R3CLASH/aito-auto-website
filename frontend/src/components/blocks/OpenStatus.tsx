'use client';

import { useEffect, useState } from 'react';
import type { OpeningHour } from '@/lib/types';

/** Current weekday (1 = Monday) and decimal hour in Finland, whatever the visitor's timezone. */
function helsinkiNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Helsinki', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
  const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(get('weekday')) + 1;
  const hour = Number(get('hour')) % 24 + Number(get('minute')) / 60;
  return { day, hour };
}

const toNum = (t?: string) => {
  if (!t) return NaN;
  const [h, m] = t.split(':').map(Number);
  return h + (m || 0) / 60;
};

export default function OpenStatus({ hours }: { hours: OpeningHour[] }) {
  const [state, setState] = useState<{ open: boolean; text: string } | null>(null);
  useEffect(() => {
    const { day, hour } = helsinkiNow();
    const today = hours.find((h) => h.dayIndex === day);
    const open = !!today && !today.closed && hour >= toNum(today.opens) && hour < toNum(today.closes);
    setState({
      open,
      text: open ? `Avoinna nyt – tänään ${today!.opens}–${today!.closes}` : 'Suljettu nyt – jätä viesti, vastaamme pian',
    });
  }, [hours]);
  if (!state) return <div className="status" aria-hidden="true" />;
  return <div className={`status up u3 ${state.open ? 'open' : ''}`}><i />{state.text}</div>;
}

export function HoursList({ hours }: { hours: OpeningHour[] }) {
  const [today, setToday] = useState(0);
  useEffect(() => setToday(helsinkiNow().day), []);
  return (
    <div className="rows">
      {hours.map((h) => (
        <div key={h.dayIndex} className={`row ${h.dayIndex === today ? 'today' : ''}`}>
          <span>{h.label}{h.dayIndex === today ? ' · tänään' : ''}</span>
          <span>{h.closed || !h.opens ? 'suljettu' : `${h.opens}–${h.closes}`}</span>
        </div>
      ))}
    </div>
  );
}
