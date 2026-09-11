import {
  KEY_TOKEN_CLIENTE,
  borrarTokenCliente,
  esTokenClienteValido,
  guardarTokenCliente,
  leerTokenCliente
} from './token-cliente';

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZGNsaWVudGUiOjE1LCJ0aXBvIjoiY2xpZW50ZSJ9.Zm9vLWJhci1maXJtYS1kZS1wcnVlYmE';

describe('token-cliente', () => {

  afterEach(() => localStorage.removeItem(KEY_TOKEN_CLIENTE));

  describe('esTokenClienteValido', () => {
    it('acepta un JWT de tres partes', () => {
      expect(esTokenClienteValido(TOKEN)).toBe(true);
    });

    it('rechaza vacio, corto, sin tres partes y lo que no es texto', () => {
      expect(esTokenClienteValido('')).toBe(false);
      expect(esTokenClienteValido('   ')).toBe(false);
      expect(esTokenClienteValido('a.b.c')).toBe(false);
      expect(esTokenClienteValido('sin-puntos-pero-bastante-largo')).toBe(false);
      expect(esTokenClienteValido(`${TOKEN}.extra`)).toBe(false);
      expect(esTokenClienteValido(null)).toBe(false);
      expect(esTokenClienteValido(undefined)).toBe(false);
      expect(esTokenClienteValido(15)).toBe(false);
      expect(esTokenClienteValido({ token: TOKEN })).toBe(false);
    });
  });

  describe('guardarTokenCliente', () => {
    it('guarda el token recortado y avisa que lo guardo', () => {
      expect(guardarTokenCliente(`  ${TOKEN}  `)).toBe(true);
      expect(localStorage.getItem(KEY_TOKEN_CLIENTE)).toBe(TOKEN);
    });

    it('no guarda basura y no borra lo que ya habia', () => {
      guardarTokenCliente(TOKEN);
      expect(guardarTokenCliente('')).toBe(false);
      expect(guardarTokenCliente(null)).toBe(false);
      expect(guardarTokenCliente('undefined')).toBe(false);
      expect(localStorage.getItem(KEY_TOKEN_CLIENTE)).toBe(TOKEN);
    });
  });

  describe('leerTokenCliente', () => {
    it('devuelve null cuando no hay nada guardado', () => {
      expect(leerTokenCliente()).toBeNull();
    });

    it('devuelve el token guardado', () => {
      guardarTokenCliente(TOKEN);
      expect(leerTokenCliente()).toBe(TOKEN);
    });

    it('descarta un valor guardado que no tiene forma de JWT', () => {
      localStorage.setItem(KEY_TOKEN_CLIENTE, 'valor-viejo-cualquiera');
      expect(leerTokenCliente()).toBeNull();
    });
  });

  describe('borrarTokenCliente', () => {
    it('borra la clave', () => {
      guardarTokenCliente(TOKEN);
      borrarTokenCliente();
      expect(localStorage.getItem(KEY_TOKEN_CLIENTE)).toBeNull();
      expect(leerTokenCliente()).toBeNull();
    });
  });
});
