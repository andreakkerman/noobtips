import { categories, type CategoryId } from './data/tips';

interface UpdateSession { started: boolean; category: CategoryId; sound: boolean }
const SESSION_KEY = 'noobtips.update-session.v1';
// Read once at module startup so React StrictMode cannot consume the handoff twice.
export const updateSession: UpdateSession | null = (() => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY);
    const value = JSON.parse(raw ?? 'null');
    return value && typeof value.started === 'boolean' && typeof value.sound === 'boolean'
      ? { ...value, category: categories.some(c => c.id === value.category) ? value.category : 'general' } : null;
  } catch { return null; }
})();

let registration: ServiceWorkerRegistration | undefined;
let safe = false;
let snapshot: UpdateSession = { started: false, category: 'general', sound: true };
let reloadPending = false;
let reloading = false;
function applyPending() {
  if (!safe || reloading || document.visibilityState !== 'visible') return;
  if (reloadPending) {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(snapshot)); }
    catch { if (snapshot.started) return; } // Preserve menu/session if storage is blocked.
    reloading = true;
    location.reload();
  } else registration?.waiting?.postMessage({ type: 'ACTIVATE_WHEN_ALONE' });
}
// Called synchronously on state transitions, including before a spin starts.
export function setUpdateBoundary(idle: boolean, session: UpdateSession) {
  safe = idle; snapshot = session; applyPending();
}
export function registerOfflineGame() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  let hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) { reloadPending = true; applyPending(); }
    hadController = true;
  });
  const check = () => {
    if (document.visibilityState !== 'visible') return;
    void registration?.update().catch(() => {}); // Offline is a normal condition.
    applyPending();
  };
  void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
    scope: import.meta.env.BASE_URL, updateViaCache: 'none',
  }).then(value => {
    registration = value;
    const watch = () => {
      const worker = value.installing;
      worker?.addEventListener('statechange', () => { if (worker.state === 'installed') applyPending(); });
    };
    value.addEventListener('updatefound', watch); watch(); check();
  }).catch(() => {}); // Game remains playable if installation/storage is unavailable.
  document.addEventListener('visibilitychange', check);
  window.addEventListener('online', check);
  window.setInterval(check, 5 * 60 * 1000);
}
