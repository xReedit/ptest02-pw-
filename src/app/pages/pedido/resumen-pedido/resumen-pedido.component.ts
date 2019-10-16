import { Component, OnInit, Input } from '@angular/core';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { PedidoModel } from 'src/app/modelos/pedido.model';

import { ReglascartaService } from 'src/app/shared/services/reglascarta.service';
import { ItemModel } from 'src/app/modelos/item.model';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogItemComponent } from './dialog-item/dialog-item.component';
import { SeccionModel } from 'src/app/modelos/seccion.model';
import { TipoConsumoModel } from 'src/app/modelos/tipoconsumo.model';
import { DialogResetComponent } from './dialog-reset/dialog-reset.component';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { JsonPrintService } from 'src/app/shared/services/json-print.service';
import { DialogLoadingComponent } from './dialog-loading/dialog-loading.component';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { FormValidRptModel } from 'src/app/modelos/from.valid.rpt.model';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { ItemTipoConsumoModel } from 'src/app/modelos/item.tipoconsumo.model';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';

@Component({
  selector: 'app-resumen-pedido',
  templateUrl: './resumen-pedido.component.html',
  styleUrls: ['./resumen-pedido.component.css']
})
export class ResumenPedidoComponent implements OnInit {


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

  arrReqFrm: FormValidRptModel;

  rippleColor = 'rgb(255,238,88, 0.5)';

  objCuenta: any = [];

  constructor(
    private miPedidoService: MipedidoService,
    private reglasCartaService: ReglascartaService,
    private navigatorService: NavigatorLinkService,
    private socketService: SocketService,
    private jsonPrintService: JsonPrintService,
    private infoToken: InfoTockenService,
    private crudService: CrudHttpService,
    private listenStatusService: ListenStatusService,
    private dialog: MatDialog,
    ) { }

  ngOnInit() {

    this._miPedido = this.miPedidoService.getMiPedido();

    this.reglasCartaService.loadReglasCarta().subscribe((res: any) => {
      this.rulesCarta = res.reglas || res[0].reglas;
      this.rulesSubtoTales = res.subtotales || res[0].subtotales;
      this.listenMiPedido();

      this.newFomrConfirma();

      // this.frmDelivery = new DatosDeliveryModel();
    });

    this.navigatorService.resNavigatorSourceObserve$.subscribe((res: any) => {
          if (res.pageActive === 'mipedido') {
            if (res.url.indexOf('confirma') > 0) {
              this.confirmarPeiddo();
            } else {
              this.backConfirmacion();
            }
          }
        });
  }

  private newFomrConfirma(): void {
    this.frmConfirma = {
      mesa: '',
      referencia: '',
      reserva: false,
      solo_llevar: false,
      delivery: false
    };
  }

  pintarMiPedido() {
    this.miPedidoService.validarReglasCarta(this.rulesCarta);
    this._arrSubtotales = this.miPedidoService.getArrSubTotales(this.rulesSubtoTales);
    this.hayItems = this._arrSubtotales[0].importe > 0 ? true : false;
  }

  listenMiPedido() {
    this.miPedidoService.miPedidoObserver$.subscribe((res) => {
      this._miPedido = res;
      this.pintarMiPedido();
      console.log(this._miPedido);
    });

    this.listenStatusService.hayCuentaBusqueda$.subscribe(res => {
      this.isHayCuentaBusqueda = res;
    });
  }

  openDlgItem(_tpc: TipoConsumoModel, _seccion: SeccionModel, _item: ItemModel) {
    const _idTpcItemResumenSelect = _tpc.idtipo_consumo;
    const _itemInList = this.miPedidoService.findItemFromArr(this.miPedidoService.listItemsPedido, _item);
    const dialogConfig = new MatDialogConfig();

    dialogConfig.width = '350px';
    dialogConfig.autoFocus = false;
    dialogConfig.data = {
      idTpcItemResumenSelect: _idTpcItemResumenSelect,
      seccion: _seccion,
      item: _item,
      objItemTipoConsumoSelected: _itemInList.itemtiposconsumo
    };

    const dialogRef = this.dialog.open(DialogItemComponent, dialogConfig);

    // subscribe al cierre y obtiene los datos
    dialogRef.afterClosed().subscribe(
        data => {
          if ( !data ) { return; }
          console.log('data dialog', data);
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

    const dialogReset = this.dialog.open(DialogResetComponent);
    dialogReset.afterClosed().subscribe(result => {
      if (result ) {
        this.miPedidoService.resetAllNewPedido();
        this.navigatorService.setPageActive('carta');
      }
    });

    this.newFomrConfirma();
  }

  private backConfirmacion(): void {
    this.navigatorService.addLink('mipedido');
    this.isVisibleConfirmarAnimated = false;
    this.isRequiereMesa = false;
    setTimeout(() => {
      this.isVisibleConfirmar = false;
    }, 300);
  }

  private confirmarPeiddo(): void {

    if (this.isVisibleConfirmarAnimated ) { // enviar pedido
      if (this.isRequiereMesa || !this.isDeliveryValid) { return; }
      this.prepararEnvio();
    } else {

      this.isVisibleConfirmar = true;
      this.isVisibleConfirmarAnimated = true;

      this.checkTiposDeConsumo();
      this.checkIsRequierMesa();
      this.checkIsDelivery();

      this.navigatorService.addLink('mipedido-confirma');
    }
  }

  private prepararEnvio(): void {
    const dialogLoading = this.dialog.open(DialogLoadingComponent);
    dialogLoading.afterClosed().subscribe(result => {
      this.enviarPedido();
    });
  }

  private enviarPedido(): void {
    // header //

    const _p_header = {
      m: this.frmConfirma.mesa ? this.frmConfirma.mesa.toString().padStart(2, '0') || '00' : '00',
      r: this.frmConfirma.referencia || '',
      nom_us: this.infoToken.getInfoUs().usuario,
      delivery: this.frmConfirma.delivery ? 1 : 0,
      reservar: this.frmConfirma.reserva ? 1 : 0,
      solo_llevar: this.frmConfirma.solo_llevar ? 1 : 0,
      idcategoria: localStorage.getItem('sys::cat'),
      correlativo_dia: '', // en backend
      num_pedido: '', // en backend
      arrDatosDelivery: this.frmDelivery
    };

    const dataPedido = {
      p_header: _p_header,
      p_body: this._miPedido,
      p_subtotales: this._arrSubtotales
    };

    console.log('nuevoPedido', dataPedido);
    console.log('nuevoPedido', JSON.stringify(dataPedido));


    // enviar a print_server_detalle // para imprimir
    const arrPrint = this.jsonPrintService.enviarMiPedido();
    const dataPrint: any = [];
    arrPrint.map((x: any) => {
      dataPrint.push({
        Array_enca: _p_header,
        ArraySubTotales: this._arrSubtotales,
        ArrayItem: x.arrBodyPrint,
        Array_print: x.arrPrinters
      });
    });

    const dataSend = {
      dataPedido: dataPedido,
      dataPrint: dataPrint
    };

    console.log('printerComanda', dataSend);
    console.log('printerComanda', JSON.stringify(dataSend));
    // this.socketService.emit('printerComanda', dataPrint);

    // enviar a guardar // guarda pedido e imprime comanda
    this.socketService.emit('nuevoPedido', dataSend);

    //
    // this.navigatorService.addLink('mipedido');
    // this.isVisibleConfirmarAnimated = false;
    // this.isRequiereMesa = false;
    // this.isVisibleConfirmar = false;
    //
    this.newFomrConfirma();
    this.backConfirmacion();

    this.miPedidoService.prepareNewPedido();
    this.navigatorService.setPageActive('carta');

  }

  private checkTiposDeConsumo(): void {
    this.arrReqFrm = <FormValidRptModel>this.miPedidoService.findEvaluateTPCMiPedido();
    this.isRequiereMesa = this.arrReqFrm.isRequiereMesa;
    this.frmConfirma.solo_llevar = this.arrReqFrm.isTpcSoloDelivery ? false : this.arrReqFrm.isTpcSoloLLevar;
    this.frmConfirma.delivery = this.arrReqFrm.isTpcSoloDelivery;
  }

  checkIsRequierMesa(): void {
    // const arrReqFrm = <FormValidRptModel>this.miPedidoService.findEvaluateTPCMiPedido();
    // const isTPCLocal = arrReqFrm.isTpcLocal;
    // this.isRequiereMesa = arrReqFrm.isRequiereMesa;

    const isMesaValid = this.frmConfirma.mesa ? this.frmConfirma.mesa !== '' ? true : false : false;
    this.isRequiereMesa = this.arrReqFrm.isRequiereMesa;

    // this.isRequiereMesa = isTPCLocal;
    this.isRequiereMesa = this.isRequiereMesa && (!isMesaValid && !this.frmConfirma.reserva);

  }

  private checkIsDelivery() {
    this.isDelivery = this.miPedidoService.findMiPedidoIsTPCDelivery();
    // this.frmConfirma.delivery = this.isDelivery;
  }

  checkDataDelivery($event: any) {
    this.isDeliveryValid = $event.formIsValid;
    this.frmDelivery = $event.formData;
  }

  xLoadCuentaMesa(mesa: string): void {
    this.isHayCuentaBusqueda = false;
    this.msjErr = false;
    this.numMesaCuenta = mesa;
    const datos = { mesa: mesa };
    console.log('mesa a buscar', datos);

    const _miPedidoCuenta: PedidoModel = new PedidoModel();
    const c_tiposConsumo: TipoConsumoModel[] = [];
    this.crudService.postFree(datos, 'pedido', 'lacuenta').subscribe((res: any) => {

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
      c_tiposConsumo.map((tp: TipoConsumoModel) => {
        res.data
          .filter((_tp: any) => _tp.idtipo_consumo === tp.idtipo_consumo)
          .map((_s: any, i) => {
            let haySeccion = tp.secciones.filter((s: SeccionModel) => s.idseccion = _s.idseccion)[0];
            if (!haySeccion) {
              haySeccion = new SeccionModel;
              haySeccion.idseccion = parseInt(_s.idseccion.toString(), 0);
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
          .filter((_tp: any) => _tp.idtipo_consumo === tp.idtipo_consumo && _tp.idseccion === s.idseccion)
          .map((_i: any, i) => {
            const hayItem = new ItemModel;
            hayItem.cantidad_seleccionada = _i.cantidad;
            hayItem.des = _i.descripcion;
            hayItem.des = _i.descripcion;
            hayItem.detalles = '';
            hayItem.iditem = _i.iditem;
            hayItem.idcarta_lista = _i.idcarta_lista;
            hayItem.idseccion = _i.idseccion;
            hayItem.isalmacen = _i.isalmacen;
            hayItem.precio = _i.punitario;
            hayItem.precio_print = _i.ptotal;
            hayItem.precio_total = _i.ptotal;
            hayItem.procede = _i.procede === '0' ? 1 : 0;
            hayItem.seccion = _i.des_seccion;
            s.count_items = i + 1;
            s.items.push(hayItem);
          });
        });
      });

      console.log('cuenta de mesa', res);
      console.log('c_tiposConsumo', c_tiposConsumo);

      _miPedidoCuenta.tipoconsumo = c_tiposConsumo;
      this.miPedidoService.setObjMiPedido(_miPedidoCuenta);
      this._miPedido = this.miPedidoService.getMiPedido();

      console.log('this._miPedido', this._miPedido);

    });
  }

}
