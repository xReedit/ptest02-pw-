import { Injectable } from '@angular/core';
import { Observable, Subject, from } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface NiubizConfig {
  merchantId: string;
  urlApiSeguridad: string;
  urlApiSesion: string;
  urlApiAutorizacion: string;
  urlJs: string;
  logo: string;
  authorization: string;
}

export interface NiubizClientData {
  email: string;
  nombre: string;
  apellido: string;
  idcliente: string;
  ip: string;
  diasRegistrado?: number;
}

export interface NiubizAntifraud {
  clientIp: string;
  merchantDefineData: {
    MDD4: string;
    MDD32: string;
    MDD75: string;
    MDD77: number;
    MDD89: string;
  };
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

@Injectable({
  providedIn: 'root'
})
export class NiubizService {

  private config: NiubizConfig;
  private tokenAcceso: string = '';
  private currentRequest: NiubizPaymentRequest | null = null;
  
  private paymentResponseSubject = new Subject<NiubizPaymentResponse>();
  public paymentResponse$ = this.paymentResponseSubject.asObservable();

  private readyToRenderSubject = new Subject<void>();
  public readyToRender$ = this.readyToRenderSubject.asObservable();

  constructor() {
    this.config = environment.niubiz;
    this.setupPaymentListener();
  }

  private setupPaymentListener(): void {
    window.addEventListener('payment.success', (event: any) => {
      if (event.detail) {
        this.processAuthorization(event.detail);
      }
    });
  }

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

  private async initPaymentFlow(): Promise<void> {
    if (!this.currentRequest) {
      this.emitError('No hay datos de pago configurados');
      return;
    }

    try {
      this.tokenAcceso = await this.getAccessToken();
      const sessionKey = await this.getSessionToken(this.tokenAcceso);
      
      // Notificar que está listo para renderizar (el componente debe mostrar el contenedor)
      this.readyToRenderSubject.next();
      
      // Esperar un momento para que el DOM se actualice
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.renderPaymentButton(sessionKey);
    } catch (error) {
      this.emitError('Error al iniciar el proceso de pago', error);
    }
  }

  private async getAccessToken(): Promise<string> {
    const response = await fetch(this.config.urlApiSeguridad, {
      method: 'POST',
      headers: {
        'Authorization': this.config.authorization,
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener token de acceso');
    }

    return response.text();
  }

  private async getSessionToken(accessToken: string): Promise<string> {
    if (!this.currentRequest) {
      throw new Error('No hay datos de pago configurados');
    }

    const url = `${this.config.urlApiSesion}${this.config.merchantId}`;
    
    const body = {
      amount: this.currentRequest.importe,
      antifraud: this.buildAntifraudData(),
      channel: 'web',
      recurrenceMaxAmount: null
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error('Error al obtener token de sesión');
    }

    const data = await response.json();
    return data.sessionKey;
  }

  private buildAntifraudData(): NiubizAntifraud | null {
    if (!this.currentRequest?.clientData) {
      return null;
    }
    const client = this.currentRequest.clientData;
    return {
      clientIp: client.ip || '0.0.0.0',
      merchantDefineData: {
        MDD4: client.email || '',
        MDD32: client.idcliente || '0',
        MDD75: 'Invitado',
        MDD77: client.diasRegistrado || 0,
        MDD89: '1'
      }
    };
  }

  private renderPaymentButton(sessionKey: string): void {
    if (!this.currentRequest?.clientData) {
      this.emitError('Datos del cliente no disponibles');
      return;
    }
    const client = this.currentRequest.clientData;
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

      // Crear formulario
      const form = document.createElement('form');
      form.setAttribute('method', 'post');
      form.setAttribute('action', 'javascript:responseFormNiubiz(self)');
      form.setAttribute('id', formId);
      container.appendChild(form);

      // Crear script de Niubiz
      const script = document.createElement('script');
      script.setAttribute('src', this.config.urlJs);
      script.setAttribute('data-sessiontoken', sessionKey);
      script.setAttribute('data-channel', 'web');
      script.setAttribute('data-merchantid', this.config.merchantId);
      script.setAttribute('data-purchasenumber', this.currentRequest!.purchaseNumber);
      script.setAttribute('data-amount', this.currentRequest!.importe.toFixed(2));
      script.setAttribute('data-merchantlogo', this.config.logo);
      script.setAttribute('data-expirationminutes', '8');
      script.setAttribute('data-timeouturl', 'javascript:responseFormNiubiz(self)');
      script.setAttribute('data-cardholdername', client.nombre);
      script.setAttribute('data-cardholderlastname', client.apellido);
      script.setAttribute('data-cardholderemail', client.email);
      script.setAttribute('data-usertoken', client.email);

      form.appendChild(script);
    }, 50);
  }

  private async processAuthorization(transactionToken: string): Promise<void> {
    if (!this.currentRequest) {
      this.emitError('No hay datos de pago para autorizar');
      return;
    }

    try {
      const url = `${this.config.urlApiAutorizacion}${this.config.merchantId}`;
      console.log('urlAutorizacion', url)
      
      const body = {
        antifraud: this.buildAntifraudData(),
        captureType: 'manual',
        channel: 'web',
        countable: false,
        order: {
          amount: this.currentRequest.importe,
          currency: 'PEN',
          purchaseNumber: this.currentRequest.purchaseNumber,
          tokenId: transactionToken
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.tokenAcceso,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      console.log('dataAutorizacion', data)
      
      this.cleanupPaymentButton();
      
      if (data.errorCode) {
        this.paymentResponseSubject.next({
          success: false,
          error: true,
          errorCode: data.errorCode,
          errorMessage: data.errorMessage || data.data?.ACTION_DESCRIPTION,
          rawResponse: data
        });
      } else {
        this.paymentResponseSubject.next({
          success: true,
          error: false,
          order: {
            purchaseNumber: data.order?.purchaseNumber,
            amount: data.order?.amount,
            currency: data.order?.currency,
            authorizationCode: data.order?.authorizationCode,
            transactionId: data.order?.transactionId
          },
          dataMap: {
            CARD: data.dataMap?.CARD,
            BRAND: data.dataMap?.BRAND,
            STATUS: data.dataMap?.STATUS,
            ACTION_DESCRIPTION: data.dataMap?.ACTION_DESCRIPTION,
            ACTION_CODE: data.dataMap?.ACTION_CODE
          },
          rawResponse: data
        });
      }
    } catch (error) {
      this.emitError('Error al procesar la autorización', error);
    }
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
    this.paymentResponseSubject.next({
      success: false,
      error: true,
      errorMessage: message,
      rawResponse: error
    });
  }

  cancelPayment(): void {
    this.cleanupPaymentButton();
    this.currentRequest = null;
    this.tokenAcceso = '';
    
    // Limpiar también el contenedor principal
    const container = document.getElementById('niubiz-payment-container');
    if (container) {
      container.innerHTML = '';
    }
  }
}
