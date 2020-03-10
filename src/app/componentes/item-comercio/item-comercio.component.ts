import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';


@Component({
  selector: 'app-item-comercio',
  templateUrl: './item-comercio.component.html',
  styleUrls: ['./item-comercio.component.css']
})
export class ItemComercioComponent implements OnInit {

  @Input() itemEstablecimiento: DeliveryEstablecimiento;

  @Output() itemSelected = new EventEmitter<DeliveryEstablecimiento>();

  constructor() { }

  ngOnInit() {
  }

  _itemSelected() {
    this.itemSelected.emit(this.itemEstablecimiento);
  }

}
