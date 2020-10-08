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
  amPm = 'AM';
  imgComercio = '';

  descripcionDiaProgramado = '';

  @Input() itemEstablecimiento: DeliveryEstablecimiento;

  @Output() itemSelected = new EventEmitter<DeliveryEstablecimiento>();

  constructor() { }

  ngOnInit() {

    this.isCerrado = this.itemEstablecimiento.cerrado === 1 ? true : false;
    this.isComercioAceptaPedidoProgramado = this.itemEstablecimiento.pwa_delivery_habilitar_pedido_programado === 1 && this.isCerrado;
    this.amPm = this.itemEstablecimiento.hora_ini ? parseInt(this.itemEstablecimiento.hora_ini.split(':')[0], 0) > 12 ? 'PM' : 'AM' : '';
    this.imgComercio = URL_IMG_COMERCIO + this.itemEstablecimiento.pwa_delivery_img;

    console.log('itemEstablecimiento', this.itemEstablecimiento);

    if ( this.itemEstablecimiento.pwa_delivery_habilitar_pedido_programado === 1 ) {
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

  _itemSelected() {
    if ( this.isCerrado && !this.isComercioAceptaPedidoProgramado) {return; }
    this.itemSelected.emit(this.itemEstablecimiento);
  }

}
