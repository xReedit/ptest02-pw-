import { Injectable, NgZone } from '@angular/core';
import { Observable, merge, interval, fromEvent, Subject } from 'rxjs';
import { filter, map, mapTo } from 'rxjs/operators';
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

  estadoDe(idpedido: number, idcliente: number): Observable<any> {
    return this.crud.postFree({ idpedido, idcliente }, 'delivery', 'get-estado-pedido', false)
      .pipe(map((res: any) => (res && res.success && res.data && res.data[0]) ? res.data[0] : null));
  }

  // cualquier señal de cambio: evento unificado, o los dos eventos viejos del repartidor
  cambios$(): Observable<any> {
    return merge(this.socket.onPedidoCambioEstado(), this.socket.onDeliveryPedidoChangeStatus(), this.socket.onDeliveryUbicacionRepartidor());
  }

  ubicacionRepartidor$(): Observable<{ latitude: number; longitude: number }> {
    return merge(
      this.socket.onDeliveryUbicacionRepartidor(),
      this.socket.onPedidoCambioEstado().pipe(map((e: any) => e?.position_now), filter(p => !!p), map((p: any) => ({ latitude: p.lat ?? p.latitude, longitude: p.lng ?? p.longitude })))
    ) as Observable<any>;
  }

  // ponytail: polling fijo de 30 s como red de seguridad; si el socket funciona bien se puede subir a 60 s
  refrescoAutomatico$(): Observable<void> {
    const visible = fromEvent(document, 'visibilitychange').pipe(filter(() => document.visibilityState === 'visible'), mapTo(undefined));
    return merge(visible, this.resumeSubject.asObservable(), interval(30000).pipe(mapTo(undefined)));
  }
}
