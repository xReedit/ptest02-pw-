import { envSecrets } from './env.secrets';

export const environment = {
  production: true,
  view_mozo: false, // true = app solo mozo // solo para vista incial
  googleMapsApiKey: envSecrets.googleMapsApiKey,
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
