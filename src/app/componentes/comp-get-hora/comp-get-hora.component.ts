import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ParametrosCompHora } from 'src/app/modelos/parametrosCompHora';

@Component({
  selector: 'app-comp-get-hora',
  templateUrl: './comp-get-hora.component.html',
  styleUrls: ['./comp-get-hora.component.css']
})
export class CompGetHoraComponent implements OnInit {

  @Input() parametros: ParametrosCompHora;
  @Output() changeHora = new EventEmitter<string>();

  isHourValid = false;
  setHoraControl = {
    h: 0,
    m: 0,
    ap: 'AM'
  };

  hora: Date = new Date();

  hora_show = '';
  hora_min = '00:00 am';
  hora_max = '23:59 pm';
  selectedAP = 'AM';

  constructor(
  ) { }

  ngOnInit(): void {
    // console.log('this.parametros', this.parametros);
    this.hora_min = this.getHoraShow(0);
    this.hora_show = this.getHoraShow(this.parametros.addMin);

    if ( this.parametros.showHoraMinMax ) {
      this.hora_min = this.parametros.hora_min;
      // this.hora_max = this.getAmPm(this.parametros.hora_max);
    }

    // this.hora_show = this.parametros.showHoraIni ? this.hora_show : '';
    this.setearHoraControl(this.hora_show);
    this.responseHora();

    // console.log('this.hora_min', this.hora_min);
    // console.log('this.hora_max', this.hora_max);
    // console.log('this.hora_show', this.hora_show);

  }

  private getHoraShow(addHours: number) {
    this.hora.setMinutes(this.hora.getHours() + addHours);
    const _horaNow = this.hora.getHours();
    const _pmAm = _horaNow >= 12 ? 'PM' : 'AM';
    return `${this.hora.getHours()}:${this.hora.getMinutes()} ${_pmAm}`;
  }

  setearHoraControl(_hora: any) {
    const _arrHora = _hora.split(':');
    const ap = _arrHora[1].split(' ');
    this.setHoraControl.h = _arrHora[0];
    this.setHoraControl.m = ap[0];
    this.setHoraControl.ap = ap[1];
  }

  private getAmPm(_hora: string) {
    const hora = parseInt(_hora.split(':')[0], 0);
    const _pmAm = hora >= 12 ? 'PM' : 'AM';
    return `${_hora} ${_pmAm}`;
  }

  responseHora() {
    console.log('aa');
    let _horaGet = this.setHoraControl.h;
    if ( this.setHoraControl.ap.toLocaleLowerCase() === 'pm' ) {
      _horaGet = _horaGet < 12 ? 12 + _horaGet : _horaGet;
      // this.setHoraControl.h = _horaGet;
    }

    let horaSelected = `${this.setHoraControl.h}:${this.setHoraControl.m} ${this.setHoraControl.ap}`;
    const horaSelectedValid = `${_horaGet}:${this.setHoraControl.m} ${this.setHoraControl.ap}`;
    this.isHourValid =  this.getHourSelectedIsValid(horaSelectedValid);
    horaSelected = this.isHourValid ? horaSelected : '';
    this.changeHora.emit(horaSelected);
  }

  changeAm(e: any) {
    // console.log('change envet hora', e);
    // this.getHoraPmFormat12(e);
  }

  // si la hora del control el mayot que 11 se pone pm
  private getHoraPmFormat12(_hora: string) {
    const hora = _hora.split(':')[0];
    this.hora_show = `${hora}:00 PM`;

  }

  private getHourSelectedIsValid(hSelected: string): boolean {
    if ( hSelected === '' ) { return false; }
    const h1 = parseInt(this.parametros.hora_max.split(':')[0], 0);
    const h2 = parseInt(hSelected.split(':')[0], 0);
    return h1 > h2;
  }

}
