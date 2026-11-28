import { getControls, getState, type State } from './model.ts';
import { renderDiagramSvg, renderDiagramView } from './render.ts';

/** One delegated listener per article; native form controls retain focus. */
export function enhanceDiagrams(article: HTMLElement) {
  const states = new WeakMap<HTMLElement, State>();
  let frame = 0;
  let pending = new Set<HTMLElement>();
  function redraw(figure: HTMLElement) {
    const source = figure.dataset.diagramSource;
    if (!source) return;
    const error = figure.querySelector<HTMLElement>('[data-diagram-error]');
    try {
      const controls = getControls(source);
      const state = states.get(figure) ?? getState(controls);
      const view = renderDiagramView(source, state);
      const exports = ['light','dark'].map((theme) => ({
        theme, svg:renderDiagramSvg(source,theme as 'light' | 'dark',state)
      }));
      const scroll = figure.querySelector<HTMLElement>('.book-diagram-scroll');
      if (scroll) scroll.innerHTML = view.svg; // renderer emits escaped, validated SVG only
      const heading = figure.querySelector<HTMLElement>('[data-diagram-title]');
      if (heading) heading.textContent = view.title || heading.dataset.fallbackTitle || 'Diagram';
      for (const {theme,svg: portable} of exports) {
        const link = figure.querySelector<HTMLAnchorElement>('[data-diagram-export="' + theme + '"]');
        if (link) {
          link.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(portable);
          link.removeAttribute('aria-disabled');
        }
      }
      if (error) { error.hidden=true; error.textContent=''; }
    } catch (cause) {
      if (error) { error.hidden=false; error.textContent=cause instanceof Error ? cause.message : String(cause); }
      for (const link of figure.querySelectorAll<HTMLAnchorElement>('[data-diagram-export]')) {
        link.removeAttribute('href');
        link.setAttribute('aria-disabled','true');
      }
    }
  }
  function onInput(event: Event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement)) return;
    const figure = input.closest<HTMLElement>('[data-diagram-source]');
    const id = input.dataset.diagramControl;
    if (!figure || !id || !figure.dataset.diagramSource) return;
    const controls = getControls(figure.dataset.diagramSource);
    const control = controls.find((item) => item.id === id);
    if (!control) return;
    const state = {...(states.get(figure) ?? getState(controls))};
    if (control.kind === 'slider') {
      state[id] = Number(input.value);
      const output = figure.querySelector<HTMLOutputElement>('[data-diagram-output="' + id + '"]');
      if (output) output.value = input.value;
    } else {
      const option = control.options[Number(input.value)];
      if (!option) return;
      state[id] = option.value;
    }
    states.set(figure,state);
    pending.add(figure);
    if (!frame) frame = requestAnimationFrame(() => {
      frame=0;
      const current=pending;
      pending=new Set();
      for (const item of current) if (article.contains(item)) redraw(item);
    });
  }
  // A download immediately following a slider change must use that exact
  // state, even if the scheduled animation frame has not run yet.
  function beforeDownload(event: MouseEvent) {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>('[data-diagram-export]');
    const figure = link?.closest<HTMLElement>('[data-diagram-source]');
    if (figure && pending.delete(figure)) redraw(figure);
    if (link?.getAttribute('aria-disabled') === 'true') event.preventDefault();
  }
  // Native details handles Enter/Space and works before hydration. The
  // delegated listeners add dismissal and the optional original-size view.
  const owner = article.ownerDocument;
  function closeMenu(menu: HTMLDetailsElement, restoreFocus = false) {
    menu.open = false;
    if (restoreFocus) menu.querySelector('summary')?.focus();
  }
  function setView(figure: HTMLElement, view: string) {
    if (view !== 'preview' && view !== 'source') return;
    for (const button of figure.querySelectorAll<HTMLButtonElement>('[data-diagram-view]')) {
      button.setAttribute('aria-pressed', String(button.dataset.diagramView === view));
    }
    for (const panel of figure.querySelectorAll<HTMLElement>('[data-diagram-panel]')) {
      panel.hidden = panel.dataset.diagramPanel !== view;
    }
  }
  function onViewClick(event: MouseEvent) {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>('[data-diagram-view]');
    const figure = button?.closest<HTMLElement>('.book-diagram');
    if (figure && button?.dataset.diagramView) setView(figure, button.dataset.diagramView);
  }
  async function copySource(figure: HTMLElement, button: HTMLButtonElement) {
    const code = figure.querySelector<HTMLElement>('[data-diagram-markdown]');
    const status = figure.querySelector<HTMLElement>('[data-diagram-copy-status]');
    if (!code || !status) return;
    try {
      const clipboard = owner.defaultView?.navigator.clipboard;
      if (!clipboard) throw new Error('Clipboard unavailable');
      await clipboard.writeText(code.textContent ?? '');
      status.textContent = button.dataset.copySuccess ?? 'Source copied';
    } catch {
      setView(figure, 'source');
      const range = owner.createRange();
      range.selectNodeContents(code);
      const selection = owner.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      status.textContent = button.dataset.copyFailure ?? 'Copy failed';
    }
  }
  function onMenuClick(event: MouseEvent) {
    if (!(event.target instanceof Element)) return;
    const target = event.target;
    const menu = target.closest<HTMLDetailsElement>('.book-diagram-menu');
    for (const open of article.querySelectorAll<HTMLDetailsElement>('.book-diagram-menu[open]')) {
      if (open !== menu) closeMenu(open);
    }
    if (!menu || !article.contains(menu)) return;
    const copyButton = target.closest<HTMLButtonElement>('[data-diagram-copy]');
    if (copyButton) {
      const figure = menu.closest<HTMLElement>('.book-diagram');
      if (figure) void copySource(figure, copyButton);
      closeMenu(menu, true);
      return;
    }
    const sizeButton = target.closest<HTMLButtonElement>('[data-diagram-size]');
    if (sizeButton) {
      const figure = menu.closest<HTMLElement>('.book-diagram');
      if (!figure) return;
      const scroll = figure.querySelector<HTMLElement>('.book-diagram-scroll');
      if (!scroll) return;
      // Read the current CSS mode so the responsive breakpoint has one source
      // of truth. A manual choice overrides the default for this figure only.
      const native = owner.defaultView?.getComputedStyle(scroll).overflowX === 'auto';
      figure.dataset.diagramSizeMode = native ? 'fit' : 'native';
      if (native) scroll.scrollLeft = 0;
      closeMenu(menu, true);
    } else if (target.closest('[data-diagram-export]')) {
      closeMenu(menu, true);
    }
  }
  function onMenuKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;
    const menu = article.querySelector<HTMLDetailsElement>('.book-diagram-menu[open]');
    if (!menu) return;
    const restoreFocus = menu.contains(owner.activeElement);
    closeMenu(menu, restoreFocus);
    event.preventDefault();
  }
  owner.addEventListener('click', onMenuClick);
  owner.addEventListener('keydown', onMenuKeydown);
  article.addEventListener('click',onViewClick);
  article.addEventListener('click',beforeDownload);
  article.addEventListener('input',onInput);
  return () => {
    owner.removeEventListener('click', onMenuClick);
    owner.removeEventListener('keydown', onMenuKeydown);
    article.removeEventListener('click',onViewClick);
    article.removeEventListener('click',beforeDownload);
    article.removeEventListener('input',onInput);
    if (frame) cancelAnimationFrame(frame);
    pending.clear();
  };
}
