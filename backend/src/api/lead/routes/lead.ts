/**
 * Leads have no public CRUD routes. The only public entry point is /api/leads/submit,
 * protected by the LEAD_FORM_SECRET header and a simple rate limit.
 */
export default {
  routes: [
    {
      method: 'POST',
      path: '/leads/submit',
      handler: 'api::lead.lead.submit',
      config: { auth: false, policies: [] },
    },
  ],
};
