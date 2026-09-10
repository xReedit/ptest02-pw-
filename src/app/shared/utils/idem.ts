// Clave de idempotencia derivada del carrito: el mismo pedido reintentado genera la misma
// clave y el backend lo deduplica; un carrito distinto genera otra. No usa timestamps ni
// storage, asi que no arrastra la clave de un pedido ya confirmado.
export function claveIdem(idcliente: number, idsede: number, cuerpo: unknown): string {
  return `${idcliente || 0}-${idsede || 0}-${djb2(JSON.stringify(cuerpo))}`;
}

// ponytail: djb2 en base 36; no es criptografico, solo necesita distinguir carritos
function djb2(texto: string): string {
  let hash = 5381;
  for (let i = 0; i < texto.length; i++) {
    hash = ((hash * 33) ^ texto.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}
