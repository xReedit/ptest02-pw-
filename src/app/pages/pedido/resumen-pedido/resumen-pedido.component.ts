import { Component, OnInit } from '@angular/core';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { PedidoModel } from 'src/app/modelos/pedido.model';

import { ReglascartaService } from 'src/app/shared/services/reglascarta.service';
import { ItemModel } from 'src/app/modelos/item.model';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogItemComponent } from './dialog-item/dialog-item.component';
import { SeccionModel } from 'src/app/modelos/seccion.model';

@Component({
  selector: 'app-resumen-pedido',
  templateUrl: './resumen-pedido.component.html',
  styleUrls: ['./resumen-pedido.component.css']
})
export class ResumenPedidoComponent implements OnInit {
  _miPedido: PedidoModel = new PedidoModel();
  _arrSubtotales: any = [];
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
      this.rulesCarta = res.reglas;
      this.rulesSubtoTales = res.subtotales;
      this.listenMiPedido();
    });
  }

  pintarMiPedido() {
    this.miPedidoService.validarReglasCarta(this.rulesCarta);
    this._arrSubtotales = this.miPedidoService.getArrSubTotales(this.rulesSubtoTales);
  }

  listenMiPedido() {
    this.miPedidoService.miPedidoObserver$.subscribe((res) => {
      this._miPedido = res;
      this.pintarMiPedido();
      console.log(this._miPedido);
    });
  }

  openDlgItem(_seccion: SeccionModel, _item: ItemModel) {
    const _itemInList = this.miPedidoService.findItemFromArr(this.miPedidoService.listItemsPedido, _item);
    const dialogConfig = new MatDialogConfig();

    dialogConfig.width = '450px';
    dialogConfig.data = {
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

}
