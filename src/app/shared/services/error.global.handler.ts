import { ErrorHandler, Injectable } from '@angular/core';

const CLAVE_ULTIMA_RECARGA = 'sys::chunk-reload';
const VENTANA_RECARGA_MS = 30000;

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  // Tras un deploy, los chunks viejos ya no existen: recargar una vez para tomar la versión nueva.
  handleError(error: any): void {
    const msg = String(error?.message ?? error ?? '');
    const esChunk = /Loading chunk [^\s]+ failed/.test(msg) || /ChunkLoadError/.test(msg);
    if (esChunk) {
      let ultima = 0;
      try { ultima = Number(sessionStorage.getItem(CLAVE_ULTIMA_RECARGA) || 0); } catch (e) { ultima = 0; }
      if (Date.now() - ultima > VENTANA_RECARGA_MS) {
        try { sessionStorage.setItem(CLAVE_ULTIMA_RECARGA, String(Date.now())); } catch (e) { /* sin storage */ }
        window.location.reload();
        return;
      }
    }
    console.error(error);
  }
}
