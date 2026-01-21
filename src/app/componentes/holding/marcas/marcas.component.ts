import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';



@Component({
  selector: 'app-holding-marcas',
  templateUrl: './marcas.component.html',
  styleUrls: ['./marcas.component.css']
})

export class HoldingMarcasComponent {  

  marcas: any[] = [];
  @Output() marcaSelected = new EventEmitter<any>();

  constructor(
    private crudService: CrudHttpService,
  ) { }

  ngOnInit(): void {
    this.loadMarcas();
  }

  loadMarcas() {
    const dataSend = {
      idsede_holding: 6
    }

    this.crudService.postFree(dataSend, 'holding', 'get-marcas', false)
    .subscribe((res: any) => {
      console.log(res);
      this.marcas = res.data;
    });
  }

  onMarcaSelected(marca: any): void {
    console.log('Marca seleccionada:', marca);    
    this.marcaSelected.emit(marca);
  }

}
