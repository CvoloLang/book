import { enhanceDiagrams } from './client.ts';

const root = document.documentElement;
const toggle = document.querySelector<HTMLButtonElement>('[data-visual-theme]');
if (toggle) {
  const syncTheme = () => toggle.setAttribute('aria-pressed', String(root.classList.contains('dark')));
  toggle.addEventListener('click', () => { root.classList.toggle('dark'); syncTheme(); });
  syncTheme();
}
enhanceDiagrams(document.body);
