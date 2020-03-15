import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';


@Component({
  selector: 'app-item-comercio',
  templateUrl: './item-comercio.component.html',
  styleUrls: ['./item-comercio.component.css']
})
export class ItemComercioComponent implements OnInit {
  isCerrado = false;

  @Input() itemEstablecimiento: DeliveryEstablecimiento;

  @Output() itemSelected = new EventEmitter<DeliveryEstablecimiento>();

  constructor() { }

  ngOnInit() {
    this.isCerrado = this.itemEstablecimiento.cierrado === 1 ? true : false;
  }

  _itemSelected() {
    this.itemSelected.emit(this.itemEstablecimiento);
  }

}
