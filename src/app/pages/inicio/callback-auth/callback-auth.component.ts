import { Component, OnInit, OnDestroy } from '@angular/core';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { take } from 'rxjs/internal/operators/take';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { Auth0Service } from 'src/app/shared/services/auth0.service';

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
    private authService: AuthService,
    // private auth: Auth0Service,
    private infoToken: InfoTockenService,
    private crudService: CrudHttpService,
    ) { }

  ngOnInit() {



    try {

      let secondTimeReset = 0;
      this.timeReset = setInterval(() => {
        secondTimeReset++;
        if ( secondTimeReset > 9) {
          this.timeBtnReset = true;
          clearInterval(this.timeReset);
        }
      }, 1000);


      this.veryfyClient = this.verifyClientService.verifyClient()
        .subscribe((res: any) => {
          if ( !res ) { return; }
          if ( this.isResponseLogin ) {return; }
          // if ( this.fromLogin ) { return; }

          // si no tiene el datalogin entonces busca en login auth0
          if ( !res.datalogin ) {
            this.fromLogin = true;
            this.verifyClientService.verifyClientLogin()
            .subscribe(resLogin => {
              if ( !resLogin ) { return; }
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

  private setInfoToken(token: any): void {
    try {
      const _token = `eyCJ9.${btoa(JSON.stringify(token))}`;
      this.authService.setLocalToken(_token);
      this.authService.setLoggedStatus(true);
      this.infoToken.converToJSON();
      this.infoToken.setIsUsLoggedIn(true);

      let _linkToRedirec = this.verifyClientService.getLinkRedirecLogin();
      _linkToRedirec = _linkToRedirec ? _linkToRedirec : '';

      if ( _linkToRedirec !== '' ) {
        this.router.navigate([_linkToRedirec]);
        this.verifyClientService.setLinkRedirecLogin('');
        return;
      }

      if ( !this.infoToken.infoUsToken.direccionEnvioSelected && this.infoToken.isDelivery()) {

        // si cliente scaneo qr para delivery
        if ( this.verifyClientService.getIsQrSuccess() ) {
          // this.router.navigate(['./pedido']);
          this.goUrlRedirec('/pedido');
        } else {
          this.verifyClientService.setIsDelivery(true);
          this.goUrlRedirec('/zona-delivery');
        }

      } else {
        // this.router.navigate(['./pedido']);
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
