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
// import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { MipedidoService } from './mipedido.service';
import { Router } from '@angular/router';
import { ListenStatusService } from './listen-status.service';


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

  private verificandoConexion = false;

  constructor(
    private infoTockenService: InfoTockenService,
    private router: Router,
    private listenStatusService: ListenStatusService
  ) {

  }

  // _isOutCarta si esta fuera de la carta // si esta en la plataforma de deliverys estableciemientos
  // isCashAtm si esta desde cash atm
  connect(infoUser: any = null, opFrom: number = 1, _isOutCarta = false, _isCashAtm = false) {
    if (this.isSocketOpen) {
      this.infoTockenService.setSocketId(this.socket.id);
      return;
    } // para cuando se desconecta y conecta desde el celular

    // produccion
    // this.socket = io('/', {
    //   secure: true,
    //   rejectUnauthorized: false,
    //   forceNew: false
    // });

    const infToken = this.infoTockenService.infoUsToken || infoUser;

    const dataSocket = {
      idorg: infToken.idorg || 0,
      idsede: infToken.idsede || 0,
      idusuario: infToken.idusuario,
      idcliente: infToken.idcliente,
      iscliente: infToken.isCliente || false,
      isOutCarta: _isOutCarta,
      isCashAtm: _isCashAtm,
      isFromApp: opFrom,
      firts_socketid: infToken.socketId
    };

    // console.log('dataSocket', dataSocket);

    // desarrollo
    this.socket = io(this.urlSocket, {
      secure: true,
      rejectUnauthorized: false,
      // forceNew: true,
      query: dataSocket,
      // transports: ["polling", "websocket"] 
      // transports: ['websocket'],
      // upgrade: false
      // forceNew: true
    });

    this.listenStatusSocket(); // escucha los estado del socket

    // this.socket.on('finishLoadDataInitial', () => {
    //   // setTimeout(() => {
    //     // this.isSocketOpen = true;
    //     // this.isSocketOpenSource.next(true);
    //     this.statusConexSocket(true, '');
    //     this.isSocketOpenReconect = true; // evita que cargen nuevamente las configuraciones basicas, solo carga carta
    //   // }, 1000);
    //   console.log('conected socket finishLoadDataInitial');
    // });

    // // this.socket.on('connect', (res: any) => {
    // //   this.statusConexSocket(true, 'socket event connect');
    // // });

    // this.socket.on('connect_failed', (res: any) => {
    //   console.log('itento fallido de conexion', res);
    //   this.statusConexSocket(false, 'connect_failed');
    // });

    // this.socket.on('connect_error', (res: any) => {
    //   console.log('error de conexion', res);
    //   this.statusConexSocket(false, 'connect_error');
    // });

    // this.socket.on('disconnect', (res: any) => {
    //   console.log('disconnect');
    //   this.statusConexSocket(false, 'disconnect');
    // });

    // this.onListenSocketDisconnet();
  }

  getIdSocket(): string {
    return this.socket.id;
  }

  onGetCarta() {
    return new Observable(observer => {
      this.socket.on('getLaCarta', (res: any) => {
        observer.next(res);
      });
    });
  }

  onGetDataSedeDescuentos() {
    return new Observable(observer => {
      this.socket.on('getDataSedeDescuentos', (res: any) => {
        observer.next(res);
      });
    });
  }

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
    this.resTipoConsumo.map((t: TipoConsumoModel) => {
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
      this.socket.on('itemModificado-pwa', (res: any) => {
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
      this.socket.on('itemResetCant-pwa', (res: any) => {
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

  onGetClienteLlama() {
    return new Observable(observer => {
      this.socket.on('notificar-cliente-llamado', (res: any) => {
        observer.next(res);
      });
    });
  }

  onRemoveClienteLlama() {
    return new Observable(observer => {
      this.socket.on('notificar-cliente-llamado-remove', (res: any) => {
        observer.next(res);
      });
    });
  }

  onLoadCallClienteLlama() {
    return new Observable(observer => {
      this.socket.on('load-list-cliente-llamado', (res: any) => {
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

  // cuando el cliente paga el pedido
  onPedidoPagado() {
    return new Observable(observer => {
      this.socket.on('pedido-pagado-cliente', (res: any) => {
        observer.next(res);
      });
    });
  }


  onDeliveryPedidoChangeStatus() {
    return new Observable(observer => {
      this.socket.on('repartidor-notifica-estado-pedido', (estado: any) => {
        observer.next(estado);
      });
    });
  }

  onDeliveryUbicacionRepartidor() {
    return new Observable(observer => {
      this.socket.on('repartidor-notifica-ubicacion', (coordenadas: any) => {
        observer.next(coordenadas);
      });
    });
  }


  onComercioOpenChangeFromMonitor() {
    return new Observable(observer => {
      this.socket.on('set-comercio-open-change-from-monitor', (comercioId: any) => {
        observer.next(comercioId);
      });
    });
  }

  // repuesta del mensaje de verificacion
  onMsjVerificacionResponse() {
    return new Observable(observer => {
      this.socket.on('mensaje-verificacion-telefono-rpt', (data: any) => {
        observer.next(data);
      });
    });
  }

  // fecha ahora
  onGetInfoDateNow() {
    // if ( this.isSocketOpen ) { return new Observable(observer => {observer.next(null); }); }
    return new Observable(observer => {
      this.socket.on('date-now-info', (res: any) => {
        // this.resTipoConsumo = res;
        observer.next(res);
      });
    });
  }

  // escucha si mesa fue pagada
  onGetMesaPagada() {
    return new Observable(observer => {
      this.socket.on('restobar-notifica-pay-pedido-res', (res: any) => {
        if (res.importe_restante === 0) { // si es pagado en su totalidad
          observer.next(res);
        }
      });
    });
  }

  // escucha si hay nuevo pedido en mesa
  onGetNewPedidoMesa() {
    return new Observable(observer => {
      this.socket.on('nuevoPedido-for-list-mesas', (res: any) => {
        // normaliza
        let pase = false;
        const _rpt = {
          nummesa: '',
          nommozo: '',
          referencia: '',
          flag_is_cliente: 0,
          min: 0,
          remove: false
        };

        let _item_mesa;

        if (res.m) {
          if (res.m !== '') {
            _item_mesa = res;
            pase = true;
          }
        } else if (res.p_header) {
          if (res.p_header.m !== '') {
            _item_mesa = res.p_header;
            pase = true;
          }
        }

        if (pase) {
          _rpt.nummesa = _item_mesa.m;
          _rpt.nommozo = _item_mesa.nom_us;

          observer.next(_rpt);
        }
      });
    });
  }

  // onDeliveryGetLastIdPedido() {
  //   return new Observable(observer => {
  //     this.socket.on('get-lastid-pedido', (res: any) => {
  //       observer.next(res);
  //     });
  //   });
  // }


  // zona delivery establecimiento


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
    // verificar estado del socket

    if (this.socket) {
      this.socket.emit(evento, data);
    }
  }

  emitRes(evento: string, data: any) {
    return new Observable(observer => {
      this.socket.emit(evento, data, (res) => {
        // console.log('respuesta socket', res);
        observer.next(res);
      });
    });
  }

  async emitResPedido(evento: string, data: any) {
    return new Observable(observer => {
      this.socket.emit(evento, data, (res) => {
        console.log('respuesta socket', res);
        observer.next(res);
      });
    });
  }

  asyncEmitPedido(eventName: string, eventNameRes: string, data: any) {
    return new Promise((resolve, reject) => {
      try {
        this.socket.emit(eventName, data);
        this.socket.on(eventNameRes, result => {
          this.socket.off(eventNameRes);
          resolve(result);
        });
      } catch (error) {
        return false;
      }
      // setTimeout(reject, 1000);
      setTimeout(() => {
        ;
        this.listenStatusService.setIisMsjConexionLentaSendPedidoSourse(true)
        return false;
      }, 6000); // despues de 6 segundos indicara que se acerque al punto wifi  
    });
  }

  private listen(evento: string) {
    return new Observable(observer => {
      this.socket.on(evento, (res: any) => {
        observer.next(res);
      });
    });
  }

  closeConnection(): void {
    try {
      this.socket.disconnect();
    } catch (error) { }
    // this.isSocketOpen = false;
    // this.isSocketOpenSource.next(false);
    this.statusConexSocket(false, 'disconnect');
  }

  private listenStatusSocket(): void {

    this.socket.on('finishLoadDataInitial', () => {
      this.statusConexSocket(true, '');
      this.isSocketOpenReconect = true; // evita que cargen nuevamente las configuraciones basicas, solo carga carta
      // console.log('conected socket finishLoadDataInitial');
    });

    // estados del navigator

    window.addEventListener('focus', (event) => {
      this.verifyConexionSocket();
    });

    window.addEventListener('online', () => {
      this.showStatusConexNavigator(true, 'navigator_online');
    });
    window.addEventListener('offline', () => {
      console.log('out focus');
      this.showStatusConexNavigator(false, 'navigator_offline');
    });

    window.addEventListener('blur', () => {
      console.log('out focus');
      // this.showStatusConexNavigator(false, 'navigator_offline');
    });


    // estado del socket
    this.socket.on('connect', () => {
      // console.log('socket connect');

      this.infoTockenService.setSocketId(this.socket.id);

      this.statusConexSocket(true, 'connect');

      // verifica el tiempo de session
      if (!this.infoTockenService.verificarContunuarSession()) {
        this.closeConnection();
        this.cerrarSessionBeforeTimeSession();
        return;
      }
    });

    this.socket.on('connect_failed', (res: any) => {
      // console.log('itento fallido de conexion', res);
      this.statusConexSocket(false, 'connect_failed');
    });

    this.socket.on('connect_error', (res: any) => {
      // console.log('error de conexion', res);
      this.statusConexSocket(false, 'connect_error');
    });

    this.socket.on('disconnect', (res: any) => {
      // console.log('disconnect');
      this.statusConexSocket(false, 'disconnect');
    });

    // escucha la verificacion de conexion
    this.socket.on('verificar-conexion', (res: any) => {

      // verifica el tiempo de session
      if (!this.infoTockenService.verificarContunuarSession()) {
        this.closeConnection();
        this.cerrarSessionBeforeTimeSession();
        return;
      }

      if (res === true) { console.log('VERIFY CONECTION => OK'); this.verificandoConexion = false; return; }

      // no hay conexion -- en pruebas ver comportamiento
      // console.log('VERIFY CONECTION => FALSE');
      this.closeConnection();
      this.statusConexSocket(false, 'disconnect');
      this.cerrarSessionBeforeTimeSession();
      this.connect();
      this.verificandoConexion = false;
    });

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
        this.verificandoConexion = false;
        break;
      case 'connect_error': // conectando
        msj = 'Conectando datos .';
        this.verificandoConexion = false;
        break;
      case 'disconnect': // conectando
        msj = 'Restableciendo conexion ...';
        this.verificandoConexion = false;
        break;
      case 'navigator_offline': // conectando
        msj = 'Conexion cerrada -b ...';
        this.verificandoConexion = false;
        break;
      case 'navigator_online': // conectando
        msj = 'Conectando datos -b ...';
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
      this.verificandoConexion = false;
    }
  }

  // verifica el estado del socket, si esta cerrado intenta abrirlo
  verifyConexionSocket(): void {
    // console.log('verificando...');
    if (this.verificandoConexion) { return; }
    this.verificandoConexion = true;
    this.emit('verificar-conexion', this.socket.id);
  }

  // cierra session despues de que se comprueba que el tiempo de incio se de session supero lo establecido
  private cerrarSessionBeforeTimeSession(reload: boolean = false) {
    this.router.navigate(['../']);
  }
}
