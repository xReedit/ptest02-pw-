import { Injectable, NgZone } from '@angular/core';
import { Observable, merge, interval, fromEvent, Subject, of } from 'rxjs';
import { filter, map, mapTo, catchError } from 'rxjs/operators';
import { App } from '@capacitor/app';
import { CrudHttpService } from './crud-http.service';
import { SocketService } from './socket.service';
import { IS_NATIVE } from '../config/config.const';

@Injectable({ providedIn: 'root' })
export class SeguimientoPedidoService {
  private resumeSubject = new Subject<void>();

  constructor(private crud: CrudHttpService, private socket: SocketService, private zone: NgZone) {
    if (IS_NATIVE) {
      void App.addListener('appStateChange', ({ isActive }) => { if (isActive) { this.zone.run(() => this.resumeSubject.next()); } });
    }
  }

  // la posicion sale con nombres distintos segun el origen (bd: latitude/longitude, socket viejo: lat/lng)
  private normalizarPosicion(p: any): { latitude: number; longitude: number } {
    if (!p) { return null; }
    const latitude = p.latitude ?? p.lat;
    const longitude = p.longitude ?? p.lng;
    return (latitude === undefined || latitude === null || longitude === undefined || longitude === null) ? null : { latitude, longitude };
  }

  // un fallo de red o un 404 no puede tumbar el seguimiento: se devuelve null y el llamador conserva lo que tenia
  estadoDe(idpedido: number, idcliente: number): Observable<any> {
    return this.crud.postFree({ idpedido, idcliente }, 'delivery', 'get-estado-pedido', false)
      .pipe(
        map((res: any) => (res && res.success && res.data && res.data[0]) ? res.data[0] : null),
        map((est: any) => est ? { ...est, position_now: this.normalizarPosicion(est.position_now) } : null),
        catchError(() => of(null))
      );
  }

  // cualquier señal de cambio: evento unificado, o los dos eventos viejos del repartidor
  cambios$(): Observable<any> {
    return merge(this.socket.onPedidoCambioEstado(), this.socket.onDeliveryPedidoChangeStatus(), this.socket.onDeliveryUbicacionRepartidor());
  }

  ubicacionRepartidor$(): Observable<{ latitude: number; longitude: number }> {
    return merge(
      this.socket.onDeliveryUbicacionRepartidor().pipe(map((p: any) => this.normalizarPosicion(p))),
      this.socket.onPedidoCambioEstado().pipe(map((e: any) => this.normalizarPosicion(e?.position_now)))
    ).pipe(filter(p => !!p)) as Observable<any>;
  }

  // ponytail: polling fijo de 30 s como red de seguridad; si el socket funciona bien se puede subir a 60 s
  refrescoAutomatico$(): Observable<void> {
    const visible = fromEvent(document, 'visibilitychange').pipe(filter(() => document.visibilityState === 'visible'), mapTo(undefined));
    return merge(visible, this.resumeSubject.asObservable(), interval(30000).pipe(mapTo(undefined)));
  }
}
