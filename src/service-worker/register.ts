/**
 * Service worker registration (item_001 AC2).
 *
 * A waiting worker is surfaced to the user instead of being activated silently, so a
 * cache update never swaps the app out mid-exercise.
 */

export interface RegisterOptions {
  onUpdateReady?: (activate: () => void) => void;
}

export async function registerServiceWorker(options: RegisterOptions = {}): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

    const notify = (worker: ServiceWorker) => {
      options.onUpdateReady?.(() => {
        worker.postMessage({ type: 'skip-waiting' });
      });
    };

    if (registration.waiting && navigator.serviceWorker.controller) notify(registration.waiting);

    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) notify(installing);
      });
    });

    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
  } catch {
    // Offline support is an enhancement: a failed registration must not break the app.
  }
}
