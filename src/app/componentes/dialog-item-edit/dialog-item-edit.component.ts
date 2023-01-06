import { Component, OnInit, Inject, ViewEncapsulation, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { ItemModel } from 'src/app/modelos/item.model';
import { ItemTipoConsumoModel } from 'src/app/modelos/item.tipoconsumo.model';
import { SubItem } from 'src/app/modelos/subitems.model';
import { SubItemContent } from 'src/app/modelos/subitem.content.model';
import { SubItemsView } from 'src/app/modelos/subitems.view.model';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/internal/operators';
import { URL_IMG_CARTA } from 'src/app/shared/config/config.const';
import { UtilitariosService } from 'src/app/shared/services/utilitarios.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
// import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
// import { type } from 'os';
import { SocketService } from 'src/app/shared/services/socket.service';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';

@Component({
  selector: 'app-dialog-item-edit',
  templateUrl: './dialog-item-edit.component.html',
  styleUrls: ['./dialog-item-edit.component.css'],
})
export class DialogItemEditComponent implements OnInit, OnDestroy {

  idTpcItemResumenSelect: number;
  item: ItemModel;
  objItemTipoConsumoSelected: ItemTipoConsumoModel[];
  _subitems_selected = []; // subitems chequeados
  isOptionRequeridosComplet = true; // si todos los cheks requeridos estan marcados
  precioProducto: number;
  _precioProductoIni: number; // precio incio
  isObjSubItems = true; // si el item tiene subitems
  isUsCliente = true; // si el usario es cliente o es personal autorizado

  isOneTipoConsumo = false; // s si solo hay un tipo de consumo sale enves del boton continuar

  url_img = URL_IMG_CARTA;

  isWaitBtnMenos = false;

  private destroyDlg$: Subject<boolean> = new Subject<boolean>();
  private isFirstOpen = true; // controla los observables // el observable de cantidad no se ejecuta en la primera interaccion

  simbolo_moneda: string;

  constructor(
    public miPedidoService: MipedidoService,
    private uttilService: UtilitariosService,
    private infoToken: InfoTockenService,
    private dialogRef: MatDialogRef<DialogItemEditComponent>,
    //  private crudService: CrudHttpService,
    private socketService: SocketService,
    @Inject(MAT_DIALOG_DATA) data: any,
    private establecimientoService: EstablecimientoService
  ) {

    // this.idTpcItemResumenSelect = data.idTpcItemResumenSelect;
    // clear subitem cantidad
    this.clearSubItemOpcionesCtrlCant(data.item);

    this.item = data.item;
    this.item.cantidad = this.getCantidadItemCarta(); // trae el stock del item carta
    this.objItemTipoConsumoSelected = <ItemTipoConsumoModel[]>data.objItemTipoConsumoSelected;

    // console.log('set this.objItemTipoConsumoSelected', this.objItemTipoConsumoSelected);

    this.miPedidoService.setObjSeccionSeleced(data.seccion);
    this.miPedidoService.setobjItemTipoConsumoSelected(this.objItemTipoConsumoSelected);



    this.isOneTipoConsumo = this.objItemTipoConsumoSelected.length === 1;
    this.item.detalles = this.primerMayuscula(this.item.detalles);

    // this.miPedidoService.listenChangeCantItem();

    // console.log('this.item', this.item);

  }

  ngOnInit() {

    this.isUsCliente = this.infoToken.getInfoUs().isCliente;

    // listen cambios en el stock
    this.miPedidoService.itemStockChangeObserve$
    .pipe(takeUntil(this.destroyDlg$))
    .subscribe((res: ItemModel) => {
      // para que la ultima cantidad modificada
      if ( this.isFirstOpen ) {this.isFirstOpen = false; return; }

      if ( this.item.iditem === res.iditem ) {
        this.item.cantidad = res.cantidad;
      }
    });

    this.item.subitems_selected = null;
    this.item.subitems_view = null;

    // this.cocinarListSubItemsView();
    this.getSubItemsItemSelect(this.item);

    // this.compItemSumImporte();
    // this.item.subitems.map((sub: SubItem) => sub.selected = false);

    this.simbolo_moneda = this.establecimientoService.getSimboloMoneda();

  }

  ngOnDestroy(): void {
    this.destroyDlg$.next(true);
    this.destroyDlg$.unsubscribe();
  }

  // reset control cantidad
  clearSubItemOpcionesCtrlCant(_item: any) {
    if ( !_item.cantidad_seleccionada || _item?.cantidad_seleccionada === 0) {
      if ( !_item.subitems ||  _item.subitems == '0') { return; }
      _item.subitems.map((i: any) => {
        if ( i.show_cant_item === 1 ) {
          i.opciones.map((o: any) => {
            if ( o?.cantidad_selected > 0) {
              o.des = o.desIni;
              o.precio = o.precio_first.toFixed(2);
              o.cantidad_selected = 0;
              o.stop_add = false;
            }
          });
        }
      });
    }
  }

  shoFirstChartUpperOptions(_item: any) {
    if ( !_item.subitems ) { return; }
      _item.subitems.map((i: any) => {
          i.opciones.map((o: any) => {
            o.des = this.uttilService.primeraConMayusculas(o.des.toLowerCase());
          });
      });
  }

  getCantidadItemCarta(): number {
    return parseInt(this.miPedidoService.findItemCarta(this.item).cantidad.toString(), 0);
  }

  // get subitems item seleccionado

  getSubItemsItemSelect( elItem: ItemModel ): any {
    // si de bodega no lleva subitems
    if ( elItem.procede === 0 ) {
      this.isObjSubItems = false;
      this.isOptionRequeridosComplet = true;
      return; }

    // verificamos si ya buscamos los subitems de este item
    if ( !elItem.is_search_subitems ) {
      // buscamos
      // const _dataIdItem = {
      //   iditem: elItem.iditem
      // };


      // this.crudService.postFree(_dataIdItem, 'pedido', 'search-subitems-del-item', false).subscribe((res: any) => {
      this.socketService.emitRes('search-subitems-del-item', elItem.iditem).subscribe((res: any) => {
        // console.log('res subitems', res);
        let _resSubItems = res[0].respuesta;
        _resSubItems = typeof _resSubItems === 'string' ? JSON.parse(_resSubItems) : null;

        elItem.subitems = _resSubItems;
        elItem.is_search_subitems = true;

        this.shoFirstChartUpperOptions(elItem);
        this.cocinarListSubItemsView();
        this.compItemSumImporte();
      });
    } else {
      this.shoFirstChartUpperOptions(elItem);
      this.cocinarListSubItemsView();
      this.compItemSumImporte();
    }

  }

  // get subitems item seleccionado

  private cocinarListSubItemsView(): void {

    // console.log('subitems');

    if ( this.item.subitems && this.item.subitems.length > 0) {
      this.item.subitems.map( (z: SubItemContent) => {
            z.isSoloUno = z.subitem_cant_select_ini === 1 ? true : false;
            z.isObligatorio = z.subitem_required_select === 1 ? true : false;
            // z.subitem_cant_select_ini = z.subitem_cant_select;
            z.subitem_cant_select = z.subitem_cant_select === 0 ? z.opciones.length : z.subitem_cant_select;
            z.des_cant_select = z.isSoloUno ?  `Solo 1` : `Hasta ${z.subitem_cant_select}`;
            z.des_cant_select = z.show_cant_item === 1 && z.subitem_cant_select_ini === 0 ? 'Seleccione' : z.des_cant_select;
            // z.isRequeridComplet = !z.isObligatorio ? true : false;

            z.opciones.map((x: SubItem) => {
                x.iditem_subitem = x.iditem_subitem;
                x.precio_visible = x.precio === 0 ? false : true;
                x.precio = x.precio_visible ? x.precio : 0;
                x.cantidad_visible = isNaN(parseFloat(x.cantidad)) ? false : true;
                // x.disabled = x.cantidad <= 0 ? true : false;
                // x.classAgotado = x.cantidad <= 0 ? 'agotado' : '';
                x.selected = false;
            });
        });

        this.isObjSubItems = true;
        this.item.indicaciones = '';
        this.checkOptionObligario();
    } else {
      this.isObjSubItems = false;
      this.isOptionRequeridosComplet = true;
    }
  }

  addSubItemCtrlCantidad(subitemContent: SubItemContent, subItemCant: any) {
    subItemCant.selected = subItemCant.cantidad_selected > 0;
    if ( subItemCant.cantidad_selected === 1 ) {
      if ( parseFloat(subItemCant.precio) > subItemCant.precio_first ) {
        subItemCant.precio_first = subItemCant.precio_first;
      } else {
        subItemCant.desIni = subItemCant.precio_first !== 0 ? subItemCant.des : subItemCant.desIni;
        subItemCant.precio_first = parseFloat(subItemCant.precio);
      }
    }

    // subItemCant.precio_first = subItemCant.cantidad_selected === 1 ? parseFloat(subItemCant.precio) > subItemCant.precio_first ? subItemCant.precio_first : parseFloat(subItemCant.precio) : subItemCant.precio_first;

    if ( subItemCant.cantidad_selected > 1 ) {
      subItemCant.precio = subItemCant.isSuma_selected ? parseFloat(subItemCant.precio) + parseFloat(subItemCant.precio_first) : parseFloat(subItemCant.precio) - parseFloat(subItemCant.precio_first);
    } else {
      subItemCant.precio = subItemCant.precio_first;
    }

    subItemCant.des = subItemCant.cantidad_selected > 0 ? `${subItemCant.cantidad_selected} ${subItemCant.desIni}` : subItemCant.desIni;


    subItemCant.precio = subItemCant.precio.toFixed(2);

    // stop add
    if ( subitemContent.subitem_cant_select_ini ===  0 ) {
      subItemCant.stop_add = false;
    } else {
      const _cantOpciones = subitemContent.opciones.map((x: any) => x.cantidad_selected || 0).reduce((a, b) => a + b, 0);
      const isStopAdd = subitemContent.subitem_cant_select === _cantOpciones;
      subitemContent.opciones.map((x: any) => x.stop_add = isStopAdd);

    }

    // console.log('subItemCant', subItemCant);

    this.addSubItem( subitemContent, subItemCant);
  }

  addSubItem(subitemContent: SubItemContent, subitem: SubItem): void {
    // chequeamos cuantos subitem estan checkes
    // console.log('aadd subitem', subitem);
    // console.log('aadd subitemContent', subitemContent);
    let listSubItemChecked = subitemContent.opciones.filter((x: SubItem) => x.selected);
    let countSelectReq = listSubItemChecked.length;

    listSubItemChecked.map( (_subItem: SubItem, i: number) =>  {
      if (countSelectReq > subitemContent.subitem_cant_select && _subItem !== subitem) {
        _subItem.selected = false;
        countSelectReq--;
      }
    });

    // total de cheks chekeados
    listSubItemChecked = subitemContent.opciones.filter((x: SubItem) => x.selected);
    const countOptionsCheks = listSubItemChecked.length;
    // quita el obligatorio
    if ( subitemContent.subitem_required_select === 1 ) {
      if ( subitemContent.show_cant_item === 1 ) {
        const _cantOptionsSelcted = subitemContent.opciones.map((x: any) => x.cantidad_selected || 0).reduce((a, b) => a + b, 0 );
        subitemContent.isObligatorio = _cantOptionsSelcted === subitemContent.subitem_cant_select ? false : true;
      } else {
        subitemContent.isObligatorio = countOptionsCheks === subitemContent.subitem_cant_select ? false : true;
      }
    }

    // agrega las opciones seleccionadas al subitems_selected del item;
    this._subitems_selected = [];
    this.item.subitems.map((sc: SubItemContent) => {
      sc.opciones.filter((s: SubItem) => s.selected)
                .map((s: SubItem) => {
                  this._subitems_selected.push(s);
                });
    });

    this.item.subitems_selected = this._subitems_selected;

    this.checkOptionObligario();
    this.compItemSumImporte(true);
}

  // chequea si todas las opciones requeridas ya estan marcadas
  private checkOptionObligario(): void {
      let countOptionReq = 0;

      if ( !this.item.subitems || this.item.subitems === null ) { this.isOptionRequeridosComplet = true; return; }

      this.item.subitems.map(t => {
          countOptionReq = t.isObligatorio ? + 1 : countOptionReq;
      });

      this.isOptionRequeridosComplet = countOptionReq === 0 ?  true : false;
  }

  private compItemSumImporte(fromToCheck = false): void {
    if ( fromToCheck ) {
        let _importeChecks = 0;
        this.item.subitems.map(t => {
            t.opciones.filter(o => o.selected).map(o => {
                _importeChecks += parseFloat(o.precio.toString());
            });
        });

        this.precioProducto = this._precioProductoIni + _importeChecks;
    } else {
        // si viene del btn add +
        this.precioProducto = this.getImporteTotalItem();
        this._precioProductoIni = this.precioProducto;
    }
  }

  private getImporteTotalItem(): number {
    let rpt = 0;
    rpt = this.miPedidoService.getImporteTotalItemFromMiPedido(this.item);
    rpt = rpt === 0 ? parseFloat(this.item.precio) : rpt;
    return rpt;
  }

  addItemToDialogItem(tpcSelect: ItemTipoConsumoModel, suma: number): void {

    let paseCantSuItem = true;
    this.item.subitems_selected = this._subitems_selected;

    // agrega tipo de consumo para identificar y no sumar de otro tpc
    this.item.subitems_selected.map(subi => subi.idtipo_consumo = tpcSelect.idtipo_consumo);

    // ver si selecciono subitems y si ese subitem tiene stock disponible
    this.item.subitems_selected.map((t: SubItem) => {
      if (t.cantidad !== 'ND') {
        if ( parseFloat(t.cantidad.toString()) === 0 ) {
          paseCantSuItem = false;
          return;
        }
      }
    });

    if ( !paseCantSuItem ) {return; }
    // ver si selecciono subitems y si ese subitem tiene stock disponible

    this.miPedidoService.addItem2(tpcSelect, this.item, suma);

    tpcSelect.animar_cantidad = true;
    setTimeout(() => {
      tpcSelect.animar_cantidad = false;
    }, 500);

    this.compItemSumImporte();
    // this.item.indicaciones = this.isObjSubItems ? '' : this.item.indicaciones;

  }

  setIndicaciones(val: string): void {
    this.item.indicaciones = this.uttilService.addslashes(val);
    // this.item.indicaciones = val;

    let isItemSubISelected = false;
    if ( this.isObjSubItems ) {
      isItemSubISelected = this.item.subitems_selected?.length > 0;
    }

    // agrega las indicaciones si existe en mipedido y si no tienen subitems
    const _itemFromPedido = this.miPedidoService.findOnlyItemMiPedido(this.item);
    if (_itemFromPedido && !this.isObjSubItems) {
      _itemFromPedido.indicaciones = val;
    }

    if ( _itemFromPedido && !isItemSubISelected ) {
      _itemFromPedido.indicaciones = val;
    }

    this.miPedidoService.setLocalStoragePedido();
  }


  getEstadoStockItem(stock: any): string {
    if ( stock === 'ND' || isNaN(stock) ) {
      // stock = 'ND';
      return 'verde';
    } else {
      const _stock = parseInt(stock, 0);
      return _stock > 10 ? 'verde' : _stock > 5 ? 'amarillo' : 'rojo';
    }
  }

  cerrarDlg(): void {
    this.dialogRef.close();
  }

  primerMayuscula(val: string): string {
    return this.uttilService.primeraConMayusculas(val);
  }



}
