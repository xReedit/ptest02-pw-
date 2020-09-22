import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-comp-op-costo-estimado',
  templateUrl: './comp-op-costo-estimado.component.html',
  styleUrls: ['./comp-op-costo-estimado.component.css']
})
export class CompOpCostoEstimadoComponent implements OnInit {

  @Output() optionSelected = new EventEmitter();
  listOpciones;
  itemSelected: any;
  constructor() { }

  ngOnInit(): void {
    this.loadOpaciones();
  }

  private loadOpaciones() {
    this.listOpciones = [];
    this.listOpciones.push({id: 0, value: 20, showImporte: 'S/. 25.00', descripcion: 'Menos que', selected: false});
    this.listOpciones.push({id: 1, value: 50, showImporte: 'S/. 50.00', descripcion: 'Menos o igual que', selected: false});
    this.listOpciones.push({id: 2, value: 100, showImporte: 'S/. 70.00', descripcion: 'Más que', selected: false});

  }

  selectedItem(item: any) {
    this.listOpciones.map(x => x.selected = false);
    item.selected = true;
    this.itemSelected = item;
    this.optionSelected.emit(this.itemSelected);
  }

}
