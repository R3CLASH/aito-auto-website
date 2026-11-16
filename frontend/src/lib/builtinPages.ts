import type { Link, PageData } from './types';

/**
 * Pages the site serves before an editor has created them in Strapi. A Strapi
 * page with the same slug always wins, so these are only a starting point:
 * copy the content into the CMS to edit it there. Mirrors backend/src/seed/data.ts.
 */

export const SELL_LINK: Link = { label: 'Myy auto', url: '/myy-auto' };

let id = 0;
const b = (__component: string, fields: Record<string, unknown>) => ({ __component, id: ++id, ...fields });

export const BUILTIN_PAGES: Record<string, PageData> = {
  'myy-auto': {
    title: 'Myy auto',
    slug: 'myy-auto',
    seo: {
      metaTitle: 'Myy autosi – Aito Auto Oy',
      metaDescription: 'Ostamme autoja myös ilman vaihtokauppaa. Kerro autostasi, niin teemme ostotarjouksen. Paperit ja mahdollinen laina hoidetaan puolestasi.',
    },
    blocks: [
      b('sections.sell-car', {
        eyebrow: 'Myy auto',
        title: 'Me ostamme.\nSinä et\nilmoittele.',
        intro: 'Ostamme henkilö- ja pakettiautoja myös ilman vaihtokauppaa. Kerro autostasi muutamalla tiedolla, niin teemme sinulle ostotarjouksen – ilman ilmoittelua, koeajajia tai tinkimistä.',
        points: [
          { title: 'Tarjous nopeasti', text: 'Vastaamme yleensä saman tai seuraavan arkipäivän aikana.' },
          { title: 'Laina ei ole este', text: 'Maksamme jäljellä olevan lainan suoraan rahoittajalle.' },
          { title: 'Paperit hoidettuna', text: 'Kauppakirja ja omistajanvaihdos tehdään puolestasi.' },
        ],
        formTitle: 'Pyydä ostotarjous',
        consentText: 'Hyväksyn, että tietojani käytetään ostotarjouksen tekemiseen tietosuojaselosteen mukaisesti.',
        successTitle: 'Kiitos, tiedot tulivat perille!',
        successText: 'Katsomme autosi tiedot ja palaamme ostotarjouksen kanssa mahdollisimman pian. Kuvat autosta nopeuttavat arviota – voit lähettää ne WhatsAppissa.',
      }),
      b('sections.process-road', {
        eyebrow: 'Näin se menee',
        title: 'Neljä vaihetta tilisiirtoon',
        steps: [
          { title: 'Kerro autosta', text: 'Rekisterinumero, kilometrit ja muutama sana kunnosta riittävät alkuun.' },
          { title: 'Saat tarjouksen', text: 'Arvioimme auton tietojen perusteella ja kerromme hinnan puhelimessa tai viestillä.' },
          { title: 'Tuo auto näytille', text: 'Katsomme auton liikkeessämme. Kun kunto vastaa kerrottua, tarjous pitää.' },
          { title: 'Rahat tilille', text: 'Teemme kaupan ja omistajanvaihdoksen, ja maksu lähtee tilillesi.' },
        ],
      }),
      b('sections.faq', {
        eyebrow: 'Usein kysyttyä',
        title: 'Ennen kuin myyt',
        items: [
          { question: 'Täytyykö minun ostaa auto teiltä?', answer: 'Ei tarvitse. Ostamme autoja myös ilman vaihtokauppaa. Jos haluat vaihtaa, hyvitys vähennetään suoraan uuden auton hinnasta.' },
          { question: 'Voinko myydä auton, jossa on vielä lainaa?', answer: 'Voit. Selvitämme jäljellä olevan velan rahoittajalta, maksamme sen pois ja tilitämme erotuksen sinulle.' },
          { question: 'Miten hinta määräytyy?', answer: 'Hintaan vaikuttavat malli, vuosimalli, kilometrit, varustelu, kunto ja huoltohistoria sekä se, millainen kysyntä autolle on juuri nyt. Lopullinen hinta vahvistetaan, kun olemme nähneet auton.' },
          { question: 'Mitä tarvitsen mukaan?', answer: 'Kaikki avaimet, huoltokirjan tai -historian, henkilöllisyystodistuksen ja omistajatiedot. Jos autossa on rahoitusta, ota mukaan myös lainan tiedot.' },
          { question: 'Sitoudunko johonkin, kun lähetän tiedot?', answer: 'Et. Tarjouksen pyytäminen on maksutonta eikä velvoita myymään.' },
          { question: 'Millaisia autoja ostatte?', answer: 'Henkilöautoja, farmareita, maastureita ja pakettiautoja. Jos et ole varma, kerro autostasi – katsotaan yhdessä.' },
        ],
      }),
      b('sections.cta-banner', {
        title: 'Mieluummin juttelet?',
        highlight: 'Soita tai tule käymään.',
        buttonLabel: 'Yhteystiedot',
        action: 'link',
        url: '/yhteystiedot',
      }),
    ],
  },
};
