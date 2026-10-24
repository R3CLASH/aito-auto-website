'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { GlobalSettings } from '@/lib/types';
import { telHref, two } from '@/lib/format';
import { Arrow, Close } from './Icons';
import { useWhatsApp } from './WhatsAppProvider';

function isActive(pathname: string, url: string) {
  if (url === '/') return pathname === '/';
  return pathname === url || pathname.startsWith(url + '/');
}

function hoursLine(g: GlobalSettings) {
  // "Ma–pe 10–18 · La 11–15" from opening hours
  const short = ['', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'];
  const open = g.openingHours.filter((h) => !h.closed && h.opens);
  const groups: { from: number; to: number; time: string }[] = [];
  for (const h of open) {
    const time = `${h.opens!.replace(':00', '')}–${(h.closes || '').replace(':00', '')}`;
    const last = groups[groups.length - 1];
    if (last && last.time === time && last.to === h.dayIndex - 1) last.to = h.dayIndex;
    else groups.push({ from: h.dayIndex, to: h.dayIndex, time });
  }
  return groups.map((x) => `${x.from === x.to ? short[x.from] : `${short[x.from]}–${short[x.to].toLowerCase()}`} ${x.time}`).join(' · ');
}

export default function Header({ global }: { global: GlobalSettings }) {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const wa = useWhatsApp();
  const hours = hoursLine(global);
  const addr = [global.street, global.city].filter(Boolean).join(', ');

  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [menu]);

  const logo = global.logo ? (
    <Image src={global.logo.url} alt={global.siteName} width={global.logo.width} height={global.logo.height} priority sizes="120px" />
  ) : (
    <span className="d" style={{ fontSize: 28, color: 'var(--navy)' }}>{global.siteName}</span>
  );

  return (
    <>
      <div className="topbar">
        <div className="wrap m">
          <span>{hours ? `Avoinna ${hours.charAt(0).toLowerCase()}${hours.slice(1)}` : ''}</span>
          <span>
            {addr}
            {global.phone ? <> · <a href={telHref(global.phone)}>{global.phoneDisplay}</a></> : null}
          </span>
        </div>
      </div>

      <header className="hd">
        <div className="wrap hd-in">
          <Link className="badge" href="/" aria-label={`${global.siteName} – etusivu`}>{logo}</Link>
          <nav className="nav" aria-label="Päävalikko">
            {global.navigation.map((l, i) => (
              <Link key={l.url} className="nk" href={l.url} aria-current={isActive(pathname, l.url) ? 'page' : undefined}>
                <span>{two(i + 1)}</span>{l.label}
              </Link>
            ))}
          </nav>
          <div className="hd-end">
            {global.headerCta ? (
              <Link className="btn btn-azure cut hd-cta" href={global.headerCta.url}>{global.headerCta.label} <Arrow /></Link>
            ) : null}
            <button className="mb" type="button" aria-label="Avaa valikko" aria-expanded={menu} onClick={() => setMenu(true)}>
              <i /><i /><i />
            </button>
          </div>
        </div>
        <div className="prog" aria-hidden="true" />
      </header>

      {menu ? (
        <div className="mm" role="dialog" aria-modal="true" aria-label="Valikko">
          <div className="mm-wedge" aria-hidden="true" />
          <div className="mm-top">
            {global.logo ? <Image src={global.logo.url} alt={global.siteName} width={global.logo.width} height={global.logo.height} sizes="80px" /> : <span />}
            <button className="mm-close" type="button" aria-label="Sulje valikko" onClick={() => setMenu(false)} autoFocus><Close size={20} /></button>
          </div>
          <nav className="mm-nav" aria-label="Mobiilivalikko">
            {global.navigation.map((l, i) => (
              <Link key={l.url} className="ml" href={l.url} aria-current={isActive(pathname, l.url) ? 'page' : undefined} onClick={() => setMenu(false)}>
                <span>{two(i + 1)}</span>{l.label}
              </Link>
            ))}
          </nav>
          <div className="mm-foot">
            {global.headerCta ? <Link className="btn btn-white" href={global.headerCta.url}>{global.headerCta.label}</Link> : null}
            <button className="btn btn-wa" type="button" onClick={() => { setMenu(false); wa.open(); }}>Kysy WhatsAppissa</button>
            <div className="m">
              {hours}<br />
              {global.phone ? <a href={telHref(global.phone)}>{global.phoneDisplay}</a> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
