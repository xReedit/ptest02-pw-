import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';
import { Router } from '@angular/router';
import { VIEW_APP_MOZO } from 'src/app/shared/config/config.const';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
// import { SpechTotextService } from 'src/app/shared/services/speech/spech-totext.service';
// import { SpechTTSService } from 'src/app/shared/services/speech/spech-tts.service';
// import { NotificacionPushService } from 'src/app/shared/services/notificacion-push.service';
// import { finalize } from 'rxjs/internal/operators/finalize';
// import { take } from 'rxjs/internal/operators/take';
// import { ListenStatusService } from 'src/app/shared/services/listen-status.service';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit, OnDestroy {
  loadAll = false;
  private veryfyClient: Subscription = null;

  isLogin = false;
  isCliente = false;
  nombreClientSocket = '';
  isViewOnlyMozo = VIEW_APP_MOZO;

  private countnDev = 0;
  private countLogo = 0;
  constructor(
    private verifyClientService: VerifyAuthClientService,
    private router: Router,
    private infoToken: InfoTockenService
    // private webSocketService: WebsocketService
    ) { }

  ngOnInit() {
    // console.log('llego a inicio');
    // this.router.navigate(['/lector-qr']);

    this.nombreClientSocket = '';
    // screen.orientation.unlock();

    // setTimeout(() => {
      this.loadInit();
    // }, 800);

    setTimeout(() => {
      this.loadAll = true;

      const _infotoken = this.infoToken.getInfoUs();

      if ( _infotoken ) {
        this.infoToken.setIsUsuarioAutorizacion(false);
      }

      // document.body.style.backgroundColor = '#fff';
      // document.body.style.background = '#fff';
    }, 2000);
  }

  private loadInit(): void {
    this.verifyClientService.getDataClient();
    this.verifyClientService.setQrSuccess(false);
    this.verifyClientService.setIsDelivery(false);
    this.verifyClientService.setIsReserva(false);
    this.verifyClientService.setIsRetiroCash(false);
    this.verifyClientService.setLinkRedirecLogin('');
    this.verifyClientService.setDireccionDeliverySelected(null);

    this.isLogin = this.verifyClientService.isLogin();
    // console.log('desde incio', this.isLogin);

    this.verifyClientService.setMesa(null);
    this.verifyClientService.setIdOrg(null);
    this.verifyClientService.setIdSede(null);
    this.verifyClientService.setDataClient();


    if ( this.isLogin ) {
      this.isCliente = true;
      this.nombreClientSocket = this.verifyClientService.clientSocket.usuario;
      return; }

    this.veryfyClient = this.verifyClientService.verifyClient()
      // .pipe(finalize(() => localStorage.clear())) // si esta mal elimina todo
      .subscribe((res: SocketClientModel) => {
        // success => {

          if ( !res ) { return; }

          // si es invitado desloguea
          if ( res.usuario ) {
            if ( res?.usuario.toLowerCase().indexOf('invitado') > -1 ) {
              this.cerrarSession();
              return;
            }
          }

          this.isCliente = true;
          this.nombreClientSocket = res.usuario;
          this.isLogin = this.verifyClientService.getIsLoginByDNI() ? true : this.verifyClientService.isLogin() ? this.verifyClientService.isLogin() : res.datalogin ? true : this.verifyClientService.isLogin();
          this.verifyClientService.setLoginOn(this.isLogin);
          this.verifyClientService.setQrSuccess(false);
          this.verifyClientService.setIsDelivery(false);
          this.verifyClientService.setIsReserva(false);
          this.verifyClientService.setIsRetiroCash(false);
          this.verifyClientService.setLinkRedirecLogin('');
          this.verifyClientService.setDataClient();

        // },
        // error => {
        //   // this.router.navigate(['../']);
        // console.log('res idcliente', res);
      });
  }

  ngOnDestroy(): void {
    // this.verifyClientService.unsubscribeClient();
    try {
      this.veryfyClient.unsubscribe();
    } catch (error) {
    }
  }

  // changeLenguage() {
  //   const elements = this.elem.nativeElement.querySelectorAll('.goog-te-combo');
  //   elements.value = 'es';
  // }

  cerrarSession(): void {
    this.verifyClientService.loginOut();
  }

  // showClienteProfile() {
  //   if ( this.isLogin ) {
  //      this.router.navigate(['/cliente-profile']);
  //   }
  // }

  showScanCodeQr() {
    // return false;
    localStorage.removeItem('sys::punto');
    this.verifyClientService.setIsDelivery(false);
    this.verifyClientService.setIsReserva(false);
    this.verifyClientService.setIsReserva(false);
    this.verifyClientService.setDataClient();
    this.router.navigate(['./lector-qr']);
  }

  showDelivery() {
    // return false;
    localStorage.removeItem('sys::punto');
    this.verifyClientService.setIsDelivery(true);
    this.verifyClientService.setIsReserva(false);
    this.verifyClientService.setDataClient();
    this.router.navigate(['./zona-delivery']);
  }

  showAtm() {
    // return false;
    localStorage.removeItem('sys::punto');
    if ( this.isLogin && this.isCliente ) {
      this.router.navigate(['./cash-atm']);
    } else {
      this.verifyClientService.setIsDelivery(false);
      this.verifyClientService.setIsReserva(false);
      this.verifyClientService.setIsRetiroCash(true);
      this.verifyClientService.setDataClient();
      this.verifyClientService.setLinkRedirecLogin('./cash-atm');
      this.router.navigate(['/login-client']);
    }
  }

  showReserva() {
    // return false;
    localStorage.removeItem('sys::punto');
    if ( this.isLogin && this.isCliente ) {
      this.router.navigate(['./reservar-mesa']);
    } else {
      this.verifyClientService.setIsDelivery(false);
      this.verifyClientService.setIsReserva(true);
      this.verifyClientService.setDataClient();
      this.verifyClientService.setLinkRedirecLogin('./reservar-mesa');
      this.router.navigate(['./login-client']);
    }
  }

  // solo dev
  goDev(op: number) {
    localStorage.removeItem('sys::punto');
    this.countLogo += op === 1 ? 1 : 0;
    this.countnDev += op === 2 ? 1 : 0;

    if ( this.countLogo === 4 && this.countnDev === 2 ) { this.router.navigate(['./zona-delivery']); }
  }

}
