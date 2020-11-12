import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';
import { Router } from '@angular/router';
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
  nombreClientSocket = '';

  private countnDev = 0;
  private countLogo = 0;
  constructor(
    private verifyClientService: VerifyAuthClientService,
    private router: Router,
    // private webSocketService: WebsocketService
    ) { }

  ngOnInit() {
    // console.log('aaa');
    this.nombreClientSocket = '';
    // screen.orientation.unlock();

    // setTimeout(() => {
      this.loadInit();
    // }, 800);

    setTimeout(() => {
      this.loadAll = true;
    }, 2000);
  }

  private loadInit(): void {
    this.verifyClientService.getDataClient();
    this.verifyClientService.setQrSuccess(false);
    this.verifyClientService.setIsDelivery(false);
    this.verifyClientService.setDireccionDeliverySelected(null);

    this.isLogin = this.verifyClientService.isLogin();
    // console.log('desde incio', this.isLogin);

    this.verifyClientService.setMesa(null);
    this.verifyClientService.setIdOrg(null);
    this.verifyClientService.setIdSede(null);
    this.veryfyClient = this.verifyClientService.verifyClient()
      // .pipe(finalize(() => localStorage.clear())) // si esta mal elimina todo
      .subscribe((res: SocketClientModel) => {
        // success => {
          console.log('aaaaa');
          // si es invitado desloguea
          if ( res.usuario.toLowerCase() === 'invitado' ) {
            this.cerrarSession();
            return;
          }

          this.nombreClientSocket = res.usuario;
          this.isLogin = this.verifyClientService.getIsLoginByDNI() ? true : this.verifyClientService.isLogin() ? this.verifyClientService.isLogin() : res.datalogin ? true : this.verifyClientService.isLogin();
          this.verifyClientService.setLoginOn(this.isLogin);
          this.verifyClientService.setQrSuccess(false);
        // },
        // error => {
        //   // this.router.navigate(['../']);
        // console.log('res idcliente', res);
      });
  }

  ngOnDestroy(): void {
    // this.verifyClientService.unsubscribeClient();
    this.veryfyClient.unsubscribe();
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

  showDelivery() {
    // return false;
    this.router.navigate(['./zona-delivery']);
  }

  // solo dev
  goDev(op: number) {
    this.countLogo += op === 1 ? 1 : 0;
    this.countnDev += op === 2 ? 1 : 0;

    if ( this.countLogo === 4 && this.countnDev === 2 ) { this.router.navigate(['./zona-delivery']); }
  }

}
