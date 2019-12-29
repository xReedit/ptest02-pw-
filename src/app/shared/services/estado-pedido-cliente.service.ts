import { Injectable } from '@angular/core';
import { EstadoPedidoModel } from 'src/app/modelos/estado.pedido.model';
import { ListenStatusService } from './listen-status.service';
import { CrudHttpService } from './crud-http.service';
import { InfoTockenService } from './info-token.service';

@Injectable({
  providedIn: 'root'
})
export class EstadoPedidoClienteService {
  estadoPedido = new EstadoPedidoModel();

  constructor(
    private listenStatusService: ListenStatusService,
    private crudService: CrudHttpService,
    private infoTokenService: InfoTockenService
  ) { }

  get(): EstadoPedidoModel {
    return this.estadoPedido;
  }

  setEstado(val: number): void {
    this.estadoPedido.estado = val;
    this.notifyChange();
  }

  setImporte(val: number): void {
    this.estadoPedido.importe = val;
    this.notifyChange();
  }

  setTimeAprox(val: boolean): void {
    this.estadoPedido.isTiempoAproxCumplido = val;
    this.notifyChange();
  }

  // obtener el tiempo aproximado del pedido
  calcTimeAprox(): void {
    const _data = {
      idsede: this.infoTokenService.getInfoUs().idsede
    };
    this.crudService.postFree(_data, 'pedido', 'calc-time-despacho', false).subscribe( (res: any) => {
      // console.log('calc time despacho', res);
      this.estadoPedido.numMinAprox = res.data[0].rpt;
      this.estadoPedido.horaInt = new Date().getTime().toString();
      this.estadoPedido.isTiempoAproxCumplido = false;

      console.log('this.estadoPedido', this.estadoPedido);
    });
  }

  private notifyChange(): void {
    this.listenStatusService.setEstadoPedido(this.estadoPedido);
  }
}
