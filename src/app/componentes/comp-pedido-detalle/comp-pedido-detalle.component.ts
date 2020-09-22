import { Component, OnInit, Input } from '@angular/core';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';

@Component({
  selector: 'app-comp-pedido-detalle',
  templateUrl: './comp-pedido-detalle.component.html',
  styleUrls: ['./comp-pedido-detalle.component.css']
})
export class CompPedidoDetalleComponent implements OnInit {
  @Input() infoPedido: any;

  _miPedido: any;
  _arrSubtotales: any;
  constructor(
    private crudService: CrudHttpService,
    private miPedidoService: MipedidoService
  ) { }

  ngOnInit() {
    this.loadPedido();
  }

  private loadPedido() {
    const _data = {
      mesa: 0,
      idsede: this.infoPedido.idsede,
      idorg: this.infoPedido.idorg,
      idpedido: this.infoPedido.idpedido
    };

    this.crudService.postFree(_data, 'pedido', 'lacuenta-zona-delivery', false)
      .subscribe(res => {
        this._miPedido = this.miPedidoService.darFormatoPedido(res);

        // obtener subtotales bd
        this.crudService.postFree(_data, 'pedido', 'lacuenta-pedido-totales', false)
          .subscribe(arrTotal => {
            this._arrSubtotales = arrTotal.data;
          });
      });
  }

}
