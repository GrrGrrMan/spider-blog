import { lifecycle } from './lifecycle';

export function initScrollspy(): void {
  const desktopLinks = document.querySelectorAll<HTMLAnchorElement>('.toc-link');
  const mobileLinks = document.querySelectorAll<HTMLAnchorElement>('.mobile-toc-link');
  const mobileActiveLabel = document.getElementById('mobile-toc-active-label');

  if (desktopLinks.length === 0 && mobileLinks.length === 0) return;

  const headingElements: HTMLElement[] = [];
  const slugs = new Set<string>();

  [...desktopLinks, ...mobileLinks].forEach((link) => {
    const slug = link.getAttribute('data-heading-slug') || link.getAttribute('data-mobile-heading-slug');
    if (slug && !slugs.has(slug)) {
      slugs.add(slug);
      const el = document.getElementById(slug);
      if (el) headingElements.push(el);
    }
  });

  if (headingElements.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          const titleText = entry.target.textContent || 'Overview';

          // Update Desktop TOC
          desktopLinks.forEach((link) => {
            if (link.getAttribute('data-heading-slug') === id) {
              link.classList.add('text-sky-400', 'bg-sky-950/60', 'font-semibold');
              link.classList.remove('text-zinc-400', 'text-zinc-300');
              link.setAttribute('aria-current', 'location');
            } else {
              link.classList.remove('text-sky-400', 'bg-sky-950/60', 'font-semibold');
              link.classList.add('text-zinc-400');
              link.removeAttribute('aria-current');
            }
          });

          // Update Mobile TOC
          if (mobileActiveLabel) {
            mobileActiveLabel.textContent = titleText.replace(/#/g, '').trim();
          }

          mobileLinks.forEach((link) => {
            if (link.getAttribute('data-mobile-heading-slug') === id) {
              link.classList.add('bg-sky-950/70', 'text-sky-300', 'font-semibold');
            } else {
              link.classList.remove('bg-sky-950/70', 'text-sky-300', 'font-semibold');
            }
          });
        }
      });
    },
    { rootMargin: '-85px 0% -65% 0%', threshold: 0.1 }
  );

  headingElements.forEach((h) => observer.observe(h));
  lifecycle.register(() => observer.disconnect());
}