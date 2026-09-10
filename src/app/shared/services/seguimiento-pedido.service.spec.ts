import { Observable, Subject, of, throwError } from 'rxjs';
import { SeguimientoPedidoService } from './seguimiento-pedido.service';

// sin TestBed: el servicio solo necesita crud, socket y zone, y en Karma IS_NATIVE es false
function crear(respuesta: () => Observable<any> = () => of(null)) {
  const eventos = {
    cambioEstado: new Subject<any>(),
    deliveryEstado: new Subject<any>(),
    ubicacion: new Subject<any>(),
  };
  const crud: any = { postFree: () => respuesta() };
  const socket: any = {
    onPedidoCambioEstado: () => eventos.cambioEstado.asObservable(),
    onDeliveryPedidoChangeStatus: () => eventos.deliveryEstado.asObservable(),
    onDeliveryUbicacionRepartidor: () => eventos.ubicacion.asObservable(),
  };
  const zone: any = { run: (fn: any) => fn() };
  return { srv: new SeguimientoPedidoService(crud, socket, zone), eventos };
}

describe('SeguimientoPedidoService', () => {

  describe('normalizarPosicion (via ubicacionRepartidor$)', () => {
    it('acepta el formato viejo del socket {lat,lng}', () => {
      const { srv, eventos } = crear();
      const recibidas: any[] = [];
      srv.ubicacionRepartidor$().subscribe(p => recibidas.push(p));

      eventos.ubicacion.next({ lat: -12.05, lng: -77.03 });

      expect(recibidas).toEqual([{ latitude: -12.05, longitude: -77.03 }]);
    });

    it('acepta el formato de la base {latitude,longitude}', () => {
      const { srv, eventos } = crear();
      const recibidas: any[] = [];
      srv.ubicacionRepartidor$().subscribe(p => recibidas.push(p));

      eventos.ubicacion.next({ latitude: -12.1, longitude: -77.1 });

      expect(recibidas).toEqual([{ latitude: -12.1, longitude: -77.1 }]);
    });

    it('descarta una posicion incompleta o vacia', () => {
      const { srv, eventos } = crear();
      const recibidas: any[] = [];
      srv.ubicacionRepartidor$().subscribe(p => recibidas.push(p));

      eventos.ubicacion.next({ lat: -12.05 });
      eventos.ubicacion.next({ lng: -77.03 });
      eventos.ubicacion.next(null);
      eventos.ubicacion.next({});

      expect(recibidas).toEqual([]);
    });

    it('tambien toma la posicion que viaja dentro del cambio de estado', () => {
      const { srv, eventos } = crear();
      const recibidas: any[] = [];
      srv.ubicacionRepartidor$().subscribe(p => recibidas.push(p));

      eventos.cambioEstado.next({ idpedido: 9, position_now: { lat: -12.2, lng: -77.2 } });
      eventos.cambioEstado.next({ idpedido: 9, position_now: null });

      expect(recibidas).toEqual([{ latitude: -12.2, longitude: -77.2 }]);
    });

    it('con idpedido descarta la ubicacion de otro pedido y deja pasar la del socket viejo sin idpedido', () => {
      const { srv, eventos } = crear();
      const recibidas: any[] = [];
      srv.ubicacionRepartidor$(7).subscribe(p => recibidas.push(p));

      eventos.ubicacion.next({ idpedido: 8, lat: -1, lng: -2 });
      eventos.ubicacion.next({ idpedido: 7, lat: -3, lng: -4 });
      eventos.ubicacion.next({ lat: -5, lng: -6 });

      expect(recibidas).toEqual([{ latitude: -3, longitude: -4 }, { latitude: -5, longitude: -6 }]);
    });
  });

  describe('estadoDe', () => {
    it('devuelve data[0] con la posicion normalizada', done => {
      const respuesta = { success: true, data: [{ idpedido: 10, pwa_estado: 'R', position_now: { lat: -12, lng: -77 } }] };
      const { srv } = crear(() => of(respuesta));

      srv.estadoDe(10, 7).subscribe(est => {
        expect(est.idpedido).toBe(10);
        expect(est.pwa_estado).toBe('R');
        expect(est.position_now).toEqual({ latitude: -12, longitude: -77 });
        done();
      });
    });

    it('devuelve null si el servidor responde success:false', done => {
      const { srv } = crear(() => of({ success: false, data: [] }));
      srv.estadoDe(10, 7).subscribe(est => { expect(est).toBeNull(); done(); });
    });

    it('devuelve null si la peticion HTTP falla', done => {
      const { srv } = crear(() => throwError(new Error('500')));
      srv.estadoDe(10, 7).subscribe(est => { expect(est).toBeNull(); done(); });
    });
  });

  describe('cambios$', () => {
    it('emite con los eventos de estado y NO con las posiciones del repartidor', () => {
      const { srv, eventos } = crear();
      const recibidos: any[] = [];
      srv.cambios$().subscribe(e => recibidos.push(e));

      eventos.ubicacion.next({ lat: -12, lng: -77 });
      eventos.cambioEstado.next({ idpedido: 1, pwa_estado: 'A' });
      eventos.deliveryEstado.next({ estado: 3 });
      eventos.ubicacion.next({ lat: -13, lng: -78 });

      expect(recibidos).toEqual([{ idpedido: 1, pwa_estado: 'A' }, { estado: 3 }]);
    });

    it('con idpedido solo deja pasar los eventos de ese pedido', () => {
      const { srv, eventos } = crear();
      const recibidos: any[] = [];
      srv.cambios$(5).subscribe(e => recibidos.push(e));

      eventos.cambioEstado.next({ idpedido: 6, pwa_estado: 'A' });
      eventos.cambioEstado.next({ idpedido: '5', pwa_estado: 'R' });
      eventos.deliveryEstado.next({ estado: 3 });

      expect(recibidos).toEqual([{ idpedido: '5', pwa_estado: 'R' }, { estado: 3 }]);
    });
  });
});
