#!/usr/bin/env node
/**
 * Creates backend/.env and frontend/.env.local with fresh random secrets.
 * Existing files are never overwritten.
 *
 *   node scripts/setup-env.mjs
 */
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rnd = (n = 16) => randomBytes(n).toString('base64');
const hex = (n = 24) => randomBytes(n).toString('hex');

const revalidate = hex();
const lead = hex();

const backendEnv = join(root, 'backend', '.env');
const frontendEnv = join(root, 'frontend', '.env.local');

let shared = { revalidate, lead };

if (existsSync(backendEnv)) {
  console.log('• backend/.env already exists – kept as is');
  const cur = readFileSync(backendEnv, 'utf8');
  shared = {
    revalidate: cur.match(/^REVALIDATE_SECRET=(.*)$/m)?.[1] || revalidate,
    lead: cur.match(/^LEAD_FORM_SECRET=(.*)$/m)?.[1] || lead,
  };
} else {
  let s = readFileSync(join(root, 'backend', '.env.example'), 'utf8');
  s = s
    .replace(/^APP_KEYS=.*$/m, `APP_KEYS=${[rnd(), rnd(), rnd(), rnd()].join(',')}`)
    .replace(/^API_TOKEN_SALT=.*$/m, `API_TOKEN_SALT=${rnd()}`)
    .replace(/^ADMIN_JWT_SECRET=.*$/m, `ADMIN_JWT_SECRET=${rnd()}`)
    .replace(/^TRANSFER_TOKEN_SALT=.*$/m, `TRANSFER_TOKEN_SALT=${rnd()}`)
    .replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${rnd()}`)
    .replace(/^ENCRYPTION_KEY=.*$/m, `ENCRYPTION_KEY=${rnd()}`)
    .replace(/^REVALIDATE_SECRET=.*$/m, `REVALIDATE_SECRET=${revalidate}`)
    .replace(/^LEAD_FORM_SECRET=.*$/m, `LEAD_FORM_SECRET=${lead}`);
  writeFileSync(backendEnv, s);
  console.log('✓ created backend/.env');
}

if (existsSync(frontendEnv)) {
  console.log('• frontend/.env.local already exists – kept as is');
} else {
  let s = readFileSync(join(root, 'frontend', '.env.example'), 'utf8');
  s = s
    .replace(/^REVALIDATE_SECRET=.*$/m, `REVALIDATE_SECRET=${shared.revalidate}`)
    .replace(/^LEAD_FORM_SECRET=.*$/m, `LEAD_FORM_SECRET=${shared.lead}`);
  writeFileSync(frontendEnv, s);
  console.log('✓ created frontend/.env.local');
}
