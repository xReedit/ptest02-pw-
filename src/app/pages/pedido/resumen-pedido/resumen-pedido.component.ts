import { Component, OnInit } from '@angular/core';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { PedidoModel } from 'src/app/modelos/pedido.model';
import { TipoConsumoModel } from 'src/app/modelos/tipoconsumo.model';

@Component({
  selector: 'app-resumen-pedido',
  templateUrl: './resumen-pedido.component.html',
  styleUrls: ['./resumen-pedido.component.css']
})
export class ResumenPedidoComponent implements OnInit {
  _miPedido: PedidoModel;
  constructor(private miPedidoService: MipedidoService) { }

  ngOnInit() {
    this._miPedido = this.miPedidoService.getMiPedido();
    console.log(this._miPedido);
  }

  pintarMiPedido() {
    this._miPedido.tipoconsumo.map((tpc: TipoConsumoModel) => {

    });
  }

}
