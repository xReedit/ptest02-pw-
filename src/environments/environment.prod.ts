import { envSecrets } from './env.secrets';

export const environment = {
  production: true,
  view_mozo: false, // true = app solo mozo // solo para vista incial
  googleMapsApiKey: envSecrets.googleMapsApiKey,
  apiUrl: 'https://app.restobar.papaya.com.pe/api.pwa/v3',
  socketUrl: 'https://app.restobar.papaya.com.pe/',
  speechSocketUrl: 'https://app.restobar.papaya.com.pe/',
  speechAudioUrl: 'https://app.restobar.papaya.com.pe/speech/resources/',
  imgCartaUrl: 'https://restobar.papaya.com.pe/file/',
  imgPromoUrl: 'https://restobar.papaya.com.pe/repositorio/img_promo/',
  imgComercioUrl: 'https://restobar.papaya.com.pe/print/logo/',
  imgIconsUrl: 'https://restobar.papaya.com.pe/images/',
  // Solo datos públicos. merchantId, credenciales y urls de la pasarela viven
  // en el backend (POST /pago/niubiz/sesion y /pago/niubiz/autorizar).
  niubiz: {
    urlJs: 'https://static-content.vnforapps.com/v2/js/checkout.js',
    logo: 'https://papaya.com.pe/images/l-pay-2.png'
  }
};
