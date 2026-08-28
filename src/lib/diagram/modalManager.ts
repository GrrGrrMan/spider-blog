import { createPanZoomController } from './panZoomEngine';
import type { PanZoomController } from './types';
import { lifecycle } from '../client/lifecycle';

let activeModalController: PanZoomController | null = null;

function sanitizeSvgClone(sourceSvg: SVGSVGElement): SVGSVGElement {
  const pristineVb =
    sourceSvg.getAttribute('data-original-viewbox') ||
    sourceSvg.getAttribute('viewBox') ||
    '0 0 1000 500';

  const cloneSvg = sourceSvg.cloneNode(true) as SVGSVGElement;
  cloneSvg.setAttribute('viewBox', pristineVb);
  cloneSvg.setAttribute('data-original-viewbox', pristineVb);

  // Strip inline tour highlight opacities and filters from active inline states
  const mutatedNodes = cloneSvg.querySelectorAll<SVGGraphicsElement>(
    '.cluster, .node, .statediagram-state, .actor, .task, .timeline-node, .cScale0, .cScale1, .cScale2, .pieCircle, .note'
  );
  mutatedNodes.forEach((node) => {
    node.style.opacity = '1';
    node.style.filter = '';
  });

  return cloneSvg;
}

export function setupModalTriggers(renderedSvgEl: SVGSVGElement, triggerBtn: HTMLElement): void {
  const modal = document.getElementById('diagram-modal') as HTMLDialogElement | null;
  const modalViewport = document.getElementById('modal-diagram-viewport');
  const closeBtn = document.getElementById('close-modal-btn');

  if (!modal || !modalViewport) return;

  const performClose = () => {
    if (modal.open) {
      modal.close();
    }
    activeModalController?.destroy();
    activeModalController = null;
    modalViewport.innerHTML = '';
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  };

  const onPopState = () => {
    if (modal.open) {
      performClose();
    }
  };

  const closeModal = (revertHistory = true) => {
    if (!modal.open) return;
    performClose();
    if (revertHistory && window.history.state?.modalOpen === 'diagram') {
      window.removeEventListener('popstate', onPopState);
      window.history.back();
    }
  };

  // Idempotent DOM binding per document lifecycle
  if (modal.dataset.modalInit !== 'true') {
    modal.dataset.modalInit = 'true';

    closeBtn?.addEventListener('click', () => closeModal(true));
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(true);
    });

    modal.addEventListener('cancel', (e) => {
      e.preventDefault();
      closeModal(true);
    });

    modal.addEventListener(
      'wheel',
      (e) => {
        if (e.target !== modalViewport && !modalViewport.contains(e.target as Node)) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    lifecycle.register(() => {
      performClose();
      modal.dataset.modalInit = 'false';
      window.removeEventListener('popstate', onPopState);
    });
  }

  triggerBtn.addEventListener('click', () => {
    performClose();

    const cloneSvg = sanitizeSvgClone(renderedSvgEl);
    modalViewport.appendChild(cloneSvg);

    modal.showModal();
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Mobile Back-Button History Trap (Preserves Astro Router State)
    const astroState = window.history.state || {};
    window.history.pushState({ ...astroState, modalOpen: 'diagram' }, '');
    window.removeEventListener('popstate', onPopState);
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