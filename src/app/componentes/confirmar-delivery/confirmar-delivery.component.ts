import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';

@Component({
  selector: 'app-confirmar-delivery',
  templateUrl: './confirmar-delivery.component.html',
  styleUrls: ['./confirmar-delivery.component.css']
})
export class ConfirmarDeliveryComponent implements OnInit {

  infoEstablecimiento: DeliveryEstablecimiento;
  infoToken: UsuarioTokenModel;
  direccionCliente: DeliveryDireccionCliente;
  isValidForm = false;

  montoMinimoPedido = 10; // monto minimo del pedido

  // return for printer
  private resData = {
    idcliente: '',
    dni: '',
    nombre: '',
    f_nac: '',
    direccion: '',
    telefono: '',
    paga_con: '',
    dato_adicional: '',
    referencia: ''
  };

  _listSubtotales: any;

  @Input()
  set listSubtotales(val: any) {
    this._listSubtotales = val;
    this.loadData();
  }


  @Output() isReady = new EventEmitter<boolean>();
  @Output() dataDelivery = new EventEmitter<any>();

  constructor(
    private infoTokenService: InfoTockenService,
    private establecimientoService: EstablecimientoService
  ) { }

  ngOnInit() {
    this.loadData();
  }

  private loadData(): void {
    // direccion de entrega
    this.infoToken = this.infoTokenService.getInfoUs();
    this.direccionCliente = this.infoToken.direccionEnvioSelected;
    console.log('info cliente from confirmacion', this.infoToken);

    // establecimiento seleccionado
    this.infoEstablecimiento = this.establecimientoService.get();

    this.isValidForm = this.infoToken.telefono.length >= 5 ? true : false;
    if ( this.isValidForm ) {
      setTimeout(() => {
        // this.isReady.emit(this.isValidForm);
        // this.dataDelivery.emit(this.resData);
        this.verificarNum(this.infoToken.telefono);
      }, 500);
    }
  }

  verificarNum(telefono: string): void {
    this.isValidForm = telefono.trim().length >= 5 ? true : false;
    this.isReady.emit(this.isValidForm);

    if (this.isValidForm) {
      this.resData.nombre = this.infoToken.nombres;
      this.resData.direccion = this.infoToken.direccionEnvioSelected.direccion;
      this.resData.referencia = this.infoToken.direccionEnvioSelected.referencia;
      this.resData.idcliente = this.infoToken.idcliente.toString();
      this.resData.paga_con = 'Tarjeta';
      this.resData.telefono = telefono;
      this.infoToken.telefono = telefono;
      this.infoTokenService.setTelefono(telefono);

      this.dataDelivery.emit(this.resData);
    }

    this.verificarMontoMinimo();
  }

  private verificarMontoMinimo() {
    const importeTotal = parseInt(this._listSubtotales[0].importe, 0);
    this.isValidForm = importeTotal >= this.montoMinimoPedido && this.isValidForm ? true : false;
    this.isReady.emit(this.isValidForm);
  }

}
