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
  isComercioAceptaPedidoProgramado = false;
  amPm = 'AM';
  imgComercio = '';

  @Input() itemEstablecimiento: DeliveryEstablecimiento;

  @Output() itemSelected = new EventEmitter<DeliveryEstablecimiento>();

  constructor() { }

  ngOnInit() {
    // console.log('this.itemEstablecimiento', this.itemEstablecimiento);
    this.isCerrado = this.itemEstablecimiento.cerrado === 1 ? true : false;
    this.isComercioAceptaPedidoProgramado = this.itemEstablecimiento.pwa_delivery_habilitar_pedido_programado === 1;
    this.amPm = this.itemEstablecimiento.hora_ini ? parseInt(this.itemEstablecimiento.hora_ini.split(':')[0], 0) > 12 ? 'PM' : 'AM' : '';
    this.imgComercio = URL_IMG_COMERCIO + this.itemEstablecimiento.pwa_delivery_img;
  }

  _itemSelected() {
    if ( this.isCerrado && !this.isComercioAceptaPedidoProgramado) {return; }
    this.itemSelected.emit(this.itemEstablecimiento);
  }

}
