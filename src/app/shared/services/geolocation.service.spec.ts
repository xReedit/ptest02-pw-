import { TestBed } from '@angular/core/testing';
import { GeolocationService, OPCIONES_GEO } from './geolocation.service';

describe('GeolocationService (rama web)', () => {
  let service: GeolocationService;
  let originalGeolocation: any;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeolocationService);
    originalGeolocation = navigator.geolocation;
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'geolocation', { value: originalGeolocation, configurable: true });
  });

  function fingirGeolocation(falso: any): void {
    Object.defineProperty(navigator, 'geolocation', { value: falso, configurable: true });
  }

  it('resuelve con latitude y longitude y pide alta precision con timeout', async () => {
    let opcionesRecibidas: any = null;
    fingirGeolocation({
      getCurrentPosition: (ok: any, _err: any, opciones: any) => {
        opcionesRecibidas = opciones;
        ok({ coords: { latitude: -12.05, longitude: -77.04 } });
      }
    });

    const pos = await service.obtenerPosicion();

    expect(pos).toEqual({ latitude: -12.05, longitude: -77.04 });
    expect(opcionesRecibidas).toEqual(OPCIONES_GEO);
    expect(OPCIONES_GEO.timeout).toBe(10000);
  });

  it('rechaza con permiso-denegado cuando el navegador devuelve code 1', async () => {
    fingirGeolocation({
      getCurrentPosition: (_ok: any, err: any) => err({ code: 1, message: 'User denied Geolocation' })
    });
    await expectAsync(service.obtenerPosicion()).toBeRejectedWith('permiso-denegado');
  });

  it('rechaza con timeout cuando el navegador devuelve code 3', async () => {
    fingirGeolocation({
      getCurrentPosition: (_ok: any, err: any) => err({ code: 3, message: 'Timeout expired' })
    });
    await expectAsync(service.obtenerPosicion()).toBeRejectedWith('timeout');
  });

  it('rechaza con no-disponible cuando code 2 o cuando no existe la API', async () => {
    fingirGeolocation({
      getCurrentPosition: (_ok: any, err: any) => err({ code: 2, message: 'Position unavailable' })
    });
    await expectAsync(service.obtenerPosicion()).toBeRejectedWith('no-disponible');

    fingirGeolocation(undefined);
    await expectAsync(service.obtenerPosicion()).toBeRejectedWith('no-disponible');
  });

  it('siempre se resuelve o se rechaza: nunca queda colgada', async () => {
    fingirGeolocation({
      getCurrentPosition: (_ok: any, err: any) => err({ code: 3, message: 'Timeout expired' })
    });

    let termino = false;
    await service.obtenerPosicion().then(() => { termino = true; }, () => { termino = true; });

    expect(termino).toBe(true);
  });

  it('mensaje() da un texto util para cada error y cae en no-disponible ante lo desconocido', () => {
    expect(service.mensaje('permiso-denegado')).toContain('permiso');
    expect(service.mensaje('timeout')).toContain('tardando');
    expect(service.mensaje('no-disponible')).toContain('ubicación');
    expect(service.mensaje('lo-que-sea')).toBe(service.mensaje('no-disponible'));
  });
});
