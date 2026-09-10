// Callback que invoca el checkout de Niubiz. Solo reenvia el token como evento:
// la sesion y la autorizacion las hace el backend (PagoTarjetaVisanetService).
function responseFormProd(event) {
  var data = this.message.args[0];
  var transactionToken = data.token;

  const _event = new CustomEvent("payment.success", 
            {
                detail: transactionToken,
                bubbles: true,
                cancelable: true
            }
        );    
  window.dispatchEvent(_event);  

}