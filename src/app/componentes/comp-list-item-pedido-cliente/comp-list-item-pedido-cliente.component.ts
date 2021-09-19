import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import { ItemModel } from 'src/app/modelos/item.model';
import { ItemTipoConsumoModel } from 'src/app/modelos/item.tipoconsumo.model';
import { PedidoModel } from 'src/app/modelos/pedido.model';
import { SeccionModel } from 'src/app/modelos/seccion.model';
import { TipoConsumoModel } from 'src/app/modelos/tipoconsumo.model';
import { PedidoModule } from 'src/app/pages/pedido/pedido.module';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';
import { ReglascartaService } from 'src/app/shared/services/reglascarta.service';
import { DialogItemEditComponent } from '../dialog-item-edit/dialog-item-edit.component';

@Component({
  selector: 'app-comp-list-item-pedido-cliente',
  templateUrl: './comp-list-item-pedido-cliente.component.html',
  styleUrls: ['./comp-list-item-pedido-cliente.component.css']
})
export class CompListItemPedidoClienteComponent implements OnInit, AfterViewInit {

  @Input() arrSubtotales: any;

  miPedido: PedidoModel = new PedidoModel();
  // private itemSelected: ItemModel;
  private objItemTipoConsumoSelected: ItemTipoConsumoModel[];
  private objNewItemTiposConsumo: ItemTipoConsumoModel[] = [];
  private destroy$: Subject<boolean> = new Subject<boolean>();
  item: ItemModel;


  isDeliveryCliente: boolean;
  constructor(
    private miPedidoService: MipedidoService,
    private infoToken: InfoTockenService,
    private dialog: MatDialog,
    private navigatorService: NavigatorLinkService
  ) { }

  ngOnInit(): void {
    this.isDeliveryCliente = this.infoToken.isDelivery();
    this.miPedido = this.miPedidoService.getMiPedido();
    // console.log('miPedido', this.miPedido);


    this.miPedidoService.miPedidoObserver$
    .pipe(takeUntil(this.destroy$))
    .subscribe((res) => {
      // this.miPedidoService.clearObjMiPedido(); // quita las cantidades 0
      // this._miPedido = this.miPedidoService.getMiPedido();
      this.miPedido = <PedidoModel>res;
      // this.pintarSubTotales();
      // console.log('miPedido', this.miPedido);
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      // const res = this.reglasCartaService.getObjReglasCarta();
      // console.log('this.arrSubtotales', this.arrSubtotales);

      // this.rulesCarta = res[0] ? res[0].reglas ? res[0].reglas : [] : res.reglas ? res.reglas : [];
      // this.rulesSubtoTales = res.subtotales || res[0].subtotales;
    }, 500);
  }


  resultCantItemMercado(_selectedItem: any, tpc: ItemTipoConsumoModel, _seccion: SeccionModel) {


    // solo para delivery
    this.objNewItemTiposConsumo = [];
    // console.log('tpc', tpc);
    // console.log('_selectedItem', _selectedItem);

    // const _tpc = <ItemTipoConsumoModel>{
    //   cantidad_seleccionada: tpc.cantidad_seleccionada,
    //   descripcion: tpc.descripcion,
    //   idtipo_consumo: tpc.idtipo_consumo,
    //   titulo: tpc.titulo
    // };

    // this.objNewItemTiposConsumo.push(_tpc);

    // const _itemFromCarta = this.miPedidoService.findItemCarta(_selectedItem);
    // this.objItemTipoConsumoSelected = _itemFromCarta.itemtiposconsumo;
    // _selectedItem.cantidad = this.getCantidadItemCarta(_selectedItem); // trae el stock del item carta
    // this.objItemTipoConsumoSelected = <ItemTipoConsumoModel[]>this.objItemTipoConsumoSelected;
    // // this.objNewItemTiposConsumo = _itemFromCarta.itemtiposconsumo;
    // // const tpcSelect = this.objNewItemTiposConsumo[0];
    // const tpcSelect = tpc;

    // this.miPedidoService.setObjSeccionSeleced(_seccion);
    // this.miPedidoService.setobjItemTipoConsumoSelected(this.objNewItemTiposConsumo);

    // const _isSuma = _selectedItem.isSuma_selected ? 0 : 1;

    // // console.log('_selectedItem carta', this.itemSelected);

    // _selectedItem.cantidad = _selectedItem.cantidad ? _selectedItem.cantidad : NaN;
    // _selectedItem.cantidad_seleccionada = _selectedItem.cantidad_selected;


    // this.miPedidoService.addItem2(tpcSelect, <ItemModel>_selectedItem, _isSuma);


    // 2
    const _itemFromCarta = this.miPedidoService.findItemCarta(_selectedItem);
    this.objItemTipoConsumoSelected = <ItemTipoConsumoModel[]>_itemFromCarta.itemtiposconsumo;

    this.miPedidoService.setObjSeccionSeleced(_seccion);
    this.miPedidoService.setobjItemTipoConsumoSelected(this.objItemTipoConsumoSelected);

    _selectedItem.itemtiposconsumo = this.objItemTipoConsumoSelected;


    const tpcSelect = this.objItemTipoConsumoSelected.filter(x => x.idtipo_consumo === tpc.idtipo_consumo)[0];
    const _isSuma = _selectedItem.isSuma_selected ? 0 : 1;

    _selectedItem.cantidad = _selectedItem.cantidad ? _selectedItem.cantidad : NaN;
    _itemFromCarta.cantidad = this.getCantidadItemCarta(_selectedItem);




    // tpcSelect = al de la carta = tpc seleccionado por
    // item = _itemFromCarta de la carta
    this.miPedidoService.addItem2(tpcSelect, _itemFromCarta, _isSuma);

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

  getCantidadItemCarta(item: any): number {
    return parseInt(this.miPedidoService.findItemCarta(item).cantidad.toString(), 0);
  }

  goBackCarta(): void {
    this.navigatorService.setPageActive('carta');
  }

}
