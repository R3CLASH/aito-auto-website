'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const REVEAL = '.rv, .wipe, .sl, .svc-rule, .svc, .val';

/**
 * Fallback engine for browsers without CSS scroll-driven animations (e.g. iOS Safari < 26).
 * Active only when <html> has .fx-io (set by the inline script in layout.tsx):
 *  - reveals .rv/.wipe/.sl/... with an IntersectionObserver (adds .in)
 *  - drives the header progress line, logo shrink and parallax bands via CSS variables
 * New elements (client navigation, filters, carousels) are picked up by a MutationObserver.
 */
export default function ScrollFx() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains('fx-io')) return;
    root.classList.add('fx-ready');

    // Elements that start fully clipped (.wipe) or scaled to zero (.svc-rule) have no visible
    // area, so the observer would never report them. Watch their parent instead.
    const targets = new Map<Element, Element[]>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (targets.get(e.target) || []).forEach((t) => t.classList.add('in'));
          targets.delete(e.target);
          io.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0 },
    );
    const seen = new WeakSet<Element>();
    const scan = () => {
      document.querySelectorAll(REVEAL).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        const watch = el.matches('.wipe, .svc-rule') && el.parentElement ? el.parentElement : el;
        const list = targets.get(watch);
        if (list) list.push(el);
        else { targets.set(watch, [el]); io.observe(watch); }
      });
    };
    scan();

    let pending = false;
    const mo = new MutationObserver(() => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; scan(); });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = window.scrollY;
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        root.style.setProperty('--sp', String(Math.min(1, y / max)));
        root.style.setProperty('--sb', String(Math.min(1, y / 240)));
        const vh = window.innerHeight;
        document.querySelectorAll<HTMLElement>('.par').forEach((el) => {
          const r = el.getBoundingClientRect();
          const p = (vh - r.top) / (vh + r.height);
          el.style.setProperty('--pp', String(Math.max(0, Math.min(1, p))));
        });
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [pathname]);

  return null;
}
