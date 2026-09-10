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
  vapidPublic: 'BOiwO8PftVFo8MrQfp3oAv4KbVtFdZAQojGKgzyxMCPgiNhg8PySbOSlkxDqd3iKA4J1GhzwFiCIGKmXRiKZM_0',
  niubiz: {
    merchantId: '650149801',
    urlApiSeguridad: 'https://apiprod.vnforapps.com/api.security/v1/security',
    urlApiSesion: 'https://apiprod.vnforapps.com/api.ecommerce/v2/ecommerce/token/session/',
    urlApiAutorizacion: 'https://apiprod.vnforapps.com/api.authorization/v3/authorization/ecommerce/',
    urlJs: 'https://static-content.vnforapps.com/v2/js/checkout.js',
    logo: 'https://papaya.com.pe/images/l-pay-2.png',
    authorization: 'Basic bWFjcmF6ZS5pbmZvQGdtYWlsLmNvbTpqMzRPeiFuQg=='
  }
};
