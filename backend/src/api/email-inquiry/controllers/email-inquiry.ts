import { factories } from '@strapi/strapi';
import crypto from 'node:crypto';

/**
 * Email inquiries come from the "Kysy sähköpostilla" form on the website and are
 * kept apart from api::lead.lead so the sales inbox stays separate from WhatsApp
 * and contact-form leads. Created only through POST /api/email-inquiries/submit,
 * which the Next.js frontend calls from its own server route with a shared secret.
 */

const hits = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 8;

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

export default factories.createCoreController('api::email-inquiry.email-inquiry', ({ strapi }) => ({
  async submit(ctx) {
    const secret = process.env.LEAD_FORM_SECRET;
    if (secret) {
      const given = String(ctx.request.headers['x-lead-secret'] || '');
      if (!safeEqual(given, secret)) return ctx.unauthorized('Invalid lead secret');
    }

    const forwarded = String(ctx.request.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (rateLimited(forwarded || ctx.request.ip)) return ctx.tooManyRequests('Liian monta viestiä, yritä hetken päästä uudelleen.');

    const body = (ctx.request.body && (ctx.request.body as any).data) || ctx.request.body || {};

    // Honeypot: bots fill every field.
    if (body.website) return ctx.send({ ok: true });

    const name = str(body.name, 120);
    const phone = str(body.phone, 40);
    const email = str(body.email, 160);
    if (!name || !phone) return ctx.badRequest('Nimi ja puhelinnumero ovat pakollisia.');
    // Unlike a WhatsApp lead this one is answered by email, so the address is required.
    if (!email) return ctx.badRequest('Sähköpostiosoite on pakollinen.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return ctx.badRequest('Tarkista sähköpostiosoite.');

    let car: string | undefined;
    const carDocumentId = str(body.carDocumentId, 64);
    if (carDocumentId) {
      const found = await strapi.documents('api::car.car').findOne({ documentId: carDocumentId, status: 'published' });
      if (found) car = found.documentId;
    }

    const calculation = body.calculation && typeof body.calculation === 'object' ? body.calculation : undefined;

    const data = {
      name,
      phone,
      email,
      topic: str(body.topic, 80),
      message: str(body.message, 4000),
      carTitle: str(body.carTitle, 200),
      tradeIn: str(body.tradeIn, 200),
      sourcePage: str(body.sourcePage, 200),
      calculation,
      status: 'new',
      notified: false,
      ...(car ? { car } : {}),
    };

    const inquiry = await strapi.documents('api::email-inquiry.email-inquiry').create({ data: data as any });

    // Notify sales. A mail failure must never lose the inquiry, so it is caught
    // and only recorded on the entry via `notified`.
    const notified = await strapi
      .service('api::email-inquiry.email-inquiry')
      .notify(data)
      .catch((err: unknown) => {
        strapi.log.error(`email-inquiry: notification failed – ${err instanceof Error ? err.message : err}`);
        return false;
      });

    if (notified) {
      await strapi.documents('api::email-inquiry.email-inquiry').update({
        documentId: inquiry.documentId,
        data: { notified: true } as any,
      });
    }

    ctx.send({ ok: true, id: inquiry.documentId });
  },
}));
