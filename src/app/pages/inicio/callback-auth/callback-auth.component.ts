import { Component, OnInit, OnDestroy } from '@angular/core';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { take } from 'rxjs/internal/operators/take';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';

@Component({
  selector: 'app-callback-auth',
  templateUrl: './callback-auth.component.html',
  styleUrls: ['./callback-auth.component.css']
})
export class CallbackAuthComponent implements OnInit, OnDestroy {
  isProcesando = true;
  showErrornweVersion = false;
  private timerizador: any;
  private dataTpm: any;

  private veryfyClient: Subscription = null;

  constructor(
    private verifyClientService: VerifyAuthClientService,
    private router: Router,
    private authService: AuthService,
    private infoToken: InfoTockenService,
    private crudService: CrudHttpService
    ) { }

  ngOnInit() {

    // this.verifyClientService.verifyClient();
    // if ( this.showErrornweVersion ) {return; }
    try {

      // console.log('callbak verifyClient');

      this.veryfyClient = this.verifyClientService.verifyClient()
        .subscribe(res => {
          if ( !res ) {return; }
          this.isProcesando = false;
          // console.log('res idcliente', res);
          this.setInfoToken(res);
        });
    } catch (error) {
      this.errorShowVersion(error);
    }
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

      console.log('redirige');
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
          this.router.navigate(['./pedido']);
        } else {
          this.verifyClientService.setIsDelivery(true);
          this.router.navigate(['./zona-delivery']);
        }

      } else {
        this.router.navigate(['./pedido']);
      }
    } catch (error) {
      this.errorShowVersion(error);
    }
  }

  // para las versiones anteriores, si hay algun error, que se logueen nuevamente
  private errorShowVersion(error: any) {
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
