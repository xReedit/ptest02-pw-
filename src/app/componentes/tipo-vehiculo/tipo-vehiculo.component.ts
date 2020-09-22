import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';

@Component({
  selector: 'app-tipo-vehiculo',
  templateUrl: './tipo-vehiculo.component.html',
  styleUrls: ['./tipo-vehiculo.component.css']
})
export class TipoVehiculoComponent implements OnInit {
  @Output() optionSelected = new EventEmitter();
  @Input() selectedFirst: boolean; // si selecciona el primero

  listVehiculo = null;
  itemSelected: any;

  constructor(
    private crudService: CrudHttpService
  ) { }

  ngOnInit(): void {
    // console.log('selectedFirst', this.selectedFirst);
    this.selectedFirst = this.selectedFirst ? this.selectedFirst : true;
    this.loadTipoVehiculo();
  }

  loadTipoVehiculo() {
    this.crudService.getAll('delivery', 'get-tipo-vehiculo', false, false, false)
    .subscribe((res: any) => {
      // console.log(res);
      this.listVehiculo = res.data;

      if ( this.selectedFirst ) {
        this.selectedItem(this.listVehiculo[0]);
      }
    });
  }

  selectedItem(item: any) {
    this.listVehiculo.map(x => x.selected = false);
    item.selected = true;
    this.itemSelected = item;
    this.optionSelected.emit(this.itemSelected);
  }

}

