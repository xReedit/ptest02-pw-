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
  rulesCarta: any;
  rulesSubtoTales: any;

  isReserva = false;
  isRequiereMesa = false;
  isDelivery = false;
  isDeliveryValid = false;
  frmConfirma: any = {};
  frmDelivery: any = {};

  rippleColor = 'rgb(255,238,88, 0.5)';

  constructor(
    private miPedidoService: MipedidoService,
    private reglasCartaService: ReglascartaService,
    private navigatorService: NavigatorLinkService,
    private socketService: SocketService,
    private jsonPrintService: JsonPrintService,
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
      m: this.frmConfirma.mesa.toString().padStart(2, '0') || '00',
      r: this.frmConfirma.referencia || '',
      nom_us: '',
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

  private checkIsRequierMesa(): void {
    const isTPCLocal = this.miPedidoService.findMiPedidoIsTPCLocal();
    const isMesaValid = this.frmConfirma.mesa ? this.frmConfirma.mesa !== '' ? true : false : false;
    this.isRequiereMesa = isTPCLocal;
    this.isRequiereMesa = !isMesaValid && !this.frmConfirma.reserva;
  }

  private checkIsDelivery() {
    this.isDelivery = this.miPedidoService.findMiPedidoIsTPCDelivery();
    this.frmConfirma.delivery = this.isDelivery;
  }

  checkDataDelivery($event: any) {
    this.isDeliveryValid = $event.formIsValid;
    this.frmDelivery = $event.formData;
  }

}
