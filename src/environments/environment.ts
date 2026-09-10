// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { envSecrets } from './env.secrets';

export const environment = {
  production: true,
  view_mozo: false, // true = app solo mozo
  googleMapsApiKey: envSecrets.googleMapsApiKey,
  niubiz: {
    merchantId: '456879852',
    urlApiSeguridad: 'https://apisandbox.vnforappstest.com/api.security/v1/security',
    urlApiSesion: 'https://apisandbox.vnforappstest.com/api.ecommerce/v2/ecommerce/token/session/',
    urlApiAutorizacion: 'https://apisandbox.vnforappstest.com/api.authorization/v3/authorization/ecommerce/',
    urlJs: 'https://static-content-qas.vnforapps.com/v2/js/checkout.js?qa=true',
    logo: 'https://papaya.com.pe/images/l-pay-2.png',
    authorization: 'Basic aW50ZWdyYWNpb25lcy52aXNhbmV0QG5lY29tcGx1cy5jb206ZDVlN25rJE0='
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
