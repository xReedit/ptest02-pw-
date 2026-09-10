import { construirSuscripcionPush, debeRegistrarToken, SuscripcionPushPayload } from './push-payload';

const TOKEN = 'fZk1QwErTyUiOpAsDfGhJkLzXcVbNm0987654321';

describe('construirSuscripcionPush', () => {
  it('arma el payload con el token repetido en suscripcion (compatibilidad)', () => {
    expect(construirSuscripcionPush(15, TOKEN, 'android')).toEqual({
      idcliente: 15, token: TOKEN, plataforma: 'android', suscripcion: TOKEN
    });
  });

  it('acepta el idcliente como texto', () => {
    expect(construirSuscripcionPush('15', TOKEN, 'ios').idcliente).toBe(15);
  });

  it('devuelve null si no hay cliente valido', () => {
    expect(construirSuscripcionPush(0, TOKEN, 'android')).toBeNull();
    expect(construirSuscripcionPush(null, TOKEN, 'android')).toBeNull();
    expect(construirSuscripcionPush('abc', TOKEN, 'android')).toBeNull();
    expect(construirSuscripcionPush(-3, TOKEN, 'android')).toBeNull();
  });

  it('devuelve null si el token falta o es demasiado corto', () => {
    expect(construirSuscripcionPush(15, '', 'android')).toBeNull();
    expect(construirSuscripcionPush(15, null, 'android')).toBeNull();
    expect(construirSuscripcionPush(15, 'corto', 'android')).toBeNull();
    expect(construirSuscripcionPush(15, { endpoint: 'x' }, 'web')).toBeNull();
  });

  it('recorta espacios del token', () => {
    expect(construirSuscripcionPush(15, `  ${TOKEN}  `, 'android').token).toBe(TOKEN);
  });
});

describe('debeRegistrarToken', () => {
  const payload: SuscripcionPushPayload = { idcliente: 15, token: TOKEN, plataforma: 'android', suscripcion: TOKEN };

  it('no envia nada cuando el payload es null', () => {
    expect(debeRegistrarToken(null, { token: '', idcliente: 0 })).toBe(false);
  });

  it('envia la primera vez', () => {
    expect(debeRegistrarToken(payload, { token: '', idcliente: 0 })).toBe(true);
  });

  it('no reenvia el mismo par token + cliente', () => {
    expect(debeRegistrarToken(payload, { token: TOKEN, idcliente: 15 })).toBe(false);
  });

  it('reenvia cuando cambia el cliente (login) aunque el token sea el mismo', () => {
    expect(debeRegistrarToken(payload, { token: TOKEN, idcliente: 9 })).toBe(true);
  });

  it('reenvia cuando FCM rota el token', () => {
    expect(debeRegistrarToken(payload, { token: 'otro-token-distinto-1234567890', idcliente: 15 })).toBe(true);
  });
});
