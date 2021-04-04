import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';

@Component({
  selector: 'app-select-ciudad-delivery',
  templateUrl: './select-ciudad-delivery.component.html',
  styleUrls: ['./select-ciudad-delivery.component.css']
})
export class SelectCiudadDeliveryComponent implements OnInit {

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
      this.listCiudadesServicio = res.data;
    });
  }

  selectedCiudad(item: any) {
    this.cuidadSelected.emit(item);
  }

}
