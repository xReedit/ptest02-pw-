import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { UtilitariosService } from 'src/app/shared/services/utilitarios.service';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { ClientePagoModel } from 'src/app/modelos/cliente.pago.model';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { DataTransaccion } from 'src/app/modelos/DataTransaccion';


declare var pagar: any;
@Component({
  selector: 'app-comp-pasarela-pago',
  templateUrl: './comp-pasarela-pago.component.html',
  styleUrls: ['./comp-pasarela-pago.component.css']
})
export class CompPasarelaPagoComponent implements OnInit {

  @Input() dataTrasa: DataTransaccion;
  @Output() responseTransa = new EventEmitter<any>();
  @Output() repuestaBtnListo = new EventEmitter<boolean>(false);

  infoToken: UsuarioTokenModel;

  importe: number;
  isLoaderTransaction = false;
  isLoadBtnPago = false;
  isCheckTerminos = false;
  isTrasctionSuccess = false;
  isViewAlertTerminos = false;
  isViewAlertEmail = false;
  isEmailValid = true;
  isRequiredEmail = false;
  isDisabledCheck = false; // desabilita el check de terminos

  dataResTransaction: any = null;

  el_purchasenumber;

  fechaTransaction = new Date();

  importeTransaccion = 0;


  // repuesta
  responseTranaccion = {
    success: false,
    data: {}
  };


  private listenKeyLoader = 'sys::transaction-load';
  private listenKeyData = 'sys::transaction-response';
  private timeListenerKeys: any;
  private dataClientePago: ClientePagoModel = new ClientePagoModel();

  constructor(
    private infoTokenService: InfoTockenService,
    private utilService: UtilitariosService,
    private crudService: CrudHttpService,
    private listenStatusService: ListenStatusService
  ) { }

  ngOnInit(): void {

    this.importeTransaccion = this.dataTrasa.importe;

    this.infoToken = this.infoTokenService.getInfoUs();

    this.getEmailCliente();
    localStorage.setItem('sys::btnP', '0');
  }


  // obtener datos del clienteP
  private getEmailCliente(): void {
    const dataClient = {
      id: this.infoToken.idcliente
    };

    this.crudService.postFree(dataClient, 'transaction', 'get-email-client', false).subscribe((res: any) => {
      this.dataClientePago.email = res.data[0].correo ? res.data[0].correo : '';

      // this.dataClientePago.email = 'integraciones.visanet@necomplus.com'; // desarrollo
      // // this.dataClientePago.email = 'review@cybersource.com';
      // this.dataClientePago.isSaveEmail = false;

      // email // comentar si es review@cybersource.com
      this.isRequiredEmail = this.dataClientePago.email === '' ?  true : false;
      this.isEmailValid = !this.isRequiredEmail;
      this.dataClientePago.isSaveEmail = this.isRequiredEmail;

      this.dataClientePago.idcliente = res.data[0].idcliente_card;
      this.dataClientePago.diasRegistrado = res.data[0].dias_registrado;
      this.dataClientePago.nombres = this.infoToken.nombres;


      // ip del client
      this.dataClientePago.ip = this.infoToken.ipCliente;
      if ( !this.dataClientePago.ip ) {
        this.crudService.getFree('https://api.ipify.org?format=json').subscribe((_res: any) => {
          this.dataClientePago.ip = _res.ip;
          this.infoTokenService.setLocalIpCliente(this.dataClientePago.ip);
          this.isDisabledCheck = true;
        });
      } else {
        this.isDisabledCheck = true;
      }

      this.getNomApClientePago(this.dataClientePago.nombres);

    });
  }

  // dividi nombre y apellidos
  private getNomApClientePago(nombres: string): void {
    const _names = nombres.split(' ');
    let nameCliente = '';
    let apPaternoCliente = '';
    switch (_names.length) {
      case 1:
        nameCliente = _names[0];
        break;
      case 2:
        nameCliente = _names[0];
        apPaternoCliente = _names[1];
        break;
      case 3:
        nameCliente = _names[0];
        apPaternoCliente = _names[2];
        break;
      case 4:
        nameCliente = _names[0];
        apPaternoCliente = _names[2];
        break;
    }

    this.dataClientePago.nombre = this.utilService.primeraConMayusculas(nameCliente);
    this.dataClientePago.apellido = this.utilService.primeraConMayusculas(apPaternoCliente);


  }

  goPagar() {
    this.isViewAlertEmail = false;
    this.isViewAlertTerminos = false;
    this.isCheckTerminos = !this.isCheckTerminos;

    const _pase = this.isCheckTerminos && this.isEmailValid;

    if ( !_pase ) {
      this.isViewAlertEmail = true;
      this.isViewAlertTerminos = true; // comentar si review@cybersoruce.com
      return;
     }

    this.isLoadBtnPago = true;
    this.generarPurchasenumber();
  }


  generarPurchasenumber() {
    this.crudService.getAll('transaction', 'get-purchasenumber', false, false, false).subscribe((res: any) => {
      const _purchasenumber = res.data[0].purchasenumber;
      this.el_purchasenumber = _purchasenumber;

      pagar(this.importeTransaccion, _purchasenumber, this.dataClientePago);
      this.listenResponse();
      this.verificarCheckTerminos();

      this.listenStatusService.setIsBtnPagoShow(true);

      // marcar como si se dio btn pago para reload page
      localStorage.setItem('sys::btnP', '1');
    });

  }

  private listenResponse() {
    this.timeListenerKeys = setTimeout(() => {

      const dataResponse = localStorage.getItem(this.listenKeyData);
      this.isLoaderTransaction = localStorage.getItem(this.listenKeyLoader) === '0' ? false : true;


      let _dataTransactionRegister;

      if ( dataResponse !== 'null' ) {
        this.isLoadBtnPago = false;

        this.dataResTransaction = JSON.parse(dataResponse);

        this.isTrasctionSuccess = !this.dataResTransaction.error;

        if (this.isTrasctionSuccess) {

          _dataTransactionRegister = {
            purchaseNumber: this.dataResTransaction.order.purchaseNumber,
            card: this.dataResTransaction.dataMap.CARD,
            brand: this.dataResTransaction.dataMap.BRAND,
            descripcion: this.dataResTransaction.dataMap.ACTION_DESCRIPTION,
            status: this.dataResTransaction.dataMap.STATUS,
            error: this.dataResTransaction.error
          };


          // retorna evento transaccion success
          this.responseTranaccion.success = true;
          this.responseTranaccion.data = _dataTransactionRegister;

          this.emitRespuesta();

          setTimeout(() => {
            this.isLoaderTransaction = false;
            // marcador si actualiza la pagina cuando ya pago
            this.infoTokenService.setIsPagoSuccess(true);

            return;
          }, 1900);


        } else {
          _dataTransactionRegister = {
            purchaseNumber: this.el_purchasenumber,
            card: this.dataResTransaction.data.CARD,
            brand: this.dataResTransaction.data.BRAND,
            descripcion: this.dataResTransaction.data.ACTION_DESCRIPTION,
            status: this.dataResTransaction.data.STATUS,
            error: this.dataResTransaction.error
          };

          // retorna evento transaccion success

          this.responseTranaccion.success = false;
          this.responseTranaccion.data = _dataTransactionRegister;

          this.emitRespuesta();
        }

        localStorage.removeItem(this.listenKeyData);
      } else {
        this.listenResponse();
      }
    }, 100);
  }


  verificarCheckTerminos() {
    this.isViewAlertTerminos = this.isCheckTerminos ? false : true;
    this.isViewAlertEmail = !this.isEmailValid; // comentar si review@cybersoruce.com
  }

  verificarCorreo(el: any): void {
    this.isEmailValid = el.checkValidity();
    this.isViewAlertEmail = !this.isEmailValid;
    this.dataClientePago.email = el.value;
  }

  emitRespuesta() {
    this.responseTransa.emit(this.responseTranaccion);
  }

  btnFinListo() {
    this.repuestaBtnListo.emit(true);
  }

}
