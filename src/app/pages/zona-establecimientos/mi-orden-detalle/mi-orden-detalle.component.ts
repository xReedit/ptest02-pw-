import { Component, OnInit, OnDestroy } from '@angular/core';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { ILatLng } from 'src/app/shared/directivas/directions-map-directive.directive';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DatosCalificadoModel } from 'src/app/modelos/datos.calificado.model';
import { DialogCalificacionComponent } from 'src/app/componentes/dialog-calificacion/dialog-calificacion.component';
import { CalcDistanciaService } from 'src/app/shared/services/calc-distancia.service';
import { GeoPositionModel } from 'src/app/modelos/geoposition.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mi-orden-detalle',
  templateUrl: './mi-orden-detalle.component.html',
  styleUrls: ['./mi-orden-detalle.component.css']
})
export class MiOrdenDetalleComponent implements OnInit, OnDestroy {
  dataPedido: any;
  origin: ILatLng;
  destination: ILatLng;
  estadoPedido = '';
  showTelefonoRepartidor = false;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  private direccionCliente: any;
  constructor(
    private infoTokenService: InfoTockenService,
    private socketService: SocketService,
    private dialog: MatDialog,
    private calcDistanciaService: CalcDistanciaService,
    private router: Router
  ) { }

  ngOnInit() {
    this.dataPedido = this.infoTokenService.infoUsToken.otro;

    // console.log('this.dataPedido otro', this.dataPedido);
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

    if ( this.dataPedido.pwa_delivery_status !== '4' ) {
      this.listenUbicacionRepartidor();
    }

    this.readEstadoPedido(this.dataPedido.pwa_delivery_status);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  private listenUbicacionRepartidor() {
    this.socketService.onDeliveryUbicacionRepartidor()
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {

        if ( this.dataPedido.pwa_delivery_status === 4 ) {return; }

        const _geoPosition = <ILatLng>res;
        // console.log('ubicacion repartidor', res);
        // calcular la distancia con el repartidor si esta cerca activa "recibi conforme" y "llamar a repartidor"
        const isLLego = this.calcDistanciaService.calcDistancia(<GeoPositionModel>_geoPosition, <GeoPositionModel>this.destination);
        // console.log('distancia listen llego ?', isLLego);

        if ( isLLego ) {
          // this.dataPedido.pwa_delivery_status = 3;
          this.readEstadoPedido(3);
        } else {
          this.readEstadoPedido(1);
        }

        if ( this.estadoPedido === '4' ) {return; }
        this.origin = _geoPosition;
      });

    this.socketService.onDeliveryPedidoChangeStatus()
    .pipe(takeUntil(this.destroy$))
    .subscribe(res => {
      if ( this.estadoPedido === '4' ) {return; }
      this.readEstadoPedido(res);
    });
  }

  private readEstadoPedido(_estado: any) {
    let estado = '';
    this.showTelefonoRepartidor = false;
    this.dataPedido.pwa_delivery_status = _estado;
      switch (_estado.toString()) {
        case '0':
            estado = 'Preparando';
          break;
        case '1':
            estado = 'Asignado y preparando';
            this.showTelefonoRepartidor = true;
          break;
        case '3':
            estado = 'En Camino';
            this.showTelefonoRepartidor = true;
          break;
        case '4':
            estado = 'Entregado';
            this.showTelefonoRepartidor = false;
          break;
      }

      this.estadoPedido = estado;
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
        this.dataPedido.pwa_delivery_status = 4;
        this.infoTokenService.set();
        this.showTelefonoRepartidor = false;
        this.estadoPedido = 'Entregado';

        this.router.navigate(['/zona-delivery/establecimientos']);
        // console.log('data dialog', data);
      }
    );
  }

}
