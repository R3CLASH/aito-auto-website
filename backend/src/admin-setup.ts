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
      title: ['Otsikko', 'Esim. "Honda Accord 2.0 e:HEV Executive". Näkyy hakukoneissa ja WhatsApp-viesteissä.'],
      slug: ['URL-tunniste', 'Muodostuu otsikosta (paina ↻). Auton osoite: /autot/merkki/malli/tunniste'],
      car_model: ['Malli', 'Pakollinen. Merkki tulee mallin kautta. Uusi malli: Content Manager → Malli (Model).'],
      vehicle_type: ['Ajoneuvotyyppi', 'Henkilöauto, Farmari, Maasturi / SUV, Pakettiauto… Käytetään suodattimessa.'],
      variant: ['Versio / moottori', 'Esim. "2.0 e:HEV Executive"'],
      price: ['Hinta (€)', 'Kuukausierä lasketaan automaattisesti Rahoitusasetusten mukaan.'],
      year: ['Vuosimalli'],
      mileage: ['Mittarilukema (km)'],
      fuel: ['Käyttövoima'],
      transmission: ['Vaihteisto'],
      drivetrain: ['Vetotapa'],
      powerKw: ['Teho (kW)'],
      color: ['Väri'],
      inspectedUntil: ['Katsastettu', 'Esim. 05/2027'],
      co2: ['CO₂ (g/km)'],
      badge: ['Merkintä kortissa', 'Lyhyt tarra kuvan päällä, esim. UUSI, NELIVETO, ALV-VÄH.'],
      featured: ['Nosto etusivulle', 'Näytetään etusivun "Juuri pihaan" -osiossa.'],
      vatDeductible: ['ALV-vähennyskelpoinen'],
      saleStatus: ['Myyntitila', 'available = myynnissä · reserved = varattu (VARATTU-merkintä) · sold = myyty (piilotetaan listauksista)'],
      images: ['Kuvat', 'Ensimmäinen kuva on kansikuva. Järjestä vetämällä. Ilman kuvia näytetään ajoneuvotyypin siluetti.'],
      highlights: ['Kohokohdat', 'Esim. Huoltokirja, 2 avainta'],
      equipment: ['Varusteet'],
      extraSpecs: ['Lisätiedot', 'Vapaat tieto–arvo-parit tekniset tiedot -taulukkoon'],
      description: ['Myyjän kuvaus'],
      registrationNumber: ['Rekisterinumero', 'Sisäinen – ei näy sivustolla'],
      internalNotes: ['Sisäiset muistiinpanot', 'Ei näy sivustolla'],
    },
  },
  'api::car-model.car-model': {
    list: ['name', 'brand'],
    mainField: 'name',
    sort: ['name', 'ASC'],
    fields: {
      name: ['Mallin nimi', 'Esim. Accord, CX-5, Octavia Combi'],
      slug: ['URL-tunniste', 'Muodostuu nimestä (paina ↻). Osoite: /autot/merkki/malli'],
      brand: ['Merkki', 'Pakollinen'],
      cars: ['Autot'],
    },
  },
  'api::brand.brand': {
    list: ['name', 'order', 'logo'],
    mainField: 'name',
    sort: ['order', 'ASC'],
    fields: {
      name: ['Merkin nimi', 'Esim. Honda'],
      slug: ['URL-tunniste', 'Muodostuu nimestä (paina ↻). Osoite: /autot/merkki'],
      logo: ['Logo', 'Valinnainen. Näytetään merkin listaussivulla.'],
      order: ['Järjestys', 'Pienin numero näytetään ensin'],
      car_models: ['Mallit'],
    },
  },
  'api::vehicle-type.vehicle-type': {
    list: ['name', 'order', 'silhouette'],
    mainField: 'name',
    sort: ['order', 'ASC'],
    fields: {
      name: ['Nimi'],
      shortName: ['Lyhyt nimi', 'Näytetään etusivun näyttelytilassa, esim. "Maasturi"'],
      slug: ['URL-tunniste', 'Käytetään osoitteessa /autot?tyyppi=…'],
      silhouette: ['Siluettikuva', 'Läpinäkyvä PNG. Näytetään etusivulla ja autoissa, joilla ei vielä ole kuvia.'],
      order: ['Järjestys'],
      cars: ['Autot'],
    },
  },
  'api::lead.lead': {
    list: ['name', 'phone', 'topic', 'channel', 'status'],
    mainField: 'name',
    sort: ['createdAt', 'DESC'],
    fields: {
      name: ['Nimi'], phone: ['Puhelin'], email: ['Sähköposti'], topic: ['Aihe'], message: ['Viesti'],
      carTitle: ['Auto (teksti)'], car: ['Auto'], tradeIn: ['Vaihtoauto'],
      calculation: ['Rahoituslaskelma'], sourcePage: ['Sivu'],
      channel: ['Kanava', 'whatsapp = WhatsApp-lomake · form = yhteydenottolomake'],
      status: ['Tila', 'new = uusi · contacted = yhteydessä · closed = käsitelty'],
      internalNotes: ['Muistiinpanot'],
    },
  },
};

const LAYOUT_VERSION = 1;

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
