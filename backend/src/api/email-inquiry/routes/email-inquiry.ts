/**
 * Email inquiries have no public CRUD routes. The only public entry point is
 * /api/email-inquiries/submit, protected by the LEAD_FORM_SECRET header and a
 * simple rate limit -- the same contract as /api/leads/submit.
 */
export default {
  routes: [
    {
      method: 'POST',
      path: '/email-inquiries/submit',
      handler: 'api::email-inquiry.email-inquiry.submit',
      config: { auth: false, policies: [] },
    },
  ],
};
