import { getControls, getState, type State } from './model.ts';
import { renderDiagramSvg } from './render.ts';

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
      const svg = renderDiagramSvg(source, 'book', state);
      const exports = ['light','dark'].map((theme) => ({
        theme, svg:renderDiagramSvg(source,theme as 'light' | 'dark',state)
      }));
      const scroll = figure.querySelector<HTMLElement>('.book-diagram-scroll');
      if (scroll) scroll.innerHTML = svg; // renderer emits escaped, validated SVG only
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
  article.addEventListener('click',beforeDownload);
  article.addEventListener('input',onInput);
  return () => {
    article.removeEventListener('click',beforeDownload);
    article.removeEventListener('input',onInput);
    if (frame) cancelAnimationFrame(frame);
    pending.clear();
  };
}
