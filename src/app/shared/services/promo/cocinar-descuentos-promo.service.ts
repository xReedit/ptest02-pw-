import { Injectable } from '@angular/core';
import { ItemModel } from 'src/app/modelos/item.model';
import { SubItemsView } from 'src/app/modelos/subitems.view.model';

@Injectable({
  providedIn: 'root'
})
export class CocinarDescuentosPromoService {

  constructor() { }


  aplicarDescuentoItem(i: ItemModel, _dsc: number) {
    const _pItem = parseFloat(i.precio);
    const precio_ahora = Math.round(_pItem - ( _pItem * ( _dsc / 100 )));
    i.precio_antes = i.precio;
    i.precio = precio_ahora.toString();
    i.precio_default = precio_ahora;
    i.precio_unitario = precio_ahora.toString();
    i.ispromo_aplica = true;
  }

  // cuando es 2x1 3x2 ....
  reviewPromoApplyItem(item: ItemModel, _precioTotal: number): number {
    // console.log('aplica promo', item);
    // this.resetPrecioDefaultItem(item);
    // let _precioTotal = item.precio_total;
    if ( !_precioTotal ) { return null; }
    if (item.ispromo) {
      const itemPromo = item.ispromo;
      let subItemPrecioUnitario = 0;

      // si el desct es al sub item
      if (itemPromo.iditem_subitem) {
        const itemSubItemSelected = item.subitems_selected.find(x => x.iditem_subitem === itemPromo.iditem_subitem);
        if ( !itemSubItemSelected || !item.subitems_view) { return _precioTotal; }

        subItemPrecioUnitario = parseFloat(itemSubItemSelected.precio.toString());
        // _precioTotal += totalSubItems;
      }

      if ( itemPromo.is_nxn === 1 ) {
        const numPor = parseInt(itemPromo.cantidad_x, 0);
        const numCant = parseInt(itemPromo.cantidad, 0);
        const difCant = numCant - numPor;
        const cantSeleccionada = item.cantidad_seleccionada;
        // cantSeleccionada += item.sumar ? 1 : 0;

        if ( cantSeleccionada >= numCant ) {
          // const isMultiplo = cantSeleccionada % numCant === 0;
          // if ( isMultiplo ) {
            const descPromo = parseFloat(itemPromo.porc_descuento);
            const cantDescontar = parseInt((cantSeleccionada / numCant).toString(), 0);
            const importeTotalDescuento = difCant * (cantDescontar * (parseFloat(item.precio_unitario) + subItemPrecioUnitario));
            let importeDescontar = importeTotalDescuento;
            importeDescontar = importeDescontar - (importeDescontar * ( descPromo / 100 ));
            importeDescontar = importeDescontar === 0 ? importeTotalDescuento : importeDescontar;
            _precioTotal = _precioTotal - importeDescontar;
          // }
          item.ispromo_aplica = true;
        } else {
          item.ispromo_aplica = false;
        }
      } else {
        item.ispromo_aplica = true;
      }
    }

    // item.ispromo_aplica = true;

    return _precioTotal;

  }

  resetPrecioDefaultItem(i: ItemModel) {
    const _pItem = parseFloat(i.precio);
    i.precio_antes = i.precio;
    i.precio = i.precio_antes.toString();
    i.precio_default = i.precio_antes;
    i.precio_unitario = i.precio_antes.toString();
  }
}
