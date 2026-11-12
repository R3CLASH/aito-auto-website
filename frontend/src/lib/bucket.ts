import 'server-only';
import { createHash, createHmac } from 'node:crypto';

/**
 * Minimal SigV4 signer for the Railway bucket (S3-compatible).
 *
 * The bucket is private, so media is read with a signed request and served
 * from this app instead of being exposed directly. Keeping it on our own
 * origin also means /uploads/* never touches Strapi, which is what lets the
 * CMS sleep without visitors paying for the wake-up.
 */

const ENDPOINT = (process.env.BUCKET_ENDPOINT || '').replace(/\/$/, '');
const NAME = process.env.BUCKET_NAME || '';
const REGION = process.env.BUCKET_REGION || 'auto';
const KEY_ID = process.env.BUCKET_ACCESS_KEY_ID || '';
const SECRET = process.env.BUCKET_SECRET_ACCESS_KEY || '';

export const bucketConfigured = Boolean(ENDPOINT && NAME && KEY_ID && SECRET);

const host = () => `${NAME}.${ENDPOINT.split('://')[1]}`;
const hmac = (key: Buffer | string, msg: string) => createHmac('sha256', key).update(msg).digest();
const sha256 = (msg: string) => createHash('sha256').update(msg).digest('hex');

/** Signed GET for one object. Returns the raw fetch Response so the body can stream. */
export function signedGet(key: string): Promise<Response> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const stamp = amzDate.slice(0, 8);
  const empty = sha256('');
  const path = `/${key.split('/').map(encodeURIComponent).join('/')}`;

  const canonical = [
    'GET', path, '',
    `host:${host()}`, `x-amz-content-sha256:${empty}`, `x-amz-date:${amzDate}`, '',
    'host;x-amz-content-sha256;x-amz-date', empty,
  ].join('\n');

  const scope = `${stamp}/${REGION}/s3/aws4_request`;
  const toSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(canonical)].join('\n');
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${SECRET}`, stamp), REGION), 's3'), 'aws4_request');
  const signature = createHmac('sha256', signingKey).update(toSign).digest('hex');

  return fetch(`https://${host()}${path}`, {
    headers: {
      Authorization:
        `AWS4-HMAC-SHA256 Credential=${KEY_ID}/${scope}, ` +
        'SignedHeaders=host;x-amz-content-sha256;x-amz-date, ' +
        `Signature=${signature}`,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': empty,
    },
    cache: 'no-store',
  });
}
