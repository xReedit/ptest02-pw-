import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';
import { URL_IMG_PROMO } from 'src/app/shared/config/config.const';

@Component({
  selector: 'app-comp-view-promo',
  templateUrl: './comp-view-promo.component.html',
  styleUrls: ['./comp-view-promo.component.css']
})
export class CompViewPromoComponent implements OnInit {

  _listPromo: any;
  // itemEstablecimientoSeleted: DeliveryEstablecimiento;

  @Input()
  set list(val: any) {
    // if ( val.cerrado === 0 ) {
      this._listPromo = val;
    // }
    // console.log('listPromos', this._listPromo);
  }

  @Output() itemSelected = new EventEmitter<DeliveryEstablecimiento>();

  private urlRepoImg = URL_IMG_PROMO;
  // imgdemo = this.urlRepoImg + '/' + '1613promo50.png';
  imgdemo = this.urlRepoImg;

  constructor() { }

  ngOnInit(): void {
    // console.log('listPromos', this._listPromo);
  }

  _itemSelected(item: DeliveryEstablecimiento) {
    if ( item.cerrado === 1 && item.pwa_delivery_habilitar_pedido_programado !== 1) {return; }
    this.itemSelected.emit(item);
  }

}
