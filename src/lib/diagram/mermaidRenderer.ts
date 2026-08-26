import mermaid from 'mermaid';
import { decodeHtmlEntities } from './svgMath';

let isInitialized = false;

export function initMermaid(): void {
  if (isInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'JetBrains Mono, monospace',
    themeVariables: {
      darkMode: true,
      background: '#09090b',
      mainBkg: '#09090b',
      primaryColor: '#0369a1',
      primaryTextColor: '#f4f4f5',
      primaryBorderColor: '#38bdf8',
      lineColor: '#38bdf8',
      secondaryColor: '#18181b',
      tertiaryColor: '#18181b',
      border1: '#27272a',
      border2: '#3f3f46',
      fontSize: '14px',
    },
  });
  isInitialized = true;
}

export function createDiagramCard(): {
  card: HTMLElement;
  toolbar: HTMLElement;
  viewport: HTMLElement;
} {
  const card = document.createElement('div');
  card.className = 'diagram-card my-6 bg-zinc-900/70 border border-zinc-800 rounded-xl overflow-hidden shadow-lg';

  const toolbar = document.createElement('div');
  toolbar.className =
    'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-zinc-950/90 border-b border-zinc-800 text-xs font-mono text-zinc-400';
  toolbar.innerHTML = `
    <div class="flex items-center gap-2 text-sky-400 font-semibold text-[11px] sm:text-xs">
      <span>// ARCHITECTURE_DIAGRAM</span>
    </div>
    <div class="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
      <div class="tour-nav-wrapper flex items-center bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 gap-1">
        <span class="text-[10px] text-zinc-500 uppercase px-0.5">Tour:</span>
        <button class="tour-prev-btn px-2 py-1 hover:bg-zinc-800 rounded text-zinc-300 hover:text-sky-400 transition-colors text-[11px]" title="Previous Block">‹ Prev</button>
        <span class="step-indicator text-[10px] text-sky-400 font-bold px-1 min-w-[32px] text-center">1/?</span>
        <button class="tour-next-btn px-2 py-1 hover:bg-zinc-800 rounded text-zinc-300 hover:text-sky-400 transition-colors text-[11px]" title="Next Block">Next ›</button>
      </div>
      <div class="flex items-center gap-1">
        <button class="zoom-out-btn px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded transition-colors text-zinc-300 font-bold" title="Zoom Out">-</button>
        <span class="zoom-level-text text-[10px] text-zinc-500 w-9 text-center">100%</span>
        <button class="zoom-in-btn px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded transition-colors text-zinc-300 font-bold" title="Zoom In">+</button>
        <button class="zoom-reset-btn px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded transition-colors text-[11px] text-zinc-300" title="Fit to Screen">⟲ Fit</button>
        <span class="text-zinc-700 hidden sm:inline">|</span>
        <button class="fullscreen-btn px-2.5 py-1 bg-sky-950/60 hover:bg-sky-900/60 border border-sky-800 text-sky-300 rounded transition-colors text-[11px]">⛶ Fullscreen</button>
      </div>
    </div>
  `;

  const viewport = document.createElement('div');
  viewport.className =
    'diagram-viewport w-full relative overflow-hidden bg-zinc-950/40 select-none p-2 sm:p-4 flex items-center justify-center';

  card.appendChild(toolbar);
  card.appendChild(viewport);
  return { card, toolbar, viewport };
}

export async function renderMermaidDiagram(
  rawCode: string,
  index: number
): Promise<{ svgString: string; error?: string }> {
  try {
    const cleanCode = decodeHtmlEntities(rawCode).trim();
    const diagramId = `mermaid-svg-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`;
    const { svg } = await mermaid.render(diagramId, cleanCode);
    return { svgString: svg };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Syntax error in Mermaid definition';
    return { svgString: '', error: message };
  }
}