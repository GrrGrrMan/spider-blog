import { createPanZoomController } from './panZoomEngine';
import type { PanZoomController } from './types';

let activeModalController: PanZoomController | null = null;

export function setupModalTriggers(renderedSvgEl: SVGSVGElement, triggerBtn: HTMLElement): void {
  const modal = document.getElementById('diagram-modal') as HTMLDialogElement | null;
  const modalViewport = document.getElementById('modal-diagram-viewport');
  const closeBtn = document.getElementById('close-modal-btn');

  if (!modal || !modalViewport) return;

  // Single setup for modal dismissal
  closeBtn?.addEventListener('click', () => modal.close());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });

  triggerBtn.addEventListener('click', () => {
    activeModalController?.destroy();
    modalViewport.innerHTML = '';

    const cloneSvg = renderedSvgEl.cloneNode(true) as SVGSVGElement;
    modalViewport.appendChild(cloneSvg);
    modal.showModal();

    activeModalController = createPanZoomController(modalViewport, cloneSvg, {
      zoomText: document.getElementById('modal-zoom-text'),
      zoomInBtn: document.getElementById('modal-zoom-in'),
      zoomOutBtn: document.getElementById('modal-zoom-out'),
      zoomResetBtn: document.getElementById('modal-zoom-reset'),
    });
  });
}