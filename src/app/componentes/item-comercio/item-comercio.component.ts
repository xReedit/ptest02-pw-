import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';
import { URL_IMG_COMERCIO } from 'src/app/shared/config/config.const';


@Component({
  selector: 'app-item-comercio',
  templateUrl: './item-comercio.component.html',
  styleUrls: ['./item-comercio.component.css']
})
export class ItemComercioComponent implements OnInit {
  isCerrado = false;
  amPm = 'AM';
  imgComercio = '';

  @Input() itemEstablecimiento: DeliveryEstablecimiento;

  @Output() itemSelected = new EventEmitter<DeliveryEstablecimiento>();

  constructor() { }

  ngOnInit() {
    this.isCerrado = this.itemEstablecimiento.cerrado === 1 ? true : false;
    this.amPm = this.itemEstablecimiento.hora_ini ? parseInt(this.itemEstablecimiento.hora_ini.split(':')[0], 0) > 12 ? 'PM' : 'AM' : '';
    this.imgComercio = URL_IMG_COMERCIO + this.itemEstablecimiento.pwa_delivery_img;
  }

  _itemSelected() {
    if ( this.isCerrado ) {return; }
    this.itemSelected.emit(this.itemEstablecimiento);
  }

}
