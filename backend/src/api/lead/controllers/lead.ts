import { factories } from '@strapi/strapi';
import crypto from 'node:crypto';

/**
 * Leads are only created through POST /api/leads/submit, which the Next.js
 * frontend calls from its own server route with a shared secret header.
 * Admins read and manage leads in the Strapi dashboard (Content Manager).
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

export default factories.createCoreController('api::lead.lead', ({ strapi }) => ({
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
    if (!name || !phone) return ctx.badRequest('Nimi ja puhelinnumero ovat pakollisia.');

    const email = str(body.email, 160);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return ctx.badRequest('Tarkista sähköpostiosoite.');

    const channel = body.channel === 'whatsapp' ? 'whatsapp' : 'form';

    let car: string | undefined;
    const carDocumentId = str(body.carDocumentId, 64);
    if (carDocumentId) {
      const found = await strapi.documents('api::car.car').findOne({ documentId: carDocumentId, status: 'published' });
      if (found) car = found.documentId;
    }

    const calculation = body.calculation && typeof body.calculation === 'object' ? body.calculation : undefined;

    const lead = await strapi.documents('api::lead.lead').create({
      data: {
        name,
        phone,
        email: email || null,
        topic: str(body.topic, 80),
        message: str(body.message, 4000),
        carTitle: str(body.carTitle, 200),
        tradeIn: str(body.tradeIn, 200),
        sourcePage: str(body.sourcePage, 200),
        calculation,
        channel,
        status: 'new',
        ...(car ? { car } : {}),
      } as any,
    });

    ctx.send({ ok: true, id: lead.documentId });
  },
}));
