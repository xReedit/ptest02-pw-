import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs/internal/Observable';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';


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

  // un Subject por nombre de evento; ver fromEvent/bindEvent/rebindEvents
  private eventSubjects = new Map<string, Subject<any>>();

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

    const idHolding = infToken?.holding?.idsede_holding || 0;
    const isHolding = idHolding ? '1' : '0';



    const dataSocket = {
      idorg: infToken.idorg || 0,
      idsede: infToken.idsede || 0,
      idholding: idHolding,
      isClienteHoldingMesaApp: isHolding,
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

    this.rebindEvents(); // re-enlaza los eventos ya suscritos a la nueva instancia

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

  reconnect() {
    this.closeConnection();
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  getIdSocket(): string {
    return this.socket.id;
  }

  onGetCarta() {
    return this.fromEvent('getLaCarta');
  }

  onGetDataSedeDescuentos() {
    return this.fromEvent('getDataSedeDescuentos');
  }

  onGetTipoConsumo() {
    return this.fromEvent('getTipoConsumo');
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
    return this.fromEvent('itemModificado-pwa');
  }

  // onItemModificado() {
  //   return this.listen('observer');
  // }

  onNuevoItemAddInCarta() {
    return this.fromEvent('nuevoItemAddInCarta');
  }

  // onNuevoItemAddInCarta() {
  //   return this.listen('nuevoItemAddInCarta');
  // }

  // cuando se recupera el stock de pedido que caduco el tiempo
  onItemResetCant() {
    return this.fromEvent('itemResetCant-pwa');
  }

  // onItemResetCant() {
  //   return this.listen('itemResetCant');
  // }

  // load reglas de la carta y subtotales
  onReglasCarta() {
    return this.fromEvent('getReglasCarta');
  }

  // onReglasCarta() {
  //   return this.listen('getReglasCarta');
  // }

  // datos de la sede, impresoras
  // load reglas de la carta y subtotales
  onGetDatosSede() {
    return this.fromEvent('getDataSede');
  }

  onGetClienteLlama() {
    return this.fromEvent('notificar-cliente-llamado');
  }

  onRemoveClienteLlama() {
    return this.fromEvent('notificar-cliente-llamado-remove');
  }

  onLoadCallClienteLlama() {
    return this.fromEvent('load-list-cliente-llamado');
  }

  // respuesta de hacer un nuevo pedido
  onGetNuevoPedido() {
    return this.fromEvent('nuevoPedido');
  }

  // cuando el cliente paga el pedido
  onPedidoPagado() {
    return this.fromEvent('pedido-pagado-cliente');
  }


  onDeliveryPedidoChangeStatus() {
    return this.fromEvent('repartidor-notifica-estado-pedido');
  }

  onDeliveryUbicacionRepartidor() {
    return this.fromEvent('repartidor-notifica-ubicacion');
  }


  onComercioOpenChangeFromMonitor() {
    return this.fromEvent('set-comercio-open-change-from-monitor');
  }

  // repuesta del mensaje de verificacion
  onMsjVerificacionResponse() {
    return this.fromEvent('mensaje-verificacion-telefono-rpt');
  }

  // fecha ahora
  onGetInfoDateNow() {
    return this.fromEvent('date-now-info');
  }

  // escucha si mesa fue pagada
  onGetMesaPagada() {
    // solo emite si la mesa fue pagada en su totalidad (logica original del handler)
    return this.fromEvent('restobar-notifica-pay-pedido-res')
      .pipe(filter((res: any) => res && res.importe_restante === 0));
  }

  // escucha si hay nuevo pedido en mesa
  onGetNewPedidoMesa() {
    // normaliza el payload y descarta los que no traen mesa (logica original del handler)
    return this.fromEvent('nuevoPedido-for-list-mesas')
      .pipe(
        map((res: any) => this.normalizarPedidoMesa(res)),
        filter(rpt => rpt !== null)
      );
  }

  private normalizarPedidoMesa(res: any) {
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

    if (!pase) { return null; }

    _rpt.nummesa = _item_mesa.m;
    _rpt.nommozo = _item_mesa.nom_us;

    return _rpt;
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

  // Resuelve con la respuesta del servidor (por ack o por evento), rechaza por timeout o sin socket.
  asyncEmitPedido(eventName: string, eventNameRes: string, data: any, timeoutMs = 25000): Promise<any> {
    return new Promise((resolve, reject) => {
      // se captura la instancia: si hay reconexion a mitad de vuelo, off() debe soltar la misma instancia en la que se hizo on()
      const sock = this.socket;
      if (!sock || !sock.connected) {
        reject(new Error('socket-desconectado'));
        return;
      }
      let settled = false;
      let timerLento: any;
      let timerTimeout: any;
      const onRes = (result: any) => finish(() => resolve(result));
      const finish = (fn: () => void) => {
        if (settled) { return; }
        settled = true;
        clearTimeout(timerLento);
        clearTimeout(timerTimeout);
        sock.off(eventNameRes, onRes);
        // tambien en timeout: el aviso de conexion lenta no puede quedar colgado
        this.listenStatusService.setIisMsjConexionLentaSendPedidoSourse(false);
        fn();
      };
      // despues de 6 segundos indica al usuario que la conexion esta lenta
      timerLento = setTimeout(() => this.listenStatusService.setIisMsjConexionLentaSendPedidoSourse(true), 6000);
      timerTimeout = setTimeout(() => finish(() => reject(new Error('timeout'))), timeoutMs);
      sock.on(eventNameRes, onRes);
      sock.emit(eventName, data, (ack: any) => onRes(ack));
    });
  }

  // Un Subject por evento; los componentes se suscriben al Subject, no al socket,
  // asi una reconexion con instancia nueva no los deja escuchando a un socket muerto.
  private fromEvent<T = any>(evento: string): Observable<T> {
    if (!this.eventSubjects.has(evento)) {
      const subj = new Subject<any>();
      this.eventSubjects.set(evento, subj);
      this.bindEvent(evento, subj);
    }
    return this.eventSubjects.get(evento).asObservable();
  }

  private bindEvent(evento: string, subj: Subject<any>): void {
    if (!this.socket) { return; }
    this.socket.off(evento);
    this.socket.on(evento, (res: any) => subj.next(res));
  }

  // llamar cada vez que se crea una instancia nueva de socket
  private rebindEvents(): void {
    this.eventSubjects.forEach((subj, evento) => this.bindEvent(evento, subj));
  }

  private listen(evento: string) {
    return this.fromEvent(evento);
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

  // holding
  onCallPedidoListoMarca() {
    return this.fromEvent('restobar-call-mozo-holding');
  }
}
