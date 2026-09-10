import { Component, OnInit } from '@angular/core';
import { NotificacionPushService } from './shared/services/notificacion-push.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  suscribe: any;

  constructor(
    private notificacionPush: NotificacionPushService
  ) { }

  ngOnInit() {
    // Solo hace algo en Android/iOS; en web retorna de inmediato.
    this.notificacionPush.iniciar();
  }
}
