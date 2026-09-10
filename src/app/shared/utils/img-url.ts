// Une la base del repositorio de imagenes con el nombre del archivo dejando
// exactamente un '/'. Las bases del environment ya terminan en '/', por eso
// concatenar a mano producia rutas con '//' o dobles prefijos.
const ABSOLUTA = /^https?:\/\//i;

// URL protocolo-relativa: '//host/ruta'. Se exige la barra que separa el host
// de la ruta para no confundirla con un nombre de archivo que llega con barras
// de sobra ('//sede-10.png'), que si debe pegarse a la base.
const PROTOCOLO_RELATIVO = /^\/\/[^\/]+\/.+/;

export function urlImagen(base: string, nombre: string | null | undefined): string {
  const _nombre = (nombre === null || nombre === undefined ? '' : nombre.toString()).trim();
  if (!_nombre) { return ''; }
  if (ABSOLUTA.test(_nombre) || PROTOCOLO_RELATIVO.test(_nombre)) { return _nombre; }
  if (_nombre.toLowerCase().indexOf('data:') === 0) { return _nombre; }

  const _archivo = _nombre.replace(/^\/+/, '');
  const _base = (base || '').toString().trim().replace(/\/+$/, '');
  if (!_base) { return _archivo; }

  return `${_base}/${_archivo}`;
}
