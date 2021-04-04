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

  hora: Date = new Date();

  hora_show = '';
  hora_min = '00:00 am';
  hora_max = '23:59 pm';

  constructor(
  ) { }

  ngOnInit(): void {
    this.hora_min = this.getHoraShow(0);
    this.hora_show = this.getHoraShow(this.parametros.addMin);

    if ( this.parametros.showHoraMinMax ) {
      // this.hora_min = this.parametros.hora_min;
      this.hora_max = this.parametros.hora_max;
    }

    this.hora_show = this.parametros.showHoraIni ? this.hora_show : '';
    this.responseHora(this.hora_show);

  }

  private getHoraShow(addHours: number) {
    this.hora.setMinutes(this.hora.getHours() + addHours);
    const _horaNow = this.hora.getHours();
    const _pmAm = _horaNow >= 12 ? 'PM' : 'AM';
    return `${this.hora.getHours()}:${this.hora.getMinutes()} ${_pmAm}`;
  }

  responseHora(horaSelected: string) {
    this.isHourValid =  this.getHourSelectedIsValid(horaSelected);
    horaSelected = this.isHourValid ? horaSelected : '';
    this.changeHora.emit(horaSelected);
  }

  private getHourSelectedIsValid(hSelected: string): boolean {
    if ( hSelected === '' ) { return false; }
    const h1 = this.parametros.hora_max.split(':')[0];
    const h2 = hSelected.split(':')[0];

    return h1 > h2;
  }

}
