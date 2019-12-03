import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { take } from 'rxjs/internal/operators/take';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit, OnDestroy {

  private veryfyClient: Subscription = null;

  isLogin = false;
  nombreClientSocket = '';

  constructor(
    private verifyClientService: VerifyAuthClientService,
    ) { }

  ngOnInit() {
    this.nombreClientSocket = '';
    screen.orientation.unlock();

    this.isLogin = this.verifyClientService.isLogin();
    console.log(this.isLogin);

    this.veryfyClient = this.verifyClientService.verifyClient()
      .subscribe((res: SocketClientModel) => {
        this.nombreClientSocket = res.usuario;
        this.isLogin = this.verifyClientService.isLogin();
        console.log('res idcliente', res);
      });
  }

  ngOnDestroy(): void {
    // this.verifyClientService.unsubscribeClient();
    this.veryfyClient.unsubscribe();
  }

  cerrarSession(): void {
    this.verifyClientService.loginOut();
  }

}
