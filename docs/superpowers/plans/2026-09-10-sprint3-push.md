# Sprint 3: notificaciones push — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el cliente delivery reciba en su teléfono una notificación push cada vez que cambia el estado de su pedido (Recibido, Aceptado, En preparación, Repartidor asignado, En camino, Entregado, Cancelado), que al tocarla se abra "Mis pedidos" con ese pedido, y que el token del dispositivo quede registrado desde que abre la app y no solo al terminar un pedido.

**Architecture:** El push pasa a ser **solo nativo** (Android/iOS) con `@capacitor/push-notifications` v4 sobre FCM. `NotificacionPushService` deja de inyectar `SwPush` (el `ServiceWorkerModule` está comentado en `app.module.ts`, así que inyectarlo revienta el inyector) y se convierte en un servicio que: crea el canal Android `pedidos`, registra los cuatro listeners del plugin (`registration`, `registrationError`, `pushNotificationReceived`, `pushNotificationActionPerformed`), envía el token al backend con el `idcliente` vigente, muestra un banner `MatSnackBar` cuando la notificación llega con la app en primer plano y navega a `/zona-delivery/pedidos?idpedido=N` cuando el usuario la toca. La lógica pura (armar el payload, decidir si hay que reenviar) vive en `src/app/shared/utils/push-payload.ts` con su spec, igual que `estado-pedido.ts` del Sprint 2. En el backend, `service/push.cliente.service.js` (copia del patrón ya probado en `service/push.mozo.service.js`) envía por `firebase-admin` y se engancha en el marcador `// ponytail: aquí engancha el push` que dejó el Sprint 2 dentro de `service/estado-pedido.service.js`. El web push queda **fuera de alcance** y se documenta.

**Tech Stack:** Angular 14.2, Angular Material 14 (`MatSnackBar`), Capacitor 4.6, `@capacitor/push-notifications` 4.1.2, FCM, Node + Express + mysql2 + `firebase-admin` 12, Karma/Jasmine (ChromeHeadless), Jest.

**Spec:** Informe de auditoría (artifact 5c78f362) sección de notificaciones push, hallazgos 1 a 11. Cada tarea cita el hallazgo que cierra. Dossier de código leído por el planificador: `C:\Users\user\AppData\Local\Temp\claude\D--Projects-capacitor-pwa-app-pedido\927d1846-8ad7-4528-a90b-70ec2c15c15e\scratchpad\dossier-push.md` (`notificacion-push.service.ts`, `app.component.ts`, `capacitor.config.ts`, `AndroidManifest.xml`, `variables.gradle`, `android/app/build.gradle`, `capacitor.build.gradle`, `AppDelegate.swift`, `App.entitlements`, `Info.plist`, `routes/v3.js`, `controllers/sendMsj.js`, `controllers/apiRepartidor.js`, `service/push.mozo.service.js`).

## Global Constraints

- NUNCA hacer `git push`. Solo commits locales; el usuario sube cuando decide.
- Trabajar directo en `master` de cada repo (desarrollador solo, consentimiento dado). No crear ramas.
- Commits en español `<tipo>: <descripción>`; escribir el mensaje completo en un archivo UTF-8 con la herramienta Write y ejecutar `git commit -F <archivo>`. Nunca `git commit -m` con texto acentuado. Todo mensaje termina con estas dos líneas copiadas LITERALMENTE (no cambiar el nombre del modelo aunque tú seas otro):
  ```
  Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
  ```
- Backend `D:\Projects\backend-pedidos`: `git add` solo archivos propios de la tarea; nunca `git add -A` ni `git add .`. No tocar `app.js`, `controllers/serviceSendCPE.js`, `firebase_config.js`, `INTEGRACION-YAPE.md`, `controllers/yapeIntegracion.js`, `routes/routesYape.js` (trabajo ajeno sin commit).
- App `D:\Projects\capacitor\pwa-app-pedido`: build de release `npx ng build --configuration production` (exit 0 obligatorio al final de cada tarea que toque código de la app); type-check rápido `npx tsc -p src/tsconfig.app.json --noEmit`; specs `npx ng test --include=<ruta del spec> --watch=false --browsers=ChromeHeadless`.
- Backend: `npx jest <archivo>` desde `D:\Projects\backend-pedidos`.
- Shell PowerShell 5.1: sin `&&`, `cat`, `head`, `sed`; usar `;`, `Get-Content`, `Select-String`; el hook bloquea `\d` en los comandos (usar `[0-9]`).
- Sin `console.log` nuevos. `console.error` solo dentro de `catch` o del callback de error de un `subscribe`. Marcar simplificaciones deliberadas con `// ponytail: <qué se simplificó y cuándo ampliarlo>`.
- **Nunca imprimir, loguear ni pegar en un commit un token FCM completo.** En logs, como máximo `token.slice(0, 12)`. Tampoco imprimir el contenido de `serviceAccountKey.json` ni de `google-services.json`.
- **Web push fuera de alcance en este sprint.** `SwPush`, VAPID y `keySuscribtion()` se eliminan del servicio de la app. `environment.vapidPublic` y `VAPID_PUBLIC` en `config.const.ts` se dejan como están (los usa el backend para el push web del repartidor); solo deja de importarse en `notificacion-push.service.ts`.
- Etiquetas de estado para el cliente (idénticas a las del Sprint 2, no inventar otras): `Recibido`, `Aceptado`, `En preparación`, `Repartidor asignado`, `En camino`, `Entregado`, `Cancelado`.
- Códigos de estado (fuente de verdad): `pwa_estado` = `P` recibido, `A` aceptado/en preparación, `D` despachado, `R` con repartidor, `E` entregado, `C` cancelado. `pwa_delivery_status` = `0` sin repartidor, `1` asignado, `3` en camino, `4` entregado, `5` cancelado por repartidor.
- Canal de notificaciones Android: id `pedidos`, nombre `Estado del pedido`, `importance: 5`. El mismo id se declara en el manifiesto y lo usa el backend en `android.notification.channelId`.
- **No subir `targetSdkVersion` a 33 ni a 34 en este sprint** (ver Task 2, hallazgo 4): `@capacitor/push-notifications` 4.1.2 declara `@Permission(strings = {}, alias = "receive")`, es decir su `requestPermissions()` resuelve `granted` sin pedir nada al sistema operativo. Con `targetSdkVersion = 32` Android 13+ muestra el diálogo de permiso **automáticamente al crear el primer canal de notificaciones**, que es justo lo que hace el arranque del servicio. Subir el target sin poder pedir el permiso dejaría las notificaciones silenciosamente denegadas. El arreglo definitivo (Capacitor 5 + plugin v5 + compile/target 34) es un sprint aparte.

---

### Task 1: App: `NotificacionPushService` sin `SwPush`, con listeners, canal y registro en arranque y login

**Hallazgos que cierra:** 1 (CRÍTICO: `SwPush` inyectado con `ServiceWorkerModule` comentado → `NullInjectorError`; el servicio y todo componente que lo inyecta no se pueden construir), 3 (CRÍTICO: no hay listeners `pushNotificationReceived` ni `pushNotificationActionPerformed`), 5 (ALTO: el token solo se registra al pulsar "Listo" tras un pedido, nunca al arrancar ni al iniciar sesión), 6 (ALTO: `saveSuscripcion` postea con `idcliente` que puede ser nulo), 7 parcial (MEDIO: no existe el canal de notificaciones).

**Files:**
- Create: `src/app/shared/utils/push-payload.ts`
- Test: `src/app/shared/utils/push-payload.spec.ts`
- Modify: `src/app/shared/services/notificacion-push.service.ts` (reemplazo completo del archivo)
- Modify: `src/app/app.component.ts`
- Modify: `src/app/pages/inicio/callback-auth/callback-auth.component.ts` (constructor y `setInfoToken`, línea ~137)
- Modify: `src/app/pages/zona-establecimientos/mis-ordenes/mis-ordenes.component.ts`

**Interfaces:**
- Produces:
```ts
export type PlataformaPush = 'android' | 'ios' | 'web';
export interface SuscripcionPushPayload { idcliente: number; token: string; plataforma: PlataformaPush; suscripcion: string; }
export interface EnvioPush { token: string; idcliente: number; }
export function construirSuscripcionPush(idcliente: any, token: any, plataforma: PlataformaPush): SuscripcionPushPayload | null;
export function debeRegistrarToken(payload: SuscripcionPushPayload | null, ultimo: EnvioPush): boolean;
```
- Produces: `NotificacionPushService` con `iniciar(): Promise<void>` (idempotente, solo nativo), `suscribirse(): Promise<void>`, `getIsTienePermiso(): Promise<boolean>`, `enviarSuscripcion(): void`, y la constante exportada `CANAL_PEDIDOS = 'pedidos'`. Ya NO existen `keySuscribtion()` ni `saveSuscripcion()`.
- Produces (contrato de red): `POST push/suscripcion` body `{ idcliente: number, token: string, plataforma: 'android'|'ios'|'web', suscripcion: string }` (`suscripcion` repite el token por compatibilidad con el backend viejo). Lo consume la Task 3.
- Produces (navegación): al tocar la notificación se navega a `/zona-delivery/pedidos` con `queryParams: { idpedido }` cuando el payload trae `data.idpedido`.

- [ ] **Step 1: Escribir el spec de la lógica pura (falla).** Crear `src/app/shared/utils/push-payload.spec.ts`:

```ts
import { construirSuscripcionPush, debeRegistrarToken, SuscripcionPushPayload } from './push-payload';

const TOKEN = 'fZk1QwErTyUiOpAsDfGhJkLzXcVbNm0987654321';

describe('construirSuscripcionPush', () => {
  it('arma el payload con el token repetido en suscripcion (compatibilidad)', () => {
    expect(construirSuscripcionPush(15, TOKEN, 'android')).toEqual({
      idcliente: 15, token: TOKEN, plataforma: 'android', suscripcion: TOKEN
    });
  });

  it('acepta el idcliente como texto', () => {
    expect(construirSuscripcionPush('15', TOKEN, 'ios').idcliente).toBe(15);
  });

  it('devuelve null si no hay cliente valido', () => {
    expect(construirSuscripcionPush(0, TOKEN, 'android')).toBeNull();
    expect(construirSuscripcionPush(null, TOKEN, 'android')).toBeNull();
    expect(construirSuscripcionPush('abc', TOKEN, 'android')).toBeNull();
    expect(construirSuscripcionPush(-3, TOKEN, 'android')).toBeNull();
  });

  it('devuelve null si el token falta o es demasiado corto', () => {
    expect(construirSuscripcionPush(15, '', 'android')).toBeNull();
    expect(construirSuscripcionPush(15, null, 'android')).toBeNull();
    expect(construirSuscripcionPush(15, 'corto', 'android')).toBeNull();
    expect(construirSuscripcionPush(15, { endpoint: 'x' }, 'web')).toBeNull();
  });

  it('recorta espacios del token', () => {
    expect(construirSuscripcionPush(15, `  ${TOKEN}  `, 'android').token).toBe(TOKEN);
  });
});

describe('debeRegistrarToken', () => {
  const payload: SuscripcionPushPayload = { idcliente: 15, token: TOKEN, plataforma: 'android', suscripcion: TOKEN };

  it('no envia nada cuando el payload es null', () => {
    expect(debeRegistrarToken(null, { token: '', idcliente: 0 })).toBe(false);
  });

  it('envia la primera vez', () => {
    expect(debeRegistrarToken(payload, { token: '', idcliente: 0 })).toBe(true);
  });

  it('no reenvia el mismo par token + cliente', () => {
    expect(debeRegistrarToken(payload, { token: TOKEN, idcliente: 15 })).toBe(false);
  });

  it('reenvia cuando cambia el cliente (login) aunque el token sea el mismo', () => {
    expect(debeRegistrarToken(payload, { token: TOKEN, idcliente: 9 })).toBe(true);
  });

  it('reenvia cuando FCM rota el token', () => {
    expect(debeRegistrarToken(payload, { token: 'otro-token-distinto-1234567890', idcliente: 15 })).toBe(true);
  });
});
```

- [ ] **Step 2: Ejecutar y ver fallar.**

Run: `npx ng test --include=src/app/shared/utils/push-payload.spec.ts --watch=false --browsers=ChromeHeadless`
Expected: FAIL — no existe el módulo `./push-payload`.

- [ ] **Step 3: Implementar `src/app/shared/utils/push-payload.ts`:**

```ts
// Lógica pura del registro de token push: qué se manda al backend y cuándo.
// Sin dependencias de Angular ni de Capacitor para poder probarla sin TestBed.

export type PlataformaPush = 'android' | 'ios' | 'web';

export interface SuscripcionPushPayload {
  idcliente: number;
  token: string;
  plataforma: PlataformaPush;
  // El backend viejo lee req.body.suscripcion; se repite el token para no romperlo.
  suscripcion: string;
}

export interface EnvioPush {
  token: string;
  idcliente: number;
}

const LARGO_MINIMO_TOKEN = 20;

// Devuelve null cuando falta cliente o token: en ese caso no se llama al backend.
export function construirSuscripcionPush(idcliente: any, token: any, plataforma: PlataformaPush): SuscripcionPushPayload | null {
  const id = Number(idcliente);
  if (!Number.isFinite(id) || id <= 0) { return null; }

  const tk = typeof token === 'string' ? token.trim() : '';
  if (tk.length < LARGO_MINIMO_TOKEN) { return null; }

  return { idcliente: id, token: tk, plataforma, suscripcion: tk };
}

// Evita reenviar el mismo par token + cliente. Si el cliente cambia (login) o FCM
// rota el token, se vuelve a enviar.
export function debeRegistrarToken(payload: SuscripcionPushPayload | null, ultimo: EnvioPush): boolean {
  if (!payload) { return false; }
  return payload.token !== ultimo.token || payload.idcliente !== ultimo.idcliente;
}
```

- [ ] **Step 4: Ejecutar el spec.**

Run: `npx ng test --include=src/app/shared/utils/push-payload.spec.ts --watch=false --browsers=ChromeHeadless`
Expected: PASS, 11 specs, 0 failures.

- [ ] **Step 5: Reemplazar por completo `src/app/shared/services/notificacion-push.service.ts`.** Borrar todo el contenido actual (incluidos los bloques comentados de `swPush`, `keySuscribtion`, `lanzarPermisoNotificationPush` y `showMessages`) y dejar exactamente:

```ts
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
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
    const payload = construirSuscripcionPush(this.idClienteActual(), this.tokenActual, this.plataforma());
    if (!debeRegistrarToken(payload, this.ultimoEnviado)) { return; }

    this.ultimoEnviado = { token: payload.token, idcliente: payload.idcliente };
    this.crudService.postFree(payload, 'push', 'suscripcion', false)
      .subscribe({
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
    // ponytail: 800 ms para que el arranque en frío termine su navegación inicial
    // antes de que la notificación imponga la suya.
    setTimeout(() => {
      this.router.navigate(['/zona-delivery/pedidos'], extras);
    }, 800);
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
```

- [ ] **Step 6: Arrancar el servicio en `src/app/app.component.ts`.** Reemplazar el archivo completo por:

```ts
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
```

- [ ] **Step 7: Reenviar el token después de cada login en `src/app/pages/inicio/callback-auth/callback-auth.component.ts`.**

(a) Agregar el import junto a los demás de `src/app/shared/services/`:
```ts
import { NotificacionPushService } from 'src/app/shared/services/notificacion-push.service';
```
(b) Agregar al constructor, después de `private utilitariosService: UtilitariosService`:
```ts
    private notificacionPush: NotificacionPushService
```
(la línea anterior queda con coma final).
(c) Dentro de `setInfoToken`, justo después de `this.infoToken.setIsUsLoggedIn(true);` (línea ~137) agregar:
```ts
      // el idcliente cambió: hay que reenviar el token con el cliente nuevo
      this.notificacionPush.enviarSuscripcion();
```

- [ ] **Step 8: Abrir el pedido tocado en `src/app/pages/zona-establecimientos/mis-ordenes/mis-ordenes.component.ts`.**

(a) Cambiar el import de router a: `import { ActivatedRoute, Router } from '@angular/router';`
(b) Agregar el campo, junto a `idClientePedidos: number;`:
```ts
  private idpedidoPush = 0;
```
(c) Agregar al constructor, después de `private router: Router,`:
```ts
    private route: ActivatedRoute,
```
(d) Primera línea de `ngOnInit()`, antes de leer el idcliente:
```ts
    this.idpedidoPush = Number(this.route.snapshot.queryParams['idpedido'] || 0);
```
(e) Dentro del `subscribe` de `loadMisPedidos()`, inmediatamente después del bloque `this.listMisPedidos.map(...)` (es decir, con la lista ya poblada) agregar:
```ts
        if ( this.idpedidoPush > 0 ) {
          const pedidoPush = this.listMisPedidos.find(x => Number(x.idpedido) === this.idpedidoPush);
          this.idpedidoPush = 0;
          if ( pedidoPush ) { this.openDetalle(pedidoPush); }
        }
```
Nota para el implementador: si la Task 3 del Sprint 2 ya se aplicó, `loadMisPedidos` recibe el parámetro `mostrarLoader` y el `switch` de estados fue sustituido por `x.estadoResumen = resumirEstadoPedido(x);`. El bloque anterior va igual: **después** del `map`, **dentro** del callback del `subscribe`. Buscar con `Select-String -Path src/app/pages/zona-establecimientos/mis-ordenes/mis-ordenes.component.ts -Pattern "listMisPedidos.map"` para ubicarlo.

- [ ] **Step 9: Verificar que ya nada importe `SwPush`.**

Run: `Select-String -Path src/app -Pattern "SwPush" -Recurse`
Expected: sin resultados.

- [ ] **Step 10: Type-check y build de release.**

Run: `npx tsc -p src/tsconfig.app.json --noEmit`
Expected: sin errores.
Run: `npx ng build --configuration production`
Expected: exit 0.

- [ ] **Step 11: Commit.** Escribir con Write el archivo `.superpowers/sdd/2026-09-10-sprint3-push/commit-msg-task-1.txt` (UTF-8) con este contenido:

```
fix: push nativo sin SwPush, con listeners, canal y registro del token en arranque y login

NotificacionPushService dejaba de construirse porque inyectaba SwPush con
ServiceWorkerModule comentado en app.module.ts. Se reescribe como servicio solo
nativo sobre @capacitor/push-notifications: crea el canal "pedidos", registra
registration, registrationError, pushNotificationReceived y
pushNotificationActionPerformed, muestra un banner MatSnackBar en primer plano y
abre /zona-delivery/pedidos con el idpedido de la notificacion.

El token se envia al arrancar la app, despues de cada login y cuando FCM lo rota,
siempre con el idcliente vigente y solo si es mayor que cero.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
```

Luego:
```
git add src/app/shared/utils/push-payload.ts src/app/shared/utils/push-payload.spec.ts src/app/shared/services/notificacion-push.service.ts src/app/app.component.ts src/app/pages/inicio/callback-auth/callback-auth.component.ts src/app/pages/zona-establecimientos/mis-ordenes/mis-ordenes.component.ts
git commit -F .superpowers/sdd/2026-09-10-sprint3-push/commit-msg-task-1.txt
```

---

### Task 2: App nativa: un solo plugin de push, manifiesto Android correcto, icono/canal/color y entitlements iOS

**Hallazgos que cierra:** 2 (CRÍTICO: `@capacitor-firebase/messaging` y `@capacitor/push-notifications` instalados a la vez, ambos registran un servicio `MESSAGING_EVENT`, el primero nunca se importa en `src`), 4 (ALTO: falta `POST_NOTIFICATIONS`; ver la decisión de `targetSdkVersion` en Global Constraints), 7 (MEDIO: sin icono ni color por defecto, y el `<meta-data>` de Google Maps está FUERA de `<application>` y por eso se ignora), 9 (iOS: `aps-environment` en `development`, sin `UIBackgroundModes` `remote-notification`).

**Files:**
- Modify: `package.json` (quitar `@capacitor-firebase/messaging`)
- Modify: `ios/App/Podfile` (quitar el pod `CapacitorFirebaseMessaging`)
- Modify: `android/app/src/main/AndroidManifest.xml`
- Modify: `android/variables.gradle`
- Create: `android/app/src/main/res/values/colors.xml`
- Create: `scripts/gen-notification-icon.js`
- Create: `android/app/src/main/res/drawable-mdpi/ic_stat_notify.png` y las variantes hdpi, xhdpi, xxhdpi, xxxhdpi (las genera el script)
- Modify: `ios/App/App/App.entitlements`
- Modify: `ios/App/App/Info.plist`

**Interfaces:**
- Consumes: `CANAL_PEDIDOS = 'pedidos'` (Task 1) — el manifiesto declara el mismo id como canal por defecto de FCM.
- Produces: recurso `@drawable/ic_stat_notify` y color `@color/notification_color` referenciados por los `<meta-data>` de FCM; permiso `android.permission.POST_NOTIFICATIONS` declarado.

- [ ] **Step 1: Desinstalar el plugin duplicado.**

Run: `npm uninstall @capacitor-firebase/messaging`
Expected: exit 0 y `Select-String -Path package.json -Pattern "capacitor-firebase"` sin resultados.

- [ ] **Step 2: Quitar el pod de iOS.** En `ios/App/Podfile`, borrar exactamente esta línea de `def capacitor_pods`:
```ruby
  pod 'CapacitorFirebaseMessaging', :path => '../../node_modules/@capacitor-firebase/messaging'
```
NO tocar `pod 'Firebase/Messaging'` del target `App` (lo necesita `AppDelegate.swift`, que usa `Messaging.messaging().apnsToken`).

- [ ] **Step 3: Actualizar el proyecto Android nativo.**

Run: `npx cap update android`
Expected: exit 0. (Se usa `update` y no `sync` porque `sync` copia `dist/pwa-app-pedido`, que aún no existe en esta tarea; el `cap sync` completo va en la Task 6.)

Verificar:
Run: `Select-String -Path android/app/capacitor.build.gradle -Pattern "firebase-messaging"`
Expected: sin resultados (antes aparecía `implementation project(':capacitor-firebase-messaging')`).

- [ ] **Step 4: Generar el icono monocromo de la barra de estado.** Crear `scripts/gen-notification-icon.js`:

```js
// Genera android/app/src/main/res/drawable-*/ic_stat_notify.png:
// circulo blanco solido sobre fondo transparente. Android pinta el icono de la barra
// de estado como silueta: cualquier pixel con color se ve blanco y el alfa es la forma.
// Sin dependencias: PNG RGBA escrito a mano con zlib de Node.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const CRC_TABLE = (() => {
  const tabla = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) { c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); }
    tabla[n] = c;
  }
  return tabla;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) { c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function bloque(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length, 0);
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo), 0);
  return Buffer.concat([largo, cuerpo, crc]);
}

function circuloBlanco(lado) {
  const raw = Buffer.alloc(lado * (lado * 4 + 1));
  const centro = (lado - 1) / 2;
  const radio = lado / 2 - lado * 0.08; // margen de seguridad de la barra de estado
  let p = 0;
  for (let y = 0; y < lado; y++) {
    raw[p++] = 0; // filtro none
    for (let x = 0; x < lado; x++) {
      const dx = x - centro;
      const dy = y - centro;
      const dentro = Math.sqrt(dx * dx + dy * dy) <= radio;
      raw[p++] = 255;
      raw[p++] = 255;
      raw[p++] = 255;
      raw[p++] = dentro ? 255 : 0;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(lado, 0);
  ihdr.writeUInt32BE(lado, 4);
  ihdr[8] = 8;  // bits por canal
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; // compresion
  ihdr[11] = 0; // filtro
  ihdr[12] = 0; // sin entrelazado
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    bloque('IHDR', ihdr),
    bloque('IDAT', zlib.deflateSync(raw)),
    bloque('IEND', Buffer.alloc(0))
  ]);
}

const DENSIDADES = [
  ['drawable-mdpi', 24],
  ['drawable-hdpi', 36],
  ['drawable-xhdpi', 48],
  ['drawable-xxhdpi', 72],
  ['drawable-xxxhdpi', 96]
];

const base = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
DENSIDADES.forEach(([carpeta, lado]) => {
  const destino = path.join(base, carpeta);
  fs.mkdirSync(destino, { recursive: true });
  fs.writeFileSync(path.join(destino, 'ic_stat_notify.png'), circuloBlanco(lado));
  process.stdout.write(`${carpeta}/ic_stat_notify.png ${lado}x${lado}\n`);
});
```

Run: `node scripts/gen-notification-icon.js`
Expected: cinco líneas, una por densidad.
Run: `Get-ChildItem android/app/src/main/res -Recurse -Filter ic_stat_notify.png | Select-Object -ExpandProperty FullName`
Expected: cinco archivos.

- [ ] **Step 5: Crear `android/app/src/main/res/values/colors.xml`:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- naranja Papaya: color de acento de la notificacion -->
    <color name="notification_color">#E0651F</color>
</resources>
```

- [ ] **Step 6: Reemplazar `android/app/src/main/AndroidManifest.xml` completo por:**

```xml
<?xml version="1.0" encoding="utf-8" ?>
<manifest
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="express.papaya.com.pe">
    <application
        android:hardwareAccelerated="true"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name="express.papaya.com.pe.MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

          <intent-filter>
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.DEFAULT" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="express.papaya.com.pe" />
          </intent-filter>

        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data android:name="android.support.FILE_PROVIDER_PATHS" android:resource="@xml/file_paths" />
        </provider>

        <!-- Estaba fuera de <application> y el sistema lo ignoraba -->
        <meta-data android:name="com.google.android.geo.API_KEY" android:value="${GOOGLE_MAPS_API_KEY}" />

        <!-- Push: canal, icono y color usados cuando la notificacion llega con la app cerrada -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="pedidos" />
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@drawable/ic_stat_notify" />
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_color"
            android:resource="@color/notification_color" />
    </application>

    <!-- Permissions -->

    <uses-permission android:name="android.permission.INTERNET" />
    <!-- Declarado ya, aunque con targetSdkVersion 32 el dialogo lo dispara la creacion del canal.
         Queda listo para el sprint de Capacitor 5, donde el plugin v5 si lo pide en runtime. -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-feature android:name="android.hardware.location.gps" />

    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_PHONE_STATE"/>

    <uses-permission android:name="android.permission.CAMERA" />
    <uses-sdk tools:overrideLibrary="com.google.zxing.client.android" />
</manifest>
```

- [ ] **Step 7: Subir solo `compileSdkVersion` en `android/variables.gradle`.** Reemplazar las tres primeras líneas del bloque `ext { ... }` por:

```gradle
    minSdkVersion = 22
    compileSdkVersion = 33
    // ponytail: targetSdkVersion sigue en 32 a proposito. El plugin push v4 declara
    // @Permission(strings = {}) y su requestPermissions() no pide nada al sistema; con
    // target 32 Android 13+ muestra el dialogo al crear el canal. Subir a 33/34 exige
    // Capacitor 5 + plugin v5 (y AGP 8.1.1 para SDK 34): sprint aparte.
    targetSdkVersion = 32
```
El resto del archivo (versiones de androidx, junit, cordova) no se toca.

- [ ] **Step 8: iOS — entitlement de producción.** Reemplazar `ios/App/App/App.entitlements` completo por:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>aps-environment</key>
	<string>production</string>
</dict>
</plist>
```
(Xcode usa el certificado de desarrollo igual en builds de Debug; `production` es lo que necesita el APNs de la App Store.)

- [ ] **Step 9: iOS — modo background de notificaciones remotas.** En `ios/App/App/Info.plist`, insertar estas cuatro líneas justo ANTES de `<key>UILaunchStoryboardName</key>`:

```xml
	<key>UIBackgroundModes</key>
	<array>
		<string>remote-notification</string>
	</array>
```
No tocar el resto del archivo (en particular `FirebaseAppDelegateProxyEnabled` = `false`, que es lo que hace funcionar el `didRegisterForRemoteNotificationsWithDeviceToken` de `AppDelegate.swift`).

- [ ] **Step 10: Verificar que el proyecto Android sigue configurándose.**

Run: `cd android; $env:JAVA_HOME='C:\Program Files\Java\jdk-17'; .\gradlew.bat :app:processDebugManifest --no-daemon`
Expected: `BUILD SUCCESSFUL`. (Se fija JDK 17 porque Gradle 7.4.2 no soporta el JDK 21 que está en `JAVA_HOME` de la máquina.) Si falla por descarga de dependencias o por SDK, anotar el error textual y continuar: la verificación completa es la Task 6.

- [ ] **Step 11: Commit.** Escribir `.superpowers/sdd/2026-09-10-sprint3-push/commit-msg-task-2.txt`:

```
fix: un solo plugin de push, manifiesto Android correcto e iOS listo para APNs

Se desinstala @capacitor-firebase/messaging: convivia con
@capacitor/push-notifications, ambos registraban un servicio MESSAGING_EVENT y el
primero no se importaba en ningun archivo de src.

Android: el meta-data de Google Maps estaba fuera de <application> y se ignoraba,
ahora esta dentro; se declara POST_NOTIFICATIONS; se agregan los meta-data de FCM
para canal, icono y color por defecto; se genera ic_stat_notify en cinco
densidades; compileSdkVersion sube a 33 y targetSdkVersion se mantiene en 32 a
proposito.

iOS: aps-environment pasa a production y se agrega UIBackgroundModes
remote-notification.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
```

Luego (desde la raíz de la app; el `cd android` del paso anterior deja el shell en `android`, así que primero `cd ..`):
```
cd ..
git add package.json package-lock.json ios/App/Podfile android/app/src/main/AndroidManifest.xml android/variables.gradle android/app/src/main/res/values/colors.xml android/app/src/main/res/drawable-mdpi/ic_stat_notify.png android/app/src/main/res/drawable-hdpi/ic_stat_notify.png android/app/src/main/res/drawable-xhdpi/ic_stat_notify.png android/app/src/main/res/drawable-xxhdpi/ic_stat_notify.png android/app/src/main/res/drawable-xxxhdpi/ic_stat_notify.png android/app/capacitor.build.gradle android/capacitor.settings.gradle scripts/gen-notification-icon.js ios/App/App/App.entitlements ios/App/App/Info.plist
git commit -F .superpowers/sdd/2026-09-10-sprint3-push/commit-msg-task-2.txt
```
Si `android/capacitor.settings.gradle` no cambió (según `git status`), quitarlo del `git add`.

---

### Task 3: Backend: `push/suscripcion` compatible y helper de envío FCM al cliente

**Hallazgos que cierra:** 6 (ALTO: `saveSuscripcion` posteaba `{ suscripcion, idcliente }` con `idcliente` nullable; en web mandaba un objeto `PushSubscription` y en nativo un string; además el handler `pushSuscripcion(req)` se registra en Express sin `res` y nunca responde: la petición del cliente queda colgada hasta el timeout), 10 (backend: falta el emisor de push al cliente y el formato de almacenamiento del token).

**Files (backend, `D:\Projects\backend-pedidos`):**
- Modify: `controllers/sendMsj.js` (función `pushSuscripcion`, líneas 264-273)
- Create: `service/push.cliente.service.js`
- Test: `test/push.cliente.service.test.js`

**Interfaces:**
- Consumes: body `{ idcliente, token, plataforma, suscripcion }` que envía `NotificacionPushService.enviarSuscripcion()` (Task 1).
- Produces: `POST /v3/push/suscripcion` → `{ success: true, ok: true }` o `{ success: false, error }` con status 400. Guarda en `cliente_socketid.key_suscripcion_push` el JSON `{"tipo":"fcm","token":"...","plataforma":"android"}`.
- Produces:
```js
module.exports = { notificarEstado, construirMensaje, codigoEstado, leerTokenFcm, MENSAJES, CANAL_ANDROID };
// codigoEstado(pwa_estado, pwa_delivery_status) -> 'recibido'|'aceptado'|'preparando'|'asignado'|'camino'|'entregado'|'cancelado'
// construirMensaje(idpedido, pwa_estado, pwa_delivery_status) -> { codigo, title, body }
// leerTokenFcm(valorColumna) -> { token, plataforma } | null
// notificarEstado({ idpedido, idcliente, pwa_estado, pwa_delivery_status }) -> Promise<void>  (nunca lanza)
```

- [ ] **Step 1: Escribir el spec (falla).** Crear `test/push.cliente.service.test.js`:

```js
const mockSend = jest.fn();

jest.mock('../service/query.service.v1', () => ({ ejecutarConsulta: jest.fn() }));
jest.mock('../firebase_config', () => ({ admin: { messaging: () => ({ send: mockSend }) } }));
jest.mock('../utilitarios/logger', () => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

const QueryServiceV1 = require('../service/query.service.v1');
const svc = require('../service/push.cliente.service');

const TOKEN = 'fZk1QwErTyUiOpAsDfGhJkLzXcVbNm0987654321';

describe('codigoEstado', () => {
  const casos = [
    ['P', '0', 'recibido'],
    ['A', '0', 'preparando'],
    ['D', '0', 'preparando'],
    ['R', '0', 'asignado'],
    ['A', 1, 'asignado'],
    ['A', '3', 'camino'],
    ['E', '3', 'entregado'],
    ['A', 4, 'entregado'],
    ['C', '0', 'cancelado'],
    ['A', '5', 'cancelado'],
    [null, null, 'recibido'],
  ];
  casos.forEach(([estado, delivery, esperado]) => {
    it(`${estado} / ${delivery} -> ${esperado}`, () => {
      expect(svc.codigoEstado(estado, delivery)).toBe(esperado);
    });
  });
});

describe('construirMensaje', () => {
  it('usa las etiquetas del cliente y el numero de pedido', () => {
    expect(svc.construirMensaje(77, 'A', '3')).toEqual({
      codigo: 'camino',
      title: 'En camino',
      body: 'Tu pedido #77 ya salio hacia tu direccion.'
    });
  });
  it('cubre los siete estados', () => {
    expect(Object.keys(svc.MENSAJES).sort()).toEqual(
      ['aceptado', 'asignado', 'camino', 'cancelado', 'entregado', 'preparando', 'recibido']
    );
  });
});

describe('leerTokenFcm', () => {
  it('lee el formato nuevo', () => {
    expect(svc.leerTokenFcm(JSON.stringify({ tipo: 'fcm', token: TOKEN, plataforma: 'android' })))
      .toEqual({ token: TOKEN, plataforma: 'android' });
  });
  it('acepta un token guardado como string suelto (apps viejas)', () => {
    expect(svc.leerTokenFcm(JSON.stringify(TOKEN))).toEqual({ token: TOKEN, plataforma: 'android' });
  });
  it('ignora una suscripcion web push', () => {
    expect(svc.leerTokenFcm(JSON.stringify({ endpoint: 'https://fcm.googleapis.com/x', keys: {} }))).toBeNull();
  });
  it('ignora vacio y basura', () => {
    expect(svc.leerTokenFcm(null)).toBeNull();
    expect(svc.leerTokenFcm('')).toBeNull();
    expect(svc.leerTokenFcm('no es json')).toBeNull();
  });
});

describe('notificarEstado', () => {
  beforeEach(() => {
    QueryServiceV1.ejecutarConsulta.mockReset();
    mockSend.mockReset();
    mockSend.mockResolvedValue('projects/x/messages/1');
  });

  it('envia al token del cliente con canal, data.idpedido y titulo del estado', async () => {
    QueryServiceV1.ejecutarConsulta.mockResolvedValue([
      { key_suscripcion_push: JSON.stringify({ tipo: 'fcm', token: TOKEN, plataforma: 'android' }) }
    ]);

    await svc.notificarEstado({ idpedido: 77, idcliente: 15, pwa_estado: 'A', pwa_delivery_status: '3' });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const mensaje = mockSend.mock.calls[0][0];
    expect(mensaje.token).toBe(TOKEN);
    expect(mensaje.notification.title).toBe('En camino');
    expect(mensaje.data).toEqual({ tipo: 'estado_pedido', idpedido: '77' });
    expect(mensaje.android.notification.channelId).toBe('pedidos');
  });

  it('no envia si el cliente no tiene token fcm', async () => {
    QueryServiceV1.ejecutarConsulta.mockResolvedValue([
      { key_suscripcion_push: JSON.stringify({ endpoint: 'https://fcm.googleapis.com/x' }) }
    ]);
    await svc.notificarEstado({ idpedido: 77, idcliente: 15, pwa_estado: 'A', pwa_delivery_status: '3' });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('no envia ni consulta si el idcliente no es valido', async () => {
    await svc.notificarEstado({ idpedido: 77, idcliente: 0, pwa_estado: 'A', pwa_delivery_status: '3' });
    expect(QueryServiceV1.ejecutarConsulta).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('borra el token cuando FCM dice que ya no existe', async () => {
    QueryServiceV1.ejecutarConsulta.mockResolvedValue([
      { key_suscripcion_push: JSON.stringify({ tipo: 'fcm', token: TOKEN, plataforma: 'android' }) }
    ]);
    const err = new Error('token muerto');
    err.code = 'messaging/registration-token-not-registered';
    mockSend.mockRejectedValue(err);

    await svc.notificarEstado({ idpedido: 77, idcliente: 15, pwa_estado: 'E', pwa_delivery_status: '4' });

    const ultima = QueryServiceV1.ejecutarConsulta.mock.calls.pop();
    expect(ultima[0]).toContain('key_suscripcion_push');
    expect(ultima[0].toUpperCase()).toContain('UPDATE');
    expect(ultima[1]).toEqual([15]);
  });

  it('nunca lanza aunque falle la base', async () => {
    QueryServiceV1.ejecutarConsulta.mockRejectedValue(new Error('db caida'));
    await expect(svc.notificarEstado({ idpedido: 77, idcliente: 15, pwa_estado: 'P', pwa_delivery_status: '0' }))
      .resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Ejecutar y ver fallar.**

Run: `npx jest test/push.cliente.service.test.js`
Expected: FAIL — `Cannot find module '../service/push.cliente.service'`.

- [ ] **Step 3: Crear `service/push.cliente.service.js`:**

```js
// Push FCM al cliente delivery cuando cambia el estado de su pedido.
// El token vive en cliente_socketid.key_suscripcion_push con el formato
// { "tipo": "fcm", "token": "...", "plataforma": "android" }.
// Las suscripciones web push viejas (objeto PushSubscription con endpoint) se ignoran:
// ponytail: el push web queda fuera de alcance mientras la PWA no registre service worker.
const QueryServiceV1 = require('./query.service.v1');
const { admin: adminFirebase } = require('../firebase_config');
const logger = require('../utilitarios/logger');

const CANAL_ANDROID = 'pedidos'; // lo crea la app en NotificacionPushService
const LARGO_MINIMO_TOKEN = 20;

// Mismas etiquetas que ve el cliente en "Mis pedidos" (sprint 2).
const MENSAJES = {
	recibido:   { title: 'Recibido',             body: 'Recibimos tu pedido #%s. Te avisamos cuando el local lo confirme.' },
	aceptado:   { title: 'Aceptado',             body: 'El local acepto tu pedido #%s.' },
	preparando: { title: 'En preparacion',       body: 'Tu pedido #%s ya se esta preparando.' },
	asignado:   { title: 'Repartidor asignado',  body: 'Un repartidor tomo tu pedido #%s.' },
	camino:     { title: 'En camino',            body: 'Tu pedido #%s ya salio hacia tu direccion.' },
	entregado:  { title: 'Entregado',            body: 'Tu pedido #%s fue entregado. Buen provecho.' },
	cancelado:  { title: 'Cancelado',            body: 'Tu pedido #%s fue cancelado.' }
};

const CODIGOS_TOKEN_MUERTO = [
	'messaging/registration-token-not-registered',
	'messaging/invalid-argument',
	'messaging/mismatched-credential',
];

// Misma tabla de decision que resumirEstadoPedido() en la app (src/app/shared/utils/estado-pedido.ts).
// ponytail: 'aceptado' no lo produce hoy ningun dato (el local marca 'A' tanto para aceptado
// como para en preparacion); queda definido para cuando "Mi tienda" confirme manualmente.
function codigoEstado(pwa_estado, pwa_delivery_status) {
	const local = String(pwa_estado || 'P').toUpperCase();
	const reparto = String(pwa_delivery_status === null || pwa_delivery_status === undefined ? '0' : pwa_delivery_status);
	if (local === 'C' || reparto === '5') { return 'cancelado'; }
	if (local === 'E' || reparto === '4') { return 'entregado'; }
	if (reparto === '3') { return 'camino'; }
	if (reparto === '1' || local === 'R') { return 'asignado'; }
	if (local === 'A' || local === 'D') { return 'preparando'; }
	return 'recibido';
}

function construirMensaje(idpedido, pwa_estado, pwa_delivery_status) {
	const codigo = codigoEstado(pwa_estado, pwa_delivery_status);
	const plantilla = MENSAJES[codigo];
	return { codigo, title: plantilla.title, body: plantilla.body.replace('%s', String(idpedido)) };
}

// Devuelve { token, plataforma } o null si la columna no guarda un token FCM.
function leerTokenFcm(valor) {
	if (!valor) { return null; }
	let dato = valor;
	if (typeof dato === 'string') {
		try { dato = JSON.parse(dato); } catch (error) { return null; }
	}
	if (typeof dato === 'string') {
		return dato.length >= LARGO_MINIMO_TOKEN ? { token: dato, plataforma: 'android' } : null;
	}
	if (!dato || typeof dato !== 'object') { return null; }
	if (dato.tipo !== 'fcm') { return null; }
	if (typeof dato.token !== 'string' || dato.token.length < LARGO_MINIMO_TOKEN) { return null; }
	return { token: dato.token, plataforma: dato.plataforma === 'ios' ? 'ios' : 'android' };
}

async function limpiarToken(idcliente) {
	await QueryServiceV1.ejecutarConsulta(
		'UPDATE cliente_socketid SET key_suscripcion_push = NULL WHERE idcliente = ?',
		[idcliente], 'UPDATE', 'pushCliente.limpiarToken');
}

async function notificarEstado({ idpedido, idcliente, pwa_estado, pwa_delivery_status }) {
	const id = parseInt(idcliente, 10);
	const pedido = parseInt(idpedido, 10);
	if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(pedido) || pedido <= 0) { return; }

	try {
		const rows = await QueryServiceV1.ejecutarConsulta(
			'SELECT key_suscripcion_push FROM cliente_socketid WHERE idcliente = ?',
			[id], 'SELECT', 'pushCliente.token');
		const suscripcion = leerTokenFcm(rows && rows[0] ? rows[0].key_suscripcion_push : null);
		if (!suscripcion) { return; }

		const mensaje = construirMensaje(pedido, pwa_estado, pwa_delivery_status);

		try {
			await adminFirebase.messaging().send({
				token: suscripcion.token,
				notification: { title: mensaje.title, body: mensaje.body },
				data: { tipo: 'estado_pedido', idpedido: String(pedido) },
				android: {
					priority: 'high',
					notification: { channelId: CANAL_ANDROID, sound: 'default', priority: 'high', tag: `pedido_${pedido}` }
				},
				apns: { payload: { aps: { sound: 'default' } } }
			});
			logger.debug({ idpedido: pedido, idcliente: id, estado: mensaje.codigo }, 'push cliente enviado');
		} catch (err) {
			// nunca se loguea el token completo
			logger.error({ idpedido: pedido, idcliente: id, code: err.code, token: suscripcion.token.slice(0, 12) }, 'push cliente fallido');
			if (CODIGOS_TOKEN_MUERTO.includes(err.code)) {
				await limpiarToken(id);
			}
		}
	} catch (error) {
		logger.error({ error: error.message, idpedido: pedido, idcliente: id }, 'pushCliente.notificarEstado');
	}
}

module.exports = { notificarEstado, construirMensaje, codigoEstado, leerTokenFcm, MENSAJES, CANAL_ANDROID };
```

- [ ] **Step 4: Ejecutar el spec.**

Run: `npx jest test/push.cliente.service.test.js`
Expected: PASS, 22 tests, 0 failures.

- [ ] **Step 5: Hacer que `push/suscripcion` responda y acepte el formato nuevo.** En `controllers/sendMsj.js`, reemplazar las líneas 262-273 (el bloque completo `// notificaciones push` … `module.exports.pushSuscripcion = pushSuscripcion;`) por:

```js
// notificaciones push
// guardar suscripcion notificacion push
// body: { idcliente, token, plataforma } (app nativa). Compatibilidad: apps viejas mandan
// solo { suscripcion } con el token en string o un objeto PushSubscription de web push.
const pushSuscripcion = async function (req, res) {
	const idcliente = parseInt(req.body ? req.body.idcliente : null, 10);
	if (!Number.isFinite(idcliente) || idcliente <= 0) {
		return ReE(res, 'idcliente invalido', 400);
	}

	const suscripcion = req.body.suscripcion;
	const tokenBody = typeof req.body.token === 'string' ? req.body.token.trim() : '';
	const tokenCompat = typeof suscripcion === 'string' ? suscripcion.trim() : '';
	const token = tokenBody || tokenCompat;
	const plataforma = ['android', 'ios', 'web'].indexOf(req.body.plataforma) !== -1 ? req.body.plataforma : 'android';

	let valor = null;
	if (token.length >= 20) {
		valor = JSON.stringify({ tipo: 'fcm', token, plataforma });
	} else if (suscripcion && typeof suscripcion === 'object') {
		valor = JSON.stringify(suscripcion); // web push viejo: se guarda tal cual, el emisor lo ignora
	}
	if (!valor) {
		return ReE(res, 'suscripcion invalida', 400);
	}

	try {
		// upsert: el cliente puede no tener fila en cliente_socketid todavia
		const update_query = `INSERT INTO cliente_socketid (idcliente, socketid, conectado, key_suscripcion_push)
			VALUES (?, '', '0', ?)
			ON DUPLICATE KEY UPDATE key_suscripcion_push = VALUES(key_suscripcion_push)`;
		await QueryServiceV1.ejecutarConsulta(update_query, [idcliente, valor], 'INSERT', 'pushSuscripcion');
		return ReS(res, { ok: true });
	} catch (error) {
		logger.error({ error: error.message, idcliente }, 'pushSuscripcion');
		return ReE(res, 'no se pudo guardar la suscripcion', 500);
	}
}
module.exports.pushSuscripcion = pushSuscripcion;
```
`ReE`, `ReS`, `QueryServiceV1` y `logger` ya están importados en la cabecera de `sendMsj.js` (líneas 1, 8 y 14); no agregar imports. La ruta `routerV3.post('/push/suscripcion', apiPwaSMS.pushSuscripcion);` (`routes/v3.js:183`) no cambia: ahora el handler sí recibe `res` y responde.

- [ ] **Step 6: Verificar que el módulo sigue cargando.**

Run: `node -e "require('./controllers/sendMsj'); process.stdout.write('ok sendMsj\n')"`
Expected: `ok sendMsj`. Si el require falla por credenciales o conexiones (firebase/sequelize), anotarlo y verificar en su lugar con `node --check controllers/sendMsj.js` (Expected: sin salida y exit 0).

- [ ] **Step 7: Commit (solo archivos propios).** Escribir `D:\Projects\backend-pedidos\.superpowers\sdd\2026-09-10-sprint3-push\commit-msg-task-3.txt`:

```
feat: emisor de push al cliente y endpoint push/suscripcion compatible

push/suscripcion se registraba en Express con un handler que solo recibia req: la
peticion del cliente quedaba colgada hasta el timeout. Ahora responde, valida que
el idcliente sea mayor que cero y guarda el token como
{"tipo":"fcm","token":"...","plataforma":"android"} con upsert, manteniendo
compatibilidad con el objeto PushSubscription que mandaban las versiones web.

service/push.cliente.service.js envia la notificacion por firebase-admin con las
mismas etiquetas de estado que ve el cliente, canal "pedidos" y data.idpedido, y
borra el token cuando FCM lo declara muerto. Nunca se loguea el token completo.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
```

Luego:
```
git add service/push.cliente.service.js test/push.cliente.service.test.js controllers/sendMsj.js
git commit -F .superpowers/sdd/2026-09-10-sprint3-push/commit-msg-task-3.txt
```

---

### Task 4: Backend: enviar el push en cada cambio de estado del pedido

**Hallazgo que cierra:** 10 (backend: ningún cambio de estado dispara push al cliente). El Sprint 2, Task 1, dejó el punto de enganche exacto: dentro de `notificar()` de `service/estado-pedido.service.js` está la línea `// ponytail: aquí engancha el push por cambio de estado (sprint 3)`, justo después del `io.to(...).emit('pedido-cambio-estado', payload)`. Todos los orígenes de cambio de estado (`apiRepartidor`, `apiRepartidorV2`, `apiComercio`, `apiPrintServer`, `sockets.js`) ya llaman a `notificar()`, así que no hay que tocarlos.

**Files (backend):**
- Modify: `service/estado-pedido.service.js` (función `notificar`)
- Modify: `test/estado-pedido.service.test.js` (agregar el mock del servicio de push)
- Test: `test/estado-pedido.push.test.js`

**Interfaces:**
- Consumes: `pushCliente.notificarEstado({ idpedido, idcliente, pwa_estado, pwa_delivery_status })` (Task 3).
- Consumes: `estadoPedidoService.setIo(io)` y `estadoPedidoService.notificar(idpedido)` (Sprint 2, Task 1).
- Produces: ningún API nuevo; `notificar()` mantiene su firma y su promesa que nunca rechaza.

- [ ] **Step 1: Escribir el spec del enganche (falla).** Crear `test/estado-pedido.push.test.js`:

```js
jest.mock('../service/query.service.v1', () => ({ ejecutarConsulta: jest.fn() }));
jest.mock('../service/push.cliente.service', () => ({ notificarEstado: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../utilitarios/logger', () => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

const QueryServiceV1 = require('../service/query.service.v1');
const pushCliente = require('../service/push.cliente.service');
const svc = require('../service/estado-pedido.service');

function ioMock() {
  const emitted = [];
  return { emitted, to: (room) => ({ emit: (evt, payload) => emitted.push({ room, evt, payload }) }) };
}

describe('estado-pedido.service.notificar + push', () => {
  beforeEach(() => {
    QueryServiceV1.ejecutarConsulta.mockReset();
    pushCliente.notificarEstado.mockClear();
  });

  it('manda el push con el estado del pedido despues de emitir el socket', async () => {
    QueryServiceV1.ejecutarConsulta.mockResolvedValue([
      { idpedido: 77, idcliente: 15, pwa_estado: 'A', pwa_delivery_status: '3', idrepartidor: 3, position_now: null }
    ]);
    const io = ioMock();
    svc.setIo(io);

    await svc.notificar(77);

    expect(io.emitted.length).toBe(1);
    expect(pushCliente.notificarEstado).toHaveBeenCalledWith({
      idpedido: 77, idcliente: 15, pwa_estado: 'A', pwa_delivery_status: '3'
    });
  });

  it('no manda push si el pedido no tiene cliente', async () => {
    QueryServiceV1.ejecutarConsulta.mockResolvedValue([{ idpedido: 77, idcliente: 0 }]);
    svc.setIo(ioMock());
    await svc.notificar(77);
    expect(pushCliente.notificarEstado).not.toHaveBeenCalled();
  });

  it('si el push falla, notificar igual resuelve', async () => {
    QueryServiceV1.ejecutarConsulta.mockResolvedValue([
      { idpedido: 77, idcliente: 15, pwa_estado: 'E', pwa_delivery_status: '4', position_now: null }
    ]);
    pushCliente.notificarEstado.mockRejectedValueOnce(new Error('fcm caido'));
    svc.setIo(ioMock());
    await expect(svc.notificar(77)).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Ejecutar y ver fallar.**

Run: `npx jest test/estado-pedido.push.test.js`
Expected: FAIL — `notificarEstado` no fue llamado (hoy solo hay un comentario en su lugar).

- [ ] **Step 3: Enganchar el push en `service/estado-pedido.service.js`.**

(a) Agregar el require debajo de `const logger = require('../utilitarios/logger');`:
```js
const pushCliente = require('./push.cliente.service');
```
(b) Dentro de `notificar(idpedido)`, reemplazar estas dos líneas:
```js
		io.to(`cliente_${Number(idcliente)}`).emit('pedido-cambio-estado', payload);
		// ponytail: aquí engancha el push por cambio de estado (sprint 3)
```
por:
```js
		io.to(`cliente_${Number(idcliente)}`).emit('pedido-cambio-estado', payload);

		// el socket solo llega si la app esta abierta; el push cubre el resto
		await pushCliente.notificarEstado({
			idpedido: Number(idpedido),
			idcliente: Number(idcliente),
			pwa_estado: est.pwa_estado,
			pwa_delivery_status: est.pwa_delivery_status
		});
```
El `await` queda dentro del `try/catch` que ya tiene `notificar()`, así que un fallo del push no rompe el emit ni propaga la excepción.

- [ ] **Step 4: Aislar el spec del Sprint 2.** En `test/estado-pedido.service.test.js`, agregar como tercera línea (junto a los otros `jest.mock`, ANTES de los `require`):
```js
jest.mock('../service/push.cliente.service', () => ({ notificarEstado: jest.fn().mockResolvedValue(undefined) }));
```
Sin esto, ese test carga el servicio de push real y con él `firebase_config` (que inicializa Firebase Admin con `serviceAccountKey.json`).

- [ ] **Step 5: Ejecutar los dos specs.**

Run: `npx jest test/estado-pedido.push.test.js test/estado-pedido.service.test.js`
Expected: PASS en ambos archivos, 0 failures.

- [ ] **Step 6: Commit (solo archivos propios).** Escribir `D:\Projects\backend-pedidos\.superpowers\sdd\2026-09-10-sprint3-push\commit-msg-task-4.txt`:

```
feat: push al cliente en cada cambio de estado del pedido

estado-pedido.service.notificar() ya centralizaba el aviso por socket a la sala
cliente_<idcliente>; ahora tambien envia el push con el titulo y el cuerpo del
estado y data.idpedido. El socket solo llega con la app abierta, el push cubre el
resto. Un fallo del envio no rompe el emit: notificar() sigue sin lanzar.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
```

Luego:
```
git add service/estado-pedido.service.js test/estado-pedido.push.test.js test/estado-pedido.service.test.js
git commit -F .superpowers/sdd/2026-09-10-sprint3-push/commit-msg-task-4.txt
```

---

### Task 5: App: `await` en `confirmado` y limpieza de los demás puntos de llamada

**Hallazgos que cierra:** 8 (MEDIO: `if (this.pushNotificationSerice.getIsTienePermiso())` sin `await` — un `Promise` siempre es truthy, así que la rama del diálogo está muerta), 9 parcial (el flujo salta iOS con `getOS() !== 'iOS'`), 5 parcial (reenviar el token con el `idcliente` definitivo después de guardar el pedido), y el código muerto de prueba en `establecimientos`.

**Files:**
- Modify: `src/app/pages/pedido-confirmado/confirmado/confirmado.component.ts` (`finDeliveryAvisoMsj` línea ~49 y `lanzarPermisoNotificationPush` líneas 72-101)
- Modify: `src/app/pages/pagar-cuenta/pagar-cuenta/pagar-cuenta.component.ts` (`lanzarPermisoNotificationPush` líneas 613-631)
- Modify: `src/app/pages/zona-establecimientos/establecimientos/establecimientos.component.ts`
- Modify: `src/app/pages/zona-establecimientos/establecimientos/establecimientos.component.html`

**Interfaces:**
- Consumes: `NotificacionPushService.getIsTienePermiso(): Promise<boolean>`, `suscribirse(): Promise<void>`, `enviarSuscripcion(): void` (Task 1).

- [ ] **Step 1: `confirmado.component.ts` — quitar la exclusión de iOS.** Reemplazar en `finDeliveryAvisoMsj()`:
```ts
    if ( this.utilitariosSerivce.getOS() !== 'iOS' ) {
      this.lanzarPermisoNotificationPush(0);
    }
```
por:
```ts
    // iOS ya no se excluye: el push nativo es el mismo camino en Android y en iOS
    this.lanzarPermisoNotificationPush(0);
```
Dejar `private utilitariosSerivce: UtilitariosService` en el constructor tal como está (se usa en otros puntos del archivo; comprobarlo con `Select-String -Path src/app/pages/pedido-confirmado/confirmado/confirmado.component.ts -Pattern "utilitariosSerivce"` — si el único resultado fuese el del constructor, dejarlo igual: quitarlo no aporta nada y arriesga el build).

- [ ] **Step 2: `confirmado.component.ts` — `await` y reenvío del token.** Reemplazar el método completo `lanzarPermisoNotificationPush` (líneas 72-101, incluidos los bloques comentados) por:

```ts
  private async lanzarPermisoNotificationPush(option: number = 0) {
    try {
      // el pedido ya se guardo: el idcliente definitivo puede haber cambiado
      this.pushNotificationSerice.enviarSuscripcion();

      if ( await this.pushNotificationSerice.getIsTienePermiso() ) {
        await this.pushNotificationSerice.suscribirse();
        return;
      }
    } catch (error) {
      console.error('lanzarPermisoNotificationPush', error);
    }

    // si no tiene permiso le pregunta
    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;
    _dialogConfig.data = {idMjs: option};

    const _dialogReset = this.dialog.open(DialogDesicionComponent, _dialogConfig);
    _dialogReset.afterClosed().subscribe(result => {
      if ( result ) {
        this.pushNotificationSerice.suscribirse();
      }
    });
  }
```

- [ ] **Step 3: `pagar-cuenta.component.ts` — mismo reenvío del token.** En `lanzarPermisoNotificationPush` (ya es `async` y ya usa `await`, no hay bug de `await` aquí), agregar como primera línea del cuerpo del método, antes del `if`:
```ts
    this.pushNotificationSerice.enviarSuscripcion();
```
y sustituir `this.pushNotificationSerice.suscribirse();` de la rama del `if` por `await this.pushNotificationSerice.suscribirse();`. No tocar el resto del método ni la llamada de la línea 597.

- [ ] **Step 4: `establecimientos.component.ts` — borrar el código muerto de prueba.** Eliminar:
```ts
  notificationPushTest() {
    this.notificationPushService.suscribirse()
  }
```
y también el bloque comentado que le sigue (el `// private lanzarPermisoNotificationPush() { ... }` completo, hasta su `// }`), la línea del constructor `private notificationPushService: NotificacionPushService` (dejando la coma de la línea anterior correcta) y el import `import { NotificacionPushService } from 'src/app/shared/services/notificacion-push.service';`.

Antes de borrar la inyección, comprobar que no se use en otro sitio:
Run: `Select-String -Path src/app/pages/zona-establecimientos/establecimientos/establecimientos.component.ts -Pattern "notificationPushService"`
Expected después del borrado: sin resultados.

- [ ] **Step 5: `establecimientos.component.html` — borrar el botón de prueba comentado.** Eliminar las líneas:
```html
    <!-- test -->
    <!-- <button (click)="notificationPushTest()">Registrar Notification</button> -->
```

- [ ] **Step 6: Type-check y build de release.**

Run: `npx tsc -p src/tsconfig.app.json --noEmit`
Expected: sin errores.
Run: `npx ng build --configuration production`
Expected: exit 0.

- [ ] **Step 7: Commit.** Escribir `.superpowers/sdd/2026-09-10-sprint3-push/commit-msg-task-5.txt`:

```
fix: await en el chequeo de permiso de push y limpieza de los puntos de llamada

confirmado.component evaluaba if (getIsTienePermiso()) sobre una promesa, que
siempre es truthy: la rama del dialogo estaba muerta y en iOS ni siquiera se
entraba al flujo. Ahora se espera el resultado, iOS deja de excluirse y despues de
guardar el pedido se reenvia el token con el idcliente definitivo. Se elimina el
metodo de prueba notificationPushTest y su boton comentado.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
```

Luego:
```
git add src/app/pages/pedido-confirmado/confirmado/confirmado.component.ts src/app/pages/pagar-cuenta/pagar-cuenta/pagar-cuenta.component.ts src/app/pages/zona-establecimientos/establecimientos/establecimientos.component.ts src/app/pages/zona-establecimientos/establecimientos/establecimientos.component.html
git commit -F .superpowers/sdd/2026-09-10-sprint3-push/commit-msg-task-5.txt
```

---

### Task 6: Verificación end to end: `cap sync`, APK de depuración, build de producción y prueba manual

**Hallazgo que cierra:** 11 (verificación de compilación Android real, sin inventar éxitos).

**Estado de la máquina comprobado por el planificador** (no volver a asumirlo, sí volver a comprobarlo si algo falla):
- SDK Android en `C:\Users\user\AppData\Local\Android\Sdk` (`android/local.properties` ya apunta ahí), plataformas `android-33` a `android-36` y build-tools `33.0.x` instaladas.
- JDK instalados: 8, 11, 17 y 21. `JAVA_HOME` apunta a `jdk-21`, **que Gradle 7.4.2 no soporta**: hay que forzar `jdk-17` en la sesión del comando.
- `android/app/google-services.json` y `ios/App/App/GoogleService-Info.plist` existen.

**Files:**
- Modify: ninguno salvo lo que regenere `npx cap sync android` (`android/app/src/main/assets/public/**`, `android/app/src/main/assets/capacitor.config.json`, `android/app/capacitor.build.gradle`, `android/capacitor.settings.gradle`).
- Create: `docs/superpowers/notas/2026-09-10-verificacion-push.md` (bitácora de la verificación).

**Interfaces:**
- Consumes: todo lo anterior. No produce API nueva.

- [ ] **Step 1: Build de producción de la app (genera `dist/pwa-app-pedido`, que `cap sync` necesita).**

Run: `npx ng build --configuration production`
Expected: exit 0. Anotar el tamaño del bundle principal que imprime el build.

- [ ] **Step 2: Sincronizar el proyecto Android.**

Run: `npx cap sync android`
Expected: exit 0 y en la salida los plugins listados SIN `@capacitor-firebase/messaging` (deben quedar: `@capacitor-community/barcode-scanner`, `@capacitor/app`, `@capacitor/browser`, `@capacitor/camera`, `@capacitor/geolocation`, `@capacitor/push-notifications`).

Run: `Select-String -Path android/app/capacitor.build.gradle -Pattern "firebase"`
Expected: sin resultados.

- [ ] **Step 3: Comprobar que el manifiesto fusionado quedó bien.**

Run: `Select-String -Path android/app/src/main/AndroidManifest.xml -Pattern "POST_NOTIFICATIONS|default_notification_channel_id|geo.API_KEY"`
Expected: tres coincidencias, y la de `geo.API_KEY` en una línea anterior al `</application>` (verificarlo abriendo el archivo si hace falta).

- [ ] **Step 4: Compilar el APK de depuración.**

Run: `cd android; $env:JAVA_HOME='C:\Program Files\Java\jdk-17'; .\gradlew.bat assembleDebug --no-daemon`
Expected: `BUILD SUCCESSFUL` y el APK en `android/app/build/outputs/apk/debug/app-debug.apk`.

Reglas de honestidad para este paso:
- Si el build falla por **código o configuración nuestra** (recurso `ic_stat_notify` o `notification_color` no encontrado, error de manifiesto, plugin duplicado), es un fallo de la tarea: arreglarlo y repetir.
- Si falla por **entorno** (no baja Gradle por red, falta una build-tool, licencias del SDK sin aceptar), dejar el paso marcado como `verificar en la máquina con Android Studio`, copiar el error textual en la bitácora del Step 6 y NO declararlo exitoso.
- Volver a la raíz al terminar: `cd ..`

- [ ] **Step 5: Correr todas las pruebas nuevas del sprint.**

App (desde `D:\Projects\capacitor\pwa-app-pedido`):
Run: `npx ng test --include=src/app/shared/utils/push-payload.spec.ts --watch=false --browsers=ChromeHeadless`
Expected: PASS.

Backend (desde `D:\Projects\backend-pedidos`):
Run: `npx jest test/push.cliente.service.test.js test/estado-pedido.push.test.js test/estado-pedido.service.test.js`
Expected: PASS en los tres archivos.

- [ ] **Step 6: Escribir la bitácora `docs/superpowers/notas/2026-09-10-verificacion-push.md`** con esta plantilla, rellenando cada campo con lo que realmente pasó (si algo no se pudo verificar, escribir `no verificado` y por qué; nunca inventar un OK):

```markdown
# Verificación Sprint 3 (push) — 2026-09-10

| Comprobación | Resultado |
|---|---|
| `npx ng build --configuration production` | |
| `npx cap sync android` | |
| Plugins sincronizados (sin `@capacitor-firebase/messaging`) | |
| `gradlew assembleDebug` (JDK 17) | |
| `push-payload.spec.ts` | |
| `push.cliente.service.test.js` | |
| `estado-pedido.push.test.js` | |
| `estado-pedido.service.test.js` | |

## Pendiente de prueba en dispositivo real
- [ ] Instalar el APK en un Android 13+ y confirmar que al primer arranque aparece el diálogo de permiso de notificaciones (lo dispara la creación del canal `pedidos` con `targetSdkVersion` 32).
- [ ] Ajustes del sistema > Notificaciones de Papaya Express: debe existir el canal **Estado del pedido**.
- [ ] Hacer un pedido y cambiar su estado desde el monitor: llega la notificación con el título del estado; el icono de la barra es la silueta blanca y el color de acento es naranja.
- [ ] Con la app en primer plano: aparece el banner (snackbar) arriba con título y cuerpo, y el botón "Ver" abre el pedido.
- [ ] Con la app cerrada: tocar la notificación abre "Mis pedidos" y se abre el detalle del pedido de la notificación.
- [ ] En la base: `SELECT idcliente, LEFT(key_suscripcion_push, 30) FROM cliente_socketid WHERE idcliente = <el del cliente de prueba>` devuelve un JSON que empieza por `{"tipo":"fcm"`. **No copiar el token completo a ningún lado.**

## Deuda declarada
- Capacitor 4 + `@capacitor/push-notifications` v4: `requestPermissions()` / `checkPermissions()` responden `granted` sin consultar al sistema operativo. El arreglo real es el sprint de actualización a Capacitor 5 + plugin v5 + `compileSdk`/`targetSdk` 34 (que además necesita AGP 8.1.1 y Gradle 8).
- Push web (PWA en navegador): fuera de alcance mientras `ServiceWorkerModule` siga comentado en `app.module.ts`.
```

- [ ] **Step 7: Commit.** Escribir `.superpowers/sdd/2026-09-10-sprint3-push/commit-msg-task-6.txt`:

```
chore: sincroniza el proyecto Android y deja la bitacora de verificacion del push

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
```

Luego (desde la raíz de la app):
```
git add docs/superpowers/notas/2026-09-10-verificacion-push.md android/app/capacitor.build.gradle android/capacitor.settings.gradle android/app/src/main/assets/capacitor.config.json
git commit -F .superpowers/sdd/2026-09-10-sprint3-push/commit-msg-task-6.txt
```
`android/app/src/main/assets/public/**` son los assets compilados: si `.gitignore` no los excluye ya, NO agregarlos al commit (comprobar con `git status --short android/app/src/main/assets`).

---

## Self-Review

**1. Cobertura del spec (11 hallazgos):**

| # | Hallazgo | Dónde se resuelve |
|---|---|---|
| 1 | `SwPush` con `ServiceWorkerModule` comentado → `NullInjectorError` | Task 1, Steps 5 y 9 (reescritura del servicio + verificación de que no queda ninguna referencia a `SwPush`) |
| 2 | Dos plugins de push instalados | Task 2, Steps 1-3 (`npm uninstall`, pod de iOS, `cap update`, verificación en `capacitor.build.gradle`) |
| 3 | Sin listeners `pushNotificationReceived` / `pushNotificationActionPerformed` | Task 1, Step 5 (`registrarListeners`, `mostrarBanner` con `MatSnackBar`, `abrirPedido` → `/zona-delivery/pedidos?idpedido=N`) + Step 8 (la lista abre el detalle) |
| 4 | `targetSdk` 32, sin `POST_NOTIFICATIONS`, permiso resuelto siempre `granted` | Task 2, Steps 6 y 7 + Global Constraints (decisión razonada de quedarse en target 32 y subir solo `compileSdk` a 33; deuda anotada en la bitácora de la Task 6) |
| 5 | Token registrado solo al final del pedido, nunca refrescado | Task 1, Steps 5-7 (arranque, login y rotación del token) + Task 5, Steps 2-3 (después del pedido) |
| 6 | `saveSuscripcion` con `idcliente` nullable y forma de payload distinta por plataforma | Task 1, Step 3 (`construirSuscripcionPush` devuelve `null` si `idcliente <= 0`) + Task 3, Step 5 (validación y compatibilidad en el backend) |
| 7 | Sin canal, sin icono/color, `<meta-data>` de Maps fuera de `<application>` | Task 1, Step 5 (`crearCanal`) + Task 2, Steps 4-6 |
| 8 | `if (getIsTienePermiso())` sin `await` | Task 5, Step 2 |
| 9 | iOS: entitlement `development`, sin `remote-notification`, flujo excluye iOS | Task 2, Steps 8-9 + Task 5, Step 1 |
| 10 | Backend: no envía push en los cambios de estado; formato del token | Task 3 (emisor + endpoint) y Task 4 (enganche en `estado-pedido.service.notificar`) |
| 11 | Verificación Android real | Task 6, Steps 2-4 con reglas explícitas de qué contar como fallo propio y qué marcar `verificar en la máquina con Android Studio` |

Sin huecos. Los siete estados con sus etiquetas exactas están en `MENSAJES` (Task 3, Step 3) y se prueban en el spec de esa misma tarea.

**2. Barrido de marcadores de posición:** no hay `TBD`, `TODO`, "implementar después", "agregar manejo de errores" ni "similar a la Task N". Todos los bloques de código están completos: el servicio de Angular, los dos módulos del backend, el generador de PNG, el manifiesto y los dos plists van enteros, no en fragmentos. Los cuatro `// ponytail:` son simplificaciones declaradas a propósito (push solo nativo, `targetSdk` 32, estado `aceptado` sin origen de datos, retardo de 800 ms en la navegación), tal como exige el convenio de los sprints 1 y 2. Los tres puntos donde el implementador debe mirar el archivo real —el `map` de `loadMisPedidos`, el uso de `utilitariosSerivce` en `confirmado` y el bloque `// notificaciones push` de `sendMsj.js`— indican el comando `Select-String` exacto y el texto a buscar.

**3. Consistencia de tipos y nombres:**
- `CANAL_PEDIDOS = 'pedidos'` (Task 1) = `android:value="pedidos"` del manifiesto (Task 2) = `CANAL_ANDROID = 'pedidos'` del backend (Task 3) = aserción `channelId === 'pedidos'` del spec (Task 3).
- Payload de red: la app envía `{ idcliente, token, plataforma, suscripcion }` (Task 1, Step 3) y el backend lee exactamente esos cuatro campos (Task 3, Step 5).
- Formato en base: `{"tipo":"fcm","token":"...","plataforma":"android"}` escrito en Task 3 Step 5 y leído por `leerTokenFcm` en Task 3 Step 3, con el mismo `LARGO_MINIMO_TOKEN = 20` que usa `construirSuscripcionPush` en la app.
- `data: { tipo: 'estado_pedido', idpedido: String(pedido) }` (Task 3) ↔ `Number(data.idpedido)` en `abrirPedido` (Task 1) ↔ `queryParams['idpedido']` en `mis-ordenes` (Task 1, Step 8). FCM entrega siempre `data` como strings; por eso el `Number(...)` en el cliente y el `String(...)` en el servidor.
- `codigoEstado()` del backend devuelve los mismos siete códigos y aplica la misma tabla de decisión que `resumirEstadoPedido()` del Sprint 2 (`cancelado` → `entregado` → `camino` → `asignado` → `preparando` → `recibido`), con los mismos casos de prueba.
- `notificarEstado({ idpedido, idcliente, pwa_estado, pwa_delivery_status })`: la firma del objeto es idéntica en la definición (Task 3), en la llamada (Task 4, Step 3) y en la aserción del spec (Task 4, Step 1).
- `getIsTienePermiso(): Promise<boolean>` conserva el nombre original (con su errata `Serivce`/`Serice` en los campos de los componentes), así que los tres puntos de llamada existentes siguen compilando.
