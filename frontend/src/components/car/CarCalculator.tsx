'use client';

import { useMemo, useState } from 'react';
import type { FinanceSettings } from '@/lib/types';
import { monthlyPayment } from '@/lib/finance';
import { euro, fmt, pct } from '@/lib/format';
import { Arrow } from '../Icons';
import { useWhatsApp, type WaCar } from '../WhatsAppProvider';

export default function CarCalculator({ price, finance: f, eyebrow, title, car }: {
  price: number;
  finance: FinanceSettings;
  eyebrow: string;
  title: string;
  car: WaCar;
}) {
  const wa = useWhatsApp();
  const [down, setDown] = useState(f.defaultDownPct);
  const [term, setTerm] = useState(f.termOptions.includes(f.defaultTermMonths) ? f.defaultTermMonths : f.termOptions[0]);
  const [balloon, setBalloon] = useState(0);
  const [rate, setRate] = useState(f.interestRate);

  const r = useMemo(() => monthlyPayment(price, f, { downPct: down, termMonths: term, balloonPct: balloon, rate }), [price, f, down, term, balloon, rate]);

  const parts = [r.down, r.principal, r.cost, r.balloon];
  const sum = parts.reduce((a, b) => a + b, 0) || 1;
  const w = parts.map((p) => `${(p / sum) * 100}%`);

  const calcText = `${fmt(r.monthly)} €/kk · ${term} kk · käsiraha ${euro(r.down)}${r.balloon ? ` · loppuerä ${euro(r.balloon)}` : ''} · korko ${pct(rate)} %`;

  const send = () => wa.open({
    topic: 'Rahoitus',
    car,
    calcText,
    calculation: {
      price, downPct: down, down: Math.round(r.down), termMonths: term, balloonPct: balloon, balloon: Math.round(r.balloon),
      interestRate: rate, monthly: Math.round(r.monthly), totalCost: Math.round(r.cost), totalPaid: Math.round(r.total),
    },
  });

  return (
    <section id="laskuri" className="wrap calc-sec">
      <div className="calc rv">
        <div className="calc-in">
          <div className="calc-l">
            <div className="eyebrow">{eyebrow}</div>
            <h2 className="d">{title}</h2>

            <div className="ctrl">
              <div className="ctrl-top"><label htmlFor="dp">Käsiraha</label><span className="m">{euro(r.down)} · {down} %</span></div>
              <input id="dp" className="rng" type="range" min={0} max={f.maxDownPct} step={f.downStep} value={down} onChange={(e) => setDown(Number(e.target.value))} />
              <div className="rng-ends"><span>0 %</span><span>{f.maxDownPct} %</span></div>
            </div>

            <div className="ctrl">
              <div className="ctrl-top" id="termL">Laina-aika</div>
              <div className="terms" role="group" aria-labelledby="termL">
                {f.termOptions.map((t) => (
                  <button key={t} type="button" className="term" aria-pressed={t === term} onClick={() => setTerm(t)}>{t}</button>
                ))}
              </div>
              <div className="rng-ends" style={{ marginTop: 6 }}><span>kuukautta</span></div>
            </div>

            {f.maxBalloonPct > 0 ? (
              <div className="ctrl">
                <div className="ctrl-top"><label htmlFor="bal">Loppuerä (valinnainen)</label><span className="m">{euro(r.balloon)} · {balloon} %</span></div>
                <input id="bal" className="rng" type="range" min={0} max={f.maxBalloonPct} step={f.balloonStep} value={balloon} onChange={(e) => setBalloon(Number(e.target.value))} />
                <div className="rng-ends"><span>0 %</span><span>{f.maxBalloonPct} %</span></div>
              </div>
            ) : null}

            <div className="ctrl">
              <div className="ctrl-top"><label htmlFor="rt">Nimelliskorko</label><span className="m">{pct(rate)} %</span></div>
              <input id="rt" className="rng" type="range" min={f.interestMin} max={f.interestMax} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
              <div className="rng-ends"><span>{pct(f.interestMin)} %</span><span>{pct(f.interestMax)} %</span></div>
            </div>
          </div>

          <div className="calc-r">
            <div className="eyebrow">Kuukausierä</div>
            <div className="d big" aria-live="polite">{fmt(r.monthly)}<span> €/kk</span></div>
            <div className="sub">{term} erää · sis. käsittelymaksun {f.monthlyFee} €/kk</div>

            <div className="bar" role="img" aria-label="Kokonaismaksun jakautuminen">
              <span style={{ width: w[0], background: '#16263D' }} />
              <span style={{ width: w[1], background: '#FFFFFF' }} />
              <span style={{ width: w[2], background: '#ADB1BA' }} />
              <span style={{ width: w[3], background: '#5A6E8A' }} />
            </div>
            <div className="legend">
              <span><i style={{ background: '#16263D' }} />Käsiraha</span>
              <span><i style={{ background: '#fff' }} />Lyhennykset</span>
              <span><i style={{ background: '#ADB1BA' }} />Korot ja kulut</span>
              <span><i style={{ background: '#5A6E8A' }} />Loppuerä</span>
            </div>

            <div className="sum">
              <div><span>Auton hinta</span><span className="m">{euro(price)}</span></div>
              <div><span>Luoton määrä (sis. avausmaksu {f.openingFee} €)</span><span className="m">{euro(r.loan)}</span></div>
              <div><span>Luoton kokonaiskustannus</span><span className="m">{euro(r.cost)}</span></div>
              <div><span>Maksat yhteensä</span><span className="m">{euro(r.total)}</span></div>
            </div>
            <button className="btn btn-wa btn-lg btn-block" type="button" style={{ marginTop: 18 }} onClick={send}>
              Lähetä laskelma WhatsAppiin <Arrow />
            </button>
          </div>
        </div>
      </div>
      {f.disclaimer ? <p className="disclaimer" style={{ marginTop: 18 }}>{f.disclaimer}</p> : null}
    </section>
  );
}
