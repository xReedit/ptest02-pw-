import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';
import { TiempoEntregaModel } from 'src/app/modelos/tiempo.entrega.model';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';


@Component({
  selector: 'app-tiempo-programado',
  templateUrl: './tiempo-programado.component.html',
  styleUrls: ['./tiempo-programado.component.css']
})
export class TiempoProgramadoComponent implements OnInit {

  @Output() tiempoProgramado = new EventEmitter<TiempoEntregaModel>();

  infoEstablecimiento: DeliveryEstablecimiento;
  listDia = [];
  listHora = [];
  selectedIni: any;

  seletecDay: any;
  tiempoEntregaSelected: TiempoEntregaModel = new TiempoEntregaModel();



  private dateHoy = new Date();
  private dateNow = new Date();

  constructor(
    private establecimientoService: EstablecimientoService,
    private infoTokenService: InfoTockenService
  ) { }

  ngOnInit() {
    this.infoEstablecimiento = this.establecimientoService.get();
    this.getDia();

    this.tiempoEntregaSelected = this.infoTokenService.infoUsToken.tiempoEntrega;
    this.findTimeList();
  }

  private findTimeList() {
    if ( this.tiempoEntregaSelected.iddia !== undefined ) {
      this.selectedIni = this.listDia.filter(d => d.numDay === this.tiempoEntregaSelected.iddia)[0];

      this.seletecDay = this.selectedIni;
      this.listHora = this.selectedIni.hours;

      this.listDia.map(d => {
        d.hours.map(h => h.selected = false);
      });

      this.listHora.map(h => h.selected = false );
      this.listHora.filter(h => h.hora === this.tiempoEntregaSelected.idhora)[0].selected = true;
    }
  }

  private getDia() {
    const horaIni = parseInt(this.infoEstablecimiento.hora_ini.split(':')[0], 0);
    const horaFni = parseInt(this.infoEstablecimiento.hora_fin.split(':')[0], 0);
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    const numDay  = this.dateHoy.getDay();
    const hourNow = this.dateHoy.getHours();
    const minNow = this.dateHoy.getMinutes();
    console.log('numDay', numDay);

    const horaDisponibleHoy = hourNow <= horaFni;

    this.listDia = [];
    let countDays = 1;
    const _numDay = diasSemana[this.dateHoy.getDay()];
    if ( horaDisponibleHoy ) {
      const _lisHours = this.hourSow(hourNow, horaIni, horaFni, true);
      this.listDia.push({ numDay:  0, descripcion: 'Hoy', date: this.dateNow.toLocaleDateString(), hours: _lisHours});
    }

    while (countDays <= 3) {
      const _lisHours = this.hourSow(hourNow, horaIni, horaFni, false);
      let numDayAdd = this.dateHoy.getDay() + 1;
      numDayAdd = numDayAdd > 6 ? numDayAdd - 7 : numDayAdd;
      this.dateHoy.setDate(this.dateHoy.getDate() + 1);
      const dateAdd = this.dateHoy.toLocaleDateString();
      const _descripcion = countDays === 1 ? 'Mañana' :  diasSemana[numDayAdd] + ' ' + this.dateHoy.getDate();
      const _dayBus = numDayAdd;
      const isAdd = this.infoEstablecimiento.dias_atienden.indexOf(_dayBus.toString()) > -1;
      if ( isAdd ) {
        this.listDia.push({ numDay: countDays, descripcion: _descripcion, date: dateAdd, hours: _lisHours});
      }
      countDays++;
    }

    this.selectedIni = this.listDia[0];
    this.seletecDay = this.selectedIni;
    this.listHora = this.selectedIni.hours;

  }

  private hourSow(horaNow: number, horaIni: number, horaFin: number, isHoy = false): any {
    const listHoursShow = [];
    let _itemHour = {};
    let hours  = horaNow >= horaIni ? horaNow : horaIni;
    // for (hours; horaIni <= horaFin; hours++) {
    while (hours < horaFin) {
      if ( horaNow >= horaIni && isHoy) {
        _itemHour = {hora: 8, descripcion: 'Lo mas antes posible: ' + this.infoEstablecimiento.tiempo_aprox_entrega, selected: true};
      } else {
        _itemHour = {hora: hours, descripcion: hours + ':00 - ' +  hours + ':30', selected: false};
      }
      hours ++;

      listHoursShow.push(_itemHour);
    }

    // console.log('listHoursShow', listHoursShow);
    return listHoursShow;
  }

  selectedDay(selectedDay: any) {
    console.log('daySelected', selectedDay);
    this.seletecDay = selectedDay.value;
    this.listHora = selectedDay.value.hours;
  }

  selectHour(rowHour: any) {
    // this.listHora.map(h => h.selected = false);
    this.listDia.map(d => {
      d.hours.map(h => h.selected = false);
    });
    rowHour.selected = true;

    this.tiempoEntregaSelected = new TiempoEntregaModel();

    const _valAdd = this.seletecDay.date + ' ' + rowHour.descripcion.split(' - ')[0];
    console.log('_valAdd', _valAdd);
    this.tiempoEntregaSelected.dia = this.seletecDay.descripcion;
    this.tiempoEntregaSelected.descripcion = this.seletecDay.descripcion;
    this.tiempoEntregaSelected.hora = rowHour.descripcion;
    this.tiempoEntregaSelected.value = rowHour.descripcion;
    this.tiempoEntregaSelected.date = _valAdd;
    this.tiempoEntregaSelected.idhora = rowHour.hora;
    this.tiempoEntregaSelected.iddia = this.seletecDay.numDay;
    this.tiempoEntregaSelected.modificado = true;

    if (  rowHour.descripcion.indexOf( 'Lo mas antes posible' ) > -1 ) {
      this.tiempoEntregaSelected.modificado = false;
    }

    this.tiempoProgramado.emit(this.tiempoEntregaSelected);
  }

  compareObjects(o1: any, o2: any): boolean {
    return o1.descripcion === o2.descripcion && o1.numDay === o2.numDay;
  }

}
