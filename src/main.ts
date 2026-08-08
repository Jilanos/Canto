/** Entry point: mounts the app and registers the offline service worker. */

import './styles/app.css';
import { mountApp } from './app';
import { registerServiceWorker } from './service-worker/register';
import { t } from './i18n';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app root element');

const app = mountApp(root);

/** Reveals the offline note once a service worker is in control of the page. */
function markReadyOffline(): void {
  document.querySelector('.panel__note--hidden')?.classList.remove('panel__note--hidden');
}

// The service worker only exists in a production build; the dev server serves
// modules directly so caching would only get in the way.
if (import.meta.env.PROD) {
  if (navigator.serviceWorker?.controller) markReadyOffline();
  navigator.serviceWorker?.ready.then(markReadyOffline).catch(() => {
    /* No offline claim if registration never settled. */
  });
  registerServiceWorker({
    onUpdateReady: (activate) => {
      const banner = document.querySelector<HTMLElement>('.banner');
      const action = document.querySelector<HTMLButtonElement>('.banner__action');
      if (!banner || !action) return;
      banner.classList.remove('banner--hidden');
      action.textContent = t('app.updateAction');
      action.addEventListener('click', () => activate(), { once: true });
    },
  });
}

window.addEventListener('pagehide', () => app.dispose());
