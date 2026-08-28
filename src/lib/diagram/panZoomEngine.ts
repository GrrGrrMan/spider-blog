import { TourEngine } from './tourEngine';
import type { PanZoomController, PanZoomControls, ViewBoxRect } from './types';

export function createPanZoomController(
  viewportEl: HTMLElement,
  svgEl: SVGSVGElement,
  controls: PanZoomControls = {}
): PanZoomController {
  const origAttr = svgEl.getAttribute('viewBox');
  let origX = 0,
    origY = 0,
    origW = 1000,
    origH = 500;

  if (origAttr) {
    const parts = origAttr.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      [origX, origY, origW, origH] = parts;
    }
  } else {
    const bbox = svgEl.getBBox();
    origX = bbox.x || 0;
    origY = bbox.y || 0;
    origW = bbox.width || 800;
    origH = bbox.height || 400;
  }

  const current: ViewBoxRect = { x: origX, y: origY, w: origW, h: origH };
  let animFrameId: number | null = null;

  svgEl.removeAttribute('width');
  svgEl.removeAttribute('height');
  svgEl.style.width = '100%';
  svgEl.style.height = '100%';
  svgEl.style.maxWidth = '100%';
  svgEl.style.maxHeight = '100%';
  svgEl.style.display = 'block';
  svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  // Strict touch isolation: Prevents page scroll hijacking during pan/zoom
  viewportEl.style.touchAction = 'none';

  const tourEngine = new TourEngine(svgEl, controls.stepIndicator);

  function applyViewBox() {
    svgEl.setAttribute('viewBox', `${current.x} ${current.y} ${current.w} ${current.h}`);
    if (controls.zoomText) {
      const zoomPercent = Math.round((origW / current.w) * 100);
      controls.zoomText.textContent = `${zoomPercent}%`;
    }
  }

  function animateCameraTo(target: ViewBoxRect, duration = 400) {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    const startX = current.x,
      startY = current.y,
      startW = current.w,
      startH = current.h;
    const startTime = performance.now();

    function step(now: number) {
      const progress = Math.min((now - startTime) / duration, 1.0);
      const ease = 1 - Math.pow(1 - progress, 3); // Cubic Ease Out

      current.x = startX + (target.x - startX) * ease;
      current.y = startY + (target.y - startY) * ease;
      current.w = startW + (target.w - startW) * ease;
      current.h = startH + (target.h - startH) * ease;
      applyViewBox();

      if (progress < 1.0) {
        animFrameId = requestAnimationFrame(step);
      }
    }
    animFrameId = requestAnimationFrame(step);
  }

  function focusElement(el: SVGGraphicsElement, instant = false) {
    const calc = tourEngine.calculateTargetViewBox(el, viewportEl);
    if (!calc) return;

    tourEngine.applyHighlight(el);
    if (instant) {
      Object.assign(current, calc.target);
      applyViewBox();
    } else {
      animateCameraTo(calc.target, 420);
    }
  }

  function focusGroup(elements: SVGGraphicsElement[], instant = false) {
    const calc = tourEngine.calculateGroupTargetViewBox(elements, viewportEl, 48);
    if (!calc) return;

    tourEngine.applyGroupHighlight(elements);
    if (instant) {
      Object.assign(current, calc.target);
      applyViewBox();
    } else {
      animateCameraTo(calc.target, 450);
    }
  }

  function resetToFit() {
    tourEngine.clearHighlights();
    animateCameraTo({ x: origX, y: origY, w: origW, h: origH }, 350);
    tourEngine.updateIndicator(`All (${tourEngine.elementsCount})`);
  }

  function stepTour(direction: 'prev' | 'next') {
    const target = tourEngine.step(direction);
    if (target) focusElement(target);
  }

  // Pointer & Click Listeners
  svgEl.style.cursor = 'pointer';
  let lastTapTime = 0;

  const onSvgClick = (e: MouseEvent) => {
    const target = (e.target as Element)?.closest<SVGGraphicsElement>('.cluster, .node, g[id^="subGraph"]');
    if (target) {
      e.stopPropagation();
      focusElement(target);
      tourEngine.setCurrentTarget(target);
    }
  };
  svgEl.addEventListener('click', onSvgClick);

  // Multi-Touch & Mouse Pointer Handling
  let activePointers: { id: number; x: number; y: number }[] = [];
  let isMouseDragging = false;
  let startX = 0,
    startY = 0;
  let startVbX = 0,
    startVbY = 0;
  let initialPinchDistance = 0;
  let initialPinchViewBox: ViewBoxRect = { ...current };
  let cachedRect: DOMRect | null = null;

  const onPointerDown = (e: PointerEvent) => {
    // Check for double tap on touch
    if (e.pointerType === 'touch') {
      const now = performance.now();
      if (now - lastTapTime < 300) {
        resetToFit();
        lastTapTime = 0;
        return;
      }
      lastTapTime = now;
    }

    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 1) return;
    if (animFrameId) cancelAnimationFrame(animFrameId);

    cachedRect = viewportEl.getBoundingClientRect();
    activePointers.push({ id: e.pointerId, x: e.clientX, y: e.clientY });

    if (activePointers.length === 1 && e.pointerType === 'mouse') {
      isMouseDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startVbX = current.x;
      startVbY = current.y;
      viewportEl.setPointerCapture(e.pointerId);
      viewportEl.style.cursor = 'grabbing';
    } else if (activePointers.length === 2) {
      // Begin 2-finger pinch gesture
      isMouseDragging = false;
      const dx = activePointers[0].x - activePointers[1].x;
      const dy = activePointers[0].y - activePointers[1].y;
      initialPinchDistance = Math.hypot(dx, dy);
      initialPinchViewBox = { ...current };
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    const idx = activePointers.findIndex((p) => p.id === e.pointerId);
    if (idx !== -1) {
      activePointers[idx].x = e.clientX;
      activePointers[idx].y = e.clientY;
    }

    const rect = cachedRect || viewportEl.getBoundingClientRect();

    // 2-Finger Touch Pinch Zoom
    if (activePointers.length === 2 && initialPinchDistance > 0) {
      const dx = activePointers[0].x - activePointers[1].x;
      const dy = activePointers[0].y - activePointers[1].y;
      const currentDistance = Math.hypot(dx, dy);
      const scaleFactor = initialPinchDistance / Math.max(currentDistance, 1);

      let newW = initialPinchViewBox.w * scaleFactor;
      let newH = initialPinchViewBox.h * scaleFactor;

      if (newW >= origW * 0.1 && newW <= origW * 8.0) {
        const midX = (activePointers[0].x + activePointers[1].x) / 2;
        const midY = (activePointers[0].y + activePointers[1].y) / 2;
        const u = Math.min(Math.max((midX - rect.left) / rect.width, 0), 1);
        const v = Math.min(Math.max((midY - rect.top) / rect.height, 0), 1);

        const focusX = initialPinchViewBox.x + u * initialPinchViewBox.w;
        const focusY = initialPinchViewBox.y + v * initialPinchViewBox.h;

        current.x = focusX - u * newW;
        current.y = focusY - v * newH;
        current.w = newW;
        current.h = newH;
        applyViewBox();
      }
      return;
    }

    // Single Mouse Drag
    if (isMouseDragging && activePointers.length === 1) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      current.x = startVbX - dx * (current.w / rect.width);
      current.y = startVbY - dy * (current.h / rect.height);
      applyViewBox();
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    activePointers = activePointers.filter((p) => p.id !== e.pointerId);
    if (activePointers.length < 2) {
      initialPinchDistance = 0;
    }
    if (activePointers.length === 0) {
      isMouseDragging = false;
      if (viewportEl.hasPointerCapture(e.pointerId)) {
        viewportEl.releasePointerCapture(e.pointerId);
      }
      viewportEl.style.cursor = 'grab';
    }
  };

  viewportEl.addEventListener('pointerdown', onPointerDown);
  viewportEl.addEventListener('pointermove', onPointerMove);
  viewportEl.addEventListener('pointerup', onPointerUp);
  viewportEl.addEventListener('pointercancel', onPointerUp);

  // Wheel Zoom (Desktop: Ctrl/Cmd + Wheel for inline cards, direct wheel inside Fullscreen Modal)
  const isModalViewport = viewportEl.id === 'modal-diagram-viewport';

  const onWheel = (e: WheelEvent) => {
    if (!isModalViewport && !e.ctrlKey && !e.metaKey) {
      return; // Allow natural document scrolling
    }
    e.preventDefault();
    if (animFrameId) cancelAnimationFrame(animFrameId);
    const rect = viewportEl.getBoundingClientRect();
    const u = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const v = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);

    const svgX = current.x + u * current.w;
    const svgY = current.y + v * current.h;
    const factor = e.deltaY < 0 ? 0.85 : 1.18;
    const newW = current.w * factor;
    const newH = current.h * factor;

    if (newW < origW * 0.1 || newW > origW * 8.0) return;

    current.x = svgX - u * newW;
    current.y = svgY - v * newH;
    current.w = newW;
    current.h = newH;
    applyViewBox();
  };
  viewportEl.addEventListener('wheel', onWheel, { passive: false });

  // Toolbar Button Attachments
  controls.zoomInBtn?.addEventListener('click', () => {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    const cx = current.x + 0.5 * current.w;
    const cy = current.y + 0.5 * current.h;
    current.x = cx - 0.5 * (current.w * 0.8);
    current.y = cy - 0.5 * (current.h * 0.8);
    current.w *= 0.8;
    current.h *= 0.8;
    applyViewBox();
  });

  controls.zoomOutBtn?.addEventListener('click', () => {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    const cx = current.x + 0.5 * current.w;
    const cy = current.y + 0.5 * current.h;
    current.x = cx - 0.5 * (current.w * 1.25);
    current.y = cy - 0.5 * (current.h * 1.25);
    current.w *= 1.25;
    current.h *= 1.25;
    applyViewBox();
  });

  controls.zoomResetBtn?.addEventListener('click', resetToFit);
  controls.tourPrevBtn?.addEventListener('click', () => stepTour('prev'));
  controls.tourNextBtn?.addEventListener('click', () => stepTour('next'));

  if (controls.tourNavWrapper) {
    controls.tourNavWrapper.style.display = tourEngine.elementsCount >= 2 ? 'flex' : 'none';
  }

  // Startup: Frame initial cluster
  if (tourEngine.elementsCount >= 3) {
    setTimeout(() => {
      const initialCluster = tourEngine.getInitialCluster(3);
      focusGroup(initialCluster, false);
      tourEngine.updateIndicator('1-3');
    }, 60);
  } else if (tourEngine.elementsCount > 0) {
    setTimeout(() => {
      const allElements = tourEngine.getInitialCluster(tourEngine.elementsCount);
      focusGroup(allElements, false);
      tourEngine.updateIndicator(1);
    }, 60);
  } else {
    resetToFit();
  }

  return {
    resetToFit,
    stepTour,
    focusElement,
    destroy() {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      svgEl.removeEventListener('click', onSvgClick);
      viewportEl.removeEventListener('pointerdown', onPointerDown);
      viewportEl.removeEventListener('pointermove', onPointerMove);
      viewportEl.removeEventListener('pointerup', onPointerUp);
      viewportEl.removeEventListener('pointercancel', onPointerUp);
      viewportEl.removeEventListener('wheel', onWheel);
    },
  };
}