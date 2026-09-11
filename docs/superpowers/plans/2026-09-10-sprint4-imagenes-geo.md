# Sprint 4: imágenes rotas, geolocalización y búsqueda de dirección — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que ninguna imagen del catálogo, del comercio o de las promociones deje un hueco roto en pantalla, que la ubicación del cliente se pida siempre con timeout y con mensaje de error (nunca una promesa que no resuelve), que el diálogo de dirección de delivery use el mapa real de `@angular/google-maps` y que el cálculo del costo de entrega jamás deje el spinner del checkout girando para siempre.

**Architecture:** Tres piezas nuevas y chicas, todas en `src/app/shared`: (1) un helper puro `urlImagen(base, nombre)` más un pipe `imgUrl` que traduce un tipo de imagen (`carta` | `promo` | `comercio` | `iconos`) a la URL base del `environment`, reemplazando siete concatenaciones a mano; (2) una directiva de atributo `img[appImgFallback]` que en el evento `error` cambia el `src` por `assets/images/icon-app/img-null.png` (o esconde el `<img>` con `[appImgFallback]="'ocultar'"`), con guarda de una sola vez por elemento; (3) un `GeolocationService` que centraliza Capacitor Geolocation en nativo y `navigator.geolocation` en web, siempre con `enableHighAccuracy/timeout/maximumAge` y rechazando con errores tipados. Sobre eso se migra `dialog-direccion-cliente-delivery` de `<agm-map>` a `<google-map>`/`<map-marker>` (último resto de `@agm/core` en el proyecto), se cierran los últimos `subscribe` del cálculo de distancia que aún no tenían callback de error (el respaldo por haversine y el timeout de Directions ya vienen del Sprint 1 y se conservan intactos), y la regla de costo pasa a una función pura `shared/utils/costo-entrega.ts` que aprende el modo `fijo` de `sede_costo_delivery.parametros`.

**Tech Stack:** Angular 14.2, `@angular/google-maps` 14.2, RxJS 6.5, Capacitor 4 (`@capacitor/geolocation`), `geolocation-utils`, Karma/Jasmine, Node + mysql2 (backend, sin cambios en este sprint).

**Spec:** Informe de auditoría (hallazgos A2, A3, A4, A5, B1, B5, B6, B7, B8, B9, B10, B11-lite). Dossier de código verbatim: `dossier-imagenes-geo.md` (secciones 1 a 19). Planes previos de los que este depende: `docs/superpowers/plans/2026-09-09-sprint1-sesion-confirmacion.md` (Tarea 5: `GoogleMapsLoaderService` no bloqueante con `load()`/`isLoaded()`, servicios de Maps perezosos) y `docs/superpowers/plans/2026-09-10-sprint2-estado-tracking.md` (Tarea 4: `@angular/google-maps` 14 instalado, `@agm/core` retirado, `GoogleMapsModule` importado en `ComponentesModule`, `MapaSoloComponent` reescrito con `<google-map>`/`<map-marker>`).

## Global Constraints

- NUNCA hacer `git push`. Solo commits locales; el usuario sube cuando decide.
- Trabajar directo en `master` de cada repo (desarrollador solo, consentimiento dado). No crear ramas.
- Commits en español con formato `<tipo>: <descripción>`; el mensaje se escribe en un archivo UTF-8 y se usa `git commit -F <archivo>`; el mensaje termina con las dos líneas de atribución copiadas LITERALMENTE:
  ```
  Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
  ```
  (Si la sesión que ejecuta el plan declara otras dos líneas de atribución en su propio system prompt, usar esas dos, literales.)
- App `D:\Projects\capacitor\pwa-app-pedido`: al final de CADA tarea `npx ng build --configuration production` debe terminar con exit 0. Type-check rápido durante el trabajo: `npx tsc -p src/tsconfig.app.json --noEmit`. Specs: `npx ng test --include=<ruta del spec> --watch=false --browsers=ChromeHeadless`.
- Backend `D:\Projects\backend-pedidos`: **este sprint no toca el backend**. Si algo resultara estrictamente necesario, `git add` solo archivos propios, nunca `git add -A`, y jamás tocar `app.js`, `controllers/serviceSendCPE.js`, `firebase_config.js`, `INTEGRACION-YAPE.md`, `controllers/yapeIntegracion.js`, `routes/routesYape.js` (trabajo ajeno sin commit).
- Shell PowerShell 5.1: sin `&&`, sin `cat`, sin `head`, sin `sed`; usar `;`, `Get-Content`, `Select-String`, `Test-Path`. El hook bloquea `\d` en los comandos: escribir `[0-9]` en cualquier patrón.
- Sin `console.log` nuevos; los `console.log` que queden dentro de un archivo que se edita en una tarea se borran en esa tarea. Marcar toda simplificación deliberada con `// ponytail: ...`.
- Inmutabilidad: no mutar objetos del modelo en su lugar; construir uno nuevo (`this.mapCenter = { lat, lng }`, nunca `this.mapCenter.lat = ...`).
- Rutas de imágenes (fuente de verdad, no inventar otras). `src/app/shared/config/config.const.ts` reexporta del `environment`, y **todas las bases terminan en `/`**:
  - `URL_IMG_CARTA` = `environment.imgCartaUrl` → prod `https://restobar.papaya.com.pe/file/`
  - `URL_IMG_PROMO` = `environment.imgPromoUrl` → prod `https://restobar.papaya.com.pe/repositorio/img_promo/`
  - `URL_IMG_COMERCIO` = `environment.imgComercioUrl` → prod `https://restobar.papaya.com.pe/print/logo/`
  - `URL_IMG_ICONS` = `environment.imgIconsUrl` → prod `https://restobar.papaya.com.pe/images/`
- Imagen por defecto cuando una imagen remota falla: `assets/images/icon-app/img-null.png` (existe; ver dossier sección 8).
- Módulo elegido para la directiva y el pipe: **`SharedModule`** (`src/app/shared/shared.module.ts`). Motivo: las plantillas afectadas viven en cuatro módulos distintos (`ComponentesModule`, `PedidoModule`, `ZonaEstablecimientosModule`, `InicioModule`); `ZonaEstablecimientosModule` e `InicioModule` **ya** importan `SharedModule`, así que solo hay que añadir el import en `ComponentesModule` y `PedidoModule`. Declarar en `ComponentesModule` obligaría a duplicar declaraciones para `carta` y `establecimientos`.
- No tocar `src/app/pages/pagar-cuenta/pagar-cuenta copy/` (carpeta duplicada sin uso).

---

### Task 1: Helper `urlImagen` + pipe `imgUrl` y fin de las concatenaciones a mano

Cubre el hallazgo **A5 (MEDIUM)**: `establecimientos.component.ts` arma `img_mini` con `${this.imgComercio}/${dirEstablecimiento.img_mini}` (doble `/`, porque la base ya termina en `/`) y además **muta el modelo**, de modo que un segundo `map` sobre la misma lista vuelve a prefijar la URL. Y el caso peor: `comp-pedido-detalle.component.html:19` interpola `{{url_img}}` pero `CompPedidoDetalleComponent` **no tiene** el campo `url_img` (verificado en el archivo real), así que hoy pinta `undefined` o cadena vacía y la imagen de cada ítem del pedido nunca carga.

**Files:**
- Create: `src/app/shared/utils/img-url.ts`
- Create: `src/app/shared/utils/img-url.spec.ts`
- Create: `src/app/shared/pipes/img-url.pipe.ts`
- Create: `src/app/shared/pipes/img-url.pipe.spec.ts`
- Modify: `src/app/shared/shared.module.ts`
- Modify: `src/app/componentes/componentes.module.ts` (agregar `SharedModule` a `imports`)
- Modify: `src/app/pages/pedido/pedido.module.ts` (agregar `SharedModule` a `imports`)
- Modify: `src/app/pages/pedido/carta/carta.component.ts` y `.html`
- Modify: `src/app/componentes/dialog-item-edit/dialog-item-edit.component.ts` y `.html`
- Modify: `src/app/componentes/comp-pedido-detalle/comp-pedido-detalle.component.html`
- Modify: `src/app/componentes/item-comercio/item-comercio.component.ts` y `.html`
- Modify: `src/app/pages/zona-establecimientos/establecimientos/establecimientos.component.ts` y `.html`
- Modify: `src/app/componentes/comp-view-promo/comp-view-promo.component.ts` y `.html`
- Modify: `src/app/componentes/holding/forma-pago/forma-pago.component.ts`

**Interfaces:**
- Produces: `urlImagen(base: string, nombre: string | null | undefined): string` en `src/app/shared/utils/img-url.ts`. Une con exactamente un `/`; devuelve `''` si `nombre` está vacío; devuelve `nombre` tal cual si ya es una URL absoluta (`http://`, `https://`, `//`, `data:`), lo que la hace idempotente ante un segundo pase.
- Produces: `ImgUrlPipe` (`name: 'imgUrl'`) en `src/app/shared/pipes/img-url.pipe.ts`, con `transform(nombre: string | null | undefined, tipo: TipoImagen): string` y `export type TipoImagen = 'carta' | 'promo' | 'comercio' | 'iconos'`. Uso en plantilla: `[src]="item.img | imgUrl:'carta'"`.
- Produces: `SharedModule` declara y exporta `ImgUrlPipe` (en la Tarea 2 se le suma `ImgFallbackDirective`).

- [ ] **Step 1: Escribir el spec del helper (falla).** Crear `src/app/shared/utils/img-url.spec.ts`:

```ts
import { urlImagen } from './img-url';

describe('urlImagen', () => {

  it('une base y nombre dejando exactamente un /', () => {
    expect(urlImagen('https://restobar.papaya.com.pe/print/logo/', 'sede-10.png'))
      .toBe('https://restobar.papaya.com.pe/print/logo/sede-10.png');
    expect(urlImagen('https://restobar.papaya.com.pe/print/logo', 'sede-10.png'))
      .toBe('https://restobar.papaya.com.pe/print/logo/sede-10.png');
    expect(urlImagen('https://restobar.papaya.com.pe/print/logo/', '/sede-10.png'))
      .toBe('https://restobar.papaya.com.pe/print/logo/sede-10.png');
    expect(urlImagen('https://restobar.papaya.com.pe/print/logo//', '//sede-10.png'))
      .toBe('https://restobar.papaya.com.pe/print/logo/sede-10.png');
  });

  it('devuelve cadena vacia cuando no hay nombre de archivo', () => {
    expect(urlImagen('https://restobar.papaya.com.pe/file/', '')).toBe('');
    expect(urlImagen('https://restobar.papaya.com.pe/file/', '   ')).toBe('');
    expect(urlImagen('https://restobar.papaya.com.pe/file/', null)).toBe('');
    expect(urlImagen('https://restobar.papaya.com.pe/file/', undefined)).toBe('');
  });

  it('no vuelve a prefijar una URL absoluta (segundo pase idempotente)', () => {
    const ya = urlImagen('https://restobar.papaya.com.pe/print/logo/', 'sede-10.png');
    expect(urlImagen('https://restobar.papaya.com.pe/print/logo/', ya)).toBe(ya);
    expect(urlImagen('https://restobar.papaya.com.pe/print/logo/', 'http://otro.com/x.png'))
      .toBe('http://otro.com/x.png');
    expect(urlImagen('https://restobar.papaya.com.pe/print/logo/', '//cdn.com/x.png'))
      .toBe('//cdn.com/x.png');
    expect(urlImagen('https://restobar.papaya.com.pe/print/logo/', 'data:image/png;base64,AAA'))
      .toBe('data:image/png;base64,AAA');
  });

  it('sin base devuelve solo el nombre sin barra inicial', () => {
    expect(urlImagen('', 'sede-10.png')).toBe('sede-10.png');
    expect(urlImagen('', '/sede-10.png')).toBe('sede-10.png');
  });
});
```

- [ ] **Step 2: Correr el spec y ver que falla.**

```
npx ng test --include=src/app/shared/utils/img-url.spec.ts --watch=false --browsers=ChromeHeadless
```
Esperado: FALLA en compilación, `Cannot find module './img-url'`.

- [ ] **Step 3: Implementar el helper.** Crear `src/app/shared/utils/img-url.ts`:

```ts
// Une la base del repositorio de imagenes con el nombre del archivo dejando
// exactamente un '/'. Las bases del environment ya terminan en '/', por eso
// concatenar a mano producia rutas con '//' o dobles prefijos.
const ABSOLUTA = /^(https?:)?\/\//i;

export function urlImagen(base: string, nombre: string | null | undefined): string {
  const _nombre = (nombre === null || nombre === undefined ? '' : nombre.toString()).trim();
  if (!_nombre) { return ''; }
  if (ABSOLUTA.test(_nombre) || _nombre.toLowerCase().indexOf('data:') === 0) { return _nombre; }

  const _archivo = _nombre.replace(/^\/+/, '');
  const _base = (base || '').toString().trim().replace(/\/+$/, '');
  if (!_base) { return _archivo; }

  return `${_base}/${_archivo}`;
}
```

- [ ] **Step 4: Correr el spec y ver que pasa.**

```
npx ng test --include=src/app/shared/utils/img-url.spec.ts --watch=false --browsers=ChromeHeadless
```
Esperado: 4 tests PASAN.

- [ ] **Step 5: Escribir el spec del pipe (falla).** Crear `src/app/shared/pipes/img-url.pipe.spec.ts`:

```ts
import { URL_IMG_CARTA, URL_IMG_COMERCIO, URL_IMG_ICONS, URL_IMG_PROMO } from '../config/config.const';
import { urlImagen } from '../utils/img-url';
import { ImgUrlPipe } from './img-url.pipe';

describe('ImgUrlPipe', () => {
  const pipe = new ImgUrlPipe();

  it('mapea cada tipo a su base del environment', () => {
    expect(pipe.transform('plato.png', 'carta')).toBe(urlImagen(URL_IMG_CARTA, 'plato.png'));
    expect(pipe.transform('promo.png', 'promo')).toBe(urlImagen(URL_IMG_PROMO, 'promo.png'));
    expect(pipe.transform('logo.png', 'comercio')).toBe(urlImagen(URL_IMG_COMERCIO, 'logo.png'));
    expect(pipe.transform('yape.png', 'iconos')).toBe(urlImagen(URL_IMG_ICONS, 'yape.png'));
  });

  it('devuelve cadena vacia si no hay nombre', () => {
    expect(pipe.transform('', 'carta')).toBe('');
    expect(pipe.transform(null, 'comercio')).toBe('');
  });

  it('no vuelve a prefijar una URL ya armada', () => {
    const ya = pipe.transform('logo.png', 'comercio');
    expect(pipe.transform(ya, 'comercio')).toBe(ya);
  });
});
```

- [ ] **Step 6: Correr el spec y ver que falla.**

```
npx ng test --include=src/app/shared/pipes/img-url.pipe.spec.ts --watch=false --browsers=ChromeHeadless
```
Esperado: FALLA, `Cannot find module './img-url.pipe'`.

- [ ] **Step 7: Implementar el pipe.** Crear `src/app/shared/pipes/img-url.pipe.ts`:

```ts
import { Pipe, PipeTransform } from '@angular/core';
import { URL_IMG_CARTA, URL_IMG_COMERCIO, URL_IMG_ICONS, URL_IMG_PROMO } from '../config/config.const';
import { urlImagen } from '../utils/img-url';

export type TipoImagen = 'carta' | 'promo' | 'comercio' | 'iconos';

const BASES: { [tipo in TipoImagen]: string } = {
  carta: URL_IMG_CARTA,
  promo: URL_IMG_PROMO,
  comercio: URL_IMG_COMERCIO,
  iconos: URL_IMG_ICONS
};

@Pipe({
  name: 'imgUrl'
})
export class ImgUrlPipe implements PipeTransform {
  transform(nombre: string | null | undefined, tipo: TipoImagen): string {
    return urlImagen(BASES[tipo], nombre);
  }
}
```

- [ ] **Step 8: Correr el spec y ver que pasa.**

```
npx ng test --include=src/app/shared/pipes/img-url.pipe.spec.ts --watch=false --browsers=ChromeHeadless
```
Esperado: 3 tests PASAN.

- [ ] **Step 9: Declarar el pipe en `SharedModule`.** Reemplazar todo `src/app/shared/shared.module.ts` por:

```ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuicklinkModule } from 'ngx-quicklink';
import { ImgUrlPipe } from './pipes/img-url.pipe';

@NgModule({
  declarations: [
    ImgUrlPipe
  ],
  imports: [
    CommonModule,
    QuicklinkModule
  ],
  exports: [
    QuicklinkModule,
    ImgUrlPipe
  ]
})
export class SharedModule { }
```

- [ ] **Step 10: Importar `SharedModule` donde falta.** En `src/app/componentes/componentes.module.ts` agregar junto a los demás imports de arriba `import { SharedModule } from '../shared/shared.module';` y sumar `SharedModule` al array `imports` (queda `CommonModule, ReactiveFormsModule, FormsModule, MaterialModule, SharedModule, StarRatingModule.forRoot()`). En `src/app/pages/pedido/pedido.module.ts` agregar `import { SharedModule } from 'src/app/shared/shared.module';` y sumar `SharedModule` al array `imports` (queda `CommonModule, FormsModule, PedidoRoutingModule, CoreModule, ComponentesModule, SharedModule`). `zona-establecimientos.module.ts` e `inicio.module.ts` ya lo importan: no tocarlos.

- [ ] **Step 11: Carta.** En `src/app/pages/pedido/carta/carta.component.html` reemplazar las dos líneas (búsqueda: `Select-String -Path src/app/pages/pedido/carta/carta.component.html -Pattern "rutaImgItem"`):

```html
<img class="icon-item-carta rounded-circle" [src]="item.img | imgUrl:'carta'" alt="icon-item-carta">
```
```html
<img class="icon-item-carta" [src]="item.img | imgUrl:'carta'" alt="icon-item-carta" (click)="selectedItem(item)">
```
En `src/app/pages/pedido/carta/carta.component.ts` borrar la línea `rutaImgItem = URL_IMG_CARTA;` y el import `import { URL_IMG_CARTA } from 'src/app/shared/config/config.const';` **solo si** `Select-String -Path src/app/pages/pedido/carta/carta.component.ts -Pattern "URL_IMG_CARTA"` no devuelve otro uso. Dejar intacto `imgNull = './assets/images/icon-app/img-null.png';` (lo usa la rama `item.img===''`).

- [ ] **Step 12: dialog-item-edit.** En `src/app/componentes/dialog-item-edit/dialog-item-edit.component.html` línea 22:

```html
<img class="img-carta" [src]="item.img | imgUrl:'carta'" alt="{{item.img}}">
```
En `dialog-item-edit.component.ts` borrar `url_img = URL_IMG_CARTA;` y el import de `URL_IMG_CARTA` si no queda otro uso.

- [ ] **Step 13: comp-pedido-detalle (imagen que hoy nunca carga).** En `src/app/componentes/comp-pedido-detalle/comp-pedido-detalle.component.html` línea 19:

```html
<img class="img-thumbnail img-carta" [src]="item.img | imgUrl:'carta'" width="65px" alt="{{item.img}}">
```
No hay nada que borrar en el `.ts`: `url_img` nunca existió ahí.

- [ ] **Step 14: item-comercio.** En `src/app/componentes/item-comercio/item-comercio.component.html` línea 4:

```html
<img class="img-comercio" [src]="itemEstablecimiento.pwa_delivery_img | imgUrl:'comercio'" alt="">
```
En `item-comercio.component.ts` borrar el campo `imgComercio = '';`, la línea `this.imgComercio = URL_IMG_COMERCIO + this.itemEstablecimiento.pwa_delivery_img;` dentro de `ngOnInit()` y el import `import { URL_IMG_COMERCIO } from 'src/app/shared/config/config.const';`.

- [ ] **Step 15: establecimientos (doble `/` y mutación del modelo).** En `src/app/pages/zona-establecimientos/establecimientos/establecimientos.component.ts`, dentro del `map` que recorre `this.listEstablecimientos`, borrar la línea:

```ts
            dirEstablecimiento.img_mini = `${this.imgComercio}/${dirEstablecimiento.img_mini}`;
```
El `map` queda:
```ts
          this.listEstablecimientos.map((dirEstablecimiento: DeliveryEstablecimiento) => {
            dirEstablecimiento.visible = true;
          });
```
Borrar el campo `imgComercio = URL_IMG_COMERCIO;` y el import `import { URL_IMG_COMERCIO } from 'src/app/shared/config/config.const';` **solo si** `Select-String -Path src/app/pages/zona-establecimientos/establecimientos/establecimientos.component.ts -Pattern "imgComercio"` y la misma búsqueda en el `.html` quedan vacías. Dejar `imgIcoCategoria = 'assets/images/icon-app/';` (esas imágenes viven en el bundle, no en el repositorio remoto).

En `establecimientos.component.html` línea 211:
```html
<img [src]="itemComercio.img_mini | imgUrl:'comercio'" alt="loquesea">
```

- [ ] **Step 16: comp-view-promo.** En `src/app/componentes/comp-view-promo/comp-view-promo.component.html`, la única imagen viva (dentro del `*ngFor`):

```html
<img [src]="item.img | imgUrl:'promo'" alt="aa">
```
En `comp-view-promo.component.ts` borrar `private urlRepoImg = URL_IMG_PROMO;`, `imgdemo = this.urlRepoImg;`, la línea comentada `// imgdemo = this.urlRepoImg + '/' + '1613promo50.png';` y el import de `URL_IMG_PROMO`. (El bloque HTML comentado que todavía nombra `imgdemo` se borra en la Tarea 2; al ser un comentario no rompe la compilación.)

- [ ] **Step 17: forma-pago (icono de método de pago).** En `src/app/componentes/holding/forma-pago/forma-pago.component.ts` agregar el import `import { urlImagen } from 'src/app/shared/utils/img-url';` y cambiar la línea del icono:

```ts
            icon: urlImagen(URL_IMG_ICONS, elem.img),
```
Mantener el import de `URL_IMG_ICONS`.

- [ ] **Step 18: Verificar compilación y specs.**

```
npx tsc -p src/tsconfig.app.json --noEmit
npx ng test --include=src/app/shared/utils/img-url.spec.ts --include=src/app/shared/pipes/img-url.pipe.spec.ts --watch=false --browsers=ChromeHeadless
npx ng build --configuration production
```
Esperado: sin errores de tipos, 7 tests PASAN, build exit 0.

- [ ] **Step 19: Commit.**

```powershell
git add src/app/shared/utils/ src/app/shared/pipes/img-url.pipe.ts src/app/shared/pipes/img-url.pipe.spec.ts src/app/shared/shared.module.ts src/app/componentes/componentes.module.ts src/app/pages/pedido/pedido.module.ts src/app/pages/pedido/carta/ src/app/componentes/dialog-item-edit/ src/app/componentes/comp-pedido-detalle/ src/app/componentes/item-comercio/ src/app/pages/zona-establecimientos/establecimientos/ src/app/componentes/comp-view-promo/ src/app/componentes/holding/forma-pago/
Set-Content -Path msg-sprint4-t1.txt -Encoding utf8 -Value @"
fix: URLs de imagenes con helper urlImagen y pipe imgUrl; sin doble barra ni mutacion del modelo

Reemplaza siete concatenaciones a mano de rutas de imagenes por un helper puro
y un pipe. Corrige el doble prefijo de img_mini en establecimientos y la imagen
del detalle de pedido, que interpolaba un url_img inexistente.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
"@
git commit -F msg-sprint4-t1.txt
Remove-Item msg-sprint4-t1.txt
```

---

### Task 2: Directiva `appImgFallback` en todas las imágenes que pueden faltar

Cubre **A2/A3 (HIGH)** (unas 90 etiquetas `<img>` con URL remota o con nombre de archivo que viene de la base de datos, sin ningún manejo de error; el pipe `imagenNoEncontrada` existe pero está desactivado y además está roto: crea un `new Image()` desconectado del DOM y le pasa el elemento por `args`, que nadie le manda) y **A4 (HIGH)** (seis `<img src="{{imgdemo}}">` de relleno en `comp-view-promo` apuntando al directorio base de promociones).

**Files:**
- Create: `src/app/shared/directivas/img-fallback.directive.ts`
- Create: `src/app/shared/directivas/img-fallback.directive.spec.ts`
- Modify: `src/app/shared/shared.module.ts`
- Delete: `src/app/shared/pipes/imagen-no-encontrada.pipe.ts`
- Modify: `src/app/app.module.ts` (borrar las dos referencias comentadas al pipe)
- Modify: `src/app/componentes/comp-view-promo/comp-view-promo.component.html` (borrar el bloque comentado con los seis `<img>` de relleno + aplicar directiva)
- Modify (plantillas, aplicar directiva y `loading="lazy"`): `src/app/componentes/comp-pedido-detalle/comp-pedido-detalle.component.html`, `src/app/componentes/dialog-item-edit/dialog-item-edit.component.html`, `src/app/componentes/item-comercio/item-comercio.component.html`, `src/app/componentes/holding/forma-pago/forma-pago.component.html`, `src/app/componentes/holding/marcas/list/list.component.html`, `src/app/componentes/comp-list-item-pedido-cliente/comp-list-item-pedido-cliente.component.html`, `src/app/componentes/confirmar-delivery/confirmar-delivery.component.html`, `src/app/componentes/dialog-metodo-pago/dialog-metodo-pago.component.html`, `src/app/componentes/tipo-vehiculo/tipo-vehiculo.component.html`, `src/app/componentes/encuesta-opcion/encuesta-opcion.component.html`, `src/app/componentes/item-promocion/item-promocion.component.html`, `src/app/pages/pedido/carta/carta.component.html`, `src/app/pages/zona-establecimientos/establecimientos/establecimientos.component.html`, `src/app/pages/inicio/lector-success/lector-success.component.html`
- Test: `src/app/shared/directivas/img-fallback.directive.spec.ts`

**Interfaces:**
- Consumes: `ImgUrlPipe` y `SharedModule` de la Tarea 1.
- Produces: `ImgFallbackDirective`, selector `img[appImgFallback]`, `@Input() appImgFallback: 'placeholder' | 'ocultar' | ''`. Sin valor (o `'placeholder'`) cambia el `src` a `IMG_FALLBACK`; con `appImgFallback="ocultar"` esconde el `<img>`. Actúa una sola vez por elemento.
- Produces: `export const IMG_FALLBACK = 'assets/images/icon-app/img-null.png';`

- [ ] **Step 1: Escribir el spec de la directiva (falla).** Crear `src/app/shared/directivas/img-fallback.directive.spec.ts`:

```ts
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IMG_FALLBACK, ImgFallbackDirective } from './img-fallback.directive';

@Component({
  template: `
    <img id="conFallback" appImgFallback [src]="src">
    <img id="oculta" appImgFallback="ocultar" [src]="src">
  `
})
class HostImgComponent {
  src = 'https://servidor.invalido.local/no-existe.png';
}

describe('ImgFallbackDirective', () => {
  let fixture: ComponentFixture<HostImgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImgFallbackDirective, HostImgComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HostImgComponent);
    fixture.detectChanges();
  });

  function img(id: string): HTMLImageElement {
    return fixture.nativeElement.querySelector('#' + id) as HTMLImageElement;
  }

  it('cambia el src por la imagen por defecto cuando la carga falla', () => {
    const el = img('conFallback');
    el.dispatchEvent(new Event('error'));
    expect(el.getAttribute('src')).toContain(IMG_FALLBACK);
  });

  it('actua una sola vez: si el fallback tambien falla no vuelve a tocar el src', () => {
    const el = img('conFallback');
    el.dispatchEvent(new Event('error'));
    const srcTrasPrimerError = el.getAttribute('src');

    el.setAttribute('src', 'https://servidor.invalido.local/otra.png');
    el.dispatchEvent(new Event('error'));

    expect(el.getAttribute('src')).toBe('https://servidor.invalido.local/otra.png');
    expect(srcTrasPrimerError).toContain(IMG_FALLBACK);
  });

  it('esconde el elemento cuando el modo es ocultar y no toca el src', () => {
    const el = img('oculta');
    el.dispatchEvent(new Event('error'));
    expect(el.style.display).toBe('none');
    expect(el.getAttribute('src')).not.toContain(IMG_FALLBACK);
  });

  it('no hace nada mientras la imagen no dispare error', () => {
    const el = img('conFallback');
    expect(el.getAttribute('src')).toBe('https://servidor.invalido.local/no-existe.png');
    expect(el.style.display).toBe('');
  });
});
```

- [ ] **Step 2: Correr el spec y ver que falla.**

```
npx ng test --include=src/app/shared/directivas/img-fallback.directive.spec.ts --watch=false --browsers=ChromeHeadless
```
Esperado: FALLA, `Cannot find module './img-fallback.directive'`.

- [ ] **Step 3: Implementar la directiva.** Crear `src/app/shared/directivas/img-fallback.directive.ts`:

```ts
import { Directive, ElementRef, HostListener, Input } from '@angular/core';

export const IMG_FALLBACK = 'assets/images/icon-app/img-null.png';

export type ModoImgFallback = 'placeholder' | 'ocultar' | '';

@Directive({
  selector: 'img[appImgFallback]'
})
export class ImgFallbackDirective {

  // '' o 'placeholder': cambia el src por img-null.png. 'ocultar': esconde el <img>.
  @Input() appImgFallback: ModoImgFallback = '';

  private yaFallo = false;

  constructor(private el: ElementRef<HTMLImageElement>) { }

  @HostListener('error')
  onError(): void {
    // Guarda: si el propio fallback no carga, no entramos en bucle de errores.
    if (this.yaFallo) { return; }
    this.yaFallo = true;

    const imagen = this.el.nativeElement;

    if (this.appImgFallback === 'ocultar') {
      imagen.style.display = 'none';
      return;
    }

    imagen.src = IMG_FALLBACK;
  }
}
```

- [ ] **Step 4: Correr el spec y ver que pasa.**

```
npx ng test --include=src/app/shared/directivas/img-fallback.directive.spec.ts --watch=false --browsers=ChromeHeadless
```
Esperado: 4 tests PASAN.

- [ ] **Step 5: Declarar y exportar la directiva en `SharedModule`.** `src/app/shared/shared.module.ts` queda:

```ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuicklinkModule } from 'ngx-quicklink';
import { ImgUrlPipe } from './pipes/img-url.pipe';
import { ImgFallbackDirective } from './directivas/img-fallback.directive';

@NgModule({
  declarations: [
    ImgUrlPipe,
    ImgFallbackDirective
  ],
  imports: [
    CommonModule,
    QuicklinkModule
  ],
  exports: [
    QuicklinkModule,
    ImgUrlPipe,
    ImgFallbackDirective
  ]
})
export class SharedModule { }
```

- [ ] **Step 6: Borrar el pipe roto y sus referencias.**

```powershell
Remove-Item src/app/shared/pipes/imagen-no-encontrada.pipe.ts
```
En `src/app/app.module.ts` borrar la línea 21 `// import { ImagenNoEncontradaPipe } from './shared/pipes/imagen-no-encontrada.pipe';` y la línea 42 `// ImagenNoEncontradaPipe` (dentro de `declarations`). Confirmar que no queda nada:
```powershell
Select-String -Path (Get-ChildItem src -Recurse -Include *.ts,*.html).FullName -Pattern "imagenNoEncontrada|ImagenNoEncontrada"
```
Esperado: sin resultados.

- [ ] **Step 7: comp-view-promo — borrar los seis `<img>` de relleno (A4).** En `src/app/componentes/comp-view-promo/comp-view-promo.component.html` borrar TODO el bloque comentado inicial (desde `<!-- <div class="div-content-promo">` hasta `</div> -->`, líneas 1 a 21) y dejar el archivo así:

```html
<div class="div-content-promo">

    <div class="div-promo" matRipple *ngFor="let item of _listPromo" (click)="_itemSelected(item)">
        <img [src]="item.img | imgUrl:'promo'" alt="aa" appImgFallback loading="lazy">
        <div *ngIf="item.cerrado === 1" class="div-cerrado-comercio fw-600">
            Cerrado
        </div>
    </div>

</div>
```

- [ ] **Step 8: Aplicar la directiva a las imágenes REMOTAS (las de la sección 1 del dossier).** Cada línea queda exactamente así:

`src/app/componentes/comp-pedido-detalle/comp-pedido-detalle.component.html`
```html
<img class="img-thumbnail img-carta" [src]="item.img | imgUrl:'carta'" width="65px" alt="{{item.img}}" appImgFallback>
```

`src/app/componentes/dialog-item-edit/dialog-item-edit.component.html`
```html
<img class="img-carta" [src]="item.img | imgUrl:'carta'" alt="{{item.img}}" appImgFallback>
```

`src/app/componentes/item-comercio/item-comercio.component.html`
```html
<img class="img-comercio" [src]="itemEstablecimiento.pwa_delivery_img | imgUrl:'comercio'" alt="" appImgFallback loading="lazy">
```

`src/app/componentes/holding/forma-pago/forma-pago.component.html`
```html
<img src="{{method.icon}}" alt="{{method.name}}" width="20" appImgFallback="ocultar">
```

`src/app/componentes/holding/marcas/list/list.component.html`
```html
<img [src]="marca.imagen_url_comercial" [alt]="marca.nombre_comercial" *ngIf="marca.imagen_url_comercial" appImgFallback="ocultar">
```

`src/app/pages/pedido/carta/carta.component.html` (las dos imágenes de ítem)
```html
<img class="icon-item-carta rounded-circle" [src]="item.img | imgUrl:'carta'" alt="icon-item-carta" appImgFallback loading="lazy">
```
```html
<img class="icon-item-carta" [src]="item.img | imgUrl:'carta'" alt="icon-item-carta" (click)="selectedItem(item)" appImgFallback loading="lazy">
```

`src/app/pages/zona-establecimientos/establecimientos/establecimientos.component.html`
```html
<img [src]="itemComercio.img_mini | imgUrl:'comercio'" alt="loquesea" appImgFallback loading="lazy">
```

- [ ] **Step 9: Aplicar la directiva a las imágenes de `assets/` cuyo NOMBRE viene de la base de datos.** Son las que también dejan hueco roto cuando el registro trae un nombre que no existe en el bundle. Todas viven en módulos que ya tienen `SharedModule` (`ComponentesModule`, `PedidoModule`, `ZonaEstablecimientosModule`, `InicioModule`). Modo `ocultar` en todas, porque son iconos decorativos:

```html
<!-- comp-list-item-pedido-cliente.component.html:90 -->
<img *ngIf="itemIcon.visible" class="img-ico-entrega pl-2 text-secondary" src="../assets/images/{{itemIcon.icon}}" alt="itemIcon.motivo" matTooltip="{{ itemIcon.motivo }}" appImgFallback="ocultar">
```
```html
<!-- confirmar-delivery.component.html:150 -->
<img *ngIf="itemIcon.visible" class="img-ico-entrega pl-2 text-secondary" src="../assets/images/{{itemIcon.icon}}" alt="itemIcon.motivo" matTooltip="{{ itemIcon.motivo }}" appImgFallback="ocultar">
```
```html
<!-- dialog-metodo-pago.component.html:22 -->
<img src="../assets/images/icon-app/{{item.img}}" alt="{{item.img}}" appImgFallback="ocultar">
```
```html
<!-- tipo-vehiculo.component.html:6 -->
<img src="./assets/images/icon-app/{{item.img}}" alt="" appImgFallback="ocultar">
```
```html
<!-- encuesta-opcion.component.html:4 -->
<img src="assets/images/encuesta-img/{{option.img}}" class="btnIco" alt="btnOption" appImgFallback="ocultar">
```
```html
<!-- item-promocion.component.html:6 -->
<img src="{{iconGifPromo}}" alt="ico_promo" appImgFallback="ocultar">
```
```html
<!-- establecimientos.component.html:49 y :152 (las dos son iguales) -->
<img src="{{imgIcoCategoria}}{{item.img}}" alt="" appImgFallback="ocultar" loading="lazy">
```
```html
<!-- carta.component.html:94 -->
<img src="assets/images/{{i}}.png" alt="img-icon" appImgFallback="ocultar" loading="lazy">
```
```html
<!-- carta.component.html:97 -->
<img src="assets/images/{{item.img}}" alt="img-icon" appImgFallback="ocultar" loading="lazy">
```
```html
<!-- lector-success.component.html:44 -->
<div class="pr-2"><img src="/assets/images/{{item.img}}" alt="i1" appImgFallback="ocultar"></div>
```

**Fuera de alcance a propósito:** `pages/cash/atm/atm.component.html:20` y `pages/pedido-confirmado/confirmado/confirmado.component.html:14` usan nombres de una lista fija del propio componente (no de la base de datos) y sus módulos no importan `SharedModule`; se dejan como están.

- [ ] **Step 10: Verificar compilación, specs y que no quede nada del pipe viejo.**

```
npx tsc -p src/tsconfig.app.json --noEmit
npx ng test --include=src/app/shared/directivas/img-fallback.directive.spec.ts --watch=false --browsers=ChromeHeadless
npx ng build --configuration production
```
Y comprobar que ya no hay `imgdemo` suelto:
```powershell
Select-String -Path (Get-ChildItem src -Recurse -Include *.ts,*.html).FullName -Pattern "imgdemo"
```
Esperado: sin resultados; 4 tests PASAN; build exit 0.

- [ ] **Step 11: Commit.**

```powershell
git add src/app/shared/directivas/img-fallback.directive.ts src/app/shared/directivas/img-fallback.directive.spec.ts src/app/shared/shared.module.ts src/app/shared/pipes/ src/app/app.module.ts src/app/componentes/ src/app/pages/pedido/carta/ src/app/pages/zona-establecimientos/establecimientos/ src/app/pages/inicio/lector-success/
Set-Content -Path msg-sprint4-t2.txt -Encoding utf8 -Value @"
fix: directiva appImgFallback para toda imagen que puede faltar; se retira el pipe imagenNoEncontrada

Una sola directiva de atributo cambia el src por img-null.png o esconde el <img>
cuando la imagen no carga, con guarda para no entrar en bucle. Se aplica a las
imagenes remotas y a las de assets cuyo nombre viene de la base de datos, se
agrega loading=lazy en listas y se borran los seis <img> de relleno de promociones.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
"@
git commit -F msg-sprint4-t2.txt
Remove-Item msg-sprint4-t2.txt
```

---

### Task 3: `GeolocationService` único, con timeout, errores tipados y mensaje al usuario

Cubre **B5/B6 (HIGH)**: hoy hay cuatro pedidos de ubicación sin opciones ni manejo de error. El peor es `maps-service.service.ts` → `getPosition()`: en la rama nativa, `Geolocation.requestPermissions().then(async permissions => { const coordinates = await Geolocation.getCurrentPosition(); ... }, err => reject(err))`; si `getCurrentPosition()` rechaza dentro del `then`, ese rechazo no lo captura nadie y **la promesa nunca se resuelve ni se rechaza**: la pantalla se queda esperando para siempre. Los otros tres (`agregar-direccion.component.ts` en `setCurrentLocation()`, `dialog-direccion-cliente-delivery.component.ts` en `goUbicacionActual()`, `dialog-ubicacion.component.ts` en `getPosition()`) llaman a `navigator.geolocation.getCurrentPosition` sin `PositionOptions` y sin callback de error útil.

**B3/B4 ya se resolvieron en el Sprint 1 Tarea 5** (`GoogleMapsLoaderService` no bloqueante): no se rehacen aquí, solo se consumen.

**Files:**
- Create: `src/app/shared/services/geolocation.service.ts`
- Create: `src/app/shared/services/geolocation.service.spec.ts`
- Modify: `src/app/shared/services/maps-service.service.ts` (método `getPosition`, imports)
- Modify: `src/app/componentes/agregar-direccion/agregar-direccion.component.ts` y `.html`
- Modify: `src/app/componentes/dialog-direccion-cliente-delivery/dialog-direccion-cliente-delivery.component.ts` y `.html`
- Modify: `src/app/componentes/dialog-ubicacion/dialog-ubicacion.component.ts`
- Test: `src/app/shared/services/geolocation.service.spec.ts`

**Interfaces:**
- Produces: `GeolocationService` (`providedIn: 'root'`) con:
  - `obtenerPosicion(): Promise<PosicionCliente>` donde `export interface PosicionCliente { latitude: number; longitude: number; }`. Rechaza con un valor de `export type ErrorGeolocalizacion = 'permiso-denegado' | 'no-disponible' | 'timeout'`.
  - `mensaje(error: any): string` — texto para el usuario, con la alternativa manual incluida.
  - `export const OPCIONES_GEO = { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 };`
- Produces: `MapsServiceService.getPosition(): Promise<{ lat: number, lng: number }>` (misma forma que antes, para no tocar a sus llamadores; ahora delega en `GeolocationService`).
- Produces: campo público `msjGeolocalizacion: string` en `AgregarDireccionComponent` y en `DialogDireccionClienteDeliveryComponent` (la Tarea 4 lo reutiliza para el aviso de "mapa no disponible").

- [ ] **Step 1: Escribir el spec (falla).** Crear `src/app/shared/services/geolocation.service.spec.ts`. En Karma el navegador reporta plataforma `web`, así que `IS_NATIVE` es `false` y se ejercita la rama de `navigator.geolocation`:

```ts
import { TestBed } from '@angular/core/testing';
import { GeolocationService, OPCIONES_GEO } from './geolocation.service';

describe('GeolocationService (rama web)', () => {
  let service: GeolocationService;
  let originalGeolocation: any;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeolocationService);
    originalGeolocation = navigator.geolocation;
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'geolocation', { value: originalGeolocation, configurable: true });
  });

  function fingirGeolocation(falso: any): void {
    Object.defineProperty(navigator, 'geolocation', { value: falso, configurable: true });
  }

  it('resuelve con latitude y longitude y pide alta precision con timeout', async () => {
    let opcionesRecibidas: any = null;
    fingirGeolocation({
      getCurrentPosition: (ok: any, _err: any, opciones: any) => {
        opcionesRecibidas = opciones;
        ok({ coords: { latitude: -12.05, longitude: -77.04 } });
      }
    });

    const pos = await service.obtenerPosicion();

    expect(pos).toEqual({ latitude: -12.05, longitude: -77.04 });
    expect(opcionesRecibidas).toEqual(OPCIONES_GEO);
    expect(OPCIONES_GEO.timeout).toBe(10000);
  });

  it('rechaza con permiso-denegado cuando el navegador devuelve code 1', async () => {
    fingirGeolocation({
      getCurrentPosition: (_ok: any, err: any) => err({ code: 1, message: 'User denied Geolocation' })
    });
    await expectAsync(service.obtenerPosicion()).toBeRejectedWith('permiso-denegado');
  });

  it('rechaza con timeout cuando el navegador devuelve code 3', async () => {
    fingirGeolocation({
      getCurrentPosition: (_ok: any, err: any) => err({ code: 3, message: 'Timeout expired' })
    });
    await expectAsync(service.obtenerPosicion()).toBeRejectedWith('timeout');
  });

  it('rechaza con no-disponible cuando code 2 o cuando no existe la API', async () => {
    fingirGeolocation({
      getCurrentPosition: (_ok: any, err: any) => err({ code: 2, message: 'Position unavailable' })
    });
    await expectAsync(service.obtenerPosicion()).toBeRejectedWith('no-disponible');

    fingirGeolocation(undefined);
    await expectAsync(service.obtenerPosicion()).toBeRejectedWith('no-disponible');
  });

  it('siempre se resuelve o se rechaza: nunca queda colgada', async () => {
    fingirGeolocation({
      getCurrentPosition: (_ok: any, err: any) => err({ code: 3, message: 'Timeout expired' })
    });

    let termino = false;
    await service.obtenerPosicion().then(() => { termino = true; }, () => { termino = true; });

    expect(termino).toBe(true);
  });

  it('mensaje() da un texto util para cada error y cae en no-disponible ante lo desconocido', () => {
    expect(service.mensaje('permiso-denegado')).toContain('permiso');
    expect(service.mensaje('timeout')).toContain('tardando');
    expect(service.mensaje('no-disponible')).toContain('ubicación');
    expect(service.mensaje('lo-que-sea')).toBe(service.mensaje('no-disponible'));
  });
});
```

- [ ] **Step 2: Correr el spec y ver que falla.**

```
npx ng test --include=src/app/shared/services/geolocation.service.spec.ts --watch=false --browsers=ChromeHeadless
```
Esperado: FALLA, `Cannot find module './geolocation.service'`.

- [ ] **Step 3: Implementar el servicio.** Crear `src/app/shared/services/geolocation.service.ts`:

```ts
import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { IS_NATIVE } from '../config/config.const';

export type ErrorGeolocalizacion = 'permiso-denegado' | 'no-disponible' | 'timeout';

export interface PosicionCliente {
  latitude: number;
  longitude: number;
}

export const OPCIONES_GEO = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000
};

const MENSAJES: { [clave in ErrorGeolocalizacion]: string } = {
  'permiso-denegado': 'No pudimos usar tu ubicación porque el permiso está desactivado. Escribe tu dirección en el buscador.',
  'no-disponible': 'No pudimos obtener tu ubicación en este momento. Escribe tu dirección en el buscador.',
  'timeout': 'Tu ubicación está tardando demasiado. Escribe tu dirección en el buscador.'
};

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {

  obtenerPosicion(): Promise<PosicionCliente> {
    return IS_NATIVE ? this.posicionNativa() : this.posicionWeb();
  }

  mensaje(error: any): string {
    const clave = error as ErrorGeolocalizacion;
    return MENSAJES[clave] || MENSAJES['no-disponible'];
  }

  private async posicionNativa(): Promise<PosicionCliente> {
    let permisos: any = null;

    try {
      permisos = await Geolocation.requestPermissions();
    } catch (error) {
      return Promise.reject(this.clasificar(error));
    }

    if (!permisos || permisos.location !== 'granted') {
      return Promise.reject('permiso-denegado' as ErrorGeolocalizacion);
    }

    try {
      const posicion = await Geolocation.getCurrentPosition(OPCIONES_GEO);
      return { latitude: posicion.coords.latitude, longitude: posicion.coords.longitude };
    } catch (error) {
      return Promise.reject(this.clasificar(error));
    }
  }

  private posicionWeb(): Promise<PosicionCliente> {
    return new Promise<PosicionCliente>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('no-disponible' as ErrorGeolocalizacion);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        posicion => resolve({ latitude: posicion.coords.latitude, longitude: posicion.coords.longitude }),
        error => reject(this.clasificar(error)),
        OPCIONES_GEO
      );
    });
  }

  private clasificar(error: any): ErrorGeolocalizacion {
    const codigo = error && error.code;
    if (codigo === 1) { return 'permiso-denegado'; }
    if (codigo === 3) { return 'timeout'; }

    const texto = ((error && error.message) || '').toString().toLowerCase();
    if (texto.indexOf('time') > -1) { return 'timeout'; }
    if (texto.indexOf('denied') > -1 || texto.indexOf('permission') > -1) { return 'permiso-denegado'; }

    return 'no-disponible';
  }
}
```

- [ ] **Step 4: Correr el spec y ver que pasa.**

```
npx ng test --include=src/app/shared/services/geolocation.service.spec.ts --watch=false --browsers=ChromeHeadless
```
Esperado: 6 tests PASAN.

- [ ] **Step 5: `maps-service.service.ts` — delegar `getPosition` (la promesa que nunca resolvía).** Reemplazar el método completo y limpiar imports:

```ts
  // ponytail: se conserva la forma {lat, lng} porque la usan los mapas; la logica vive en GeolocationService
  async getPosition(): Promise<{ lat: number, lng: number }> {
    const pos = await this.geolocationService.obtenerPosicion();
    return { lat: pos.latitude, lng: pos.longitude };
  }
```
El constructor queda:
```ts
  constructor(
    private crudService: CrudHttpService,
    private geolocationService: GeolocationService
    ) { }
```
Agregar `import { GeolocationService } from './geolocation.service';` y borrar `import { Geolocation } from '@capacitor/geolocation';` y `import { IS_NATIVE } from '../config/config.const';` (comprobar antes con `Select-String -Path src/app/shared/services/maps-service.service.ts -Pattern "IS_NATIVE|Geolocation"` que no queda otro uso en el archivo).

- [ ] **Step 6: `agregar-direccion.component.ts` — ubicación con error y centro de respaldo.** Agregar arriba del `@Component`:

```ts
const CENTRO_LIMA = { lat: -12.0464, lng: -77.0428 };
```
Agregar el import `import { GeolocationService } from 'src/app/shared/services/geolocation.service';`, el campo público `msjGeolocalizacion = '';` junto a `isDireccionValid`, y `private geolocationService: GeolocationService` al constructor. Reemplazar `setCurrentLocation()` por:

```ts
  private setCurrentLocation() {
    if (this.isUsCliente === false) {
      this.dataInfoSede = this.miPedidoService.objDatosSede.datossede[0];
      this.latitude = this.dataInfoSede.latitude;
      this.longitude = this.dataInfoSede.longitude;
      this.mapCenter = { lat: Number(this.latitude), lng: Number(this.longitude) };
      return;
    }

    this.usarCentroDeRespaldo();

    this.geolocationService.obtenerPosicion()
      .then(pos => {
        this.msjGeolocalizacion = '';
        this.latitude = pos.latitude;
        this.longitude = pos.longitude;
        this.mapCenter = { lat: pos.latitude, lng: pos.longitude };
        this.getAddress(pos.latitude, pos.longitude);
      })
      .catch(error => {
        this.msjGeolocalizacion = this.geolocationService.mensaje(error);
      });
  }

  // Centro inicial mientras el GPS responde (o si nunca responde): el del comercio si se conoce.
  private usarCentroDeRespaldo() {
    const sede = this.miPedidoService.objDatosSede && this.miPedidoService.objDatosSede.datossede
      ? this.miPedidoService.objDatosSede.datossede[0]
      : null;
    const lat = Number(sede ? sede.latitude : NaN);
    const lng = Number(sede ? sede.longitude : NaN);
    const centro = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : { lat: CENTRO_LIMA.lat, lng: CENTRO_LIMA.lng };

    this.mapCenter = centro;
    this.latitude = centro.lat;
    this.longitude = centro.lng;
  }
```

- [ ] **Step 7: `agregar-direccion.component.html` — mostrar el aviso y la alternativa manual.** Debajo del párrafo `<p *ngIf="!isDireccionValid" ...>` del final del archivo, agregar:

```html
        <p *ngIf="msjGeolocalizacion" class="fw-600 text-warning fs-13 p-2">{{ msjGeolocalizacion }}</p>
```

- [ ] **Step 8: `dialog-direccion-cliente-delivery.component.ts` — `goUbicacionActual()`.** Agregar el import `import { GeolocationService } from 'src/app/shared/services/geolocation.service';`, el campo `msjGeolocalizacion = '';` junto a `loader = 0;`, `private geolocationService: GeolocationService` al constructor, y borrar la línea `console.log(this.isFromComercio);` del constructor. Reemplazar `goUbicacionActual()` por:

```ts
  async goUbicacionActual() {
    this.msjGeolocalizacion = '';

    try {
      const pos = await this.geolocationService.obtenerPosicion();
      this.latitude = pos.latitude;
      this.longitude = pos.longitude;
      this.setCentro(pos.latitude, pos.longitude);
      this.getDireccionGeocode({ location: { lat: pos.latitude, lng: pos.longitude } });
    } catch (error) {
      // Alternativa manual: se queda en el buscador de direcciones.
      this.msjGeolocalizacion = this.geolocationService.mensaje(error);
      this.showBusqueda = true;
    }
  }
```
Agregar el método auxiliar (lo reutiliza la Tarea 4) y quitar el `getPosition()` privado duplicado del componente (el que hace `navigator.geolocation.getCurrentPosition` sin opciones):

```ts
  private setCentro(lat: number, lng: number): void {
    this.mapCenter = { lat, lng };
  }
```
En `centerChange(event: any)` y en `getDireccionGeocode(...)`, sustituir las asignaciones `this.mapCenter.lat = ...; this.mapCenter.lng = ...;` por `this.setCentro(...)`:
```ts
  centerChange(event: any) {
    if (event) {
      this.setCentro(event.lat, event.lng);
    }
  }
```
y dentro de `getDireccionGeocode`, donde dice `// centrar`:
```ts
          // centrar
          this.setCentro(this.latitude, this.longitude);
```

- [ ] **Step 9: `dialog-direccion-cliente-delivery.component.html` — aviso bajo el botón de ubicación actual.** Justo después del `</ng-container>` que cierra el bloque `<!-- boton de direccion actual -->`, agregar:

```html
        <p *ngIf="msjGeolocalizacion" class="fw-600 text-warning fs-13">{{ msjGeolocalizacion }}</p>
```

- [ ] **Step 10: `dialog-ubicacion.component.ts` — usar el servicio (y de paso desaparece el `this` perdido).** Agregar `import { GeolocationService } from 'src/app/shared/services/geolocation.service';` y `private geolocationService: GeolocationService` al constructor. Reemplazar `getPosition()` y borrar por completo `showPositionError`:

```ts
  private getPosition() {
    this.geolocationService.obtenerPosicion()
      .then(pos => {
        this.cDispositivo = { lat: pos.latitude, lng: pos.longitude };
        this.hasPermissionPosition = true;
        this.data.posIssValid = this.data.isDemo ? true : this.arePointsNear(this.cLocal, this.cDispositivo, 1);
        this.cerrarDlg();
      })
      .catch(() => {
        // ponytail: el aviso al usuario y la alternativa manual las da quien abre el dialogo
        // (lector-codigo-qr) al recibir posIssValid = false.
        this.hasPermissionPosition = false;
        this.data.posIssValid = false;
        this.cerrarDlg();
      });
  }
```
(El retardo de 4 s de `loadGPS()` y el argumento `km` ignorado de `arePointsNear` se arreglan en la Tarea 6.)

- [ ] **Step 11: Verificar.**

```
npx tsc -p src/tsconfig.app.json --noEmit
npx ng test --include=src/app/shared/services/geolocation.service.spec.ts --watch=false --browsers=ChromeHeadless
npx ng build --configuration production
```
Y comprobar que ya no queda ningún pedido de ubicación sin pasar por el servicio:
```powershell
Select-String -Path (Get-ChildItem src/app -Recurse -Filter *.ts).FullName -Pattern "navigator.geolocation.getCurrentPosition"
```
Esperado: solo `src/app/shared/services/geolocation.service.ts` (y las líneas comentadas de `lector-codigo-qr.component.ts`, que ya estaban comentadas).

- [ ] **Step 12: Commit.**

```powershell
git add src/app/shared/services/geolocation.service.ts src/app/shared/services/geolocation.service.spec.ts src/app/shared/services/maps-service.service.ts src/app/componentes/agregar-direccion/ src/app/componentes/dialog-direccion-cliente-delivery/ src/app/componentes/dialog-ubicacion/
Set-Content -Path msg-sprint4-t3.txt -Encoding utf8 -Value @"
fix: un solo GeolocationService con timeout, errores tipados y mensaje al usuario

getPosition de maps-service podia quedarse sin resolver nunca cuando fallaba
getCurrentPosition dentro del then de requestPermissions. Ahora los cuatro puntos
de llamada usan el mismo servicio, siempre con enableHighAccuracy, timeout de
10 s y maximumAge, y cada error muestra un aviso con la alternativa manual.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
"@
git commit -F msg-sprint4-t3.txt
Remove-Item msg-sprint4-t3.txt
```

---

### Task 4: Mapa de confirmación de dirección con `@angular/google-maps` (B1) y arreglos de `agregar-direccion` (B7)

Cubre **B1 (CRITICAL)**: `dialog-direccion-cliente-delivery.component.html` todavía usa `<agm-map>` con `(centerChange)`, `(mapClick)` e `(idle)`; `@agm/core` ya no está instalado (Sprint 2 Tarea 4), así que el elemento lo traga `CUSTOM_ELEMENTS_SCHEMA` y **el mapa no se dibuja**: el botón "Confirmar" nunca aparece porque `countMoveMap` nunca sube de 1. Y **B7 (HIGH)**: en `agregar-direccion.component.ts`, `guardarDireccion()` corre desde `registerForm.statusChanges` y hace `this.dataCliente.longitude = this.mapCenter.lng;` — si el GPS fue denegado, `mapCenter` es `undefined` y revienta.

**Files:**
- Modify: `src/app/shared/services/google-maps-loader.service.ts` (solo si falta `isLoaded()`)
- Modify: `src/app/componentes/dialog-direccion-cliente-delivery/dialog-direccion-cliente-delivery.component.ts`, `.html`, `.css`
- Modify: `src/app/componentes/agregar-direccion/agregar-direccion.component.ts` y `.html`

**Interfaces:**
- Consumes: `GoogleMapsLoaderService.load()` / `isLoaded()` (Sprint 1 Tarea 5); `GoogleMapsModule` ya importado en `ComponentesModule` (Sprint 2 Tarea 4); `GeolocationService` y `setCentro()` de la Tarea 3.
- Produces: en `DialogDireccionClienteDeliveryComponent`: `@ViewChild(GoogleMap) map: GoogleMap`, `mapCenter: google.maps.LatLngLiteral`, `zoom = 17`, `mapOptions: google.maps.MapOptions`, `mapsListo: boolean`, `centerChanged(): void`.
- Produces: en `AgregarDireccionComponent`: `@ViewChild('map') map: GoogleMap`, `centerChanged(): void`, `markerDragEnd(event: google.maps.MapMouseEvent)` enganchado a `(mapDragend)`.

- [ ] **Step 1: Asegurar `isLoaded()` en el loader.** Abrir `src/app/shared/services/google-maps-loader.service.ts`. Si **no** existe el método `isLoaded()` (es decir, el Sprint 1 Tarea 5 no llegó a ejecutarse), reemplazar el archivo completo por esta versión, que es la del Sprint 1:

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

      // por si el script ya existia y el callback ya corrio
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
Si `isLoaded()` ya está, no tocar el archivo.

- [ ] **Step 2: `dialog-direccion-cliente-delivery.component.ts` — estado del mapa.** Agregar imports:

```ts
import { GoogleMap } from '@angular/google-maps';
import { GoogleMapsLoaderService } from 'src/app/shared/services/google-maps-loader.service';
```
Reemplazar el bloque de campos del mapa (`dataMapa`, `latitude`, `longitude`, `zoom`, `countMoveMap`, `mapCenter`) por:

```ts
  dataMapa: any;
  latitude: number;
  longitude: number;
  zoom = 17;
  countMoveMap = 0;
  isUsCliente = true; // si el usuario es cliente o usuario autorizado
  mapsListo = false;
  mapCenter: google.maps.LatLngLiteral = { lat: -12.0464, lng: -77.0428 };
  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    streetViewControl: false,
    clickableIcons: false,
    gestureHandling: 'greedy'
  };

  @ViewChild(GoogleMap) map: GoogleMap;
```
(El `isUsCliente` ya existía; mantenerlo donde estaba si prefieres, pero no duplicarlo.)

Agregar `private mapsLoader: GoogleMapsLoaderService` al constructor y en `ngOnInit()`, al final:

```ts
    this.mapsLoader.load()
      .then(() => { this.mapsListo = true; })
      .catch(() => { this.mapsListo = false; });
```

- [ ] **Step 3: `dialog-direccion-cliente-delivery.component.ts` — leer el centro del mapa real.** `<google-map>` emite `(centerChanged)` **sin payload**, así que el centro se lee del `GoogleMap`. Reemplazar `centerChange(event: any)` (creado en la Tarea 3) por los dos métodos:

```ts
  // (centerChanged) de <google-map> no trae payload: el centro se lee del mapa.
  centerChanged(): void {
    const centro = this.map ? this.map.getCenter() : null;
    if (!centro) { return; }
    this.setCentro(centro.lat(), centro.lng());
  }
```
`setCentro(lat, lng)` ya existe desde la Tarea 3 y `goUbicacionActual()` lo llama directamente, así que no hace falta `centerChange(event)`. Borrarlo si no queda ningún llamador (`Select-String -Path src/app/componentes/dialog-direccion-cliente-delivery/ -Recurse -Pattern "centerChange\("`).

- [ ] **Step 4: `dialog-direccion-cliente-delivery.component.ts` — no reventar sin mapa.** En `getDireccionGeocode`, después del bloque `if (prediccionSelected) { ... }`, agregar la guarda:

```ts
    if (!this.mapsLoader.isLoaded()) {
      this.msjGeolocalizacion = 'El mapa no está disponible. Guardaremos la dirección tal como la escribiste.';
      this.showSelectedDireccion = false;
      return;
    }
```
Y blindar `searchTypeMap` para cuando no hubo geocodificación:

```ts
  private searchTypeMap(search: string): string {
    let rpt = '';
    if (!this.dataMapa || !this.dataMapa.address_components) { return rpt; }
    this.dataMapa.address_components.map((x: any) => {
      x.types.map( (t: any) => {
        if (t === search) {
          rpt = x.long_name;
          return rpt;
        }
      });
    });
    return rpt;
  }
```

- [ ] **Step 5: `dialog-direccion-cliente-delivery.component.html` — cambiar `<agm-map>` por `<google-map>`.** Reemplazar el bloque `<div class="border" id="map_canvas"> ... </div>` completo (incluido el comentario del mapa de Capacitor que le sigue, que se borra) por:

```html
    <!-- mapa -->
    <div class="border" id="map_canvas">
        <google-map *ngIf="mapsListo"
            height="245px"
            width="100%"
            [center]="mapCenter"
            [zoom]="zoom"
            [options]="mapOptions"
            (centerChanged)="centerChanged()"
            (mapClick)="clickmap()"
            (idle)="idleMap()">
        </google-map>

        <div *ngIf="!mapsListo" class="sin-mapa">
            No pudimos cargar el mapa. Puedes guardar la dirección tal como la escribiste y corregirla luego.
        </div>

        <ng-container *ngIf="mapsListo">
            <div class="centerMarker"></div>
            <div class="centerMarker-fondo"></div>
            <div class="btn-confirmar-dir" *ngIf="countMoveMap > 1">
                <button class="btn btn-success" (click)="confirmarDireccion()">Confirmar</button>
            </div>
        </ng-container>
    </div>
```
Se conserva el enfoque de marcador central por superposición (`centerMarker` + `centerMarker-fondo`) y la compuerta `countMoveMap > 1` alimentada por `(idle)`.

- [ ] **Step 6: `dialog-direccion-cliente-delivery.component.css`.** Reemplazar la regla `agm-map { height: 245px; }` por:

```css
google-map {
    display: block;
    height: 245px;
}

.sin-mapa {
    padding: 12px;
    font-size: 12px;
    color: #7b8494;
    text-align: center;
}
```
Borrar también la regla final `capacitor-google-map { ... }` (el elemento ya no existe en la plantilla).

- [ ] **Step 7: `agregar-direccion.component.ts` — bindings reales de `@angular/google-maps`.** Descomentar y ajustar el import de la primera línea para que quede:

```ts
import { GoogleMap } from '@angular/google-maps';
```
Descomentar el `@ViewChild` del mapa dejándolo:
```ts
  @ViewChild('map') map: GoogleMap;
```
Reemplazar `centerChange(event: any)` por el equivalente que lee del mapa:
```ts
  // (centerChanged) de <google-map> no trae payload: el centro se lee del mapa.
  centerChanged(): void {
    const centro = this.map ? this.map.getCenter() : null;
    if (!centro) { return; }
    this.mapCenter = { lat: centro.lat(), lng: centro.lng() };
  }
```
Y `markerDragEnd` se mantiene con la firma actual (`event: google.maps.MapMouseEvent`), pero construyendo objeto nuevo:
```ts
  markerDragEnd(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.latitude = event.latLng.lat();
      this.longitude = event.latLng.lng();
      this.mapCenter = { lat: this.latitude, lng: this.longitude };
    }
  }
```

- [ ] **Step 8: `agregar-direccion.component.html` — nombres de salida correctos.** En `<map-marker>` la salida de arrastre de `@angular/google-maps` se llama **`mapDragend`**, no `dragend`; y `(centerChanged)` no lleva `$event`. El bloque del mapa queda:

```html
                <div class="border" id="map_canvas">
                    <google-map #map
                        [center]="mapCenter"
                        [zoom]="zoom"
                        [options]="mapOptions"
                        (mapClick)="clickmap()"
                        (idle)="idleMap()"
                        (centerChanged)="centerChanged()"
                        height="400px"
                        width="100%">
                        <map-marker
                            [position]="mapCenter"
                            [options]="markerOptions"
                            (mapDragend)="markerDragEnd($event)">
                        </map-marker>
                    </google-map>
                    <div class="centerMarker"></div>
                    <div class="btn-confirmar-dir" *ngIf="countMoveMap > 1">
                        <button class="btn btn-success" (click)="confirmarDireccion()">Confirmar</button>
                    </div>
                </div>
```

- [ ] **Step 9: `agregar-direccion.component.ts` — guarda de `guardarDireccion()` (B7).** Reemplazar el inicio del método por:

```ts
  guardarDireccion() {

    if (!this.isDireccionValid) {
      return;
    }

    // statusChanges dispara este metodo apenas el formulario es valido; si el GPS
    // fue denegado y aun no hay centro ni geocodificacion, no hay nada que guardar.
    if (!this.mapCenter || !this.mapCenter.lat) {
      return;
    }

    if (!this.dataMapa) {
      return;
    }

    this.dataCliente.direccion = this.address;
    this.dataCliente.idcliente = this.isUsCliente ? this.verifyClientService.getDataClient().idcliente : this.idClienteBuscar;
    this.dataCliente.longitude = this.mapCenter.lng;
    this.dataCliente.latitude = this.mapCenter.lat;
    this.dataCliente.referencia = this.utilService.addslashes(this.dataCliente.referencia);
    this.dataCliente.ciudad = this.searchTypeMap('locality');
    this.dataCliente.provincia = this.searchTypeMap('administrative_area_level_2');
    this.dataCliente.departamento = this.searchTypeMap('administrative_area_level_1');
    this.dataCliente.pais = this.searchTypeMap('country');
    this.dataCliente.codigo = this.searchTypeMap('postal_code');
  }
```
Y blindar también su `searchTypeMap`:
```ts
  private searchTypeMap(search: string): string {
    let rpt = '';
    if (!this.dataMapa || !this.dataMapa.address_components) { return rpt; }
    this.dataMapa.address_components.map((x: any) => {
      x.types.map( (t: any) => {
        if (t === search) {
          rpt = x.long_name;
          return rpt;
        }
      });
    });
    return rpt;
  }
```

- [ ] **Step 10: `agregar-direccion.component.ts` — no crear el autocompletado sin Maps.** En `loadInitComponent()`, envolver el arranque:

```ts
  private loadInitComponent() {
    this.setCurrentLocation();

    if (!this.mapsLoader.isLoaded()) {
      this.msjGeolocalizacion = 'El buscador de direcciones no está disponible. Escribe la dirección completa o usa las coordenadas.';
      return;
    }

    this.geoCoder = new google.maps.Geocoder();

    const autocomplete = new google.maps.places.Autocomplete(this.searchElementRef.nativeElement, {
      componentRestrictions: this._componentRestrictions
    });

    autocomplete.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place: google.maps.places.PlaceResult = autocomplete.getPlace();

        this.countMoveMap = 0;
        this.dataMapa = place;
        this.address = place.formatted_address;

        if (place.geometry === undefined || place.geometry === null) {
          return;
        }

        this.latitude = place.geometry.location.lat();
        this.longitude = place.geometry.location.lng();
        this.isChangeDireccion = false;

        this.mapCenter = { lat: this.latitude, lng: this.longitude };

        setTimeout(() => {
          this.isChangeDireccion = true;
        }, 500);
      });
    });
  }
```
Agregar el import `import { GoogleMapsLoaderService } from 'src/app/shared/services/google-maps-loader.service';` y `private mapsLoader: GoogleMapsLoaderService` al constructor. En `getAddress(latitude, longitude)`, primera línea del método: `if (!this.geoCoder) { return; }`.

- [ ] **Step 11: Verificar que no queda `agm` en el proyecto.**

```
npx tsc -p src/tsconfig.app.json --noEmit
npx ng build --configuration production
```
```powershell
Select-String -Path (Get-ChildItem src -Recurse -Include *.ts,*.html,*.css).FullName -Pattern "agm-map|agm-marker|@agm/core"
```
Esperado: sin resultados; build exit 0.

- [ ] **Step 12: Commit.**

```powershell
git add src/app/shared/services/google-maps-loader.service.ts src/app/componentes/dialog-direccion-cliente-delivery/ src/app/componentes/agregar-direccion/
Set-Content -Path msg-sprint4-t4.txt -Encoding utf8 -Value @"
fix: mapa de confirmacion de direccion con angular/google-maps y guardas sin GPS

Se migra el ultimo agm-map (dialog-direccion-cliente-delivery) a google-map, con
el centro leido del propio mapa y aviso de texto cuando Maps no carga. En
agregar-direccion se corrigen los bindings reales (mapDragend, centerChanged sin
payload) y guardarDireccion deja de reventar cuando el GPS fue denegado.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
"@
git commit -F msg-sprint4-t4.txt
Remove-Item msg-sprint4-t4.txt
```

---

### Task 5: Cerrar los últimos suscriptores sin ruta de error (B8) y modo de costo `fijo` (B11-lite)

**Estado real del código antes de empezar (leído el 2026-09-10, no reimplementar).** El grueso de **B8 (HIGH)** ya se resolvió en el Sprint 1 (commits `e8dce76` "Google Maps no bloquea el arranque" y `eac4269` "el fallo del calculo de distancia ya no bloquea Confirmar (BUG-101)"). Hoy ya existen y **no se tocan**:

- `src/app/shared/services/calc-distancia.service.ts:11` — `const TIMEOUT_RUTA_MS = 8000;`.
- `src/app/shared/services/calc-distancia.service.ts:241-276` (`calculateRouteObserver`) y `:296-322` (`getDistanciaKmRoute`) — el patrón `emitir(reskm, esEstimada)` con guarda `emitido`, `setTimeout(TIMEOUT_RUTA_MS)` de respaldo, **segundo argumento de `subscribe` que estima en vez de propagar el error** y `try/catch` alrededor de `calcularRuta`. Con esto los dos observables **siempre emiten exactamente un `next` + `complete`**: ya no pueden dejar a nadie esperando.
- `src/app/shared/services/calc-distancia.service.ts:279-287` — `kmEstimadoSinApi()`, respaldo por línea recta ×1.3 apoyado en `distanciaKmHaversine` de `src/app/shared/utils/geo.ts:13` (con su spec `src/app/shared/utils/geo.spec.ts`).
- `isDistanciaEstimada` / `isCalcApiGoogle` marcados en `calc-distancia.service.ts:250-251` y `:304`, leídos en `confirmar-delivery.component.ts:101`, `:625-626`, `:689` y pintados en `confirmar-delivery.component.html:48` ("(distancia estimada)").
- `confirmar-delivery.component.ts:701-707` — `fallaCalculoDistancia(error)`: apaga `isCalculandoDistanciaA`, marca la dirección como no válida, pone `msjErrorDir` y llama `verificarMontoMinimo()`. Ya está enganchado como callback de error en los **dos** suscriptores del checkout (`:656` y `:693`), y el spinner también se apaga en la rama de éxito (`:638`, `:688`) y en la rama de fuera de cobertura (`:651`).

**Por lo tanto B8 está cubierto en `confirmar-delivery` y en el servicio: esta tarea NO reescribe nada de eso.** Lo que queda de B8 son **tres suscriptores de `calculateRouteObserver` en otros componentes que encienden un indicador de "calculando" y no tienen ruta de error**, más un `return` que deja el indicador encendido:

| Archivo | Línea | Indicador que puede quedarse encendido |
|---|---|---|
| `src/app/componentes/comp-get-datos-cliente/comp-get-datos-cliente.component.ts` | 270-281 | `isCalculandoDistancia` (alimenta `ladingCostoServicio`, línea 203) |
| `src/app/componentes/comp-pide-express/comp-pide-express.component.ts` | 292-302 | `isCalculandoDistancia` (bloquea `isFormValidDos`, línea 180) |
| `src/app/componentes/comp-pide-lo-que-quieras/comp-pide-lo-que-quieras.component.ts` | 269-291 | `isCalculandoDistanciaA` (bloquea `isFormValidDos`, línea 177) **y** el `return` de "ciudad distinta" (línea 275) sale sin apagarlo |

(`src/app/componentes/datos-delivery/datos-delivery.component.ts:359` y `:433` también suscriben sin callback de error, pero sus `isCalculandoDistanciaA` están comentados (`:431`, `:449`): no hay spinner que se pueda quedar encendido, así que **no se tocan** — ponytail.)

Y **B11-lite**: `sede_costo_delivery.parametros` ya trae `modo: 'fijo' | 'variable' | 'zonas'`, `costo_fijo` y `tiempo_aprox_entrega` (ver dossier sección 19, `ParametrosCostoDelivery`; el backend los entrega en `establecimiento.service.ts:174-191`, `getParametrosTiendaLinea()`), pero `costoEntregaTiendaEnLinea` (`calc-distancia.service.ts:346`) los ignora y siempre calcula por distancia. Las **zonas quedan fuera de alcance** (van al sprint de "Mi tienda") y se dejan anotadas con `// ponytail:`.

**Files:**
- Create: `src/app/shared/utils/costo-entrega.ts` (regla de costo como función pura, al lado de `geo.ts`)
- Create: `src/app/shared/utils/calc-distancia.costo.spec.ts` (spec sin TestBed, sin Angular, sin `google`)
- Modify: `src/app/shared/services/calc-distancia.service.ts` (solo los imports y el cuerpo de `costoEntregaTiendaEnLinea:346-369`)
- Modify: `src/app/componentes/confirmar-delivery/confirmar-delivery.component.ts` y `.html` (mostrar `tiempo_aprox_entrega`)
- Modify: `src/app/componentes/comp-get-datos-cliente/comp-get-datos-cliente.component.ts`
- Modify: `src/app/componentes/comp-pide-express/comp-pide-express.component.ts`
- Modify: `src/app/componentes/comp-pide-lo-que-quieras/comp-pide-lo-que-quieras.component.ts`
- Test: `src/app/shared/utils/calc-distancia.costo.spec.ts`
- **No modificar:** `calc-distancia.service.ts:241-287` y `:296-322` (timeout + respaldo por haversine), `confirmar-delivery.component.ts:601-707` (ya tiene su ruta de error), `src/app/shared/utils/geo.ts` y `geo.spec.ts`.

**Interfaces:**
- Produces: `src/app/shared/utils/costo-entrega.ts` exporta `ParametrosCostoDelivery`, `CostoEntrega { success: boolean; costo_servicio?: number; distancia_en_km?: string; tiempo_aprox_entrega?: string; mensaje?: string; }`, `MSJ_FUERA_DE_COBERTURA` y `calcularCostoEntrega(parametros, distanciaEnKm, redondear): CostoEntrega`. `redondear` se inyecta (es `UtilitariosService.roundAmount`) para que la función no arrastre Angular al test.
- Produces: `costoEntregaTiendaEnLinea(parametros: ParametrosCostoDelivery, distanciaEnKm: number, isTiendaLinea?: boolean): CostoEntrega` pasa a ser una envoltura de una línea sobre `calcularCostoEntrega`. Con `parametros.modo === 'fijo'` devuelve `costo_fijo` redondeado **sin comprobar distancia ni radio máximo**; sin `modo` (o con cualquier otro valor) mantiene el cálculo por `km_base` / `km_base_costo` / `km_adicional_costo` / `km_limite`, igual que hoy.
- Consumes: `confirmar-delivery.component.ts:620` ya llama a `costoEntregaTiendaEnLinea(...)` y lee `.success`, `.mensaje`, `.costo_servicio`, `.distancia_en_km`; la firma nueva es compatible campo por campo, solo suma `tiempo_aprox_entrega`.
- Sin cambios de firma en `calculateRouteObserver(...)` ni en `getDistanciaKmRoute(...)`: siguen emitiendo `next` + `complete` siempre (nunca `error`), que es justo lo que hace que el spinner no se pueda quedar encendido.

- [ ] **Step 1: Comprobar que lo del Sprint 1 sigue en su sitio (sin editar nada).**

```powershell
Select-String -Path src/app/shared/services/calc-distancia.service.ts -Pattern "TIMEOUT_RUTA_MS|kmEstimadoSinApi|distanciaKmHaversine|isDistanciaEstimada"
Select-String -Path src/app/componentes/confirmar-delivery/confirmar-delivery.component.ts -Pattern "fallaCalculoDistancia|isCalculandoDistanciaA"
```
Esperado: la primera devuelve las líneas del `TIMEOUT_RUTA_MS`, de las dos llamadas de respaldo y del método `kmEstimadoSinApi`; la segunda devuelve la declaración de `fallaCalculoDistancia`, sus dos enganches como callback de error y los apagados del spinner (éxito, fuera de cobertura y fallo). **Si alguna sale vacía, detenerse**: alguien deshizo el Sprint 1 y hay que restaurarlo antes de seguir, no reescribirlo desde este plan.

- [ ] **Step 2: Escribir el spec de la regla de costo (falla).** Crear `src/app/shared/utils/calc-distancia.costo.spec.ts`. Es un spec puro: no usa `TestBed`, ni instancia servicios, ni depende de `google`.

```ts
import { calcularCostoEntrega } from './costo-entrega';

// misma regla que UtilitariosService.roundAmount: baja a entero si el decimal es < 0.50, si no sube a .50
const redondear = (monto: number): number => {
  const entero = Math.floor(monto);
  return (monto - entero) < 0.50 ? entero : entero + 0.50;
};

describe('calcularCostoEntrega', () => {
  const parametrosVariable = {
    modo: 'variable' as const,
    km_base: 2,
    km_base_costo: 5,
    km_adicional_costo: 2,
    km_limite: 10,
    costo_fijo: 99
  };

  it('modo fijo: devuelve costo_fijo sin mirar la distancia', () => {
    const parametros = { ...parametrosVariable, modo: 'fijo' as const, costo_fijo: 7.5 };

    const cerca = calcularCostoEntrega(parametros, 0.4, redondear);
    const lejos = calcularCostoEntrega(parametros, 30, redondear);

    expect(cerca.success).toBe(true);
    expect(cerca.costo_servicio).toBe(7.5);
    expect(lejos.success).toBe(true);
    expect(lejos.costo_servicio).toBe(7.5);
    expect(lejos.distancia_en_km).toBe('30.00');
  });

  it('modo fijo acepta el costo como cadena', () => {
    const parametros = { ...parametrosVariable, modo: 'fijo' as const, costo_fijo: '6' };
    const rpt = calcularCostoEntrega(parametros, 3, redondear);
    expect(rpt.success).toBe(true);
    expect(rpt.costo_servicio).toBe(6);
  });

  it('modo variable dentro del radio basico: cobra el costo basico', () => {
    const rpt = calcularCostoEntrega(parametrosVariable, 1.2, redondear);
    expect(rpt.success).toBe(true);
    expect(rpt.costo_servicio).toBe(5);
    expect(rpt.distancia_en_km).toBe('1.20');
  });

  it('modo variable pasado el radio basico: suma el costo por km adicional y redondea', () => {
    // 5 + (4.5 - 2) * 2 = 10
    const rpt = calcularCostoEntrega(parametrosVariable, 4.5, redondear);
    expect(rpt.success).toBe(true);
    expect(rpt.costo_servicio).toBe(10);
  });

  it('modo variable con parametros en cadena: mismo resultado', () => {
    const enCadena = { modo: 'variable' as const, km_base: '2', km_base_costo: '5', km_adicional_costo: '2', km_limite: '10', costo_fijo: 0 };
    const rpt = calcularCostoEntrega(enCadena, 4.5, redondear);
    expect(rpt.success).toBe(true);
    expect(rpt.costo_servicio).toBe(10);
  });

  it('fuera del radio maximo: success false con mensaje para el usuario', () => {
    const rpt = calcularCostoEntrega(parametrosVariable, 12, redondear);
    expect(rpt.success).toBe(false);
    expect(rpt.mensaje).toBeTruthy();
    expect(rpt.costo_servicio).toBeUndefined();
  });

  it('sin modo declarado se comporta como variable y arrastra el tiempo aproximado', () => {
    const sinModo = { km_base: 2, km_base_costo: 5, km_adicional_costo: 2, km_limite: 10, costo_fijo: 99, tiempo_aprox_entrega: '30 - 45 min' };
    const rpt = calcularCostoEntrega(sinModo, 1, redondear);
    expect(rpt.success).toBe(true);
    expect(rpt.costo_servicio).toBe(5);
    expect(rpt.tiempo_aprox_entrega).toBe('30 - 45 min');
  });
});
```

- [ ] **Step 3: Correr el spec y ver que falla.**

```
npx ng test --include=src/app/shared/utils/calc-distancia.costo.spec.ts --watch=false --browsers=ChromeHeadless
```
Esperado: falla la compilación con `Cannot find module './costo-entrega'` (el archivo aún no existe). Ese es el rojo válido de este paso.

- [ ] **Step 4: Crear la función pura.** Crear `src/app/shared/utils/costo-entrega.ts`:

```ts
// Regla de costo de entrega de la tienda en linea. Funcion pura: sin Angular, sin google,
// para poder probarla sola (ver calc-distancia.costo.spec.ts). El servicio solo la envuelve.
// parametros = sede_costo_delivery.parametros que entrega EstablecimientoService.getParametrosTiendaLinea()

export interface ParametrosCostoDelivery {
  modo?: 'fijo' | 'variable' | 'zonas';
  km_base?: number | string;
  km_base_costo?: number | string;
  km_adicional_costo?: number | string;
  km_limite?: number | string;
  costo_fijo?: number | string;
  tiempo_aprox_entrega?: string;
}

export interface CostoEntrega {
  success: boolean;
  costo_servicio?: number;
  distancia_en_km?: string;
  tiempo_aprox_entrega?: string;
  mensaje?: string;
}

export const MSJ_FUERA_DE_COBERTURA = 'Lo siento, el servicio no está disponible en esta zona. Verifica que la dirección sea la correcta. También puedes adjuntarnos tu ubicación.';

// el backend devuelve los numeros unas veces como number y otras como cadena
const aNumero = (valor: any): number => typeof valor === 'string' ? parseFloat(valor) : valor;

// redondear = UtilitariosService.roundAmount, inyectado para no arrastrar Angular al test
export function calcularCostoEntrega(
  parametros: ParametrosCostoDelivery,
  distanciaEnKm: number,
  redondear: (monto: number) => number
): CostoEntrega {
  const _parametros = parametros || {};
  const distancia = distanciaEnKm.toFixed(2);
  const tiempo = _parametros.tiempo_aprox_entrega
    ? { tiempo_aprox_entrega: _parametros.tiempo_aprox_entrega }
    : {};

  // modo 'fijo': el costo no depende de la distancia, tampoco del radio maximo
  if (_parametros.modo === 'fijo') {
    return {
      ...tiempo,
      distancia_en_km: distancia,
      costo_servicio: redondear(aNumero(_parametros.costo_fijo) || 0),
      success: true
    };
  }

  // ponytail: modo 'zonas' (poligonos/circulos de parametros.zonas) llega en el sprint de "Mi tienda";
  // hasta entonces cae aqui y se cobra por distancia, que es lo que ya hacia antes.
  // sin 'modo' declarado se comporta como 'variable': compatibilidad con las sedes ya configuradas.
  const radioBasico = aNumero(_parametros.km_base);
  const costoBasico = aNumero(_parametros.km_base_costo);
  const costoAdicionalPorKilometro = aNumero(_parametros.km_adicional_costo);
  const radioMaximo = aNumero(_parametros.km_limite);

  if (distanciaEnKm > radioMaximo) {
    return { mensaje: MSJ_FUERA_DE_COBERTURA, success: false };
  }

  const distanciaAdicional = distanciaEnKm - radioBasico;
  const costoSinRedondear = distanciaAdicional > 0
    ? costoBasico + (distanciaAdicional * costoAdicionalPorKilometro)
    : costoBasico;

  return {
    ...tiempo,
    distancia_en_km: distancia,
    costo_servicio: redondear(costoSinRedondear),
    success: true
  };
}
```
(El mensaje de fuera de cobertura pierde los emojis y los asteriscos de Markdown del original: ese texto se pinta en HTML, no en WhatsApp.)

- [ ] **Step 5: Dejar `costoEntregaTiendaEnLinea` como envoltura.** En `src/app/shared/services/calc-distancia.service.ts`, añadir el import junto al de `geo` (línea 18):

```ts
import { calcularCostoEntrega, CostoEntrega, ParametrosCostoDelivery } from '../utils/costo-entrega';
```
Y reemplazar el método completo de las líneas 345-369 por:

```ts
  // 1023 // calcular costo de entrega, recibiendo parametros para calcular la distancia
  // la regla vive en shared/utils/costo-entrega.ts para poder probarla sin Angular ni google
  costoEntregaTiendaEnLinea(parametros: ParametrosCostoDelivery, distanciaEnKm: number, isTiendaLinea = false): CostoEntrega {
    return calcularCostoEntrega(parametros, distanciaEnKm, (monto: number) => this.utilService.roundAmount(monto));
  }
```
No se toca ningún otro método del archivo.

- [ ] **Step 6: Correr el spec y ver que pasa.**

```
npx ng test --include=src/app/shared/utils/calc-distancia.costo.spec.ts --watch=false --browsers=ChromeHeadless
```
Esperado: 7 tests PASAN.

- [ ] **Step 7: Mostrar el tiempo aproximado de entrega si la sede lo declara.** En `src/app/componentes/confirmar-delivery/confirmar-delivery.component.ts`, junto a `isDistanciaEstimada` (línea 101) añadir:

```ts
  tiempoAproxEntrega = ''; // parametros_tienda_linea.tiempo_aprox_entrega, si la sede lo configuro
```
Dentro de la rama de éxito de `calcularCostoEntrega` (justo después de `this.dirEstablecimiento.distancia_km = costoEntrega.distancia_en_km.toString();`, línea 624) añadir:

```ts
              this.tiempoAproxEntrega = costoEntrega.tiempo_aprox_entrega || '';
```
Y en la rama de fuera de cobertura (junto a `this.isDistanciaEstimada = false;`, línea 652) añadir:

```ts
              this.tiempoAproxEntrega = ''; // no hay entrega que anunciar
```
En `confirmar-delivery.component.html`, al final de la línea 48, después del `<span *ngIf="isDistanciaEstimada" ...>(distancia estimada)</span>`, añadir:

```html
<span *ngIf="tiempoAproxEntrega" class="fw-100 fs-10 text-secondary pl-1">· {{ tiempoAproxEntrega }}</span>
```

- [ ] **Step 8: Cerrar los tres suscriptores que aún pueden dejar el indicador encendido.**

En `src/app/componentes/comp-get-datos-cliente/comp-get-datos-cliente.component.ts`, reemplazar el bloque de las líneas 270-281 por:

```ts
    this.calcDistanceService.calculateRouteObserver(this.direccionA, _dirB, false)
    .subscribe(() => {
        this.laPlazaDelivery = _dirB;
        this.isCalculandoDistancia = false;
        this.isFormValid = true;
        this.validFormDos();
    }, () => {
        // sin esto el indicador de "calculando" se queda encendido y el formulario bloqueado
        this.isCalculandoDistancia = false;
        this.isFormValid = false;
        this.validFormDos();
    });
```

En `src/app/componentes/comp-pide-express/comp-pide-express.component.ts`, reemplazar el bloque de las líneas 292-302 por:

```ts
    this.calcDistanceService.calculateRouteObserver(this.direccionA, _dirB, false)
    .subscribe(() => {
        this.laPlazaDelivery = _dirB;
        this.isCalculandoDistancia = false;
        this.setDiasHoraEstablecimineto();
        this.validFormDos();
        this.calcCostoServicio();
    }, () => {
        // sin esto el indicador de "calculando" se queda encendido y el formulario bloqueado
        this.isCalculandoDistancia = false;
        this.validFormDos();
    });
```

En `src/app/componentes/comp-pide-lo-que-quieras/comp-pide-lo-que-quieras.component.ts`, reemplazar el método completo de las líneas 269-293 por:

```ts
  calcularDistanciaEntrega() {
    if ( this.direccionCliente.ciudad.toLocaleLowerCase() !== this.laPlazaDelivery.ciudad.toLocaleLowerCase() ) {
      // el servicio no esta disponible en esta ubicacion
      this.direccionCliente.codigo = null;
      this.msjErrorDir = 'Servicio no disponible en esta dirección.';
      this.isCalculandoDistanciaA = false; // antes se salia dejando el indicador encendido
      this.validFormDos();
      return;
    }

    this.isCalculandoDistanciaA = true;

    this.calcDistanceService.calculateRouteObserver(this.direccionCliente, this.laPlazaDelivery, false)
    .subscribe(() => {
        this.isCalculandoDistanciaA = false;
        this.validFormDos();
        this.calcCostoServicio();
    }, () => {
        // sin esto el indicador de "calculando" se queda encendido y el formulario bloqueado
        this.isCalculandoDistanciaA = false;
        this.validFormDos();
    });
  }
```
(La bandera se enciende **después** de la guarda de ciudad, y desaparece el `this.laPlazaDelivery = this.laPlazaDelivery;` que no hacía nada.)

`src/app/componentes/datos-delivery/datos-delivery.component.ts` se deja como está: sus dos suscripciones no encienden ningún indicador (`isCalculandoDistanciaA` está comentado en `:431` y `:449`), así que no hay spinner que se pueda colgar.

- [ ] **Step 9: Verificar.**

```
npx tsc -p src/tsconfig.app.json --noEmit
npx ng test --include=src/app/shared/utils/calc-distancia.costo.spec.ts --watch=false --browsers=ChromeHeadless
npx ng build --configuration production
```
Comprobar que el respaldo del Sprint 1 sigue intacto (esta comprobación debe devolver las mismas líneas que en el Step 1):
```powershell
Select-String -Path src/app/shared/services/calc-distancia.service.ts -Pattern "TIMEOUT_RUTA_MS|kmEstimadoSinApi|distanciaKmHaversine"
```
Y que ya no queda ninguna bandera de "calculando" sin apagar en una ruta de error:
```powershell
Select-String -Path src/app/componentes/comp-get-datos-cliente/comp-get-datos-cliente.component.ts,src/app/componentes/comp-pide-express/comp-pide-express.component.ts,src/app/componentes/comp-pide-lo-que-quieras/comp-pide-lo-que-quieras.component.ts,src/app/componentes/confirmar-delivery/confirmar-delivery.component.ts -Pattern "isCalculandoDistancia"
```
Esperado: en cada archivo, la declaración, la lectura del formulario/plantilla, el `= true` y **al menos un `= false` dentro de un callback de error** (o, en `confirmar-delivery`, la llamada a `fallaCalculoDistancia`).

- [ ] **Step 10: Commit.** (Solo `git commit`, nunca `git push`. Las dos líneas de atribución van literales; si la sesión declara otras dos, se usan esas, también literales.)

```powershell
git add src/app/shared/utils/costo-entrega.ts src/app/shared/utils/calc-distancia.costo.spec.ts src/app/shared/services/calc-distancia.service.ts src/app/componentes/confirmar-delivery/ src/app/componentes/comp-get-datos-cliente/ src/app/componentes/comp-pide-express/ src/app/componentes/comp-pide-lo-que-quieras/
Set-Content -Path msg-sprint4-t5.txt -Encoding utf8 -Value @"
fix: costo de entrega en modo fijo y ningun formulario se queda calculando

El respaldo por haversine y el timeout de Directions del sprint 1 se conservan
tal cual. Se cierran los tres suscriptores que aun encendian el indicador de
calculando sin ruta de error (comp-get-datos-cliente, comp-pide-express,
comp-pide-lo-que-quieras), incluida la salida por ciudad distinta que se iba
sin apagarlo. Ademas la regla de costo pasa a shared/utils/costo-entrega.ts
como funcion pura con spec propio: respeta parametros.modo = fijo devolviendo
costo_fijo sin mirar la distancia y arrastra tiempo_aprox_entrega.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
"@
git commit -F msg-sprint4-t5.txt
Remove-Item msg-sprint4-t5.txt
```

---

### Task 6: Diálogo de ubicación sin espera artificial (B9) y autocompletado con estado vacío (B10)

Cubre **B9 (MEDIUM)**: `dialog-ubicacion.component.ts` esperaba 4 s antes de pedir la posición (`loadGPS()` con `setTimeout`) y pasaba `this.showPositionError` como callback suelto, con lo que dentro del método `this` no era el componente y `this.hasPermissionPosition = false` reventaba o escribía en el objeto equivocado (la Tarea 3 ya sustituyó el callback por una función flecha; aquí se quita el retardo). Además `arePointsNear(checkPoint, centerPoint, km)` ignora `km` y usa 65 m fijos. Y **B10 (MEDIUM)**: el autocompletado de `dialog-direccion-cliente-delivery` solo busca con más de 4 caracteres y ante `ZERO_RESULTS` hace `return` sin decir nada, así que la lista se queda con las predicciones anteriores o vacía sin explicación.

**Files:**
- Modify: `src/app/componentes/dialog-ubicacion/dialog-ubicacion.component.ts`
- Modify: `src/app/componentes/dialog-direccion-cliente-delivery/dialog-direccion-cliente-delivery.component.ts` y `.html`

**Interfaces:**
- Consumes: `GeolocationService` (Tarea 3), `GoogleMapsLoaderService.isLoaded()` (Tarea 4 Step 1).
- Produces: en `DialogDireccionClienteDeliveryComponent`, campo público `sinResultados = false` y constante `MIN_CARACTERES_BUSQUEDA = 3`.
- Produces: en `DialogUbicacionComponent`, constante `RADIO_UBICACION_KM = 0.065` usada como argumento real de `arePointsNear`.

- [ ] **Step 1: `dialog-ubicacion.component.ts` — quitar el retardo y honrar el argumento `km`.** El archivo completo queda:

```ts
import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  insideCircle
} from 'geolocation-utils';
import { GeolocationService } from 'src/app/shared/services/geolocation.service';

// 65 metros: es el radio con el que se venia validando que el cliente este en el local.
// Se expresa en km porque arePointsNear recibe km.
const RADIO_UBICACION_KM = 0.065;

@Component({
  selector: 'app-dialog-ubicacion',
  templateUrl: './dialog-ubicacion.component.html',
  styleUrls: ['./dialog-ubicacion.component.css']
})
export class DialogUbicacionComponent implements OnInit {

  cLocal: any; // coordenadas del establecimientos
  cDispositivo: any; // coordenadas del dispositivo
  hasPermissionPosition = true;

  constructor(
    private dialogRef: MatDialogRef<DialogUbicacionComponent>,
    private geolocationService: GeolocationService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.cLocal = data.cLocal;

   }

  ngOnInit() {
    // ponytail: sin espera artificial; obtenerPosicion ya trae su propio timeout de 10 s
    this.getPosition();
  }

  private getPosition() {
    this.geolocationService.obtenerPosicion()
      .then(pos => {
        this.cDispositivo = { lat: pos.latitude, lng: pos.longitude };
        this.hasPermissionPosition = true;
        this.data.posIssValid = this.data.isDemo
          ? true
          : this.arePointsNear(this.cLocal, this.cDispositivo, RADIO_UBICACION_KM);
        this.cerrarDlg();
      })
      .catch(() => {
        // ponytail: el aviso al usuario y la alternativa manual las da quien abre el dialogo
        // (lector-codigo-qr) al recibir posIssValid = false.
        this.hasPermissionPosition = false;
        this.data.posIssValid = false;
        this.cerrarDlg();
      });
  }

  private arePointsNear(checkPoint: any, centerPoint: any, km: number): boolean {
    const center = { lat: centerPoint.lat, lon: centerPoint.lng };
    const radius = km * 1000; // insideCircle trabaja en metros

    return insideCircle({ lat: checkPoint.lat, lon: checkPoint.lng }, center, radius);
  }

  cerrarDlg(): void {
    this.dialogRef.close(this.data.posIssValid);
  }

}
```
Nota: `RADIO_UBICACION_KM = 0.065` mantiene EXACTAMENTE el radio de 65 m que había cableado, pero ahora entra por el argumento; el llamador que quiera otro radio solo cambia el valor.

- [ ] **Step 2: `dialog-direccion-cliente-delivery.component.ts` — buscar desde 3 caracteres.** Sobre el `@Component` agregar:

```ts
const MIN_CARACTERES_BUSQUEDA = 3;
```
Agregar el campo público `sinResultados = false;` junto a `showBusqueda`. Reemplazar la suscripción del constructor por:

```ts
    this.direccionBuscarUpdate.pipe(
      debounceTime(400),
      distinctUntilChanged())
      .subscribe((value: any) => {
        const texto = (value === null || value === undefined ? '' : value.toString()).trim();

        if (texto.length < MIN_CARACTERES_BUSQUEDA) {
          this.listPredicciones = [];
          this.sinResultados = false;
          return;
        }

        this.showBusqueda = true;
        this.getPlacesPredictionsChange(texto);
      });
```

- [ ] **Step 3: `dialog-direccion-cliente-delivery.component.ts` — estado vacío del autocompletado.** Agregar `NgZone` al import de `@angular/core` y `private ngZone: NgZone` al constructor (la respuesta de `getPlacePredictions` llega fuera de la zona de Angular). Reemplazar `getPlacesPredictionsChange` por:

```ts
  getPlacesPredictionsChange(value: string) {

    if (!this.mapsLoader.isLoaded()) {
      this.listPredicciones = [];
      this.sinResultados = true;
      return;
    }

    const sessionToken = new google.maps.places.AutocompleteSessionToken();
    // si es comercio adjunta la ciudad
    const _input = this.isFromComercio ? `${value}, ${this.ciudadComercio}` : value;

    const options = {
      input: _input,
      componentRestrictions: { country: 'pe' },
      sessionToken: sessionToken
    };

    const service = new google.maps.places.AutocompleteService();
    service.getPlacePredictions(options, (
      predictions: google.maps.places.QueryAutocompletePrediction[] | null,
      status: google.maps.places.PlacesServiceStatus
    ) => {
      this.ngZone.run(() => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions || predictions.length === 0) {
          // ZERO_RESULTS y cualquier otro estado: la lista queda vacia y se avisa
          this.listPredicciones = [];
          this.sinResultados = true;
          return;
        }

        this.listPredicciones = predictions;
        this.sinResultados = false;
      });
    });
  }
```
La restricción a Perú (`componentRestrictions: { country: 'pe' }`) se conserva tal cual.

- [ ] **Step 4: `dialog-direccion-cliente-delivery.component.ts` — limpiar el estado al elegir o al volver.** En `goDireccion(prediccionSelected, showMapComercio = false)`, primera línea del método: `this.sinResultados = false;`. En el botón de volver de la plantilla ya se hace `showBusqueda = false; direccionBuscar = ''`; añadir ahí `sinResultados = false` (Step 5).

- [ ] **Step 5: `dialog-direccion-cliente-delivery.component.html` — mostrar "Sin resultados".** El botón de volver de la búsqueda queda:

```html
            <div *ngIf="showBusqueda" class="animated fadeInLeft">
                <i class="fa fa-arrow-left pr-2" (click)="showBusqueda = false; direccionBuscar = ''; sinResultados = false; listPredicciones = []"></i>
            </div>
```
Y dentro del bloque `<!-- lista de predicciones -->`, justo después del `*ngFor` de predicciones y antes de cerrar ese `<div *ngIf="showBusqueda">`, agregar:

```html
            <p *ngIf="sinResultados" class="text-secondary fs-13 p-2 m-0">
                Sin resultados para "{{ direccionBuscar }}". Prueba con el nombre de la calle y el número, o usa <strong>Ubicación actual</strong>.
            </p>
```

- [ ] **Step 6: Verificar.**

```
npx tsc -p src/tsconfig.app.json --noEmit
npx ng build --configuration production
```
```powershell
Select-String -Path src/app/componentes/dialog-ubicacion/dialog-ubicacion.component.ts -Pattern "setTimeout|showPositionError"
```
Esperado: sin resultados; build exit 0.

- [ ] **Step 7: Commit.**

```powershell
git add src/app/componentes/dialog-ubicacion/ src/app/componentes/dialog-direccion-cliente-delivery/
Set-Content -Path msg-sprint4-t6.txt -Encoding utf8 -Value @"
fix: verificacion de ubicacion sin espera artificial y buscador de direcciones con estado vacio

dialog-ubicacion deja de esperar 4 s antes de pedir el GPS y arePointsNear usa
el radio que recibe por argumento. El autocompletado busca desde 3 caracteres,
mantiene la restriccion a Peru y avisa Sin resultados en vez de dejar la lista
muda cuando Google devuelve ZERO_RESULTS.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
"@
git commit -F msg-sprint4-t6.txt
Remove-Item msg-sprint4-t6.txt
```

---

### Task 7: Verificación del sprint completo

**Files:**
- Sin archivos nuevos. Si alguna comprobación falla, se corrige el archivo señalado y se hace un único commit de arreglo.

**Interfaces:**
- Consumes: todo lo producido en las Tareas 1 a 6.

- [ ] **Step 1: Build de release.**

```
npx ng build --configuration production
```
Esperado: exit 0, sin advertencias nuevas de plantilla.

- [ ] **Step 2: Todos los specs del sprint en un solo comando.**

```
npx ng test --include=src/app/shared/utils/img-url.spec.ts --include=src/app/shared/pipes/img-url.pipe.spec.ts --include=src/app/shared/directivas/img-fallback.directive.spec.ts --include=src/app/shared/services/geolocation.service.spec.ts --include=src/app/shared/utils/calc-distancia.costo.spec.ts --watch=false --browsers=ChromeHeadless
```
Esperado: 24 specs PASAN (4 helper + 3 pipe + 4 directiva + 6 geolocalización + 7 costo de entrega).

- [ ] **Step 3: Comprobaciones de limpieza (PowerShell).** Cada una debe devolver vacío:

```powershell
Select-String -Path (Get-ChildItem src -Recurse -Include *.ts,*.html,*.css).FullName -Pattern "agm-map|agm-marker|@agm/core"
Select-String -Path (Get-ChildItem src -Recurse -Include *.ts,*.html).FullName -Pattern "imagenNoEncontrada|ImagenNoEncontrada"
Select-String -Path (Get-ChildItem src -Recurse -Include *.ts,*.html).FullName -Pattern "imgdemo"
Select-String -Path (Get-ChildItem src/app/componentes,src/app/pages -Recurse -Filter *.ts).FullName -Pattern "navigator.geolocation.getCurrentPosition"
```
Y esta debe devolver `False`:
```powershell
Test-Path src/app/shared/pipes/imagen-no-encontrada.pipe.ts
```

- [ ] **Step 4: Comprobación de cobertura de la directiva.** Listar las plantillas que usan el pipe y confirmar a mano que todas llevan `appImgFallback`:

```powershell
Select-String -Path (Get-ChildItem src/app -Recurse -Filter *.html).FullName -Pattern "imgUrl:" -SimpleMatch
```
Esperado: **siete líneas** (las que dejan la Tarea 1 Steps 11-17 y la Tarea 2 Step 8: `carta.component.html` ×2, `dialog-item-edit`, `comp-pedido-detalle`, `item-comercio`, `establecimientos`, `comp-view-promo`), todas con `appImgFallback` en la misma etiqueta. Las demás imágenes con `appImgFallback` de la Tarea 2 no pasan por el pipe (`forma-pago` resuelve la URL en TypeScript y las de `assets` usan `appImgFallback="ocultar"` sin `imgUrl:`), por eso no salen en este listado.

- [ ] **Step 5: Prueba manual mínima (una pasada por la app en `npx ng serve`).** Anotar el resultado de cada punto:
  1. Carta de un comercio: los ítems sin foto muestran `img-null.png`, no un icono roto.
  2. Lista de establecimientos: los logos cargan y las URLs no tienen `//` doble (revisar en la pestaña Red del navegador).
  3. "Agrega o escoge una dirección" → escribir 3 letras: aparecen predicciones; escribir algo sin resultados: aparece "Sin resultados para …".
  4. "Ubicación actual" con el permiso denegado en el navegador: aparece el aviso con la alternativa manual y la app no se queda colgada.
  5. Elegir una predicción: se ve el mapa de Google con el marcador central y, tras mover el mapa, aparece el botón "Confirmar".
  6. Checkout con una dirección fuera del radio de cobertura: sale el mensaje y el spinner del costo de entrega **se apaga**.

- [ ] **Step 6: Commit solo si hubo arreglos.** Si los pasos 1 a 5 no obligaron a cambiar nada, no hay commit en esta tarea. Si sí:

```powershell
git add <solo los archivos corregidos>
Set-Content -Path msg-sprint4-t7.txt -Encoding utf8 -Value @"
fix: correcciones de verificacion del sprint 4

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
"@
git commit -F msg-sprint4-t7.txt
Remove-Item msg-sprint4-t7.txt
```

---

## Self-Review

**1. Cobertura del spec.**

| Hallazgo | Dónde se resuelve |
|---|---|
| A2/A3 (HIGH) ~90 `<img>` sin manejo de error; pipe `imagenNoEncontrada` roto y desactivado | Tarea 2 Steps 1-9 (directiva + spec + aplicación a 9 imágenes remotas y 11 de `assets` con nombre de BD) y Step 6 (borrado del pipe y de sus referencias en `app.module.ts`) |
| A2/A3 `loading="lazy"` en imágenes de lista | Tarea 2 Steps 7-9 (carta ×4, establecimientos ×3, promos ×1, item-comercio ×1) |
| A2/A3 elección de módulo | Global Constraints: `SharedModule`, con el motivo escrito; el cableado se hace en Tarea 1 Steps 9-10 |
| A4 (HIGH) seis `<img src="{{imgdemo}}">` de relleno | Tarea 2 Step 7 (se borra el bloque comentado entero y se conserva la forma `item.img | imgUrl:'promo'`) |
| A5 (MEDIUM) `img_mini` con doble `/` y mutación del modelo | Tarea 1 Steps 1-4 (helper + spec, incluido el caso idempotente) y Step 15 (se borra la mutación y el campo `imgComercio`) |
| A5 pipe `imgUrl` y las 7 concatenaciones | Tarea 1 Steps 5-8 (pipe + spec) y Steps 11-17 (carta, dialog-item-edit, comp-pedido-detalle, item-comercio, establecimientos, comp-view-promo, forma-pago) |
| B1 (CRITICAL) `<agm-map>` en dialog-direccion-cliente-delivery | Tarea 4 Steps 2-6 (`<google-map>`, `(centerChanged)`/`(mapClick)`/`(idle)`, centro vía `@ViewChild(GoogleMap)`, `centerMarker` conservado, texto de respaldo si `load()` rechaza) |
| B1 bindings de `agregar-direccion` contra la API real | Tarea 4 Steps 7-8 y 10 (`mapDragend`, `centerChanged()` sin payload, `@ViewChild('map') map: GoogleMap`, autocompletado protegido) |
| B3/B4 | No se rehacen: Sprint 1 Tarea 5. Se consumen en Tarea 4 Step 1 (con verificación defensiva de `isLoaded()`) |
| B5/B6 (HIGH) geolocalización sin timeout ni error | Tarea 3 Steps 1-4 (servicio + spec con `navigator.geolocation` falso, incluida la prueba de "nunca queda colgada") y Steps 5-10 (los 4 puntos de llamada + mensaje y alternativa manual) |
| B7 (HIGH) `guardarDireccion()` desreferencia `mapCenter.lng` | Tarea 4 Step 9 (guarda `if (!this.mapCenter || !this.mapCenter.lat) { return; }`) y Tarea 3 Step 6 (`usarCentroDeRespaldo()` inicializa con las coordenadas del comercio) |
| B8 (HIGH) spinner eterno del costo de entrega | **Ya resuelto en el Sprint 1** (`e8dce76`, `eac4269`) para el servicio y el checkout: `TIMEOUT_RUTA_MS` + respaldo `kmEstimadoSinApi` en `calc-distancia.service.ts:241-287` y `:296-322`, y `fallaCalculoDistancia` + apagados explícitos en `confirmar-delivery.component.ts:638`, `:651`, `:688`, `:701-707`. La Tarea 5 solo verifica eso (Step 1) y cierra lo que faltaba: Step 8 (callback de error en `comp-get-datos-cliente:270`, `comp-pide-express:292` y `comp-pide-lo-que-quieras:269-293`, incluida la salida por "ciudad distinta" que se iba sin apagar la bandera) |
| B9 (MEDIUM) `this` perdido, retardo de 4 s, `arePointsNear` ignora `km` | Tarea 3 Step 10 (flecha, sin callback suelto) y Tarea 6 Step 1 (sin `setTimeout`, `RADIO_UBICACION_KM` pasado como argumento) |
| B10 (MEDIUM) autocompletado sin estado vacío, mínimo 5 caracteres | Tarea 6 Steps 2-5 (mínimo 3, `sinResultados`, mensaje en plantilla, restricción a Perú intacta) |
| B11-lite `modo === 'fijo'` | Tarea 5 Steps 2-6 (spec puro `calc-distancia.costo.spec.ts` con fijo/variable/sin modo/fuera de radio, función pura `shared/utils/costo-entrega.ts` y `costoEntregaTiendaEnLinea` reducido a una envoltura) y Step 7 (`tiempo_aprox_entrega` en el checkout); zonas queda con `// ponytail:` |
| Verificación final | Tarea 7 (build de release, los 5 specs en un comando, comprobaciones de limpieza, pasada manual) |

**2. Barrido de marcadores de relleno.** Sin `TBD`, sin "añadir validación", sin "similar a la Tarea N": los bloques repetidos (por ejemplo `searchTypeMap` blindado, que aparece en dos componentes distintos) están escritos completos en cada sitio. El único condicional que queda ("si `isLoaded()` no existe", Tarea 4 Step 1) trae el código exacto a aplicar y el criterio para decidir, porque depende de si los Sprints 1 y 2 se ejecutaron. La Tarea 5 ya no condiciona nada: se cotejó contra el árbol real, cita `archivo:línea` de lo que el Sprint 1 dejó hecho y su Step 1 es una comprobación de que sigue ahí (si sale vacía, se detiene en vez de reescribirlo).

**3. Consistencia de tipos y nombres entre tareas.**
- `urlImagen(base, nombre)` (T1) se usa igual en `ImgUrlPipe` (T1 Step 7) y en `forma-pago` (T1 Step 17).
- `ImgUrlPipe` se llama siempre `imgUrl` en plantillas y con los cuatro tipos declarados: `'carta'`, `'promo'`, `'comercio'`, `'iconos'` (T1 y T2 usan exactamente esos).
- `ImgFallbackDirective` / `appImgFallback` / `IMG_FALLBACK` (T2) coinciden entre directiva, spec, plantillas y la comprobación de T7 Step 4.
- `GeolocationService.obtenerPosicion()` devuelve `{ latitude, longitude }` en las cuatro llamadas (T3 Steps 5, 6, 8, 10); solo `MapsServiceService.getPosition()` traduce a `{ lat, lng }`, que es la forma que sus llamadores ya esperaban.
- `setCentro(lat, lng)` se crea en T3 Step 8 y se reutiliza en T4 Step 3; `centerChanged()` (sin payload, sin `$event`) es el nombre único en los dos componentes de mapa (T4 Steps 3 y 7) y así aparece en las dos plantillas (T4 Steps 5 y 8).
- `msjGeolocalizacion` se declara en T3 (Steps 6 y 8) y lo reutiliza T4 (Steps 4 y 10) y T6 no lo toca.
- `mapsListo` existe solo en `DialogDireccionClienteDeliveryComponent` (T4) y es el mismo nombre en `.ts` y `.html`.
- `CostoEntrega` y `ParametrosCostoDelivery` viven en `shared/utils/costo-entrega.ts` (T5 Step 4), los importa `calc-distancia.service.ts` (T5 Step 5) y los consume `confirmar-delivery` sin cambios de acceso (`.success`, `.mensaje`, `.costo_servicio`, `.distancia_en_km`, `.tiempo_aprox_entrega` son todos opcionales en la interfaz, por eso compila). El spec `calc-distancia.costo.spec.ts` (T5 Step 2) importa la función pura, no el servicio: no necesita `TestBed` ni `google`.
- `distanciaKmHaversine` / `TIMEOUT_RUTA_MS` / `kmEstimadoSinApi` / `isDistanciaEstimada` son nombres del Sprint 1 que este plan solo lee: ninguna tarea los redefine ni los reemplaza.
- `sinResultados` y `MIN_CARACTERES_BUSQUEDA` viven solo en T6 y su plantilla.
- `RADIO_UBICACION_KM = 0.065` (T6) se pasa a `arePointsNear(_, _, km)` que multiplica por 1000: el radio efectivo sigue siendo 65 m, igual que antes del cambio.
