import { factories } from '@strapi/strapi';

type Inquiry = {
  name: string;
  phone: string;
  email: string;
  topic?: string;
  message?: string;
  carTitle?: string;
  tradeIn?: string;
  sourcePage?: string;
};

const row = (label: string, value?: string) => (value ? `${label}: ${value}` : null);

export default factories.createCoreService('api::email-inquiry.email-inquiry', ({ strapi }) => ({
  /**
   * Mails a new inquiry to sales. The recipient is INQUIRY_NOTIFY_TO, or the
   * address in Yleiset asetukset (Global) when that is unset. Returns false when
   * no recipient or no mail provider is configured, so the caller can record it.
   */
  async notify(inquiry: Inquiry) {
    let to = process.env.INQUIRY_NOTIFY_TO;
    if (!to) {
      const global = await strapi.documents('api::global.global').findFirst({ fields: ['email'] as any });
      to = (global as any)?.email || undefined;
    }
    if (!to) {
      strapi.log.warn('email-inquiry: no recipient (set INQUIRY_NOTIFY_TO or Global → email)');
      return false;
    }

    const lines = [
      `Nimi: ${inquiry.name}`,
      `Puhelin: ${inquiry.phone}`,
      `Sähköposti: ${inquiry.email}`,
      row('Aihe', inquiry.topic),
      row('Auto', inquiry.carTitle),
      row('Vaihtoauto', inquiry.tradeIn),
      row('Sivu', inquiry.sourcePage),
      '',
      'Viesti:',
      inquiry.message || '-',
    ].filter((l) => l !== null);

    await strapi.plugin('email').service('email').send({
      to,
      replyTo: inquiry.email,
      subject: `Sähköpostikysely: ${inquiry.carTitle || inquiry.topic || 'verkkosivut'}`,
      text: `Uusi sähköpostikysely verkkosivuilta.\n\n${lines.join('\n')}\n`,
    });

    strapi.log.info(`email-inquiry: notification sent to ${to}`);
    return true;
  },
}));
