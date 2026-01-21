import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';



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
    private infoToken: InfoTockenService
  ) { }

  ngOnInit(): void {
    this.loadMarcas();
  }

  loadMarcas() {
    const holding = this.infoToken.getHolding();
    if (!holding || !holding.idsede_holding) {
      console.error('No se encontró información de holding');
      return;
    }

    const dataSend = {
      idsede_holding: holding.idsede_holding
    }

    this.crudService.postFree(dataSend, 'holding', 'get-marcas', false)
    .subscribe((res: any) => {
      console.log('Marcas cargadas:', res);
      this.marcas = res.data;
    });
  }

  onMarcaSelected(marca: any): void {
    console.log('Marca seleccionada:', marca);    
    this.marcaSelected.emit(marca);
  }

}
