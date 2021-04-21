import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';

@Component({
  selector: 'app-select-ciudad-delivery',
  templateUrl: './select-ciudad-delivery.component.html',
  styleUrls: ['./select-ciudad-delivery.component.css']
})
export class SelectCiudadDeliveryComponent implements OnInit {

  @Input() isOnlyReserva: boolean;
  @Output() cuidadSelected = new EventEmitter<any>();
  listCiudadesServicio: any;

  constructor(
    private crudService: CrudHttpService
  ) { }

  ngOnInit(): void {
    this.loadCiudades();
  }

  private loadCiudades() {
    this.crudService.getAll('delivery', 'get-ciudades-delivery', false, false, false)
    .subscribe((res: any) => {
      console.log('res', res);
      this.listCiudadesServicio = res.data;

      if ( this.isOnlyReserva ) {
        this.listCiudadesServicio = this.listCiudadesServicio.filter(s => s.isreserva === 1);
      }
    });
  }

  selectedCiudad(item: any) {
    this.cuidadSelected.emit(item);
  }

}
