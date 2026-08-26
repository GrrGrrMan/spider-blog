export interface ViewBoxRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PanZoomControls {
  zoomText?: HTMLElement | null;
  zoomInBtn?: HTMLElement | null;
  zoomOutBtn?: HTMLElement | null;
  zoomResetBtn?: HTMLElement | null;
  tourPrevBtn?: HTMLElement | null;
  tourNextBtn?: HTMLElement | null;
  stepIndicator?: HTMLElement | null;
  tourNavWrapper?: HTMLElement | null;
}

export interface PanZoomController {
  resetToFit: () => void;
  stepTour: (direction: 'prev' | 'next') => void;
  focusElement: (el: SVGGraphicsElement, instant?: boolean) => void;
  destroy: () => void;
}