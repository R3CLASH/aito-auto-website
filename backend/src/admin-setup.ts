import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

/* -------------------------------------------------------------------------- */
/* Guard rails: a car is only visible on the website when it has a model, and */
/* a model only when it belongs to a brand. Block saves that would silently   */
/* hide content, with a clear message in the admin.                           */
/* -------------------------------------------------------------------------- */

const hasRelationInput = (v: any) => {
  if (!v) return false;
  if (typeof v === 'string' || typeof v === 'number') return true;
  if (Array.isArray(v)) return v.length > 0;
  if (v.documentId || v.id) return true;
  if (Array.isArray(v.connect) && v.connect.length) return true;
  if (Array.isArray(v.set) && v.set.length) return true;
  return false;
};
const isClearing = (v: any) =>
  v === null ||
  (v && Array.isArray(v.set) && v.set.length === 0) ||
  (v && Array.isArray(v.disconnect) && v.disconnect.length && !(v.connect || []).length);

export function registerValidation(strapi: Core.Strapi) {
  strapi.documents.use(async (ctx, next) => {
    const params: any = ctx.params || {};

    // Model must belong to a brand
    if (ctx.uid === 'api::car-model.car-model') {
      const data = params.data || {};
      if (ctx.action === 'create' && !hasRelationInput(data.brand)) {
        throw new errors.ValidationError('Valitse mallille merkki (Merkki). Malli ilman merkkiä ei näy sivustolla.');
      }
      if (ctx.action === 'update' && 'brand' in data && isClearing(data.brand)) {
        const current: any = await strapi.documents('api::car-model.car-model').findOne({ documentId: params.documentId, populate: ['brand'] });
        const connecting = (data.brand?.connect || []).length > 0;
        if (!connecting && current?.brand && (data.brand === null || (data.brand.disconnect || []).length)) {
          throw new errors.ValidationError('Mallilla täytyy olla merkki (Merkki).');
        }
      }
    }

    // Car must have a model (and therefore a brand) before it can be published
    if (ctx.uid === 'api::car.car') {
      const publishingNow = ctx.action === 'publish' || ((ctx.action === 'create' || ctx.action === 'update') && params.status === 'published');
      if (publishingNow) {
        const data = params.data || {};
        let ok = hasRelationInput(data.car_model) && !isClearing(data.car_model);
        if (!ok && params.documentId && !isClearing(data.car_model)) {
          const draft: any = await strapi.documents('api::car.car').findOne({
            documentId: params.documentId,
            status: 'draft',
            populate: { car_model: { populate: ['brand'] } },
          });
          ok = Boolean(draft?.car_model);
          if (ok && !draft.car_model.brand) {
            throw new errors.ValidationError(`Mallilla "${draft.car_model.name}" ei ole merkkiä. Lisää merkki malliin ennen julkaisua.`);
          }
        }
        if (!ok) {
          throw new errors.ValidationError('Valitse autolle malli (Malli) ennen julkaisua – muuten auto ei näy sivustolla.');
        }
      }
    }

    return next();
  });
}

/* -------------------------------------------------------------------------- */
/* Admin layout: Finnish labels, helpful descriptions and useful list columns. */
/* Applied once (version flag), so later changes made in the admin are kept.  */
/* -------------------------------------------------------------------------- */

type Field = [label: string, description?: string];
type Layout = {
  list?: string[];
  mainField?: string;
  sort?: [string, 'ASC' | 'DESC'];
  fields: Record<string, Field>;
};

const LAYOUTS: Record<string, Layout> = {
  'api::car.car': {
    list: ['title', 'price', 'year', 'saleStatus', 'featured'],
    mainField: 'title',
    sort: ['updatedAt', 'DESC'],
    fields: {
      title: ['Otsikko (Title)', 'Esim. "Honda Accord 2.0 e:HEV Executive". Näkyy hakukoneissa ja WhatsApp-viesteissä.'],
      slug: ['URL-tunniste (URL slug)', 'Muodostuu otsikosta (paina ↻). Auton osoite: /autot/merkki/malli/tunniste'],
      car_model: ['Malli (Model)', 'Pakollinen. Merkki tulee mallin kautta. Uusi malli: Content Manager → Malli (Model).'],
      vehicle_type: ['Ajoneuvotyyppi (Vehicle type)', 'Henkilöauto, Farmari, Maasturi / SUV, Pakettiauto… Käytetään suodattimessa.'],
      variant: ['Versio / moottori (Variant / engine)', 'Esim. "2.0 e:HEV Executive"'],
      price: ['Hinta € (Price)', 'Kuukausierä lasketaan automaattisesti Rahoitusasetusten mukaan.'],
      year: ['Vuosimalli (Year)'],
      mileage: ['Mittarilukema km (Mileage)'],
      fuel: ['Käyttövoima (Fuel)'],
      transmission: ['Vaihteisto (Transmission)'],
      drivetrain: ['Vetotapa (Drivetrain)'],
      powerKw: ['Teho kW (Power)'],
      color: ['Väri (Colour)'],
      inspectedUntil: ['Katsastettu (Inspected until)', 'Esim. 05/2027'],
      co2: ['CO₂ g/km (CO₂ emissions)'],
      badge: ['Merkintä kortissa (Card badge)', 'Lyhyt tarra kuvan päällä, esim. UUSI, NELIVETO, ALV-VÄH.'],
      featured: ['Nosto etusivulle (Featured on home page)', 'Näytetään etusivun "Juuri pihaan" -osiossa.'],
      vatDeductible: ['ALV-vähennyskelpoinen (VAT deductible)'],
      saleStatus: ['Myyntitila (Sale status)', 'available = myynnissä · reserved = varattu (VARATTU-merkintä) · sold = myyty (piilotetaan listauksista)'],
      images: ['Kuvat (Images)', 'Ensimmäinen kuva on kansikuva. Järjestä vetämällä. Ilman kuvia näytetään ajoneuvotyypin siluetti.'],
      highlights: ['Kohokohdat (Highlights)', 'Esim. Huoltokirja, 2 avainta'],
      equipment: ['Varusteet (Equipment)'],
      extraSpecs: ['Lisätiedot (Extra specs)', 'Vapaat tieto–arvo-parit tekniset tiedot -taulukkoon'],
      description: ['Myyjän kuvaus (Seller description)'],
      registrationNumber: ['Rekisterinumero (Registration number)', 'Sisäinen – ei näy sivustolla'],
      internalNotes: ['Sisäiset muistiinpanot (Internal notes)', 'Ei näy sivustolla'],
    },
  },
  'api::car-model.car-model': {
    list: ['name', 'brand'],
    mainField: 'name',
    sort: ['name', 'ASC'],
    fields: {
      name: ['Mallin nimi (Model name)', 'Esim. Accord, CX-5, Octavia Combi'],
      slug: ['URL-tunniste (URL slug)', 'Muodostuu nimestä (paina ↻). Osoite: /autot/merkki/malli'],
      brand: ['Merkki (Brand)', 'Pakollinen'],
      cars: ['Autot (Cars)'],
    },
  },
  'api::brand.brand': {
    list: ['name', 'order', 'logo'],
    mainField: 'name',
    sort: ['order', 'ASC'],
    fields: {
      name: ['Merkin nimi (Brand name)', 'Esim. Honda'],
      slug: ['URL-tunniste (URL slug)', 'Muodostuu nimestä (paina ↻). Osoite: /autot/merkki'],
      logo: ['Logo', 'Valinnainen. Näytetään merkin listaussivulla.'],
      order: ['Järjestys (Order)', 'Pienin numero näytetään ensin'],
      car_models: ['Mallit (Models)'],
    },
  },
  'api::vehicle-type.vehicle-type': {
    list: ['name', 'order', 'silhouette'],
    mainField: 'name',
    sort: ['order', 'ASC'],
    fields: {
      name: ['Nimi (Name)'],
      shortName: ['Lyhyt nimi (Short name)', 'Näytetään etusivun näyttelytilassa, esim. "Maasturi"'],
      slug: ['URL-tunniste (URL slug)', 'Käytetään osoitteessa /autot?tyyppi=…'],
      silhouette: ['Siluettikuva (Silhouette image)', 'Läpinäkyvä PNG. Näytetään etusivulla ja autoissa, joilla ei vielä ole kuvia.'],
      order: ['Järjestys (Order)'],
      cars: ['Autot (Cars)'],
    },
  },
  'api::lead.lead': {
    list: ['name', 'phone', 'topic', 'channel', 'status'],
    mainField: 'name',
    sort: ['createdAt', 'DESC'],
    fields: {
      name: ['Nimi (Name)'], phone: ['Puhelin (Phone)'], email: ['Sähköposti (Email)'], topic: ['Aihe (Topic)'], message: ['Viesti (Message)'],
      carTitle: ['Auto, teksti (Car, text)'], car: ['Auto (Car)'], tradeIn: ['Vaihtoauto (Trade-in)'],
      calculation: ['Rahoituslaskelma (Finance calculation)'], sourcePage: ['Sivu (Page)'],
      channel: ['Kanava (Channel)', 'whatsapp = WhatsApp-lomake · form = yhteydenottolomake'],
      status: ['Tila (Status)', 'new = uusi · contacted = yhteydessä · closed = käsitelty'],
      internalNotes: ['Muistiinpanot (Notes)'],
    },
  },
  'api::page.page': {
    list: ['title', 'slug', 'updatedAt'],
    mainField: 'title',
    sort: ['title', 'ASC'],
    fields: {
      title: ['Otsikko (Title)', 'Sivun nimi hallinnassa ja selaimen välilehdellä.'],
      slug: ['URL-tunniste (URL slug)', 'Sivun osoite: /tunniste. Etusivun tunniste on "etusivu".'],
      seo: ['Hakukoneoptimointi (SEO)', 'Otsikko ja kuvaus hakutuloksiin ja jakolinkkeihin.'],
      blocks: ['Sisältölohkot (Content blocks)', 'Rakenna sivu osioista. Järjestä vetämällä.'],
    },
  },
  'api::service.service': {
    list: ['title', 'order', 'special'],
    mainField: 'title',
    sort: ['order', 'ASC'],
    fields: {
      title: ['Otsikko (Title)'],
      slug: ['URL-tunniste (URL slug)', 'Muodostuu otsikosta (paina ↻). Käytetään palvelun ankkurilinkissä.'],
      order: ['Järjestys (Order)', 'Pienin numero näytetään ensin'],
      summary: ['Lyhyt kuvaus (Summary)', 'Yhden lauseen tiivistys palvelulistaukseen.'],
      body: ['Sisältö (Body)'],
      facts: ['Tiedot (Facts)', 'Tieto–arvo-parit, esim. "Kesto – 1 h"'],
      special: ['Erikoistoiminto (Special)', 'none = ei mitään · trade-in-form = vaihtoautolomake'],
      ctaLabel: ['Painikkeen teksti (Button label)'],
      ctaUrl: ['Painikkeen osoite (Button URL)'],
    },
  },
  'api::global.global': {
    fields: {
      siteName: ['Sivuston nimi (Site name)'],
      tagline: ['Iskulause (Tagline)'],
      logo: ['Logo'],
      whatsappNumber: ['WhatsApp-numero (WhatsApp number)', 'Kansainvälisessä muodossa ilman +, esim. 358401234567'],
      phone: ['Puhelinnumero (Phone number)', 'Soittolinkkiin, esim. +358401234567'],
      phoneDisplay: ['Puhelin näyttömuodossa (Phone, display)', 'Esim. 040 123 4567'],
      email: ['Sähköposti (Email)'],
      street: ['Katuosoite (Street address)'],
      postalCode: ['Postinumero (Postal code)'],
      city: ['Postitoimipaikka (City)'],
      businessId: ['Y-tunnus (Business ID)'],
      invoicingAddress: ['Laskutusosoite (Invoicing address)'],
      mapsUrl: ['Karttalinkki (Maps link)', 'Avautuu Google Mapsiin'],
      mapEmbedUrl: ['Upotetun kartan osoite (Map embed URL)', 'Google Maps → Jaa → Upota kartta'],
      openingHours: ['Aukioloajat (Opening hours)'],
      openingHoursNote: ['Huomautus aukioloista (Opening hours note)', 'Esim. "Muina aikoina sopimuksen mukaan"'],
      navigation: ['Päävalikko (Main navigation)'],
      headerCta: ['Yläpalkin painike (Header button)'],
      footerTagline: ['Alatunnisteen teksti (Footer tagline)'],
      footerLinks: ['Alatunnisteen linkit (Footer links)'],
      whatsappTopics: ['WhatsApp-aiheet (WhatsApp topics)', 'Valmiit aiheet WhatsApp-lomakkeeseen'],
      defaultSeo: ['Oletus-SEO (Default SEO)', 'Käytetään, jos sivulla ei ole omaa SEO-tietoa.'],
    },
  },
  'api::finance-setting.finance-setting': {
    fields: {
      interestRate: ['Korko % (Interest rate)', 'Laskurin oletuskorko'],
      interestMin: ['Korko vähintään % (Interest, min)'],
      interestMax: ['Korko enintään % (Interest, max)'],
      openingFee: ['Avausmaksu € (Opening fee)'],
      monthlyFee: ['Tilinhoitomaksu €/kk (Monthly fee)'],
      defaultDownPct: ['Käsiraha oletuksena % (Down payment, default)'],
      maxDownPct: ['Käsiraha enintään % (Down payment, max)'],
      downStep: ['Käsirahan askel % (Down payment step)', 'Liukusäätimen askelväli'],
      defaultTermMonths: ['Laina-aika oletuksena kk (Term, default)'],
      termOptions: ['Laina-aikavaihtoehdot (Term options)', 'JSON-lista kuukausista, esim. [12, 24, 36, 48, 60, 72]'],
      maxBalloonPct: ['Viimeinen suurerä enintään % (Balloon, max)'],
      balloonStep: ['Suurerän askel % (Balloon step)'],
      partnerName: ['Rahoituskumppani (Finance partner)'],
      exampleNote: ['Esimerkkilaskelma (Example note)'],
      disclaimer: ['Vastuuvapauslauseke (Disclaimer)'],
    },
  },
  'api::car-detail-page.car-detail-page': {
    fields: {
      trustBadges: ['Luottamusmerkinnät (Trust badges)', 'Näytetään auton sivun yläosassa.'],
      specsTitle: ['Tekniset tiedot – otsikko (Specs heading)'],
      equipmentTitle: ['Varusteet – otsikko (Equipment heading)'],
      calculatorEyebrow: ['Laskurin yläotsikko (Calculator eyebrow)'],
      calculatorTitle: ['Laskurin otsikko (Calculator heading)'],
      descriptionTitle: ['Kuvauksen otsikko (Description heading)'],
      descriptionFallback: ['Kuvauksen oletusteksti (Description fallback)', 'Näytetään, jos autolla ei ole omaa kuvausta.'],
      similarTitle: ['Samanlaiset – otsikko (Similar cars heading)'],
      blocks: ['Sisältölohkot (Content blocks)'],
    },
  },
};

const LAYOUT_VERSION = 3;

export async function applyAdminLayouts(strapi: Core.Strapi) {
  const store = strapi.store({ type: 'plugin', name: 'aito-setup', key: 'admin-layouts' });
  const done = (await store.get({})) as any;
  if (done?.version >= LAYOUT_VERSION) return;

  const service = strapi.plugin('content-manager').service('content-types') as any;
  for (const [uid, layout] of Object.entries(LAYOUTS)) {
    try {
      const ct = strapi.contentType(uid as any);
      const conf = await service.findConfiguration(ct);
      const metadatas = { ...conf.metadatas };
      for (const [field, [label, description]] of Object.entries(layout.fields)) {
        const m = metadatas[field];
        if (!m) continue;
        if (m.edit) metadatas[field] = { ...m, edit: { ...m.edit, label, ...(description ? { description } : {}) } };
        if (m.list) metadatas[field] = { ...metadatas[field], list: { ...m.list, label } };
      }
      const settings = { ...conf.settings };
      if (layout.mainField) settings.mainField = layout.mainField;
      if (layout.sort && metadatas[layout.sort[0]]) {
        settings.defaultSortBy = layout.sort[0];
        settings.defaultSortOrder = layout.sort[1];
      }
      const list = (layout.list || conf.layouts.list).filter((f: string) => metadatas[f]);
      await service.updateConfiguration(ct, {
        settings,
        metadatas,
        layouts: { ...conf.layouts, list },
      });
    } catch (e) {
      strapi.log.warn(`[admin-setup] Could not configure ${uid}: ${(e as Error).message}`);
    }
  }
  await store.set({ value: { version: LAYOUT_VERSION, at: new Date().toISOString() } });
  strapi.log.info('[admin-setup] Admin labels and list views configured.');
}
