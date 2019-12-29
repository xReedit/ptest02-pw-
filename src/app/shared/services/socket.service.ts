import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs/internal/Observable';


import { URL_SERVER_SOCKET } from '../config/config.const';
// import { CartaModel } from 'src/app/modelos/carta.model';
// import { SeccionModel } from 'src/app/modelos/seccion.model';
// import { ItemModel } from 'src/app/modelos/item.model';
import { TipoConsumoModel } from 'src/app/modelos/tipoconsumo.model';

import { ItemTipoConsumoModel } from 'src/app/modelos/item.tipoconsumo.model';
import { InfoTockenService } from './info-token.service';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';


@Injectable({
  providedIn: 'root'
})
export class SocketService {
  // private objLaCartaSocket: any;
  private socket: SocketIOClient.Socket;
  // private item: ItemModel;
  private urlSocket = URL_SERVER_SOCKET;

  isSocketOpen = false;
  isSocketOpenReconect = false;

  // listen is socket open
  private isSocketOpenSource = new BehaviorSubject<boolean>(false);
  public isSocketOpen$ = this.isSocketOpenSource.asObservable();

  private msjConexSource = new BehaviorSubject<String>('Cargando datos ...');
  public msjConex$ = this.msjConexSource.asObservable();

  private resTipoConsumo: any = [];

  constructor(private infoTockenService: InfoTockenService) {

      window.addEventListener('online', () => {
        this.showStatusConexNavigator(true, 'navigator_online');
      });
      window.addEventListener('offline', () => {
        this.showStatusConexNavigator(false, 'navigator_offline');
      });

      console.log('contructor socket');

      // this.statusConexSocket(false, '');


  }

  connect() {
    if ( this.isSocketOpen ) { return; } // para cuando se desconecta y conecta desde el celular

    // produccion
    // this.socket = io('/', {
    //   secure: true,
    //   rejectUnauthorized: false,
    //   forceNew: false
    // });

    const infToken = this.infoTockenService.infoUsToken;

    const dataSocket = {
      idorg: infToken.idorg,
      idsede: infToken.idsede,
      idusuario: infToken.idusuario,
      idcliente: infToken.idcliente,
      iscliente: infToken.isCliente,
      isFromApp: 1
    };

    // console.log('dataSocket', dataSocket);

    // desarrollo
    this.socket = io(this.urlSocket, {
      secure: true,
      rejectUnauthorized: false,
      query: dataSocket
      // forceNew: true
    });

    this.socket.on('finishLoadDataInitial', () => {
      // setTimeout(() => {
        // this.isSocketOpen = true;
        // this.isSocketOpenSource.next(true);
        this.statusConexSocket(true, '');
        this.isSocketOpenReconect = true; // evita que cargen nuevamente las configuraciones basicas, solo carga carta
      // }, 1000);
      console.log('conected socket finishLoadDataInitial');
    });

    // this.socket.on('connect', (res: any) => {
    //   this.statusConexSocket(true, 'socket event connect');
    // });

    this.socket.on('connect_failed', (res: any) => {
      console.log('itento fallido de conexion', res);
      this.statusConexSocket(false, 'connect_failed');
    });

    this.socket.on('connect_error', (res: any) => {
      console.log('error de conexion', res);
      this.statusConexSocket(false, 'connect_error');
    });

    this.socket.on('disconnect', (res: any) => {
      console.log('disconnect');
      this.statusConexSocket(false, 'disconnect');
    });

    // this.onListenSocketDisconnet();
  }

  onGetCarta() {
    // if ( this.isSocketOpen ) { return new Observable(observer => {observer.next(null); }); }
    return new Observable(observer => {
        this.socket.on('getLaCarta', (res: any) => {
        // this.objLaCartaSocket = {
        //   'carta': <CartaModel[]>res[0].carta,
        //   'bodega': <SeccionModel[]>res[0].bodega
        // };
        observer.next(res);
      });
    });
  }

  // onGetCarta() {
  //   return this.listen('getLaCarta');
  // }

  onGetTipoConsumo() {
    // if ( this.isSocketOpen ) { return new Observable(observer => {observer.next(null); }); }
    return new Observable(observer => {
      this.socket.on('getTipoConsumo', (res: TipoConsumoModel) => {
        // this.resTipoConsumo = res;
        observer.next(res);
      });
    });
  }

  // onGetTipoConsumo() {
  //   return this.listen('getTipoConsumo');
  // }

  // verificar para eliminar
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
        observer.next(res);
      });
    });
  }

  // onItemModificado() {
  //   return this.listen('observer');
  // }

  onNuevoItemAddInCarta() {
    return new Observable(observer => {
      this.socket.on('nuevoItemAddInCarta', (res: any) => {
        observer.next(res);
      });
    });
  }

  // onNuevoItemAddInCarta() {
  //   return this.listen('nuevoItemAddInCarta');
  // }

  // cuando se recupera el stock de pedido que caduco el tiempo
  onItemResetCant() {
    return new Observable(observer => {
      this.socket.on('itemResetCant', (res: any) => {
        observer.next(res);
      });
    });
  }

  // onItemResetCant() {
  //   return this.listen('itemResetCant');
  // }

  // load reglas de la carta y subtotales
  onReglasCarta() {
    return new Observable(observer => {
      this.socket.on('getReglasCarta', (res: any) => {
        observer.next(res);
      });
    });
  }

  // onReglasCarta() {
  //   return this.listen('getReglasCarta');
  // }

  // datos de la sede, impresoras
  // load reglas de la carta y subtotales
  onGetDatosSede() {
    return new Observable(observer => {
      this.socket.on('getDataSede', (res: any) => {
        observer.next(res);
      });
    });
  }

  // respuesta de hacer un nuevo pedido
  onGetNuevoPedido() {
    return new Observable(observer => {
      this.socket.on('nuevoPedido', (res: any) => {
        observer.next(res);
      });
    });
  }

  // onGetDatosSede() {
  //   return this.listen('getDataSede');
  // }

  // onListenSocketDisconnet() {
  //   return new Observable(observer => {
  //     this.socket.on('disconnect', (res: any) => {
  //       this.isSocketOpen = false;
  //       this.isSocketOpenSource.next(false);
  //     });
  //   });
  // }

  emit(evento: string, data: any) {
    this.socket.emit(evento, data);
  }

  private listen( evento: string ) {
    return new Observable(observer => {
      this.socket.on( evento , (res: any) => {
        observer.next(res);
      });
    });
  }

  closeConnection(): void {
    this.socket.disconnect();
    // this.isSocketOpen = false;
    // this.isSocketOpenSource.next(false);
    this.statusConexSocket(false, 'disconnect');
  }

  private statusConexSocket(isConncet: boolean, evento: string) {
    this.isSocketOpen = isConncet;
    this.isSocketOpenSource.next(isConncet);

    let msj = 'Conectando datos ...';
    switch (evento) {
      case 'conected': // conectando
        msj = 'Conectando datos ...';
        break;
      case 'connect_failed': // conectando
        msj = 'Conectando datos ..';
        break;
      case 'connect_error': // conectando
        msj = 'Conectando datos .';
        break;
      case 'disconnect': // conectando
        msj = 'Restableciendo conexion ...';
        break;
      case 'navigator_offline': // conectando
        msj = 'Conexion cerrada ...';
        break;
    }

    this.msjConexSource.next(msj);
  }

  private showStatusConexNavigator(online: boolean, evento: string): void {

    this.statusConexSocket(online, evento);
    // this.isSocketOpen = online;
    // this.isSocketOpenSource.next(online);

    if (online) {
      console.log('navegador conectado');
    } else {
      console.log('!!! navegador desconectado !!');
    }
  }
}
