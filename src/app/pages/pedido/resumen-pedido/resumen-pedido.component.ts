import { Component, OnInit } from '@angular/core';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { PedidoModel } from 'src/app/modelos/pedido.model';
import { TipoConsumoModel } from 'src/app/modelos/tipoconsumo.model';
import { ReglascartaService } from 'src/app/shared/services/reglascarta.service';

@Component({
  selector: 'app-resumen-pedido',
  templateUrl: './resumen-pedido.component.html',
  styleUrls: ['./resumen-pedido.component.css']
})
export class ResumenPedidoComponent implements OnInit {
  _miPedido: PedidoModel = new PedidoModel();
  rulesCarta: any;
  rulesSubtoTales: any;
  constructor(
    private miPedidoService: MipedidoService,
    private reglasCartaService: ReglascartaService
    ) { }

  ngOnInit() {
    this._miPedido = this.miPedidoService.getMiPedido();

    this.reglasCartaService.loadReglasCarta().subscribe((res: any) => {
      this.rulesCarta = res.reglas;
      this.rulesSubtoTales = res.subtotales;
      this.listenMiPedido();
    });
  }

  pintarMiPedido() {
    this.miPedidoService.validarReglasCarta(this.rulesCarta);
    this.miPedidoService.getArrSubTotales(this.rulesSubtoTales);
  }

  listenMiPedido() {
    this.miPedidoService.miPedidoObserver$.subscribe((res) => {
      this._miPedido = res;
      this.pintarMiPedido();
      console.log(this._miPedido);
    });
  }

}
