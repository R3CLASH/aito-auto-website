import type { SiteContext } from '@/lib/types';
import { telHref } from '@/lib/format';
import WaButton from '../WaButton';
import ContactForm from './ContactForm';
import OpenStatus, { HoursList } from './OpenStatus';

export default function ContactHub({ block, ctx }: { block: any; ctx: SiteContext }) {
  const g = ctx.global;
  return (
    <>
      <section className="wrap ct-hero">
        <div className="top">
          <div>
            <div className="eyebrow up">Yhteystiedot</div>
            <h1 className="d up u2">{block.title}</h1>
          </div>
          <OpenStatus hours={g.openingHours} />
        </div>
        <div className="tickets">
          {g.phone ? (
            <a className="tk navy cut up u2" href={telHref(g.phone)}>
              <div className="top"><span>Soita</span><span className="ar" aria-hidden="true">↗</span></div>
              <div><div className="d">{g.phoneDisplay}</div><div className="s">Aukioloaikoina</div></div>
            </a>
          ) : null}
          <WaButton className="tk wa cut up u3">
            <div className="top"><span>WhatsApp</span><span className="ar" aria-hidden="true">↗</span></div>
            <div><div className="d">Lähetä viesti</div><div className="s">Lomake – tiedot tulevat suoraan meille</div></div>
          </WaButton>
          {g.email ? (
            <a className="tk az cut up u4" href={`mailto:${g.email}`}>
              <div className="top"><span>Sähköposti</span><span className="ar" aria-hidden="true">↗</span></div>
              <div><div className="d">{g.email}</div><div className="s">Vastaamme arkisin</div></div>
            </a>
          ) : null}
        </div>
      </section>

      <section className="wrap ct-main">
        <ContactForm
          title={block.formTitle || 'Jätä viesti'}
          intro={block.formIntro || ''}
          consent={block.consentText || ''}
          successTitle={block.successTitle || 'Kiitos!'}
          successText={block.successText || ''}
          topics={g.whatsappTopics}
          whatsappNumber={g.whatsappNumber}
        />
        <aside className="ct-side">
          <div className="map rv">
            {g.mapEmbedUrl ? (
              <iframe src={g.mapEmbedUrl} title="Kartta" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            ) : (
              <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Karttakuvitus">
                <rect width="400" height="300" fill="#E8EBEF" />
                <path d="M0 210 Q120 180 220 196 T400 150" stroke="#C5D9E8" strokeWidth="26" fill="none" />
                <path d="M-10 90 L410 120 M140 -10 L170 310 M290 -10 L250 310 M0 250 L400 270" stroke="#fff" strokeWidth="10" />
                <path d="M-10 90 L410 120 M140 -10 L170 310" stroke="#ADB1BA" strokeWidth="1" strokeDasharray="6 6" />
                <rect x="40" y="20" width="70" height="48" fill="#DCE0E5" /><rect x="190" y="30" width="80" height="60" fill="#DCE0E5" />
                <rect x="310" y="20" width="70" height="70" fill="#DCE0E5" /><rect x="30" y="130" width="90" height="50" fill="#DCE0E5" />
                <rect x="300" y="160" width="80" height="60" fill="#DCE0E5" />
                <circle className="ping" cx="210" cy="140" r="16" fill="#1A7EB6" />
                <path d="M210 146 C196 128 190 118 190 108 a20 20 0 0 1 40 0 c0 10 -6 20 -20 38z" fill="#16263D" />
                <circle cx="210" cy="108" r="7" fill="#fff" />
              </svg>
            )}
            {g.mapsUrl ? <a className="btn btn-navy" href={g.mapsUrl} target="_blank" rel="noopener noreferrer">Reittiohjeet ↗</a> : null}
          </div>

          <div className="hours rv">
            <div className="eyebrow">Käyntiosoite</div>
            <div className="d addr">{g.street}<br />{g.postalCode} {g.city}</div>
            <div className="eyebrow" style={{ marginTop: 26 }}>Aukioloajat</div>
            <HoursList hours={g.openingHours} />
            {g.openingHoursNote ? <p className="note">{g.openingHoursNote}</p> : null}
          </div>

          <div className="company rv">
            <div className="eyebrow" style={{ fontSize: 12, marginBottom: 8 }}>Yritystiedot</div>
            <strong>{g.siteName}</strong><br />
            {g.businessId ? <>Y-tunnus {g.businessId}<br /></> : null}
            {g.invoicingAddress ? <>Laskutus: {g.invoicingAddress}<br /></> : null}
            <a href="/tietosuojaseloste">Tietosuojaseloste</a>
          </div>
        </aside>
      </section>
    </>
  );
}
