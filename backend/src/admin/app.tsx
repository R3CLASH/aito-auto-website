import type { StrapiApp } from '@strapi/strapi/admin';

/**
 * Stop browser auto-translation from rewriting the admin panel.
 *
 * Chrome/Edge "Translate this page", the Google Translate extension and similar
 * tools replace React's text nodes with their own <font> wrappers. React still
 * holds a reference to the original node, so the next re-render throws
 * "Failed to execute 'removeChild' on 'Node': The node to be removed is not a
 * child of this node" and the whole panel falls back to the "Something went
 * wrong" screen. Marking the document as not translatable leaves the DOM to
 * React and the crash goes away.
 */
const disableBrowserTranslation = () => {
  if (typeof document === 'undefined') {
    return;
  }

  const html = document.documentElement;

  html.setAttribute('translate', 'no');
  html.classList.add('notranslate');

  // The admin UI ships in English. Saying so explicitly stops Chrome guessing
  // the page language from the Finnish content-type names and offering to
  // translate it.
  if (!html.getAttribute('lang')) {
    html.setAttribute('lang', 'en');
  }

  if (!document.querySelector('meta[name="google"][content="notranslate"]')) {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'google');
    meta.setAttribute('content', 'notranslate');
    document.head.appendChild(meta);
  }
};

// Runs the moment the admin bundle is evaluated, before React mounts.
disableBrowserTranslation();

export default {
  config: {
    locales: [],
  },
  bootstrap(_app: StrapiApp) {
    // Re-applied after boot in case anything reset the document attributes.
    disableBrowserTranslation();
  },
};
