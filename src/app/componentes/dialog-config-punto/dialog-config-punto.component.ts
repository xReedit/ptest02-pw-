import { Component, OnInit } from '@angular/core';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';

@Component({
  selector: 'app-dialog-config-punto',
  templateUrl: './dialog-config-punto.component.html',
  styleUrls: ['./dialog-config-punto.component.css']
})
export class DialogConfigPuntoComponent implements OnInit {

  listImpresoras: any;
  selectedValueImpresora: any;
  isPuntoAutoPedidoCheck: boolean;

  constructor(
    private crudService: CrudHttpService,
    private establecimientoService: EstablecimientoService,
  ) { }

  ngOnInit(): void {
    this.listImpresoras = this.establecimientoService.getImpresoras();
    console.log('this.listImpresoras', this.listImpresoras);
    // cargar impresoras disponibles

  }

  setConifg() {
    const dataStorage = {
      ispunto_autopedido: this.isPuntoAutoPedidoCheck,
      impresora: this.selectedValueImpresora
    };

    localStorage.setItem('sys::punto', JSON.stringify(dataStorage));

    console.log('dataStorage', dataStorage);
  }

}
