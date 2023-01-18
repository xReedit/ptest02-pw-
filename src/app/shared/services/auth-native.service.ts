import { Injectable, OnInit, NgZone, Inject } from '@angular/core';
import { AuthService, AuthConfig } from '@auth0/auth0-angular';
import { Browser } from '@capacitor/browser';
import { mergeMap, switchMap, tap } from 'rxjs/operators';
import { App } from '@capacitor/app';
import { callbackUri } from 'src/app/auth.config';
import { DOCUMENT } from '@angular/common';
import { VerifyAuthClientService } from './verify-auth-client.service';
import { NavigatorLinkService } from './navigator-link.service';
import { Router } from '@angular/router';

// const callbackUri = IS_NATIVE ? `${config.appId}://dev-m48s1pe2.auth0.com/capacitor/${config.appId}/callback` : 'http://localhost:4200';
// const callbackUri = `<%= "${config.appId}" %>://dev-m48s1pe2.auth0.com/capacitor/<%= "${config.appId}" %>/callback`;



@Injectable({
  providedIn: 'root'
})
export class AuthNativeService {

isLoginSuccess = false;

public userAuthNative$ = this.authNative.isAuthenticated$.pipe(switchMap(() => this.authNative.user$));  

    processLoginInit = false;

  constructor(public authNative: AuthService,
      private ngZone: NgZone,
      private router: Router,
      @Inject(DOCUMENT) private doc: Document,) {
      this.userAuthNative$.subscribe(res => {        
            console.log('AuthService ressss ===>> user ', JSON.stringify(res));
            if (res) {
                this.isLoginSuccess = true;
                this.usLoginSuccess(res);
            }
      })
    }

    usLoginSuccess(user: any) {        
        // if (!this.processLoginInit) {
        //     this.loginWithRedirect();
        //     this.processLoginInit = false;
        //     window.location.reload();
        //     // this.router.navigate(['/callback-auth']);
        //     return;
        // }


        // let clientSocket = this.verifyAuthClientService.getClientSocket();
        // clientSocket = user;
        // clientSocket.isCliente = true;
        // this.verifyAuthClientService.setDataClient();
        // this.verifyAuthClientService.registerCliente();
        // console.log('lo he redireccionado a callback-auth');
        // this.navigateService._router('/callback-auth');
    }
    
    async login(op: number = 0) {
        this.processLoginInit = true;
        const arr_proveedor = ['google-oauth2', 'facebook', 'apple']
        const _proveedor = arr_proveedor[op]
        
        // console.log('callbackUri', callbackUri);        

        // await this.authNative.loginWithRedirect({ noRedirect: true });
        this.authNative
            .buildAuthorizeUrl({
                connection: _proveedor,
                // appState: {
                //     targetUrl: '/callback-auth',
                // }
            })
            .pipe(mergeMap((url) => Browser.open({ url, windowName: '_self' })))
            .subscribe();
    } 
    
    async loginWithRedirect() {
        // const params = {
        //     appState: {
        //         targetUrl: '/callback',
        //     },
        // };
        // const _url = await this.auth.buildAuthorizeUrl(params);

        // await Browser.open({
        //     presentationStyle: 'popover',
        //     _url,
        // });


        this.authNative.loginWithRedirect();
    }

    listen() {
        // Use Capacitor's App plugin to subscribe to the `appUrlOpen` event
        App.addListener('appUrlOpen', ({ url }) => {
        // Must run inside an NgZone for Angular to pick up the changes
        // https://capacitorjs.com/docs/guides/angular
        this.ngZone.run(() => {
                if (url?.startsWith(callbackUri)) {
                // If the URL is an authentication callback URL..
                if (
                    url.includes('state=') &&
                    (url.includes('error=') || url.includes('code='))
                ) {
                    // Call handleRedirectCallback and close the browser                                        
                    this.authNative
                    .handleRedirectCallback(url)
                    .pipe(mergeMap(() => Browser.close()))
                    .subscribe();                 

                    this.processLoginInit = false;
                    this.router.navigate(['/callback-auth']);
                } else {
                    Browser.close();
                }
                }
            });
        });
    }

    logout() {        
        this.authNative.logout({ localOnly: true, returnTo: this.doc.location.origin });
        this.authNative.buildLogoutUrl();
        // this.auth.logout();

        // this.auth
        //   .buildLogoutUrl({ returnTo: callbackUri })
        //   .pipe(
        //     tap(async (url) => {
        //       this.auth.logout();

        //     //   Browser.open({ url, windowName: '_self' });
        //     })
        //   )
        //   .subscribe();
    }
}
