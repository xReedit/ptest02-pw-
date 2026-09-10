// Lógica pura del registro de token push: qué se manda al backend y cuándo.
// Sin dependencias de Angular ni de Capacitor para poder probarla sin TestBed.

export type PlataformaPush = 'android' | 'ios' | 'web';

export interface SuscripcionPushPayload {
  idcliente: number;
  token: string;
  plataforma: PlataformaPush;
  // El backend viejo lee req.body.suscripcion; se repite el token para no romperlo.
  suscripcion: string;
}

export interface EnvioPush {
  token: string;
  idcliente: number;
}

const LARGO_MINIMO_TOKEN = 20;

// Devuelve null cuando falta cliente o token: en ese caso no se llama al backend.
export function construirSuscripcionPush(idcliente: any, token: any, plataforma: PlataformaPush): SuscripcionPushPayload | null {
  const id = Number(idcliente);
  if (!Number.isFinite(id) || id <= 0) { return null; }

  const tk = typeof token === 'string' ? token.trim() : '';
  if (tk.length < LARGO_MINIMO_TOKEN) { return null; }

  return { idcliente: id, token: tk, plataforma, suscripcion: tk };
}

// Evita reenviar el mismo par token + cliente. Si el cliente cambia (login) o FCM
// rota el token, se vuelve a enviar.
export function debeRegistrarToken(payload: SuscripcionPushPayload | null, ultimo: EnvioPush): boolean {
  if (!payload) { return false; }
  return payload.token !== ultimo.token || payload.idcliente !== ultimo.idcliente;
}
