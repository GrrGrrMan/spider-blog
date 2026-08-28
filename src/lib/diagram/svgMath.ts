import type { ElementBounds } from './types';

/**
 * Derives the true rendered content bounds of an SVG by querying its active graphical elements.
 * Eliminates artificial letterbox padding and whitespace offsets present in Mermaid raw viewBox.
 */
export function getContentBoundingBox(svgEl: SVGSVGElement): ElementBounds | null {
  try {
    const rawBBox = svgEl.getBBox();
    if (rawBBox && rawBBox.width > 0 && rawBBox.height > 0) {
      return {
        x: rawBBox.x,
        y: rawBBox.y,
        width: rawBBox.width,
        height: rawBBox.height,
      };
    }
  } catch {
    // getBBox fallback for detached elements
  }

  // Element union fallback
  const renderables = Array.from(
    svgEl.querySelectorAll<SVGGraphicsElement>(
      '.node, .cluster, g[id^="subGraph"], .timeline-node, .actor, .task, .statediagram-state, path, rect, text'
    )
  );

  if (renderables.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  renderables.forEach((el) => {
    try {
      const b = el.getBBox();
      if (b.width > 0 && b.height > 0) {
        minX = Math.min(minX, b.x);
        minY = Math.min(minY, b.y);
        maxX = Math.max(maxX, b.x + b.width);
        maxY = Math.max(maxY, b.y + b.height);
      }
    } catch {
      // Ignore unmeasurable nodes
    }
  });

  if (minX === Infinity) return null;

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Projects DOM screen bounds into true SVG ViewBox coordinates using CTM inversion.
 * Eliminates letterbox offset and aspect-ratio scaling distortion.
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