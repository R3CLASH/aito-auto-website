/**
 * Demo content for Aito Auto Oy. Loaded once by the seeder (src/seed/index.ts)
 * when the database is empty. Everything here is editable afterwards in the
 * Strapi admin. Text in [brackets] is a placeholder to replace with real info.
 */

const p = (text: string) => ({ type: 'paragraph', children: [{ type: 'text', text }] });
const h = (text: string, level = 2) => ({ type: 'heading', level, children: [{ type: 'text', text }] });

export const vehicleTypes = [
  { name: 'Henkilöauto', shortName: 'Henkilöauto', slug: 'henkiloauto', order: 1, image: 'sedan.png' },
  { name: 'Farmari', shortName: 'Farmari', slug: 'farmari', order: 2, image: 'farmari.png' },
  { name: 'Maasturi / SUV', shortName: 'Maasturi', slug: 'maasturi-suv', order: 3, image: 'suv.png' },
  { name: 'Pakettiauto', shortName: 'Paketti', slug: 'pakettiauto', order: 4, image: 'paketti.png' },
];

export const brands = [
  { name: 'Honda', slug: 'honda', order: 1 },
  { name: 'Toyota', slug: 'toyota', order: 2 },
  { name: 'Škoda', slug: 'skoda', order: 3 },
  { name: 'Volkswagen', slug: 'volkswagen', order: 4 },
  { name: 'Volvo', slug: 'volvo', order: 5 },
  { name: 'Kia', slug: 'kia', order: 6 },
];

type CarRow = [variant: string, year: number, km: number, fuel: string, gear: string, price: number];

/** brand slug, model name, model slug, vehicle type slug, cars */
export const models: [string, string, string, string, CarRow[]][] = [
  ['honda', 'Accord', 'accord', 'henkiloauto', [
    ['2.0 e:HEV Executive', 2021, 58000, 'Hybridi', 'Automaatti', 27900],
    ['2.0 e:HEV Elegance', 2020, 74000, 'Hybridi', 'Automaatti', 25400],
    ['2.0 i-MMD Lifestyle', 2019, 96000, 'Hybridi', 'Automaatti', 21900],
    ['1.5 VTEC Turbo Sport', 2018, 121000, 'Bensiini', 'Automaatti', 17900],
    ['2.4 Executive', 2016, 158000, 'Bensiini', 'Automaatti', 12900],
  ]],
  ['honda', 'Civic', 'civic', 'henkiloauto', [
    ['1.0 VTEC Turbo Elegance', 2020, 52000, 'Bensiini', 'Manuaali', 18900],
    ['2.0 e:HEV Sport', 2023, 21000, 'Hybridi', 'Automaatti', 31900],
  ]],
  ['honda', 'CR-V', 'cr-v', 'maasturi-suv', [
    ['2.0 Hybrid AWD Executive', 2021, 63000, 'Hybridi', 'Automaatti', 34900],
  ]],
  ['toyota', 'Corolla Touring Sports', 'corolla-touring-sports', 'farmari', [
    ['1.8 Hybrid Active', 2021, 69000, 'Hybridi', 'Automaatti', 22900],
    ['2.0 Hybrid GR Sport', 2022, 38000, 'Hybridi', 'Automaatti', 29900],
  ]],
  ['toyota', 'RAV4', 'rav4', 'maasturi-suv', [
    ['2.5 Hybrid AWD Active', 2022, 41000, 'Hybridi', 'Automaatti', 36900],
  ]],
  ['toyota', 'Proace', 'proace', 'pakettiauto', [
    ['2.0 D-4D L2 Active', 2020, 104000, 'Diesel', 'Manuaali', 21500],
  ]],
  ['skoda', 'Octavia Combi', 'octavia-combi', 'farmari', [
    ['2.0 TDI Style DSG', 2020, 112000, 'Diesel', 'Automaatti', 18490],
    ['1.4 TSI iV Style', 2021, 67000, 'Lataushybridi', 'Automaatti', 24900],
  ]],
  ['skoda', 'Kodiaq', 'kodiaq', 'maasturi-suv', [
    ['2.0 TDI 4x4 Style', 2019, 129000, 'Diesel', 'Automaatti', 26900],
  ]],
  ['volkswagen', 'Golf', 'golf', 'henkiloauto', [
    ['1.5 eTSI Life', 2021, 48000, 'Bensiini', 'Automaatti', 21900],
  ]],
  ['volkswagen', 'Passat Variant', 'passat-variant', 'farmari', [
    ['1.4 TSI GTE', 2019, 98000, 'Lataushybridi', 'Automaatti', 22400],
  ]],
  ['volkswagen', 'Transporter', 'transporter', 'pakettiauto', [
    ['2.0 TDI pitkä', 2019, 138000, 'Diesel', 'Manuaali', 22900],
  ]],
  ['volvo', 'V60', 'v60', 'farmari', [
    ['T6 AWD Recharge Inscription', 2020, 89000, 'Lataushybridi', 'Automaatti', 31500],
  ]],
  ['volvo', 'XC60', 'xc60', 'maasturi-suv', [
    ['B4 AWD Momentum', 2021, 72000, 'Mild hybrid', 'Automaatti', 38900],
  ]],
  ['kia', 'Ceed SW', 'ceed-sw', 'farmari', [
    ['1.6 PHEV Business Luxury', 2021, 59000, 'Lataushybridi', 'Automaatti', 22900],
  ]],
  ['kia', 'Sportage', 'sportage', 'maasturi-suv', [
    ['1.6 T-GDI HEV AWD', 2023, 26000, 'Hybridi', 'Automaatti', 37900],
  ]],
];

/** Extra detail for the showcase car (first Honda Accord). */
export const showcaseCar = {
  badge: 'UUSI',
  powerKw: 135,
  color: '[Väri]',
  inspectedUntil: '[kk/vvvv]',
  drivetrain: 'Etuveto',
  highlights: ['Huoltokirja', '2 avainta', 'Vaihtoauto käy'],
  equipment: [
    'Mukautuva vakionopeudensäädin', 'Nahkaverhoilu', 'Istuinlämmittimet', 'Peruutuskamera',
    'Apple CarPlay / Android Auto', 'LED-ajovalot', 'Kaistavahti', 'Avaimeton käynnistys',
  ],
  extraSpecs: [{ label: 'CO₂ (WLTP)', value: '[xxx] g/km' }],
  description: [
    p('[Myyjän vapaa kuvaus autosta – esim. huoltohistoria, omistajamäärä, renkaat ja mahdolliset huomiot kunnosta.]'),
    p('Kaikki autot tarkastetaan ennen myyntiä. Pyydä halutessasi kuntoraportti ja huoltohistoria WhatsAppissa.'),
  ],
};

/** Featured on the home page ("Juuri pihaan"): [model slug, variant, badge] */
export const featured: [string, string, string][] = [
  ['accord', '2.0 e:HEV Executive', 'UUSI'],
  ['octavia-combi', '2.0 TDI Style DSG', 'UUSI'],
  ['rav4', '2.5 Hybrid AWD Active', 'NELIVETO'],
  ['transporter', '2.0 TDI pitkä', 'ALV-VÄH.'],
];

export const global = {
  siteName: 'Aito Auto Oy',
  tagline: 'Aitoja autoja, rehellisiä hintoja.',
  whatsappNumber: '358000000000',
  phone: '+358000000000',
  phoneDisplay: '+358 [puhelinnumero]',
  email: 'myynti@aitoauto.fi',
  street: '[Katuosoite]',
  postalCode: '[00000]',
  city: '[Kaupunki]',
  businessId: '[0000000-0]',
  invoicingAddress: '[verkkolaskuosoite]',
  mapsUrl: 'https://maps.google.com',
  mapEmbedUrl: '',
  openingHours: [
    { dayIndex: 1, label: 'Maanantai', opens: '10:00', closes: '18:00', closed: false },
    { dayIndex: 2, label: 'Tiistai', opens: '10:00', closes: '18:00', closed: false },
    { dayIndex: 3, label: 'Keskiviikko', opens: '10:00', closes: '18:00', closed: false },
    { dayIndex: 4, label: 'Torstai', opens: '10:00', closes: '18:00', closed: false },
    { dayIndex: 5, label: 'Perjantai', opens: '10:00', closes: '18:00', closed: false },
    { dayIndex: 6, label: 'Lauantai', opens: '11:00', closes: '15:00', closed: false },
    { dayIndex: 7, label: 'Sunnuntai', opens: '', closes: '', closed: true },
  ],
  openingHoursNote: 'Muina aikoina sopimuksen mukaan.',
  navigation: [
    { label: 'Etusivu', url: '/' },
    { label: 'Autot', url: '/autot' },
    { label: 'Palvelut', url: '/palvelut' },
    { label: 'Meistä', url: '/meista' },
    { label: 'Yhteystiedot', url: '/yhteystiedot' },
  ],
  headerCta: { label: 'Selaa autoja', url: '/autot' },
  footerTagline: 'Aitoja autoja, rehellisiä hintoja.',
  footerLinks: [
    { label: 'Tietosuojaseloste', url: '/tietosuojaseloste' },
  ],
  whatsappTopics: ['Kiinnostunut autosta', 'Koeajo', 'Rahoitus', 'Vaihtoauto', 'Hakutoive', 'Muu asia'].map((label) => ({ label })),
  defaultSeo: {
    metaTitle: 'Aito Auto Oy – Laadukkaat vaihtoautot',
    metaDescription: 'Huolella valitut vaihtoautot, selkeät hinnat ja rahoitus, jonka kuukausierän näet heti.',
  },
};

export const finance = {
  interestRate: 4.9, interestMin: 1.9, interestMax: 9.9,
  openingFee: 190, monthlyFee: 9,
  defaultDownPct: 10, maxDownPct: 50, downStep: 5,
  defaultTermMonths: 60, termOptions: [24, 36, 48, 60, 72, 84],
  maxBalloonPct: 35, balloonStep: 5,
  partnerName: '[Rahoitusyhtiö]',
  exampleNote: 'Todellinen vuosikorko [x,xx] % · luottohinta [xx xxx] €',
  disclaimer: 'Laskelma on suuntaa-antava esimerkki. Lopulliset ehdot, todellinen vuosikorko ja luottopäätös rahoittajalta [rahoitusyhtiö]. Avausmaksu 190 €, käsittelymaksu 9 €/kk.',
};

export const carDetailPage = {
  trustBadges: ['Tarkastettu ennen myyntiä', 'Vaihtoauto käy maksuksi', 'Rahoitus heti'].map((label) => ({ label })),
  specsTitle: 'Perustiedot',
  equipmentTitle: 'Mukana',
  calculatorEyebrow: 'Osamaksulaskuri',
  calculatorTitle: 'Säädä erä sopivaksi',
  descriptionTitle: 'Myyjän kuvaus',
  descriptionFallback: 'Kaikki autot tarkastetaan ennen myyntiä. Pyydä halutessasi kuntoraportti ja huoltohistoria WhatsAppissa.',
  similarTitle: 'Muut samanlaiset',
  blocks: [
    { __component: 'sections.cta-banner', title: 'Etsitkö jotain tiettyä?', highlight: 'Kerro – me etsimme.', buttonLabel: 'Lähetä toive WhatsAppiin', action: 'whatsapp' },
  ],
};

export const services = [
  { title: 'Rahoitus', slug: 'rahoitus', order: 1, special: 'none',
    summary: 'Joustava autolaina tai osamaksu, myös loppuerällä.',
    body: 'Osamaksu tai loppuerärahoitus, joka sovitetaan omaan budjettiisi. Jokaisen auton sivulla on laskuri, josta näet kuukausierän ennen kuin otat yhteyttä.',
    facts: [{ label: 'Laina-aika', value: '12–84 kk' }, { label: 'Käsiraha', value: 'Alkaen 0 € [rahoittajan ehdoin]' }, { label: 'Kumppani', value: '[Rahoitusyhtiö]' }],
    ctaLabel: 'Selaa autoja ja laske erä', ctaUrl: '/autot' },
  { title: 'Vaihtoauto', slug: 'vaihtoauto', order: 2, special: 'trade-in-form',
    summary: 'Nykyinen autosi käy maksusta – arvio nopeasti.',
    body: 'Nykyinen autosi käy osana kauppahintaa. Anna rekisterinumero ja kilometrit, niin teemme alustavan hyvitysarvion.', facts: [] },
  { title: 'Takuu', slug: 'takuu', order: 3, special: 'none',
    summary: 'Lisäturvaa ostoksellesi.',
    body: 'Lisäturvaa ostoksellesi [takuuyhtiön] kautta, valittavissa 12, 24 tai 36 kuukauden jaksona. Takuun ehdot ja hinnat kerrotaan aina ennen kauppaa.', facts: [] },
  { title: 'Huolto & tarkastus', slug: 'huolto-ja-tarkastus', order: 4, special: 'none',
    summary: 'Jokainen auto tarkastetaan ennen myyntiä.',
    body: 'Jokainen auto käy läpi tarkastuksen ennen myyntiin tuloa. Kerromme havainnot avoimesti, ja tarvittaessa huollamme auton ennen luovutusta.', facts: [] },
  { title: 'Kotiintoimitus', slug: 'kotiintoimitus', order: 5, special: 'none',
    summary: 'Tuomme auton ovellesi rekisteröitynä.',
    body: 'Asutko kauempana? Toimitamme auton kotiovellesi koko Suomeen. Toimituksen hinta [hinta / etäisyyden mukaan].', facts: [] },
  { title: 'Rekisteröinti & vakuutus', slug: 'rekisterointi-ja-vakuutus', order: 6, special: 'none',
    summary: 'Paperit hoidettuna puolestasi.',
    body: 'Hoidamme omistajanvaihdoksen ja rekisteröinnin puolestasi. Liikennevakuutuksen voi järjestää samalla kertaa, joten auto on ajokunnossa heti.', facts: [] },
];

const ctaBanner = { __component: 'sections.cta-banner', title: 'Etsitkö jotain tiettyä?', highlight: 'Kerro – me etsimme.', buttonLabel: 'Lähetä toive WhatsAppiin', action: 'whatsapp' };

export const pages = [
  {
    title: 'Etusivu', slug: 'etusivu',
    seo: { metaTitle: 'Aito Auto Oy – Aito auto. Aito hinta.', metaDescription: 'Huolella valitut vaihtoautot, selkeät hinnat ja rahoitus, jonka kuukausierän näet heti.' },
    blocks: [
      { __component: 'sections.hero-showroom', eyebrow: 'Vaihtoautoliike · [Kaupunki]', titleLine1: 'Aito auto.', titleLine2: 'Aito hinta.',
        description: 'Huolella valitut vaihtoautot, selkeät hinnat ja rahoitus, jonka kuukausierän näet heti. Ei piilokuluja, ei yllätyksiä.',
        primaryCta: { label: 'Selaa autoja', url: '/autot' }, secondaryCta: { label: 'Laske kuukausierä', url: '/autot' },
        showroomLabel: 'Näyttelytila', plateText: 'AIT-024' },
      { __component: 'sections.quick-search', title: 'Löydä autosi kolmella valinnalla', hint: 'Tyyppi → Merkki → Malli', buttonLabel: 'Näytä autot' },
      { __component: 'sections.statement', term: 'aito /ˈɑi̯to/', definition: 'adj. oikea, väärentämätön',
        text: 'Nimemme on lupaus. Jokaisen auton historia tarkistetaan, kunto kerrotaan suoraan ja hinta on', highlight: 'se mikä lukee', muted: '– ilman kikkailua.' },
      { __component: 'sections.brand-ticker', label: 'Myynnissä olevat merkit' },
      { __component: 'sections.vehicle-types-grid', eyebrow: '01 — Ajoneuvotyypit', title: 'Mihin käyttöön?', linkLabel: 'Kaikki autot →' },
      { __component: 'sections.latest-cars', eyebrow: '02 — Uudet tulokkaat', title: 'Juuri pihaan',
        description: 'Kuukausierä näkyy jokaisessa autossa heti – esimerkki 10 % käsirahalla ja 60 kk laina-ajalla.', limit: 4, featuredOnly: true },
      { __component: 'sections.process-road', eyebrow: '03 — Näin se menee', title: 'Neljä kilometripylvästä kotipihaasi', steps: [
        { title: 'Valitse auto', text: 'Selaa tyypin, merkin ja mallin mukaan. Hinta ja kuukausierä näkyvät heti.' },
        { title: 'Kysy WhatsAppissa', text: 'Lähetä kysymys suoraan auton sivulta. Tiedot kulkevat mukana valmiiksi.' },
        { title: 'Koeaja rauhassa', text: 'Varaa aika, tule paikan päälle ja tutustu autoon ilman kiirettä.' },
        { title: 'Aja kotiin', text: 'Hoidamme rahoituksen, vaihtoauton ja paperit. Sinä saat avaimet.' },
      ] },
      { __component: 'sections.finance-teaser', eyebrow: '04 — Rahoitus', title: 'Tiedä erä ennen kuin kysyt',
        text: 'Jokaisella auton sivulla on laskuri: säädä käsirahaa, laina-aikaa ja loppuerää ja näe kuukausierä heti. Kun summa tuntuu oikealta, lähetä laskelma meille yhdellä napautuksella.',
        exampleLabel: 'Honda Accord', examplePrice: 27900, buttonLabel: 'Kokeile laskuria', buttonUrl: '/autot/honda/accord' },
      { __component: 'sections.services-list', eyebrow: '05 — Palvelut', title: 'Kaikki samasta paikasta', linkLabel: 'Kaikki palvelut →', linkUrl: '/palvelut', rows: [
        { title: 'Rahoitus', text: 'Joustava autolaina tai osamaksu, myös loppuerällä.', url: '/palvelut#rahoitus' },
        { title: 'Vaihtoauto', text: 'Nykyinen autosi käy maksusta – arvio nopeasti.', url: '/palvelut#vaihtoauto' },
        { title: 'Takuu & huolto', text: 'Lisäturvaa ostoksellesi ja huolto hoidettuna.', url: '/palvelut#takuu' },
        { title: 'Kotiintoimitus', text: 'Tuomme auton ovellesi rekisteröitynä.', url: '/palvelut#kotiintoimitus' },
      ] },
      ctaBanner,
    ],
  },
  {
    title: 'Autot', slug: 'autot',
    seo: { metaTitle: 'Autot myynnissä – Aito Auto Oy', metaDescription: 'Selaa vaihtoautoja tyypin, merkin ja mallin mukaan. Hinta ja kuukausierä näkyvät heti.' },
    blocks: [
      { __component: 'sections.inventory-browser', emptyTitle: 'Ei juuri nyt myynnissä',
        emptyText: 'Kerro mitä etsit, niin ilmoitamme kun sopiva auto tulee pihaan.',
        disclaimer: 'Kuukausierä-esimerkki: käsiraha 10 %, laina-aika 60 kk, korko 4,9 %, avausmaksu 190 €, käsittelymaksu 9 €/kk. Todellinen vuosikorko ja luoton kokonaishinta rahoittajan mukaan.' },
    ],
  },
  {
    title: 'Palvelut', slug: 'palvelut',
    seo: { metaTitle: 'Palvelut – Aito Auto Oy', metaDescription: 'Rahoitus, vaihtoauto, takuu, huolto, kotiintoimitus ja rekisteröinti samasta paikasta.' },
    blocks: [
      { __component: 'sections.page-header', eyebrow: 'Palvelut', title: 'Kaupan\nmolemmin\npuolin', variant: 'dark',
        intro: 'Auton ostaminen on muutakin kuin auto. Hoidamme rahoituksen, vaihtoauton, takuun ja paperit – yhdellä käynnillä tai kokonaan etänä.' },
      { __component: 'sections.services-detail', indexLabel: 'Sisällys' },
      { __component: 'sections.faq', eyebrow: 'Usein kysyttyä', title: 'Kysymyksiä?', items: [
        { question: 'Voinko ostaa auton kokonaan etänä?', answer: 'Kyllä. Sovimme kaupasta WhatsAppissa tai puhelimessa, hoidamme rahoituksen ja paperit sähköisesti ja toimitamme auton kotiovellesi.' },
        { question: 'Miten vaihtoauton hyvitys määräytyy?', answer: 'Arvio perustuu auton malliin, ikään, kilometreihin, kuntoon ja huoltohistoriaan. Alustavan arvion saat jo rekisterinumeron ja kilometrien perusteella; lopullinen hinta sovitaan, kun olemme nähneet auton.' },
        { question: 'Saako autolle koeajon?', answer: 'Totta kai. Varaa aika auton sivulta tai WhatsAppissa, niin auto on valmiina kun saavut.' },
        { question: 'Mitä rahoitus vaatii?', answer: 'Täysi-ikäisyyden, suomalaisen henkilötunnuksen ja luottopäätöksen rahoittajalta. Käsirahan ja laina-ajan voit valita itse.' },
        { question: 'Voinko varata auton?', answer: 'Voit. Kerro meille WhatsAppissa, niin kerromme varauksen ehdot.' },
      ] },
    ],
  },
  {
    title: 'Meistä', slug: 'meista',
    seo: { metaTitle: 'Meistä – Aito Auto Oy', metaDescription: 'Uusi liike, vanha periaate: avoimuus, ihminen edellä, tarkkuus ja oikea hinta.' },
    blocks: [
      { __component: 'sections.about-hero', eyebrow: 'Meistä', line1: 'Uusi liike.', highlight: 'Vanha', line2: 'periaate.',
        text: 'Aito Auto Oy aloitti vuonna 2026 yhdellä ajatuksella: autokaupan pitää olla yhtä suoraviivaista kuin kättely. Kerromme mitä tiedämme, hinnoittelemme reilusti ja seisomme myymiemme autojen takana.',
        stampText: 'AITO AUTO OY · PERUSTETTU 2026 · [KAUPUNKI] · ', stampYear: '2026' },
      { __component: 'sections.image-band', alt: 'Aito Auto Oy:n liike', plateText: 'EST-026' },
      { __component: 'sections.values-list', eyebrow: 'Arvomme', title: 'Neljä kirjainta,\nneljä lupausta',
        intro: 'Nimemme ei ole sattumaa. Jokainen kirjain kertoo, miten teemme kauppaa.', items: [
        { letter: 'A', title: 'Avoimuus', text: 'Auton historia, kunto ja mahdolliset viat kerrotaan ennen kauppaa – ei vasta sen jälkeen.' },
        { letter: 'I', title: 'Ihminen edellä', text: 'Ei painostusta eikä kiirettä. Saat miettiä rauhassa, ja vastaamme kysymyksiin silloinkin kun et osta heti.' },
        { letter: 'T', title: 'Tarkkuus', text: 'Jokainen auto tarkastetaan ennen myyntiä, ja ilmoituksen tiedot pitävät paikkansa viimeistä varustetta myöten.' },
        { letter: 'O', title: 'Oikea hinta', text: 'Hinta, jonka näet, on hinta, jonka maksat. Kuukausierä lasketaan auki ennen kuin allekirjoitat mitään.' },
      ] },
      { __component: 'sections.team', eyebrow: 'Tiimi', title: 'Ihmiset avainten takana', members: [
        { name: '[Etunimi Sukunimi]', role: 'Toimitusjohtaja, myynti', phone: '+358 [puhelin]', plate: 'ABC-1' },
        { name: '[Etunimi Sukunimi]', role: 'Myyntineuvottelija', phone: '+358 [puhelin]', plate: 'ABC-2' },
        { name: '[Etunimi Sukunimi]', role: 'Rahoitus ja vaihtoautot', phone: '+358 [puhelin]', plate: 'ABC-3' },
      ] },
      { __component: 'sections.visit-cta', eyebrow: 'Tervetuloa käymään', buttonLabel: 'Yhteystiedot ja kartta', buttonUrl: '/yhteystiedot' },
    ],
  },
  {
    title: 'Yhteystiedot', slug: 'yhteystiedot',
    seo: { metaTitle: 'Yhteystiedot – Aito Auto Oy', metaDescription: 'Soita, lähetä WhatsApp-viesti tai tule käymään. Aukioloajat ja yhteystiedot.' },
    blocks: [
      { __component: 'sections.contact-hub', title: 'Sano hei.', formTitle: 'Jätä viesti',
        formIntro: 'Vastaamme yleensä saman tai seuraavan arkipäivän aikana.',
        consentText: 'Hyväksyn, että tietojani käytetään yhteydenottoon vastaamiseen tietosuojaselosteen mukaisesti.',
        successTitle: 'Kiitos!', successText: 'Viestisi on vastaanotettu. Palaamme asiaan mahdollisimman pian.' },
    ],
  },
  {
    title: 'Tietosuojaseloste', slug: 'tietosuojaseloste',
    seo: { metaTitle: 'Tietosuojaseloste – Aito Auto Oy' },
    blocks: [
      { __component: 'sections.page-header', eyebrow: 'Tietosuoja', title: 'Tietosuojaseloste', variant: 'light' },
      { __component: 'sections.rich-text', body: [
        h('Rekisterinpitäjä'),
        p('Aito Auto Oy, Y-tunnus [0000000-0], [Katuosoite], [Postinumero] [Kaupunki].'),
        h('Mitä tietoja keräämme'),
        p('Kun otat yhteyttä lomakkeella tai WhatsAppissa, tallennamme antamasi nimen, puhelinnumeron, sähköpostin, viestin sekä tiedot autosta tai laskelmasta, josta kysyt.'),
        h('Käyttötarkoitus'),
        p('Käytämme tietoja ainoastaan yhteydenottoosi vastaamiseen ja mahdollisen kaupan hoitamiseen. Emme luovuta tietoja kolmansille osapuolille ilman suostumustasi, lukuun ottamatta rahoitushakemuksia, jotka välitetään rahoittajalle pyynnöstäsi.'),
        h('Säilytys ja oikeutesi'),
        p('[Täydennä säilytysajat.] Sinulla on oikeus tarkastaa, korjata ja pyytää poistamaan tietosi ottamalla yhteyttä osoitteeseen [myynti@aitoauto.fi].'),
      ] },
    ],
  },
];
