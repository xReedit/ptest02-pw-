import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { CrudHttpService } from './crud-http.service';
import { InfoTockenService } from './info-token.service';

// Pago con tarjeta (Niubiz) del consumo en mesa.
// El navegador ya no conoce usuario, contraseña, merchantId ni las urls de la pasarela:
// todo eso vive en el backend (POST /pago/niubiz/sesion y /pago/niubiz/autorizar).
const CONTROLADOR_PAGO = 'pago';
const ACCION_SESION = 'niubiz/sesion';
const ACCION_AUTORIZAR = 'niubiz/autorizar';
const CANAL = 'web';
const LLAVE_TRANSACTION_LOAD = 'sys::transaction-load';
const LLAVE_TRANSACTION_RESPONSE = 'sys::transaction-response';

@Injectable({
  providedIn: 'root'
})
export class PagoTarjetaVisanetService {

  private importe: any;
  private purchasenumber: any;
  private dataCliente: any;
  private sesion: any = null;

  // Se registra al iniciar un pago y se quita al recibir la respuesta o al cancelar.
  private paymentSuccessHandler: ((event: any) => void) | null = null;

  private listenPaymetResponseSource = new BehaviorSubject<any>(null);
  public listenPaymetResponse$ = this.listenPaymetResponseSource.asObservable();

  private listenPaymetLoaderSource = new BehaviorSubject<boolean>(false);
  public listenPaymetLoader$ = this.listenPaymetLoaderSource.asObservable();

  constructor(
    private crudService: CrudHttpService,
    private infoTokenService: InfoTockenService
  ) { }

  processPayment(_importe, _purchasenumber, _dataClie) {

    this.importe = parseFloat(_importe).toFixed(2).toString();
    this.purchasenumber = _purchasenumber;
    this.dataCliente = _dataClie;
    // dataCliente.email_token = dataCliente.idcliente +'@apitoken.com'; // para guardar las tarjetas - userToken
    this.dataCliente.email_token = this.dataCliente.email;

    // El BehaviorSubject es singleton: se limpia la respuesta anterior para que
    // un pago nuevo no reciba de golpe el resultado del anterior.
    this.listenPaymetResponseSource.next(null);
    this.listenPaymetLoaderSource.next(false);

    this.generarSesion();
  }

  // El backend arma el bloque antifraud/merchantDefineData con estos datos
  // (MDD4, MDD32, MDD75, MDD77, MDD89), igual que antes lo hacía el navegador.
  private buildClientData() {
    return {
      email: this.dataCliente.email || '',
      idcliente: this.dataCliente.idcliente || '0',
      ip: this.dataCliente.ip || '0.0.0.0',
      diasRegistrado: this.dataCliente.diasRegistrado || 0
    };
  }

  private generarSesion() {
    // Sin clientData a propósito: el flujo de mesa siempre envió "antifraud": null
    // en la sesión y solo mandaba los datos antifraude en la autorización.
    const body = {
      idsede: Number(this.infoTokenService.getInfoSedeToken()),
      amount: this.importe,
      purchaseNumber: this.purchasenumber,
      channel: CANAL
    };

    this.crudService.postFree(body, CONTROLADOR_PAGO, ACCION_SESION, false)
      .subscribe({
        next: (res: any) => {
          if (!res || res.success !== true || !res.data || !res.data.sessionKey) {
            this.emitirError('No se pudo iniciar el pago con tarjeta');
            return;
          }
          this.sesion = res.data;
          this.generarBoton(res.data);
        },
        error: (err) => this.emitirError('No se pudo iniciar el pago con tarjeta', err)
      });
  }

  private generarBoton(sesion: any) {
    const nombre = this.dataCliente.nombre;
    const apellido = this.dataCliente.apellido;
    const email = this.dataCliente.email;

    const contenedor = document.getElementById('btn_pago');
    if (!contenedor) {
      this.emitirError('Contenedor de pago no encontrado');
      return;
    }

    // Solo se escucha la respuesta de Niubiz mientras el formulario está abierto
    this.startPaymentListener();

    const form = document.createElement('form');
    form.setAttribute('method', 'post');
    form.setAttribute('action', 'javascript:responseFormProd(self)');
    form.setAttribute('id', 'boton_pago');
    contenedor.appendChild(form);

    const scriptEl = document.createElement('script');
    scriptEl.setAttribute('src', sesion.urlJs);
    scriptEl.setAttribute('data-sessiontoken', sesion.sessionKey);
    scriptEl.setAttribute('data-channel', CANAL);
    scriptEl.setAttribute('data-merchantid', sesion.merchantId);

    scriptEl.setAttribute('data-purchasenumber', sesion.purchaseNumber);
    scriptEl.setAttribute('data-amount', this.importe);

    scriptEl.setAttribute('data-merchantlogo', sesion.logo);

    scriptEl.setAttribute('data-expirationminutes', '8');
    scriptEl.setAttribute('data-timeouturl', 'javascript:responseFormProd(self)');

    scriptEl.setAttribute('data-cardholdername', nombre);
    scriptEl.setAttribute('data-cardholderlastname', apellido);
    scriptEl.setAttribute('data-cardholderemail', email);
    scriptEl.setAttribute('data-usertoken', email);

    form.appendChild(scriptEl);

    const btnDisabled = document.getElementById('btn-disabled');
    if (btnDisabled) {
      btnDisabled.classList.add('btn-hidden');
    }
  }

  private startPaymentListener(): void {
    this.stopPaymentListener();
    this.paymentSuccessHandler = (event: any) => {
      this.generateAutorizacion(event.detail);
    };
    window.addEventListener('payment.success', this.paymentSuccessHandler);
  }

  private stopPaymentListener(): void {
    if (this.paymentSuccessHandler) {
      window.removeEventListener('payment.success', this.paymentSuccessHandler);
      this.paymentSuccessHandler = null;
    }
  }

  private generateAutorizacion(transactionToken) {
    // El token llega una sola vez; a partir de aquí ya no se escucha el evento.
    this.stopPaymentListener();

    this.listenPaymetLoaderSource.next(true);
    localStorage.setItem(LLAVE_TRANSACTION_LOAD, '1');

    const body = {
      idsede: Number(this.infoTokenService.getInfoSedeToken()),
      purchaseNumber: this.sesion ? this.sesion.purchaseNumber : this.purchasenumber,
      amount: this.importe,
      transactionToken: transactionToken,
      channel: CANAL,
      clientData: this.buildClientData()
    };

    this.crudService.postFree(body, CONTROLADOR_PAGO, ACCION_AUTORIZAR, false)
      .subscribe({
        next: (rpta: any) => {
          // Se conserva la forma que consume pagar-cuenta / comp-pasarela-pago:
          // la respuesta cruda de Niubiz con el campo error agregado.
          const res = (rpta && rpta.data) ? rpta.data : {};
          const hayError = res.errorCode ? true : false;
          res.error = hayError;

          this.loaderTransactionResponse(res, hayError);
          this.listenPaymetResponseSource.next(res);
        },
        error: (err) => this.emitirError('Error al autorizar el pago', err)
      });
  }

  private emitirError(mensaje: string, error?: any) {
    console.error(mensaje, error);
    this.stopPaymentListener();
    const res: any = error && typeof error === 'object' ? error : {};
    res.error = true;
    res.errorMessage = mensaje;

    this.loaderTransactionResponse(res, true);
    this.listenPaymetResponseSource.next(res);
  }

  private loaderTransactionResponse(res, isError) {
    if ( res ) {
      res.error = isError;
      const elem = document.querySelector('#visaNetWrapper');
      if ( elem && elem.parentNode ) {
        elem.parentNode.removeChild(elem);
      }
    }
    // Lo hacía boton-pago.js (borrado con sus credenciales); registrar-pago.service
    // y resumen-pedido siguen leyendo estas dos claves.
    localStorage.setItem(LLAVE_TRANSACTION_LOAD, '0');
    localStorage.setItem(LLAVE_TRANSACTION_RESPONSE, JSON.stringify(res));
  }

  // Cancelar el pago antes de que Niubiz responda: quita el listener y el formulario.
  cancelPayment(): void {
    this.stopPaymentListener();
    this.sesion = null;

    const form = document.getElementById('boton_pago');
    if (form) {
      form.remove();
    }
    const wrapper = document.getElementById('visaNetWrapper');
    if (wrapper) {
      wrapper.remove();
    }
  }
}
