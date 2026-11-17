import { factories } from '@strapi/strapi';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { sendSalesEmail } from '../../../notifications/sales-email';

/**
 * Complaints (reklamaatiot) come from the form on /reklamaatiot as multipart
 * form data, so the customer can attach up to three photos. Created only
 * through POST /api/complaints/submit, which the Next.js frontend calls from its
 * own server route with the shared secret. Admins handle them in the Content
 * Manager; sales get an email (photos attached) and a WhatsApp alert.
 */

const hits = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;

const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 7 * 1024 * 1024; // all photos together

const RESOLUTIONS: Record<string, string> = {
  korjaus: 'Korjaus',
  hinnanalennus: 'Hinnanalennus',
  'kaupan-purku': 'Kaupan purku',
  'ei-tiedossa': 'En osaa sanoa',
};

function rateLimited(key: string) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length > RATE_MAX;
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

const str = (v: unknown, max: number) =>
  typeof v === 'string' ? v.trim().slice(0, max) : undefined;

const int = (v: unknown) => {
  const n = Number(String(v ?? '').replace(/\D/g, ''));
  return String(v ?? '').replace(/\D/g, '') && Number.isFinite(n) ? n : null;
};

// yyyy-mm-dd from <input type="date">; anything else is dropped.
const date = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
const fiDate = (v: string | null) => (v ? v.split('-').reverse().join('.') : undefined);
const km = (v: number | null) => (v === null ? undefined : `${v.toLocaleString('fi-FI')} km`);

export default factories.createCoreController('api::complaint.complaint', ({ strapi }) => ({
  async submit(ctx) {
    const secret = process.env.LEAD_FORM_SECRET;
    if (secret) {
      const given = String(ctx.request.headers['x-lead-secret'] || '');
      if (!safeEqual(given, secret)) return ctx.unauthorized('Invalid lead secret');
    }

    const forwarded = String(ctx.request.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (rateLimited(forwarded || ctx.request.ip)) return ctx.tooManyRequests('Liian monta lähetystä, yritä hetken päästä uudelleen.');

    const body: any = ctx.request.body || {};
    if (body.website) return ctx.send({ ok: true }); // honeypot

    const name = str(body.name, 120);
    const phone = str(body.phone, 40);
    const email = str(body.email, 160);
    const plate = str(body.plate, 12)?.toUpperCase();
    const description = str(body.description, 6000);
    if (!name || !phone || !email || !plate || !description) {
      return ctx.badRequest('Täytä pakolliset kentät: nimi, puhelin, sähköposti, rekisterinumero ja vian kuvaus.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return ctx.badRequest('Tarkista sähköpostiosoite.');

    const raw = (ctx.request as any).files?.photos;
    const photos: any[] = (Array.isArray(raw) ? raw : raw ? [raw] : []).filter((f) => f && f.size > 0);
    if (photos.length > MAX_PHOTOS) return ctx.badRequest(`Voit liittää enintään ${MAX_PHOTOS} kuvaa.`);
    if (photos.some((f) => !String(f.mimetype || '').startsWith('image/'))) return ctx.badRequest('Liitteiden tulee olla kuvia.');
    if (photos.reduce((s, f) => s + f.size, 0) > MAX_PHOTO_BYTES) return ctx.badRequest('Kuvien yhteiskoko saa olla enintään 7 Mt.');

    const resolution = RESOLUTIONS[body.resolution] ? body.resolution : 'ei-tiedossa';
    const data = {
      name, phone, email, plate, description,
      purchaseDate: date(body.purchaseDate),
      salesperson: str(body.salesperson, 120),
      mileageAtPurchase: int(body.mileageAtPurchase),
      mileageNow: int(body.mileageNow),
      faultStarted: date(body.faultStarted),
      repairsDone: str(body.repairsDone, 2000),
      resolution,
      sourcePage: str(body.sourcePage, 200),
      status: 'new',
    };

    const complaint = await strapi.documents('api::complaint.complaint').create({ data: data as any });

    // Read the photos before the upload provider consumes the temp files, so
    // the same bytes can go out as email attachments.
    const attachments = photos.map((f) => ({
      filename: f.originalFilename || 'kuva.jpg',
      content: fs.readFileSync(f.filepath),
      contentType: f.mimetype,
    }));

    if (photos.length) {
      await strapi.plugin('upload').service('upload')
        .upload({
          data: { refId: (complaint as any).id, ref: 'api::complaint.complaint', field: 'photos' },
          files: photos.map((f) => ({ filepath: f.filepath, originalFilename: f.originalFilename, mimetype: f.mimetype, size: f.size })),
        })
        .catch((err: unknown) => strapi.log.error(`complaint: photo upload failed – ${err instanceof Error ? err.message : err}`));
    }

    const rows: [string, string | undefined][] = [
      ['Rekisterinumero', plate],
      ['Ostopäivä', fiDate(data.purchaseDate)],
      ['Myyjä', data.salesperson],
      ['Km ostettaessa', km(data.mileageAtPurchase)],
      ['Km nyt', km(data.mileageNow)],
      ['Vika alkoi', fiDate(data.faultStarted)],
      ['Tehdyt korjaukset', data.repairsDone],
      ['Toivottu ratkaisu', RESOLUTIONS[resolution]],
      ['Kuvat', photos.length ? `${photos.length} liitteenä` : undefined],
    ];

    const submission = {
      name, phone, email, topic: 'Reklamaatio', message: description,
      sourcePage: data.sourcePage, documentId: complaint.documentId,
      rows: rows.filter((r): r is [string, string] => Boolean(r[1])),
    };

    // A failed alert must never lose the complaint, so each is caught and only recorded.
    const [emailNotified, notified] = await Promise.all([
      sendSalesEmail(strapi, submission, { label: 'Reklamaatio', uid: 'api::complaint.complaint' }, attachments).catch((err: unknown) => {
        strapi.log.error(`complaint: email notification failed – ${err instanceof Error ? err.message : err}`);
        return false;
      }),
      strapi.service('api::lead.lead')
        .notify({ name, phone, email, topic: 'Reklamaatio', carTitle: plate,
          carDetails: [fiDate(data.purchaseDate) && `ostettu ${fiDate(data.purchaseDate)}`, km(data.mileageNow)].filter(Boolean).join(' · '),
          message: description, sourcePage: data.sourcePage })
        .catch((err: unknown) => {
          strapi.log.error(`complaint: WhatsApp notification failed – ${err instanceof Error ? err.message : err}`);
          return false;
        }),
    ]);

    if (emailNotified || notified) {
      await strapi.documents('api::complaint.complaint').update({ documentId: complaint.documentId, data: { emailNotified, notified } as any });
    }

    ctx.send({ ok: true, id: complaint.documentId });
  },
}));
