import { HostListener, Injectable } from '@angular/core';
import { FetchOptions } from '@auth0/auth0-spa-js';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

declare var pagar: any;

@Injectable({
  providedIn: 'root'
})
export class PagoTarjetaVisanetService {

  private importe: any;
  private purchasenumber: any;
  private cargando_transaction = false;
  private dataCliente: any;
  private tokenGenerate: any;

  private parametros = [
    { // 0 DESARROLLO
      user : 'integraciones.visanet@necomplus.com',
      password : 'd5e7nk$M',
      merchantId : '522591303',
      urlApiSeguridad : 'https://apitestenv.vnforapps.com/api.security/v1/security',
      urlApiSesion : 'https://apitestenv.vnforapps.com/api.ecommerce/v2/ecommerce/token/session/',
      urlApiAutorization :  'https://apitestenv.vnforapps.com/api.authorization/v3/authorization/ecommerce/',
      urlJs : 'https://static-content-qas.vnforapps.com/v2/js/checkout.js?qa=true',
      logo : 'http://web-p.test:8080/images/l-pay-2.png',
      Authorization : 'Basic aW50ZWdyYWNpb25lcy52aXNhbmV0QG5lY29tcGx1cy5jb206ZDVlN25rJE0='
    }, { // 1 PROD
      user : 'macraze.info@gmail.com',
      password : 'j34Oz!nB',
      merchantId : '650149801',
      urlApiSeguridad : 'https://apiprod.vnforapps.com/api.security/v1/security',
      urlApiSesion : 'https://apiprod.vnforapps.com/api.ecommerce/v2/ecommerce/token/session/',
      urlApiAutorization :  'https://apiprod.vnforapps.com/api.authorization/v3/authorization/ecommerce/',
      urlJs : 'https://static-content.vnforapps.com/v2/js/checkout.js"',
      logo : 'https://papaya.com.pe/images/l-pay-2.png',
      Authorization: 'Basic bWFjcmF6ZS5pbmZvQGdtYWlsLmNvbTpqMzRPeiFuQg=='
    }
  ];

  parametrosSelected: any;

  private listenPaymetResponseSource = new BehaviorSubject<any>(null);
  public listenPaymetResponse$ = this.listenPaymetResponseSource.asObservable();

  private listenPaymetLoaderSource = new BehaviorSubject<boolean>(false);
  public listenPaymetLoader$ = this.listenPaymetLoaderSource.asObservable();

  constructor() {

    this.parametrosSelected = this.parametros[0];

    window.addEventListener('payment.success', (event: any) => {
      this.generateAutorizacion(event.detail);
    });
  }



  processPayment(_importe, _purchasenumber, _dataClie) {

    this.importe = parseFloat(_importe).toFixed(2).toString();
    this.purchasenumber = _purchasenumber;
    this.dataCliente = _dataClie;
    // dataCliente.email_token = dataCliente.idcliente +'@apitoken.com'; // para guardar las tarjetas - userToken
    this.dataCliente.email_token = this.dataCliente.email;
    this.getIpCliente();
  }

  private getIpCliente() {

    // antifraude
    this.dataCliente.antifraud = {
        'clientIp': this.dataCliente.ip,
        'merchantDefineData': {
          'MDD4': this.dataCliente.email,
          'MDD32': this.dataCliente.idcliente,
          'MDD75': 'Invitado',
          'MDD77': this.dataCliente.diasRegistrado,
          'MDD89': '1'
          // "MDD70": "1", // correo electronico confirmado
        }
    };

    this.generarToken();
  }


  private generarToken() {
    const _url = this.parametrosSelected.urlApiSeguridad;
    const settings = {
      'async': true,
      'crossDomain': true,
      // 'url': this.parametrosSelected.urlApiSeguridad,
      'method': 'POST',
      'headers': {
        'Authorization': this.parametrosSelected.Authorization,
        'content-type' : 'text/plain',
        'Accept': '*/*'
      }
    };

    fetch(_url, settings)
      .then((response) => response.text())
      .then(response => {
        this.tokenGenerate = response;
        this.generarSesion(response);
      });

  }

  private generarSesion(token) {

    const data = {
      'amount': this.importe,
      'antifraud': null,
      'channel': 'web',
      'recurrenceMaxAmount': null
    };

    const settings = {
      'async': true,
      'crossDomain': true,
      'url': this.parametrosSelected.urlApiSesion + this.parametrosSelected.merchantId,
      'method': 'POST',
      'headers': {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      'dataMap': {
        'userToken': this.dataCliente.email
      },
      'processData': false,
      'body': JSON.stringify(data)
    };

    const _url = this.parametrosSelected.urlApiSesion + this.parametrosSelected.merchantId;

    fetch(_url, settings)
    .then((response) => response.json())
    .then(response => {
      this.generarBoton(response['sessionKey']);
    });
  }


  private generarBoton(sessionKey) {
    const moneda = 'PEN';

    /// DEV
    // var nombre = 'Integraciones';
    // var apellido = 'VisaNet';
    // var email = 'integraciones.visanet@necomplus.com';

    // PROD
    const nombre = this.dataCliente.nombre;
    const apellido = this.dataCliente.apellido;
    const email = this.dataCliente.email;

    const json = {
      'merchantId': this.parametrosSelected.merchantId,
      'moneda': moneda,
      'nombre': nombre,
      'apellido': apellido,
      'importe': this.importe,
      'email': email
    };

    // localStorage.setItem('data', JSON.stringify(json));


    const form = document.createElement('form');
    form.setAttribute('method', 'post');
    form.setAttribute('action', 'javascript:responseFormProd(self)');
    form.setAttribute('id', 'boton_pago');
    document.getElementById('btn_pago').appendChild(form);

    const scriptEl = document.createElement('script');
    scriptEl.setAttribute('src', this.parametrosSelected.urlJs);
    scriptEl.setAttribute('data-sessiontoken', sessionKey);
    scriptEl.setAttribute('data-channel', 'web');
    scriptEl.setAttribute('data-merchantid', this.parametrosSelected.merchantId);

    scriptEl.setAttribute('data-purchasenumber', this.purchasenumber);
    scriptEl.setAttribute('data-amount', this.importe);

    scriptEl.setAttribute('data-merchantlogo', this.parametrosSelected.logo);

    scriptEl.setAttribute('data-expirationminutes', '8');
    scriptEl.setAttribute('data-timeouturl', 'javascript:responseFormProd(self)');

    scriptEl.setAttribute('data-cardholdername', nombre);
    scriptEl.setAttribute('data-cardholderlastname', apellido);
    scriptEl.setAttribute('data-cardholderemail', email);
    scriptEl.setAttribute('data-usertoken', email);

    document.getElementById('boton_pago').appendChild(scriptEl);
    document.getElementById('btn-disabled').classList.add('btn-hidden');

  }

  private async generateAutorizacion(transactionToken) {
    this.listenPaymetLoaderSource.next(true);
    this. cargando_transaction = true;
    const token = this.tokenGenerate; // localStorage.getItem("token");
    const  data = {
          'antifraud' : this.dataCliente.antifraud,
          'captureType' : 'manual',
          'channel' : 'web',
          'countable' : false,
          'order' : {
              'amount' : this.importe,
              'currency' : 'PEN',
              'purchaseNumber' : this.purchasenumber,
              'tokenId' : transactionToken,
          }
    };

    const _url = this.parametrosSelected.urlApiAutorization + this.parametrosSelected.merchantId;


    const settings  =  {
      'method': 'POST',
      'headers': {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
      'body': JSON.stringify(data)
    };

    fetch(_url, <FetchOptions>settings)
      .then((response) => response.json())
      .then((res) => {
        const hayError = res.errorCode ? true : false;
        res.error = hayError;

        this.loaderTransactionResponse(res, hayError);
        this.listenPaymetResponseSource.next(res);
      })
      .catch((error) => {
        error.error = true;

        this.loaderTransactionResponse(error, true);
        this.listenPaymetResponseSource.next(error);
        // loaderTransaction(0);
        // console.log(error);
      });
  }

  private loaderTransactionResponse(res, isError) {
    if ( res ) {
      res.error = isError;
      const elem = document.querySelector('#visaNetWrapper');
      elem.parentNode.removeChild(elem);
    }
    // localStorage.setItem('sys::transaction-response', JSON.stringify(res));
  }

}
