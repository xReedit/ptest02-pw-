// var user = "integraciones.visanet@necomplus.com";
// var password = "d5e7nk$M";

var importe;
var purchasenumber;
var cargando_transaction = false;
var dataCliente;

var user = "integraciones.visanet@necomplus.com";
var password = "d5e7nk$M";
var merchantId = '522591303';
var urlApiSeguridad = "https://apitestenv.vnforapps.com/api.security/v1/security";
var urlApiSesion = "https://apitestenv.vnforapps.com/api.ecommerce/v2/ecommerce/token/session/";
var urlApiAutorization =  "https://apitestenv.vnforapps.com/api.authorization/v3/authorization/ecommerce/";
var urlJs = "https://static-content-qas.vnforapps.com/v2/js/checkout.js?qa=true";


// PROD
// var user = "macraze.info@gmail.com";
// var password = "j34Oz!nB";
// var merchantId = '650149801';
// var urlApiSeguridad = "https://apiprod.vnforapps.com/api.security/v1/security";
// var urlApiSesion = "https://apiprod.vnforapps.com/api.ecommerce/v2/ecommerce/token/session/";
// var urlApiAutorization =  "https://apiprod.vnforapps.com/api.authorization/v3/authorization/ecommerce/";
// var urlJs = "https://static-content.vnforapps.com/v2/js/checkout.js"; bWFjcmF6ZS5pbmZvQGdtYWlsLmNvbTpqMzRPeiFuQg==


function pagar(_importe, _purchasenumber, _dataClie) {
  importe = _importe;
  purchasenumber = _purchasenumber;
  dataCliente = _dataClie;
  
  loaderTransaction(0);
  loaderTransactionResponse(null, false);
  generarToken();
}

function generarToken() {
  var settings = {
    "async": true,
    "crossDomain": true,
    "url": urlApiSeguridad,
    "method": "POST",
    "headers": {
      "Authorization": "Basic aW50ZWdyYWNpb25lcy52aXNhbmV0QG5lY29tcGx1cy5jb206ZDVlN25rJE0=",
      "Accept": "*/*"
    }
  }

  $.ajax(settings).done(function (response) {
    console.log(response);
    generarSesion(response);
    localStorage.setItem("token", response);
  });
}

function generarSesion(token) {
  console.log('importe: ', importe);

  var data = {
    "amount": importe,
    "antifraud": null,
    "channel": "web",
    "recurrenceMaxAmount": null
  };

  var settings = {
    "async": true,
    "crossDomain": true,
    "url": urlApiSesion + merchantId,
    "method": "POST",
    "headers": {
      "Authorization": token,
      "Content-Type": "application/json",
    },
    "processData": false,
    "data": JSON.stringify(data)
  }

  $.ajax(settings).done(function (response) {
    console.log(response);
    generarBoton(response['sessionKey']);
  });
}

function generarBoton(sessionKey) {  
  var moneda = 'PEN';
  
  /// DEV
  // var nombre = 'Integraciones';
  // var apellido = 'VisaNet';
  // var email = 'integraciones.visanet@necomplus.com';
  
  // PROD
  var nombre = dataCliente.nombre;
  var apellido = dataCliente.apellido;
  var email = dataCliente.email;  

  var json = {
    "merchantId": merchantId,
    "moneda": moneda,
    "nombre": nombre,
    "apellido": apellido,
    "importe": importe,
    "email": email
  }

  localStorage.setItem("data", JSON.stringify(json));  
  

  var form = document.createElement("form");
  form.setAttribute('method', "post");
  form.setAttribute('action', "javascript:responseForm(self)");
  form.setAttribute('id', "boton_pago");
  document.getElementById("btn_pago").appendChild(form);

  let scriptEl = document.createElement('script');
  scriptEl.setAttribute('src', urlJs);
  scriptEl.setAttribute('data-sessiontoken', sessionKey);
  scriptEl.setAttribute('data-merchantid', merchantId);
  scriptEl.setAttribute('data-purchasenumber', purchasenumber);
  scriptEl.setAttribute('data-channel', 'web');
  scriptEl.setAttribute('data-amount', importe);
  scriptEl.setAttribute('data-cardholdername', nombre);
  scriptEl.setAttribute('data-cardholderlastname', apellido);
  scriptEl.setAttribute('data-cardholderemail', email);
  scriptEl.setAttribute('data-timeouturl', "javascript:responseForm(self)");
  document.getElementById("boton_pago").appendChild(scriptEl);

  document.getElementById("btn-disabled").classList.add("btn-hidden");

}

function responseForm(event) {
  console.log('respuesta', event.message.args[0]);
  loaderTransaction(1);

  const data = event.message.args[0];
  transactionToken  = data.token;
  
  generateAutorizacion(transactionToken);

}

function generateAutorizacion(transactionToken) {
  cargando_transaction = true;
  var token = localStorage.getItem("token");
  var  data = { 
        "antifraud" : null,
        "captureType" : "manual",
        "channel" : "web",
        "countable" : false,
        "order" : {
            "amount" : importe,
            "tokenId" : transactionToken,
            "purchaseNumber" : purchasenumber,
            "currency" : "PEN"
        }
    };

  const _url = urlApiAutorization + merchantId;

  fetch(_url, {
      method: 'POST',
      headers: {
        "Authorization": token,
        "Content-Type": 'application/json'
      },    
      body: JSON.stringify(data)
    })
    .then((response) => {
      return response.json();
    })
    .then((res) => {
      console.log(res);      
      const hayError = res.errorCode ? true : false;
      loaderTransaction(0);            
      loaderTransactionResponse(res, hayError);
    })
    .catch((error) => {      
      loaderTransaction(0);
      loaderTransactionResponse(error, true);
      console.log(error);
    });

}

// 0 = false 1 = true;
function loaderTransaction(val) {
  localStorage.setItem('sys::transaction-load', val);
}

function loaderTransactionResponse(res, isError) {  
  if ( res ) {
    res.error = isError;


    var elem = document.querySelector('#visaNetWrapper');
    elem.parentNode.removeChild(elem); 
  }
  localStorage.setItem('sys::transaction-response', JSON.stringify(res));   
}