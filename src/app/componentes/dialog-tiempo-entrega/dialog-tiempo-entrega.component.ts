import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';
import { TiempoEntregaModel } from 'src/app/modelos/tiempo.entrega.model';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';


@Component({
  selector: 'app-dialog-tiempo-entrega',
  templateUrl: './dialog-tiempo-entrega.component.html',
  styleUrls: ['./dialog-tiempo-entrega.component.css']
})
export class DialogTiempoEntregaComponent implements OnInit {

  infoEstablecimiento: DeliveryEstablecimiento;
  tiempoEntregaSelected: TiempoEntregaModel;
  isComercioAceptaPedidoProgramado = false;
  isPersonalAutorizado = false;
  hourNow: number;
  minNow: number;
  rippleColor = 'rgb(255,238,88, 0.3)';

  isHoraValid  = true;

  private dateNow = new Date();
  constructor(
    private dialogRef: MatDialogRef<DialogTiempoEntregaComponent>,
    private establecimientoService: EstablecimientoService,
    private inforTokenService: InfoTockenService

  ) { }

  ngOnInit() {

    this.hourNow = this.dateNow.getHours();
    this.minNow = this.dateNow.getMinutes();

    this.infoEstablecimiento = this.establecimientoService.get();

    this.isPersonalAutorizado = !this.inforTokenService.getInfoUs().isCliente;
    this.isComercioAceptaPedidoProgramado = this.infoEstablecimiento.pwa_delivery_habilitar_pedido_programado === 1;
    // console.log('this.infoEstablecimiento', this.infoEstablecimiento);
  }

  selectedTime($event: TiempoEntregaModel) {
    this.tiempoEntregaSelected = $event;
    // console.log($event);
  }

  timePersonalAutorizado() {
    this.isHoraValid = this.hourNow <= 24 && this.minNow <= 59;

    const _houra = this.hourNow + ':' + this.minNow;
    const _valAdd = this.dateNow.toLocaleDateString() + ' ' + _houra;

    this.tiempoEntregaSelected = new TiempoEntregaModel();
    this.tiempoEntregaSelected.dia = 'Hoy';
    this.tiempoEntregaSelected.descripcion = 'Hoy';
    this.tiempoEntregaSelected.hora = _houra;
    this.tiempoEntregaSelected.value = _houra;
    this.tiempoEntregaSelected.date = _valAdd;
    this.tiempoEntregaSelected.idhora = 0;
    this.tiempoEntregaSelected.iddia = 0;
    this.tiempoEntregaSelected.modificado = true;
    this.tiempoEntregaSelected.isUsuarioAutorizado = true;

    // console.log(this.tiempoEntregaSelected);
  }

  cerrarDlg(): void {
    this.dialogRef.close(this.tiempoEntregaSelected);
  }

}
