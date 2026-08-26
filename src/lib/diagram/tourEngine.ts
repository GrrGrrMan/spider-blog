import { getElementRootBounds } from './svgMath';
import type { ElementBounds, ViewBoxRect } from './types';

export class TourEngine {
  private svgEl: SVGSVGElement;
  private tourElements: SVGGraphicsElement[] = [];
  private currentTourIndex: number = 0;
  private stepIndicator?: HTMLElement | null;

  constructor(svgEl: SVGSVGElement, stepIndicator?: HTMLElement | null) {
    this.svgEl = svgEl;
    this.stepIndicator = stepIndicator;
    this.discoverElements();
  }

  public get elementsCount(): number {
    return this.tourElements.length;
  }

  private discoverElements(): void {
    const allClusters = Array.from(
      this.svgEl.querySelectorAll<SVGGraphicsElement>('.cluster, g[id^="subGraph"], g.subgraph')
    );
    const leafClusters = allClusters.filter(
      (c) => c.querySelectorAll('.cluster, g[id^="subGraph"], g.subgraph').length === 0
    );
    const clustersToUse = leafClusters.length > 0 ? leafClusters : allClusters;

    const allNodes = Array.from(this.svgEl.querySelectorAll<SVGGraphicsElement>('.node'));
    const uncontainedNodes = allNodes.filter((node) => !clustersToUse.some((cluster) => cluster.contains(node)));

    const candidateElements = [...clustersToUse, ...uncontainedNodes];

    // Spatial sorting: Top-to-bottom, left-to-right
    this.tourElements = candidateElements
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { el, top: r.top, left: r.left };
      })
      .sort((a, b) => {
        const rowDiff = Math.round(a.top / 35) - Math.round(b.top / 35);
        return rowDiff !== 0 ? rowDiff : a.left - b.left;
      })
      .map((item) => item.el);
  }

  public clearHighlights(): void {
    this.svgEl.querySelectorAll<SVGGraphicsElement>('.cluster, .node').forEach((node) => {
      node.style.opacity = '1';
      node.style.filter = '';
    });
  }

  public applyHighlight(targetEl: SVGGraphicsElement): void {
    this.clearHighlights();
    this.svgEl.querySelectorAll<SVGGraphicsElement>('.cluster, .node').forEach((node) => {
      if (node !== targetEl && !targetEl.contains(node)) {
        node.style.opacity = '0.35';
      }
    });
    targetEl.style.opacity = '1';
    targetEl.style.filter = 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.65))';
  }

  public applyGroupHighlight(targetEls: SVGGraphicsElement[]): void {
    this.clearHighlights();
    this.svgEl.querySelectorAll<SVGGraphicsElement>('.cluster, .node').forEach((node) => {
      const isTarget = targetEls.some((t) => t === node || t.contains(node));
      if (!isTarget) {
        node.style.opacity = '0.4';
      }
    });
    targetEls.forEach((el) => {
      el.style.opacity = '1';
      el.style.filter = 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.45))';
    });
  }

  public calculateTargetViewBox(
    el: SVGGraphicsElement,
    viewportEl: HTMLElement,
    padding = 36
  ): { target: ViewBoxRect; bounds: ElementBounds } | null {
    const bounds = getElementRootBounds(this.svgEl, el);
    if (!bounds) return null;

    return this.fitBoundsToViewport(bounds, viewportEl, padding);
  }

  /**
   * Computes the bounding box union enclosing multiple elements (e.g. first 3 nodes)
   */
  public calculateGroupTargetViewBox(
    elements: SVGGraphicsElement[],
    viewportEl: HTMLElement,
    padding = 48
  ): { target: ViewBoxRect; bounds: ElementBounds } | null {
    if (elements.length === 0) return null;

    const boundsList = elements
      .map((el) => getElementRootBounds(this.svgEl, el))
      .filter((b): b is ElementBounds => b !== null);

    if (boundsList.length === 0) return null;

    const minX = Math.min(...boundsList.map((b) => b.x));
    const minY = Math.min(...boundsList.map((b) => b.y));
    const maxX = Math.max(...boundsList.map((b) => b.x + b.width));
    const maxY = Math.max(...boundsList.map((b) => b.y + b.height));

    const unionBounds: ElementBounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };

    return this.fitBoundsToViewport(unionBounds, viewportEl, padding);
  }

  private fitBoundsToViewport(
    bounds: ElementBounds,
    viewportEl: HTMLElement,
    padding: number
  ): { target: ViewBoxRect; bounds: ElementBounds } {
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;

    const paddedW = bounds.width + padding * 2;
    const paddedH = bounds.height + padding * 2;

    const vWidth = viewportEl.clientWidth || 800;
    const vHeight = viewportEl.clientHeight || 440;
    const vAspect = vWidth / vHeight;

    let targetW = paddedW;
    let targetH = paddedH;

    if (targetW / targetH < vAspect) {
      targetW = targetH * vAspect;
    } else {
      targetH = targetW / vAspect;
    }

    return {
      target: {
        x: cx - targetW / 2,
        y: cy - targetH / 2,
        w: targetW,
        h: targetH,
      },
      bounds,
    };
  }

  public getInitialCluster(count = 3): SVGGraphicsElement[] {
    return this.tourElements.slice(0, Math.min(count, this.tourElements.length));
  }

  public step(direction: 'prev' | 'next'): SVGGraphicsElement | null {
    if (this.tourElements.length === 0) return null;
    if (direction === 'next') {
      this.currentTourIndex = (this.currentTourIndex + 1) % this.tourElements.length;
    } else {
      this.currentTourIndex = (this.currentTourIndex - 1 + this.tourElements.length) % this.tourElements.length;
    }

    this.updateIndicator(this.currentTourIndex + 1);
    return this.tourElements[this.currentTourIndex];
  }

  public setCurrentTarget(target: SVGGraphicsElement): void {
    const idx = this.tourElements.indexOf(target);
    if (idx !== -1) {
      this.currentTourIndex = idx;
      this.updateIndicator(idx + 1);
    }
  }

  public updateIndicator(val: number | string): void {
    if (this.stepIndicator) {
      this.stepIndicator.textContent = typeof val === 'number' ? `${val}/${this.tourElements.length}` : val;
    }
  }
}