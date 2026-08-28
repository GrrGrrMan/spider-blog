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
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };

    closeBtn?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    modal.addEventListener('close', () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    });
    modal.addEventListener(
      'wheel',
      (e) => {
        // Prevent background documentation scrolling when cursor is on modal header/margins
        if (e.target !== modalViewport && !modalViewport.contains(e.target as Node)) {
          e.preventDefault();
        }
      },
      { passive: false }
    );
    isModalDismissBound = true;
  }

  triggerBtn.addEventListener('click', () => {
    activeModalController?.destroy();
    modalViewport.innerHTML = '';

    const pristineVb =
      renderedSvgEl.getAttribute('data-original-viewbox') ||
      renderedSvgEl.getAttribute('viewBox') ||
      '0 0 1000 500';

    const cloneSvg = renderedSvgEl.cloneNode(true) as SVGSVGElement;
    cloneSvg.setAttribute('viewBox', pristineVb);
    cloneSvg.setAttribute('data-original-viewbox', pristineVb);
    modalViewport.appendChild(cloneSvg);

    modal.showModal();
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Mobile Back-Button History Trap
    window.history.pushState({ modalOpen: 'diagram' }, '');
    const onPopState = () => {
      if (modal.open) {
        modal.close();
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }
    };
    window.addEventListener('popstate', onPopState, { once: true });

    // Initialize controller on pristine baseline after dialog reflow
    requestAnimationFrame(() => {
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
  });
}