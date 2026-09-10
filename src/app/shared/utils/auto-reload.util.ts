// ponytail: guarda anti-bucle de recarga automatica.
// Antes cualquier loader atascado recargaba la pagina cada 12 s (y con timers
// huerfanos, cada ~4 s) sin limite. Ahora se permite UNA sola recarga por
// ventana de 60 s; si ya hubo una, el llamador debe mostrar el reintento manual.

const AUTO_RELOAD_KEY = 'sys::auto-reload';
const AUTO_RELOAD_VENTANA_MS = 60000;

/**
 * Recarga la pagina si no se recargo automaticamente en los ultimos 60 s.
 * @returns true si se lanzo la recarga, false si hay que mostrar el reintento manual.
 */
export function intentarAutoRecarga(): boolean {
  try {
    const _ultima = Number(sessionStorage.getItem(AUTO_RELOAD_KEY)) || 0;
    if (Date.now() - _ultima < AUTO_RELOAD_VENTANA_MS) { return false; }
    sessionStorage.setItem(AUTO_RELOAD_KEY, String(Date.now()));
  } catch (error) {
    // Sin sessionStorage no se puede garantizar el limite: mejor no recargar.
    return false;
  }

  window.location.reload();
  return true;
}
