import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { CrudHttpService } from './crud-http.service';
import { InfoTockenService } from './info-token.service';
import { autorizacionExitosa } from '../utils/niubiz-respuesta';

// Datos públicos que el backend devuelve para poder abrir el formulario de Niubiz.
// Las credenciales (usuario, contraseña, cabecera Basic) viven solo en el backend.
export interface NiubizSesion {
  sessionKey: string;
  merchantId: string;
  purchaseNumber: string;
  expirationTime?: number;
  amount?: number;
  currency?: string;
  urlJs: string;
  logo: string;
}

export interface NiubizClientData {
  email: string;
  nombre: string;
  apellido: string;
  idcliente: string;
  ip: string;
  diasRegistrado?: number;
}

export interface NiubizPaymentRequest {
  importe: number;
  purchaseNumber: string;
  clientData: NiubizClientData;
}

export interface NiubizPaymentResponse {
  success: boolean;
  error: boolean;
  errorCode?: number;
  errorMessage?: string;
  order?: {
    purchaseNumber: string;
    amount: number;
    currency: string;
    authorizationCode?: string;
    transactionId?: string;
  };
  dataMap?: {
    CARD: string;
    BRAND: string;
    STATUS: string;
    ACTION_DESCRIPTION: string;
    ACTION_CODE: string;
  };
  rawResponse?: any;
}

const CONTROLADOR_PAGO = 'pago';
const ACCION_SESION = 'niubiz/sesion';
const ACCION_AUTORIZAR = 'niubiz/autorizar';
const CANAL = 'web';

@Injectable({
  providedIn: 'root'
})
export class NiubizService {

  private sesion: NiubizSesion | null = null;
  private currentRequest: NiubizPaymentRequest | null = null;

  // Se registra al iniciar un pago y se quita al responder o cancelar.
  private paymentSuccessHandler: ((event: any) => void) | null = null;

  // true mientras el POST de autorización está en vuelo. Permite que un componente que se
  // destruye en ese momento no cancele el pago y el servicio alcance a registrarlo.
  public autorizacionEnCurso = false;

  private paymentResponseSubject = new Subject<NiubizPaymentResponse>();
  public paymentResponse$ = this.paymentResponseSubject.asObservable();

  private readyToRenderSubject = new Subject<void>();
  public readyToRender$ = this.readyToRenderSubject.asObservable();

  constructor(
    private crudService: CrudHttpService,
    private infoTokenService: InfoTockenService
  ) { }

  processPayment(request: NiubizPaymentRequest): Observable<NiubizPaymentResponse> {
    this.currentRequest = request;

    return new Observable(observer => {
      const subscription = this.paymentResponse$.subscribe({
        next: (response) => {
          observer.next(response);
          observer.complete();
          subscription.unsubscribe();
        },
        error: (err) => {
          observer.error(err);
          subscription.unsubscribe();
        }
      });

      this.initPaymentFlow();
    });
  }

  private initPaymentFlow(): void {
    if (!this.currentRequest) {
      this.emitError('No hay datos de pago configurados');
      return;
    }

    this.crudService.postFree(this.buildSesionBody(), CONTROLADOR_PAGO, ACCION_SESION, false)
      .subscribe({
        next: (res: any) => {
          if (!res || res.success !== true || !res.data || !res.data.sessionKey) {
            this.emitError('No se pudo iniciar el pago con tarjeta');
            return;
          }
          this.sesion = res.data as NiubizSesion;

          // Notificar que está listo para renderizar (el componente debe mostrar el contenedor)
          this.readyToRenderSubject.next();

          setTimeout(() => this.renderPaymentButton(), 100);
        },
        error: (err) => this.emitError('Error al iniciar el proceso de pago', err)
      });
  }

  private buildSesionBody(): any {
    const request = this.currentRequest;
    return {
      idsede: Number(this.infoTokenService.getInfoSedeToken()),
      amount: request.importe,
      purchaseNumber: request.purchaseNumber,
      channel: CANAL,
      clientData: this.buildClientData()
    };
  }

  // El backend arma con esto el bloque antifraud/merchantDefineData que antes se
  // construía en el navegador (MDD4, MDD32, MDD75, MDD77, MDD89).
  private buildClientData(): any {
    const client = this.currentRequest && this.currentRequest.clientData;
    if (!client) {
      return null;
    }
    return {
      email: client.email || '',
      idcliente: client.idcliente || '0',
      ip: client.ip || '0.0.0.0',
      diasRegistrado: client.diasRegistrado || 0
    };
  }

  private startPaymentListener(): void {
    this.stopPaymentListener();
    this.paymentSuccessHandler = (event: any) => {
      if (event && event.detail) {
        this.processAuthorization(event.detail);
      }
    };
    window.addEventListener('payment.success', this.paymentSuccessHandler);
  }

  private stopPaymentListener(): void {
    if (this.paymentSuccessHandler) {
      window.removeEventListener('payment.success', this.paymentSuccessHandler);
      this.paymentSuccessHandler = null;
    }
  }

  private renderPaymentButton(): void {
    if (!this.currentRequest || !this.currentRequest.clientData || !this.sesion) {
      this.emitError('Datos del cliente no disponibles');
      return;
    }
    const client = this.currentRequest.clientData;
    const sesion = this.sesion;
    const containerId = 'niubiz-payment-container';
    const formId = 'niubiz-payment-form';

    // Limpiar contenedor previo si existe
    this.cleanupPaymentButton();

    // Esperar un momento para asegurar que el DOM esté limpio
    setTimeout(() => {
      const container = document.getElementById(containerId);
      if (!container) {
        this.emitError('Contenedor de pago no encontrado');
        return;
      }

      // Asegurar que el contenedor esté completamente vacío
      container.innerHTML = '';

      // Solo se escucha la respuesta mientras el formulario está abierto
      this.startPaymentListener();

      // Crear formulario
      const form = document.createElement('form');
      form.setAttribute('method', 'post');
      form.setAttribute('action', 'javascript:responseFormNiubiz(self)');
      form.setAttribute('id', formId);
      container.appendChild(form);

      // Crear script de Niubiz
      const script = document.createElement('script');
      script.setAttribute('src', sesion.urlJs);
      script.setAttribute('data-sessiontoken', sesion.sessionKey);
      script.setAttribute('data-channel', CANAL);
      script.setAttribute('data-merchantid', sesion.merchantId);
      script.setAttribute('data-purchasenumber', sesion.purchaseNumber);
      script.setAttribute('data-amount', this.currentRequest.importe.toFixed(2));
      script.setAttribute('data-merchantlogo', sesion.logo);
      script.setAttribute('data-expirationminutes', '8');
      script.setAttribute('data-timeouturl', 'javascript:responseFormNiubiz(self)');
      script.setAttribute('data-cardholdername', client.nombre);
      script.setAttribute('data-cardholderlastname', client.apellido);
      script.setAttribute('data-cardholderemail', client.email);
      script.setAttribute('data-usertoken', client.email);

      form.appendChild(script);
    }, 50);
  }

  private processAuthorization(transactionToken: string): void {
    if (!this.currentRequest || !this.sesion) {
      this.emitError('No hay datos de pago para autorizar');
      return;
    }

    // El token llega una sola vez; a partir de aquí ya no se escucha el evento.
    this.stopPaymentListener();

    const body = {
      idsede: Number(this.infoTokenService.getInfoSedeToken()),
      purchaseNumber: this.sesion.purchaseNumber,
      amount: this.currentRequest.importe,
      transactionToken: transactionToken,
      channel: CANAL,
      clientData: this.buildClientData()
    };

    this.autorizacionEnCurso = true;

    this.crudService.postFree(body, CONTROLADOR_PAGO, ACCION_AUTORIZAR, false)
      .subscribe({
        next: (res: any) => {
          this.autorizacionEnCurso = false;
          this.emitAuthorizationResponse(res);
        },
        error: (err) => {
          this.autorizacionEnCurso = false;
          this.emitError('Error al procesar la autorización', err);
        }
      });
  }

  private emitAuthorizationResponse(res: any): void {
    const data = (res && res.data) ? res.data : {};

    this.cleanupPaymentButton();

    // misma lectura que pago-tarjeta-visanet: el backend ya evaluo el ACTION_CODE
    if (!autorizacionExitosa(res)) {
      this.paymentResponseSubject.next({
        success: false,
        error: true,
        errorCode: data.errorCode,
        errorMessage: data.errorMessage || (data.data && data.data.ACTION_DESCRIPTION) || (res && res.error),
        rawResponse: data
      });
      return;
    }

    this.paymentResponseSubject.next({
      success: true,
      error: false,
      order: {
        purchaseNumber: data.order && data.order.purchaseNumber,
        amount: data.order && data.order.amount,
        currency: data.order && data.order.currency,
        authorizationCode: data.order && data.order.authorizationCode,
        transactionId: data.order && data.order.transactionId
      },
      dataMap: {
        CARD: data.dataMap && data.dataMap.CARD,
        BRAND: data.dataMap && data.dataMap.BRAND,
        STATUS: data.dataMap && data.dataMap.STATUS,
        ACTION_DESCRIPTION: data.dataMap && data.dataMap.ACTION_DESCRIPTION,
        ACTION_CODE: data.dataMap && data.dataMap.ACTION_CODE
      },
      rawResponse: data
    });
  }

  private cleanupPaymentButton(): void {
    const form = document.getElementById('niubiz-payment-form');
    if (form) {
      form.remove();
    }

    const wrapper = document.getElementById('visaNetWrapper');
    if (wrapper) {
      wrapper.remove();
    }
  }

  private emitError(message: string, error?: any): void {
    console.error(message, error);
    this.stopPaymentListener();
    this.paymentResponseSubject.next({
      success: false,
      error: true,
      errorMessage: message,
      rawResponse: error
    });
  }

  cancelPayment(): void {
    this.stopPaymentListener();
    this.cleanupPaymentButton();
    this.currentRequest = null;
    this.sesion = null;

    // Limpiar también el contenedor principal
    const container = document.getElementById('niubiz-payment-container');
    if (container) {
      container.innerHTML = '';
    }
  }
}
