
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();

  // En produccion se silencian los logs de depuracion (log/debug/info) para no
  // ensuciar la consola ni filtrar datos. Se conservan warn y error, utiles para
  // diagnostico. Cubre todo el codigo y cualquier log futuro sin tocar 37 archivos.
  const noop = () => { /* silencio en produccion */ };
  console.log = noop;
  console.debug = noop;
  console.info = noop;
}

// ponytail: el SW de Angular está desactivado; desregistrar el que quedó instalado en dispositivos viejos
// y borrar su caché. Quitar este bloque cuando se reactive ServiceWorkerModule con SwUpdate.
try {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(regs => regs.forEach(r => r.unregister()))
      .catch(() => undefined);
  }
} catch (e) { /* sin API */ }
try {
  if (typeof caches !== 'undefined') {
    caches.keys()
      .then(keys => keys.filter(k => k.startsWith('ngsw')).forEach(k => caches.delete(k)))
      .catch(() => undefined);
  }
} catch (e) { /* sin API */ }

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
