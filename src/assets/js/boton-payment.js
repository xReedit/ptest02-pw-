function responseFormProd(event) {
  loaderTransaction(1);

  var data = this.message.args[0];
  transactionToken  = data.token;

  const _event = new CustomEvent("payment.success", 
            {
                detail: transactionToken,
                bubbles: true,
                cancelable: true
            }
        );    
  window.dispatchEvent(_event);  

}