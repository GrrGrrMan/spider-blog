import { decodeHtmlEntities } from './svgMath';

let isInitialized = false;
let mermaidInstance: typeof import('mermaid').default | null = null;

export async function getMermaid(): Promise<typeof import('mermaid').default> {
  if (!mermaidInstance) {
    const mod = await import('mermaid');
    mermaidInstance = mod.default;
  }
  if (!isInitialized && mermaidInstance) {
    mermaidInstance.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: '"JetBrains Mono", monospace',
      flowchart: {
        htmlLabels: false,
        useMaxWidth: false,
        nodeSpacing: 45,
        rankSpacing: 40,
        padding: 20,
      },
      themeVariables: {
        darkMode: true,
        background: '#09090b',
        mainBkg: '#09090b',
        primaryColor: '#0369a1',
        primaryTextColor: '#f4f4f5',
        primaryBorderColor: '#38bdf8',
        lineColor: '#38bdf8',
        secondaryColor: '#1e293b',
        secondaryTextColor: '#f4f4f5',
        secondaryBorderColor: '#0284c7',
        tertiaryColor: '#312e81',
        tertiaryTextColor: '#f4f4f5',
        tertiaryBorderColor: '#818cf8',
        border1: '#27272a',
        border2: '#3f3f46',
        noteBkgColor: '#18181b',
        noteTextColor: '#f4f4f5',
        noteBorderColor: '#38bdf8',
        actorBkg: '#0f172a',
        actorBorder: '#38bdf8',
        actorTextColor: '#f4f4f5',
        actorLineColor: '#38bdf8',
        signalColor: '#38bdf8',
        signalTextColor: '#f4f4f5',
        labelBoxBkgColor: '#18181b',
        labelBoxBorderColor: '#38bdf8',
        labelTextColor: '#f4f4f5',
        sectionBkgColor: '#18181b',
        sectionBkgColor2: '#09090b',
        taskBorderColor: '#38bdf8',
        taskBkgColor: '#0369a1',
        taskTextColor: '#f4f4f5',
        activeTaskBorderColor: '#38bdf8',
        activeTaskBkgColor: '#0284c7',
        gridColor: '#27272a',
        pie1: '#0284c7',
        pie2: '#6366f1',
        pie3: '#0d9488',
        pie4: '#d97706',
        pie5: '#e11d48',
        pie6: '#8b5cf6',
        pieTitleTextColor: '#f4f4f5',
        pieLegendTextColor: '#d4d4d8',
        pieSectionTextColor: '#f4f4f5',
        fontSize: '12px',
      },
    });
    isInitialized = true;
  }
  return mermaidInstance;
}

export function createDiagramCard(): {
  card: HTMLElement;
  toolbar: HTMLElement;
  viewport: HTMLElement;
} {
  const card = document.createElement('div');
  card.className = 'diagram-card my-6 bg-zinc-900/70 border border-zinc-800 rounded-xl overflow-hidden shadow-lg w-full max-w-full';

  const toolbar = document.createElement('div');
  toolbar.className =
    'flex items-center justify-between gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-zinc-950/95 border-b border-zinc-800 text-xs font-mono text-zinc-400 w-full select-none';
  toolbar.innerHTML = `
    <div class="diagram-toolbar-title flex items-center gap-1.5 text-sky-400 font-semibold text-[10px] sm:text-xs truncate">
      <span class="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0"></span>
      <span class="truncate">// DIAGRAM</span>
    </div>
    <div class="flex items-center gap-1 sm:gap-1.5 ml-auto">
      <div class="tour-nav-wrapper flex items-center bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 gap-0.5 sm:gap-1">
        <button class="tour-prev-btn px-1.5 py-0.5 hover:bg-zinc-800 rounded text-zinc-300 hover:text-sky-400 transition-colors text-[10px] sm:text-[11px] cursor-pointer" title="Previous Block">‹ Prev</button>
        <span class="step-indicator text-[10px] text-sky-400 font-bold px-1 min-w-[28px] text-center">1/?</span>
        <button class="tour-next-btn px-1.5 py-0.5 hover:bg-zinc-800 rounded text-zinc-300 hover:text-sky-400 transition-colors text-[10px] sm:text-[11px] cursor-pointer" title="Next Block">Next ›</button>
      </div>
      <div class="flex items-center gap-0.5 sm:gap-1">
        <button class="zoom-out-btn px-1.5 sm:px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded transition-colors text-zinc-300 font-bold text-[11px] cursor-pointer" title="Zoom Out">-</button>
        <span class="zoom-level-text diagram-zoom-level-text text-[10px] text-zinc-500 w-7 sm:w-8 text-center">100%</span>
        <button class="zoom-in-btn px-1.5 sm:px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded transition-colors text-zinc-300 font-bold text-[11px] cursor-pointer" title="Zoom In">+</button>
        <button class="zoom-reset-btn px-1.5 sm:px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded transition-colors text-[10px] sm:text-[11px] text-zinc-300 cursor-pointer" title="Fit to Viewport">⟲ Fit</button>
        <span class="text-zinc-700 mx-0.5">|</span>
        <button class="fullscreen-btn px-1.5 sm:px-2 py-0.5 bg-sky-950/60 hover:bg-sky-900/60 border border-sky-800 text-sky-300 rounded transition-colors text-[10px] sm:text-[11px] cursor-pointer" title="Fullscreen View">
          <span>⛶</span>
          <span class="diagram-toolbar-fullscreen-label ml-1">Fullscreen</span>
        </button>
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
    const mermaid = await getMermaid();
    const cleanCode = decodeHtmlEntities(rawCode).trim();
    const diagramId = `mermaid-svg-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`;
    const { svg } = await mermaid.render(diagramId, cleanCode);
    return { svgString: svg };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Syntax error in Mermaid definition';
    return { svgString: '', error: message };
  }
}