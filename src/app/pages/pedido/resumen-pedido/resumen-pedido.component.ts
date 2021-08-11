import { Component, OnInit, OnDestroy } from '@angular/core';

import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { ReglascartaService } from 'src/app/shared/services/reglascarta.service';
import { PedidoModel } from 'src/app/modelos/pedido.model';
import { SocketService } from 'src/app/shared/services/socket.service';
import { JsonPrintService } from 'src/app/shared/services/json-print.service';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { RegistrarPagoService } from 'src/app/shared/services/registrar-pago.service';


import { SeccionModel } from 'src/app/modelos/seccion.model';
import { ItemModel } from 'src/app/modelos/item.model';
import { TipoConsumoModel } from 'src/app/modelos/tipoconsumo.model';
import { FormValidRptModel } from 'src/app/modelos/from.valid.rpt.model';
import { ItemTipoConsumoModel } from 'src/app/modelos/item.tipoconsumo.model';
import { SubItemsView } from 'src/app/modelos/subitems.view.model';

import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

import { DialogLoadingComponent } from './dialog-loading/dialog-loading.component';
import { DialogResetComponent } from './dialog-reset/dialog-reset.component';
import { DialogItemEditComponent } from 'src/app/componentes/dialog-item-edit/dialog-item-edit.component';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil, take, last, takeLast } from 'rxjs/operators';
import { EstadoPedidoClienteService } from 'src/app/shared/services/estado-pedido-cliente.service';
// import { throwToolbarMixedModesError } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { UtilitariosService } from 'src/app/shared/services/utilitarios.service';
// import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
// import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'app-resumen-pedido',
  templateUrl: './resumen-pedido.component.html',
  styleUrls: ['./resumen-pedido.component.css']
})
export class ResumenPedidoComponent implements OnInit, OnDestroy {

  // private unsubscribeRe = new Subscription();
  private destroy$: Subject<boolean> = new Subject<boolean>();

  _miPedido: PedidoModel = new PedidoModel();
  _arrSubtotales: any = [];
  hayItems = false;
  isVisibleConfirmar = false;
  isVisibleConfirmarAnimated = false;
  isHayCuentaBusqueda: boolean;
  numMesaCuenta = '';
  rulesCarta: any;
  rulesSubtoTales: any;

  msjErr = false;

  isReserva = false;
  isRequiereMesa = false;
  isDelivery = false;
  isDeliveryValid = false;
  frmConfirma: any = {};
  frmDelivery: any = {};
  frmReservaCliente: any = {};

  arrReqFrm: FormValidRptModel;

  rippleColor = 'rgb(255,238,88, 0.5)';
  rippleColorSubItem = 'rgba(117,117,117,0.1)';

  loadPrinterPrecuenta = false; // si se mando a imprimir precuenta

  objCuenta: any = [];

  isCliente: boolean; // si es cliente quien hace el pedido
  isSoloLLevar: boolean; // si es solo llevar
  isDeliveryCliente: boolean; // si es cliente delivery
  isReservaCliente: boolean; // si es cliente delivery
  isReadyClienteDelivery = false; // si el formulario(confirmacion) clienteDelivery esta listo
  isReadyClienteReserva = false; // si el formulario(confirmacion) reserva esta listo
  isReloadListPedidos = false;

  private isFirstLoadListen = false; // si es la primera vez que se carga, para no volver a cargar los observables

  private isBtnPagoShow = false; // si el boton de pago ha sido visible entonces recarga la pagina de pago

  private systemOS = ''; // sistema operativo cliente

  constructor(
    private miPedidoService: MipedidoService,
    private reglasCartaService: ReglascartaService,
    private navigatorService: NavigatorLinkService,
    private socketService: SocketService,
    private jsonPrintService: JsonPrintService,
    private infoToken: InfoTockenService,
    private crudService: CrudHttpService,
    private listenStatusService: ListenStatusService,
    private estadoPedidoClientService: EstadoPedidoClienteService,
    private dialog: MatDialog,
    private router: Router,
    private registrarPagoService: RegistrarPagoService,
    private establecimientoService: EstablecimientoService,
    private utilService: UtilitariosService
    ) { }

  ngOnInit() {

    // this.establecimientoService.get();

    this.systemOS = this.utilService.getOS();

    this._miPedido = this.miPedidoService.getMiPedido();

    this.reglasCartaService.loadReglasCarta()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
      this.rulesCarta = res[0] ? res[0].reglas ? res[0].reglas : [] : res.reglas ? res.reglas : [];
      this.rulesSubtoTales = res.subtotales || res[0].subtotales;

      this.establecimientoService.setRulesSubtotales(this.rulesSubtoTales);


      this.listenMiPedido();

      this.newFomrConfirma();


      // this.frmDelivery = new DatosDeliveryModel();
    });

    this.navigatorService.resNavigatorSourceObserve$
    .pipe(takeUntil(this.destroy$))
    .subscribe((res: any) => {
          if (res.pageActive === 'mipedido') {
            if (res.url.indexOf('confirma') > 0) {
              // this.confirmarPeiddo();
            } else {
              // this.backConfirmacion();
            }
          }
        });

    this.listenStatusService.isBtnPagoShow$
        .pipe(takeUntil(this.destroy$))
        .subscribe((res: boolean) => {
          this.isBtnPagoShow = res;
          if (!res) {
            const localBtnP = localStorage.getItem('sys::btnP');
            if ( localBtnP && localBtnP.toString() === '1' ) {
              this.isBtnPagoShow = true;
             }
          }
        });


    // si es cliente
    this.isCliente = this.infoToken.isCliente();
    this.isSoloLLevar = this.infoToken.isSoloLlevar();
    this.isDeliveryCliente = this.infoToken.isDelivery();
    this.isReservaCliente = this.infoToken.isReserva();
    this.isClienteSetValues();
  }

  // si es cliente asigna mesa
  private isClienteSetValues(): void {
    if ( this.isCliente ) {
      this.isRequiereMesa = false;
    }
  }

  ngOnDestroy(): void {
    // this.unsubscribe$.next();
    // this.unsubscribe$.complete();
    // this.unsubscribeRe.unsubscribe();
    // Now let's also unsubscribe from the subject itself:
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  private newFomrConfirma(): void {
    this.frmConfirma = {
      nummesa: '',
      nummesa_resplado: '',
      referencia: '',
      reserva: false,
      solo_llevar: false,
      delivery: false
    };

    // traer los ultimos datos de comisiones
    this.establecimientoService.getComsionEntrega();
  }

  pintarMiPedido() {
    this.isReloadListPedidos = true;
    // if (!this.isHayCuentaBusqueda) {
      this.miPedidoService.validarReglasCarta(this.rulesCarta);
    // }

    this._arrSubtotales = this.miPedidoService.getArrSubTotales(this.rulesSubtoTales);
    localStorage.setItem('sys::st', btoa(JSON.stringify(this._arrSubtotales)));
    this.hayItems = parseFloat(this._arrSubtotales[0].importe) > 0 ? true : false;

    setTimeout(() => {
      this.isReloadListPedidos = false;
    }, 1000);

  }

  pintarMiPedidoNuevamente() {
    this.isReloadListPedidos = true;
    if ( !this.rulesCarta ) {
      window.location.reload();
      return;
    }

    this.pintarMiPedido();
  }

  listenMiPedido() {
    // 090121 // comentamos estas lineas para corregir error de "Aun no tiene ningun producto en lista"
    // if ( this.isFirstLoadListen ) {return; }
    // this.isFirstLoadListen = true; // para que no vuelva a cargar los observables cuando actualizan desde sockets


    this.miPedidoService.countItemsObserve$
    .pipe(takeUntil(this.destroy$))
    .subscribe((res) => {
      this.hayItems = res > 0 ? true : false;
    });

    // .pipe(last())
    this.miPedidoService.miPedidoObserver$
    .pipe(takeUntil(this.destroy$))
    .subscribe((res) => {
      // this.miPedidoService.clearObjMiPedido(); // quita las cantidades 0
      // this._miPedido = this.miPedidoService.getMiPedido();
      this._miPedido = <PedidoModel>res;
      this.pintarMiPedido();

    });

    this.listenStatusService.hayCuentaBusqueda$
    .pipe(takeUntil(this.destroy$))
    .subscribe(res => {
      this.isHayCuentaBusqueda = res;
    });

    // cuando es solo llevar // estar pendiente de pago suscces para enviar el pedido
    this.listenStatusService.isPagoSucces$
    .pipe(takeUntil(this.destroy$))
    .subscribe(res => {
      if ( !res ) {return; }
      // toma la respuesta de pago
      // const resPago = JSON.parse(localStorage.getItem('sys::transaction-response'));
      // const resPagoIsSucces = resPago ? !resPago.error : false;
      const resPago = this.registrarPagoService.getDataTrasaction();
      if (resPago.isSuccess && this.isSoloLLevar) {
        // localStorage.removeItem('sys::transaction-response');
        this.registrarPagoService.removeLocalDataTransaction();
        this.enviarPedido();
      }
    });

    this.socketService.isSocketOpen$
    .pipe(takeUntil(this.destroy$))
    .subscribe(res => {
      if (!res) {

        // this.unsubscribeRe.unsubscribe();
      }
    });


    // si es cliente escucha cunado termina de hacer el pedido
    if ( this.isCliente ) {
      this.socketService.onGetNuevoPedido()
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        // this.estadoPedidoClientService.getCuentaTotales();
        // this.xLoadCuentaMesa('', this.estadoPedidoClientService.getCuenta());
        // this.estadoPedidoClientService.setImporte(this._arrSubtotales[this._arrSubtotales.length - 1].importe);
      });
    }

    // escucha que haya cuenta del cliente
    this.estadoPedidoClientService.hayCuentaCliente$
    .pipe(takeUntil(this.destroy$))
    .subscribe((res: any) => {
      if ( res ) {

        this.xLoadCuentaMesa('', res);
      }
    });


    // escucha isOutEstablecimientoDelivery
    this.listenStatusService.isOutEstablecimientoDelivery$
    .pipe(takeUntil(this.destroy$))
    .subscribe((res: any) => {
      if ( res ) {
        this.goBackOutEstablecimiento();
        this.listenStatusService.setIsOutEstablecimientoDelivery(false);
      }
    });
  }

  addItemToResumen(_tpc: ItemTipoConsumoModel, _seccion: SeccionModel, _item: ItemModel, _subItems: SubItemsView, suma: number): void {

    this.miPedidoService.setObjSeccionSeleced(_seccion);
    const _itemFromCarta = this.miPedidoService.findItemCarta(_item);

    // obtenemos el tipo consumo de carta
    const _tpc_item_carta = _itemFromCarta.itemtiposconsumo.filter((x: ItemTipoConsumoModel) => x.idtipo_consumo === _tpc.idtipo_consumo)[0];

    // this.miPedidoService.setobjItemTipoConsumoSelected( _itemInList.itemtiposconsumo);
    _itemFromCarta.subitems_selected = _subItems.subitems;
    _itemFromCarta.cantidad_seleccionada = _item.cantidad_seleccionada;

    this.miPedidoService.addItem2(_tpc_item_carta, _itemFromCarta, suma);

  }

  openDlgItemToResumen(_seccion: SeccionModel, _item: ItemModel): void {
    const dialogConfig = new MatDialogConfig();
    const _itemFromCarta = this.miPedidoService.findItemCarta(_item);

    // dialogConfig.panelClass = 'dialog-item-edit';
    dialogConfig.autoFocus = false;
    dialogConfig.data = {
      idTpcItemResumenSelect: null,
      seccion: _seccion,
      item: _itemFromCarta,
      objItemTipoConsumoSelected: _itemFromCarta.itemtiposconsumo
    };
    dialogConfig.panelClass =  ['my-dialog-orden-detalle', 'margen-0', 'margen-0'];

    const dialogRef = this.dialog.open(DialogItemEditComponent, dialogConfig);

    // subscribe al cierre y obtiene los datos
    dialogRef.afterClosed().subscribe(
        data => {
          if ( !data ) { return; }

        }
    );

  }

  nuevoPedido() {
    this.backConfirmacion();
    if (this.isVisibleConfirmar) {
      this.backConfirmacion();
      // this.isVisibleConfirmarAnimated = false;
      // setTimeout(() => {
      //   this.isVisibleConfirmar = false;
      // }, 300);
      return;
    }

    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;

    const dialogReset = this.dialog.open(DialogResetComponent, _dialogConfig);
    dialogReset.afterClosed().subscribe(result => {
      if (result ) {
        // enviamos this._miPedido esta visa no se modifica
        this.miPedidoService.resetAllNewPedido();
        this.navigatorService.setPageActive('carta');
        this.isDeliveryValid = false; // formulario no valido para delivery
      }
    });

    this.newFomrConfirma();
  }

  nuevoPedidoFromCuenta(): void {
    this.navigatorService.setPageActive('carta');
  }

  private backConfirmacion(): void {
    this.navigatorService.addLink('mipedido');
    this.isVisibleConfirmarAnimated = false;
    this.isRequiereMesa = false;
    setTimeout(() => {
      this.isVisibleConfirmar = false;
    }, 300);
  }

  getDatosFormConfirmaDelivery($event: any) {
    this.frmDelivery = $event;
  }

  getDatosFormConfirmaReserva($event: any) {
    this.frmReservaCliente = $event.formData;

    const _frmConfirma = {
      nummesa: '',
      nummesa_resplado: '',
      referencia: this.frmReservaCliente.nombre_reserva + ' ' + this.frmReservaCliente.empresa + ' ' + this.frmReservaCliente.hora_reserva,
      reserva: true,
      solo_llevar: false,
      delivery: false
    };

    this.frmConfirma = _frmConfirma;
  }

  private confirmarPeiddo(): void {

    if (this.isVisibleConfirmarAnimated ) { // enviar pedido
      if (this.isRequiereMesa || !this.isDeliveryValid ) {

        // si el pago del delivery es en efectivo procesa pago
        if ( this.infoToken.infoUsToken.metodoPago.idtipo_pago === 1 && this.isDeliveryValid) {
          this.prepararEnvio();
        }
        return;
      }

      this.prepararEnvio();
    } else {

      this.isVisibleConfirmar = true;
      this.isVisibleConfirmarAnimated = true;

      this.checkTiposDeConsumo();
      this.checkIsRequierMesa();
      this.checkIsDelivery();

      this.navigatorService.addLink('mipedido-confirma');

      this.isClienteSetValues();
    }
  }

  private prepararEnvio(): void {
    if ( !this.isDeliveryCliente) {
      this.showLoaderPedido();
      // const _dialogConfig = new MatDialogConfig();
      // _dialogConfig.disableClose = true;
      // _dialogConfig.hasBackdrop = true;

      // const dialogLoading = this.dialog.open(DialogLoadingComponent, _dialogConfig);
      // dialogLoading.afterClosed().subscribe(result => {
      //   this.enviarPedido();
      // });
    } else {
      // si es delivery y paga en efectivo o yape envia de
      // 1 efectivo 2 tarjeta 3 yape
      if ( this.infoToken.infoUsToken.metodoPago.idtipo_pago !== 2 ) {
        this.showLoaderPedido();
      } else {
        this.enviarPedido();
      }
    }

  }

  private showLoaderPedido(): void {
    this.listenStatusService.setLoaderSendPedido(true);


    // seteamos el metodo pago que el cliente selecciona
    this.infoToken.setMetodoPagoSelected(this.infoToken.infoUsToken.metodoPago);

    setTimeout(() => {
      this.enviarPedido();
    }, 1400);

    // const _dialogConfig = new MatDialogConfig();
    // _dialogConfig.hasBackdrop = true;
    // _dialogConfig.disableClose = true;

    // const dialogLoading = this.dialog.open(DialogLoadingComponent, _dialogConfig);
    // dialogLoading.afterClosed().subscribe(result => {
    //   this.enviarPedido();
    // });
  }

  private enviarPedido(): void {

    this.verificarConexionSocket();

    // para asegurar que marque delivery si es
    const isPagoConTarjeta = this.infoToken.getInfoUs().metodoPago.idtipo_pago === 2;

    this.checkTiposDeConsumo();

    // get subtotales // si es delivery porque puede que modifique la distancia y modifica el precio // que se va ver en comanda
    // this._arrSubtotales = this.miPedidoService.getArrSubTotales(this.rulesSubtoTales);

    // seteamos el metodo pago que el cliente selecciona
    this.infoToken.setMetodoPagoSelected(this.infoToken.getInfoUs().metodoPago);
    // this.infoToken.setMetodoPagoSelected(this.infoToken.infoUsToken.metodoPago);

    // saca del local por que puede que se haya puestro propina
    this._arrSubtotales = JSON.parse(atob(localStorage.getItem('sys::st')));
    localStorage.setItem('sys::st', btoa(JSON.stringify(this._arrSubtotales)));

    // console.log('this._arrSubtotales', this._arrSubtotales);

    // usuario o cliente
    const dataUsuario = this.infoToken.getInfoUs();
    // const dataUsuario = this.infoToken.infoUsToken;

    const dataFrmConfirma: any = {};
    if ( this.isCliente && !this.isReservaCliente ) {
      this.frmConfirma.solo_llevar = this.isSoloLLevar ? true : this.frmConfirma.solo_llevar;
      dataFrmConfirma.m = this.isSoloLLevar ? '' : dataUsuario.numMesaLector;
      dataFrmConfirma.m = this.isDeliveryCliente ? '' : dataUsuario.numMesaLector;
      dataFrmConfirma.r = this.infoToken.getInfoUs().nombres.toUpperCase();
      dataFrmConfirma.nom_us = this.infoToken.getInfoUs().nombres.toLowerCase();
      dataFrmConfirma.m_respaldo = dataFrmConfirma.m;
    } else {
      // dataFrmConfirma.m = this.frmConfirma.mesa ? this.frmConfirma.mesa.toString().padStart(2, '0') || '00' : '00';
      dataFrmConfirma.m_respaldo = this.frmConfirma.nummesa_resplado;
      dataFrmConfirma.m = this.frmConfirma.nummesa ? this.frmConfirma.nummesa : this.arrReqFrm.isRequiereMesa ? this.frmConfirma.nummesa_resplado : '00';
      dataFrmConfirma.r = this.frmConfirma.delivery ? this.frmDelivery.nombre : this.utilService.addslashes(this.frmConfirma.referencia) || '';
      dataFrmConfirma.nom_us = this.infoToken.getInfoUs().nombres.split(' ')[0].toLowerCase();
    }


    // header //

    // const _subTotalesSave = _p_header.delivery === 1 ? this.frmDelivery.subTotales : this._arrSubtotales;
    // debugger
    // const idPwaPago = this.registrarPagoService.getIdPwaPago();



    const _p_header = {
      m: dataFrmConfirma.m, // this.frmConfirma.mesa ? this.frmConfirma.mesa.toString().padStart(2, '0') || '00' : '00',
      m_respaldo: dataFrmConfirma.m_respaldo,
      r: dataFrmConfirma.r, // this.frmConfirma.referencia || '',
      nom_us: dataFrmConfirma.nom_us, // this.infoToken.getInfoUs().nombres.split(' ')[0].toLowerCase(),
      delivery: this.frmConfirma.delivery || this.isDeliveryCliente ? 1 : 0,
      reservar: this.frmConfirma.reserva ? 1 : 0,
      solo_llevar: this.frmConfirma.solo_llevar ? 1 : 0,
      idcategoria: localStorage.getItem('sys::cat'),
      correlativo_dia: '', // en backend
      num_pedido: '', // en backend
      isCliente: this.isCliente ? 1 : 0,
      isSoloLLevar: this.isSoloLLevar,
      idregistro_pago: 0,
      // idregistro_pago: this.isSoloLLevar ? this.registrarPagoService.getDataTrasaction().idregistro_pago : 0,
      arrDatosDelivery: this.frmDelivery,
      arrDatosReserva: this.frmReservaCliente, // datos de la reserva que hace el cliente
      systemOS: this.systemOS,
      idregistra_scan_qr: this.establecimientoService.getLocalIdScanQr(), // el id del scan register
      is_print_subtotales: this.miPedidoService.objDatosSede.datossede[0].is_print_subtotales,
      isprint_copy_short: this.miPedidoService.objDatosSede.datossede[0].isprint_copy_short,
      isprint_all_short: this.miPedidoService.objDatosSede.datossede[0].isprint_all_short
    };

    // frmDelivery.buscarRepartidor este dato viene de datos-delivery pedido tomado por el mismo comercio // si es cliente de todas maneras busca repartidores
    const isClienteBuscaRepartidores = this.frmDelivery.buscarRepartidor ? this.frmDelivery.buscarRepartidor : this.isDeliveryCliente || false;
    // const _subTotalesSave = _p_header.delivery === 1 ? this.frmDelivery.subTotales : this._arrSubtotales;
    const _subTotalesSave = this._arrSubtotales;

    const dataPedido = {
      p_header: _p_header,
      p_body: this._miPedido,
      p_subtotales: _subTotalesSave,
      idpedido: 0 // setea despues de guardar el pedido para enviarlo al socket
    };

    // console.log('_p_header', _p_header);

    // enviar a print_server_detalle // para imprimir
    const arrPrint = this.jsonPrintService.enviarMiPedido(this.isCliente);
    const dataPrint: any = [];
    arrPrint.map((x: any) => {
      dataPrint.push({
        Array_enca: _p_header,
        ArraySubTotales: _subTotalesSave,
        ArrayItem: x.arrBodyPrint,
        Array_print: x.arrPrinters
      });
    });



    const _dataUsuarioSend = {
      'idusuario': dataUsuario.idusuario,
      'idcliente': dataUsuario.idcliente,
      'idorg': dataUsuario.idorg,
      'idsede': dataUsuario.idsede,
      'nombres': dataUsuario.nombres,
      'cargo': dataUsuario.cargo,
      'usuario': dataUsuario.usuario
    };

    const dataSend = {
      dataPedido: dataPedido,
      dataPrint: dataPrint,
      dataUsuario: _dataUsuarioSend,
      isDeliveryAPP: _p_header.delivery === 1 ? true : false, // isClienteBuscaRepartidores, // this.isDeliveryCliente,
      isClienteRecogeLocal: this.infoToken.infoUsToken.pasoRecoger, // indica si el cliente pasa a recoger entonces ya no busca repartidor
      dataDescuento: [], // lista de ids de descuento para restar cantidad num_pedidos
      listPrinters: arrPrint.listPrinters
    };

    // ya no lo envio
    // quitamos el order delivery de los datos del usuario para que no sea mucho el json
    // dataSend.dataUsuario.orderDelivery = '';
    // dataSend.dataUsuario.importeDelivery = '';

    // this.socketService.emit('printerComanda', dataPrint);

    // si es clienteDelivery no se emite nada
    // primero confirma el pago y luego guarda pedido y posteriormente el pago
    // guardamos el pedido

    if ( this.isDeliveryCliente && dataUsuario.metodoPago.idtipo_pago === 2) {
      this.infoToken.setOrderDelivery(JSON.stringify(dataSend), JSON.stringify(_subTotalesSave));
      this.pagarCuentaDeliveryCliente();
      // enviamos a pagar
      return;
    }


    // descuentos
    if ( this.infoToken.infoUsToken.isHayDescuento ) {
      const _listDsc = this.miPedidoService.getIdsDescuentos();
      dataSend.dataDescuento = _listDsc;

    }

    // registrar el id cliente para consultar luego en mis pedidos
    if ( this.infoToken.infoUsToken.isCliente ) {
      this.infoToken.setIdCliente();
    }

    // console.log('aaaaaaaaaaaaaaa');

    // enviar a guardar // guarda pedido e imprime comanda

    // prioridad socket, por crud demora mucho aveces se queda enviando datos...
    this.savePedidoSocket(dataSend, isPagoConTarjeta, _subTotalesSave);

    // prioridad guardar por post
    // this.crudService.postFree(JSON.stringify(dataSend), 'pedido', 'registrar-nuevo-pedido', false)
    //     .subscribe((res: any) => {

    // // // this.socketService.emit('nuevoPedido', dataSend); // !> 150920
    // // this.socketService.emitRes('nuevoPedido', JSON.stringify(dataSend)).subscribe(resSocket => { // prioridad guardar por post
    //   // seteamos el metodo pago que el cliente selecciona
    //   // this.infoToken.setMetodoPagoSelected(_p_header.arrDatosDelivery.metodoPago);
    //   // error
    //   // console.log('recibido la respuesta del servidor', resSocket);
    //   // if ( resSocket === false ) {
    //   if ( !res.success ) {
    //     // si tiene error lo intenta enviar por http
    //     // this.crudService.postFree(JSON.stringify(dataSend), 'pedido', 'registrar-nuevo-pedido', false) // prioridad guardar por post
    //     // .subscribe((res: any) => { // prioridad guardar por post
    //     this.socketService.emitRes('nuevoPedido', JSON.stringify(dataSend)).subscribe(resSocket => {

    //       // if ( !res.success ) {
    //       if ( resSocket === false ) {
    //         alert('!Ups a ocurrido un error, por favor verifique los datos y vuelve a intentarlo.');
    //         // guardamos el error
    //         const dataError = {
    //           elerror: res.error,
    //           elorigen: 'resumen-pedido'
    //         };

    //         this.crudService.postFree(dataError, 'error', 'set-error', false)
    //         .subscribe(resp => console.log(resp));

    //         this.listenStatusService.setLoaderSendPedido(false);
    //         return;
    //       }

    //       setTimeout(() => {
    //         this.listenStatusService.setLoaderSendPedido(false);
    //         this.miPedidoService.stopTimerLimit();
    //         this.miPedidoService.prepareNewPedido();
    //       }, 600);
    //       // post
    //       // dataSend.dataPedido.idpedido = res.data[0].idpedido;
    //       // dataSend.dataPrint = res.data[0].data;
    //       // this.socketService.emit('nuevoPedido2', dataSend);

    //       // socket
    //       const _res = resSocket[0];
    //       dataSend.dataPedido.idpedido = _res.idpedido;
    //       dataSend.dataPrint = _res.data[1] ? _res.data[1]?.print : null;

    //       this.newFomrConfirma();
    //       // this.backConfirmacion();

    //       // hora del pedido
    //       this.estadoPedidoClientService.setHoraInitPedido(new Date().getTime());

    //       // this.miPedidoService.prepareNewPedido();

    //       // this.miPedidoService.prepareNewPedido();

    //       // si es delivery y el pago es en efectivo o en yape, notificamos transaccion conforme
    //       // if ( this.isDeliveryCliente && dataUsuario.metodoPago.idtipo_pago !== 2) {
    //       // if ( this.isDeliveryCliente && _p_header.arrDatosDelivery.metodoPago.idtipo_pago !== 2) {
    //         // if ( this.isDeliveryCliente && this.infoToken.infoUsToken.metodoPago.idtipo_pago !== 2) {
    //       if ( this.isDeliveryCliente && !isPagoConTarjeta) {
    //         this.infoToken.setOrderDelivery(JSON.stringify(dataSend), JSON.stringify(_subTotalesSave));
    //         this.confirmarPedidoDeliveryEnviado();

    //         // this.pagarCuentaDeliveryCliente();
    //         // enviamos a pagar
    //         return;
    //       }

    //       if ( this.isReservaCliente ) {
    //         this.confirmarPedidoDeliveryEnviado();
    //         return;
    //       }



    //       this.backConfirmarPedido();
    //     });

    //   } else { // si no tiene error

    //     // socket
    //     // const res = resSocket[0];
    //     // dataSend.dataPedido.idpedido = res.idpedido;
    //     // dataSend.dataPrint = res.data[1] ? res.data[1]?.print : null;
    //     // this.socketService.emit('nuevoPedido2', dataSend);

    //     dataSend.dataPedido.idpedido = res.data[0].idpedido;
    //     dataSend.dataPrint = res.data[0].data;
    //     this.socketService.emit('nuevoPedido2', dataSend);

    //     this.newFomrConfirma();
    //     // this.backConfirmacion();

    //     // hora del pedido
    //     this.estadoPedidoClientService.setHoraInitPedido(new Date().getTime());

    //     // this.miPedidoService.prepareNewPedido();


    //     setTimeout(() => {
    //       this.listenStatusService.setLoaderSendPedido(false);
    //       this.miPedidoService.stopTimerLimit();
    //       this.miPedidoService.prepareNewPedido();
    //     }, 600);

    //     //

    //     // si es delivery y el pago es en efectivo o en yape, notificamos transaccion conforme
    //     // if ( this.isDeliveryCliente && dataUsuario.metodoPago.idtipo_pago !== 2) {
    //     // if ( this.isDeliveryCliente && _p_header.arrDatosDelivery.metodoPago.idtipo_pago !== 2) {
    //     // if ( this.isDeliveryCliente && this.infoToken.infoUsToken.metodoPago.idtipo_pago !== 2) {
    //     if ( this.isDeliveryCliente && !isPagoConTarjeta) {
    //       this.infoToken.setOrderDelivery(JSON.stringify(dataSend), JSON.stringify(_subTotalesSave));
    //       this.confirmarPedidoDeliveryEnviado();

    //       // this.pagarCuentaDeliveryCliente();
    //       // enviamos a pagar
    //       return;
    //     }

    //     if ( this.isReservaCliente ) {
    //       this.confirmarPedidoDeliveryEnviado();
    //       return;
    //     }

    //     this.backConfirmarPedido();
    //   }

    //   // this.backConfirmarPedido()
    // });

      // hora del pedido
      // this.estadoPedidoClientService.setHoraInitPedido(new Date().getTime());

      //
      // this.navigatorService.addLink('mipedido');
      // this.isVisibleConfirmarAnimated = false;
      // this.isRequiereMesa = false;
      // this.isVisibleConfirmar = false;
      //
      // this.backConfirmacion();

      // this.newFomrConfirma();

      // this.miPedidoService.prepareNewPedido();

      // // si es delivery y el pago es en efectivo o en yape, notificamos transaccion conforme
      // if ( this.isDeliveryCliente && dataUsuario.metodoPago.idtipo_pago !== 2) {
      //   this.pagarCuentaDeliveryCliente();
      //   // enviamos a pagar
      //   return;
      // }

      // this.miPedidoService.prepareNewPedido();

      // this.backConfirmacion();

      // // si es usuario cliente lo envia a estado
      // if ( this.isCliente ) {
      //   this.navigatorService.setPageActive('estado');
      //   // this.estadoPedidoClientService.get(); // inicia calc tiempo aprox y cuenta total
      // } else {
      //   this.navigatorService.setPageActive('carta');
      // }

      this.isDeliveryValid = false; // formulario no valido para delivery



  }

  private backConfirmarPedido() {
    this.backConfirmacion();

    // si es usuario cliente lo envia a estado
    if ( this.isCliente ) {
      this.navigatorService.setPageActive('estado');
      // this.estadoPedidoClientService.get(); // inicia calc tiempo aprox y cuenta total
    } else {
      this.navigatorService.setPageActive('carta');
    }

    this.isDeliveryValid = false; // formulario no valido para delivery
  }

  private checkTiposDeConsumo(): void {
    // console.log('check tipo consumo');
    this.arrReqFrm = <FormValidRptModel>this.miPedidoService.findEvaluateTPCMiPedido();
    this.isRequiereMesa = this.arrReqFrm.isRequiereMesa;
    this.frmConfirma.solo_llevar = this.arrReqFrm.isTpcSoloDelivery ? false : this.arrReqFrm.isTpcSoloLLevar;
    this.frmConfirma.delivery = this.arrReqFrm.isTpcSoloDelivery;
  }

  checkIsRequierMesa(num: string = ''): void {
    // console.log('check mesa', num);
    if ( num !== '' ) {this.frmConfirma.nummesa = num; }
    this.frmConfirma.nummesa_resplado = num;
    // const arrReqFrm = <FormValidRptModel>this.miPedidoService.findEvaluateTPCMiPedido();
    // const isTPCLocal = arrReqFrm.isTpcLocal;
    // this.isRequiereMesa = arrReqFrm.isRequiereMesa;
    let numMesasSede = parseInt(this.miPedidoService.objDatosSede.datossede[0].mesas, 0);
    numMesasSede = isNaN(numMesasSede) ? 0 : numMesasSede; // para asegurar si no viene este dato

    let isMesaValid = this.frmConfirma.nummesa ? this.frmConfirma.nummesa !== '' ? true : false : false;
    // valida la mesa que no sea mayor a las que hay
    const numMesaIngresado = isMesaValid ? parseInt(this.frmConfirma.nummesa, 0) : 0;
    isMesaValid = numMesaIngresado <= 0 || numMesaIngresado > numMesasSede ? false : true;
    this.isRequiereMesa = this.arrReqFrm.isRequiereMesa;

    // this.isRequiereMesa = isTPCLocal;
    this.isRequiereMesa = this.isRequiereMesa && (!isMesaValid && !this.frmConfirma.reserva);

  }

  private checkIsDelivery() {
    this.isDelivery = this.miPedidoService.findMiPedidoIsTPCDelivery();
    // this.isDeliveryCliente = this.isDelivery;
    // this.frmConfirma.delivery = this.isDelivery;
  }

  checkDataDelivery($event: any) {
    this.isDeliveryValid = $event.formIsValid;
    this.frmDelivery = $event.formData;
  }

  imprimirPrecuenta() {
    this.loadPrinterPrecuenta = true;
    const _getPrinterCaja = this.jsonPrintService.getPrinterPrecuenta();
    if ( !_getPrinterCaja ) {return; }
    const xArrayEncabezado = {
            'm': this.numMesaCuenta,
            'r': '',
            'num_pedido': '',
            'reservar': 0,
            'solo_llevar': 0,
            'correlativo_dia': '',
            'precuenta': true,
            'delivery': false,
            'arrDatosDelivery': [],
            'idregistro_pago': 0,
            'nom_us': this.infoToken.infoUsToken.usuario
          };

    const _data = {
      Array_enca: xArrayEncabezado,
      Array_print: _getPrinterCaja.arrPrinters,
      ArrayItem: _getPrinterCaja.arrBodyPrint,
      ArraySubTotales: this._arrSubtotales
    };

    const dataSend = {
      dataPrint: _data,
      isprecuenta: 1
    };


    this.miPedidoService.printerPrecuenta(dataSend);
    setTimeout(() => {
      this.loadPrinterPrecuenta = false;

    }, 2000);
  }

  // _resCuentaFromCliente desde la cuenta del cliente
  xLoadCuentaMesa(mesa: string, _resCuentaFromCliente: any = null): void {
    this.isHayCuentaBusqueda = false;
    this.msjErr = false;
    this.numMesaCuenta = mesa;
    const datos = { mesa: mesa };


    if ( _resCuentaFromCliente ) {
      // cuando el usuario cliente realiza un nuevo pedido y se tiene que mostrar la cuenta
      this.desglozarCuenta(_resCuentaFromCliente);
      setTimeout(() => {
        this.estadoPedidoClientService.setImporte(this._arrSubtotales[this._arrSubtotales.length - 1].importe);
      }, 1000);
      return;
    }

    this.crudService.postFree(datos, 'pedido', 'lacuenta').subscribe((res: any) => {
      this.desglozarCuenta(res);
    });
  }


  private desglozarCuenta(res: any): void {
    const _miPedidoCuenta: PedidoModel = new PedidoModel();
    const c_tiposConsumo: TipoConsumoModel[] = [];

    // si se encontro cuenta
    if (res.data.length === 0) {
      this.isHayCuentaBusqueda = false;
      this.msjErr = true;
      this.listenStatusService.setHayCuentaBuesqueda(false);
      return; }

    this.isHayCuentaBusqueda = true;
    this.listenStatusService.setHayCuentaBuesqueda(true);
    // tipo consumo
    res.data.map( (tp: any) => {
      let hayTpc = c_tiposConsumo.filter(x => x.idtipo_consumo === tp.idtipo_consumo)[0];
      if (!hayTpc) {
        hayTpc = new TipoConsumoModel;
        hayTpc.descripcion = tp.des_tp;
        hayTpc.idtipo_consumo = parseInt(tp.idtipo_consumo, 0);
        c_tiposConsumo.push(hayTpc);
      }
    });

    // secciones


    // const _listSec = res.data.reduce(function(rv, x) {
    //     (rv[x['idseccion']] = rv[x['idseccion']] || []).push(x);
    //     return rv;
    //   }, {});


    c_tiposConsumo.map((tp: TipoConsumoModel) => {
      res.data
        .filter((_tp: any) => _tp.idtipo_consumo === tp.idtipo_consumo)
        .map((_s: any, i: number) => {
          let haySeccion = tp.secciones.filter((s: SeccionModel) => s.idseccion.toString() === _s.idseccion.toString())[0];
          if (!haySeccion) {
            haySeccion = new SeccionModel;
            haySeccion.idseccion = _s.idseccion.toString();
            haySeccion.des = _s.des_seccion;
            haySeccion.sec_orden = _s.sec_orden;
            haySeccion.ver_stock_cero = 0;
            tp.count_items_seccion = i + 1;
            tp.secciones.push(haySeccion);
          }
        });
    });

    // items
    c_tiposConsumo.map((tp: TipoConsumoModel) => {
      tp.secciones.map((s: SeccionModel) => {
        res.data
        .filter((_tp: any) => _tp.idtipo_consumo.toString() === tp.idtipo_consumo.toString() && _tp.idseccion.toString() === s.idseccion.toString())
        .map((_i: any, i: number) => {
          const hayItem = new ItemModel;
          hayItem.des = _i.descripcion;
          hayItem.detalles = '';
          hayItem.iditem = _i.iditem;
          hayItem.idcarta_lista = _i.idcarta_lista;
          hayItem.idseccion = _i.idseccion;
          hayItem.isalmacen = _i.isalmacen;
          hayItem.cantidad_seleccionada = parseInt(_i.cantidad, 0);
          hayItem.precio = _i.punitario;
          hayItem.precio_print = parseFloat(_i.ptotal);
          hayItem.precio_total = parseFloat(_i.ptotal);
          hayItem.procede = _i.procede === '0' ? 1 : 0;
          hayItem.seccion = _i.des_seccion;
          hayItem.subitems_view = _i.subitems === 'null' || _i.subitems === '' || !_i.subitems ? [] : JSON.parse(_i.subitems);
          s.count_items = i + 1;
          s.items.push(hayItem);
        });
      });
    });



    _miPedidoCuenta.tipoconsumo = c_tiposConsumo;
    this.miPedidoService.setObjMiPedido(_miPedidoCuenta);
    this._miPedido = this.miPedidoService.getMiPedido();

    // para notificar antes del pago
    console.log('bbbbbbbbbbbbbbbbbbb');
    this._arrSubtotales = this.miPedidoService.getArrSubTotales(this.rulesSubtoTales);
    localStorage.setItem('sys::st', btoa(JSON.stringify(this._arrSubtotales)));

  }


  pagarCuentaDeliveryCliente() {
    // this.navigatorService._router('./pagar-cuenta');
    // if ( !localStorage.getItem('sys::st') ) {
    //   this.verCuenta();
    //   return;
    // }

    // this.estadoPedidoClientService.getCuenta(); // get subtotales - esta listen resumen-pedido;
    this.router.navigate(['./pagar-cuenta'])
    .then(() => {
      if ( this.isBtnPagoShow ) {
        window.location.reload();
      }
    });
    // .then(() => {
    //   if ( this.isBtnPagoShow ) {
    //     window.location.reload();
    //   }
    // });

    // this.listenStatusService.setIsPagePagarCuentaShow(true);
  }


  // pedido delivery pagado con efectivo o yape
  private confirmarPedidoDeliveryEnviado() {
    this.router.navigate(['./pedido-confirmado']);
  }

  private goBackOutEstablecimiento() {
    const dialogConfig = new MatDialogConfig();
        dialogConfig.data = {idMjs: 2};

        const dialogReset = this.dialog.open(DialogResetComponent, dialogConfig);
        dialogReset.afterClosed().subscribe(result => {
          if (result ) {
            this.miPedidoService.resetAllNewPedido();
            this.miPedidoService.cerrarSession();

            this.isDeliveryValid = false; // formulario no valido para delivery
            // this.socketService.closeConnection();
            // this.navigatorService.cerrarSession();
            this.infoToken.cerrarSession();
          }
        });

  }

  goBackCarta(): void {
    this.navigatorService.setPageActive('carta');
  }

  private verificarConexionSocket() {
    if (!this.socketService.isSocketOpen) {
        this.socketService.connect();
    }
  }

  private savePedidoSocket(dataSend: any, isPagoConTarjeta: boolean, _subTotalesSave: any) {
    this.socketService.emitRes('nuevoPedido', JSON.stringify(dataSend)).subscribe(resSocket => {
        if ( resSocket === false ) {
          alert('!Ups a ocurrido un error, por favor verifique los datos y vuelve a intentarlo.');
          // guardamos el error
          const dataError = {
            elerror: resSocket,
            elorigen: 'resumen-pedido'
          };

          this.crudService.postFree(dataError, 'error', 'set-error', false)
          .subscribe(resp => console.log(resp));

          this.listenStatusService.setLoaderSendPedido(false);
          return;
        }

        setTimeout(() => {
          this.listenStatusService.setLoaderSendPedido(false);
          this.miPedidoService.stopTimerLimit();
          this.miPedidoService.prepareNewPedido();
        }, 600);


        const _res = resSocket[0];
        dataSend.dataPedido.idpedido = _res.idpedido;
        dataSend.dataPrint = _res.data[1] ? _res.data[1]?.print : null;

        this.newFomrConfirma();

        // hora del pedido
        this.estadoPedidoClientService.setHoraInitPedido(new Date().getTime());

        // si es delivery y el pago es en efectivo o en yape, notificamos transaccion conforme
        if ( this.isDeliveryCliente && !isPagoConTarjeta) {
          this.infoToken.setOrderDelivery(JSON.stringify(dataSend), JSON.stringify(_subTotalesSave));
          this.confirmarPedidoDeliveryEnviado();

          // this.pagarCuentaDeliveryCliente();
          // enviamos a pagar
          return;
        }

        if ( this.isReservaCliente ) {
          this.confirmarPedidoDeliveryEnviado();
          return;
        }



        this.backConfirmarPedido();
    });
  }


}
