# Aito Auto Oy – website + CMS

```
aito-auto/
├── backend/    Strapi 5 CMS (PostgreSQL) – all content, cars, leads
├── frontend/   Next.js 15 website (Finnish) – reads everything from Strapi
├── scripts/    setup-env.mjs – generates matching secrets for both apps
├── ASIAKASOHJE.md   short admin guide for the client (Finnish)
└── docker-compose.yml   local PostgreSQL 16
```

## Requirements

- Node.js 20, 22 or 24 (LTS)
- PostgreSQL 14+ — either Docker (`docker compose up -d`) or a local install

## Getting started (local)

```bash
# 1. Database
docker compose up -d
#    (no Docker? create it yourself: user "aito", password "aito", database "aito_auto")

# 2. Env files with fresh secrets + install dependencies for both apps
npm run setup

# 3. Start Strapi (first start creates the tables and loads the demo content)
npm run dev:backend
#    → open http://localhost:1337/admin and create the first admin user

# 4. In a second terminal, start the website
npm run dev:frontend
#    → http://localhost:3000
```

The first Strapi start builds the admin panel, so it takes a minute. Demo content (22 cars, 6 brands, 4 vehicle types, all pages, services, settings) is loaded **only when the database is empty**. Set `SEED_DEMO_DATA=false` in `backend/.env` to start from an empty site instead.

## Production

```bash
npm run build                 # builds Strapi admin + Next.js
npm run start:backend         # Strapi on :1337 (NODE_ENV=production)
npm run start:frontend        # Next.js on :3000
```

Run both with a process manager (pm2/systemd) behind a reverse proxy (nginx/Caddy), e.g. `aitoauto.fi` → :3000 and `cms.aitoauto.fi` → :1337. Then set:

| File | Variable | Production value |
|---|---|---|
| `backend/.env` | `PUBLIC_URL` | `https://cms.aitoauto.fi` |
| `backend/.env` | `FRONTEND_URL` | `https://aitoauto.fi` (or `http://127.0.0.1:3000` on the same server) |
| `backend/.env` | `DATABASE_*` | production database |
| `frontend/.env.local` | `STRAPI_URL` | `http://127.0.0.1:1337` (or `https://cms.aitoauto.fi`) |
| `frontend/.env.local` | `NEXT_PUBLIC_SITE_URL` | `https://aitoauto.fi` |

`REVALIDATE_SECRET` and `LEAD_FORM_SECRET` must be identical in both env files (`npm run setup` handles that). The Next.js build doesn't need Strapi running; pages render on request and cache Strapi data for 5 minutes. Every save or publish in Strapi clears that cache straight away.

Uploaded images live in `backend/public/uploads`. Back up that folder together with the database, or switch Strapi to an S3/Cloudinary upload provider and list its hostname in `IMAGE_HOSTS` (frontend).

---

## How content is organised in Strapi

**Car hierarchy** (as requested):

| Level | Strapi type | Website URL |
|---|---|---|
| Main category | **Merkki (Brand)** – Honda | `/autot/honda` |
| Sub category | **Malli (Model)** – Accord, linked to its brand | `/autot/honda/accord` |
| Vehicle | **Auto (Vehicle)** – every individual car, linked to a model | `/autot/honda/accord/<slug>` |
| Filter | **Ajoneuvotyyppi (Vehicle type)** – Henkilöauto, Farmari… | `/autot?tyyppi=farmari` |

Visitors pick *type → brand → model* on `/autot`; every car shows its price and the monthly payment.

**Adding brands, models and cars** (step-by-step guide for the client in Finnish: `ASIAKASOHJE.md`):
1. *Merkki (Brand)* → Create → name (+ optional logo, order) → Save. Live at `/autot/<brand>` straight away; it appears in the filter once it has a published car.
2. *Malli (Model)* → Create → name + **brand** (required) → Save.
3. *Auto (Vehicle)* → Create (details below) → Publish.

Guard rails: a model can't be saved without a brand, and a car can't be published without a model, so nothing silently disappears from the site. Admin fields have Finnish labels and hints.

**Adding a car:** Content Manager → *Auto (Vehicle)* → Create. Fill in title, model, vehicle type, price, year, mileage, fuel, gearbox, and upload photos (the first photo is the cover). Highlights, equipment and extra specs are repeatable lists. Then **Publish**. Use *Draft* to prepare cars before showing them.
- `Sale status` → `reserved` shows a VARATTU badge; `sold` hides the car from listings (its page still works and says "myyty").
- `Featured` → shown in "Juuri pihaan" on the home page.
- `Badge` → small label on the card (UUSI, NELIVETO, ALV-VÄH.…).
- Until photos are uploaded, cars show the silhouette of their vehicle type.

**Pages are built from components.** Every page (*Sivu (Page)*: Etusivu, Autot, Palvelut, Meistä, Yhteystiedot, Tietosuojaseloste) has a **Blocks** dynamic zone. Editors can reorder, remove, edit and add sections:

| Component | What it is |
|---|---|
| Hero – näyttelytila | Home hero with the vehicle-type showroom |
| Pikahaku | Type → brand → model quick search |
| Iskulause | Big statement text |
| Merkkinauha | Scrolling brand ticker (brands come from Brand entries) |
| Ajoneuvotyypit | Vehicle-type cards with counts |
| Uusimmat autot | Featured / newest cars |
| Prosessi (tie) | "Kilometer posts" steps |
| Rahoitusnosto | Finance teaser with a live example payment |
| Palvelulista | Service rows |
| CTA-banneri | Call to action (WhatsApp or link) |
| Sivun otsikko | Page title band (dark/light) |
| Autolistaus + suodatus | The filterable car listing |
| Palvelut (kaikki) | All *Palvelu (Service)* entries with sticky index |
| UKK | FAQ accordion |
| Meistä – hero, Kuvanauha, Arvot, Tiimi, Tervetuloa käymään | About page sections |
| Yhteydenotto | Contact page: contact cards, form, map, opening hours |
| Vapaa teksti | Rich text (e.g. privacy policy) |

New pages: create a *Page* with a slug, add blocks, publish → it is live at `/<slug>`. Add it to the menu in *Global → Navigation*.

**Single types (settings):**
- **Yleiset asetukset (Global)** – logo, **WhatsApp number** (digits only, with country code, e.g. `358401234567`), phone, email, address, Y-tunnus, opening hours, menu, header button, footer links, WhatsApp form topics, default SEO, Google Maps embed URL.
- **Rahoitusasetukset (Finance)** – interest rate and range, opening fee, monthly fee, default down payment, loan terms, balloon limit, partner name, legal disclaimer. Used by every price card, the finance teaser and the calculator.
- **Auton sivu (Car page template)** – headings, trust badges and extra blocks shown on every car page.

**Leads – Yhteydenotto (Lead):** every contact-form message *and* every WhatsApp form submission is saved here with name, phone, email, topic, message, the car (linked), the finance calculation and the trade-in details. Use `status` (new → contacted → closed) and `internalNotes` to work through them. WhatsApp submissions also open WhatsApp with the full message pre-filled to the number in Global.

## Website features

- 6 pages + car pages, all Finnish, responsive from 320 px phones to desktop (tested at 320/360/390/414/768/1024/1440 px; no horizontal scrolling, 44 px tap targets, iPhone safe areas).
- Scroll animations on every device. A tiny script in `<head>` picks one engine before first paint:
  - **native CSS scroll-driven animations**: Chrome, Edge, Android and Safari 26+
  - **IntersectionObserver fallback**: older iPhones/iPads (iOS Safari < 26) and Firefox, which reveals the same sections and drives the header progress line, logo shrink and parallax.
  - On touch screens, the desktop hover effects play as you scroll instead (A·I·T·O letters fill, service numbers light up, car photos slide in), and buttons and cards have a pressed state.
  - With *Reduce motion* or JavaScript off, everything is simply shown without animation.
  - Add `?fx=io` to any URL to force the fallback engine in a desktop browser for testing.
- Phones: full-screen animated menu, sticky "price + WhatsApp" bar on car pages, swipeable filter rows, and a round WhatsApp button that keeps clear of the footer.
- Inventory filter type → brand → model with shareable URLs, sorting, "show more".
- Car page: gallery, specs, equipment, instalment calculator (down payment, term, balloon, interest → monthly, total cost, breakdown bar), "send calculation to WhatsApp".
- Floating WhatsApp button → popup form → saves the lead in Strapi and opens WhatsApp with all data.
- Contact form → saved in Strapi; live "open now" status in Finnish time.
- Trade-in plate form on the services page.
- SEO: per-page meta from Strapi, canonical URLs, sitemap.xml (pages, brands, models, cars), robots.txt, JSON-LD for cars and the FAQ.

## Security notes

- The public API is read-only (find/findOne on site content). Leads can only be created through `POST /api/leads/submit` with the `x-lead-secret` header, which the Next.js server adds. That endpoint also has a honeypot field and a per-IP rate limit.
- Car fields `registrationNumber` and `internalNotes` are private and never exposed by the API.

## Troubleshooting

- **Site shows "Hetkellinen häiriö"** → Strapi isn't reachable at `STRAPI_URL`.
- **Changes in Strapi don't appear right away** → check that `FRONTEND_URL` in `backend/.env` points to the running site and that the `REVALIDATE_SECRET` values match. Without that link, changes still appear within 5 minutes.
- **Lead form error 401** → `LEAD_FORM_SECRET` differs between the two env files.
- **Start over with fresh demo data** → drop and recreate the database (and empty `backend/public/uploads`), then start Strapi.
