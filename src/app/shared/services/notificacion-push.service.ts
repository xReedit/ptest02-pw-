import { Injectable, NgZone } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, take } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';

import { CrudHttpService } from './crud-http.service';
import { InfoTockenService } from './info-token.service';
import { IS_NATIVE, IS_PLATAFORM_IOS } from '../config/config.const';
import { construirSuscripcionPush, debeRegistrarToken, EnvioPush, PlataformaPush } from '../utils/push-payload';

// Mismo id que el manifiesto (default_notification_channel_id) y que el backend.
export const CANAL_PEDIDOS = 'pedidos';

// ponytail: push solo nativo. El push web (SwPush + VAPID) queda fuera de alcance
// mientras ServiceWorkerModule siga comentado en app.module.ts.
@Injectable({
  providedIn: 'root'
})
export class NotificacionPushService {

  private tokenActual = '';
  private ultimoEnviado: EnvioPush = { token: '', idcliente: 0 };
  private iniciado = false;

  constructor(
    private crudService: CrudHttpService,
    private infoTokenService: InfoTockenService,
    private router: Router,
    private snackBar: MatSnackBar,
    private zone: NgZone,
  ) { }

  // Se llama una sola vez desde AppComponent.ngOnInit().
  public async iniciar(): Promise<void> {
    if (!IS_NATIVE || this.iniciado) { return; }
    this.iniciado = true;
    await this.crearCanal();
    this.registrarListeners();
    await this.suscribirse();
  }

  // Pide permiso y registra el dispositivo en FCM. Idempotente.
  public async suscribirse(): Promise<void> {
    if (!IS_NATIVE) { return; }
    try {
      // ponytail: en el plugin v4 requestPermissions() responde 'granted' sin preguntar
      // (declara @Permission(strings = {})). Con targetSdkVersion 32 el diálogo de
      // Android 13 lo dispara la creación del canal. Con Capacitor 5 esto sí preguntará.
      const permiso = await PushNotifications.requestPermissions();
      if (permiso.receive !== 'granted') { return; }
      await PushNotifications.register();
      this.enviarSuscripcion();
    } catch (error) {
      console.error('push suscribirse', error);
    }
  }

  public async getIsTienePermiso(): Promise<boolean> {
    if (!IS_NATIVE) { return false; }
    try {
      const permStatus = await PushNotifications.checkPermissions();
      return permStatus.receive === 'granted';
    } catch (error) {
      console.error('push checkPermissions', error);
      return false;
    }
  }

  // Reenvía el token vigente con el idcliente vigente. Se llama tras el registro en FCM,
  // después del login y después de guardar un pedido.
  public enviarSuscripcion(): void {
    if (!IS_NATIVE) { return; }
    const payload = construirSuscripcionPush(this.idClienteActual(), this.tokenActual, this.plataforma());
    if (!debeRegistrarToken(payload, this.ultimoEnviado)) { return; }

    this.crudService.postFree(payload, 'push', 'suscripcion', false)
      .subscribe({
        // solo se recuerda lo que el backend acepto: si respondio mal, el proximo intento reenvia
        next: (res: any) => {
          if (!res || res.success === false) { return; }
          this.ultimoEnviado = { token: payload.token, idcliente: payload.idcliente };
        },
        error: (error: any) => {
          this.ultimoEnviado = { token: '', idcliente: 0 };
          console.error('push/suscripcion', error);
        }
      });
  }

  private async crearCanal(): Promise<void> {
    if (IS_PLATAFORM_IOS) { return; }
    try {
      await PushNotifications.createChannel({
        id: CANAL_PEDIDOS,
        name: 'Estado del pedido',
        description: 'Avisos del estado de tu pedido',
        importance: 5,
        visibility: 1,
        sound: 'default',
        vibration: true,
        lights: true,
      });
    } catch (error) {
      console.error('push createChannel', error);
    }
  }

  private registrarListeners(): void {
    PushNotifications.addListener('registration', (token: Token) => {
      this.tokenActual = token && token.value ? token.value : '';
      this.enviarSuscripcion();
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('push registrationError', error);
    });

    // App en primer plano: Android no dibuja la notificación, se muestra un banner propio.
    PushNotifications.addListener('pushNotificationReceived', (notificacion: PushNotificationSchema) => {
      this.zone.run(() => this.mostrarBanner(notificacion));
    });

    // El usuario tocó la notificación (app en segundo plano o cerrada).
    PushNotifications.addListener('pushNotificationActionPerformed', (accion: ActionPerformed) => {
      this.zone.run(() => this.abrirPedido(accion && accion.notification ? accion.notification.data : null));
    });
  }

  private mostrarBanner(notificacion: PushNotificationSchema): void {
    const titulo = notificacion && notificacion.title ? notificacion.title : 'Tu pedido';
    const cuerpo = notificacion && notificacion.body ? notificacion.body : '';
    const texto = cuerpo ? `${titulo}: ${cuerpo}` : titulo;

    const ref = this.snackBar.open(texto, 'Ver', {
      duration: 6000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
    ref.onAction().subscribe(() => this.abrirPedido(notificacion ? notificacion.data : null));
  }

  private abrirPedido(data: any): void {
    const idpedido = Number(data && data.idpedido ? data.idpedido : 0);
    const extras = idpedido > 0 ? { queryParams: { idpedido } } : {};
    const irAPedidos = () => this.router.navigate(['/zona-delivery/pedidos'], extras);

    // arranque en frío: se espera a que termine la navegación inicial antes de imponer la nuestra.
    // Si el router ya navegó alguna vez, se navega de inmediato.
    if (this.router.navigated) {
      irAPedidos();
      return;
    }

    this.router.events
      .pipe(filter(evento => evento instanceof NavigationEnd), take(1))
      .subscribe(() => irAPedidos());
  }

  private idClienteActual(): number {
    const desdeToken = Number(this.infoTokenService.infoUsToken ? this.infoTokenService.infoUsToken.idcliente : 0);
    if (desdeToken > 0) { return desdeToken; }
    return Number(this.infoTokenService.getIdCliente() || 0);
  }

  private plataforma(): PlataformaPush {
    return IS_PLATAFORM_IOS ? 'ios' : 'android';
  }
}
