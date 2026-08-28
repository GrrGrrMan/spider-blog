import { lifecycle } from './lifecycle';

export interface SearchItem {
  id: string;
  type: 'page' | 'heading' | 'content';
  docTitle: string;
  section: string;
  slug: string;
  subheading: string;
  url: string;
  content: string;
  keywords: string[];
}

let searchIndexCache: SearchItem[] | null = null;

async function loadSearchIndex(): Promise<SearchItem[]> {
  if (searchIndexCache) return searchIndexCache;
  try {
    const baseUrl = import.meta.env.BASE_URL.endsWith('/')
      ? import.meta.env.BASE_URL
      : `${import.meta.env.BASE_URL}/`;
    const res = await fetch(`${baseUrl}api/search-index.json`);
    if (res.ok) {
      searchIndexCache = await res.json();
      return searchIndexCache || [];
    }
  } catch {
    // Graceful fallback
  }
  return [];
}

function highlightQuery(text: string, query: string): string {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark class="bg-sky-500/20 text-sky-300 font-semibold px-0.5 rounded">$1</mark>');
}

function extractContextSnippet(content: string, query: string): string {
  if (!content || !query) return '';
  const qLower = query.toLowerCase();
  const cLower = content.toLowerCase();
  const matchIdx = cLower.indexOf(qLower);

  if (matchIdx === -1) {
    return content.slice(0, 95) + (content.length > 95 ? '...' : '');
  }

  const start = Math.max(0, matchIdx - 35);
  const end = Math.min(content.length, matchIdx + query.length + 55);

  let snippet = content.substring(start, end).trim();
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';

  return highlightQuery(snippet, query);
}

const ICON_HASH =
  '<svg class="w-4 h-4 text-sky-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>';
const ICON_EXCERPT =
  '<svg class="w-4 h-4 text-zinc-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h12M4 18h16" /></svg>';
const ICON_PAGE =
  '<svg class="w-4 h-4 text-zinc-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>';
const ICON_RETURN =
  '<svg class="w-4 h-4 text-sky-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a5 5 0 015 5v4m0 0l-4-4m4 4l4-4" /></svg>';

export function initSearchPalette(): void {
  const searchBtn = document.getElementById('search-dialog-trigger');
  const modal = document.getElementById('search-palette-modal') as HTMLDialogElement | null;
  const input = document.getElementById('search-palette-input') as HTMLInputElement | null;
  const resultsBox = document.getElementById('search-results-box');
  const closeBtn = document.getElementById('close-search-btn');

  if (!modal || !input || !resultsBox) return;

  let activeGlobalIndex = 0;

  function renderResults(query: string, items: SearchItem[]) {
    if (!resultsBox || !input) return;
    const q = query.toLowerCase().trim();

    let filteredItems: { item: SearchItem; isSnippetMatch: boolean }[] = [];

    if (q === '') {
      filteredItems = items
        .filter((i) => i.type === 'page')
        .slice(0, 8)
        .map((item) => ({ item, isSnippetMatch: false }));
    } else {
      const tokens = q.split(/\s+/).filter(Boolean);
      const scored = items
        .map((item) => {
          let score = 0;
          const subLower = item.subheading.toLowerCase();
          const titleLower = item.docTitle.toLowerCase();
          const secLower = item.section.toLowerCase();
          const contentLower = item.content.toLowerCase();

          let isSnippetMatch = false;

          for (const token of tokens) {
            if (subLower === token) score += 120;
            else if (subLower.includes(token)) score += 60;

            if (titleLower.includes(token)) score += 40;
            if (secLower.includes(token)) score += 20;

            for (const kw of item.keywords) {
              if (kw.toLowerCase().includes(token)) score += 30;
            }

            if (contentLower.includes(token)) {
              score += 15;
              isSnippetMatch = true;
            }
          }

          return { item, score, isSnippetMatch };
        })
        .filter((res) => res.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      filteredItems = scored.map((s) => ({ item: s.item, isSnippetMatch: s.isSnippetMatch }));
    }

    if (filteredItems.length === 0) {
      input.removeAttribute('aria-activedescendant');
      resultsBox.innerHTML = `
        <div class="py-12 text-center text-zinc-500 font-sans text-xs" role="status">
          No documentation sections or specifications match "${query}"
        </div>
      `;
      return;
    }

    const groups: { [section: string]: { item: SearchItem; isSnippetMatch: boolean }[] } = {};
    filteredItems.forEach((entry) => {
      if (!groups[entry.item.section]) groups[entry.item.section] = [];
      groups[entry.item.section].push(entry);
    });

    let runningIndex = 0;
    let html = '';

    Object.entries(groups).forEach(([sectionName, sectionEntries]) => {
      html += `
        <div class="space-y-1.5" role="group" aria-label="${sectionName}">
          <div class="text-[10px] font-mono font-bold text-sky-400/90 uppercase tracking-wider px-2 py-0.5" aria-hidden="true">
            ${sectionName}
          </div>
          <div class="space-y-1">
      `;

      sectionEntries.forEach(({ item, isSnippetMatch }) => {
        const itemIndex = runningIndex++;
        const isSelected = itemIndex === activeGlobalIndex;
        const optionId = `search-opt-${itemIndex}`;

        if (isSelected) {
          input.setAttribute('aria-activedescendant', optionId);
        }

        const icon = item.type === 'page' ? ICON_PAGE : isSnippetMatch ? ICON_EXCERPT : ICON_HASH;
        const displayTitle = highlightQuery(item.subheading, q);
        const snippetText = isSnippetMatch ? extractContextSnippet(item.content, q) : '';

        html += `
          <a
            href="${item.url}"
            id="${optionId}"
            role="option"
            aria-selected="${isSelected ? 'true' : 'false'}"
            data-item-index="${itemIndex}"
            class="search-card flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
              isSelected
                ? 'bg-sky-950/70 border-sky-600/70 text-zinc-100 shadow-sm'
                : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/70 hover:border-zinc-700'
            }"
          >
            <div class="flex items-start gap-3 min-w-0 pr-2">
              <div class="mt-0.5" aria-hidden="true">${icon}</div>
              <div class="min-w-0">
                <div class="font-medium text-sm text-zinc-100 truncate">
                  ${displayTitle}
                </div>
                <div class="text-[11px] text-zinc-500 font-sans truncate mt-0.5">
                  ${item.docTitle}
                </div>
                ${
                  snippetText
                    ? `<div class="text-xs text-zinc-400 font-sans mt-1 line-clamp-1 leading-relaxed">${snippetText}</div>`
                    : ''
                }
              </div>
            </div>
            <div class="selected-indicator flex-shrink-0 ${isSelected ? 'opacity-100' : 'opacity-0'}" aria-hidden="true">
              ${ICON_RETURN}
            </div>
          </a>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    resultsBox.innerHTML = html;
  }

  let isBackListenerBound = false;

  const onPopState = () => {
    if (modal.open) {
      closeSearch(false);
    }
  };

  const openSearch = async () => {
    modal.showModal();
    document.body.style.overflow = 'hidden';
    input.value = '';
    input.setAttribute('aria-expanded', 'true');
    activeGlobalIndex = 0;

    // Mobile Back-Button History Trap (Preserves Astro Router State)
    const astroState = window.history.state || {};
    window.history.pushState({ ...astroState, modalOpen: 'search' }, '');
    if (!isBackListenerBound) {
      window.addEventListener('popstate', onPopState);
      isBackListenerBound = true;
    }

    const items = await loadSearchIndex();
    renderResults('', items);
    input.focus();
  };

  const closeSearch = (revertHistory = true) => {
    if (!modal.open) return;
    modal.close();
    document.body.style.overflow = '';
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');

    if (revertHistory && window.history.state?.modalOpen === 'search') {
      window.history.back();
    }
  };

  searchBtn?.addEventListener('click', openSearch);
  closeBtn?.addEventListener('click', closeSearch);

  const onModalBackdropClick = (e: MouseEvent) => {
    if (e.target === modal) closeSearch();
  };
  modal.addEventListener('click', onModalBackdropClick);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const onInput = (e: Event) => {
    const targetValue = (e.target as HTMLInputElement).value;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      activeGlobalIndex = 0;
      const items = await loadSearchIndex();
      renderResults(targetValue, items);
    }, 120);
  };
  input.addEventListener('input', onInput);

  const onWindowKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      modal.open ? closeSearch() : openSearch();
    }
    if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
      e.preventDefault();
      openSearch();
    }
  };
  window.addEventListener('keydown', onWindowKeydown);

  const onInputKeydown = (e: KeyboardEvent) => {
    const cards = resultsBox.querySelectorAll<HTMLAnchorElement>('.search-card');
    if (cards.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      cards[activeGlobalIndex]?.classList.remove('bg-sky-950/70', 'border-sky-600/70', 'text-zinc-100');
      cards[activeGlobalIndex]?.classList.add('bg-zinc-950/60', 'border-zinc-800/80', 'text-zinc-300');
      cards[activeGlobalIndex]?.setAttribute('aria-selected', 'false');
      cards[activeGlobalIndex]?.querySelector('.selected-indicator')?.classList.add('opacity-0');

      activeGlobalIndex = (activeGlobalIndex + 1) % cards.length;

      cards[activeGlobalIndex]?.classList.add('bg-sky-950/70', 'border-sky-600/70', 'text-zinc-100');
      cards[activeGlobalIndex]?.classList.remove('bg-zinc-950/60', 'border-zinc-800/80', 'text-zinc-300');
      cards[activeGlobalIndex]?.setAttribute('aria-selected', 'true');
      cards[activeGlobalIndex]?.querySelector('.selected-indicator')?.classList.remove('opacity-0');
      input.setAttribute('aria-activedescendant', cards[activeGlobalIndex]?.id || '');
      cards[activeGlobalIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      cards[activeGlobalIndex]?.classList.remove('bg-sky-950/70', 'border-sky-600/70', 'text-zinc-100');
      cards[activeGlobalIndex]?.classList.add('bg-zinc-950/60', 'border-zinc-800/80', 'text-zinc-300');
      cards[activeGlobalIndex]?.setAttribute('aria-selected', 'false');
      cards[activeGlobalIndex]?.querySelector('.selected-indicator')?.classList.add('opacity-0');

      activeGlobalIndex = (activeGlobalIndex - 1 + cards.length) % cards.length;

      cards[activeGlobalIndex]?.classList.add('bg-sky-950/70', 'border-sky-600/70', 'text-zinc-100');
      cards[activeGlobalIndex]?.classList.remove('bg-zinc-950/60', 'border-zinc-800/80', 'text-zinc-300');
      cards[activeGlobalIndex]?.setAttribute('aria-selected', 'true');
      cards[activeGlobalIndex]?.querySelector('.selected-indicator')?.classList.remove('opacity-0');
      input.setAttribute('aria-activedescendant', cards[activeGlobalIndex]?.id || '');
      cards[activeGlobalIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      cards[activeGlobalIndex]?.click();
    }
  };
  input.addEventListener('keydown', onInputKeydown);

  lifecycle.register(() => {
    window.removeEventListener('keydown', onWindowKeydown);
    if (isBackListenerBound) {
      window.removeEventListener('popstate', onPopState);
      isBackListenerBound = false;
    }
  });
}