import { Injectable } from '@angular/core';
import { CategoriaModel } from 'src/app/modelos/categoria.model';
import { ItemModel } from 'src/app/modelos/item.model';
import { MipedidoService } from '../mipedido.service';
import { SocketService } from '../socket.service';
import { CocinarDescuentosPromoService } from './cocinar-descuentos-promo.service';

@Injectable({
  providedIn: 'root'
})
export class CocinarPromoShowService {

  private carta: any;
  private listPromos: any;

  constructor(
    private pedidoService: MipedidoService,
    private socketService: SocketService,
    private cocinarDescuentosPromoService: CocinarDescuentosPromoService
  ) {
  }

  iniReloadOpenPromo(_listPromos: any) {

    this.listPromos = _listPromos;
    this.socketService.emit('date-now-info', null);
    setInterval(() => {
      this.socketService.emit('date-now-info', null);
    }, 15000);


    this.socketService.onGetInfoDateNow()
    .subscribe((resDateNow: any) => {
       const dateNow = new Date(resDateNow);
       this.listPromos.map(p => {
         this.consultarPromoAbierto(p, dateNow);
       });
    });

  }

  promoFilterShow(promo: any, categoria: CategoriaModel): ItemModel[] {
    const _itemsShow = [];
    this.carta = this.pedidoService.getObjCarta();
    // console.log('this.carta', this.carta);

    if (promo.items) {

      promo.lista.map(item => {
        if ( !item.iditem ) { return; }
        const idItem = item.iditem.toString();
        const porc_descuento =  parseFloat(item.porc_descuento);
        const _item = categoria.secciones.map(s => s.items.find(i => i.iditem.toString() === idItem)).find(x => x);
        // console.log('item promo', item);
        // const _items = categoria.secciones.find(s => s.idseccion.toString() === idItem);
        if ( _item ) {
            const __item = {... _item};
            __item.ispromo = item;
            if ( !item.cantidad_x ) {
              this.cocinarDescuentosPromoService.aplicarDescuentoItem(__item, porc_descuento);
            }
            _itemsShow.push(__item);
        }
      });

    }

    if (promo.productos) {

      promo.lista.map(item => {
        if ( !item.idproducto_stock ) { return; }
        const idItem = item.idproducto_stock.toString();
        const porc_descuento =  parseFloat(item.porc_descuento);
        const _item = this.carta.bodega.map(s => s.items.find(i => i.idcarta_lista.toString() === idItem)).find(x => x);
        // const _items = categoria.secciones.find(s => s.idseccion.toString() === idItem);
        if ( _item ) {
            const __item = {... _item};
            __item.ispromo = item;
            if ( !item.cantidad_x ) {
              this.cocinarDescuentosPromoService.aplicarDescuentoItem(__item, porc_descuento);
            }
            _itemsShow.push(__item);
        }
      });

    }

    if (promo.secciones) {

      promo.lista.map(sec => {
        const idSeccion = sec.idseccion.toString();
        const porc_descuento =  parseFloat(sec.porc_descuento);
        const _items = categoria.secciones.find(s => s.idseccion.toString() === idSeccion);
        if ( _items ) {
          _items.items.map((i: ItemModel) => {
            const __item = {... i};
            __item.ispromo = sec;
            this.cocinarDescuentosPromoService.aplicarDescuentoItem(__item, porc_descuento);
            _itemsShow.push(__item);
          });
        }
      });

    }


    return _itemsShow;
  }

  getImportePedido(): number {
    return this.pedidoService.getSubTotalMiPedido();
  }



  private consultarPromoAbierto(promo: any, dateNow: Date) {
    // consulto hora y dia, si son correcto, pregunto a la bd
      // d = new Date(resDate);
      // console.log('dateNow.toLocaleTimeString()', dateNow.toLocaleTimeString());
      const day = dateNow.getDay();
      const isDayValid = promo.parametros.body.dias_semana.indexOf(day) > -1;

      // verificar hora
      let isHoursValid = false;
      const dIni = new Date();
      const dFin = new Date();
      const horaIni = promo.parametros.body.h_inicio.split(':');
      const horaFin = promo.parametros.body.h_fin.split(':');
      dIni.setHours(parseFloat(horaIni[0]));
      dIni.setMinutes(parseFloat(horaIni[1]));

      dFin.setHours(parseFloat(horaFin[0]));
      dFin.setMinutes(parseFloat(horaFin[1]));

      // const h = d.getHours();
      // const m = d.getMinutes();
      // // const time = h + ':' + m;

      // isHoursValid = h >= parseFloat(horaIni[0]) && m >= parseFloat(horaIni[1]) ? true : false;
      // isHoursValid = h <= parseFloat(horaFin[0]) && m >= parseFloat(horaFin[1]) ? true : false;

      // isHoursValid = dateNow.getTime() <= dFin.getTime();
      isHoursValid = dateNow.getTime() >= dIni.getTime() && dateNow.getTime() <= dFin.getTime();
      promo.abierto = isDayValid && isHoursValid ? 1 : 0;

      // console.log('promo abierto', promo);
      // return isDayValid && isHoursValid;

  }

  showDiasSemana(numdias: string): string {
    const _listDD = numdias.split(',').filter(x => x !== '');
    if ( _listDD.length === 7 ) { return 'Todos los dias'; }

    let _dias = '';
    _listDD.map(d => {
      _dias += this.getDiasByNum(parseInt(d, 0)) + ', ';
    });

    _dias = _dias.slice(0, -2);

    return _dias;
  }

  private getDiasByNum(num: number): string {
    // if ( !num ) {return ''; }
    const _days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    return _days[num];
  }

  // private aplicarDescuentoItem(i: ItemModel, _dsc: number) {
  //   const _pItem = parseFloat(i.precio);
  //   const precio_ahora = Math.round(_pItem - ( _pItem * ( _dsc / 100 )));
  //   i.precio_antes = i.precio;
  //   i.precio = precio_ahora.toString();
  //   i.precio_default = precio_ahora;
  //   i.precio_unitario = precio_ahora.toString();
  // }

  private addZero(i: any) {
    if (i < 10) {i = `0${i}`; }
    return i;
  }
}
