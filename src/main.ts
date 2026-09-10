
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

// ponytail: el SW de Angular está desactivado; desregistrar el que quedó instalado en dispositivos viejos
// y borrar su caché. Quitar este bloque cuando se reactive ServiceWorkerModule con SwUpdate.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(regs => regs.forEach(r => r.unregister()))
    .catch(() => undefined);
}
if (typeof caches !== 'undefined') {
  caches.keys()
    .then(keys => keys.filter(k => k.startsWith('ngsw')).forEach(k => caches.delete(k)))
    .catch(() => undefined);
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
