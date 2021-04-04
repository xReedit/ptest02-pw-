import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { GetFormDatosCliente } from 'src/app/modelos/GetFormDatosCliente';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { ParametrosCompHora } from 'src/app/modelos/parametrosCompHora';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';

@Component({
  selector: 'app-comp-datos-reserva',
  templateUrl: './comp-datos-reserva.component.html',
  styleUrls: ['./comp-datos-reserva.component.css']
})
export class CompDatosReservaComponent implements OnInit {


  @Output() public dataReserva = new EventEmitter<any>();
  @Output() isReady = new EventEmitter<boolean>();

  frmConfirma: any = {};
  opcionesFrmCliente: GetFormDatosCliente = new GetFormDatosCliente;
  compHoraParams: ParametrosCompHora = new ParametrosCompHora;
  isFormValid = false;

  countTotalItemsPedido = 0;

  infoEstablecimineto: DeliveryEstablecimiento;

  constructor(
    private infoToken: InfoTockenService,
    private miPedidoService: MipedidoService,
    private establecimientoService: EstablecimientoService
  ) { }

  ngOnInit(): void {
    this.infoEstablecimineto = this.establecimientoService.get();

    this.opcionesFrmCliente.showDirreccionA = false; // en realidad
    this.opcionesFrmCliente.telefono = true;
    this.opcionesFrmCliente.calDistanciaCentro = false;
    this.opcionesFrmCliente.tituloDirA = '';

    // componente hora
    this.compHoraParams.titulo = 'Hora de llegada';
    this.compHoraParams.tituloHora = 'Indique aqui la hora';
    this.compHoraParams.addMin = 30;
    this.compHoraParams.hora_min = this.infoEstablecimineto.hora_ini;
    this.compHoraParams.hora_max = this.infoEstablecimineto.hora_fin;
    this.compHoraParams.showHoraMinMax = true;

    this.isFormValid = !!this.infoToken.infoUsToken.telefono;

    this.frmConfirma = {
      nombre_reserva: this.infoToken.infoUsToken.nombres,
      empresa: '',
      referencia: '',
      telefono: this.infoToken.infoUsToken.telefono,
      hora_reserva: '',
      num_personas: 0,
      reserva: true,
      solo_llevar: false,
      delivery: false
    };

    this.miPedidoService.countItemsObserve$.subscribe((res) => {
      this.countTotalItemsPedido = res;

      this.frmConfirma.num_personas = this.countTotalItemsPedido;
      this.emitData();
    });

  }

  frmClienteResponse(e: any) {
    this.frmConfirma.telefono = e.telefono;
    this.isFormValid = !!e.telefono;

    this.emitData();
  }

  setHora(hourSelected: string) {
    this.isFormValid = hourSelected !== '';
    this.frmConfirma.hora_reserva = hourSelected;
    this.emitData();
  }

  emitData() {
    const dataEmit = {
      formIsValid: this.isFormValid,
      formData: this.frmConfirma,
      fromReserva: true
    };

    this.dataReserva.emit(dataEmit);

    this.isReady.emit(this.isFormValid);
  }


}
