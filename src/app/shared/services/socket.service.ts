import { Injectable } from '@angular/core';
import io from 'socket.io-client';
import { Observable } from 'rxjs/internal/Observable';


import { URL_SERVER_SOCKET } from '../config/config.const';
import { CartaModel } from 'src/app/modelos/carta.model';
import { SeccionModel } from 'src/app/modelos/seccion.model';
import { ItemModel } from 'src/app/modelos/item.model';
import { TipoConsumoModel } from 'src/app/modelos/tipoconsumo.model';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  objCarta: any;
  socket: any;
  item: ItemModel;
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

  onGetTipoConsumo() {
    return new Observable(observer => {
      this.socket.on('getTipoConsumo', (res: TipoConsumoModel) => {
        observer.next(res);
      });
    });
  }

  onItemModificado() {
    return new Observable(observer => {
      this.socket.on('itemModificado', (res: any) => {
        this.item = <ItemModel>res;
        observer.next(this.item);
      });
    });
  }

  onNuevoItemAddInCarta() {
    return new Observable(observer => {
      this.socket.on('nuevoItemAddInCarta', (res: any) => {
        this.item = res;
        observer.next(this.item);
      });
    });
  }

  // cuando se recupera el stock de pedido que caduco el tiempo
  onItemResetCant() {
    return new Observable(observer => {
      this.socket.on('itemResetCant', (res: any) => {
        this.item = <ItemModel>res;
        observer.next(this.item);
      });
    });
  }

  // load reglas de la carta y subtotales
  onReglasCarta() {
    return new Observable(observer => {
      this.socket.on('getReglasCarta', (res: any) => {
        observer.next(res);
      });
    });
  }

  // datos de la sede, impresoras
  // load reglas de la carta y subtotales
  onGetDatosSede() {
    return new Observable(observer => {
      this.socket.on('getDataSede', (res: any) => {
        observer.next(res);
      });
    });
  }


  emit(evento: string, data: any) {
    this.socket.emit(evento, data);
  }
}
