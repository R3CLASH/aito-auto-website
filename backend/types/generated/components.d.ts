import type { Schema, Struct } from '@strapi/strapi';

export interface SectionsAboutHero extends Struct.ComponentSchema {
  collectionName: 'components_sections_about_heros';
  info: {
    displayName: 'Meist\u00E4 \u2013 hero (About \u2013 hero)';
    icon: 'emotionHappy';
  };
  attributes: {
    eyebrow: Schema.Attribute.String;
    highlight: Schema.Attribute.String;
    line1: Schema.Attribute.String & Schema.Attribute.Required;
    line2: Schema.Attribute.String;
    stampText: Schema.Attribute.String;
    stampYear: Schema.Attribute.String;
    text: Schema.Attribute.Text;
  };
}

export interface SectionsBrandTicker extends Struct.ComponentSchema {
  collectionName: 'components_sections_brand_tickers';
  info: {
    displayName: 'Merkkinauha (Brand ticker)';
    icon: 'slideshow';
  };
  attributes: {
    label: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Myynniss\u00E4 olevat merkit'>;
  };
}

export interface SectionsContactHub extends Struct.ComponentSchema {
  collectionName: 'components_sections_contact_hubs';
  info: {
    displayName: 'Yhteydenotto (Contact hub)';
    icon: 'message';
  };
  attributes: {
    consentText: Schema.Attribute.Text;
    formIntro: Schema.Attribute.Text;
    formTitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'J\u00E4t\u00E4 viesti'>;
    successText: Schema.Attribute.Text;
    successTitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Kiitos!'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsCtaBanner extends Struct.ComponentSchema {
  collectionName: 'components_sections_cta_banners';
  info: {
    displayName: 'CTA-banneri (CTA banner)';
    icon: 'cursor';
  };
  attributes: {
    action: Schema.Attribute.Enumeration<['whatsapp', 'link']> &
      Schema.Attribute.DefaultTo<'whatsapp'>;
    buttonLabel: Schema.Attribute.String & Schema.Attribute.Required;
    highlight: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String;
  };
}

export interface SectionsFaq extends Struct.ComponentSchema {
  collectionName: 'components_sections_faqs';
  info: {
    displayName: 'UKK (FAQ)';
    icon: 'question';
  };
  attributes: {
    eyebrow: Schema.Attribute.String;
    items: Schema.Attribute.Component<'shared.faq-item', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsFinanceTeaser extends Struct.ComponentSchema {
  collectionName: 'components_sections_finance_teasers';
  info: {
    displayName: 'Rahoitusnosto (Finance teaser)';
    icon: 'chartPie';
  };
  attributes: {
    buttonLabel: Schema.Attribute.String;
    buttonUrl: Schema.Attribute.String;
    exampleLabel: Schema.Attribute.String;
    examplePrice: Schema.Attribute.Integer;
    eyebrow: Schema.Attribute.String;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsHeroShowroom extends Struct.ComponentSchema {
  collectionName: 'components_sections_hero_showrooms';
  info: {
    displayName: 'Hero \u2013 n\u00E4yttelytila (Hero \u2013 showroom)';
    icon: 'landscape';
  };
  attributes: {
    description: Schema.Attribute.Text;
    eyebrow: Schema.Attribute.String;
    plateText: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 8;
      }>;
    primaryCta: Schema.Attribute.Component<'shared.link', false>;
    secondaryCta: Schema.Attribute.Component<'shared.link', false>;
    showroomLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'N\u00E4yttelytila'>;
    titleLine1: Schema.Attribute.String & Schema.Attribute.Required;
    titleLine2: Schema.Attribute.String;
  };
}

export interface SectionsImageBand extends Struct.ComponentSchema {
  collectionName: 'components_sections_image_bands';
  info: {
    displayName: 'Kuvanauha (Image band)';
    icon: 'picture';
  };
  attributes: {
    alt: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    plateText: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 8;
      }>;
  };
}

export interface SectionsInventoryBrowser extends Struct.ComponentSchema {
  collectionName: 'components_sections_inventory_browsers';
  info: {
    displayName: 'Autolistaus + suodatus (Inventory browser)';
    icon: 'filter';
  };
  attributes: {
    disclaimer: Schema.Attribute.Text;
    emptyText: Schema.Attribute.Text;
    emptyTitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Ei juuri nyt myynniss\u00E4'>;
  };
}

export interface SectionsLatestCars extends Struct.ComponentSchema {
  collectionName: 'components_sections_latest_carss';
  info: {
    displayName: 'Uusimmat autot (Latest cars)';
    icon: 'car';
  };
  attributes: {
    description: Schema.Attribute.Text;
    eyebrow: Schema.Attribute.String;
    featuredOnly: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    limit: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 12;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<4>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsPageHeader extends Struct.ComponentSchema {
  collectionName: 'components_sections_page_headers';
  info: {
    displayName: 'Sivun otsikko (Page header)';
    icon: 'heading';
  };
  attributes: {
    eyebrow: Schema.Attribute.String;
    intro: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    variant: Schema.Attribute.Enumeration<['dark', 'light']> &
      Schema.Attribute.DefaultTo<'dark'>;
  };
}

export interface SectionsProcessRoad extends Struct.ComponentSchema {
  collectionName: 'components_sections_process_roads';
  info: {
    displayName: 'Prosessi \u2013 tie (Process road)';
    icon: 'walk';
  };
  attributes: {
    eyebrow: Schema.Attribute.String;
    steps: Schema.Attribute.Component<'shared.step', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsQuickSearch extends Struct.ComponentSchema {
  collectionName: 'components_sections_quick_searchs';
  info: {
    displayName: 'Pikahaku (Quick search)';
    icon: 'search';
  };
  attributes: {
    buttonLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'N\u00E4yt\u00E4 autot'>;
    hint: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsRichText extends Struct.ComponentSchema {
  collectionName: 'components_sections_rich_texts';
  info: {
    displayName: 'Vapaa teksti (Rich text)';
    icon: 'medium';
  };
  attributes: {
    body: Schema.Attribute.Blocks;
    title: Schema.Attribute.String;
  };
}

export interface SectionsServicesDetail extends Struct.ComponentSchema {
  collectionName: 'components_sections_services_details';
  info: {
    displayName: 'Palvelut \u2013 kaikki (Services \u2013 all)';
    icon: 'layer';
  };
  attributes: {
    indexLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Sis\u00E4llys'>;
  };
}

export interface SectionsServicesList extends Struct.ComponentSchema {
  collectionName: 'components_sections_services_lists';
  info: {
    displayName: 'Palvelulista (Services list)';
    icon: 'bulletList';
  };
  attributes: {
    eyebrow: Schema.Attribute.String;
    linkLabel: Schema.Attribute.String;
    linkUrl: Schema.Attribute.String;
    rows: Schema.Attribute.Component<'shared.service-row', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsStatement extends Struct.ComponentSchema {
  collectionName: 'components_sections_statements';
  info: {
    displayName: 'Iskulause (Statement)';
    icon: 'quote';
  };
  attributes: {
    definition: Schema.Attribute.String;
    highlight: Schema.Attribute.String;
    muted: Schema.Attribute.String;
    term: Schema.Attribute.String;
    text: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface SectionsTeam extends Struct.ComponentSchema {
  collectionName: 'components_sections_teams';
  info: {
    displayName: 'Tiimi (Team)';
    icon: 'user';
  };
  attributes: {
    eyebrow: Schema.Attribute.String;
    members: Schema.Attribute.Component<'shared.team-member', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsValuesList extends Struct.ComponentSchema {
  collectionName: 'components_sections_values_lists';
  info: {
    displayName: 'Arvot (Values)';
    icon: 'star';
  };
  attributes: {
    eyebrow: Schema.Attribute.String;
    intro: Schema.Attribute.Text;
    items: Schema.Attribute.Component<'shared.value-item', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsVehicleTypesGrid extends Struct.ComponentSchema {
  collectionName: 'components_sections_vehicle_types_grids';
  info: {
    displayName: 'Ajoneuvotyypit (Vehicle types)';
    icon: 'apps';
  };
  attributes: {
    eyebrow: Schema.Attribute.String;
    linkLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Kaikki autot \u2192'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsVisitCta extends Struct.ComponentSchema {
  collectionName: 'components_sections_visit_ctas';
  info: {
    displayName: 'Tervetuloa k\u00E4ym\u00E4\u00E4n (Visit CTA)';
    icon: 'pinMap';
  };
  attributes: {
    buttonLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Yhteystiedot ja kartta'>;
    buttonUrl: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'/yhteystiedot'>;
    eyebrow: Schema.Attribute.String;
  };
}

export interface SharedFaqItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_faq_items';
  info: {
    displayName: 'UKK-kysymys (FAQ item)';
    icon: 'question';
  };
  attributes: {
    answer: Schema.Attribute.Text & Schema.Attribute.Required;
    question: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedKeyValue extends Struct.ComponentSchema {
  collectionName: 'components_shared_key_values';
  info: {
    displayName: 'Tieto (Key-value)';
    icon: 'bulletList';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_links';
  info: {
    displayName: 'Linkki (Link)';
    icon: 'link';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    newTab: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedOpeningHour extends Struct.ComponentSchema {
  collectionName: 'components_shared_opening_hours';
  info: {
    displayName: 'Aukioloaika (Opening hour)';
    icon: 'clock';
  };
  attributes: {
    closed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    closes: Schema.Attribute.String;
    dayIndex: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 7;
          min: 1;
        },
        number
      >;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    opens: Schema.Attribute.String;
  };
}

export interface SharedOption extends Struct.ComponentSchema {
  collectionName: 'components_shared_options';
  info: {
    displayName: 'Valinta (Option)';
    icon: 'bulletList';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    displayName: 'SEO';
    icon: 'search';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 170;
      }>;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 70;
      }>;
    shareImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedServiceRow extends Struct.ComponentSchema {
  collectionName: 'components_shared_service_rows';
  info: {
    displayName: 'Palvelurivi (Service row)';
    icon: 'bulletList';
  };
  attributes: {
    text: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String;
  };
}

export interface SharedStep extends Struct.ComponentSchema {
  collectionName: 'components_shared_steps';
  info: {
    displayName: 'Vaihe (Step)';
    icon: 'arrowRight';
  };
  attributes: {
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedTeamMember extends Struct.ComponentSchema {
  collectionName: 'components_shared_team_members';
  info: {
    displayName: 'Tiimil\u00E4inen (Team member)';
    icon: 'user';
  };
  attributes: {
    email: Schema.Attribute.Email;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    phone: Schema.Attribute.String;
    photo: Schema.Attribute.Media<'images'>;
    plate: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 8;
      }>;
    role: Schema.Attribute.String;
  };
}

export interface SharedValueItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_value_items';
  info: {
    displayName: 'Arvo (Value)';
    icon: 'star';
  };
  attributes: {
    letter: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 2;
      }>;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'sections.about-hero': SectionsAboutHero;
      'sections.brand-ticker': SectionsBrandTicker;
      'sections.contact-hub': SectionsContactHub;
      'sections.cta-banner': SectionsCtaBanner;
      'sections.faq': SectionsFaq;
      'sections.finance-teaser': SectionsFinanceTeaser;
      'sections.hero-showroom': SectionsHeroShowroom;
      'sections.image-band': SectionsImageBand;
      'sections.inventory-browser': SectionsInventoryBrowser;
      'sections.latest-cars': SectionsLatestCars;
      'sections.page-header': SectionsPageHeader;
      'sections.process-road': SectionsProcessRoad;
      'sections.quick-search': SectionsQuickSearch;
      'sections.rich-text': SectionsRichText;
      'sections.services-detail': SectionsServicesDetail;
      'sections.services-list': SectionsServicesList;
      'sections.statement': SectionsStatement;
      'sections.team': SectionsTeam;
      'sections.values-list': SectionsValuesList;
      'sections.vehicle-types-grid': SectionsVehicleTypesGrid;
      'sections.visit-cta': SectionsVisitCta;
      'shared.faq-item': SharedFaqItem;
      'shared.key-value': SharedKeyValue;
      'shared.link': SharedLink;
      'shared.opening-hour': SharedOpeningHour;
      'shared.option': SharedOption;
      'shared.seo': SharedSeo;
      'shared.service-row': SharedServiceRow;
      'shared.step': SharedStep;
      'shared.team-member': SharedTeamMember;
      'shared.value-item': SharedValueItem;
    }
  }
}
