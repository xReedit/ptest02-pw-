# Sprint 1: sesión, confirmación de pedido y configuración segura — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el cliente pueda confirmar su pedido sin pantallas en blanco ni cargas infinitas, que vea su pedido en "Mis pedidos", que su sesión dure hasta que cierre sesión, y que la app deje de embarcar credenciales y URLs de desarrollo.

**Architecture:** Dos repos. App Angular 14 + Capacitor en `D:\Projects\capacitor\pwa-app-pedido` (rama `master`). API Node + socket.io 2 en `D:\Projects\backend-pedidos` (rama `master`, tiene trabajo de Yape sin commit que NO se toca: `app.js`, `controllers/serviceSendCPE.js`, `firebase_config.js`, `INTEGRACION-YAPE.md`, `controllers/yapeIntegracion.js`, `routes/routesYape.js`). La base MySQL `restobar` en `192.168.1.65` es la de desarrollo. Se hacen cambios mínimos y localizados; no se refactoriza lo que no está roto.

**Tech Stack:** Angular 14.2, RxJS 6.5, socket.io-client 2.4, Capacitor 4, Karma + Jasmine (ChromeHeadless), Node + Express + mysql2 + Jest en el backend.

**Spec:** Informe de auditoría publicado en https://claude.ai/code/artifact/5c78f362-72fb-42e9-bfca-ea38b9ebc43b (secciones 2, 3, 8, 9 Fase 0 y 1, 12 y 14). Un resumen de cada hallazgo va dentro de cada tarea.

## Global Constraints

- Trabajar directo en `master` de cada repo (desarrollador solo, consentimiento dado). No crear ramas.
- Commits en español con formato `<tipo>: <descripción>` y terminar con las dos líneas de atribución copiadas LITERALMENTE (no cambiar el nombre del modelo aunque tú seas otro):
  ```
  Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
  ```
- Para que las tildes del mensaje de commit no se pierdan en PowerShell: escribir el mensaje completo (asunto, cuerpo y las dos líneas de atribución) en un archivo UTF-8 con la herramienta Write (por ejemplo `.superpowers/sdd/2026-09-09-sprint1-sesion-confirmacion/commit-msg-task-N.txt`) y ejecutar `git commit -F <ese archivo>`. Nunca `git commit -m` con texto acentuado.
- En el backend, `git add` solo los archivos propios de la tarea. Nunca `git add -A` ni `git add .` en `D:\Projects\backend-pedidos`.
- Verificación de compilación de la app: `npx ng build --configuration production` desde la raíz de la app (AOT + reemplazo de `environment.prod.ts`; es el build de release, tarda 3 a 6 minutos). Para verificaciones rápidas: `npx tsc -p src/tsconfig.app.json --noEmit`. Donde una tarea diga solo `npx ng build`, usar `npx ng build --configuration production`.
- Pruebas de la app: `npx ng test --include=<ruta del spec> --watch=false --browsers=ChromeHeadless`. Chrome está en `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`. Solo se ejecutan los specs nuevos; los 61 specs generados por defecto están rotos y no se tocan.
- Pruebas del backend: `npx jest <archivo>` desde `D:\Projects\backend-pedidos`.
- Nunca imprimir ni copiar a un commit el valor decodificado de credenciales. Los archivos que hoy contienen credenciales Niubiz se limpian en la Tarea 10.
- No usar `localStorage.clear()` salvo en cierre de sesión explícito por el usuario.
- Sin `console.log` nuevos. `console.error` solo en catch.
- Shell: las herramientas corren en PowerShell 5.1 en Windows. No usar `&&`, `cat`, `head`, `sed`. Usar `Get-Content`, `Select-String`, `;`.
- Marcar simplificaciones deliberadas con un comentario `// ponytail: <qué se simplificó y cuándo ampliarlo>`.

---

### Task 1: URLs y flags a `environment.*`

**Hallazgo:** `src/app/shared/config/config.const.ts` está comprometido apuntando a `http://localhost:5819` y `http://192.168.1.65/...`. Las URLs de producción están en un bloque comentado que se intercambia a mano antes de cada deploy. `environment.ts` dice `production: true`.

**Files:**
- Modify: `src/environments/environment.ts`
- Modify: `src/environments/environment.prod.ts`
- Modify: `src/app/shared/config/config.const.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `environment.apiUrl`, `environment.socketUrl`, `environment.imgCartaUrl`, `environment.imgPromoUrl`, `environment.imgComercioUrl`, `environment.imgIconsUrl`, `environment.speechSocketUrl`, `environment.speechAudioUrl`, `environment.vapidPublic` (todas `string`). Las constantes exportadas de `config.const.ts` conservan sus nombres, así ningún import cambia.

- [ ] **Step 1: Editar `src/environments/environment.ts`** (desarrollo). Reemplazar el objeto `environment` completo por:

```ts
import { envSecrets } from './env.secrets';

export const environment = {
  production: false,
  view_mozo: false, // true = app solo mozo
  googleMapsApiKey: envSecrets.googleMapsApiKey,
  apiUrl: 'http://localhost:5819/v3',
  socketUrl: 'http://localhost:5819',
  speechSocketUrl: 'http://192.168.1.65:1337',
  speechAudioUrl: 'http://192.168.1.65:1337/resources/',
  imgCartaUrl: 'http://192.168.1.65/restobar/file/',
  imgPromoUrl: 'http://192.168.1.65/restobar/repositorio/img_promo/',
  imgComercioUrl: 'http://192.168.1.65/restobar/print/logo/',
  imgIconsUrl: 'http://192.168.1.65/restobar/images/',
  vapidPublic: 'BC7ietauZE99Hx9HkPyuGVr8jaYETyEJgH-gLaYIsbORYobppt9dX49_K_wubDqphu1afi7XrM6x1zAp4kJh_wU',
  niubiz: {
    merchantId: '456879852',
    urlApiSeguridad: 'https://apisandbox.vnforappstest.com/api.security/v1/security',
    urlApiSesion: 'https://apisandbox.vnforappstest.com/api.ecommerce/v2/ecommerce/token/session/',
    urlApiAutorizacion: 'https://apisandbox.vnforappstest.com/api.authorization/v3/authorization/ecommerce/',
    urlJs: 'https://static-content-qas.vnforapps.com/v2/js/checkout.js?qa=true',
    logo: 'https://papaya.com.pe/images/l-pay-2.png',
    authorization: 'Basic aW50ZWdyYWNpb25lcy52aXNhbmV0QG5lY29tcGx1cy5jb206ZDVlN25rJE0='
  }
};
```
Conservar el bloque `niubiz` tal cual (se limpia en la Tarea 10). Conservar el comentario de cabecera y el comentario final de `zone-error`.

- [ ] **Step 2: Editar `src/environments/environment.prod.ts`**. Reemplazar el objeto por:

```ts
import { envSecrets } from './env.secrets';

export const environment = {
  production: true,
  view_mozo: false, // true = app solo mozo // solo para vista incial
  googleMapsApiKey: envSecrets.googleMapsApiKey,
  apiUrl: 'https://app.restobar.papaya.com.pe/api.pwa/v3',
  socketUrl: 'https://app.restobar.papaya.com.pe/',
  speechSocketUrl: 'https://app.restobar.papaya.com.pe/',
  speechAudioUrl: 'https://app.restobar.papaya.com.pe/speech/resources/',
  imgCartaUrl: 'https://restobar.papaya.com.pe/file/',
  imgPromoUrl: 'https://restobar.papaya.com.pe/repositorio/img_promo/',
  imgComercioUrl: 'https://restobar.papaya.com.pe/print/logo/',
  imgIconsUrl: 'https://restobar.papaya.com.pe/images/',
  vapidPublic: 'BOiwO8PftVFo8MrQfp3oAv4KbVtFdZAQojGKgzyxMCPgiNhg8PySbOSlkxDqd3iKA4J1GhzwFiCIGKmXRiKZM_0',
  niubiz: {
    merchantId: '650149801',
    urlApiSeguridad: 'https://apiprod.vnforapps.com/api.security/v1/security',
    urlApiSesion: 'https://apiprod.vnforapps.com/api.ecommerce/v2/ecommerce/token/session/',
    urlApiAutorizacion: 'https://apiprod.vnforapps.com/api.authorization/v3/authorization/ecommerce/',
    urlJs: 'https://static-content.vnforapps.com/v2/js/checkout.js',
    logo: 'https://papaya.com.pe/images/l-pay-2.png',
    authorization: 'Basic bWFjcmF6ZS5pbmZvQGdtYWlsLmNvbTpqMzRPeiFuQg=='
  }
};
```
(El bloque `niubiz` se conserva sin cambios; la Tarea 10 lo elimina.)

- [ ] **Step 3: Reescribir `src/app/shared/config/config.const.ts`** para que las constantes salgan de `environment`:

```ts
import { Capacitor } from '@capacitor/core';
import { environment } from 'src/environments/environment';

export const IS_NATIVE = Capacitor.getPlatform() !== 'web';
export const IS_PLATAFORM_IOS = IS_NATIVE ? Capacitor.getPlatform() === 'ios' : false;

// Las URLs viven en environment.ts / environment.prod.ts; angular.json hace el reemplazo por configuración.
export const URL_SERVER = environment.apiUrl;
export const URL_SERVER_SOCKET = environment.socketUrl;
export const URL_SERVER_SOCKET_SPEECH = environment.speechSocketUrl;
export const URL_SERVER_FILE_AUDIO_SPEECH = environment.speechAudioUrl;
export const URL_IMG_CARTA = environment.imgCartaUrl; // imagenes de la carta
export const URL_IMG_PROMO = environment.imgPromoUrl; // imagenes de promociones
export const URL_IMG_COMERCIO = environment.imgComercioUrl;
export const URL_IMG_ICONS = environment.imgIconsUrl; // iconos
export const VAPID_PUBLIC = environment.vapidPublic;

export const VIEW_APP_MOZO = false; // true = app solo mozo // solo para vista incial
export const URL_CONSULTA_RUC_DNI = 'https://apifac.papaya.com.pe/api/services/'; // consulta dni o ruc
// ponytail: TOKEN_CONSULTA y TOKEN_SMS siguen en el bundle; pasarlos por el backend en el sprint de seguridad
export const TOKEN_CONSULTA = 'tLKbDncvyKIPcgdVAGqt7rmy7W9mU9cnbawpZdc7JJv7l6h9cU'; // token de prueba
export const TOKEN_SMS = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoicGFwYXlhLXNtcyIsImlhdCI6MTAwMDIwMDAzMDAwfQ.bKnTHEEGW_SustFir-40ZAYcHtfIo7Gyjq7c2onsAj0'; // token de prueba
```
Antes de reemplazar, leer el archivo actual completo y conservar cualquier otra constante exportada que no aparezca arriba (copiarla al final del archivo nuevo sin cambios).

- [ ] **Step 4:** Buscar usos de `URL_IMG_PROMO` que agreguen `'/'` a mano (antes no tenía barra final, ahora sí). Ejecutar `Select-String -Path (Get-ChildItem src/app -Recurse -Filter *.ts).FullName -Pattern "URL_IMG_PROMO"`. En `src/app/componentes/comp-view-promo/comp-view-promo.component.ts` y su `.html`, dejar que la URL final sea `{{imgdemo}}{{item.img}}` sin doble barra (quitar el `/` intermedio si existe). No tocar las seis etiquetas `<img src="{{ imgdemo }}">` de relleno (se eliminan en el sprint de imágenes).

- [ ] **Step 5:** Agregar a `.gitignore` la línea `.superpowers/`.

- [ ] **Step 6: Verificar**. Ejecutar `npx tsc -p src/tsconfig.app.json --noEmit`. Esperado: sin errores. Luego `npx ng build --configuration production`. Esperado: exit 0. Confirmar en el bundle que la URL de producción quedó embebida: `Select-String -Path dist/**/main*.js -Pattern "app.restobar.papaya.com.pe" -List | Select-Object -First 1` debe devolver una línea.

- [ ] **Step 7: Commit**
```
git add src/environments/environment.ts src/environments/environment.prod.ts src/app/shared/config/config.const.ts .gitignore src/app/componentes/comp-view-promo/
git commit -m "fix: URLs de API, socket e imágenes desde environment; fin del intercambio manual de comentarios"
```

---

### Task 2: Lote de guards y correcciones de una línea

**Hallazgos:** nulos sin proteger en `info-token.service.ts`, guard que lanza en vez de redirigir, `router.errorHandler` a una ruta inexistente, `indexOf(';')` con -1 truthy en el botón atrás, `setInfoOrgToken()` manda el idsede, `destroy$.unsubscribe()` en vez de `complete()`, import de testing en producción, sintaxis RxJS 7 sobre RxJS 6, carpeta duplicada `pagar-cuenta copy`, panel de confirmación delivery que lee `socketCliente` antes de `ngOnInit`.

**Files:**
- Modify: `src/app/shared/services/crud-http.service.ts:167-172`
- Modify: `src/app/shared/services/info-token.service.ts:426-431, 497-507`
- Modify: `src/app/shared/guards/auth.guard.ts`
- Modify: `src/app/app-routing.module.ts:119-142`
- Modify: `src/app/shared/services/navigator-link.service.ts:60`
- Modify: `src/app/pages/pedido/resumen-pedido/resumen-pedido.component.ts:301-302`
- Modify: `src/app/pages/pedido/estado-pedido/estado-pedido.component.ts:82-83`
- Modify: `src/app/shared/services/holding.service.ts:7, 105, 130`
- Modify: `src/app/componentes/confirmar-delivery/confirmar-delivery.component.ts:107-111, 141-147, 243`
- Delete: `src/app/pages/pagar-cuenta/pagar-cuenta copy/` (carpeta completa)
- Test: `src/app/shared/services/navigator-link.service.spec.ts` (reemplazar el contenido generado)

- [ ] **Step 1:** `crud-http.service.ts` — en `setInfoOrgToken()` cambiar `this.infoTockenService.getInfoSedeToken()` por `this.infoTockenService.getInfoOrgToken()`.

- [ ] **Step 2:** `info-token.service.ts` — los tres getters finales quedan:
```ts
  getHolding() {
    return this.infoUsToken?.holding || null;
  }

  getIsHolding(): boolean {
    return this.infoUsToken?.is_holding == '1';
  }

  getIsMozoAcceptPayments(): boolean {
    return this.infoUsToken?.is_mozo_accept_payments == '1';
  }
```
Y en `verificarContunuarSession()`, el bloque que recupera desde `sys::tpm` debe terminar en `return true;` en lugar de `return;` (hoy devuelve `undefined`, que el socket interpreta como sesión vencida).

- [ ] **Step 3:** `auth.guard.ts` — `canActivate()` queda:
```ts
  canActivate(): boolean | UrlTree {
    const us = this.authService.getLoggedStatus();
    const infoToken = this.infoTokenService.getInfoUs();
    if (!infoToken) {
      return us ? true : this.router.parseUrl('/');
    }
    const res = infoToken.isCliente
      ? (infoToken.isDelivery || infoToken.isReserva ? true : this.verifyClientService.getIsQrSuccess() && us)
      : us;
    return res ? true : this.router.parseUrl('/');
  }
```
Inyectar `private router: Router` en el constructor (import desde `@angular/router`).

- [ ] **Step 4:** `app-routing.module.ts` — agregar como ÚLTIMA entrada del arreglo `routes`: `{ path: '**', redirectTo: '' }`. En el constructor cambiar `this.router.navigate(['inicio'])` por `this.router.navigate([''])`.

- [ ] **Step 5:** `navigator-link.service.ts:60` — reemplazar la línea por:
```ts
            const _url = elUrl.indexOf(';') > -1 ? elUrl.substr(1).split(';')[1].split('=')[1] : elUrl;
```

- [ ] **Step 6:** `resumen-pedido.component.ts` `ngOnDestroy` y `estado-pedido.component.ts` `ngOnDestroy`: cambiar `this.destroy$.unsubscribe();` (o `this.destroyEstado$.unsubscribe();`) por `.complete();`.

- [ ] **Step 7:** `holding.service.ts` — eliminar `import { fakeAsync } from '@angular/core/testing';`; cambiar las dos `return throwError(() => error);` por `return throwError(error);`.

- [ ] **Step 8:** `confirmar-delivery.component.ts` — mover `this.socketCliente = this.verifyClientService.getDataClient();` del `ngOnInit` al final del constructor (dejar la llamada a `this.loadData()` en `ngOnInit`). En `loadData()` cambiar `this.socketCliente.idcliente` por `this.socketCliente?.idcliente` y las lecturas `this.infoTokenService.infoUsToken.tipoComprobante` / `.propina` por `this.infoTokenService.infoUsToken?.tipoComprobante` / `?.propina`.

- [ ] **Step 9:** Borrar la carpeta `src/app/pages/pagar-cuenta/pagar-cuenta copy/` con `Remove-Item -Recurse -Force "src/app/pages/pagar-cuenta/pagar-cuenta copy"`.

- [ ] **Step 10: Prueba del botón atrás.** Reemplazar `src/app/shared/services/navigator-link.service.spec.ts` por una prueba de la función pura extraída. Para que sea probable, extraer en `navigator-link.service.ts` una función exportada a nivel de módulo (fuera de la clase) y usarla en la línea 60:
```ts
export function extraerUrlDeMatriz(elUrl: string): string {
  return elUrl.indexOf(';') > -1 ? elUrl.substr(1).split(';')[1].split('=')[1] : elUrl;
}
```
Spec:
```ts
import { extraerUrlDeMatriz } from './navigator-link.service';

describe('extraerUrlDeMatriz', () => {
  it('devuelve la url tal cual cuando no hay parámetro de matriz', () => {
    expect(extraerUrlDeMatriz('/pedido')).toBe('/pedido');
  });
  it('extrae el valor del parámetro state', () => {
    expect(extraerUrlDeMatriz('/pedido;state=mipedido')).toBe('mipedido');
  });
});
```
Ejecutar: `npx ng test --include=src/app/shared/services/navigator-link.service.spec.ts --watch=false --browsers=ChromeHeadless`. Esperado: 2 specs, 0 failures.

- [ ] **Step 11:** `npx tsc -p src/tsconfig.app.json --noEmit` sin errores.

- [ ] **Step 12: Commit**
```
git add -A src/app .gitignore
git commit -m "fix: guards de nulos, ruta comodín, botón atrás, idorg en filtros y limpieza de duplicados"
```

---

### Task 3: Socket con eventos re-enlazables y envío de pedido con timeout, ack e idempotencia

**Hallazgos:** cada `onX()` registra un handler en la instancia de socket vigente sin teardown; `reconnect()` crea otra instancia y los componentes quedan escuchando a la muerta. `asyncEmitPedido()` nunca rechaza ni hace timeout. La respuesta `nuevoPedidoRes` llega por `io.to(socket.id)`, que muere si el socket cambió; el backend ya responde también por ack y acepta `header.idem` para idempotencia.

**Files:**
- Modify: `src/app/shared/services/socket.service.ts`
- Test: `src/app/shared/services/socket.service.spec.ts` (crear; si existe uno generado, reemplazarlo)

**Interfaces:**
- Produces: `asyncEmitPedido(eventName: string, eventNameRes: string, data: any, timeoutMs = 25000): Promise<any>` que resuelve con la respuesta (ack o evento) y rechaza con `Error('timeout')` o `Error('socket-desconectado')`. `fromEvent<T>(evento: string): Observable<T>` privado, usado por todos los `onX()`.

- [ ] **Step 1: Escribir el spec que falla.** Crear `src/app/shared/services/socket.service.spec.ts`:
```ts
import { SocketService } from './socket.service';

class FakeSocket {
  connected = true;
  id = 'abc';
  handlers: { [k: string]: Function[] } = {};
  emitted: any[] = [];
  on(evt: string, fn: Function) { (this.handlers[evt] = this.handlers[evt] || []).push(fn); }
  off(evt: string, fn?: Function) {
    if (!fn) { delete this.handlers[evt]; return; }
    this.handlers[evt] = (this.handlers[evt] || []).filter(h => h !== fn);
  }
  emit(evt: string, data: any, ack?: Function) { this.emitted.push({ evt, data, ack }); }
  fire(evt: string, payload: any) { (this.handlers[evt] || []).forEach(h => h(payload)); }
  disconnect() { this.connected = false; }
}

function makeService(): { svc: SocketService, sock: FakeSocket } {
  const listen = { setIisMsjConexionLentaSendPedidoSourse: () => {} } as any;
  const svc = new SocketService({} as any, {} as any, listen);
  const sock = new FakeSocket();
  (svc as any).socket = sock;
  return { svc, sock };
}

describe('SocketService.asyncEmitPedido', () => {
  beforeEach(() => jasmine.clock().install());
  afterEach(() => jasmine.clock().uninstall());

  it('resuelve con el ack del servidor', async () => {
    const { svc, sock } = makeService();
    const p = svc.asyncEmitPedido('nuevoPedido', 'nuevoPedidoRes', '{}');
    sock.emitted[0].ack([{ idpedido: 7 }]);
    expect(await p).toEqual([{ idpedido: 7 }]);
  });

  it('resuelve con el evento de respuesta y limpia el listener', async () => {
    const { svc, sock } = makeService();
    const p = svc.asyncEmitPedido('nuevoPedido', 'nuevoPedidoRes', '{}');
    sock.fire('nuevoPedidoRes', [{ idpedido: 8 }]);
    expect(await p).toEqual([{ idpedido: 8 }]);
    expect((sock.handlers['nuevoPedidoRes'] || []).length).toBe(0);
  });

  it('rechaza por timeout', async () => {
    const { svc } = makeService();
    const p = svc.asyncEmitPedido('nuevoPedido', 'nuevoPedidoRes', '{}', 1000);
    jasmine.clock().tick(1001);
    await expectAsync(p).toBeRejectedWithError('timeout');
  });

  it('rechaza si el socket no está conectado', async () => {
    const { svc, sock } = makeService();
    sock.connected = false;
    await expectAsync(svc.asyncEmitPedido('nuevoPedido', 'nuevoPedidoRes', '{}')).toBeRejectedWithError('socket-desconectado');
  });
});

describe('SocketService.fromEvent', () => {
  it('sigue entregando eventos después de reemplazar la instancia de socket', () => {
    const { svc, sock } = makeService();
    const recibidos: any[] = [];
    svc.onReglasCarta().subscribe(v => recibidos.push(v));
    sock.fire('getReglasCarta', 1);
    const sock2 = new FakeSocket();
    (svc as any).socket = sock2;
    (svc as any).rebindEvents();
    sock2.fire('getReglasCarta', 2);
    expect(recibidos).toEqual([1, 2]);
  });
});
```

- [ ] **Step 2: Ejecutar y ver fallar.** `npx ng test --include=src/app/shared/services/socket.service.spec.ts --watch=false --browsers=ChromeHeadless`. Esperado: fallos (timeout no rechaza, `rebindEvents` no existe).

- [ ] **Step 3: Implementar en `socket.service.ts`.**

Imports: agregar `import { Subject } from 'rxjs';`.

Campos nuevos en la clase:
```ts
  private eventSubjects = new Map<string, Subject<any>>();
```

Métodos nuevos (privados salvo indicación):
```ts
  // Un Subject por evento; los componentes se suscriben al Subject, no al socket,
  // así una reconexión con instancia nueva no los deja escuchando a un socket muerto.
  private fromEvent<T = any>(evento: string): Observable<T> {
    if (!this.eventSubjects.has(evento)) {
      const subj = new Subject<any>();
      this.eventSubjects.set(evento, subj);
      this.bindEvent(evento, subj);
    }
    return this.eventSubjects.get(evento).asObservable();
  }

  private bindEvent(evento: string, subj: Subject<any>): void {
    if (!this.socket) { return; }
    this.socket.off(evento);
    this.socket.on(evento, (res: any) => subj.next(res));
  }

  // llamar cada vez que se crea una instancia nueva de socket
  private rebindEvents(): void {
    this.eventSubjects.forEach((subj, evento) => this.bindEvent(evento, subj));
  }
```

En `connect()`, inmediatamente después de `this.socket = io(this.urlSocket, {...});` agregar `this.rebindEvents();`.

Reemplazar el cuerpo de CADA método `onX()` que hoy hace `return new Observable(observer => { this.socket.on('<evt>', (res) => observer.next(res)); })` por `return this.fromEvent('<evt>');`. Lista (verificar con `Select-String -Pattern "this.socket.on\('" socket.service.ts`): `getLaCarta`, `getDataSedeDescuentos`, `getTipoConsumo`, `itemModificado-pwa`, `nuevoItemAddInCarta`, `itemResetCant-pwa`, `getReglasCarta`, `getDataSede`, `notificar-cliente-llamado`, `notificar-cliente-llamado-remove`, `load-list-cliente-llamado`, `nuevoPedido`, `pedido-pagado-cliente`, `repartidor-notifica-estado-pedido`, `repartidor-notifica-ubicacion`, `set-comercio-open-change-from-monitor`, `mensaje-verificacion-telefono-rpt`, `date-now-info`, `restobar-notifica-pay-pedido-res`, `nuevoPedido-for-list-mesas`, `restobar-call-mozo-holding`. Si algún `onX()` hace algo más que `observer.next(res)` (por ejemplo asigna un campo), conservar esa lógica con `.pipe(tap(...))` sobre `this.fromEvent(...)`. El método privado `listen(evento)` pasa a ser `return this.fromEvent(evento);`. NO tocar los handlers de `listenStatusSocket()` (`connect`, `disconnect`, `verificar-conexion`, `finishLoadDataInitial`).

Reemplazar `asyncEmitPedido` completo por:
```ts
  // Resuelve con la respuesta del servidor (por ack o por evento), rechaza por timeout o sin socket.
  asyncEmitPedido(eventName: string, eventNameRes: string, data: any, timeoutMs = 25000): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('socket-desconectado'));
        return;
      }
      let settled = false;
      let timerLento: any;
      let timerTimeout: any;
      const onRes = (result: any) => finish(() => {
        this.listenStatusService.setIisMsjConexionLentaSendPedidoSourse(false);
        resolve(result);
      });
      const finish = (fn: () => void) => {
        if (settled) { return; }
        settled = true;
        clearTimeout(timerLento);
        clearTimeout(timerTimeout);
        this.socket.off(eventNameRes, onRes);
        fn();
      };
      timerLento = setTimeout(() => this.listenStatusService.setIisMsjConexionLentaSendPedidoSourse(true), 6000);
      timerTimeout = setTimeout(() => finish(() => reject(new Error('timeout'))), timeoutMs);
      this.socket.on(eventNameRes, onRes);
      this.socket.emit(eventName, data, (ack: any) => onRes(ack));
    });
  }
```

- [ ] **Step 4: Ejecutar el spec.** Mismo comando. Esperado: 5 specs, 0 failures.

- [ ] **Step 5:** `npx tsc -p src/tsconfig.app.json --noEmit` sin errores.

- [ ] **Step 6: Commit**
```
git add src/app/shared/services/socket.service.ts src/app/shared/services/socket.service.spec.ts
git commit -m "fix: eventos de socket re-enlazables tras reconexión y envío de pedido con timeout y ack"
```

---

### Task 4: Confirmación de pedido resiliente

**Hallazgos:** `resumen-pedido` solo pinta el pedido dentro del callback del evento `getReglasCarta`, que el servidor emite una vez al conectar; tras recarga o botón atrás queda en blanco y el cliente delivery no tiene botón "Recargar". `res[0].subtotales` lanza sobre objeto. `enviarPedido()` lanza antes de emitir (`sys::st` nulo, `objDatosSede` indefinido) sin catch y el loader queda para siempre. El camino de error de `savePedidoSocket2` sigue de largo y lee `undefined[0]`. `removeStoragePedido()` borra `sys::rules`, que es por sede, no por pedido.

**Files:**
- Modify: `src/app/shared/services/reglascarta.service.ts`
- Modify: `src/app/shared/services/mipedido.service.ts` (handler `onGetDatosSede`, ~línea 1920, y constructor)
- Modify: `src/app/shared/services/info-token.service.ts` (`removeStoragePedido`, ~línea 398)
- Modify: `src/app/pages/pedido/resumen-pedido/resumen-pedido.component.ts` (`ngOnInit` 179-193, `showLoaderPedido` 626-656, `enviarPedido` 658+, `savePedidoSocket2` 1190-1230, `errorSendPedido` 1262-1276, `nuevoPedido()`)
- Modify: `src/app/pages/pedido/resumen-pedido/resumen-pedido.component.html:378`
- Test: `src/app/shared/services/reglascarta.service.spec.ts` (crear o reemplazar)

**Interfaces:**
- Consumes: `SocketService.asyncEmitPedido` de la Tarea 3 (rechaza con Error).
- Produces: `ReglascartaService.loadReglasCarta(): Observable<any>` que emite primero lo cacheado en `sys::rules` (si existe) y luego cada emisión del socket. `MipedidoService.objDatosSede` rehidratado desde `sys::ds` al construir el servicio.

- [ ] **Step 1: Spec de reglas que falla.** `src/app/shared/services/reglascarta.service.spec.ts`:
```ts
import { Subject } from 'rxjs';
import { ReglascartaService } from './reglascarta.service';

describe('ReglascartaService.loadReglasCarta', () => {
  let store: { [k: string]: string };
  let storage: any;
  let socketEvt: Subject<any>;
  let svc: ReglascartaService;

  beforeEach(() => {
    store = {};
    storage = {
      get: (k: string) => store[k],
      set: (k: string, v: string) => { store[k] = v; },
      isExistKey: (k: string) => k in store
    };
    socketEvt = new Subject<any>();
    const socket = { onReglasCarta: () => socketEvt.asObservable() } as any;
    svc = new ReglascartaService(storage, socket);
  });

  it('emite primero lo cacheado y luego lo del socket', () => {
    store['sys::rules'] = btoa(JSON.stringify({ reglas: ['cache'], subtotales: [] }));
    const emitidos: any[] = [];
    svc.loadReglasCarta().subscribe(v => emitidos.push(v));
    socketEvt.next([{ reglas: ['socket'], subtotales: [1] }]);
    expect(emitidos.map(e => e.reglas[0])).toEqual(['cache', 'socket']);
    expect(JSON.parse(atob(store['sys::rules'])).reglas[0]).toBe('socket');
  });

  it('sin caché solo emite lo del socket y tolera respuesta como objeto', () => {
    const emitidos: any[] = [];
    svc.loadReglasCarta().subscribe(v => emitidos.push(v));
    socketEvt.next({ reglas: ['obj'], subtotales: [] });
    expect(emitidos.length).toBe(1);
    expect(emitidos[0].reglas[0]).toBe('obj');
  });

  it('ignora caché corrupta', () => {
    store['sys::rules'] = '%%%';
    const emitidos: any[] = [];
    svc.loadReglasCarta().subscribe(v => emitidos.push(v));
    expect(emitidos.length).toBe(0);
  });
});
```
Ejecutar: `npx ng test --include=src/app/shared/services/reglascarta.service.spec.ts --watch=false --browsers=ChromeHeadless`. Esperado: fallos.

- [ ] **Step 2: Implementar `reglascarta.service.ts`.** Reemplazar `loadReglasCarta`, `dataReglasCarta` y `decodeObjInSotrage` por:
```ts
  loadReglasCarta(): Observable<any> {
    return new Observable(observer => {
      const cached = this.readFromStorage();
      if (cached) {
        this.objReglasCarta = cached;
        observer.next(cached);
      }
      const sub = this.socketService.onReglasCarta().subscribe((res: any) => {
        this.objReglasCarta = Array.isArray(res) ? res[0] : res;
        this.codeObjInSotrage();
        observer.next(this.objReglasCarta);
      });
      return () => sub.unsubscribe();
    });
  }

  private readFromStorage(): any {
    try {
      const raw = this.storageService.get(this.keyStorage);
      return raw ? JSON.parse(atob(raw)) : null;
    } catch (error) {
      return null;
    }
  }
```
Ejecutar el spec. Esperado: 3 specs, 0 failures.

- [ ] **Step 3: `info-token.service.ts` `removeStoragePedido()`**: eliminar la línea `localStorage.removeItem('sys::rules');` (las reglas son por sede). Agregar comentario `// sys::rules se conserva: son reglas de la sede, no del pedido`.

- [ ] **Step 4: `mipedido.service.ts`**: en el handler `onGetDatosSede` (donde se asigna `this.objDatosSede = res[0];`), después de las conversiones de latitude/longitude agregar:
```ts
      try { localStorage.setItem('sys::ds', JSON.stringify(this.objDatosSede)); } catch (error) { /* storage lleno o bloqueado */ }
```
En el constructor del servicio (buscar `constructor(`), como primera línea del cuerpo:
```ts
    try { const ds = localStorage.getItem('sys::ds'); if (ds) { this.objDatosSede = JSON.parse(ds); } } catch (error) { this.objDatosSede = undefined; }
```
Comprobar que `objDatosSede` está declarado como campo (`objDatosSede: any;`); si está tipado, mantener el tipo.

- [ ] **Step 5: `resumen-pedido.component.ts` `ngOnInit`**. Reemplazar el bloque de suscripción a `loadReglasCarta()` por:
```ts
    this.reglasCartaService.loadReglasCarta()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        const r = Array.isArray(res) ? res[0] : res;
        this.rulesCarta = r?.reglas ?? [];
        this.rulesSubtoTales = r?.subtotales ?? [];
        this.establecimientoService.setRulesSubtotales(this.rulesSubtoTales);
        if (this.isReglasListas) { return; } // segunda emisión (socket tras caché): solo actualiza reglas
        this.isReglasListas = true;
        this.listenMiPedido();
        this.newFomrConfirma();
      });
```
Declarar el campo `private isReglasListas = false;`.

- [ ] **Step 6: Template fallback para delivery.** En `resumen-pedido.component.html` línea 378 cambiar `*ngIf="!hayItems && isCliente && !isDeliveryCliente"` por `*ngIf="!hayItems && isCliente"`.

- [ ] **Step 7: `showLoaderPedido()`**: después de `this.isSavingPedido = true;` agregar un watchdog:
```ts
    clearTimeout(this.watchdogEnvio);
    this.watchdogEnvio = setTimeout(() => {
      if (this.isSavingPedido) { this.errorSendPedido(new Error('watchdog-envio')); }
    }, 40000);
```
Declarar `private watchdogEnvio: any;`. En `errorSendPedido()` y en el `setTimeout` de éxito de `savePedidoSocket2` (donde se hace `this.isSavingPedido = false;`) agregar `clearTimeout(this.watchdogEnvio);`.

- [ ] **Step 8: `enviarPedido()`**: envolver TODO el cuerpo actual en `try { ... } catch (error) { this.errorSendPedido(error); }`. Dentro, reemplazar las dos líneas de `sys::st`:
```ts
    const stGuardado = localStorage.getItem('sys::st');
    this._arrSubtotales = stGuardado ? JSON.parse(atob(stGuardado)) : this.miPedidoService.getArrSubTotales(this.rulesSubtoTales);
    localStorage.setItem('sys::st', btoa(JSON.stringify(this._arrSubtotales)));
```
(Verificar la firma real de `getArrSubTotales` en `mipedido.service.ts` y adaptar los argumentos.) Las tres lecturas `this.miPedidoService.objDatosSede.datossede[0].is_print_subtotales` (y las dos siguientes) se cambian a `this.miPedidoService.objDatosSede?.datossede?.[0]?.is_print_subtotales ?? 0` (mismo patrón para `isprint_copy_short` e `isprint_all_short`). Agregar la clave de idempotencia al header: en el objeto `_p_header` (donde está `idcliente: this.infoToken.infoUsToken.idcliente || 0,`) agregar `idem: this.idemPedido,` y antes de construirlo:
```ts
    this.idemPedido = this.idemPedido || `${dataUsuario?.idcliente || 0}-${dataUsuario?.idsede || 0}-${Date.now()}`;
```
Declarar `private idemPedido: string = null;`. En `nuevoPedido()` (el botón cancelar del footer) y en el camino de éxito de `savePedidoSocket2` (después de leer `_res.idpedido`) poner `this.idemPedido = null;`.

- [ ] **Step 9: `savePedidoSocket2()`**. Reemplazar desde `const resSocket = await ...` hasta `dataSend.dataPrint = ...` por:
```ts
    let resSocket: any;
    try {
      resSocket = await this.socketService.asyncEmitPedido('nuevoPedido', 'nuevoPedidoRes', JSON.stringify(dataSend));
    } catch (error) {
      this.errorSendPedido(error);
      return;
    }
    if (!resSocket || resSocket === false || !resSocket[0]?.idpedido) {
      this.errorSendPedido(resSocket);
      return;
    }

    clearTimeout(this.watchdogEnvio);
    this.idemPedido = null;
    setTimeout(() => {
      this.listenStatusService.setLoaderSendPedido(false, this.verifyClientService.getIsQrSuccess());
      this.isSavingPedido = false;
      this.miPedidoService.stopTimerLimit();
      this.miPedidoService.prepareNewPedido();
    }, 800);

    const _res = resSocket[0];
    dataSend.dataPedido.idpedido = _res.idpedido;
    dataSend.dataPrint = _res.data?.[1]?.print ?? null;
```
Conservar el resto del método tal cual.

- [ ] **Step 10: `errorSendPedido()`**: además de lo que hace, cerrar el overlay y el aviso de conexión lenta:
```ts
    clearTimeout(this.watchdogEnvio);
    this.listenStatusService.closeFinishLoaderSendPedidoSource();
```
Poner el `alert` con mensaje según el error: si `resSocket?.message === 'timeout'` → `'El pedido está tardando más de lo normal. Revisa tu conexión y vuelve a intentar; si ya se registró no se duplicará.'`; si `'socket-desconectado'` → `'Sin conexión con el servidor. Revisa tu internet y vuelve a intentar.'`; en otro caso el mensaje actual.

- [ ] **Step 11: Verificar.** `npx tsc -p src/tsconfig.app.json --noEmit` sin errores. Volver a correr el spec de reglas. Luego `npx ng build` exit 0.

- [ ] **Step 12: Commit**
```
git add src/app/shared/services/reglascarta.service.ts src/app/shared/services/reglascarta.service.spec.ts src/app/shared/services/mipedido.service.ts src/app/shared/services/info-token.service.ts src/app/pages/pedido/resumen-pedido/
git commit -m "fix: confirmación de pedido resiliente: reglas y datos de sede desde caché, errores capturados, watchdog e idempotencia"
```

---

### Task 5: Google Maps no bloquea el arranque

**Hallazgo:** un `APP_INITIALIZER` espera la carga del script de Maps; si falla o ya estaba cargado, Angular no arranca (página blanca). `CalcDistanciaService` crea `new google.maps.DirectionsService()` como inicializador de campo.

**Files:**
- Modify: `src/app/app.module.ts:64-72`
- Modify: `src/app/shared/services/google-maps-loader.service.ts`
- Modify: `src/app/shared/services/calc-distancia.service.ts:21` y cualquier otro campo inicializado con `new google.maps...` (buscar con `Select-String -Path (Get-ChildItem src/app -Recurse -Filter *.ts).FullName -Pattern "=\s*new google\.maps"`).

- [ ] **Step 1: `app.module.ts`** — el provider queda:
```ts
    {
      provide: APP_INITIALIZER,
      // ponytail: Maps se carga en segundo plano; si no llega en 5 s la app arranca igual y los mapas se cargan al usarse
      useFactory: (googleMapsLoader: GoogleMapsLoaderService) => () =>
        Promise.race([googleMapsLoader.load(), new Promise<void>(resolve => setTimeout(resolve, 5000))]).catch(() => undefined),
      deps: [GoogleMapsLoaderService],
      multi: true
    }
```

- [ ] **Step 2: `google-maps-loader.service.ts`** — reemplazar el archivo por:
```ts
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

declare global {
  interface Window { __gmapsReady?: () => void; }
}

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {
  private loadPromise: Promise<void> | null = null;

  isLoaded(): boolean {
    return typeof google !== 'undefined' && !!google.maps && !!google.maps.places;
  }

  load(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }
    if (this.isLoaded()) {
      this.loadPromise = Promise.resolve();
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      const scriptId = 'google-maps-script';
      let done = false;
      const ok = () => { if (!done) { done = true; resolve(); } };
      const fail = () => { if (!done) { done = true; this.loadPromise = null; reject(new Error('No se pudo cargar Google Maps')); } };

      window.__gmapsReady = ok;

      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.async = true;
        script.defer = true;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places&callback=__gmapsReady`;
        script.onerror = fail;
        document.head.appendChild(script);
      }

      // por si el script ya existía y el callback ya corrió
      let intentos = 0;
      const poll = setInterval(() => {
        if (this.isLoaded()) { clearInterval(poll); ok(); return; }
        if (++intentos > 50) { clearInterval(poll); fail(); }
      }, 200);
    });

    return this.loadPromise;
  }
}
```

- [ ] **Step 3: `calc-distancia.service.ts`** — cambiar el campo `directionsService = new google.maps.DirectionsService();` por un getter perezoso:
```ts
  private _directionsService: google.maps.DirectionsService;
  private get directionsService(): google.maps.DirectionsService {
    if (!this._directionsService) { this._directionsService = new google.maps.DirectionsService(); }
    return this._directionsService;
  }
```
Aplicar el mismo patrón a cualquier otro campo encontrado en la búsqueda del encabezado (por ejemplo en `maps-service.service.ts`).

- [ ] **Step 4:** `npx tsc -p src/tsconfig.app.json --noEmit` sin errores; `npx ng build` exit 0.

- [ ] **Step 5: Commit**
```
git add src/app/app.module.ts src/app/shared/services/google-maps-loader.service.ts src/app/shared/services/calc-distancia.service.ts src/app/shared/services/maps-service.service.ts
git commit -m "fix: Google Maps no bloquea el arranque; carga con callback real y servicios perezosos"
```
(Quitar de `git add` los archivos que no se hayan modificado.)

---

### Task 6: Manejador global de errores y limpieza del service worker viejo

**Hallazgo:** `GlobalErrorHandler` existe pero no está registrado; tras un deploy, "Loading chunk failed" deja la pestaña rota. El service worker está desactivado pero el `ngsw-worker.js` instalado en los teléfonos sigue sirviendo bundles viejos y nadie lo desregistra.

**Files:**
- Modify: `src/app/app.module.ts` (providers; verificar que `GlobalErrorHandler` esté importado, si no, `import { GlobalErrorHandler } from './shared/services/error.global.handler';`)
- Modify: `src/app/shared/services/error.global.handler.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: `error.global.handler.ts`** — reemplazar por:
```ts
import { ErrorHandler, Injectable } from '@angular/core';

const CLAVE_ULTIMA_RECARGA = 'sys::chunk-reload';
const VENTANA_RECARGA_MS = 30000;

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  // Tras un deploy, los chunks viejos ya no existen: recargar una vez para tomar la versión nueva.
  handleError(error: any): void {
    const msg = String(error?.message ?? error ?? '');
    const esChunk = /Loading chunk [^\s]+ failed/.test(msg) || /ChunkLoadError/.test(msg);
    if (esChunk) {
      let ultima = 0;
      try { ultima = Number(sessionStorage.getItem(CLAVE_ULTIMA_RECARGA) || 0); } catch (e) { ultima = 0; }
      if (Date.now() - ultima > VENTANA_RECARGA_MS) {
        try { sessionStorage.setItem(CLAVE_ULTIMA_RECARGA, String(Date.now())); } catch (e) { /* sin storage */ }
        window.location.reload();
        return;
      }
    }
    console.error(error);
  }
}
```

- [ ] **Step 2: `app.module.ts`** — en `providers` descomentar/agregar `{ provide: ErrorHandler, useClass: GlobalErrorHandler },`. `ErrorHandler` ya está importado de `@angular/core`.

- [ ] **Step 3: `main.ts`** — antes de `platformBrowserDynamic()` agregar:
```ts
// ponytail: el SW de Angular está desactivado; desregistrar el que quedó instalado en dispositivos viejos
// y borrar su caché. Quitar este bloque cuando se reactive ServiceWorkerModule con SwUpdate.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(regs => regs.forEach(r => r.unregister()))
    .catch(() => undefined);
}
if (typeof caches !== 'undefined') {
  caches.keys()
    .then(keys => keys.filter(k => k.startsWith('ngsw')).forEach(k => caches.delete(k)))
    .catch(() => undefined);
}
```

- [ ] **Step 4:** `npx tsc -p src/tsconfig.app.json --noEmit` sin errores.

- [ ] **Step 5: Commit**
```
git add src/app/app.module.ts src/app/shared/services/error.global.handler.ts src/main.ts
git commit -m "fix: manejador global de errores activo y limpieza del service worker instalado"
```

---

### Task 7: La sesión del cliente dura hasta que cierre sesión

**Hallazgos:** `isLogin()` es una bandera en memoria que solo Auth0 enciende; clientes por teléfono/DNI no la encienden y los de Gmail/Facebook la pierden cuando la caché de Auth0 caduca (24 h). Tres caminos hacen `localStorage.clear()` automáticamente: botón "Volver" del callback, `errorShowVersion` a los 4 s, y `verificarContunuarSession()`. `btoa(JSON.stringify(...))` lanza con nombres fuera de Latin-1 y dispara ese borrado.

**Files:**
- Create: `src/app/shared/utils/b64.ts`
- Test: `src/app/shared/utils/b64.spec.ts`
- Modify: `src/app/shared/services/info-token.service.ts` (`set()` ~294, `converToJSON()` ~312, `verificarContunuarSession()` ~419-433, borrar `cerrarSessionGoIni()` ~410-415)
- Modify: `src/app/shared/services/verify-auth-client.service.ts` (`isLogin()` 33-36, `setDataClient()` 398-402, `getDataClient()` 416-432, `verifyClientLogin()` línea 216)
- Modify: `src/app/pages/inicio/callback-auth/callback-auth.component.ts` (`setInfoToken` 133, `errorShowVersion` 188-204, `loginOut` 206-215)
- Modify: `src/app/pages/inicio/callback-auth/callback-auth.component.html` (los dos botones que llaman `loginOut()`)
- Test: `src/app/shared/services/verify-auth-client.service.spec.ts` (reemplazar el generado)

**Interfaces:**
- Produces: `b64EncodeUnicode(s: string): string`, `b64DecodeUnicode(s: string): string` (tolerante: decodifica tanto lo nuevo como lo guardado antes con `btoa` plano).
- `VerifyAuthClientService.isLogin(): boolean` devuelve `true` si Auth0 confirmó sesión O si `sys::tpm` tiene `isCliente`, `idcliente > 0` y no es invitado.

- [ ] **Step 1: Spec de b64 que falla.** `src/app/shared/utils/b64.spec.ts`:
```ts
import { b64DecodeUnicode, b64EncodeUnicode } from './b64';

describe('b64 unicode', () => {
  it('codifica y decodifica emoji y acentos', () => {
    const s = JSON.stringify({ name: 'José Ñandú 🍊', sub: 'google|1' });
    expect(b64DecodeUnicode(b64EncodeUnicode(s))).toBe(s);
  });
  it('decodifica lo que se guardó antes con btoa plano', () => {
    const s = JSON.stringify({ name: 'MARIA' });
    expect(b64DecodeUnicode(btoa(s))).toBe(s);
  });
  it('lanza con entrada inválida', () => {
    expect(() => b64DecodeUnicode('%%%')).toThrow();
  });
});
```
Ejecutar: `npx ng test --include=src/app/shared/utils/b64.spec.ts --watch=false --browsers=ChromeHeadless`. Esperado: falla (módulo no existe).

- [ ] **Step 2: Crear `src/app/shared/utils/b64.ts`:**
```ts
// base64 seguro para cualquier texto (btoa solo acepta Latin-1)
export function b64EncodeUnicode(s: string): string {
  return btoa(encodeURIComponent(s).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
}

export function b64DecodeUnicode(s: string): string {
  const bin = atob(s);
  try {
    return decodeURIComponent(bin.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  } catch (error) {
    return bin; // guardado antes con btoa plano
  }
}
```
Ejecutar el spec. Esperado: 3 specs, 0 failures.

- [ ] **Step 3: `info-token.service.ts`.** Import `import { b64DecodeUnicode, b64EncodeUnicode } from '../utils/b64';`. En `set()`: `const _token = \`eyCJ9.${b64EncodeUnicode(JSON.stringify(this.infoUsToken))}\`;`. En `converToJSON()` la línea `let _token = JSON.parse(atob(localStorage.getItem('::token').split('.')[1]));` pasa a:
```ts
      let _token: any = null;
      try {
        _token = JSON.parse(b64DecodeUnicode(localStorage.getItem('::token').split('.')[1]));
      } catch (error) {
        localStorage.removeItem('::token');
        this.infoUsToken = null;
        return;
      }
```
(Ajustar para que el resto de la función siga funcionando con `_token`.) En `verificarContunuarSession()`, el bloque:
```ts
    if ( !this.infoUsToken) {
      const isUsTmp = localStorage.getItem('sys::tpm');
      if ( isUsTmp ) {
        localStorage.setItem('::token', 'eyCJ9.' + isUsTmp);
        this.converToJSON();
        return true;
      }
      this.cerrarSessionGoIni();
    }
```
queda:
```ts
    if ( !this.infoUsToken) {
      const isUsTmp = localStorage.getItem('sys::tpm');
      if ( isUsTmp ) {
        localStorage.setItem('::token', 'eyCJ9.' + isUsTmp);
        this.converToJSON();
        return true;
      }
      return false; // sin sesión: no se borra nada, el guard redirige
    }
```
Borrar el método `cerrarSessionGoIni()` y comprobar con `Select-String` que no quedan llamadas.

- [ ] **Step 4: `verify-auth-client.service.ts`.** Import de b64. `setDataClient()` usa `b64EncodeUnicode(dataClie)`; `getDataClient()` usa `JSON.parse(b64DecodeUnicode(dataClie))`. `isLogin()` queda:
```ts
  isLogin(): boolean {
    if (this.authNativeService.isLoginSuccess) { return true; }
    const c = this.getDataClient();
    return !!(c && c.isCliente && Number(c.idcliente) > 0 && !c.isLoginByInvitado);
  }
```
En `verifyClientLogin()`, la condición `if ( this.clientSocket?.isLoginByDNI || this.clientSocket?.isLoginByTelefono )` pasa a:
```ts
      const sesionPropia = this.clientSocket?.isCliente && Number(this.clientSocket?.idcliente) > 0 && !!this.clientSocket?.datalogin && !this.clientSocket?.isLoginByInvitado;
      if ( this.clientSocket?.isLoginByDNI || this.clientSocket?.isLoginByTelefono || sesionPropia ) {
```

- [ ] **Step 5: `callback-auth.component.ts`.** Import de b64; en `setInfoToken` usar `b64EncodeUnicode(JSON.stringify(token))`. En `errorShowVersion()` eliminar el `setTimeout` de 4 s que llama a `loginOut()` (dejar el registro del error y `showErrornweVersion = true`). Reemplazar `loginOut()` por:
```ts
  // Reintenta sin destruir la sesión guardada. El cierre de sesión real es solo desde el menú del cliente.
  volverInicio() {
    this.timerizador = null;
    this.router.navigate(['/']).then(() => window.location.reload());
  }
```
En el `.html`, los dos `(click)="loginOut()"` pasan a `(click)="volverInicio()"`; el texto del botón de los 10 segundos cambia a `Reintentar`.

- [ ] **Step 6: Spec de isLogin.** Reemplazar `src/app/shared/services/verify-auth-client.service.spec.ts` por:
```ts
import { VerifyAuthClientService } from './verify-auth-client.service';
import { b64EncodeUnicode } from '../utils/b64';

describe('VerifyAuthClientService.isLogin', () => {
  function make(auth0Ok: boolean): VerifyAuthClientService {
    const authNative = { isLoginSuccess: auth0Ok } as any;
    return new VerifyAuthClientService({} as any, {} as any, {} as any, {} as any, authNative);
  }
  beforeEach(() => localStorage.removeItem('sys::tpm'));

  it('true si Auth0 confirmó', () => { expect(make(true).isLogin()).toBeTrue(); });
  it('false sin sesión guardada', () => { expect(make(false).isLogin()).toBeFalse(); });
  it('true con sesión propia guardada (teléfono, DNI o social previo)', () => {
    localStorage.setItem('sys::tpm', b64EncodeUnicode(JSON.stringify({ isCliente: true, idcliente: 15, datalogin: { name: 'Ana' } })));
    expect(make(false).isLogin()).toBeTrue();
  });
  it('false para invitado', () => {
    localStorage.setItem('sys::tpm', b64EncodeUnicode(JSON.stringify({ isCliente: true, idcliente: 15, isLoginByInvitado: true })));
    expect(make(false).isLogin()).toBeFalse();
  });
});
```
Ejecutar: `npx ng test --include=src/app/shared/services/verify-auth-client.service.spec.ts --watch=false --browsers=ChromeHeadless`. Esperado: 4 specs, 0 failures. Si el constructor del servicio falla con las dependencias vacías, ajustar los stubs (objetos vacíos con los métodos que el constructor invoque).

- [ ] **Step 7:** `npx tsc -p src/tsconfig.app.json --noEmit` sin errores; `npx ng build` exit 0.

- [ ] **Step 8: Commit**
```
git add src/app/shared/utils/ src/app/shared/services/info-token.service.ts src/app/shared/services/verify-auth-client.service.ts src/app/shared/services/verify-auth-client.service.spec.ts src/app/pages/inicio/callback-auth/
git commit -m "fix: sesión del cliente persistente: sin borrados automáticos de storage, base64 unicode y sesión propia como fuente de verdad"
```

---

### Task 8: El pedido queda asociado al cliente correcto y aparece en "Mis pedidos"

**Hallazgos:** `procedure_pwa_pedido_guardar` reasigna el idcliente (crea cliente nuevo o, por un bug, asigna el literal 1 cuando hay homónimo) y devuelve solo `idpedido`; la app guarda en `sys::ic-orden` el id viejo y "Mis pedidos" consulta con él. `getMisPedido` interpola `req.body.idcliente` en SQL. Los eventos del repartidor van a un socketid guardado que muere al reconectar y no existe para invitados.

**Files (backend, `D:\Projects\backend-pedidos`):**
- Create: `sql/2026-09-09_pedido_guardar_devuelve_idcliente.sql`
- Create: `scripts/dump-procedure.js`
- Modify: `controllers/apiDelivery.js:125-130`
- Modify: `controllers/sockets.js` (handler `connection` ~línea 70-100; handlers `repartidor-notifica-estado-pedido` ~1367 y `repartidor-notifica-ubicacion` ~1378)
- Test: `test/apiDelivery.getMisPedido.test.js`

**Files (app):**
- Modify: `src/app/shared/services/info-token.service.ts` (nuevo método `setIdClienteToken`)
- Modify: `src/app/pages/pedido/resumen-pedido/resumen-pedido.component.ts` (`savePedidoSocket2`, tras `const _res = resSocket[0];`)
- Modify: `src/app/pages/zona-establecimientos/mis-ordenes/mis-ordenes.component.ts:36-40`

**Interfaces:**
- Produces (backend): el procedimiento devuelve `data, idpedido, idcliente`. Sala socket `cliente_<idcliente>` para todo cliente con `idcliente > 0`.
- Produces (app): `InfoTockenService.setIdClienteToken(id: number): void` actualiza `infoUsToken.idcliente`, persiste el token y `sys::ic-orden`.

- [ ] **Step 1 (backend): script para volcar el procedimiento.** Crear `scripts/dump-procedure.js`:
```js
// Uso: node scripts/dump-procedure.js procedure_pwa_pedido_guardar > sql/tmp.sql
require('dotenv').config();
const { sequelize } = require('../config/database');
(async () => {
  const nombre = process.argv[2];
  const [rows] = await sequelize.query(`SHOW CREATE PROCEDURE ${nombre}`);
  const body = rows[0]['Create Procedure'].replace(/CREATE DEFINER=`[^`]+`@`[^`]+` PROCEDURE/, 'CREATE PROCEDURE');
  process.stdout.write(`DROP PROCEDURE IF EXISTS ${nombre};\n${body}\n`);
  await sequelize.close();
})().catch(e => { console.error(e); process.exit(1); });
```
Ejecutar `node scripts/dump-procedure.js procedure_pwa_pedido_guardar > sql/2026-09-09_pedido_guardar_devuelve_idcliente.sql`. Si `config/database` exporta distinto, adaptar el require mirando `controllers/apiDelivery.js` línea 7.

- [ ] **Step 2 (backend): editar el SQL generado.** Dos cambios exactos:

(a) La sentencia de búsqueda por nombre:
```sql
set xIdCliente = (SELECT IF( EXISTS(
             SELECT idcliente
             FROM cliente
             WHERE nombres = UPPER(objDelivery->>'$.nombre') limit 1 ), 1, 0) as idcliente);
```
se reemplaza por:
```sql
set xIdCliente = COALESCE((SELECT idcliente FROM cliente WHERE nombres = UPPER(objDelivery->>'$.nombre') AND idorg = xidorg ORDER BY idcliente DESC LIMIT 1), 0);
```

(b) La última sentencia `SELECT cast(@objReturn as json) as data, xIdPedido as idpedido, @iditem_subitem;` pasa a `SELECT cast(@objReturn as json) as data, xIdPedido as idpedido, xIdCliente as idcliente, @iditem_subitem;`.

Agregar al inicio del archivo el comentario `-- Corrige la búsqueda por nombre (devolvía 1/0) y devuelve idcliente al cliente. Aplicar en desarrollo y producción.`

- [ ] **Step 3 (backend): aplicar en desarrollo.** Solo si `db_host` en `_config.js` es `192.168.1.65` o `localhost`: crear `scripts/apply-sql.js`:
```js
// Uso: node scripts/apply-sql.js sql/archivo.sql   (solo desarrollo)
require('dotenv').config();
const fs = require('fs');
const mysql = require('mysql2/promise');
const config = require('../_config');
(async () => {
  const sql = fs.readFileSync(process.argv[2], 'utf8');
  const conn = await mysql.createConnection({ host: config.db_host, user: config.db_user, password: config.db_password, database: config.db_name, multipleStatements: true });
  await conn.query(sql);
  await conn.end();
  console.log('aplicado', process.argv[2]);
})().catch(e => { console.error(e); process.exit(1); });
```
(Adaptar los nombres de propiedades a los reales de `_config.js`.) Ejecutar `node scripts/apply-sql.js sql/2026-09-09_pedido_guardar_devuelve_idcliente.sql`. Verificar con `node scripts/dump-procedure.js procedure_pwa_pedido_guardar | Select-String "xIdCliente as idcliente"` que devuelve una línea. Si `db_host` no es desarrollo, NO aplicar y reportarlo como concern.

- [ ] **Step 4 (backend): `getMisPedido` con validación y parámetro preparado.**
```js
const getMisPedido = async function (req, res) {
	const idcliente = parseInt(req.body.idcliente, 10);
	if (!Number.isFinite(idcliente) || idcliente <= 0) {
		return ReE(res, 'idcliente inválido', 400);
	}
	const query = `call procedure_pwa_delivery_mis_pedidos(?);`;
	const rows = await QueryServiceV1.ejecutarProcedimiento(query, [idcliente], 'getMisPedido');
	return ReS(res, { data: rows || [] });
}
module.exports.getMisPedido = getMisPedido;
```
Confirmar cómo `emitirRespuestaSP_RES` formatea la respuesta (`success`, `data`) y que `ReS(res, {data})` produce la misma forma que espera la app (`res.success` y `res.data` como arreglo de pedidos). Si `ejecutarProcedimiento` devuelve `[rows, meta]` o anida un nivel, desanidar igual que lo hace `setRegisterClienteLogin` en `apiPwa_v1.js:874-876`.

- [ ] **Step 5 (backend): sala por cliente.** En `controllers/sockets.js`, dentro de `io.on('connection', ...)` justo después de leer `dataSocket = socket.handshake.query` (y de resolver `dataCliente`, según el nombre que use el archivo), agregar:
```js
		// sala por cliente: los eventos del repartidor llegan aunque cambie el socketid
		const idClienteSala = Number(dataSocket.idcliente);
		if (idClienteSala > 0) { socket.join(`cliente_${idClienteSala}`); }
```
En el handler `repartidor-notifica-estado-pedido`, reemplazar el cuerpo por:
```js
			apiPwaRepartidor.setUpdateEstadoPedido(dataCliente.idpedido, dataCliente.estado);
			io.to(`cliente_${Number(dataCliente.idcliente)}`).emit('repartidor-notifica-estado-pedido', dataCliente.estado);
			try {
				const socketIdCliente = await apiPwa.getSocketIdCliente(dataCliente.idcliente);
				if (socketIdCliente?.[0]?.socketid) {
					io.to(socketIdCliente[0].socketid).emit('repartidor-notifica-estado-pedido', dataCliente.estado);
				}
			} catch (err) { logger.error({ err }, 'repartidor-notifica-estado-pedido sin socketid'); }
```
En `repartidor-notifica-ubicacion`, dentro de `if ( datosUbicacion.idcliente ) {` agregar como primera línea `io.to(\`cliente_${Number(datosUbicacion.idcliente)}\`).emit('repartidor-notifica-ubicacion', datosUbicacion.coordenadas);` y conservar el resto.

- [ ] **Step 6 (backend): prueba.** Crear `test/apiDelivery.getMisPedido.test.js`:
```js
jest.mock('../service/query.service.v1', () => ({ ejecutarProcedimiento: jest.fn() }));
const QueryServiceV1 = require('../service/query.service.v1');
const { getMisPedido } = require('../controllers/apiDelivery');

function mockRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
}

describe('getMisPedido', () => {
  it('rechaza idcliente inválido sin tocar la base', async () => {
    const res = mockRes();
    await getMisPedido({ body: { idcliente: '1 or 1=1' } }, res);
    expect(QueryServiceV1.ejecutarProcedimiento).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it('usa parámetro preparado con el id numérico', async () => {
    QueryServiceV1.ejecutarProcedimiento.mockResolvedValue([{ idpedido: 1 }]);
    const res = mockRes();
    await getMisPedido({ body: { idcliente: '15' } }, res);
    expect(QueryServiceV1.ejecutarProcedimiento).toHaveBeenCalledWith(expect.stringContaining('procedure_pwa_delivery_mis_pedidos(?)'), [15], 'getMisPedido');
  });
});
```
Ejecutar `npx jest test/apiDelivery.getMisPedido.test.js`. Si el require de `apiDelivery.js` arrastra conexiones reales (sequelize), mockear también `../config/database` con `jest.mock('../config/database', () => ({ sequelize: {}, QueryTypes: {} }))` y lo que haga falta hasta que cargue. Esperado: 2 tests pasan. (Si `ReE` firma `status` de otra forma, ajustar la aserción a lo que haga `ReE` en `service/uitl.service.js`.)

- [ ] **Step 7 (backend): commit solo archivos propios.**
```
git add sql/2026-09-09_pedido_guardar_devuelve_idcliente.sql scripts/dump-procedure.js scripts/apply-sql.js controllers/apiDelivery.js controllers/sockets.js test/apiDelivery.getMisPedido.test.js
git commit -m "fix: pedido guardar devuelve idcliente y corrige búsqueda por nombre; mis-pedidos con parámetro preparado; sala socket por cliente"
```

- [ ] **Step 8 (app): `info-token.service.ts`** — agregar:
```ts
  // el backend puede asignar otro idcliente al guardar el pedido; se toma ese como definitivo
  setIdClienteToken(id: number): void {
    if (!id || id <= 0) { return; }
    if (this.infoUsToken) {
      this.infoUsToken.idcliente = id;
      this.set();
    }
    localStorage.setItem('sys::ic-orden', btoa(id.toString()));
  }
```

- [ ] **Step 9 (app): `resumen-pedido.component.ts`** — después de `const _res = resSocket[0];` agregar:
```ts
    if (Number(_res.idcliente) > 0) {
      this.infoToken.setIdClienteToken(Number(_res.idcliente));
      const cs = this.verifyClientService.getDataClient();
      if (cs) { cs.idcliente = Number(_res.idcliente); this.verifyClientService.setDataClient(); }
    }
```

- [ ] **Step 10 (app): `mis-ordenes.component.ts`** — en `ngOnInit`, la primera línea `this.idClientePedidos = this.infoTokenService.getIdCliente();` pasa a:
```ts
    this.idClientePedidos = Number(this.infoTokenService.getIdCliente() || this.infoTokenService.infoUsToken?.idcliente || this.verifyClientService.getDataClient()?.idcliente || 0);
```
y la condición siguiente `if ( this.idClientePedidos ) {` pasa a `if ( this.idClientePedidos > 0 ) {`.

- [ ] **Step 11 (app):** `npx tsc -p src/tsconfig.app.json --noEmit` sin errores.

- [ ] **Step 12 (app): commit**
```
git add src/app/shared/services/info-token.service.ts src/app/pages/pedido/resumen-pedido/resumen-pedido.component.ts src/app/pages/zona-establecimientos/mis-ordenes/mis-ordenes.component.ts
git commit -m "fix: el idcliente definitivo lo devuelve el servidor al guardar el pedido y Mis pedidos lo usa"
```

---

### Task 9: Restaurar la verificación por SMS / WhatsApp del teléfono

**Hallazgo:** el checkpoint `a428ca5` incluye un cambio que elimina el OTP: `confirmarTelefono()` marca `verificado = true` sin validar. La versión anterior (`e6b82a5`) tenía el flujo completo.

**Files:**
- Modify: `src/app/componentes/dialog-verificar-telefono/dialog-verificar-telefono.component.ts`
- Modify: `src/app/componentes/dialog-verificar-telefono/dialog-verificar-telefono.component.html`

- [ ] **Step 1:** Ver qué cambió además del OTP: `git diff e6b82a5 a428ca5 -- src/app/componentes/dialog-verificar-telefono/`. Anotar cualquier cambio no relacionado con el OTP (por ejemplo imports o campos de holding).

- [ ] **Step 2:** Restaurar la versión con OTP: `git checkout e6b82a5 -- src/app/componentes/dialog-verificar-telefono/`. Volver a aplicar a mano los cambios no relacionados con el OTP anotados en el paso 1, si los hay.

- [ ] **Step 3:** `npx tsc -p src/tsconfig.app.json --noEmit` sin errores.

- [ ] **Step 4: Commit**
```
git add src/app/componentes/dialog-verificar-telefono/
git commit -m "fix: restaurar verificación del teléfono por código SMS/WhatsApp"
```

---

### Task 10: Niubiz desde el backend; credenciales fuera del frontend

**Hallazgos:** usuario, contraseña y merchantId de producción de Niubiz están en `pago-tarjeta-visanet.service.ts`, `environment.prod.ts` y `src/assets/js/boton-pago.js` (servido tal cual). Dos servicios escuchan `payment.success` a la vez. El monto viaja desde el cliente.

**Files (backend, `D:\Projects\backend-pedidos`):**
- Create: `controllers/apiNiubiz.js`
- Modify: `routes/v3.js` (dos rutas nuevas)
- Modify: `.env.example` (variables nuevas)
- Test: `test/apiNiubiz.test.js`

**Files (app):**
- Modify: `src/app/shared/services/niubiz.service.ts`
- Modify: `src/app/shared/services/pago-tarjeta-visanet.service.ts`
- Modify: `src/environments/environment.ts`, `src/environments/environment.prod.ts`
- Delete: `src/assets/js/boton-pago.js`
- Modify: `angular.json` (quitar `src/assets/js/boton-pago.js` de los dos arreglos `scripts`)
- Modify: `src/index.html` si referencia `boton-pago.js`

**Interfaces:**
- Backend `POST /v3/pago/niubiz/sesion` body `{ idsede: number, amount: number, purchaseNumber?: string, channel?: 'web'|'mobile' }` → `{ success, data: { sessionKey, merchantId, purchaseNumber, expirationTime, urlJs, logo } }`.
- Backend `POST /v3/pago/niubiz/autorizar` body `{ idsede: number, purchaseNumber: string, amount: number, transactionToken: string, channel?: string }` → `{ success, data: <respuesta de Niubiz con dataMap, sin cabeceras> }` o `{ success:false, error }`.
- Credenciales por sede: `getNiubizCredentials(idsede)` en `apiNiubiz.js`; hoy lee variables de entorno para todas las sedes. `// ponytail: cuando exista sede_pasarela_pago, esta función consulta la tabla por idsede`.

- [ ] **Step 1 (backend): `.env.example`** — agregar:
```
# Niubiz (pasarela de tarjetas). NIUBIZ_ENV=prod | sandbox
NIUBIZ_ENV=sandbox
NIUBIZ_MERCHANT_ID=
NIUBIZ_USER=
NIUBIZ_PASS=
```
Agregar al `.env` real las mismas claves con los valores de producción que hoy están en `pago-tarjeta-visanet.service.ts` (índice 1, PROD) y en sandbox (índice 0). NO imprimir los valores en el reporte ni en commits (`.env` está ignorado; verificar con `git check-ignore .env`).

- [ ] **Step 2 (backend): `controllers/apiNiubiz.js`:**
```js
const fetch = require('node-fetch');
const { ReE, ReS } = require('../service/uitl.service');
const logger = require('../utilitarios/logger');

const URLS = {
	prod: {
		seguridad: 'https://apiprod.vnforapps.com/api.security/v1/security',
		sesion: 'https://apiprod.vnforapps.com/api.ecommerce/v2/ecommerce/token/session/',
		autorizacion: 'https://apiprod.vnforapps.com/api.authorization/v3/authorization/ecommerce/',
		js: 'https://static-content.vnforapps.com/v2/js/checkout.js'
	},
	sandbox: {
		seguridad: 'https://apisandbox.vnforappstest.com/api.security/v1/security',
		sesion: 'https://apisandbox.vnforappstest.com/api.ecommerce/v2/ecommerce/token/session/',
		autorizacion: 'https://apisandbox.vnforappstest.com/api.authorization/v3/authorization/ecommerce/',
		js: 'https://static-content-qas.vnforapps.com/v2/js/checkout.js?qa=true'
	}
};
const LOGO = 'https://papaya.com.pe/images/l-pay-2.png';

// ponytail: una credencial global por entorno; cuando exista sede_pasarela_pago, consultar aquí por idsede
async function getNiubizCredentials(idsede) {
	const env = process.env.NIUBIZ_ENV === 'prod' ? 'prod' : 'sandbox';
	const { NIUBIZ_MERCHANT_ID, NIUBIZ_USER, NIUBIZ_PASS } = process.env;
	if (!NIUBIZ_MERCHANT_ID || !NIUBIZ_USER || !NIUBIZ_PASS) { throw new Error('Niubiz sin configurar'); }
	return { env, merchantId: NIUBIZ_MERCHANT_ID, user: NIUBIZ_USER, pass: NIUBIZ_PASS, urls: URLS[env] };
}

async function getSecurityToken(cred) {
	const auth = Buffer.from(`${cred.user}:${cred.pass}`).toString('base64');
	const r = await fetch(cred.urls.seguridad, { method: 'GET', headers: { Authorization: `Basic ${auth}` } });
	if (!r.ok) { throw new Error(`Niubiz seguridad ${r.status}`); }
	return r.text();
}

const crearSesion = async function (req, res) {
	try {
		const { idsede, amount, purchaseNumber, channel } = req.body;
		const monto = Number(amount);
		if (!Number.isFinite(monto) || monto <= 0) { return ReE(res, 'amount inválido', 400); }
		const cred = await getNiubizCredentials(Number(idsede));
		const token = await getSecurityToken(cred);
		const pn = purchaseNumber || String(Date.now()).slice(-12);
		const r = await fetch(`${cred.urls.sesion}${cred.merchantId}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: token },
			body: JSON.stringify({ channel: channel || 'web', amount: monto, antifraud: { clientIp: req.ip, merchantDefineData: { MDD4: req.body.email || '', MDD32: String(req.body.idcliente || 0), MDD75: 'Invitado', MDD77: 1 } } })
		});
		const data = await r.json();
		if (!r.ok || !data.sessionKey) { logger.error({ data }, 'Niubiz sesion'); return ReE(res, 'No se pudo crear la sesión de pago', 502); }
		return ReS(res, { data: { sessionKey: data.sessionKey, expirationTime: data.expirationTime, merchantId: cred.merchantId, purchaseNumber: pn, urlJs: cred.urls.js, logo: LOGO } });
	} catch (error) {
		logger.error({ error: error.message }, 'crearSesion niubiz');
		return ReE(res, 'Error al iniciar el pago', 500);
	}
};

const autorizar = async function (req, res) {
	try {
		const { idsede, purchaseNumber, amount, transactionToken, channel } = req.body;
		const monto = Number(amount);
		if (!purchaseNumber || !transactionToken || !Number.isFinite(monto) || monto <= 0) { return ReE(res, 'datos incompletos', 400); }
		// ponytail: el monto viene del cliente; cuando el pedido se registre antes del cobro, derivarlo del idpedido
		const cred = await getNiubizCredentials(Number(idsede));
		const token = await getSecurityToken(cred);
		const r = await fetch(`${cred.urls.autorizacion}${cred.merchantId}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: token },
			body: JSON.stringify({ channel: channel || 'web', captureType: 'manual', countable: true, order: { tokenId: transactionToken, purchaseNumber, amount: monto, currency: 'PEN' } })
		});
		const data = await r.json();
		const ok = r.ok && data?.dataMap?.ACTION_CODE === '000';
		if (!ok) { logger.warn({ actionCode: data?.dataMap?.ACTION_CODE, description: data?.dataMap?.ACTION_DESCRIPTION }, 'Niubiz autorización rechazada'); }
		return ReS(res, { success: ok, data });
	} catch (error) {
		logger.error({ error: error.message }, 'autorizar niubiz');
		return ReE(res, 'Error al autorizar el pago', 500);
	}
};

module.exports = { crearSesion, autorizar, getNiubizCredentials };
```
Antes de dar por bueno este código, leer `src/app/shared/services/niubiz.service.ts` y `pago-tarjeta-visanet.service.ts` en la app para copiar EXACTAMENTE los cuerpos que hoy se envían a Niubiz en sesión y autorización (campos de `antifraud`, `merchantDefineData`, `captureType`, `countable`, `channel`) y reproducirlos en el backend. Los valores de arriba son el punto de partida; los de la app mandan.

- [ ] **Step 3 (backend): rutas.** En `routes/v3.js`, junto a las otras rutas de delivery: 
```js
const apiNiubiz = require('../controllers/apiNiubiz');
routerV3.post('/pago/niubiz/sesion', apiNiubiz.crearSesion);
routerV3.post('/pago/niubiz/autorizar', apiNiubiz.autorizar);
```

- [ ] **Step 4 (backend): prueba** `test/apiNiubiz.test.js`:
```js
jest.mock('node-fetch');
const fetch = require('node-fetch');
const { crearSesion, autorizar } = require('../controllers/apiNiubiz');

function mockRes() { const r = {}; r.status = jest.fn(() => r); r.json = jest.fn(() => r); r.send = jest.fn(() => r); return r; }

describe('apiNiubiz', () => {
  beforeEach(() => { process.env.NIUBIZ_ENV = 'sandbox'; process.env.NIUBIZ_MERCHANT_ID = 'M1'; process.env.NIUBIZ_USER = 'u'; process.env.NIUBIZ_PASS = 'p'; fetch.mockReset(); });

  it('crearSesion devuelve sessionKey sin exponer credenciales', async () => {
    fetch.mockResolvedValueOnce({ ok: true, text: async () => 'TOKEN' })
         .mockResolvedValueOnce({ ok: true, json: async () => ({ sessionKey: 'SK', expirationTime: 1 }) });
    const res = mockRes();
    await crearSesion({ body: { idsede: 1, amount: 10 }, ip: '1.1.1.1' }, res);
    const payload = JSON.stringify(res.json.mock.calls[0][0]);
    expect(payload).toContain('SK');
    expect(payload).not.toContain('Basic');
    expect(fetch.mock.calls[0][1].headers.Authorization).toMatch(/^Basic /);
  });

  it('crearSesion rechaza amount inválido', async () => {
    const res = mockRes();
    await crearSesion({ body: { idsede: 1, amount: 'x' } }, res);
    expect(fetch).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('autorizar marca success solo con ACTION_CODE 000', async () => {
    fetch.mockResolvedValueOnce({ ok: true, text: async () => 'TOKEN' })
         .mockResolvedValueOnce({ ok: true, json: async () => ({ dataMap: { ACTION_CODE: '116' } }) });
    const res = mockRes();
    await autorizar({ body: { idsede: 1, purchaseNumber: '1', amount: 10, transactionToken: 't' } }, res);
    expect(res.json.mock.calls[0][0].success).toBe(false);
  });
});
```
Ejecutar `npx jest test/apiNiubiz.test.js`. Ajustar las aserciones a la forma real de `ReS`/`ReE` en `service/uitl.service.js`. Esperado: 3 tests pasan.

- [ ] **Step 5 (backend): commit**
```
git add controllers/apiNiubiz.js routes/v3.js .env.example test/apiNiubiz.test.js
git commit -m "feat: sesión y autorización Niubiz desde el backend con credenciales en variables de entorno"
```

- [ ] **Step 6 (app): `niubiz.service.ts`.** Leer el archivo completo. Reemplazar cada llamada directa a Niubiz (token de seguridad, sesión, autorización) por una llamada al backend usando `CrudHttpService.postFree(body, 'pago', 'niubiz/sesion', false)` y `postFree(body, 'pago', 'niubiz/autorizar', false)` (verificar en `crud-http.service.ts` cómo `postFree` compone la URL `${URL_SERVER}/<controlador>/<accion>`; si no admite `/` en la acción, agregar rutas `pago-niubiz-sesion` y `pago-niubiz-autorizar` en el backend en el paso 3 y usarlas). El `checkout.js` se sigue cargando en el navegador con `urlJs` devuelto por el backend, y el formulario de Niubiz se abre con `sessionKey`, `merchantId`, `purchaseNumber` y `amount` como hoy. Eliminar toda referencia a `environment.niubiz.authorization`, `urlApiSeguridad`, `urlApiSesion`, `urlApiAutorizacion`, `merchantId`. El listener de `window` `payment.success` se registra al iniciar un pago y se quita (`removeEventListener`) al recibir la respuesta o al cancelar; nunca en el constructor.

- [ ] **Step 7 (app): `pago-tarjeta-visanet.service.ts`.** Eliminar el arreglo `parametros` con credenciales y `parametrosSelected`. Sus métodos de token/sesión/autorización llaman a los mismos dos endpoints del backend. Su listener `payment.success` también pasa a registrarse solo durante un pago y a quitarse después. Conservar la forma de la respuesta que consume `pagar-cuenta.component.ts` (revisar `listenPaymetResponse$` y qué campos lee el componente).

- [ ] **Step 8 (app): environment.** En `environment.ts` y `environment.prod.ts` el bloque `niubiz` queda solo con `urlJs` y `logo` (públicos). Buscar con `Select-String` cualquier uso restante de `environment.niubiz.merchantId|authorization|urlApi` y eliminarlo.

- [ ] **Step 9 (app): borrar `src/assets/js/boton-pago.js`**; quitarlo de `angular.json` (arreglos `scripts` de `build` y `test`) y de `src/index.html` si aparece. Buscar con `Select-String -Path (Get-ChildItem src -Recurse -Include *.ts,*.html,*.js).FullName -Pattern "boton-pago|VisanetCheckout|visaNetWrapper"` y eliminar dependencias de funciones que vivían en ese archivo, reimplementándolas dentro del servicio si algún componente las usaba.

- [ ] **Step 10 (app): verificar.** `npx tsc -p src/tsconfig.app.json --noEmit` sin errores; `npx ng build --configuration production` exit 0; comprobar que el bundle ya no contiene la credencial: `Select-String -Path dist/**/*.js -Pattern "bWFjcmF6ZS5pbmZvQGdtYWlsLmNvbT" -List` debe devolver vacío, y `Select-String -Path dist/**/*.js -Pattern "vnforapps.com/api" -List` debe devolver vacío.

- [ ] **Step 11 (app): commit**
```
git add src/app/shared/services/niubiz.service.ts src/app/shared/services/pago-tarjeta-visanet.service.ts src/environments/ angular.json src/index.html src/assets/js/
git commit -m "fix: Niubiz a través del backend; credenciales fuera del frontend y sin boton-pago.js"
```

---

## Self-Review (hecho por el autor del plan)

- Cobertura: Fase 0 código (T1, T2 idorg, T10 Niubiz, T9 OTP), Fase 1 (T2, T3, T4, T5, T6), sección 12 (T8), sección 14 (T7). Rotación de claves Niubiz/Maps y ajustes en el dashboard de Auth0 quedan para el usuario (no son código).
- Tipos: `asyncEmitPedido` rechaza con `Error` (T3) y T4 lo captura con try/catch. `b64EncodeUnicode/b64DecodeUnicode` (T7) se usan con los mismos nombres en info-token, verify-auth-client y callback-auth. `setIdClienteToken` (T8) definido en info-token y usado en resumen-pedido. `rebindEvents` (T3) es privado y el spec lo invoca vía `(svc as any)`.
- Placeholders: ninguno. Donde el implementador debe leer el archivo real para adaptar (T4 `getArrSubTotales`, T10 cuerpos de Niubiz), el plan lo dice explícitamente y da el punto de partida.
