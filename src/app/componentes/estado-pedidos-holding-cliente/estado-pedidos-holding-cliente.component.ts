import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { HoldingService } from 'src/app/shared/services/holding.service';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';

interface PedidoMarca {
  idmarca: number;
  nom_marca: string;
  importe: number;
  cantidad_items: number;
  pedidos: any[];
}

@Component({
  selector: 'app-estado-pedidos-holding-cliente',
  templateUrl: './estado-pedidos-holding-cliente.component.html',
  styleUrls: ['./estado-pedidos-holding-cliente.component.css']
})
export class EstadoPedidosHoldingClienteComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<boolean>();
  
  pedidosPorMarca: PedidoMarca[] = [];
  mostrarTodos = true;
  marcaSeleccionada: PedidoMarca | null = null;
  isLoading = false;
  simboloMoneda = 'S/';
  rippleColor = 'rgb(255,238,88, 0.5)';
  
  isViewMsjSolicitudPersonal = false;
  infoToken: any;

  constructor(
    private infoTokenService: InfoTockenService,
    private holdingService: HoldingService,
    private navigatorService: NavigatorLinkService,
    private socketService: SocketService,
    private establecimientoService: EstablecimientoService,
    private miPedidoService: MipedidoService
  ) { }

  ngOnInit(): void {
    this.infoToken = this.infoTokenService.getInfoUs();
    this.simboloMoneda = this.establecimientoService.getSimboloMoneda() || 'S/';
    
    this.navigatorService.resNavigatorSourceObserve$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        if (res.pageActive === 'estado') {
          this.cargarPedidosCliente();
        }
      });

    this.socketService.onGetNuevoPedido()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cargarPedidosCliente();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  cargarPedidosCliente(): void {
    this.isLoading = true;
    const idcliente = this.infoToken.idcliente;
    const holdingData = this.infoTokenService.getHolding();
    
    if (!idcliente || !holdingData) {
      this.isLoading = false;
      return;
    }

    this.holdingService.obtenerPedidosClienteHolding(idcliente, holdingData.idsede_holding)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (res: any) => {
          this.isLoading = false;
          if (res.success && res.data) {
            this.procesarPedidos(res.data);
          }
        },
        (error) => {
          console.error('Error cargando pedidos:', error);
          this.isLoading = false;
        }
      );
  }

  private procesarPedidos(pedidos: any[]): void {
    const marcasMap = new Map<number, PedidoMarca>();

    pedidos.forEach(pedido => {
      const items = JSON.parse(pedido.pedido_json || '{}');
      const body = items.dataPedido?.p_body || {};
      
      Object.keys(body).forEach(key => {
        const seccion = body[key];
        if (seccion.items) {
          Object.keys(seccion.items).forEach(itemKey => {
            const item = seccion.items[itemKey];
            const idmarca = item.idmarca || 0;
            const nomMarca = item.nom_marca || 'Sin marca';
            
            if (!marcasMap.has(idmarca)) {
              marcasMap.set(idmarca, {
                idmarca: idmarca,
                nom_marca: nomMarca,
                importe: 0,
                cantidad_items: 0,
                pedidos: []
              });
            }
            
            const marca = marcasMap.get(idmarca)!;
            marca.cantidad_items += item.cantidad_seleccionada || 0;
            marca.importe += (item.precio || 0) * (item.cantidad_seleccionada || 0);
            
            if (!marca.pedidos.find(p => p.id === pedido.id)) {
              marca.pedidos.push(pedido);
            }
          });
        }
      });
    });

    this.pedidosPorMarca = Array.from(marcasMap.values());
  }

  verTodos(): void {
    this.mostrarTodos = true;
    this.marcaSeleccionada = null;
  }

  verPorMarca(marca: PedidoMarca): void {
    this.mostrarTodos = false;
    this.marcaSeleccionada = marca;
  }

  verDetallePedido(pedido: any): void {
    console.log('Ver detalle pedido:', pedido);
  }

  solicitarAtencion(): void {
    if (this.isViewMsjSolicitudPersonal) return;
    
    console.log('notificar-cliente-llamado-holding');
    this.socketService.emit('notificar-cliente-llamado-holding', {
      idcliente: this.infoToken.idcliente,
      nombre: this.infoToken.nombres,
      mesa: this.infoToken.numMesaLector
    });
    
    this.isViewMsjSolicitudPersonal = true;
    setTimeout(() => {
      this.isViewMsjSolicitudPersonal = false;
    }, 30000);
  }

  hacerNuevoPedido(): void {
    this.miPedidoService.resetAllNewPedido();
    this.navigatorService.setPageActive('carta');
  }

}
