import type { ElementBounds } from './types';

/**
 * Projects DOM screen bounds into true SVG ViewBox coordinates using CTM inversion.
 * Eliminates letterbox offset and local-coordinate displacement across nested transformed groups.
 */
export function getElementRootBounds(svgEl: SVGSVGElement, el: SVGGraphicsElement): ElementBounds | null {
  const elRect = el.getBoundingClientRect();
  if (!elRect.width || !elRect.height) return null;

  const ctm = svgEl.getScreenCTM();
  if (!ctm) return null;

  const inv = ctm.inverse();
  const pt = svgEl.createSVGPoint();

  pt.x = elRect.left;
  pt.y = elRect.top;
  const p1 = pt.matrixTransform(inv);

  pt.x = elRect.right;
  pt.y = elRect.bottom;
  const p2 = pt.matrixTransform(inv);

  const minX = Math.min(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxX = Math.max(p1.x, p2.x);
  const maxY = Math.max(p1.y, p2.y);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Decodes HTML entities produced by markdown and Shiki highlighters.
 */
export function decodeHtmlEntities(str: string): string {
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}