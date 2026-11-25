export async function registerBusinessWorker() {
 if (!('serviceWorker' in navigator)) return;
 const host = window.location.hostname.toLowerCase();
 const label = host.split('.')[0] ?? '';
 const lovableDomain = ['lovable.app', 'gpt-eng.com', 'gptengineer.run'].some(d => host.endsWith('.' + d));
 const preview = (lovableDomain && (/^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(label) || /^project--.+-dev$/.test(label))) || ['lovableproject.com', 'lovableproject-dev.com', 'beta.lovable.dev'].some(d => host === d || host.endsWith('.' + d));
 if (!import.meta.env.PROD || window.self !== window.top || preview || new URLSearchParams(window.location.search).get('sw') === 'off') {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.filter(r => [r.active, r.waiting, r.installing].some(w => w && new URL(w.scriptURL).pathname === '/sw.js')).map(r => r.unregister()));
  return;
 }
 const { registerSW } = await import('virtual:pwa-register');
 registerSW({ immediate: true });
}
