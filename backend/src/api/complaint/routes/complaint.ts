/**
 * Complaints have no public CRUD routes. The only public entry point is
 * /api/complaints/submit, protected by the LEAD_FORM_SECRET header and a
 * simple rate limit -- the same contract as /api/leads/submit.
 */
export default {
  routes: [
    {
      method: 'POST',
      path: '/complaints/submit',
      handler: 'api::complaint.complaint.submit',
      config: { auth: false, policies: [] },
    },
  ],
};
