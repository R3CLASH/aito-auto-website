import Image from 'next/image';
import Link from 'next/link';
import type { GlobalSettings } from '@/lib/types';
import { telHref } from '@/lib/format';

export default function Footer({ global }: { global: GlobalSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="ft">
      <div className="wrap">
        <div className="ft-grid">
          <div>
            <Link href="/" className="ft-logo" aria-label={global.siteName}>
              {global.logo ? <Image src={global.logo.url} alt={global.siteName} width={global.logo.width} height={global.logo.height} sizes="110px" /> : <span className="d" style={{ fontSize: 32, color: '#fff' }}>{global.siteName}</span>}
            </Link>
            {global.footerTagline ? <p>{global.footerTagline}</p> : null}
          </div>
          <div>
            <div className="ft-h">Sivut</div>
            <div className="ft-links">
              {global.navigation.filter((l) => l.url !== '/').map((l) => <Link key={l.url} href={l.url}>{l.label}</Link>)}
            </div>
          </div>
          <div>
            <div className="ft-h">Yhteystiedot</div>
            <div className="ft-addr">
              {global.street}<br />
              {global.postalCode} {global.city}<br />
              {global.phone ? <><a href={telHref(global.phone)}>{global.phoneDisplay}</a><br /></> : null}
              {global.email ? <a href={`mailto:${global.email}`}>{global.email}</a> : null}
            </div>
          </div>
          <div>
            <div className="ft-h">Aukiolo</div>
            <div className="ft-hours">
              {global.openingHours.map((h) => (
                <div key={h.dayIndex}>{h.label.slice(0, 2)} {h.closed || !h.opens ? 'suljettu' : `${h.opens}–${h.closes}`}</div>
              ))}
            </div>
          </div>
        </div>
        <div className="d ft-word" aria-hidden="true">{global.siteName}</div>
        <div className="ft-bottom">
          <span>© {year} {global.siteName}{global.businessId ? ` · Y-tunnus ${global.businessId}` : ''}</span>
          <nav aria-label="Alatunniste">
            {global.footerLinks.map((l) => <Link key={l.url} href={l.url}>{l.label}</Link>)}
          </nav>
        </div>
      </div>
    </footer>
  );
}
