/**
 * PWA Registration, Offline Sync & Install Prompt Service
 */

let deferredInstallPrompt: any = null;
const installListeners = new Set<(canInstall: boolean) => void>();
const onlineListeners = new Set<(isOnline: boolean) => void>();

export function registerServiceWorker() {
  if (typeof window === 'undefined') return;

  // Listen for BeforeInstallPrompt event (Android, Chrome, Edge)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    installListeners.forEach((fn) => fn(true));
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    installListeners.forEach((fn) => fn(false));
    console.log('[PWA] App successfully installed');
  });

  // Track online/offline status
  window.addEventListener('online', () => {
    onlineListeners.forEach((fn) => fn(true));
  });
  window.addEventListener('offline', () => {
    onlineListeners.forEach((fn) => fn(false));
  });

  if ('serviceWorker' in navigator) {
    const isDev = Boolean((import.meta as any)?.env?.DEV);
    if (isDev) {
      // In development mode, unregister any active service workers and clear stale caches
      // to ensure Vite HMR and pre-bundled dependency chunks never conflict.
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister();
        }
      });
      if (typeof caches !== 'undefined') {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            if (key.startsWith('my-week-')) {
              caches.delete(key);
            }
          });
        });
      }
      return;
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered with scope:', registration.scope);

          // Check for updates periodically
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New content is available; will update on reload.');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.warn('[PWA] Service Worker registration failed:', error);
        });
    });
  }
}

export function subscribeToInstallPrompt(callback: (canInstall: boolean) => void) {
  callback(deferredInstallPrompt !== null);
  installListeners.add(callback);
  return () => {
    installListeners.delete(callback);
  };
}

export function subscribeToOnlineStatus(callback: (isOnline: boolean) => void) {
  callback(navigator.onLine);
  onlineListeners.add(callback);
  return () => {
    onlineListeners.delete(callback);
  };
}

export async function promptPwaInstall(): Promise<'accepted' | 'dismissed' | 'unsupported'> {
  if (!deferredInstallPrompt) {
    return 'unsupported';
  }
  try {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      deferredInstallPrompt = null;
      installListeners.forEach((fn) => fn(false));
    }
    return outcome;
  } catch (err) {
    console.error('[PWA] Error showing install prompt:', err);
    return 'unsupported';
  }
}

export function isRunningStandalone(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  return (
    Boolean(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    Boolean((window.navigator as any)?.standalone === true) ||
    Boolean(document.referrer && document.referrer.includes('android-app://'))
  );
}

export function isIosDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}
