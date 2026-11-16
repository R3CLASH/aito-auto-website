import { factories } from '@strapi/strapi';

type Lead = {
  name: string;
  phone: string;
  email?: string;
  topic?: string;
  message?: string;
  carTitle?: string;
  carDetails?: string;
  tradeIn?: string;
  sourcePage?: string;
};

// Template parameters may not contain newlines, tabs or more than four spaces
// in a row, and Meta rejects an empty one.
const param = (v: string | undefined, max: number) => {
  const flat = (v || '').replace(/\s*[\r\n\t]+\s*/g, ' · ').replace(/ {2,}/g, ' ').trim();
  return flat ? (flat.length > max ? `${flat.slice(0, max - 1)}…` : flat) : '-';
};

const join = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(' · ');

export default factories.createCoreService('api::lead.lead', ({ strapi }) => ({
  /**
   * Sends a new lead to sales as a WhatsApp template message through the Cloud
   * API. Messages come from WHATSAPP_PHONE_NUMBER_ID (a sender number of its
   * own -- a number cannot message itself) to WHATSAPP_NOTIFY_TO, the business
   * number staff read in the WhatsApp Business app.
   *
   * The approved template takes five body parameters:
   *   {{1}} topic and page  {{2}} name  {{3}} phone and email
   *   {{4}} car, its price line, link and calculation, trade-in  {{5}} message
   *
   * Returns false when WhatsApp is not configured, so the caller can record it.
   */
  async notify(lead: Lead) {
    const token = process.env.WHATSAPP_TOKEN;
    const from = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const to = (process.env.WHATSAPP_NOTIFY_TO || '').replace(/\D/g, '');
    const template = process.env.WHATSAPP_TEMPLATE;
    if (!token || !from || !to || !template) return false;

    const version = process.env.WHATSAPP_API_VERSION || 'v25.0';
    const values = [
      param(join(lead.topic, lead.sourcePage), 120),
      param(lead.name, 120),
      param(join(lead.phone, lead.email), 200),
      param(join(lead.carTitle, lead.carDetails, lead.tradeIn && `${lead.topic === 'Myy auto' ? 'Myytävä auto' : 'Vaihtoauto'}: ${lead.tradeIn}`), 500),
      param(lead.message, 600),
    ];

    const res = await fetch(`https://graph.facebook.com/${version}/${from}/messages`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'fi' },
          components: [{ type: 'body', parameters: values.map((text) => ({ type: 'text', text })) }],
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Cloud API ${res.status}: ${detail.slice(0, 500)}`);
    }

    strapi.log.info(`lead: WhatsApp notification sent to ${to}`);
    return true;
  },
}));
