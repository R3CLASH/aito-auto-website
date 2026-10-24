'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Arrow, CarOutline } from '../Icons';
import SmartLink from '../SmartLink';
import { two } from '@/lib/format';

export type ShowroomTab = {
  slug: string;
  label: string;
  count: number;
  from: number | null;
  image: { url: string; width: number; height: number } | null;
};

export default function HeroShowroom({ block, tabs }: { block: any; tabs: ShowroomTab[] }) {
  const [i, setI] = useState(0);
  const cur = tabs[i];

  return (
    <section className="hero">
      <div className="wrap hero-in">
        <div className="hero-copy">
          {block.eyebrow ? <div className="hero-kicker up">{block.eyebrow}</div> : null}
          <h1 className="d up u2">
            {block.titleLine1}
            {block.titleLine2 ? <><br /><span className="outline">{block.titleLine2}</span></> : null}
          </h1>
          {block.description ? <p className="up u3">{block.description}</p> : null}
          <div className="hero-ctas up u4">
            {block.primaryCta ? <SmartLink className="btn btn-white cut" href={block.primaryCta.url}>{block.primaryCta.label} <Arrow /></SmartLink> : null}
            {block.secondaryCta ? <SmartLink className="btn btn-ghost" href={block.secondaryCta.url}>{block.secondaryCta.label}</SmartLink> : null}
          </div>
        </div>

        {cur ? (
          <div className="show">
            <div className="show-top"><span>{block.showroomLabel || 'Näyttelytila'}</span><span>{two(i + 1)} / {two(tabs.length)}</span></div>
            <div className="stage">
              <div className="d drift stage-word" aria-hidden="true">{cur.label}</div>
              <svg className="turntable" viewBox="0 0 400 90" aria-hidden="true">
                <ellipse cx="200" cy="45" rx="190" ry="34" fill="rgba(255,255,255,.08)" />
                <g transform="translate(200 45) scale(1 .18)">
                  <circle className="spin" cx="0" cy="0" r="186" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="7" strokeDasharray="28 22" />
                </g>
              </svg>
              <div className="stage-car" key={cur.slug}>
                {cur.image ? (
                  <Image className="drive" src={cur.image.url} alt={cur.label} width={cur.image.width} height={cur.image.height} priority sizes="(max-width: 900px) 92vw, 560px" />
                ) : (
                  <CarOutline className="drive" />
                )}
              </div>
            </div>
            <div className="tabs" role="group" aria-label="Valitse ajoneuvotyyppi">
              {tabs.map((t, n) => (
                <button key={t.slug} type="button" className="tab" aria-pressed={n === i} onClick={() => setI(n)}>
                  <span className="m">{two(n + 1)}</span>
                  <b>{t.label}</b>
                </button>
              ))}
            </div>
            <Link className="rd" href={`/autot?tyyppi=${cur.slug}`}>
              <i>FIN</i>
              <span className="rd-mid">
                <span className="d">{cur.count} {cur.count === 1 ? 'auto' : 'autoa'}</span>
                {cur.from ? <span><span className="m" style={{ fontSize: 12, color: 'var(--muted)' }}>alk. </span><strong>{cur.from} €/kk</strong></span> : null}
              </span>
              <span className="rd-go" aria-hidden="true">→</span>
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
