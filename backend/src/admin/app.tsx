import type { StrapiApp } from '@strapi/strapi/admin';

/**
 * Keep browser translation (Chrome/Edge "Translate this page", the Google
 * Translate extension) from crashing the admin panel.
 *
 * Those tools rewrite the page's text nodes, replacing them with their own
 * <font> wrappers. React still holds a reference to the original node, so the
 * next re-render calls removeChild() on a node that is no longer there, the
 * browser throws "The node to be removed is not a child of this node", and the
 * whole panel falls back to Strapi's "Something went wrong" screen — which is
 * what happens when you click an entry in the Content Manager sidebar.
 *
 * Rather than blocking translation, make the two DOM calls React relies on
 * tolerant of a node the translator has already moved: removing a node that is
 * no longer a child becomes a no-op, and inserting before a stale reference
 * appends instead. React carries on and the crash goes away, so the page can
 * still be translated.
 *
 * This is the long-standing workaround for the React/Google Translate conflict
 * (see facebook/react#11538). It is deliberately scoped to the admin bundle.
 */
const PATCH_FLAG = '__aitoTranslationDomGuard__';

const guardDomAgainstTranslation = () => {
  if (typeof window === 'undefined' || typeof Node === 'undefined') {
    return;
  }

  // bootstrap() runs after this module is evaluated; only patch once.
  const globals = window as unknown as Record<string, unknown>;
  if (globals[PATCH_FLAG]) {
    return;
  }
  globals[PATCH_FLAG] = true;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function patchedRemoveChild<T extends Node>(
    this: Node,
    child: T
  ): T {
    if (child.parentNode !== this) {
      // The translator already detached it. Nothing left to remove.
      return child;
    }

    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function patchedInsertBefore<T extends Node>(
    this: Node,
    newNode: T,
    referenceNode: Node | null
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      // The anchor React wanted is gone; append rather than throw.
      return originalInsertBefore.call(this, newNode, null) as T;
    }

    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
};

// Runs the moment the admin bundle is evaluated, before React mounts.
guardDomAgainstTranslation();

export default {
  config: {
    // Strapi ships a Finnish admin UI. Switching to it under
    // Profile -> Interface language is cleaner than translating the English one
    // in the browser, and it leaves the DOM alone entirely.
    locales: ['fi'],
  },
  bootstrap(_app: StrapiApp) {
    guardDomAgainstTranslation();
  },
};
