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

/**
 * Inspects all rendered diagram nodes and dynamically expands bounding
 * shapes (<rect>) if text metrics exceed container width.
 */
export function adjustNodePadding(svgEl: SVGSVGElement, horizontalPadding = 18): void {
  const nodes = svgEl.querySelectorAll<SVGGraphicsElement>('.node, g.node');
  nodes.forEach((node) => {
    const textEl = node.querySelector<SVGGraphicsElement>('.label, text, foreignObject');
    const shapeEl = node.querySelector<SVGGraphicsElement>('rect, polygon, circle');
    if (!textEl || !shapeEl) return;

    try {
      const textBBox = textEl.getBBox();
      const shapeBBox = shapeEl.getBBox();

      if (textBBox.width <= 0 || shapeBBox.width <= 0) return;

      const requiredWidth = textBBox.width + horizontalPadding * 2;
      if (requiredWidth > shapeBBox.width) {
        const delta = requiredWidth - shapeBBox.width;
        if (shapeEl instanceof SVGRectElement) {
          const currentWidth = parseFloat(shapeEl.getAttribute('width') || String(shapeBBox.width));
          const currentX = parseFloat(shapeEl.getAttribute('x') || String(shapeBBox.x));
          shapeEl.setAttribute('width', String(currentWidth + delta));
          shapeEl.setAttribute('x', String(currentX - delta / 2));
        }
      }
    } catch {
      // Graceful fallback for non-rendered SVG elements
    }
  });
}