import { DireccionPendienteService, KEY_DIRECCION_PENDIENTE } from './direccion-pendiente.service';

// Sin TestBed: el servicio no depende de nada de Angular, solo de CrudHttpService.
describe('DireccionPendienteService', () => {

  const DIRECCION = { direccion: 'Jiron Union 123', ciudad: 'Tarapoto', idcliente: 0 };

  let llamadas: any[];
  let respuesta: any;
  let falla: any;
  let crudFalso: any;
  let service: DireccionPendienteService;

  beforeEach(() => {
    llamadas = [];
    respuesta = { success: true, data: [{ idcliente_pwa_direccion: 9 }] };
    falla = null;

    crudFalso = {
      postFree: (datos: any, controller: string, evento: string, conToken: boolean) => {
        llamadas.push({ datos, controller, evento, conToken });
        return {
          subscribe: (ok: any, err: any) => {
            if (falla) { err(falla); return; }
            ok(respuesta);
          }
        };
      }
    };

    service = new DireccionPendienteService(crudFalso);
    localStorage.removeItem(KEY_DIRECCION_PENDIENTE);
  });

  afterEach(() => localStorage.removeItem(KEY_DIRECCION_PENDIENTE));

  describe('guardar / leer / limpiar', () => {

    it('guarda bajo sys::dir_pend y lo devuelve tal cual', () => {
      expect(service.guardar(DIRECCION)).toBe(true);
      expect(KEY_DIRECCION_PENDIENTE).toBe('sys::dir_pend');
      expect(JSON.parse(localStorage.getItem(KEY_DIRECCION_PENDIENTE))).toEqual(DIRECCION);
      expect(service.leer()).toEqual(DIRECCION);
    });

    it('no guarda nada sin direccion', () => {
      expect(service.guardar(null)).toBe(false);
      expect(service.guardar({ ciudad: 'Tarapoto' })).toBe(false);
      expect(localStorage.getItem(KEY_DIRECCION_PENDIENTE)).toBeNull();
    });

    it('leer devuelve null cuando no hay nada guardado', () => {
      expect(service.leer()).toBeNull();
    });

    it('leer devuelve null y no revienta si lo guardado esta corrupto', () => {
      spyOn(console, 'error');
      localStorage.setItem(KEY_DIRECCION_PENDIENTE, '{no-es-json');
      expect(service.leer()).toBeNull();
    });

    it('guardar devuelve false y traga el error si el storage esta bloqueado', () => {
      spyOn(console, 'error');
      spyOn(localStorage, 'setItem').and.throwError('QuotaExceeded');
      expect(() => service.guardar(DIRECCION)).not.toThrow();
      expect(service.guardar(DIRECCION)).toBe(false);
    });

    it('limpiar borra la clave', () => {
      service.guardar(DIRECCION);
      service.limpiar();
      expect(localStorage.getItem(KEY_DIRECCION_PENDIENTE)).toBeNull();
    });
  });

  describe('sincronizar', () => {

    it('postea la direccion con el idcliente nuevo y la limpia al confirmar', () => {
      service.guardar(DIRECCION);

      service.sincronizar(77);

      expect(llamadas.length).toBe(1);
      expect(llamadas[0].controller).toBe('cliente');
      expect(llamadas[0].evento).toBe('new-direccion');
      expect(llamadas[0].conToken).toBe(false);
      expect(llamadas[0].datos.idcliente).toBe(77);
      expect(llamadas[0].datos.direccion).toBe(DIRECCION.direccion);
      expect(service.leer()).toBeNull();
    });

    it('no toca la direccion guardada (no la muta) al armar el envio', () => {
      service.guardar(DIRECCION);
      service.sincronizar(77);
      expect(DIRECCION.idcliente).toBe(0);
    });

    it('no hace nada sin idcliente util', () => {
      service.guardar(DIRECCION);

      service.sincronizar(0);
      service.sincronizar(-2);
      service.sincronizar(null);
      service.sincronizar(undefined);
      service.sincronizar('abc');

      expect(llamadas.length).toBe(0);
      expect(service.leer()).toEqual(DIRECCION);
    });

    it('no hace nada si no hay direccion pendiente', () => {
      service.sincronizar(77);
      expect(llamadas.length).toBe(0);
    });

    it('conserva la direccion cuando el backend responde sin exito', () => {
      spyOn(console, 'error');
      respuesta = { success: false };
      service.guardar(DIRECCION);

      service.sincronizar(77);

      expect(service.leer()).toEqual(DIRECCION);
    });

    it('conserva la direccion y no propaga el error cuando el POST falla', () => {
      spyOn(console, 'error');
      falla = { status: 500 };
      service.guardar(DIRECCION);

      expect(() => service.sincronizar(77)).not.toThrow();
      expect(service.leer()).toEqual(DIRECCION);
      expect(console.error).toHaveBeenCalled();
    });

    it('no revienta si el propio postFree lanza', () => {
      spyOn(console, 'error');
      crudFalso.postFree = () => { throw new Error('sin red'); };
      service.guardar(DIRECCION);

      expect(() => service.sincronizar(77)).not.toThrow();
      expect(service.leer()).toEqual(DIRECCION);
    });
  });

});
