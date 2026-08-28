import { createDiagramCard, renderMermaidDiagram } from './mermaidRenderer';
import { createPanZoomController } from './panZoomEngine';
import { setupModalTriggers } from './modalManager';
import { adjustNodePadding } from './svgMath';
import { lifecycle } from '../client/lifecycle';

async function waitForFontReadiness(): Promise<void> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 800)),
      ]);
    } catch {
      // Gracefully continue if FontFaceSet times out
    }
  }
}

export async function bootstrapDiagrams(): Promise<void> {
  const codeBlocks = Array.from(
    document.querySelectorAll<HTMLElement>(
      'pre[data-language="mermaid"], pre:has(code.language-mermaid), pre.astro-code[data-language="mermaid"], .language-mermaid'
    )
  );

  if (codeBlocks.length === 0) return;

  await waitForFontReadiness();

  for (const [idx, targetEl] of codeBlocks.entries()) {
    const preEl = targetEl.closest('pre') || targetEl;
    if (preEl.dataset.mermaidProcessed === 'true') continue;
    preEl.dataset.mermaidProcessed = 'true';

    const lines = preEl.querySelectorAll('.line');
    let rawCode = '';
    if (lines.length > 0) {
      rawCode = Array.from(lines)
        .map((l) => l.textContent)
        .join('\n');
    } else {
      rawCode = preEl.textContent || '';
    }

    if (!rawCode.trim()) continue;

    const { card, toolbar, viewport } = createDiagramCard();
    const { svgString, error } = await renderMermaidDiagram(rawCode, idx);

    if (error) {
      viewport.innerHTML = `<div class="text-rose-400 text-xs font-mono p-4">Render error: ${error}</div>`;
      preEl.replaceWith(card);
      continue;
    }

    viewport.innerHTML = svgString;
    const renderedSvg = viewport.querySelector<SVGSVGElement>('svg');
    preEl.replaceWith(card);

    if (renderedSvg) {
      adjustNodePadding(renderedSvg);
      const vbAttr = renderedSvg.getAttribute('viewBox');
      let w = 800,
        h = 400;
      if (vbAttr) {
        const parts = vbAttr.trim().split(/[\s,]+/).map(Number);
        if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
          w = parts[2];
          h = parts[3];
          renderedSvg.setAttribute('data-original-viewbox', `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]}`);
        }
      } else {
        const bbox = renderedSvg.getBBox();
        w = bbox.width || 800;
        h = bbox.height || 400;
        renderedSvg.setAttribute('data-original-viewbox', `${bbox.x || 0} ${bbox.y || 0} ${w} ${h}`);
        renderedSvg.setAttribute('viewBox', `${bbox.x || 0} ${bbox.y || 0} ${w} ${h}`);
      }
      const aspectRatio = Math.max(w / Math.max(h, 1), 0.5);
      const colWidth = Math.min(card.clientWidth || 760, 840);
      const idealHeight = colWidth / aspectRatio;
      // Content-adaptive inline height allocation
      viewport.style.height = `${Math.round(Math.min(Math.max(idealHeight + 40, 220), 560))}px`;

      const controller = createPanZoomController(viewport, renderedSvg, {
        zoomText: toolbar.querySelector<HTMLElement>('.zoom-level-text'),
        zoomInBtn: toolbar.querySelector<HTMLElement>('.zoom-in-btn'),
        zoomOutBtn: toolbar.querySelector<HTMLElement>('.zoom-out-btn'),
        zoomResetBtn: toolbar.querySelector<HTMLElement>('.zoom-reset-btn'),
        tourPrevBtn: toolbar.querySelector<HTMLElement>('.tour-prev-btn'),
        tourNextBtn: toolbar.querySelector<HTMLElement>('.tour-next-btn'),
        stepIndicator: toolbar.querySelector<HTMLElement>('.step-indicator'),
        tourNavWrapper: toolbar.querySelector<HTMLElement>('.tour-nav-wrapper'),
      });
      lifecycle.register(() => controller.destroy());
      
      const fullscreenBtn = toolbar.querySelector<HTMLElement>('.fullscreen-btn');
      if (fullscreenBtn) {
        setupModalTriggers(renderedSvg, fullscreenBtn);
      }
    }
  }
}

// Zero-latency bootstrap lifecycle
bootstrapDiagrams();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapDiagrams);
}
document.addEventListener('astro:page-load', bootstrapDiagrams);