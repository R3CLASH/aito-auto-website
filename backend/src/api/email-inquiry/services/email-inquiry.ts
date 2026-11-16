import { factories } from '@strapi/strapi';
import { sendSalesEmail, type Submission } from '../../../notifications/sales-email';

export default factories.createCoreService('api::email-inquiry.email-inquiry', ({ strapi }) => ({
  /** Mails a new inquiry to sales (see notifications/sales-email). */
  async notify(inquiry: Submission) {
    return sendSalesEmail(strapi, inquiry, { label: 'Sähköpostikysely', uid: 'api::email-inquiry.email-inquiry' });
  },
}));
