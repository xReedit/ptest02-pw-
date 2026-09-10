import { Component, OnInit, OnDestroy } from '@angular/core';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { LatLng } from 'src/app/componentes/mapa-solo/mapa-solo.component';
import { Subject, merge } from 'rxjs';
import { takeUntil, debounceTime, filter } from 'rxjs/operators';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DatosCalificadoModel } from 'src/app/modelos/datos.calificado.model';
import { DialogCalificacionComponent } from 'src/app/componentes/dialog-calificacion/dialog-calificacion.component';
import { Router } from '@angular/router';
import { SeguimientoPedidoService } from 'src/app/shared/services/seguimiento-pedido.service';
import { resumirEstadoPedido, PASOS_ESTADO, EstadoResumen } from 'src/app/shared/utils/estado-pedido';

@Component({
  selector: 'app-mi-orden-detalle',
  templateUrl: './mi-orden-detalle.component.html',
  styleUrls: ['./mi-orden-detalle.component.css']
})
export class MiOrdenDetalleComponent implements OnInit, OnDestroy {
  dataPedido: any;
  origin: LatLng;
  destination: LatLng;
  estadoResumen: EstadoResumen;
  pasos = PASOS_ESTADO;
  ubicacionRepartidor: { latitude: number; longitude: number } = null;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  private direccionCliente: any;
  constructor(
    private infoTokenService: InfoTockenService,
    private socketService: SocketService,
    private dialog: MatDialog,
    private router: Router,
    private seguimiento: SeguimientoPedidoService
  ) { }

  ngOnInit() {
    this.dataPedido = this.infoTokenService.infoUsToken.otro;

    this.direccionCliente = this.infoTokenService.infoUsToken.otro.direccionEnvioSelected || this.infoTokenService.infoUsToken.direccionEnvioSelected;
    this.direccionCliente = typeof this.direccionCliente !== 'object' ? JSON.parse(this.direccionCliente) : this.direccionCliente;

    if ( !this.origin ) {
      // direccion del establecimiento
      this.origin = {
        latitude: parseFloat(this.infoTokenService.infoUsToken.otro.latitude),
        longitude: parseFloat(this.infoTokenService.infoUsToken.otro.longitude),
      };
    }

    this.destination = {
      latitude: this.direccionCliente.latitude,
      longitude: this.direccionCliente.longitude,
    };

    this.aplicarEstado(this.dataPedido);
    this.refrescar();

    // socket, vuelta al primer plano y polling de respaldo: cualquiera vuelve a pedir el estado al servidor
    // se pasa el idpedido: los eventos de otro pedido del mismo cliente no deben refrescar esta pantalla
    // el filtro va ANTES del debounce: con el pedido cerrado no se vuelve a consultar al servidor
    // debounceTime va antes de takeUntil: al revés, al destruir el componente el debounce pendiente se vaciaría igual
    merge(this.seguimiento.cambios$(this.dataPedido.idpedido), this.seguimiento.refrescoAutomatico$())
      .pipe(filter(() => !!this.estadoResumen?.activo), debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.refrescar());

    this.seguimiento.ubicacionRepartidor$(this.dataPedido.idpedido)
      .pipe(takeUntil(this.destroy$))
      .subscribe(pos => {
        if ( !pos ) { return; }
        this.ubicacionRepartidor = pos;
        this.origin = pos;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  // el estado lo decide el servidor: aqui solo se refleja
  private refrescar(): void {
    this.seguimiento.estadoDe(this.dataPedido.idpedido, this.dataPedido.idcliente)
      .pipe(takeUntil(this.destroy$))
      .subscribe(est => {
        if ( !est ) { return; }
        this.dataPedido = { ...this.dataPedido, ...est };
        this.aplicarEstado(this.dataPedido);
        if ( est.position_now && !this.ubicacionRepartidor ) {
          this.origin = { latitude: est.position_now.latitude, longitude: est.position_now.longitude };
        }
      });
  }

  private aplicarEstado(p: any): void {
    this.estadoResumen = resumirEstadoPedido(p);
  }

  redirectWhatsApp() {
    const _link = `https://api.whatsapp.com/send?phone=51${this.dataPedido.telefono_repartidor}`;
    window.open(_link, '_blank');
  }

  callPhone() {
    window.open(`tel:${this.dataPedido.telefono_repartidor}`);
  }

  openDialogCalificacion() {
    const dataCalificado: DatosCalificadoModel = new DatosCalificadoModel;
    dataCalificado.idrepartidor = this.dataPedido.idrepartidor;
    dataCalificado.idcliente = this.dataPedido.idcliente;
    dataCalificado.idpedido = this.dataPedido.idpedido;
    dataCalificado.tipo = 1;
    dataCalificado.showNombre = true;
    dataCalificado.nombre = this.dataPedido.nom_repartidor + ' ' + this.dataPedido.ap_repartidor;
    dataCalificado.titulo = 'Como calificas a nuestro repartidor?';
    dataCalificado.showTitulo = true;
    dataCalificado.showMsjTankyou = true;


    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;

    _dialogConfig.data = {
      dataCalificado: dataCalificado
    };

    const dialogRef =  this.dialog.open(DialogCalificacionComponent, _dialogConfig);
    dialogRef.afterClosed().subscribe(
      data => {
        // notificar al repartidor fin del pedido
        this.socketService.emit('repartidor-notifica-fin-pedido', this.dataPedido);
        this.dataPedido = { ...this.dataPedido, pwa_delivery_status: 4 };
        this.aplicarEstado(this.dataPedido);
        // dataPedido ya no es el mismo objeto que guarda el token: hay que reapuntarlo antes de persistir
        this.infoTokenService.infoUsToken.otro = this.dataPedido;
        this.infoTokenService.set();

        this.router.navigate(['/zona-delivery/establecimientos']);
      }
    );
  }

}
