import type { Metadata, Viewport } from 'next';
import { connection } from 'next/server';
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource/hanken-grotesk/400.css';
import '@fontsource/hanken-grotesk/500.css';
import '@fontsource/hanken-grotesk/600.css';
import '@fontsource/hanken-grotesk/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './globals.css';
import { getGlobal } from '@/lib/strapi';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppProvider from '@/components/WhatsAppProvider';
import ScrollFx from '@/components/ScrollFx';
import { SITE_URL } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const g = await getGlobal();
  const title = g.defaultSeo?.metaTitle || g.siteName;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s` },
    description: g.defaultSeo?.metaDescription || g.tagline,
    openGraph: {
      siteName: g.siteName,
      locale: 'fi_FI',
      type: 'website',
      images: g.defaultSeo?.shareImage ? [g.defaultSeo.shareImage.url] : g.logo ? [g.logo.url] : [],
    },
    icons: g.logo ? { icon: g.logo.url } : undefined,
  };
}

const FX_SCRIPT = `(function(){try{var d=document.documentElement;if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;var s=window.CSS&&CSS.supports;if(s&&CSS.supports('animation-timeline: view()')&&CSS.supports('animation-timeline: scroll()')&&!/[?&]fx=io/.test(location.search)){d.classList.add('fx-sda')}else if('IntersectionObserver' in window){d.classList.add('fx-io');setTimeout(function(){if(!d.classList.contains('fx-ready'))d.classList.remove('fx-io')},4000)}}catch(e){}})();`;

export const viewport: Viewport = { themeColor: '#16263D', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Render on request (content is cached for 5 min and refreshed instantly via /api/revalidate),
  // so the site can be built without Strapi running.
  await connection();
  const global = await getGlobal();
  return (
    <html lang="fi" suppressHydrationWarning>
      <head>
        {/* Picks the scroll-animation engine before first paint (see globals.css "Scroll animations"). */}
        <script dangerouslySetInnerHTML={{ __html: FX_SCRIPT }} />
      </head>
      <body>
        <a className="skip" href="#main">Siirry sisältöön</a>
        <WhatsAppProvider number={global.whatsappNumber} topics={global.whatsappTopics} siteUrl={SITE_URL}>
          <Header global={global} />
          <main id="main">{children}</main>
          <Footer global={global} />
        </WhatsAppProvider>
        <ScrollFx />
      </body>
    </html>
  );
}
