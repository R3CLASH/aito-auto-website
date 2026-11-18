import type { Core } from '@strapi/strapi';

/**
 * Is this request carrying a live Strapi admin session?
 *
 * Routes under src/api are always mounted on the content API -- Strapi forces
 * `type: 'content-api'` on them -- so a route there cannot be protected by the
 * admin's own auth middleware. The export endpoint therefore runs with
 * `auth: false` and checks the caller here instead, using the same session
 * manager the admin strategy uses (see @strapi/admin strategies/admin).
 *
 * The check mirrors that strategy: a valid access token, an active session
 * behind it, and an admin user who is still enabled.
 */
export async function isAuthenticatedAdmin(strapi: Core.Strapi, ctx: any): Promise<boolean> {
  const authorization: string | undefined = ctx.request?.header?.authorization;
  if (!authorization) return false;

  const parts = authorization.split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return false;

  const manager = (strapi as any).sessionManager;
  if (!manager) return false;

  try {
    const result = manager('admin').validateAccessToken(parts[1]);
    if (!result?.isValid) return false;

    if (!(await manager('admin').isSessionActive(result.payload.sessionId))) return false;

    const rawUserId = result.payload.userId;
    const numericUserId = Number(rawUserId);
    const userId =
      Number.isFinite(numericUserId) && String(numericUserId) === String(rawUserId)
        ? numericUserId
        : rawUserId;

    const user = await strapi.db.query('admin::user').findOne({ where: { id: userId } });
    return Boolean(user && user.isActive === true);
  } catch {
    return false;
  }
}
