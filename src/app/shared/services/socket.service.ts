import { Injectable } from '@angular/core';
import io from 'socket.io-client';
import { Observable } from 'rxjs/internal/Observable';


import { URL_SERVER_SOCKET } from '../config/config.const';
import { CartaModel } from 'src/app/modelos/carta.model';
import { SeccionModel } from 'src/app/modelos/seccion.model';
import { ItemModel } from 'src/app/modelos/item.model';
import { TipoConsumoModel } from 'src/app/modelos/tipoconsumo.model';
import { retry } from 'rxjs/operators';
import { observable } from 'rxjs';
import { ItemTipoConsumoModel } from 'src/app/modelos/item.tipoconsumo.model';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  objCarta: any;
  socket: any;
  item: ItemModel;
  urlSocket = URL_SERVER_SOCKET;
  isSocketOpen = false;

  private resTipoConsumo: any = [];

  constructor() { }

  connect() {
    if ( this.isSocketOpen ) { return; } // para cuando se desconecta y conecta desde el celular

    // produccion
    // this.socket = io('/', {
    //   secure: true,
    //   rejectUnauthorized: false,
    //   forceNew: false
    // });

    // desarrollo
    this.socket = io(this.urlSocket, {
      secure: true,
      rejectUnauthorized: false,
      // forceNew: true
    });


    this.socket.on('finishLoadDataInitial', () => {
      this.isSocketOpen = true;
      console.log('conected socket');
    });
  }

  onGetCarta() {
    // if ( this.isSocketOpen ) { return new Observable(observer => {observer.next(null); }); }
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
    // if ( this.isSocketOpen ) { return new Observable(observer => {observer.next(null); }); }
    return new Observable(observer => {
      this.socket.on('getTipoConsumo', (res: TipoConsumoModel) => {
        this.resTipoConsumo = res;
        observer.next(res);
      });
    });
  }

  getDataTipoConsumo(): ItemTipoConsumoModel[] {
    const resTPC: ItemTipoConsumoModel[] = [];
    this.resTipoConsumo .map((t: TipoConsumoModel) => {
      const _objTpcAdd = new ItemTipoConsumoModel();
      _objTpcAdd.descripcion = t.descripcion;
      _objTpcAdd.idtipo_consumo = t.idtipo_consumo;
      _objTpcAdd.titulo = t.titulo;

      resTPC.push(_objTpcAdd);
    });

    return resTPC;
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

  closeConnection(): void {
    this.socket.disconnect();
    this.isSocketOpen = false;
  }
}
