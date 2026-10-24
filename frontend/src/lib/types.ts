export type Media = { url: string; alt: string; width: number; height: number };
export type Link = { label: string; url: string; newTab?: boolean };
export type Seo = { metaTitle?: string; metaDescription?: string; shareImage?: Media | null } | null;

export type OpeningHour = { dayIndex: number; label: string; opens?: string; closes?: string; closed?: boolean };

export type GlobalSettings = {
  siteName: string;
  tagline: string;
  logo: Media | null;
  whatsappNumber: string;
  phone: string;
  phoneDisplay: string;
  email: string;
  street: string;
  postalCode: string;
  city: string;
  businessId: string;
  invoicingAddress: string;
  mapsUrl: string;
  mapEmbedUrl: string;
  openingHours: OpeningHour[];
  openingHoursNote: string;
  navigation: Link[];
  headerCta: Link | null;
  footerTagline: string;
  footerLinks: Link[];
  whatsappTopics: string[];
  defaultSeo: Seo;
};

export type FinanceSettings = {
  interestRate: number;
  interestMin: number;
  interestMax: number;
  openingFee: number;
  monthlyFee: number;
  defaultDownPct: number;
  maxDownPct: number;
  downStep: number;
  defaultTermMonths: number;
  termOptions: number[];
  maxBalloonPct: number;
  balloonStep: number;
  partnerName: string;
  exampleNote: string;
  disclaimer: string;
};

export type VehicleType = { name: string; slug: string; shortName: string; silhouette: Media | null };
export type BrandNode = { name: string; slug: string; logo: Media | null; models: { name: string; slug: string }[] };

export type CarSummary = {
  documentId: string;
  title: string;
  slug: string;
  brand: { name: string; slug: string };
  model: { name: string; slug: string };
  type: { name: string; slug: string } | null;
  variant: string;
  price: number;
  year: number;
  mileage: number;
  fuel: string;
  transmission: string;
  badge: string;
  featured: boolean;
  reserved: boolean;
  vatDeductible: boolean;
  image: Media | null;
  placeholder: Media | null;
  photoCount: number;
  monthly: number;
  href: string;
  createdAt: string;
};

export type CarDetail = CarSummary & {
  drivetrain: string;
  powerKw: number | null;
  color: string;
  inspectedUntil: string;
  co2: number | null;
  sold: boolean;
  images: Media[];
  highlights: string[];
  equipment: string[];
  extraSpecs: { label: string; value: string }[];
  description: any[] | null;
};

export type Catalog = { types: VehicleType[]; brands: BrandNode[]; cars: CarSummary[] };

export type PageData = { title: string; slug: string; seo: Seo; blocks: Block[] };
export type Block = { __component: string; id: number; [key: string]: any };

export type ServiceItem = {
  title: string;
  slug: string;
  summary: string;
  body: string;
  facts: { label: string; value: string }[];
  special: 'none' | 'trade-in-form';
  ctaLabel: string;
  ctaUrl: string;
};

export type CarDetailTemplate = {
  trustBadges: string[];
  specsTitle: string;
  equipmentTitle: string;
  calculatorEyebrow: string;
  calculatorTitle: string;
  descriptionTitle: string;
  descriptionFallback: string;
  similarTitle: string;
  blocks: Block[];
};

/** Data every section can draw on. */
export type SiteContext = {
  global: GlobalSettings;
  finance: FinanceSettings;
  catalog: Catalog;
};
