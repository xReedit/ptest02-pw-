// Token de sesion del cliente emitido por el backend (sprint 5).
// La app solo lo guarda y lo reenvia: no lo interpreta ni confia en su contenido.
// El unico que puede leer el idcliente de dentro es el backend, que tiene la semilla.

export const KEY_TOKEN_CLIENTE = 'sys::tkc';

const LARGO_MINIMO = 40;

// Un JWT son tres partes separadas por punto. Sirve para descartar valores viejos,
// cadenas vacias y el clasico 'undefined' guardado por error, no para validar la firma.
export function esTokenClienteValido(token: any): boolean {
  if (typeof token !== 'string') { return false; }

  const limpio = token.trim();
  if (limpio.length < LARGO_MINIMO) { return false; }

  const partes = limpio.split('.');
  return partes.length === 3 && partes.every(p => p.length > 0);
}

// Devuelve false si no guardo nada (token invalido o localStorage bloqueado):
// el llamador decide si eso es un problema. Nunca borra el token anterior.
export function guardarTokenCliente(token: any): boolean {
  if (!esTokenClienteValido(token)) { return false; }

  try {
    localStorage.setItem(KEY_TOKEN_CLIENTE, (token as string).trim());
    return true;
  } catch (error) {
    // modo privado o cuota llena: la app sigue funcionando sin token (modo log del backend)
    console.error('token-cliente guardar', error);
    return false;
  }
}

export function leerTokenCliente(): string | null {
  try {
    const token = localStorage.getItem(KEY_TOKEN_CLIENTE);
    return esTokenClienteValido(token) ? (token as string).trim() : null;
  } catch (error) {
    console.error('token-cliente leer', error);
    return null;
  }
}

export function borrarTokenCliente(): void {
  try {
    localStorage.removeItem(KEY_TOKEN_CLIENTE);
  } catch (error) {
    console.error('token-cliente borrar', error);
  }
}
