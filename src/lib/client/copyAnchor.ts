export function initAnchorsAndCopyButtons(): void {
  // 1. Heading Permalinks
  const headings = document.querySelectorAll<HTMLHeadingElement>('article h2[id], article h3[id]');
  headings.forEach((h) => {
    if (h.querySelector('.heading-anchor-link')) return;

    const anchor = document.createElement('a');
    anchor.className =
      'heading-anchor-link ml-2 text-zinc-600 hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono inline-flex items-center select-none';
    anchor.href = `#${h.id}`;
    anchor.setAttribute('aria-label', `Direct link to ${h.textContent}`);

    const hashSvg =
      '<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>';
    const checkSvg =
      '<svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>';

    anchor.innerHTML = hashSvg;
    h.classList.add('group', 'flex', 'items-center');
    h.appendChild(anchor);

    const onAnchorClick = async (e: MouseEvent) => {
      e.preventDefault();
      const deepUrl = `${window.location.origin}${window.location.pathname}#${h.id}`;
      history.pushState(null, '', `#${h.id}`);
      try {
        await navigator.clipboard.writeText(deepUrl);
        anchor.innerHTML = checkSvg;
        setTimeout(() => {
          anchor.innerHTML = hashSvg;
        }, 1500);
      } catch {
        window.location.hash = h.id;
      }
    };

    anchor.addEventListener('click', onAnchorClick);
  });

  // 2. Code Block Copy Buttons
  const preBlocks = document.querySelectorAll<HTMLPreElement>('article pre:not([data-language="mermaid"])');
  preBlocks.forEach((pre) => {
    if (pre.querySelector('.code-copy-btn')) return;

    pre.style.position = 'relative';
    const copyBtn = document.createElement('button');
    copyBtn.className =
      'code-copy-btn sticky top-2.5 float-right -mt-1 mb-2 px-2.5 py-1 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-md text-[11px] font-mono transition-all opacity-0 hover:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-sky-400 outline-none flex items-center gap-1.5 shadow-sm cursor-pointer z-10';
    copyBtn.setAttribute('aria-label', 'Copy code to clipboard');

    const defaultHtml = `
      <svg class="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      <span>Copy</span>
    `;
    const copiedHtml = `
      <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <span class="text-emerald-400 font-semibold">Copied</span>
    `;

    copyBtn.innerHTML = defaultHtml;
    pre.classList.add('group');
    pre.appendChild(copyBtn);

    copyBtn.addEventListener('click', async () => {
      const codeEl = pre.querySelector('code');
      const codeText = codeEl ? codeEl.innerText : pre.innerText;
      try {
        await navigator.clipboard.writeText(codeText.trim());
        copyBtn.innerHTML = copiedHtml;
        copyBtn.classList.add('border-emerald-600/70', 'bg-emerald-950/50');
        setTimeout(() => {
          copyBtn.innerHTML = defaultHtml;
          copyBtn.classList.remove('border-emerald-600/70', 'bg-emerald-950/50');
        }, 2000);
      } catch {
        copyBtn.innerText = 'Failed';
      }
    });
  });
}