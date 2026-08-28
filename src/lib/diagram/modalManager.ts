import { createPanZoomController } from './panZoomEngine';
import type { PanZoomController } from './types';

let activeModalController: PanZoomController | null = null;
let isModalDismissBound = false;

export function setupModalTriggers(renderedSvgEl: SVGSVGElement, triggerBtn: HTMLElement): void {
  const modal = document.getElementById('diagram-modal') as HTMLDialogElement | null;
  const modalViewport = document.getElementById('modal-diagram-viewport');
  const closeBtn = document.getElementById('close-modal-btn');

  if (!modal || !modalViewport) return;

  if (!isModalDismissBound) {
    const closeModal = () => {
      modal.close();
      document.body.style.overflow = '';
    };

    closeBtn?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    modal.addEventListener('close', () => {
      document.body.style.overflow = '';
    });
    isModalDismissBound = true;
  }

  triggerBtn.addEventListener('click', () => {
    activeModalController?.destroy();
    modalViewport.innerHTML = '';

    const cloneSvg = renderedSvgEl.cloneNode(true) as SVGSVGElement;
    modalViewport.appendChild(cloneSvg);
    modal.showModal();
    document.body.style.overflow = 'hidden';

    activeModalController = createPanZoomController(modalViewport, cloneSvg, {
      zoomText: document.getElementById('modal-zoom-text'),
      zoomInBtn: document.getElementById('modal-zoom-in'),
      zoomOutBtn: document.getElementById('modal-zoom-out'),
      zoomResetBtn: document.getElementById('modal-zoom-reset'),
      tourPrevBtn: document.getElementById('modal-tour-prev'),
      tourNextBtn: document.getElementById('modal-tour-next'),
      stepIndicator: document.getElementById('modal-step-indicator'),
      tourNavWrapper: document.getElementById('modal-tour-nav-wrapper'),
    });
  });
}