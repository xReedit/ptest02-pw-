// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { envSecrets } from './env.secrets';

export const environment = {
  production: false,
  view_mozo: false, // true = app solo mozo
  googleMapsApiKey: envSecrets.googleMapsApiKey,
  apiUrl: 'http://localhost:5819/v3',
  socketUrl: 'http://localhost:5819',
  speechSocketUrl: 'http://192.168.1.65:1337',
  speechAudioUrl: 'http://192.168.1.65:1337/resources/',
  imgCartaUrl: 'http://192.168.1.65/restobar/file/',
  imgPromoUrl: 'http://192.168.1.65/restobar/repositorio/img_promo/',
  imgComercioUrl: 'http://192.168.1.65/restobar/print/logo/',
  imgIconsUrl: 'http://192.168.1.65/restobar/images/',
  // Solo datos públicos. merchantId, credenciales y urls de la pasarela viven
  // en el backend (POST /pago/niubiz/sesion y /pago/niubiz/autorizar).
  niubiz: {
    urlJs: 'https://static-content-qas.vnforapps.com/v2/js/checkout.js?qa=true',
    logo: 'https://papaya.com.pe/images/l-pay-2.png'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
