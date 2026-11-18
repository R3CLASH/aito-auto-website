/**
 * CSV export of the whole car catalogue.
 *
 * `auth: false` only means the content API's own auth is skipped -- routes
 * under src/api are always content-API routes, so the admin's auth middleware
 * cannot guard them. The controller checks for a live admin session itself
 * before it returns a single row.
 *
 * This file is named so it sorts ahead of car.ts: the core router's
 * /cars/:documentId would otherwise match "export" as an id.
 */
export default {
  routes: [
    {
      method: 'GET',
      path: '/cars/export',
      handler: 'api::car.car.exportCsv',
      config: { auth: false, policies: [] },
    },
  ],
};
