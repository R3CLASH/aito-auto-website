import { NextResponse } from 'next/server';

const STRAPI_URL = (process.env.STRAPI_URL || 'http://localhost:1337').replace(/\/$/, '');

/** Forwards contact-form and WhatsApp leads to Strapi with the shared secret. */
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Virheellinen pyyntö' }, { status: 400 });
  }
  try {
    const res = await fetch(`${STRAPI_URL}/api/leads/submit`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-lead-secret': process.env.LEAD_FORM_SECRET || '',
        'x-forwarded-for': req.headers.get('x-forwarded-for') || '',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ error: data?.error?.message || 'Lähetys epäonnistui' }, { status: res.status });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Palvelin ei vastaa juuri nyt' }, { status: 502 });
  }
}
