// El backend (/pago/niubiz/autorizar) responde { success, data } y solo marca success:true
// cuando Niubiz devolvio ACTION_CODE '000'. Mirar unicamente data.errorCode daba por pagada
// una tarjeta rechazada (ACTION_CODE 116 llega sin errorCode).
export function autorizacionExitosa(rpta: any): boolean {
  return !!rpta && rpta.success === true && !rpta?.data?.errorCode;
}
