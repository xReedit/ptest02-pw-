import { Injectable } from '@angular/core';
import io from 'socket.io-client';
import { Observable } from 'rxjs/internal/Observable';


import { URL_SERVER_SOCKET } from '../config/config.const';
import { CartaModel } from 'src/app/modelos/carta.model';
import { SeccionModel } from 'src/app/modelos/seccion.model';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  objCarta: any;
  socket: any;
  urlSocket = URL_SERVER_SOCKET;

  constructor() { }

  connect() {
    this.socket = io(this.urlSocket, {a: 1});
  }

  onGetCarta() {
    return new Observable(observer => {
        this.socket.on('getLaCarta', (res: any) => {
        this.objCarta = {
          'carta': <CartaModel[]>res[0].carta,
          'bodega': <SeccionModel[]>res[0].bodega
        };
        observer.next(this.objCarta);
      });
    });
  }
}
