import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';
import { URL_IMG_COMERCIO } from 'src/app/shared/config/config.const';


@Component({
  selector: 'app-item-comercio',
  templateUrl: './item-comercio.component.html',
  styleUrls: ['./item-comercio.component.css']
})
export class ItemComercioComponent implements OnInit {
  isCerrado = false;
  isComercioAceptaPedidoProgramado = false;
  isTiempoProgramadoSoloDia = false; // si el pedido se programa solo para el dia
  isComercioReservacionesActiva = false; // si el comercio acepta reserva y ademas esta en el horario
  amPm = 'AM';
  imgComercio = '';

  descripcionDiaProgramado = '';
  horaAceptaReservas = '';

  @Input() itemEstablecimiento: DeliveryEstablecimiento;
  @Input() reserva: boolean;

  @Output() itemSelected = new EventEmitter<DeliveryEstablecimiento>();

  constructor() { }

  ngOnInit() {

    console.log('aa');

    this.isCerrado = this.itemEstablecimiento.cerrado === 1 ? true : false;


    // this.isComercioAceptaPedidoProgramado = this.reserva ? this.reserva : this.isComercioAceptaPedidoProgramado; // si es reserva nada

    this.amPm = this.itemEstablecimiento.hora_ini ? parseInt(this.itemEstablecimiento.hora_ini.split(':')[0], 0) > 12 ? 'PM' : 'AM' : '';
    this.imgComercio = URL_IMG_COMERCIO + this.itemEstablecimiento.pwa_delivery_img;

    // si aceptas reservas   // reserva = true = acepta reserva
    if ( this.reserva ) {
      // verificamos si esta dentro del horario que acepta recervas
      let _hIni = this.itemEstablecimiento.hora_ini;
      const _hFin = this.itemEstablecimiento.hora_fin;

      _hIni = this.itemEstablecimiento.pwa_acepta_reserva_desde ? this.itemEstablecimiento.pwa_acepta_reserva_desde : _hIni;

      this.horaAceptaReservas = `${_hIni} hasta las ${_hFin}`;

      this.isComercioReservacionesActiva = this.getHortaValida(_hIni, _hFin);
      return;

    }

    this.isComercioAceptaPedidoProgramado = this.itemEstablecimiento.pwa_delivery_habilitar_pedido_programado === 1 && this.isCerrado;
    this.isTiempoProgramadoSoloDia = this.itemEstablecimiento.pwa_pedido_programado_solo_del_dia === 1;
    this.isComercioAceptaPedidoProgramado = this.isComercioAceptaPedidoProgramado && !this.isTiempoProgramadoSoloDia;

    if ( this.itemEstablecimiento.pwa_delivery_habilitar_pedido_programado === 1 && !this.reserva) {
      const dateHoy = new Date();
      const hourNow = dateHoy.getHours();
      const horaIni = parseInt(this.itemEstablecimiento.hora_ini.split(':')[0], 0);
      const horaFni = parseInt(this.itemEstablecimiento.hora_fin.split(':')[0], 0);
      const diasAtiende = this.itemEstablecimiento.dias_atienden;
      const numDay  = dateHoy.getDay();
      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
      let disponibleHoy = diasAtiende.indexOf(numDay.toString()) > -1 ? true : false;
      let horaDisponibleHoy = hourNow <= horaFni;
      disponibleHoy = disponibleHoy && horaDisponibleHoy;
      horaDisponibleHoy = hourNow >= horaIni && horaDisponibleHoy && disponibleHoy && this.isCerrado;


      if ( horaDisponibleHoy ) {
        this.isComercioAceptaPedidoProgramado = false; // no muestra
        return;
      }

      let _descripcion = 'Hoy';
      if ( !disponibleHoy ) {
        let countDays = 1;
        while (countDays <= 5) {
          const numDayAdd = dateHoy.getDay() + 1;
          dateHoy.setDate(dateHoy.getDate() + 1);
          if ( diasAtiende.indexOf(numDayAdd.toString()) > -1 ) {
            _descripcion = countDays === 1 ? 'Mañana' :  diasSemana[numDayAdd] + ' ' + dateHoy.getDate();
            this.descripcionDiaProgramado = _descripcion;
            return;
          }
          countDays ++;
        }
      }

      this.descripcionDiaProgramado = _descripcion;
    }



  }

  private getHortaValida(min: string, max: string): boolean {
    const dateHoy = new Date();
      const hourNow = dateHoy.getHours();
      const horaIni = parseInt(min.split(':')[0], 0);
      const horaFni = parseInt(max.split(':')[0], 0);

      const rptHoraValid = hourNow <= horaFni && hourNow >= horaIni;
      // rptHoraValid = hourNow >= horaIni;
      return rptHoraValid;
  }

  _itemSelected() {
    if ( this.isCerrado && !this.isComercioAceptaPedidoProgramado && !this.reserva) {return; }
    this.itemSelected.emit(this.itemEstablecimiento);
  }

}
