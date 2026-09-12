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
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
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

  // "Califique al comercio de su ultimo pedido": antes flotaba en la cabecera de zona-establecimientos
  // sin importar que pedido se estuviera viendo. Ahora se muestra solo dentro del detalle del pedido
  // que realmente esta entregado y pendiente de calificar, al final del contenido.
  mostrarCalificarComercio = false;
  private comercioACalificar: any = null;

  private direccionCliente: any;
  constructor(
    private infoTokenService: InfoTockenService,
    private socketService: SocketService,
    private dialog: MatDialog,
    private router: Router,
    private seguimiento: SeguimientoPedidoService,
    private establecimientoService: EstablecimientoService
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
    if ( this.estadoResumen.codigo === 'entregado' ) {
      this.verificarCalificarComercio();
    }
  }

  // consulta si ESTE pedido especifico esta pendiente de calificar (no cualquier otro pedido del cliente)
  private verificarCalificarComercio(): void {
    if ( this.mostrarCalificarComercio || this.comercioACalificar || this.calificarComercioFueDescartado() ) { return; }

    this.establecimientoService.getComerciosXCalifcar(this.dataPedido.idcliente)
      .pipe(takeUntil(this.destroy$))
      .subscribe(lista => {
        const pendiente = (lista || []).find(x => x.idpedido === this.dataPedido.idpedido);
        if ( pendiente ) {
          this.comercioACalificar = pendiente;
          this.mostrarCalificarComercio = true;
        }
      });
  }

  private claveDescarteCalificarComercio(): string {
    return `calificar-comercio-descartado-${this.dataPedido.idpedido}`;
  }

  private calificarComercioFueDescartado(): boolean {
    try {
      return sessionStorage.getItem(this.claveDescarteCalificarComercio()) === '1';
    } catch (error) {
      return false;
    }
  }

  // cierra el aviso para el resto de esta sesion del navegador; no vuelve a molestar al recargar la pantalla
  descartarCalificarComercio(): void {
    this.mostrarCalificarComercio = false;
    try {
      sessionStorage.setItem(this.claveDescarteCalificarComercio(), '1');
    } catch (error) {
      // almacenamiento no disponible (modo privado, etc.): no es critico, solo se repetiria el aviso
    }
  }

  goCalificarComercio(): void {
    const _pClaificar = this.comercioACalificar;
    if ( !_pClaificar ) { return; }

    const dataCalificado: DatosCalificadoModel = new DatosCalificadoModel;
    dataCalificado.idcliente = this.dataPedido.idcliente;
    dataCalificado.idpedido = _pClaificar.idpedido;
    dataCalificado.idsede = _pClaificar.idsede;
    dataCalificado.tipo = 3;
    dataCalificado.showNombre = true;
    dataCalificado.showTitulo = true;
    dataCalificado.showTxtComentario = true;
    dataCalificado.nombre = _pClaificar.nomestablecimiento;
    dataCalificado.titulo = 'Como calificas al comercio?';
    dataCalificado.showMsjTankyou = true;

    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;
    _dialogConfig.data = { dataCalificado };

    const dialogRef = this.dialog.open(DialogCalificacionComponent, _dialogConfig);
    dialogRef.afterClosed().subscribe(() => {
      this.mostrarCalificarComercio = false;
    });
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
