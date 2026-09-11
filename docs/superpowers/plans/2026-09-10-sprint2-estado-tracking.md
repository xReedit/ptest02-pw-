# Sprint 2: estado del pedido y tracking del repartidor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el cliente delivery vea en "Mis pedidos" el estado real de su pedido (recibido, aceptado, en preparación, repartidor asignado, en camino, entregado, cancelado) con una línea de tiempo, que el estado se actualice aunque cambie el socket o vuelva del background, y que el mapa muestre la posición del repartidor.

**Architecture:** El backend ya escribe dos columnas en `pedido`: `pwa_estado` (etapa del local: P, A, D, R, E, C) y `pwa_delivery_status` (etapa del repartidor: 0, 1, 3, 4, 5). Se unifican en el cliente con una función pura `resumirEstadoPedido()`. El backend emite un evento único `pedido-cambio-estado` a la sala `cliente_<idcliente>` (creada en Sprint 1) cada vez que cualquiera de las dos columnas cambia, y expone `delivery/get-estado-pedido` como consulta de respaldo. El mapa pasa de `@agm/core` (retirado) a `@angular/google-maps` 14, cargado por el `GoogleMapsLoaderService` no bloqueante del Sprint 1.

**Tech Stack:** Angular 14.2, @angular/google-maps 14.2, RxJS 6.5, Capacitor 4 (`@capacitor/app`), socket.io 2, Node + mysql2, Karma/Jasmine, Jest.

**Spec:** Informe de auditoría (artifact 5c78f362) secciones 4 y 12. Dossier de código: el planificador leyó `mis-ordenes`, `mi-orden-detalle`, `mapa-solo`, `sockets.js`, `apiRepartidor.js`, `apiComercio.js`, `apiPrintServer.js`, `procedure_pwa_delivery_mis_pedidos` y `procedure_delivery_set_estado_set_estado_pedido`.

## Global Constraints

- NUNCA hacer `git push`. Solo commits locales; el usuario sube cuando decide.
- Trabajar directo en `master` de cada repo (desarrollador solo, consentimiento dado). No crear ramas.
- Commits en español `<tipo>: <descripción>`; mensaje en archivo UTF-8 y `git commit -F <archivo>`; terminar con las dos líneas de atribución copiadas LITERALMENTE:
  ```
  Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
  ```
- Backend `D:\Projects\backend-pedidos`: `git add` solo archivos propios; nunca `git add -A`. No tocar `app.js`, `controllers/serviceSendCPE.js`, `firebase_config.js`, `INTEGRACION-YAPE.md`, `controllers/yapeIntegracion.js`, `routes/routesYape.js` (trabajo ajeno sin commit).
- App `D:\Projects\capacitor\pwa-app-pedido`: build de release `npx ng build --configuration production` (exit 0 obligatorio al final de cada tarea de app); type-check rápido `npx tsc -p src/tsconfig.app.json --noEmit`; specs `npx ng test --include=<spec> --watch=false --browsers=ChromeHeadless`.
- Backend: `npx jest <archivo>`.
- Shell PowerShell 5.1: sin `&&`, `cat`, `head`, `sed`; usar `;`, `Get-Content`, `Select-String`; el hook bloquea `\d` (usar `[0-9]`).
- Sin `console.log` nuevos. Marcar simplificaciones con `// ponytail: ...`.
- Valores de estado (fuente de verdad, no inventar otros):
  - `pwa_estado`: `P` recibido/pendiente, `A` aceptado (visto o impreso por el local), `D` despachado/listo, `R` con repartidor, `E` entregado, `C` cancelado.
  - `pwa_delivery_status`: `0` sin repartidor, `1` repartidor asignado, `3` en camino, `4` entregado, `5` cancelado por repartidor.
- Etiquetas para el cliente (usar exactamente): `Recibido`, `Aceptado`, `En preparación`, `Repartidor asignado`, `En camino`, `Entregado`, `Cancelado`.

---

### Task 1: Backend: evento único de cambio de estado y consulta de respaldo

**Files (backend):**
- Create: `service/estado-pedido.service.js`
- Modify: `controllers/sockets.js` (después de `io.on('connection', ...)` registrar el io en el servicio; en los tres handlers que cambian estado)
- Modify: `controllers/apiRepartidor.js` (`setUpdateEstadoPedido`, `setPedidoCanceladoRepartidor`)
- Modify: `controllers/apiRepartidorV2.js` (`setPedidoCanceladoRepartidor`)
- Modify: `controllers/apiComercio.js` (`setEstadoPedido`)
- Modify: `controllers/apiPrintServer.js` (las dos funciones que ponen `pwa_estado='A'`)
- Modify: `controllers/apiDelivery.js` (nuevo `getEstadoPedido`)
- Modify: `routes/v3.js` (ruta `delivery/get-estado-pedido`)
- Create: `sql/2026-09-10_mis_pedidos_estado_completo.sql`
- Test: `test/estado-pedido.service.test.js`

**Interfaces:**
- Produces: `estadoPedidoService.setIo(io)`, `estadoPedidoService.notificar(idpedido)` (async, nunca lanza; consulta `idcliente, pwa_estado, pwa_delivery_status, idrepartidor` y emite `pedido-cambio-estado` con `{ idpedido, pwa_estado, pwa_delivery_status, idrepartidor, nom_repartidor, telefono_repartidor, position_now }` a la sala `cliente_<idcliente>`).
- Produces: `POST /v3/delivery/get-estado-pedido` body `{ idpedido, idcliente }` → `{ success, data: [ { idpedido, pwa_estado, pwa_delivery_status, idrepartidor, nom_repartidor, ap_repartidor, telefono_repartidor, position_now, fecha_hora, pwa_delivery_servicio_propio } ] }`. Valida que el pedido pertenezca al idcliente.
- Produces: `procedure_pwa_delivery_mis_pedidos` devuelve además `p.pwa_estado, p.fecha_hora, p.flag_pedido_programado, r.position_now`.

- [ ] **Step 1: Spec del servicio (falla).** `test/estado-pedido.service.test.js`:
```js
jest.mock('../service/query.service.v1', () => ({ ejecutarConsulta: jest.fn() }));
const QueryServiceV1 = require('../service/query.service.v1');
const svc = require('../service/estado-pedido.service');

function ioMock() {
  const emitted = [];
  return { emitted, to: (room) => ({ emit: (evt, payload) => emitted.push({ room, evt, payload }) }) };
}

describe('estado-pedido.service.notificar', () => {
  beforeEach(() => QueryServiceV1.ejecutarConsulta.mockReset());

  it('emite pedido-cambio-estado a la sala del cliente', async () => {
    QueryServiceV1.ejecutarConsulta.mockResolvedValue([{ idpedido: 10, idcliente: 7, pwa_estado: 'A', pwa_delivery_status: '1', idrepartidor: 3, nom_repartidor: 'Luis', telefono_repartidor: '999', position_now: '{"lat":-12,"lng":-77}' }]);
    const io = ioMock(); svc.setIo(io);
    await svc.notificar(10);
    expect(io.emitted).toEqual([{ room: 'cliente_7', evt: 'pedido-cambio-estado', payload: expect.objectContaining({ idpedido: 10, pwa_estado: 'A', pwa_delivery_status: '1', position_now: { lat: -12, lng: -77 } }) }]);
  });

  it('no emite si el pedido no tiene cliente y nunca lanza', async () => {
    QueryServiceV1.ejecutarConsulta.mockResolvedValue([{ idpedido: 10, idcliente: 0 }]);
    const io = ioMock(); svc.setIo(io);
    await expect(svc.notificar(10)).resolves.toBeUndefined();
    expect(io.emitted.length).toBe(0);
    QueryServiceV1.ejecutarConsulta.mockRejectedValue(new Error('db'));
    await expect(svc.notificar(10)).resolves.toBeUndefined();
  });
});
```
Ejecutar `npx jest test/estado-pedido.service.test.js`. Esperado: falla (módulo no existe).

- [ ] **Step 2: Crear `service/estado-pedido.service.js`:**
```js
// Un solo evento para el cliente cada vez que cambia pwa_estado o pwa_delivery_status.
const QueryServiceV1 = require('./query.service.v1');
const logger = require('../utilitarios/logger');

let io = null;
function setIo(_io) { io = _io; }

function parseJson(v) { if (!v) { return null; } if (typeof v === 'object') { return v; } try { return JSON.parse(v); } catch (e) { return null; } }

async function leerEstado(idpedido) {
	const sql = `SELECT p.idpedido, p.idcliente, p.pwa_estado, p.pwa_delivery_status, p.idrepartidor, p.fecha_hora,
			r.nombre AS nom_repartidor, r.apellido AS ap_repartidor, r.telefono AS telefono_repartidor, r.position_now,
			s.pwa_delivery_servicio_propio
		FROM pedido p LEFT JOIN repartidor r ON r.idrepartidor = p.idrepartidor INNER JOIN sede s ON s.idsede = p.idsede
		WHERE p.idpedido = ?`;
	const rows = await QueryServiceV1.ejecutarConsulta(sql, [idpedido], 'SELECT', 'estadoPedido.leer');
	const row = rows?.[0];
	if (!row) { return null; }
	return { ...row, position_now: parseJson(row.position_now) };
}

async function notificar(idpedido) {
	try {
		const est = await leerEstado(Number(idpedido));
		if (!est || !io || !(Number(est.idcliente) > 0)) { return; }
		const { idcliente, ...payload } = est;
		io.to(`cliente_${Number(idcliente)}`).emit('pedido-cambio-estado', payload);
		// ponytail: aquí engancha el push por cambio de estado (sprint 3)
	} catch (error) {
		logger.error({ error: error.message, idpedido }, 'estadoPedido.notificar');
	}
}

module.exports = { setIo, notificar, leerEstado };
```
Ejecutar el spec. Esperado: 2 tests pasan.

- [ ] **Step 3: Enganchar el servicio.** En `controllers/sockets.js`, al inicio del archivo `const estadoPedidoService = require('../service/estado-pedido.service');` y dentro de la función que recibe `io` (antes de `io.on('connection'`) `estadoPedidoService.setIo(io);`. En el handler `repartidor-notifica-estado-pedido`, después de `apiPwaRepartidor.setUpdateEstadoPedido(...)`: `await estadoPedidoService.notificar(dataCliente.idpedido);` (hacer `await` también del update: cambiar a `await apiPwaRepartidor.setUpdateEstadoPedido(...)`). En `repartidor-propio-notifica-fin-pedido`, `repartidor-notifica-fin-one-pedido` y `repartidor-notifica-fin-pedido` (los tres llaman `setUpdateEstadoPedido(idpedido, 4)`): `await` el update y luego `estadoPedidoService.notificar(dataPedido.idpedido);`.

En `controllers/apiRepartidor.js`: `setPedidoCanceladoRepartidor` después del UPDATE a estado 5: `require('../service/estado-pedido.service').notificar(idpedido);`. En `controllers/apiRepartidorV2.js` `setPedidoCanceladoRepartidor`: lo mismo tras el UPDATE.

En `controllers/apiComercio.js` `setEstadoPedido`: reemplazar el cuerpo por
```js
const setEstadoPedido = async function (req, res) {
	const estado = String(req.body.estado || '').toUpperCase().slice(0, 1);
	const idpedido = parseInt(req.body.idpedido, 10);
	if (!['P', 'A', 'D', 'R', 'E', 'C'].includes(estado) || !Number.isFinite(idpedido)) { return ReE(res, 'estado o idpedido inválido', 400); }
	const query = `call procedure_delivery_set_estado_set_estado_pedido(?, ?);`;
	const rows = await QueryServiceV1.ejecutarProcedimiento(query, [idpedido, estado], 'setEstadoPedido');
	require('../service/estado-pedido.service').notificar(idpedido);
	return ReS(res, { data: rows || [] });
}
```
(verificar que `ReE`, `ReS` y `QueryServiceV1` estén importados en ese archivo; si no, agregar los require igual que en `apiDelivery.js`.)

En `controllers/apiPrintServer.js`: en la función de un ítem (línea ~130) y en `setStatusListItem` (~151), después de `emitirRespuesta(sql)` / `emitirRespuesta(_sql)`, notificar cada idpedido: `String(item.idp || '').split(',').map(s => parseInt(s, 10)).filter(Number.isFinite).forEach(id => estadoPedidoService.notificar(id));` (y para la lista, sobre `idsPedidos`). Agregar el require al inicio del archivo.

- [ ] **Step 3b: Pendientes heredados del Sprint 1 (Tarea 8).** (a) En `controllers/sockets.js`, dentro de `io.on('connection', ...)` junto al `socket.join('cliente_...')` existente, agregar un handler para que la app se una a su sala cuando el servidor le asigna otro idcliente al guardar el pedido:
```js
		socket.on('join-cliente', (idcliente) => {
			const id = Number(idcliente);
			if (id > 0) { socket.join(`cliente_${id}`); }
		});
```
y en los dos handlers del repartidor cambiar `io.to(\`cliente_${Number(dataCliente.idcliente)}\`)` por una guarda: `const idc = Number(dataCliente.idcliente); if (idc > 0) { io.to(\`cliente_${idc}\`).emit(...); }` (igual con `datosUbicacion.idcliente`), para no emitir a `cliente_NaN`. (b) En `controllers/apiDelivery.js` `getMisPedido`, distinguir error de base de lista vacía: `if (rows === null) { return ReE(res, 'No se pudo consultar los pedidos', 500); }` antes del `ReS`. (c) En la app, `src/app/shared/services/socket.service.ts`: método público `joinCliente(idcliente: number) { if (this.socket && Number(idcliente) > 0) { this.socket.emit('join-cliente', Number(idcliente)); } }`, y en `resumen-pedido.component.ts`, dentro del bloque `if (Number(_res.idcliente) > 0) { ... }` de `savePedidoSocket2`, agregar `this.socketService.joinCliente(Number(_res.idcliente));`. (Los cambios de la app de este paso se hacen en la Tarea 3 de este sprint, no aquí.)

- [ ] **Step 4: Consulta de respaldo.** En `controllers/apiDelivery.js`:
```js
const getEstadoPedido = async function (req, res) {
	const idpedido = parseInt(req.body.idpedido, 10);
	const idcliente = parseInt(req.body.idcliente, 10);
	if (!Number.isFinite(idpedido) || !Number.isFinite(idcliente) || idcliente <= 0) { return ReE(res, 'datos inválidos', 400); }
	const est = await require('../service/estado-pedido.service').leerEstado(idpedido);
	if (!est || Number(est.idcliente) !== idcliente) { return ReE(res, 'pedido no encontrado', 404); }
	return ReS(res, { data: [est] });
}
module.exports.getEstadoPedido = getEstadoPedido;
```
Ruta en `routes/v3.js`: `routerV3.post('/delivery/get-estado-pedido', apiPwaAppDelivery.getEstadoPedido);`.

- [ ] **Step 5: SP de mis pedidos.** Generar con `node scripts/dump-procedure.js procedure_pwa_delivery_mis_pedidos > sql/2026-09-10_mis_pedidos_estado_completo.sql` y editar el `select` para agregar, después de `p.pwa_delivery_status`: `, p.pwa_estado, p.fecha_hora, p.flag_pedido_programado` y después de `r.telefono as telefono_repartidor`: `, r.position_now`. Aplicar en desarrollo con `node scripts/apply-sql.js sql/2026-09-10_mis_pedidos_estado_completo.sql` (misma regla del Sprint 1: solo si la base es de desarrollo).

- [ ] **Step 6: Prueba de la ruta.** Agregar a `test/apiDelivery.getMisPedido.test.js` (creado en Sprint 1) un `describe('getEstadoPedido')` con dos casos: (a) idcliente distinto al del pedido → 404 (mockear `leerEstado` con `jest.mock('../service/estado-pedido.service', () => ({ leerEstado: jest.fn() }))`); (b) coincide → `success:true` y `data[0].pwa_estado`. Ejecutar `npx jest test/apiDelivery.getMisPedido.test.js test/estado-pedido.service.test.js`. Esperado: todo verde.

- [ ] **Step 7: Commit (solo archivos propios)**
```
git add service/estado-pedido.service.js controllers/sockets.js controllers/apiRepartidor.js controllers/apiRepartidorV2.js controllers/apiComercio.js controllers/apiPrintServer.js controllers/apiDelivery.js routes/v3.js sql/2026-09-10_mis_pedidos_estado_completo.sql test/estado-pedido.service.test.js test/apiDelivery.getMisPedido.test.js
git commit -F <archivo con: "feat: evento pedido-cambio-estado al cliente y consulta de estado de respaldo">
```

---

### Task 2: App: estado unificado (función pura) y servicio de estado del pedido

**Files (app):**
- Create: `src/app/shared/utils/estado-pedido.ts`
- Test: `src/app/shared/utils/estado-pedido.spec.ts`
- Create: `src/app/shared/services/seguimiento-pedido.service.ts`
- Modify: `src/app/shared/services/socket.service.ts` (nuevo `onPedidoCambioEstado()` = `this.fromEvent('pedido-cambio-estado')`)

**Interfaces:**
- Produces: 
```ts
export type EstadoCodigo = 'recibido' | 'aceptado' | 'preparando' | 'asignado' | 'camino' | 'entregado' | 'cancelado';
export interface EstadoResumen { codigo: EstadoCodigo; etiqueta: string; paso: number; activo: boolean; }
export function resumirEstadoPedido(p: { pwa_estado?: string; pwa_delivery_status?: string | number }): EstadoResumen;
export const PASOS_ESTADO: { codigo: EstadoCodigo; etiqueta: string }[]; // 6 pasos en orden: recibido, aceptado, preparando, asignado, camino, entregado
```
- Produces: `SeguimientoPedidoService` con `estadoDe(idpedido: number, idcliente: number): Observable<any>` (REST `delivery/get-estado-pedido`), `cambios$(): Observable<any>` (merge del socket `pedido-cambio-estado`, `repartidor-notifica-estado-pedido`, `repartidor-notifica-ubicacion`), y `refrescoAutomatico$(): Observable<void>` que emite al volver al frente (`document.visibilitychange` visible, Capacitor `App.addListener('appStateChange')` con `isActive`) y cada 30 s (`interval(30000)`).

- [ ] **Step 1: Spec (falla)** `estado-pedido.spec.ts`:
```ts
import { resumirEstadoPedido, PASOS_ESTADO } from './estado-pedido';

describe('resumirEstadoPedido', () => {
  const casos: Array<[any, string, number]> = [
    [{ pwa_estado: 'P', pwa_delivery_status: '0' }, 'Recibido', 1],
    [{ pwa_estado: 'A', pwa_delivery_status: '0' }, 'En preparación', 3],
    [{ pwa_estado: 'D', pwa_delivery_status: '0' }, 'En preparación', 3],
    [{ pwa_estado: 'R', pwa_delivery_status: '0' }, 'Repartidor asignado', 4],
    [{ pwa_estado: 'A', pwa_delivery_status: 1 }, 'Repartidor asignado', 4],
    [{ pwa_estado: 'A', pwa_delivery_status: '3' }, 'En camino', 5],
    [{ pwa_estado: 'E', pwa_delivery_status: '3' }, 'Entregado', 6],
    [{ pwa_estado: 'A', pwa_delivery_status: 4 }, 'Entregado', 6],
    [{ pwa_estado: 'C', pwa_delivery_status: '0' }, 'Cancelado', 0],
    [{ pwa_estado: 'A', pwa_delivery_status: '5' }, 'Cancelado', 0],
    [{}, 'Recibido', 1],
  ];
  casos.forEach(([p, etiqueta, paso]) => {
    it(`${JSON.stringify(p)} → ${etiqueta}`, () => {
      const r = resumirEstadoPedido(p);
      expect(r.etiqueta).toBe(etiqueta);
      expect(r.paso).toBe(paso);
      expect(r.activo).toBe(paso > 0 && paso < 6);
    });
  });
  it('tiene 6 pasos ordenados', () => {
    expect(PASOS_ESTADO.map(x => x.etiqueta)).toEqual(['Recibido', 'Aceptado', 'En preparación', 'Repartidor asignado', 'En camino', 'Entregado']);
  });
});
```
Nota: `Aceptado` (paso 2) existe en la línea de tiempo pero hoy el backend no distingue "aceptado" de "en preparación" (ambos son `A`); `A` se muestra como paso 3 y el paso 2 queda marcado como completado. `// ponytail: cuando el local confirme manualmente (módulo Mi tienda), 'A' pasa a paso 2 y un nuevo código a paso 3`.

- [ ] **Step 2: Implementar `estado-pedido.ts`:**
```ts
export type EstadoCodigo = 'recibido' | 'aceptado' | 'preparando' | 'asignado' | 'camino' | 'entregado' | 'cancelado';
export interface EstadoResumen { codigo: EstadoCodigo; etiqueta: string; paso: number; activo: boolean; }

export const PASOS_ESTADO: { codigo: EstadoCodigo; etiqueta: string }[] = [
  { codigo: 'recibido', etiqueta: 'Recibido' },
  { codigo: 'aceptado', etiqueta: 'Aceptado' },
  { codigo: 'preparando', etiqueta: 'En preparación' },
  { codigo: 'asignado', etiqueta: 'Repartidor asignado' },
  { codigo: 'camino', etiqueta: 'En camino' },
  { codigo: 'entregado', etiqueta: 'Entregado' },
];

function porCodigo(codigo: EstadoCodigo): EstadoResumen {
  if (codigo === 'cancelado') { return { codigo, etiqueta: 'Cancelado', paso: 0, activo: false }; }
  const paso = PASOS_ESTADO.findIndex(x => x.codigo === codigo) + 1;
  return { codigo, etiqueta: PASOS_ESTADO[paso - 1].etiqueta, paso, activo: paso < 6 };
}

// pwa_estado: etapa del local (P A D R E C). pwa_delivery_status: etapa del repartidor (0 1 3 4 5).
export function resumirEstadoPedido(p: { pwa_estado?: string; pwa_delivery_status?: string | number }): EstadoResumen {
  const local = String(p?.pwa_estado || 'P').toUpperCase();
  const reparto = String(p?.pwa_delivery_status ?? '0');
  if (local === 'C' || reparto === '5') { return porCodigo('cancelado'); }
  if (local === 'E' || reparto === '4') { return porCodigo('entregado'); }
  if (reparto === '3') { return porCodigo('camino'); }
  if (reparto === '1' || local === 'R') { return porCodigo('asignado'); }
  if (local === 'A' || local === 'D') { return porCodigo('preparando'); }
  return porCodigo('recibido');
}
```
Ejecutar el spec: todo verde.

- [ ] **Step 3: `socket.service.ts`** agregar:
```ts
  onPedidoCambioEstado() {
    return this.fromEvent('pedido-cambio-estado');
  }
```

- [ ] **Step 4: `seguimiento-pedido.service.ts`:**
```ts
import { Injectable, NgZone } from '@angular/core';
import { Observable, merge, interval, fromEvent, Subject } from 'rxjs';
import { filter, map, mapTo } from 'rxjs/operators';
import { App } from '@capacitor/app';
import { CrudHttpService } from './crud-http.service';
import { SocketService } from './socket.service';
import { IS_NATIVE } from '../config/config.const';

@Injectable({ providedIn: 'root' })
export class SeguimientoPedidoService {
  private resumeSubject = new Subject<void>();

  constructor(private crud: CrudHttpService, private socket: SocketService, private zone: NgZone) {
    if (IS_NATIVE) {
      App.addListener('appStateChange', ({ isActive }) => { if (isActive) { this.zone.run(() => this.resumeSubject.next()); } });
    }
  }

  estadoDe(idpedido: number, idcliente: number): Observable<any> {
    return this.crud.postFree({ idpedido, idcliente }, 'delivery', 'get-estado-pedido', false)
      .pipe(map((res: any) => (res && res.success && res.data && res.data[0]) ? res.data[0] : null));
  }

  // cualquier señal de cambio: evento unificado, o los dos eventos viejos del repartidor
  cambios$(): Observable<any> {
    return merge(this.socket.onPedidoCambioEstado(), this.socket.onDeliveryPedidoChangeStatus(), this.socket.onDeliveryUbicacionRepartidor());
  }

  ubicacionRepartidor$(): Observable<{ latitude: number; longitude: number }> {
    return merge(
      this.socket.onDeliveryUbicacionRepartidor(),
      this.socket.onPedidoCambioEstado().pipe(map((e: any) => e?.position_now), filter(p => !!p), map((p: any) => ({ latitude: p.lat ?? p.latitude, longitude: p.lng ?? p.longitude })))
    ) as Observable<any>;
  }

  // ponytail: polling fijo de 30 s como red de seguridad; si el socket funciona bien se puede subir a 60 s
  refrescoAutomatico$(): Observable<void> {
    const visible = fromEvent(document, 'visibilitychange').pipe(filter(() => document.visibilityState === 'visible'), mapTo(undefined));
    return merge(visible, this.resumeSubject.asObservable(), interval(30000).pipe(mapTo(undefined)));
  }
}
```
Verificar que `@capacitor/app` esté instalado (`package.json` lo lista). `onDeliveryUbicacionRepartidor` emite `coordenadas` con la forma que manda el repartidor; revisar en `mi-orden-detalle.component.ts` (`<ILatLng>res` con `latitude/longitude`) y mantener esa forma.

- [ ] **Step 5:** `npx tsc -p src/tsconfig.app.json --noEmit` sin errores.

- [ ] **Step 6: Commit**
```
git add src/app/shared/utils/estado-pedido.ts src/app/shared/utils/estado-pedido.spec.ts src/app/shared/services/seguimiento-pedido.service.ts src/app/shared/services/socket.service.ts
git commit -F <archivo con: "feat: estado unificado del pedido y servicio de seguimiento con socket, resume y polling">
```

---

### Task 3: App: "Mis pedidos" y detalle con línea de tiempo y refresco

**Files (app):**
- Modify: `src/app/pages/zona-establecimientos/mis-ordenes/mis-ordenes.component.ts` y `.html`
- Modify: `src/app/pages/zona-establecimientos/mi-orden-detalle/mi-orden-detalle.component.ts`, `.html`, `.css`
- Modify: `src/app/pages/zona-establecimientos/main/main.component.ts` (conectar socket también para clientes con sesión propia)

**Interfaces:**
- Consumes: `resumirEstadoPedido`, `PASOS_ESTADO`, `SeguimientoPedidoService` (Task 2). Campos nuevos del SP (Task 1): `pwa_estado`, `fecha_hora`, `position_now`.

- [ ] **Step 1: `mis-ordenes.component.ts`.** Reemplazar el `switch` de `loadMisPedidos()` por `x.estadoResumen = resumirEstadoPedido(x); x.estado = x.estadoResumen.etiqueta;`. Reemplazar `listenChangeStatus()` por:
```ts
  private listenChangeStatus(): void {
    merge(this.seguimiento.cambios$(), this.seguimiento.refrescoAutomatico$())
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => this.loadMisPedidos(false));
  }
```
(`merge`, `debounceTime` de rxjs; inyectar `private seguimiento: SeguimientoPedidoService`). `loadMisPedidos(mostrarLoader = true)`: solo poner `loaderPage = true` cuando `mostrarLoader`; no vaciar `listMisPedidos` antes de recibir (evita parpadeo); en error de red dejar la lista anterior. Quitar el `console.log('from getsotrage id cliente')`. En `ngOnDestroy` usar `complete()`.

- [ ] **Step 2: `mis-ordenes.component.html`.** Sustituir la línea del estado por un chip con color por etapa:
```html
<span class="chip-estado" [ngClass]="'chip-' + item.estadoResumen?.codigo">{{ item.estado }}</span>
```
y en el `.css` del componente:
```css
.chip-estado { display:inline-block; padding:2px 10px; border-radius:12px; font-size:12px; font-weight:600; background:#eceef1; color:#3b4252; }
.chip-recibido { background:#e3ecf9; color:#2b5fa8; }
.chip-preparando, .chip-aceptado { background:#fbefd6; color:#8a5a00; }
.chip-asignado, .chip-camino { background:#e0f2e7; color:#2c7a4b; }
.chip-entregado { background:#eceef1; color:#3b4252; }
.chip-cancelado { background:#fbe7e5; color:#b3261e; }
```
Debajo de la fecha mostrar la sede y, si `item.flag_pedido_programado == 1`, el texto `Programado para {{ item.fecha_hora | date:'dd/MM HH:mm' }}`.

- [ ] **Step 3: `mi-orden-detalle.component.ts`.** Reescribir la lógica de estado:
  - Campos: `estadoResumen: EstadoResumen; pasos = PASOS_ESTADO; ubicacionRepartidor: { latitude: number; longitude: number } = null;`.
  - `ngOnInit`: leer `this.dataPedido` desde `infoUsToken.otro` como hoy (es el ítem tocado en la lista); calcular `this.aplicarEstado(this.dataPedido)`; llamar `this.refrescar()`; suscribirse a `this.seguimiento.cambios$()` y `refrescoAutomatico$()` (merge + debounce 300 ms) → `refrescar()`; suscribirse a `this.seguimiento.ubicacionRepartidor$()` → `this.ubicacionRepartidor = pos; this.origin = pos;`.
  - `refrescar()`: `this.seguimiento.estadoDe(this.dataPedido.idpedido, this.dataPedido.idcliente).subscribe(est => { if (!est) { return; } Object.assign(this.dataPedido, est); this.aplicarEstado(this.dataPedido); if (est.position_now && !this.ubicacionRepartidor) { this.origin = { latitude: est.position_now.lat, longitude: est.position_now.lng }; } })`.
  - `aplicarEstado(p)`: `this.estadoResumen = resumirEstadoPedido(p); this.estadoPedido = this.estadoResumen.etiqueta; this.showTelefonoRepartidor = !!p.idrepartidor && this.estadoResumen.activo;`.
  - Eliminar `readEstadoPedido` y el cálculo de "llegó" por distancia (75 m) — el estado lo dice el servidor. Conservar `openDialogCalificacion`, `redirectWhatsApp`, `callPhone`; en `openDialogCalificacion` tras calificar: `this.dataPedido.pwa_delivery_status = 4; this.aplicarEstado(this.dataPedido);`.
  - `ngOnDestroy`: `complete()`.

- [ ] **Step 4: `mi-orden-detalle.component.html`.** Sustituir el `<span class="fw-600 fs-20"> {{ estadoPedido }} </span>` por la línea de tiempo:
```html
<div class="timeline" *ngIf="estadoResumen?.codigo !== 'cancelado'; else cancelado">
  <div class="paso" *ngFor="let p of pasos; let i = index"
       [class.hecho]="i + 1 < estadoResumen?.paso" [class.actual]="i + 1 === estadoResumen?.paso">
    <span class="punto"></span>
    <span class="texto">{{ p.etiqueta }}</span>
  </div>
</div>
<ng-template #cancelado><span class="chip-estado chip-cancelado">Cancelado</span></ng-template>
```
CSS en `mi-orden-detalle.component.css`:
```css
.timeline { display:flex; flex-direction:column; gap:6px; }
.paso { display:flex; align-items:center; gap:8px; color:#8a92a0; font-size:12px; }
.paso .punto { width:10px; height:10px; border-radius:50%; background:#d5d9e0; flex:none; }
.paso.hecho { color:#3b4252; } .paso.hecho .punto { background:#2c7a4b; }
.paso.actual { color:#1d2433; font-weight:700; } .paso.actual .punto { background:#e0651f; box-shadow:0 0 0 4px rgba(224,101,31,.2); }
.chip-estado { display:inline-block; padding:2px 10px; border-radius:12px; font-size:12px; font-weight:600; }
.chip-cancelado { background:#fbe7e5; color:#b3261e; }
```
Cambiar las condiciones del template: botón llamar/mensaje `*ngIf="dataPedido.idrepartidor && estadoResumen?.activo"`; bloque "recibí conforme" `*ngIf="estadoResumen?.codigo === 'camino' || (dataPedido.pwa_delivery_servicio_propio == 1 && estadoResumen?.activo && dataPedido.idrepartidor)"`. El mapa se muestra solo si `estadoResumen?.activo`.

- [ ] **Step 4b: `socket.service.ts` + `resumen-pedido.component.ts`.** Agregar en `SocketService`:
```ts
  // tras guardar el pedido el servidor puede asignar otro idcliente; unirse a su sala sin reconectar
  joinCliente(idcliente: number): void {
    const id = Number(idcliente);
    if (this.socket && id > 0) { this.socket.emit('join-cliente', id); }
  }
```
y en `savePedidoSocket2()` de `resumen-pedido.component.ts`, dentro del bloque `if (Number(_res.idcliente) > 0) { ... }` (creado en Sprint 1 Tarea 8), agregar como última línea `this.socketService.joinCliente(Number(_res.idcliente));`.

- [ ] **Step 5: `main.component.ts` (zona-establecimientos).** La condición `if (this.isClienteLogueado || this.infoClient.isClienteTmp)` que conecta el socket debe cubrir también la sesión propia del Sprint 1: usar `if (this.isClienteLogueado || this.infoClient.isClienteTmp || this.verifyClientService.isLogin())`.

- [ ] **Step 6:** `npx tsc -p src/tsconfig.app.json --noEmit` y `npx ng build --configuration production` exit 0.

- [ ] **Step 7: Commit**
```
git add src/app/pages/zona-establecimientos/ src/app/shared/services/socket.service.ts src/app/pages/pedido/resumen-pedido/resumen-pedido.component.ts
git commit -F <archivo con: "feat: Mis pedidos y detalle con estado real, línea de tiempo y refresco por socket, resume y polling">
```

---

### Task 4: App: mapa de seguimiento con @angular/google-maps

**Files (app):**
- Modify: `package.json` (agregar `@angular/google-maps` 14.2.x; quitar `@agm/core`)
- Modify: `src/app/componentes/componentes.module.ts` (importar `GoogleMapsModule`; borrar el bloque comentado de `AgmCoreModule`)
- Modify: `src/app/componentes/mapa-solo/mapa-solo.component.ts`, `.html`, `.css`
- Modify: `src/app/shared/directivas/directions-map-directive.directive.ts` (borrar el archivo y su declaración si ya no lo usa nadie; si `mi-orden-detalle` importa `ILatLng` de ahí, mover la interfaz a `src/app/modelos/latlng.model.ts`)

**Interfaces:**
- Consumes: `GoogleMapsLoaderService.load()` / `isLoaded()` (Sprint 1 Task 5).
- Produces: `<app-mapa-solo [origin] [destination]>` donde `origin` es la posición del repartidor (o del local si aún no hay) y `destination` la del cliente, ambos `{ latitude, longitude }`. Se redibuja en `ngOnChanges`.

- [ ] **Step 1:** `npm install @angular/google-maps@14.2.7 --save` y `npm uninstall @agm/core`. Confirmar que `node_modules/@angular/google-maps/package.json` dice 14.x.

- [ ] **Step 2: `componentes.module.ts`:** `import { GoogleMapsModule } from '@angular/google-maps';` y agregarlo a `imports`. Borrar el bloque comentado `// AgmCoreModule.forRoot(...)` y el import comentado de `@agm/core`. Mantener `schemas: [CUSTOM_ELEMENTS_SCHEMA]` (aún hay `<agm-map>` en `dialog-direccion-cliente-delivery`, que migra en el Sprint 4).

- [ ] **Step 3: `mapa-solo.component.ts`:**
```ts
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { GoogleMapsLoaderService } from 'src/app/shared/services/google-maps-loader.service';

export interface LatLng { latitude: number; longitude: number; }

@Component({
  selector: 'app-mapa-solo',
  templateUrl: './mapa-solo.component.html',
  styleUrls: ['./mapa-solo.component.css']
})
export class MapaSoloComponent implements OnInit, OnChanges {
  @Input() origin: LatLng;       // repartidor (o local mientras no hay repartidor)
  @Input() destination: LatLng;  // cliente

  mapsListo = false;
  zoom = 14;
  center: google.maps.LatLngLiteral = { lat: -12.0464, lng: -77.0428 };
  options: google.maps.MapOptions = { disableDefaultUI: true, zoomControl: false, gestureHandling: 'greedy' };
  posCliente: google.maps.LatLngLiteral = null;
  posRepartidor: google.maps.LatLngLiteral = null;
  iconCliente: google.maps.Icon = { url: './assets/images/placeholder.png', scaledSize: { width: 30, height: 30 } as any };
  iconRepartidor: google.maps.Icon = { url: './assets/images/delivery-man.png', scaledSize: { width: 28, height: 28 } as any };

  constructor(private mapsLoader: GoogleMapsLoaderService) { }

  ngOnInit(): void {
    this.mapsLoader.load().then(() => { this.mapsListo = true; this.recalcular(); }).catch(() => { this.mapsListo = false; });
  }

  ngOnChanges(_: SimpleChanges): void { this.recalcular(); }

  private aLiteral(p: LatLng): google.maps.LatLngLiteral {
    const lat = Number(p?.latitude); const lng = Number(p?.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }

  private recalcular(): void {
    this.posCliente = this.aLiteral(this.destination);
    this.posRepartidor = this.aLiteral(this.origin);
    const foco = this.posRepartidor || this.posCliente;
    if (foco) { this.center = foco; }
    // ponytail: centro en el repartidor; encuadrar ambos puntos con fitBounds cuando se pida
  }
}
```
Template:
```html
<div class="border mapa-solo">
  <google-map *ngIf="mapsListo && (posCliente || posRepartidor)" height="230px" width="100%" [center]="center" [zoom]="zoom" [options]="options">
    <map-marker *ngIf="posCliente" [position]="posCliente" [options]="{ icon: iconCliente }"></map-marker>
    <map-marker *ngIf="posRepartidor" [position]="posRepartidor" [options]="{ icon: iconRepartidor }"></map-marker>
  </google-map>
  <div *ngIf="!mapsListo" class="sin-mapa">Mapa no disponible por el momento.</div>
</div>
```
CSS: `.mapa-solo { min-height: 60px; } .sin-mapa { padding: 12px; font-size: 12px; color: #7b8494; text-align: center; }`. Borrar la regla `agm-map`.

- [ ] **Step 4:** `mi-orden-detalle.component.ts` importa `ILatLng` desde la directiva de direcciones; cambiar a `import { LatLng } from 'src/app/componentes/mapa-solo/mapa-solo.component';` y usar `LatLng`. Si nadie más importa `directions-map-directive.directive.ts` (`Select-String -Pattern "directions-map-directive|DirectionsMapDirectiveDirective|appDirectionsMapDirective"` en src), borrar el archivo y quitarlo de `declarations` en `componentes.module.ts`.

- [ ] **Step 5:** `npx tsc -p src/tsconfig.app.json --noEmit` y `npx ng build --configuration production` exit 0. Confirmar que `Select-String -Path package.json -Pattern "@agm/core"` devuelve vacío.

- [ ] **Step 6: Commit**
```
git add package.json package-lock.json src/app/componentes/componentes.module.ts src/app/componentes/mapa-solo/ src/app/pages/zona-establecimientos/mi-orden-detalle/ src/app/shared/directivas/
git commit -F <archivo con: "feat: mapa de seguimiento con @angular/google-maps y marcador del repartidor; retiro de @agm/core">
```

---

### Task 5: App: pantalla "Estado" del flujo de pedido en mesa sin caída al bloque falso de delivery

**Files (app):**
- Modify: `src/app/pages/pedido/estado-pedido/estado-pedido.component.html`

- [ ] **Step 1:** Reemplazar la pareja `<ng-container *ngIf="isClienteHolding">...` + `<ng-container *ngIf="!isClienteHolding && !isDeliveryCliente; else templateDelivery">` por un `ngSwitch` de tres vías:
```html
<ng-container [ngSwitch]="isClienteHolding ? 'holding' : (isDeliveryCliente ? 'delivery' : 'mesa')">
  <ng-container *ngSwitchCase="'holding'"><app-estado-pedidos-holding-cliente></app-estado-pedidos-holding-cliente></ng-container>
  <ng-container *ngSwitchCase="'mesa'"> ...contenido actual del bloque de mesa... </ng-container>
  <ng-container *ngSwitchCase="'delivery'">
    <div class="p-3 text-center"><p>Sigue tu pedido en <strong>Mis pedidos</strong>.</p></div>
  </ng-container>
</ng-container>
```
Borrar el `#templateDelivery` con la dirección de relleno ("Jr. Reyes Guerra 456").

- [ ] **Step 1b: Fallback del mapa cuando Google rechaza la clave.** Google Maps carga el JS aunque la clave esté restringida y luego llama a `window.gm_authFailure` y pinta su propio panel de error dentro de `<google-map>`. En `src/app/shared/services/google-maps-loader.service.ts` agregar un estado `authFallida = false` y, en `load()` antes de crear el script, `window.gm_authFailure = () => { this.authFallida = true; this.authFallidaSubject.next(true); };` (declarar `gm_authFailure?: () => void` en la interfaz global `Window` junto a `__gmapsReady`), exponer `isLoaded()` como `... && !this.authFallida` y un `authFallida$: Observable<boolean>` (`BehaviorSubject(false)`). En `mapa-solo.component.ts` suscribirse a `authFallida$` (con `takeUntil` o `first()`) y poner `mapsListo = false` cuando llegue `true`, de modo que se muestre "Mapa no disponible por el momento." en vez del panel gris de Google. Sin spec nuevo (es enganche de plataforma); verificar en el navegador de desarrollo, donde la clave está restringida: el detalle del pedido debe mostrar el texto de respaldo, sin errores rojos del componente.

- [ ] **Step 2:** `npx tsc -p src/tsconfig.app.json --noEmit` y `npx ng build --configuration production` exit 0.

- [ ] **Step 3: Commit** `git add src/app/pages/pedido/estado-pedido/ src/app/shared/services/google-maps-loader.service.ts src/app/componentes/mapa-solo/` + mensaje `fix: pantalla Estado sin bloque falso de delivery y mapa con respaldo cuando Google rechaza la clave`.

---

## Self-Review

- Cobertura del spec (sección 4): columna correcta y mapa de estados (T2), tab/estado visible y sin relleno (T3, T5), socket resiliente y sala por cliente (Sprint 1 T3/T8 + T1 aquí), fallback REST + resume + polling (T2, T3), mapa vivo (T4). Sección 12: lista con estado real (T3).
- Tipos: `EstadoResumen`, `resumirEstadoPedido`, `PASOS_ESTADO` definidos en T2 y usados en T3; `LatLng` definido en T4 y usado en T3 (T3 se ejecuta antes que T4: T3 puede seguir usando `ILatLng` y T4 hace el reemplazo — está indicado en T4 Step 4). `SeguimientoPedidoService.cambios$/ubicacionRepartidor$/refrescoAutomatico$/estadoDe` con las firmas de T2. Backend `notificar/leerEstado/setIo` de T1 usados en T1 solamente.
- Sin placeholders.
