import { Component, OnInit } from '@angular/core';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { PedidoModel } from 'src/app/modelos/pedido.model';

import { ReglascartaService } from 'src/app/shared/services/reglascarta.service';
import { ItemModel } from 'src/app/modelos/item.model';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogItemComponent } from './dialog-item/dialog-item.component';
import { SeccionModel } from 'src/app/modelos/seccion.model';
import { TipoConsumoModel } from 'src/app/modelos/tipoconsumo.model';
import { DialogResetComponent } from './dialog-reset/dialog-reset.component';

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

  rippleColor = 'rgb(255,238,88, 0.5)';
  constructor(
    private miPedidoService: MipedidoService,
    private reglasCartaService: ReglascartaService,
    private dialog: MatDialog,
    ) { }

  ngOnInit() {
    this._miPedido = this.miPedidoService.getMiPedido();

    this.reglasCartaService.loadReglasCarta().subscribe((res: any) => {
      this.rulesCarta = res.reglas || res[0].reglas;
      this.rulesSubtoTales = res.subtotales || res[0].subtotales;
      this.listenMiPedido();
    });
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
    if (this.isVisibleConfirmar) {
      this.isVisibleConfirmarAnimated = false;
      setTimeout(() => {
        this.isVisibleConfirmar = false;
      }, 300);
      return;
    }

    const dialogReset = this.dialog.open(DialogResetComponent);
    dialogReset.afterClosed().subscribe(result => {
      if (result ) {
        this.miPedidoService.resetAllNewPedido();
      }
    });
  }

  confirmarPeiddo() {
    this.isVisibleConfirmar = true;
    this.isVisibleConfirmarAnimated = true;
  }

}
