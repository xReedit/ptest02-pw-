import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { emit } from 'cluster';
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

  // return for printer
  private resData = {
    idcliente: '',
    dni: '',
    nombre: '',
    f_nac: '',
    direccion: '',
    telefono: '',
    paga_con: '',
    dato_adicional: ''
  };

  @Input() listSubtotales: any;
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
  }

  verificarNum(telefono: string): void {
    this.isValidForm = telefono.trim().length >= 5 ? true : false;
    this.isReady.emit(this.isValidForm);

    if (this.isValidForm) {
      this.resData.nombre = this.infoToken.nombres;
      this.resData.direccion = this.infoToken.direccionEnvioSelected.direccion;
      this.resData.dato_adicional = this.infoToken.direccionEnvioSelected.referencia;
      this.resData.idcliente = this.infoToken.idcliente.toString();
      this.resData.paga_con = 'Tarjeta';
      this.resData.telefono = telefono;

      this.dataDelivery.emit(this.resData);
    }
  }

}
