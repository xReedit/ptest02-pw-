// import { Injectable, OnInit, NgZone } from '@angular/core';
// import { AuthService, AuthConfig } from '@auth0/auth0-angular';
// import { Browser } from '@capacitor/browser';
// import { mergeMap } from 'rxjs/operators';
// import { App } from '@capacitor/app';
// import config from '../../../../capacitor.config';
// import { IS_NATIVE } from '../config/config.const';

// const callbackUri = IS_NATIVE ? `${config.appId}://dev-m48s1pe2.auth0.com/capacitor/${config.appId}/callback` : 'http://localhost:4200';
// // const callbackUri = `<%= "${config.appId}" %>://dev-m48s1pe2.auth0.com/capacitor/<%= "${config.appId}" %>/callback`;



// @Injectable({
//   providedIn: 'root'
// })
// export class AuthNativeService {

//   constructor(public auth: AuthService, private ngZone: NgZone) { }

//   login() {    
//     this.auth
//       .buildAuthorizeUrl()
//       .pipe(mergeMap((url) => Browser.open({ url, windowName: '_self' })))
//       .subscribe();
//   }

//   listen() {
//     // Use Capacitor's App plugin to subscribe to the `appUrlOpen` event
//     App.addListener('appUrlOpen', ({ url }) => {
//       // Must run inside an NgZone for Angular to pick up the changes
//       // https://capacitorjs.com/docs/guides/angular
//       this.ngZone.run(() => {
//         if (url?.startsWith(callbackUri)) {
//           // If the URL is an authentication callback URL..
//           if (
//             url.includes('state=') &&
//             (url.includes('error=') || url.includes('code='))
//           ) {
//             // Call handleRedirectCallback and close the browser
//             this.auth
//               .handleRedirectCallback(url)
//               .pipe(mergeMap(() => Browser.close()))
//               .subscribe();
//           } else {
//             Browser.close();
//           }
//         }
//       });
//     });
//   }
// }
