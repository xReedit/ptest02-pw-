import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { ActivatedRoute, Router } from '@angular/router';
// import { AuthService } from 'src/app/shared/services/auth.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { take } from 'rxjs/internal/operators/take';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
// import { Auth0Service } from 'src/app/shared/services/auth0.service';

import { AuthService } from '@auth0/auth0-angular';
import { AuthServiceSotrage } from 'src/app/shared/services/auth.service';
import { Browser } from '@capacitor/browser';
import { callbackUri } from 'src/app/auth.config';
import { mergeMap } from 'rxjs/operators';
import { App } from '@capacitor/app';
import { UtilitariosService } from 'src/app/shared/services/utilitarios.service';


@Component({
  selector: 'app-callback-auth',
  templateUrl: './callback-auth.component.html',
  styleUrls: ['./callback-auth.component.css']
})
export class CallbackAuthComponent implements OnInit, OnDestroy {
  isProcesando = true;
  showErrornweVersion = false;
  timeBtnReset = false;
  isResponseLogin = false;
  private timerizador: any;
  private dataTpm: any;
  private fromLogin = false;

  private timeReset;
  // private isVerificado = false;

  private veryfyClient: Subscription = null;

  constructor(
    private verifyClientService: VerifyAuthClientService,
    private router: Router,
    private authService: AuthServiceSotrage,
    // private auth: Auth0Service,
    private infoToken: InfoTockenService,
    private crudService: CrudHttpService,
    public authNative: AuthService, //@auth0/auth0-angular
    private ngZone: NgZone,
    private utilitariosService: UtilitariosService
    ) { }

  ngOnInit() {


    // console.log('x === >> llegueeeee a callback');
    

    try {

      let secondTimeReset = 0;
      this.timeReset = setInterval(() => {
        secondTimeReset++;
        if ( secondTimeReset > 9) {
          this.timeBtnReset = true;
          clearInterval(this.timeReset);
        }
      }, 1000);      


      // console.log('verifyClient from callback');
      this.veryfyClient = this.verifyClientService.verifyClient()
        .subscribe((res: any) => {
          // console.log('x === >> llegueeeee a callback - res', res);
          if ( !res ) { return; }
          // console.log('x === >> llegueeeee a callback - isResponseLogin', this.isResponseLogin);
          if ( this.isResponseLogin ) {return; }
          // if ( this.fromLogin ) { return; }

          // si no tiene el datalogin entonces busca en login auth0
          // console.log('x === >> llegueeeee a callback - res.datalogin', res.datalogin);
          if ( !res.datalogin ) {
            this.fromLogin = true;
            this.verifyClientService.verifyClientLogin()
            .subscribe(resLogin => {
              // console.log('x === >> llegueeeee a callback - resLogin', resLogin);
              if ( !resLogin ) { return; }
              
              // await this.utilitariosService.delay(500)
              this.usLoginGo(resLogin);
            });
            return;
          }
          
          this.usLoginGo(res);

        });


    } catch (error) {
      this.errorShowVersion(error);
    }
  }

  private usLoginGo(resObservable: any) {
      // console.log('usLoginGo', resObservable);
      this.isResponseLogin = true;
      clearInterval(this.timeReset);
      this.isProcesando = false;
      this.setInfoToken(resObservable);
      setTimeout(() => {
        this.isResponseLogin = false;
      }, 500);
  }

  ngOnDestroy(): void {
    try {
      this.veryfyClient.unsubscribe();
    } catch (error) {
      this.errorShowVersion(error);
    }
  }

  private async setInfoToken(token: any) {
    
    try {
      const _token = `eyCJ9.${btoa(JSON.stringify(token))}`;
      this.authService.setLocalToken(_token);
      this.authService.setLoggedStatus(true);
      this.infoToken.converToJSON();
      this.infoToken.setIsUsLoggedIn(true);

      let _linkToRedirec = this.verifyClientService.getLinkRedirecLogin();
      _linkToRedirec = _linkToRedirec ? _linkToRedirec : '';

      // console.log('_linkToRedirec', _linkToRedirec);
      if ( _linkToRedirec !== '' ) {
        this.router.navigate([_linkToRedirec]);
        this.verifyClientService.setLinkRedirecLogin('');
        return;
      }

      if ( !this.infoToken.infoUsToken.direccionEnvioSelected && this.infoToken.isDelivery()) {

        // si cliente scaneo qr para delivery
        if ( this.verifyClientService.getIsQrSuccess() ) {
          // this.router.navigate(['./pedido']);
          // console.log('redirec', '/pedido');
          this.goUrlRedirec('/pedido');
        } else {
          // console.log('redirec', '/zona-delivery');
          this.verifyClientService.setIsDelivery(true);
          this.goUrlRedirec('/zona-delivery');
        }

      } else {
        // this.router.navigate(['./pedido']);
        // this.goUrlRedirec('/pedido2');
        this.goUrlRedirec('/pedido');
      }
    } catch (error) {
      this.errorShowVersion(error);
    }
  }

  private goUrlRedirec(_url: string) {
    // console.log('goUrlRedirec', _url);
    setTimeout(() => {
      this.router.navigate([_url]);
    }, 300);
  }

  // para las versiones anteriores, si hay algun error, que se logueen nuevamente
  errorShowVersion(error: any) {
    // console.log('errorShowVersion', error);
    this.showErrornweVersion = true;

    // guarda el error
    const dataSend = {
      elerror: error,
      elorigen: 'callback-auth'
    };

    this.crudService.postFree(dataSend, 'error', 'set-error', false)
    .subscribe(res => console.log(res));

    this.timerizador = setTimeout(() => {
      this.loginOut();
    }, 4000);
  }

  loginOut() {
    this.timerizador = null;
    this.infoToken.cerrarSession();
    localStorage.clear();
    this.router.navigate(['../'])
      .then(() => {
          this.verifyClientService.loginOut();
          window.location.reload();
      });
  }

}
