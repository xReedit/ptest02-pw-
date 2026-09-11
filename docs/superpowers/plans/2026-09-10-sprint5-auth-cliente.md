# Sprint 5: autenticación del cliente en endpoints de delivery y push — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el backend deje de creerle al `idcliente` que le manda el navegador. Hoy cualquiera cambia un entero en el body (o en el handshake del socket) y lee el historial de pedidos, las direcciones, el perfil completo (DNI, email, teléfono) y la posición GPS del repartidor de otra persona, o secuestra sus notificaciones push. El sprint introduce un token de sesión de cliente firmado por el backend, lo emite en los tres momentos en que la identidad queda establecida, lo envía la app en cada petición y en el handshake del socket, y lo exige en las rutas de cliente — con un interruptor de despliegue gradual (`off` → `log` → `enforce`) para no romper las apps nativas ya instaladas.

**Architecture:** JWT HS256 con secreto propio `SEED_CLIENTE` (distinto de `SEED`, el de colaboradores), payload mínimo `{ idcliente, tipo: 'cliente' }` y vigencia de 180 días. Emisor puro en `service/token.cliente.js` (`emitir`, `verificar`, `conTokenCliente`), sin estado y sin persistencia: cada punto de identificación re-emite. El middleware `middleware/autentificacion.cliente.js` lee `Authorization` (con o sin prefijo `Bearer`), expone `req.cliente = { idcliente }` y se comporta según `AUTH_CLIENTE_MODO`: `off` pasa, `log` verifica y avisa pero deja pasar, `enforce` responde 401/403. El mismo archivo publica `salaCliente()`, la decisión pura de a qué sala `cliente_<id>` puede unirse un socket, que consume `controllers/sockets.js` dentro de `socketsOn` (nunca `app.js`, que está bloqueado). En la app, el token vive en `localStorage['sys::tkc']` detrás de `src/app/shared/utils/token-cliente.ts` y lo inyecta el interceptor que ya está registrado en `core.module.ts:36`, así que **ninguna de las ~20 llamadas `postFree(..., false)` cambia**. Cero migraciones de base de datos.

**Tech Stack:** Node + Express 4 + `jsonwebtoken` 8.5.1 + socket.io 4.8.1 (servidor) / socket.io-client 2.4.0 (app, sin `auth:{}`: el token viaja en `query`), mysql2 vía `service/query.service.v1`, pino, Jest 29. App: Angular 14.2, Capacitor 4.6, Karma/Jasmine (ChromeHeadless).

**Spec:** Dossier de código leído por el planificador: `C:\Users\user\AppData\Local\Temp\claude\D--Projects-capacitor-pwa-app-pedido\927d1846-8ad7-4528-a90b-70ec2c15c15e\scratchpad\dossier-auth-cliente.md` (secciones 1 a 7 y anexo). Cada tarea cita las líneas del dossier que cierra. Todo lo que el plan afirma sobre firmas y números de línea fue reverificado contra el código real por el planificador.

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
- **Nunca imprimir, loguear ni pegar en un commit un token completo** (ni el de cliente, ni el de colaborador, ni el FCM). En logs va como máximo el `idcliente` y el motivo del rechazo, nunca el JWT. Tampoco imprimir el valor de `SEED`, `SEED_SMS` ni `SEED_CLIENTE`.
- **`app.js` está bloqueado** (modificado por el trabajo de Yape sin commitear). Consecuencia de diseño: no hay middleware global, no hay `app.set('trust proxy')`, no se toca el `io.use` comentado. Todo lo nuevo se monta **por ruta en `routes/v3.js`** y, para el socket, **dentro de `socketsOn` en `controllers/sockets.js`**.
- **Sprint 4 corre en paralelo en la app.** Este sprint NO toca ningún archivo de imágenes, geolocalización ni costo de entrega. Los únicos archivos de la app que se tocan son: `src/app/shared/utils/token-cliente.ts` (nuevo), `src/app/shared/services/http-config-interceptor.service.ts`, `src/app/shared/services/info-token.service.ts`, `src/app/shared/services/socket.service.ts`, `src/app/shared/services/crud-http.service.ts`, `src/app/shared/services/verify-auth-client.service.ts`, `src/app/shared/config/config.const.ts`, `src/app/componentes/dialog-verificar-telefono/*`, `src/app/pages/pedido/resumen-pedido/resumen-pedido.component.ts` y `android/app/build.gradle`. Si alguno aparece modificado por otro trabajo, detenerse y preguntar.
- **`src/app/core/core.module.ts` no se modifica**: `HttpConfigInterceptorService` ya está registrado ahí (línea 36). Se modifica el servicio, no el módulo.
- **Todos los números de línea de este plan son los del archivo ANTES de que empiece la tarea que los cita.** Cada paso que agrega un `require` o borra un bloque desplaza lo que viene después. Localizar siempre el bloque por su **texto** (cada paso lo cita entero) y usar el número de línea solo como orientación. Cuando haga falta, buscar con `Select-String -Path <archivo> -Pattern "<texto>"`.
- Inmutabilidad: `request.clone(...)` en el interceptor, `Object.assign({}, fila, {...})` en el backend. Nunca mutar el objeto recibido.
- Cero migraciones de BD en este sprint. El token no se persiste. (Confirmado contra el dossier §7 y contra los handlers: ninguna columna nueva.)

## Rulings

Decisiones del controlador, vinculantes para todo el sprint:

1. **Mecanismo.** JWT HS256 firmado con una variable de entorno nueva `SEED_CLIENTE`, leída por `process.env`. El módulo del middleware **falla cerrado al cargarse** si `AUTH_CLIENTE_MODO=enforce` y `SEED_CLIENTE` no está. Payload `{ idcliente, tipo: 'cliente' }`, vigencia 180 días. Lo emite el backend en los **tres** momentos en que la identidad del cliente queda establecida: `ini/register-cliente-login`, `delivery/verificar-codigo-sms` (solo con `response === 1`) y el ack del socket `nuevoPedido` que devuelve `idcliente`. Viaja en la **misma respuesta**, en un campo nuevo `tokenCliente`, para que una app vieja simplemente lo ignore.
2. **Almacenamiento y envío en la app.** `localStorage['sys::tkc']`. El interceptor HTTP que ya está registrado en `core.module.ts` añade `Authorization: Bearer <token>` a toda petición dirigida al host del backend cuando el token existe. **No cambia la firma de `postFree` ni de ninguna llamada.**
3. **Socket.** La app manda `tokenCliente` en el `query` del handshake (socket.io-client 2 no soporta `auth:{}`). El backend lo valida en el handler `join-cliente` y, en el handshake, para los sockets que declaran `iscliente`. Todo dentro de `socketsOn` / el handler de `connection` en `controllers/sockets.js`: **no se toca `app.js`** ni el `io.use` comentado de las líneas 87-93.
4. **Middleware.** `verificarTokenCliente` en `middleware/autentificacion.cliente.js` (archivo nuevo al lado de `autentificacion.js`). Modo desde `AUTH_CLIENTE_MODO` = `off` | `log` | `enforce`, por defecto `log`:
   - `off`: pasa sin mirar nada.
   - `log`: verifica si hay token y **deja pasar siempre**, pero registra un `logger.warn` con ruta + idcliente cuando falta, es inválido o no coincide.
   - `enforce`: 401 `{success:false, error:'no autorizado'}` si falta o es inválido; **403** si el `idcliente` del body/query no coincide con el del token.
   El middleware expone el idcliente verificado en `req.cliente = { idcliente }`.
5. **Alcance de rutas** (P0 + escrituras P1 + socket): `delivery/get-mis-pedidos`, `delivery/get-estado-pedido`, toda ruta que lea o escriba perfil y direcciones del cliente por `idcliente`, `push/suscripcion`, `registrar-pago`, `user-account-remove`, más las demás que el dossier lista tomando `idcliente` del body sin `verificarToken`. Enumeradas con `file:line` en la Task 4. **No** se protegen los endpoints de OTP/registro (son la forma de obtener el token) ni los de carta/menú públicos.
6. **`push/send-notification`:** se borra la línea de ruta en `routes/v3.js` y el handler `sendPushNotificaction` en `controllers/sendMsj.js` (nadie lo llama). El código muerto de `TOKEN_SMS` / `verificarTokenSms` / `sendMsjConfirmacion` se borra en ambos lados **solo si el grep confirma cero llamadores vivos**; el grep va dentro del paso.
7. **Rollout.** El backend se despliega con `AUTH_CLIENTE_MODO=log`. La última tarea deja una nota en `docs/superpowers/notas/` explicando cómo pasar a `enforce` y qué se rompe para las apps nativas sin actualizar. La app sube la versión que compara `version-app/get-version-app`.
8. **Pruebas.** Jest para el emisor (firmar/verificar/vencimiento/secreto equivocado), para el middleware en los tres modos (req/res/next simulados) y para al menos una ruta protegida con el estilo de `test/` (mock de `QueryServiceV1`). Karma para el interceptor (añade la cabecera solo si hay token y solo al host del backend) y para el helper de almacenamiento. Escenarios e2e listados para el probador del controlador.
9. **Secuenciación.** Primero el backend (compatible hacia atrás bajo `log`), después la app. Cada tarea termina en su propio commit.

### Correcciones del planificador a los supuestos del encargo

Verificadas contra el código; el implementador debe respetarlas:

- **La misma PWA sirve al cliente y al comercio/mozo.** `delivery/get-direccion-cliente` y `cliente/new-direccion` se llaman también desde el flujo del comercio con el `idcliente` de OTRA persona: `seleccionar-direccion.component.ts:17,29` (`@Input() idClienteBuscar`), `agregar-direccion.component.ts:46,277`, `dialog-direccion-cliente-delivery.component.ts:71-72,100,277` (`isFromComercio`), invocados desde `datos-delivery.component.ts:343-344`, `confirmar-delivery.component.ts:563-564`, `comp-get-datos-cliente.component.ts:106`. Ese tráfico lleva el JWT de colaborador firmado con `SEED`. **Por eso el middleware acepta también un token de colaborador válido y en ese caso no compara `idcliente`.** Sin esta salida, `enforce` rompería la toma de pedidos desde el comercio.
- **`delivery/search-cliente-by-phone` y `delivery/get-cliente-telefono-chatbot` NO se protegen**: se usan *antes* de que exista identidad (`dialog-verificar-telefono.component.ts:189`, `verify-auth-client.service.ts:463`). Quedan listadas como deuda en la nota de rollout.
- **La app de este repo nunca llama a `version-app/get-version-app`** (grep sin resultados en `src/`). La versión que compara ese endpoint vive en la tabla `app_version` de la base y la versión del binario en `android/app/build.gradle` (`versionCode 3`, `versionName "1.0.2"`). La Task 8 sube el binario y documenta el `UPDATE`; el aviso de actualización dentro de esta app **no existe** y se declara como bloqueo previo a `enforce`.
- **`push/suscripcion` ya está endurecido** por el Sprint 3 (`controllers/sendMsj.js:270-318`): valida `idcliente`, comprueba que el cliente exista y hace upsert. Solo le falta el token; no se reescribe el handler.

---

### Task 1: Backend: secreto `SEED_CLIENTE`, modo de despliegue y emisor `service/token.cliente.js`

**Qué cierra del dossier:** §3 ("no existe ningún concepto de token de consumidor"), §6 (falta `SEED_CLIENTE` en `.env`), §7 pieza 1 y 2.

**Files (backend, `D:\Projects\backend-pedidos`):**
- Create: `service/token.cliente.js`
- Test: `test/token.cliente.test.js`
- Modify: `.env` (NO versionado, `.gitignore` cubre `.env*`)
- Modify: `.env.production` (NO versionado)
- Modify: `.env.example` (SÍ versionado)

**Interfaces:**
- Produces:
```js
module.exports = { emitir, verificar, conTokenCliente, semilla, TIPO, VIGENCIA };
// emitir(idcliente) -> string | null            (null si idcliente <= 0 o falta SEED_CLIENTE)
// verificar(token)  -> { idcliente: number } | null   (acepta con y sin prefijo 'Bearer ')
// conTokenCliente(filas) -> filas nuevas con tokenCliente en la primera (sin mutar el original)
// TIPO = 'cliente'; VIGENCIA = '180d'
```
- Produces (entorno): `SEED_CLIENTE` y `AUTH_CLIENTE_MODO`. Los consumen la Task 2 (middleware), la Task 3 (emisión) y la Task 5 (socket).

- [ ] **Step 1: Escribir el spec (falla).** Crear `test/token.cliente.test.js`:

```js
// El emisor lee process.env.SEED_CLIENTE en cada llamada, asi que el spec puede
// cambiar el secreto sin resetear modulos.
const jwt = require('jsonwebtoken');

const SEMILLA = 'semilla-de-prueba-sprint5-no-es-la-real';
const OTRA_SEMILLA = 'otra-semilla-distinta-de-prueba';

const svc = require('../service/token.cliente');

describe('emitir', () => {
  beforeEach(() => { process.env.SEED_CLIENTE = SEMILLA; });
  afterEach(() => { delete process.env.SEED_CLIENTE; });

  it('firma un JWT con idcliente y tipo cliente', () => {
    const token = svc.emitir(15);
    expect(typeof token).toBe('string');
    const decode = jwt.verify(token, SEMILLA);
    expect(decode.idcliente).toBe(15);
    expect(decode.tipo).toBe('cliente');
  });

  it('acepta el idcliente como texto', () => {
    expect(jwt.verify(svc.emitir('15'), SEMILLA).idcliente).toBe(15);
  });

  it('vence a los 180 dias', () => {
    const decode = jwt.verify(svc.emitir(15), SEMILLA);
    expect(decode.exp - decode.iat).toBe(180 * 24 * 60 * 60);
  });

  it('devuelve null con un idcliente que no sirve', () => {
    expect(svc.emitir(0)).toBeNull();
    expect(svc.emitir(-2)).toBeNull();
    expect(svc.emitir(null)).toBeNull();
    expect(svc.emitir('abc')).toBeNull();
    expect(svc.emitir(1.5)).toBeNull();
  });

  it('devuelve null si no hay SEED_CLIENTE en el entorno', () => {
    delete process.env.SEED_CLIENTE;
    expect(svc.emitir(15)).toBeNull();
  });
});

describe('verificar', () => {
  beforeEach(() => { process.env.SEED_CLIENTE = SEMILLA; });
  afterEach(() => { delete process.env.SEED_CLIENTE; });

  it('devuelve el idcliente de un token propio', () => {
    expect(svc.verificar(svc.emitir(15))).toEqual({ idcliente: 15 });
  });

  it('acepta el token con prefijo Bearer', () => {
    expect(svc.verificar(`Bearer ${svc.emitir(15)}`)).toEqual({ idcliente: 15 });
    expect(svc.verificar(`bearer ${svc.emitir(15)}`)).toEqual({ idcliente: 15 });
  });

  it('rechaza un token firmado con otra semilla (el de colaborador nunca pasa)', () => {
    const ajeno = jwt.sign({ idcliente: 15, tipo: 'cliente' }, OTRA_SEMILLA, { expiresIn: '180d' });
    expect(svc.verificar(ajeno)).toBeNull();
  });

  it('rechaza un token de otro tipo aunque este firmado con la semilla correcta', () => {
    const otroTipo = jwt.sign({ usuario: { idusuario: 3 }, tipo: 'usuario' }, SEMILLA, { expiresIn: '2d' });
    expect(svc.verificar(otroTipo)).toBeNull();
  });

  it('rechaza un token vencido', () => {
    const vencido = jwt.sign({ idcliente: 15, tipo: 'cliente' }, SEMILLA, { expiresIn: '-1s' });
    expect(svc.verificar(vencido)).toBeNull();
  });

  it('rechaza vacio, basura y valores que no son texto', () => {
    expect(svc.verificar('')).toBeNull();
    expect(svc.verificar('   ')).toBeNull();
    expect(svc.verificar('no.es.jwt')).toBeNull();
    expect(svc.verificar(null)).toBeNull();
    expect(svc.verificar(undefined)).toBeNull();
    expect(svc.verificar({ idcliente: 15 })).toBeNull();
  });

  it('rechaza un token con idcliente invalido en el payload', () => {
    const raro = jwt.sign({ idcliente: 0, tipo: 'cliente' }, SEMILLA, { expiresIn: '1d' });
    expect(svc.verificar(raro)).toBeNull();
  });

  it('devuelve null si no hay SEED_CLIENTE aunque el token exista', () => {
    const token = svc.emitir(15);
    delete process.env.SEED_CLIENTE;
    expect(svc.verificar(token)).toBeNull();
  });
});

describe('conTokenCliente', () => {
  beforeEach(() => { process.env.SEED_CLIENTE = SEMILLA; });
  afterEach(() => { delete process.env.SEED_CLIENTE; });

  it('agrega tokenCliente a la primera fila sin tocar el original', () => {
    const filas = [{ idpedido: 77, idcliente: 15 }, { print: 'x' }];
    const salida = svc.conTokenCliente(filas);

    expect(salida).not.toBe(filas);
    expect(filas[0].tokenCliente).toBeUndefined();
    expect(salida[0].idpedido).toBe(77);
    expect(svc.verificar(salida[0].tokenCliente)).toEqual({ idcliente: 15 });
    expect(salida[1]).toBe(filas[1]);
  });

  it('deja las filas tal cual si la primera no trae idcliente valido', () => {
    const filas = [{ idpedido: 77, idcliente: 0 }];
    expect(svc.conTokenCliente(filas)).toBe(filas);
  });

  it('tolera false, null, vacio y valores que no son arreglo', () => {
    expect(svc.conTokenCliente(false)).toBe(false);
    expect(svc.conTokenCliente(null)).toBeNull();
    expect(svc.conTokenCliente([])).toEqual([]);
    expect(svc.conTokenCliente('texto')).toBe('texto');
    expect(svc.conTokenCliente([null])).toEqual([null]);
  });
});
```

- [ ] **Step 2: Ejecutar y ver fallar.**

Run: `npx jest test/token.cliente.test.js`
Expected: FAIL — `Cannot find module '../service/token.cliente'`.

- [ ] **Step 3: Crear `service/token.cliente.js`:**

```js
// Token de sesion del CLIENTE (consumidor de la PWA / app nativa).
//
// Secreto propio SEED_CLIENTE, distinto de SEED (colaboradores): un token de cliente
// nunca puede pasar por verificarToken de autentificacion.js ni al reves. El campo
// tipo documenta ademas la intencion.
//
// No se persiste ni se refresca: cada punto donde el backend establece la identidad
// (register-cliente-login, verificar-codigo-sms, ack de nuevoPedido) vuelve a emitirlo.
const jwt = require('jsonwebtoken');

const TIPO = 'cliente';
const DIAS_VIGENCIA = 180;
const VIGENCIA = `${DIAS_VIGENCIA}d`;

// Se lee en cada llamada y no al cargar el modulo: asi las pruebas pueden cambiar el
// secreto y un arranque sin la variable no queda cacheado para siempre.
const semilla = () => process.env.SEED_CLIENTE || '';

const esIdValido = (valor) => {
	const id = Number(valor);
	return Number.isInteger(id) && id > 0;
};

const emitir = (idcliente) => {
	if (!esIdValido(idcliente)) { return null; }
	if (!semilla()) { return null; }
	return jwt.sign({ idcliente: Number(idcliente), tipo: TIPO }, semilla(), { expiresIn: VIGENCIA });
};

// Acepta el token con y sin prefijo 'Bearer ' porque verificarToken de colaborador
// (autentificacion.js:9) lee la cabecera cruda y conviene un solo estilo en la app.
const verificar = (token) => {
	if (typeof token !== 'string') { return null; }
	const limpio = token.trim().replace(/^Bearer[ ]+/i, '');
	if (limpio === '' || !semilla()) { return null; }

	try {
		const decode = jwt.verify(limpio, semilla());
		if (!decode || decode.tipo !== TIPO) { return null; }
		if (!esIdValido(decode.idcliente)) { return null; }
		return { idcliente: Number(decode.idcliente) };
	} catch (error) {
		// Firma mala, token vencido o basura: para el llamador es lo mismo, no hay sesion.
		return null;
	}
};

// Copia de las filas de un procedimiento con tokenCliente en la primera, cuando esa
// fila trae un idcliente usable. Nunca muta el arreglo ni la fila originales.
const conTokenCliente = (filas) => {
	if (!Array.isArray(filas) || filas.length === 0) { return filas; }

	const primera = filas[0];
	if (!primera || typeof primera !== 'object') { return filas; }

	const token = emitir(primera.idcliente);
	if (!token) { return filas; }

	return [Object.assign({}, primera, { tokenCliente: token })].concat(filas.slice(1));
};

module.exports = { emitir, verificar, conTokenCliente, semilla, TIPO, VIGENCIA, DIAS_VIGENCIA };
```

- [ ] **Step 4: Ejecutar el spec.**

Run: `npx jest test/token.cliente.test.js`
Expected: PASS, 16 specs, 0 failures.

- [ ] **Step 5: Generar el secreto y ponerlo en los dos `.env` locales.**

Generar (NO pegar la salida en ningún archivo del repo ni en el mensaje de commit):
Run: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

Añadir al final de `D:\Projects\backend-pedidos\.env` (que está en `.gitignore`), con el valor generado:
```
# Sesion del cliente (PWA / app nativa). Secreto propio, distinto de SEED.
SEED_CLIENTE=<valor generado>
# off | log | enforce  -> ver docs del sprint 5. Se despliega en log.
AUTH_CLIENTE_MODO=log
```

Añadir lo mismo a `D:\Projects\backend-pedidos\.env.production`, **con un valor generado aparte** (otro `randomBytes`) y también `AUTH_CLIENTE_MODO=log`.

Verificar que ninguno de los dos entra al commit:
Run: `git check-ignore -v .env .env.production`
Expected: las dos rutas aparecen ignoradas por la regla `.env*` de `.gitignore`.

- [ ] **Step 6: Documentar las dos variables en `.env.example`** (este sí se versiona). Añadir al final del archivo:

```
# ================================
# Sprint 5: sesion del cliente
# ================================
# Secreto del JWT de CLIENTE (consumidor de la PWA / app nativa). Distinto de SEED,
# que es el de colaboradores: un token de cliente jamas debe pasar por verificarToken.
# Generar con: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# SEED_CLIENTE=

# Modo de exigencia del token de cliente:
#   off      = no se mira nada (comportamiento anterior al sprint 5)
#   log      = se verifica y se avisa por logger.warn, pero SIEMPRE deja pasar (default)
#   enforce  = 401 si falta o es invalido, 403 si el idcliente no coincide con el token
# enforce EXIGE SEED_CLIENTE: sin el, el proceso no arranca (falla cerrado).
# No activar enforce sin leer docs/superpowers/notas/2026-09-10-auth-cliente-rollout.md
# del repo pwa-app-pedido: las apps nativas sin actualizar dejan de funcionar.
AUTH_CLIENTE_MODO=log
```

- [ ] **Step 7: Commit.** Escribir con Write el archivo `.superpowers/sdd/2026-09-10-sprint5-auth-cliente/commit-msg-task-1.txt` (UTF-8) con este contenido:

```
feat: emisor del token de sesion del cliente con secreto propio SEED_CLIENTE

Hasta ahora el backend no emitia ninguna credencial al consumidor: los tres
puntos donde queda establecida su identidad devolvian un entero y nada mas, asi
que cualquiera podia cambiar ese entero y hacerse pasar por otro cliente.

service/token.cliente.js firma un JWT HS256 con payload { idcliente, tipo } y 180
dias de vigencia. El secreto SEED_CLIENTE es distinto de SEED (colaboradores) y
se lee de process.env en cada llamada, de modo que un token de cliente nunca pasa
por verificarToken ni al reves. conTokenCliente devuelve una copia de las filas
con el token en la primera, sin mutar el original.

Se documentan SEED_CLIENTE y AUTH_CLIENTE_MODO en .env.example. Los valores
reales viven solo en .env y .env.production, que no se versionan.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
```

Luego, desde `D:\Projects\backend-pedidos`:
```
git add service/token.cliente.js test/token.cliente.test.js .env.example
git commit -F .superpowers/sdd/2026-09-10-sprint5-auth-cliente/commit-msg-task-1.txt
```
Comprobar antes con `git status --short` que `app.js`, `controllers/serviceSendCPE.js` y `firebase_config.js` siguen modificados **y fuera** del commit.

---

### Task 2: Backend: middleware `verificarTokenCliente` con los tres modos

**Qué cierra del dossier:** §3 (no hay middleware de consumidor), §4 (todo el inventario de rutas sin autenticar), §7 pieza 4 y sección de rollout.

**Files (backend):**
- Create: `middleware/autentificacion.cliente.js`
- Test: `test/autentificacion.cliente.test.js`

**Interfaces:**
- Consumes: `service/token.cliente.js` (Task 1), `service/uitl.service.ReE`, `utilitarios/logger`, `_config.SEED` (para reconocer al colaborador).
- Produces:
```js
module.exports = {
  verificarTokenCliente, // middleware listo: lee body.idcliente / query.idcliente
  exigirCliente,         // fabrica: exigirCliente({ idcliente: (req) => number })
  salaCliente,           // decision pura para el socket (la usa la Task 5)
  modo,                  // 'off' | 'log' | 'enforce'
  esColaborador, tokenDeLaCabecera, idClienteDelBody
};
// El middleware deja req.cliente = { idcliente } cuando el token verifica.
// enforce: 401 { success:false, error:'no autorizado' } si falta/invalido; 403 si no coincide.
// salaCliente(token, idclientePedido) -> { idcliente: number, motivo: string|null }
//   idcliente 0 = el socket NO se une a ninguna sala de cliente.
```

- [ ] **Step 1: Escribir el spec (falla).** Crear `test/autentificacion.cliente.test.js`:

```js
jest.mock('../utilitarios/logger', () => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }));
// _config abre config.js local; se simula para no depender de la maquina
jest.mock('../_config', () => ({ SEED: 'semilla-colaborador-de-prueba', SEED_SMS: 'x' }));

const jwt = require('jsonwebtoken');
const logger = require('../utilitarios/logger');

const SEMILLA_CLIENTE = 'semilla-cliente-de-prueba-sprint5';
const SEMILLA_COLABORADOR = 'semilla-colaborador-de-prueba';

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

// El modo se lee en CADA llamada, asi que para probarlo basta con cambiar la variable de
// entorno sobre el mismo modulo. Se carga una sola vez a proposito: con jest.resetModules()
// el middleware se quedaria con un mock de logger distinto del que ve este spec.
process.env.SEED_CLIENTE = SEMILLA_CLIENTE;
const auth = require('../middleware/autentificacion.cliente');

function cargar(modo, conSecreto = true) {
  process.env.AUTH_CLIENTE_MODO = modo;
  if (conSecreto) { process.env.SEED_CLIENTE = SEMILLA_CLIENTE; } else { delete process.env.SEED_CLIENTE; }
  return auth;
}

// Solo el chequeo de arranque (enforce sin secreto) ocurre al cargar el modulo: ese si
// necesita un require aislado.
function recargar(modo, conSecreto = true) {
  jest.resetModules();
  process.env.AUTH_CLIENTE_MODO = modo;
  if (conSecreto) { process.env.SEED_CLIENTE = SEMILLA_CLIENTE; } else { delete process.env.SEED_CLIENTE; }
  return require('../middleware/autentificacion.cliente');
}

const tokenCliente = (idcliente, semilla = SEMILLA_CLIENTE) =>
  jwt.sign({ idcliente, tipo: 'cliente' }, semilla, { expiresIn: '180d' });

const tokenColaborador = () =>
  jwt.sign({ usuario: { idusuario: 3, idsede: 1 } }, SEMILLA_COLABORADOR, { expiresIn: '2d' });

const pedir = (cabecera, body = {}) => ({
  headers: cabecera ? { authorization: cabecera } : {},
  body,
  query: {},
  originalUrl: '/v3/delivery/get-mis-pedidos'
});

afterEach(() => {
  delete process.env.AUTH_CLIENTE_MODO;
  delete process.env.SEED_CLIENTE;
  logger.warn.mockReset();
});

describe('arranque', () => {
  it('falla cerrado si enforce no tiene SEED_CLIENTE', () => {
    expect(() => recargar('enforce', false)).toThrow(/SEED_CLIENTE/);
  });

  it('arranca en log aunque falte SEED_CLIENTE', () => {
    expect(() => recargar('log', false)).not.toThrow();
  });

  it('un modo desconocido cae en log', () => {
    expect(cargar('sarasa').modo()).toBe('log');
  });

  it('sin la variable definida el modo es log', () => {
    delete process.env.AUTH_CLIENTE_MODO;
    expect(auth.modo()).toBe('log');
  });
});

describe('modo off', () => {
  it('deja pasar sin token y sin avisar', () => {
    const auth = cargar('off');
    const next = jest.fn();
    const res = mockRes();
    const req = pedir(null, { idcliente: 99 });

    auth.verificarTokenCliente(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(req.cliente).toBeUndefined();
  });
});

describe('modo log', () => {
  it('sin token: avisa con ruta e idcliente y deja pasar', () => {
    const auth = cargar('log');
    const next = jest.fn();
    const res = mockRes();

    auth.verificarTokenCliente(pedir(null, { idcliente: 99 }), res, next);

    expect(next).toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledTimes(1);
    const datos = logger.warn.mock.calls[0][0];
    expect(datos.ruta).toBe('/v3/delivery/get-mis-pedidos');
    expect(datos.idcliente).toBe(99);
    expect(datos.motivo).toBe('sin token');
  });

  it('token invalido: avisa y deja pasar', () => {
    const auth = cargar('log');
    const next = jest.fn();
    auth.verificarTokenCliente(pedir('Bearer no.es.jwt', { idcliente: 99 }), mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(logger.warn.mock.calls[0][0].motivo).toBe('token invalido');
  });

  it('idcliente que no coincide: avisa y deja pasar', () => {
    const auth = cargar('log');
    const next = jest.fn();
    auth.verificarTokenCliente(pedir(`Bearer ${tokenCliente(15)}`, { idcliente: 99 }), mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(logger.warn.mock.calls[0][0].motivo).toBe('idcliente no coincide');
  });

  it('token correcto: pasa sin avisar y deja req.cliente', () => {
    const auth = cargar('log');
    const next = jest.fn();
    const req = pedir(`Bearer ${tokenCliente(15)}`, { idcliente: 15 });

    auth.verificarTokenCliente(req, mockRes(), next);

    expect(next).toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(req.cliente).toEqual({ idcliente: 15 });
  });

  it('nunca escribe el token en el log', () => {
    const auth = cargar('log');
    const token = tokenCliente(15);
    auth.verificarTokenCliente(pedir(`Bearer ${token}`, { idcliente: 99 }), mockRes(), jest.fn());
    expect(JSON.stringify(logger.warn.mock.calls[0][0])).not.toContain(token);
  });
});

describe('modo enforce', () => {
  it('sin token: 401 y no llama a next', () => {
    const auth = cargar('enforce');
    const next = jest.fn();
    const res = mockRes();

    auth.verificarTokenCliente(pedir(null, { idcliente: 15 }), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'no autorizado' });
  });

  it('token invalido, de otra semilla o vencido: 401', () => {
    const auth = cargar('enforce');
    const vencido = jwt.sign({ idcliente: 15, tipo: 'cliente' }, SEMILLA_CLIENTE, { expiresIn: '-1s' });
    ['Bearer no.es.jwt', `Bearer ${tokenCliente(15, 'otra-semilla')}`, `Bearer ${vencido}`].forEach((cabecera) => {
      const res = mockRes();
      const next = jest.fn();
      auth.verificarTokenCliente(pedir(cabecera, { idcliente: 15 }), res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    });
  });

  it('idcliente del body distinto al del token: 403', () => {
    const auth = cargar('enforce');
    const res = mockRes();
    const next = jest.fn();

    auth.verificarTokenCliente(pedir(`Bearer ${tokenCliente(15)}`, { idcliente: 99 }), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'no autorizado' });
  });

  it('token correcto: pasa con req.cliente', () => {
    const auth = cargar('enforce');
    const next = jest.fn();
    const req = pedir(`Bearer ${tokenCliente(15)}`, { idcliente: '15' });

    auth.verificarTokenCliente(req, mockRes(), next);

    expect(next).toHaveBeenCalled();
    expect(req.cliente).toEqual({ idcliente: 15 });
  });

  it('sin idcliente en el body basta con que el token sea valido', () => {
    const auth = cargar('enforce');
    const next = jest.fn();
    const req = pedir(`Bearer ${tokenCliente(15)}`, {});

    auth.verificarTokenCliente(req, mockRes(), next);

    expect(next).toHaveBeenCalled();
    expect(req.cliente).toEqual({ idcliente: 15 });
  });

  it('lee tambien el idcliente del query string', () => {
    const auth = cargar('enforce');
    const res = mockRes();
    const req = { headers: { authorization: tokenCliente(15) }, body: {}, query: { idcliente: '99' }, originalUrl: '/v3/x' };

    auth.verificarTokenCliente(req, res, jest.fn());

    expect(res.statusCode).toBe(403);
  });

  it('acepta el token sin prefijo Bearer', () => {
    const auth = cargar('enforce');
    const next = jest.fn();
    auth.verificarTokenCliente(pedir(tokenCliente(15), { idcliente: 15 }), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('salida para el colaborador', () => {
  it('el JWT de colaborador pasa aunque el idcliente sea de otro (comercio toma el pedido)', () => {
    const auth = cargar('enforce');
    const next = jest.fn();
    const req = pedir(tokenColaborador(), { idcliente: 99 });

    auth.verificarTokenCliente(req, mockRes(), next);

    expect(next).toHaveBeenCalled();
    expect(req.cliente).toBeUndefined();
  });

  it('un token de cliente NO cuenta como colaborador', () => {
    const auth = cargar('enforce');
    expect(auth.esColaborador(tokenCliente(15))).toBe(false);
  });
});

describe('exigirCliente con extractor propio', () => {
  it('lee el idcliente de body.user (user-account-remove)', () => {
    const auth = cargar('enforce');
    const medio = auth.exigirCliente({ idcliente: (req) => (req.body && req.body.user ? req.body.user.idcliente : 0) });
    const res = mockRes();

    medio({ headers: { authorization: tokenCliente(15) }, body: { user: { idcliente: 99 } }, query: {}, originalUrl: '/v3/ini/user-account-remove' }, res, jest.fn());

    expect(res.statusCode).toBe(403);
  });

  it('lee el idcliente de body.dataCalificacion (calificar-servicio)', () => {
    const auth = cargar('enforce');
    const medio = auth.exigirCliente({ idcliente: (req) => (req.body && req.body.dataCalificacion ? req.body.dataCalificacion.idcliente : 0) });
    const next = jest.fn();

    medio({ headers: { authorization: tokenCliente(15) }, body: { dataCalificacion: { idcliente: 15, idpedido: 7 } }, query: {}, originalUrl: '/v3/delivery/calificar-servicio' }, mockRes(), next);

    expect(next).toHaveBeenCalled();
  });
});

describe('salaCliente', () => {
  it('en off devuelve el idcliente pedido tal cual', () => {
    const auth = cargar('off');
    expect(auth.salaCliente('', 99)).toEqual({ idcliente: 99, motivo: null });
  });

  it('en log entra igual pero con motivo', () => {
    const auth = cargar('log');
    expect(auth.salaCliente('', 99)).toEqual({ idcliente: 99, motivo: 'sin token' });
    expect(auth.salaCliente('basura', 99)).toEqual({ idcliente: 99, motivo: 'token invalido' });
    expect(auth.salaCliente(tokenCliente(15), 99)).toEqual({ idcliente: 99, motivo: 'idcliente no coincide' });
  });

  it('en enforce sin token valido no entra a ninguna sala', () => {
    const auth = cargar('enforce');
    expect(auth.salaCliente('', 99)).toEqual({ idcliente: 0, motivo: 'sin token' });
    expect(auth.salaCliente('basura', 99)).toEqual({ idcliente: 0, motivo: 'token invalido' });
    expect(auth.salaCliente(tokenCliente(15), 99)).toEqual({ idcliente: 0, motivo: 'idcliente no coincide' });
  });

  it('con token valido entra a SU sala, aun si no pidio ninguna', () => {
    const auth = cargar('enforce');
    expect(auth.salaCliente(tokenCliente(15), 15)).toEqual({ idcliente: 15, motivo: null });
    expect(auth.salaCliente(tokenCliente(15), 0)).toEqual({ idcliente: 15, motivo: null });
    expect(auth.salaCliente(`Bearer ${tokenCliente(15)}`, '15')).toEqual({ idcliente: 15, motivo: null });
  });
});
```

- [ ] **Step 2: Ejecutar y ver fallar.**

Run: `npx jest test/autentificacion.cliente.test.js`
Expected: FAIL — `Cannot find module '../middleware/autentificacion.cliente'`.

- [ ] **Step 3: Crear `middleware/autentificacion.cliente.js`:**

```js
// Autenticacion del CLIENTE (consumidor). Archivo aparte de autentificacion.js a
// proposito: otro secreto (SEED_CLIENTE), otro tipo de token y un despliegue gradual.
//
// app.js esta bloqueado (trabajo de Yape sin commitear), asi que esto NO se monta como
// middleware global: se aplica por ruta en routes/v3.js y, para el socket, dentro de
// socketsOn en controllers/sockets.js via salaCliente().
const jwt = require('jsonwebtoken');
const { ReE } = require('../service/uitl.service');
const logger = require('../utilitarios/logger');
const tokenCliente = require('../service/token.cliente');
const SEED = require('../_config').SEED;

const MODOS = ['off', 'log', 'enforce'];

// off      = no se mira nada (comportamiento anterior al sprint 5)
// log      = se verifica y se avisa, pero SIEMPRE deja pasar (modo de despliegue)
// enforce  = 401 si falta o es invalido, 403 si el idcliente no coincide
const modo = () => {
	const valor = String(process.env.AUTH_CLIENTE_MODO || 'log').trim().toLowerCase();
	return MODOS.indexOf(valor) !== -1 ? valor : 'log';
};

// Falla cerrado: en enforce sin secreto NINGUN cliente podria autenticarse y todas las
// rutas responderian 401. Es preferible que el proceso no arranque a servir un 401 masivo.
if (modo() === 'enforce' && !process.env.SEED_CLIENTE) {
	throw new Error('AUTH_CLIENTE_MODO=enforce requiere SEED_CLIENTE en el entorno');
}

const aEntero = (valor) => {
	const n = Number(valor);
	return Number.isInteger(n) && n > 0 ? n : 0;
};

const tokenDeLaCabecera = (req) => {
	const cabecera = req && req.headers ? req.headers.authorization : null;
	if (typeof cabecera !== 'string') { return ''; }
	return cabecera.trim();
};

// La misma PWA sirve al cliente y al comercio/mozo. get-direccion-cliente y
// cliente/new-direccion los llama tambien el comercio con el idcliente del cliente que
// atiende (seleccionar-direccion.component.ts:29, agregar-direccion.component.ts:277,
// dialog-direccion-cliente-delivery.component.ts:277 con isFromComercio). Ese trafico
// trae el JWT de colaborador firmado con SEED: se deja pasar sin comparar idcliente,
// exactamente como hoy. Sin esta salida, enforce romperia la toma de pedidos del comercio.
const esColaborador = (token) => {
	if (!token || !SEED) { return false; }
	try {
		const decode = jwt.verify(token.replace(/^Bearer[ ]+/i, ''), SEED);
		return !!(decode && decode.usuario);
	} catch (error) {
		return false;
	}
};

const idClienteDelBody = (req) => {
	const cuerpo = (req && req.body) ? req.body : {};
	const consulta = (req && req.query) ? req.query : {};
	if (cuerpo.idcliente !== undefined && cuerpo.idcliente !== null) { return aEntero(cuerpo.idcliente); }
	if (consulta.idcliente !== undefined && consulta.idcliente !== null) { return aEntero(consulta.idcliente); }
	return 0;
};

// Fabrica del middleware. opciones.idcliente permite leer el id de otro lugar del body:
// user-account-remove manda { user: {...} } y calificar-servicio manda { dataCalificacion: {...} }.
const exigirCliente = (opciones) => {
	const config = opciones || {};
	const leerIdcliente = typeof config.idcliente === 'function' ? config.idcliente : idClienteDelBody;

	return (req, res, next) => {
		const modoActual = modo();
		if (modoActual === 'off') { return next(); }

		const token = tokenDeLaCabecera(req);
		const ruta = req.originalUrl || req.url || '';
		const pedido = aEntero(leerIdcliente(req));

		if (esColaborador(token)) { return next(); }

		const verificado = tokenCliente.verificar(token);

		if (!verificado) {
			// Nunca se loguea el token, solo el motivo y el idcliente pedido.
			logger.warn({ ruta, motivo: token ? 'token invalido' : 'sin token', idcliente: pedido }, 'auth cliente');
			if (modoActual === 'enforce') { return ReE(res, 'no autorizado', 401); }
			return next();
		}

		if (pedido > 0 && pedido !== verificado.idcliente) {
			logger.warn({ ruta, motivo: 'idcliente no coincide', idcliente: pedido, idclienteToken: verificado.idcliente }, 'auth cliente');
			if (modoActual === 'enforce') { return ReE(res, 'no autorizado', 403); }
			return next();
		}

		// Fuente de verdad para los handlers que quieran dejar de confiar en req.body.idcliente.
		req.cliente = { idcliente: verificado.idcliente };
		return next();
	};
};

// Decide a que sala cliente_<id> puede unirse un socket. idcliente 0 = no se une a ninguna.
// Es una funcion pura para poder probarla sin levantar socket.io.
const salaCliente = (token, idclientePedido) => {
	const modoActual = modo();
	const pedido = aEntero(idclientePedido);
	if (modoActual === 'off') { return { idcliente: pedido, motivo: null }; }

	const verificado = tokenCliente.verificar(token);
	if (verificado && (pedido === 0 || pedido === verificado.idcliente)) {
		return { idcliente: verificado.idcliente, motivo: null };
	}

	const motivo = !token ? 'sin token' : (!verificado ? 'token invalido' : 'idcliente no coincide');
	if (modoActual === 'enforce') { return { idcliente: 0, motivo }; }
	return { idcliente: pedido, motivo };
};

module.exports = {
	verificarTokenCliente: exigirCliente(),
	exigirCliente,
	salaCliente,
	modo,
	esColaborador,
	tokenDeLaCabecera,
	idClienteDelBody
};
```

- [ ] **Step 4: Ejecutar el spec.**

Run: `npx jest test/autentificacion.cliente.test.js`
Expected: PASS, 25 specs, 0 failures.

- [ ] **Step 5: Comprobar que el arranque en `enforce` sin secreto realmente tumba el proceso.**

Run: `node -e "process.env.AUTH_CLIENTE_MODO='enforce'; delete process.env.SEED_CLIENTE; try { require('./middleware/autentificacion.cliente'); console.log('MAL: no fallo'); } catch (e) { console.log('OK:', e.message); }"`
Expected: `OK: AUTH_CLIENTE_MODO=enforce requiere SEED_CLIENTE en el entorno`.

- [ ] **Step 6: Commit.** Escribir `.superpowers/sdd/2026-09-10-sprint5-auth-cliente/commit-msg-task-2.txt`:

```
feat: middleware verificarTokenCliente con modos off, log y enforce

Nuevo middleware/autentificacion.cliente.js, separado de autentificacion.js
porque usa otro secreto y otro despliegue. Lee Authorization con o sin prefijo
Bearer, deja el idcliente verificado en req.cliente y se comporta segun
AUTH_CLIENTE_MODO: off pasa, log verifica y avisa por logger.warn pero deja
pasar, enforce responde 401 cuando falta o es invalido y 403 cuando el idcliente
del body o del query no coincide con el del token. En enforce sin SEED_CLIENTE el
modulo lanza al cargarse: falla cerrado antes que servir 401 a todo el mundo.

Se acepta ademas el JWT de colaborador firmado con SEED sin comparar idcliente:
la misma PWA sirve al comercio, que consulta y guarda direcciones del cliente que
atiende (isFromComercio / idClienteBuscar). Sin esa salida, enforce romperia la
toma de pedidos desde el comercio.

salaCliente() es la misma decision para el socket, como funcion pura, para poder
probarla sin levantar socket.io. Los logs llevan ruta, motivo e idcliente; nunca
el token.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
```

Luego:
```
git add middleware/autentificacion.cliente.js test/autentificacion.cliente.test.js
git commit -F .superpowers/sdd/2026-09-10-sprint5-auth-cliente/commit-msg-task-2.txt
```

---

### Task 3: Backend: emitir el token en los tres momentos de identificación

**Qué cierra del dossier:** §2 ("los tres momentos en que el backend sabe quién es el dispositivo... en los tres devuelve un entero, no una prueba"), §7 pieza 3.

**Files (backend):**
- Modify: `controllers/apiPwa_v1.js` (`setRegisterClienteLogin`, líneas 867-878)
- Modify: `controllers/apiDelivery.js` (`verificarCodigoSMS`, líneas 159-176)
- Modify: `controllers/sockets.js` (el `responder` de `nuevoPedido`, líneas 677-684)
- Test: `test/token.cliente.emision.test.js`

**Interfaces:**
- Consumes: `service/token.cliente.js` (Task 1).
- Produces (contrato de red, lo consumen las Tasks 6 y 7 en la app):
  - `POST /v3/ini/register-cliente-login` → `{ success:true, data:[{ idcliente, nombres, telefono, ... }], tokenCliente: '<jwt>' | '' }`
  - `POST /v3/delivery/verificar-codigo-sms` → `{ success:true, data:[{ response: 0|1 }], tokenCliente: '<jwt>' | '' }` (el token solo cuando `response === 1`)
  - socket `nuevoPedido` ack → `[{ idpedido, idcliente, tokenCliente, ... }, ...]` (el token dentro de la **primera fila**, no en un envelope: ahí no hay envelope)
- Nota de compatibilidad: los tres campos son **añadidos**; ninguna forma existente cambia. Una app vieja los ignora.

- [ ] **Step 1: Escribir el spec (falla).** Crear `test/token.cliente.emision.test.js`:

```js
jest.mock('../config/database', () => ({ sequelize: {}, Sequelize: {}, QueryTypes: {} }));
jest.mock('../service/query.service.v1', () => ({ ejecutarProcedimiento: jest.fn(), ejecutarConsulta: jest.fn() }));
jest.mock('../service/estado-pedido.service', () => ({ leerEstado: jest.fn(), setIo: jest.fn() }));
jest.mock('../utilitarios/logger', () => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

const SEMILLA = 'semilla-cliente-de-prueba-sprint5';
process.env.SEED_CLIENTE = SEMILLA;

const QueryServiceV1 = require('../service/query.service.v1');
const tokenClienteService = require('../service/token.cliente');
const { setRegisterClienteLogin } = require('../controllers/apiPwa_v1');
const { verificarCodigoSMS } = require('../controllers/apiDelivery');

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('setRegisterClienteLogin', () => {
  beforeEach(() => { QueryServiceV1.ejecutarProcedimiento.mockReset(); });

  it('devuelve tokenCliente para el idcliente que asigno el procedimiento', async () => {
    QueryServiceV1.ejecutarProcedimiento.mockResolvedValue([{ idcliente: 15, nombres: 'Ana' }]);
    const res = mockRes();

    await setRegisterClienteLogin({ body: { datalogin: { name: 'Ana' } } }, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual([{ idcliente: 15, nombres: 'Ana' }]);
    expect(tokenClienteService.verificar(payload.tokenCliente)).toEqual({ idcliente: 15 });
  });

  it('responde tokenCliente vacio si el procedimiento no devolvio idcliente', async () => {
    QueryServiceV1.ejecutarProcedimiento.mockResolvedValue([{ nombres: 'Ana' }]);
    const res = mockRes();

    await setRegisterClienteLogin({ body: { datalogin: {} } }, res);

    expect(res.json.mock.calls[0][0].tokenCliente).toBe('');
  });

  it('responde tokenCliente vacio si el procedimiento fallo', async () => {
    QueryServiceV1.ejecutarProcedimiento.mockResolvedValue(false);
    const res = mockRes();

    await setRegisterClienteLogin({ body: {} }, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.data).toEqual([]);
    expect(payload.tokenCliente).toBe('');
  });
});

describe('verificarCodigoSMS', () => {
  beforeEach(() => { QueryServiceV1.ejecutarProcedimiento.mockReset(); });

  const cuerpo = { idcliente: '15', numberphone: '987654321', codigo: '1234' };

  it('emite el token solo cuando response es 1', async () => {
    QueryServiceV1.ejecutarProcedimiento.mockResolvedValue([{ response: 1 }]);
    const res = mockRes();

    await verificarCodigoSMS({ body: cuerpo }, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.data).toEqual([{ response: 1 }]);
    expect(tokenClienteService.verificar(payload.tokenCliente)).toEqual({ idcliente: 15 });
  });

  it('con response 0 no emite token', async () => {
    QueryServiceV1.ejecutarProcedimiento.mockResolvedValue([{ response: 0 }]);
    const res = mockRes();

    await verificarCodigoSMS({ body: cuerpo }, res);

    expect(res.json.mock.calls[0][0].tokenCliente).toBe('');
  });

  it('un codigo mal formado sigue siendo 400 y no emite nada', async () => {
    const res = mockRes();
    await verificarCodigoSMS({ body: { idcliente: 15, numberphone: '987654321', codigo: 'abcd' } }, res);
    expect(res.statusCode).toBe(400);
    expect(QueryServiceV1.ejecutarProcedimiento).not.toHaveBeenCalled();
  });
});

describe('ack de nuevoPedido (conTokenCliente)', () => {
  it('el ack lleva el token en la primera fila junto al idcliente', () => {
    const rpt = [{ idpedido: 77, idcliente: 15 }, { print: 'ticket' }];
    const ack = tokenClienteService.conTokenCliente(rpt);

    expect(ack[0].idpedido).toBe(77);
    expect(tokenClienteService.verificar(ack[0].tokenCliente)).toEqual({ idcliente: 15 });
    expect(rpt[0].tokenCliente).toBeUndefined();
  });

  it('un ack en false (pedido no guardado) sigue siendo false', () => {
    expect(tokenClienteService.conTokenCliente(false)).toBe(false);
  });
});
```

- [ ] **Step 2: Ejecutar y ver fallar.**

Run: `npx jest test/token.cliente.emision.test.js`
Expected: FAIL — `expected undefined to equal { idcliente: 15 }` en el primer bloque (los handlers aún no devuelven `tokenCliente`).

- [ ] **Step 3: Emitir en `ini/register-cliente-login`.** En `controllers/apiPwa_v1.js`, añadir el require junto a los demás del principio del archivo (después de `const QueryServiceV1 = require('../service/query.service.v1');`):

```js
const tokenClienteService = require('../service/token.cliente');
```

Y reemplazar el cuerpo de `setRegisterClienteLogin` (líneas 867-878) por:

```js
const setRegisterClienteLogin = async function (req, res) {
	// const idorg = req.body.idorg;
	const dataLogin = req.body;

    const query = `call procedure_pwa_register_cliente_login(?);`;
    const rows = await QueryServiceV1.ejecutarProcedimiento(query, [JSON.stringify(dataLogin)], 'setRegisterClienteLogin');

    // Sprint 5: aqui es donde el backend establece la identidad del dispositivo (Auth0,
    // nativo o invitado). Se emite el token de sesion del cliente en un campo aparte del
    // envelope: una app vieja lo ignora y sigue leyendo data[0].idcliente como siempre.
    const tokenCliente = tokenClienteService.emitir(rows && rows[0] ? rows[0].idcliente : 0);

    return ReS(res, { data: rows || [], tokenCliente: tokenCliente || '' });
}
module.exports.setRegisterClienteLogin = setRegisterClienteLogin;
```

- [ ] **Step 4: Emitir en `delivery/verificar-codigo-sms`.** En `controllers/apiDelivery.js`, añadir el require junto a los del principio (después de `const QueryServiceV1 = require('../service/query.service.v1');`):

```js
const tokenClienteService = require('../service/token.cliente');
```

Y reemplazar las tres últimas líneas del cuerpo de `verificarCodigoSMS` (líneas 172-174: la plantilla del `call`, la llamada a `ejecutarProcedimiento` y el `return ReS`) por:

```js
	const query = `call porcedure_pwa_update_phono_sms_cliente(?,?,?);`;
	const rows = await QueryServiceV1.ejecutarProcedimiento(query, [idcliente, numberphone, codigo], 'verificarCodigoSMS');

	// Sprint 5: el codigo correcto es la prueba de que el telefono es suyo, asi que aqui
	// tambien queda establecida la identidad. Solo con response === 1.
	const aprobado = Array.isArray(rows) && rows[0] && Number(rows[0].response) === 1;
	const tokenCliente = aprobado ? tokenClienteService.emitir(idcliente) : null;

	return ReS(res, { data: rows || [], tokenCliente: tokenCliente || '' });
```

No se toca la validación de arriba (líneas 160-170): `idcliente > 0`, teléfono `[0-9]{6,15}` y código `[0-9]{4,8}` siguen igual.

- [ ] **Step 5: Emitir en el ack del socket `nuevoPedido`.** En `controllers/sockets.js`, añadir el require junto a los del principio (después de `const QueryServiceV1 = require('../service/query.service.v1');`, línea 17):

```js
const tokenClienteService = require('../service/token.cliente');
```

Y reemplazar el `responder` de `nuevoPedido` (líneas 680-684) por:

```js
			// responde por ack (callback) y por evento; el ack es lo que usa la app mozo
			const responder = (rpt) => {
				// Sprint 5: si el guardado devolvio idcliente (el SP puede reasignarlo), se
				// adjunta el token de sesion del cliente en esa misma fila. conTokenCliente
				// devuelve una copia y tolera false / [] / filas sin idcliente.
				const respuesta = tokenClienteService.conTokenCliente(rpt);
				io.to(socket.id).emit('nuevoPedidoRes', respuesta);
				if ( callback ) { callback(respuesta); }
			};
```

**No** se toca la línea 758 (`dataSend.dataPedido.idpedido = rpt[0].idpedido;`): sigue leyendo el `rpt` original, que no cambió.

- [ ] **Step 6: Ejecutar el spec y la regresión de los tests que ya existen sobre estos handlers.**

Run: `npx jest test/token.cliente.emision.test.js test/apiDelivery.getMisPedido.test.js test/nuevoPedido.test.js`
Expected: PASS en los tres. Si `nuevoPedido.test.js` afirma sobre la forma exacta del ack, actualizar la aserción para aceptar el campo `tokenCliente` añadido; NO relajar ninguna otra aserción.

- [ ] **Step 7: Comprobar que no quedó ningún punto de identificación sin token.**

Run: `Select-String -Path controllers/apiPwa_v1.js,controllers/apiDelivery.js,controllers/sockets.js -Pattern "tokenClienteService"`
Expected: seis coincidencias — tres `require` y tres usos (`emitir`, `emitir`, `conTokenCliente`).

- [ ] **Step 8: Commit.** Escribir `.superpowers/sdd/2026-09-10-sprint5-auth-cliente/commit-msg-task-3.txt`:

```
feat: emitir tokenCliente en los tres momentos en que se establece la identidad

register-cliente-login (Auth0, nativo e invitado), verificar-codigo-sms cuando el
codigo es correcto, y el ack del socket nuevoPedido cuando el procedimiento
reasigna el idcliente. Los tres ya devolvian el idcliente y ahora devuelven
ademas la prueba de que ese idcliente es suyo.

El campo se agrega sin cambiar ninguna forma existente: tokenCliente al lado de
data en las dos respuestas HTTP y dentro de la primera fila en el ack del socket,
que no tiene envelope. Una app vieja ignora el campo y sigue funcionando igual.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
```

Luego:
```
git add controllers/apiPwa_v1.js controllers/apiDelivery.js controllers/sockets.js test/token.cliente.emision.test.js
git commit -F .superpowers/sdd/2026-09-10-sprint5-auth-cliente/commit-msg-task-3.txt
```

---

### Task 4: Backend: aplicar el middleware a las rutas de cliente y borrar el código muerto

**Qué cierra del dossier:** §4 completo (inventario de endpoints sin autenticar), anexo (`push/send-notification` sin llamadores, `TOKEN_SMS` / `verificarTokenSms` / `sendMsjConfirmacion` muertos), §7 piezas 5 y 10.

**Files (backend):**
- Modify: `routes/v3.js`
- Modify: `controllers/sendMsj.js` (borrar `sendPushNotificaction`, líneas 320-387; borrar `sendMsjConfirmacion`, líneas 47-76)
- Modify: `middleware/autentificacion.js` (borrar `verificarTokenSms`, líneas 44-56)
- Test: `test/auth.cliente.rutas.test.js`

**Interfaces:**
- Consumes: `middleware/autentificacion.cliente.js` (Task 2).
- Produces: las rutas de la tabla de abajo pasan a exigir (según modo) el token de cliente. `DELETE` de `POST /v3/push/send-notification`, `POST /v3/delivery/send-sms-confirmation-out` y de la línea comentada `POST /v3/delivery/send-sms-confirmation`.

**Rutas que se protegen** (líneas de `routes/v3.js` **antes** de esta tarea; el handler es donde se lee el `idcliente` ajeno):

| # | Prioridad | Ruta | routes/v3.js | Handler | Dónde viaja el idcliente |
|---|---|---|---|---|---|
| 1 | P0 | `POST /cliente/perfil` | 136 | `apiPwa_v1.js:975-996` | `body.idcliente` |
| 2 | P0 | `POST /cliente/perfil-save` | 137 | `apiPwa_v1.js:998-1019` | `body.idcliente` |
| 3 | P0 | `POST /cliente/new-direccion` | 138 | `apiPwa_v1.js:1022-1053` | `body.idcliente` |
| 4 | P0 | `POST /delivery/get-direccion-cliente` | 150 | `apiDelivery.js:105-128` | `body.idcliente` |
| 5 | P0 | `POST /delivery/get-mis-pedidos` | 152 | `apiDelivery.js:131-143` | `body.idcliente` |
| 6 | P0 | `POST /delivery/get-estado-pedido` | 153 | `apiDelivery.js:146-154` | `body.idcliente` |
| 7 | P0 | `POST /push/suscripcion` | 187 | `sendMsj.js:270-318` | `body.idcliente` |
| 8 | P0 | `POST /push/send-notification` | 188 | `sendMsj.js:321-387` | **se borra** (cero llamadores) |
| 9 | P1 | `POST /pedido/lacuenta-cliente` | 105 | `apiPwa_v1.js:693-705` | `body.idcliente` |
| 10 | P1 | `POST /pedido/lacuenta-cliente-totales` | 106 | `apiPwa_v1.js:709-722` | `body.idcliente` |
| 11 | P1 | `POST /pedido/set-datos-facturacion-cliente` | 112 | `apiPwa_v1.js:790-799` | `body.idcliente` (lo manda `datos-facturacion-cliente.component.ts:94`) |
| 12 | P1 | `POST /ini/user-account-remove` | 133 | `apiPwa_v1.js:1404-1422` | `body.user.idcliente` (extractor propio) |
| 13 | P1 | `POST /transaction/registrar-pago` | 144 | `apiPago.js:29-53` | `body.idcliente` |
| 14 | P1 | `POST /delivery/calificar-servicio` | 154 | `apiDelivery.js:179-190` | `body.dataCalificacion.idcliente` (extractor propio) |

**Rutas que NO se protegen, y por qué** (dejarlo escrito evita que alguien las "complete" después sin pensar):

| Ruta | routes/v3.js | Motivo |
|---|---|---|
| `POST /ini/register-cliente-login` | 132 | Es uno de los tres emisores del token. |
| `POST /delivery/verificar-codigo-sms` | 164 | Es uno de los tres emisores del token. |
| `POST /ini/login-cliente-dni` | 101 | Parte del registro/login; no recibe `idcliente`. |
| `POST /delivery/search-cliente-by-phone` y `-pwaid` | 179, 180 | Los llama `dialog-verificar-telefono.component.ts:189` **antes** de que exista identidad. Enumeración por teléfono: deuda declarada en la nota de rollout. |
| `POST /delivery/get-cliente-telefono-chatbot` | 181 | Lo llama `verify-auth-client.service.ts:463` en el enlace del chatbot, antes de la identidad. Recibe un id de chat, no un `idcliente`. Deuda declarada. |
| `POST /pedido/lacuenta-pedido-totales` | 107 | Se consulta por `idpedido`, no por `idcliente`. |
| Carta / menú / establecimientos / promos / categorías | 98-103, 147-149, 155-160 | Públicos por diseño. |

- [ ] **Step 1: Confirmar con grep que el código a borrar no tiene llamadores vivos.** Los tres greps van en el commit como justificación; si alguno devuelve un llamador vivo, **no borrar** y anotarlo.

Backend (desde `D:\Projects\backend-pedidos`):
Run: `Select-String -Path *.js,routes/*.js,controllers/*.js,service/*.js,middleware/*.js -Pattern "sendPushNotificaction\b|verificarTokenSms|sendMsjConfirmacion"`
Expected: solo las definiciones y los registros de ruta que esta tarea va a borrar — `routes/v3.js:165,166,188`, `controllers/sendMsj.js:48,76,321,364,382,387`, `middleware/autentificacion.js:44,47`. Ninguna llamada interna desde otro módulo.

App (desde `D:\Projects\capacitor\pwa-app-pedido`):
Run: `Select-String -Path src -Recurse -Pattern "send-notification|send-sms-confirmation"`
Expected: una sola coincidencia, `src/app/componentes/dialog-verificar-telefono/dialog-verificar-telefono.component.ts:113`, que apunta a `delivery/send-sms-confirmation` — **ruta que hoy no existe** (`routes/v3.js:165` está comentada), o sea un 404 silencioso. La Task 7 la retira del lado de la app.

- [ ] **Step 2: Añadir el require del middleware en `routes/v3.js`.** Justo debajo de la línea 22 (`const auth = require('../middleware/autentificacion');`):

```js
const authCliente = require('../middleware/autentificacion.cliente');
```

- [ ] **Step 3: Proteger las rutas de `pedido/` y `ini/`.** Reemplazar las líneas 105-106 por:

```js
routerV3.post('/pedido/lacuenta-cliente', authCliente.verificarTokenCliente, apiPwaAppPedidos.getLaCuentaFromCliente);
routerV3.post('/pedido/lacuenta-cliente-totales', authCliente.verificarTokenCliente, apiPwaAppPedidos.getLaCuentaFromClienteTotales);
```

Reemplazar la línea 112 por:

```js
routerV3.post('/pedido/set-datos-facturacion-cliente', authCliente.verificarTokenCliente, apiPwaAppPedidos.setDatosFacturacionClientePwa);
```

Reemplazar la línea 133 por (el body es `{ user: {...} }`, no `{ idcliente }`):

```js
// el body es { user: {...} }: el idcliente sale de ahi, no de body.idcliente
routerV3.post('/ini/user-account-remove', authCliente.exigirCliente({ idcliente: (req) => (req.body && req.body.user ? req.body.user.idcliente : 0) }), apiPwaAppPedidos.setUserAccountRemove);
```

- [ ] **Step 4: Proteger el perfil y las direcciones del cliente.** Reemplazar las líneas 135-138 por:

```js
// cliente profile
routerV3.post('/cliente/perfil', authCliente.verificarTokenCliente, apiPwaAppPedidos.getClientePerfil);
routerV3.post('/cliente/perfil-save', authCliente.verificarTokenCliente, apiPwaAppPedidos.setClientePerfil);
routerV3.post('/cliente/new-direccion', authCliente.verificarTokenCliente, apiPwaAppPedidos.setClienteNewDireccion);
```

- [ ] **Step 5: Proteger el pago.** Reemplazar la línea 144 por:

```js
routerV3.post('/transaction/registrar-pago', authCliente.verificarTokenCliente, apiPwaAppPedidosPago.setRegistrarPago);
```

- [ ] **Step 6: Proteger delivery.** Reemplazar la línea 150 por:

```js
routerV3.post('/delivery/get-direccion-cliente', authCliente.verificarTokenCliente, apiPwaAppDelivery.getDireccionCliente);
```

Reemplazar las líneas 151-154 por (se conservan los dos `rateLimit` tal cual):

```js
// consultas de seguimiento: token de cliente (ver AUTH_CLIENTE_MODO) + limite de abuso por IP
routerV3.post('/delivery/get-mis-pedidos', rateLimit(30, 60000), authCliente.verificarTokenCliente, apiPwaAppDelivery.getMisPedido);
routerV3.post('/delivery/get-estado-pedido', rateLimit(60, 60000), authCliente.verificarTokenCliente, apiPwaAppDelivery.getEstadoPedido);
// el idcliente viaja dentro de dataCalificacion
routerV3.post('/delivery/calificar-servicio', authCliente.exigirCliente({ idcliente: (req) => (req.body && req.body.dataCalificacion ? req.body.dataCalificacion.idcliente : 0) }), apiPwaAppDelivery.setCalificarServicio);
```

- [ ] **Step 7: Borrar las dos rutas muertas de SMS.** Borrar por completo las líneas 165 y 166:

```js
// routerV3.post('/delivery/send-sms-confirmation', auth.verificarTokenSms, apiPwaSMS.sendMsjConfirmacion);
routerV3.post('/delivery/send-sms-confirmation-out', apiPwaSMS.sendMsjConfirmacion);
```

(La 165 está comentada desde hace tiempo y la 166 apunta a un handler cuyo cuerpo está entero comentado: nunca responde, la petición se cuelga hasta el timeout. El OTP real va por WhatsApp vía socket, `sockets.js:165-175`.)

- [ ] **Step 8: Proteger `push/suscripcion` y borrar `push/send-notification`.** Reemplazar las líneas 185-190 por:

```js
// notificaciones push
// guardar suscripcion
routerV3.post('/push/suscripcion', rateLimit(10, 60000), authCliente.verificarTokenCliente, apiPwaSMS.pushSuscripcion);
// push/send-notification borrado en el sprint 5: enviaba req.body.notification arbitrario a un
// cliente o a codigos postales enteros (phishing con la marca) y ninguna pantalla lo llamaba.
// app mozo: token FCM del dispositivo (set/del)
routerV3.post('/mozo/push-token', auth.verificarToken, pushMozo.setPushToken);
```

- [ ] **Step 9: Borrar `sendPushNotificaction` de `controllers/sendMsj.js`.** Borrar el bloque completo de las líneas 320-387 (desde el comentario `// envia notificacion a los usuario filtrados` hasta `module.exports.sendPushNotificaction = sendPushNotificaction;`, ambos inclusive). **No** tocar `sendPushNotificactionComercio` (391) ni ninguna de las funciones de repartidor que vienen después.

- [ ] **Step 10: Borrar `sendMsjConfirmacion` de `controllers/sendMsj.js`.** Borrar el bloque de las líneas 47-76 (desde el comentario `// sms mensaje de confirmacion de telefono` hasta `module.exports.sendMsjConfirmacion = sendMsjConfirmacion;`, ambos inclusive). Todo su cuerpo ya estaba comentado.

- [ ] **Step 11: Borrar `verificarTokenSms` de `middleware/autentificacion.js`.** Borrar las líneas 44-56 (la función entera). Dejar además `SEED_SMS` sin uso: borrar también las líneas 4 y 6:

```js
// const SEED_SMS = require('../config').SEED_SMS;
const SEED_SMS = require('../_config').SEED_SMS;
```

El archivo queda solo con `verificarToken` y `validarTokenExperidado`. **No** se toca `_config.js:56` (`config.SEED_SMS`): ahí no molesta y borrarlo obliga a tocar `config.js`, que es local y no versionado.

- [ ] **Step 12: Escribir el spec de una ruta protegida encadenando middleware + handler.** Crear `test/auth.cliente.rutas.test.js`:

```js
jest.mock('../config/database', () => ({ sequelize: {}, Sequelize: {}, QueryTypes: {} }));
jest.mock('../service/query.service.v1', () => ({ ejecutarProcedimiento: jest.fn(), ejecutarConsulta: jest.fn() }));
jest.mock('../service/estado-pedido.service', () => ({ leerEstado: jest.fn(), setIo: jest.fn() }));
jest.mock('../utilitarios/logger', () => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }));
jest.mock('../_config', () => ({ SEED: 'semilla-colaborador-de-prueba', SEED_SMS: 'x' }));

const jwt = require('jsonwebtoken');
const SEMILLA = 'semilla-cliente-de-prueba-sprint5';

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

// Encadena como lo hace Express: middleware -> handler. El middleware es sincrono,
// asi que basta con anotar si llamo a next y, si lo hizo, ejecutar el handler despues.
async function llamar(modo, cabecera, body) {
  jest.resetModules();
  process.env.AUTH_CLIENTE_MODO = modo;
  process.env.SEED_CLIENTE = SEMILLA;

  const QueryServiceV1 = require('../service/query.service.v1');
  QueryServiceV1.ejecutarProcedimiento.mockReset();
  QueryServiceV1.ejecutarProcedimiento.mockResolvedValue([{ idpedido: 1, importe: 30 }]);

  const logger = require('../utilitarios/logger');
  logger.warn.mockReset();

  const authCliente = require('../middleware/autentificacion.cliente');
  const { getMisPedido } = require('../controllers/apiDelivery');

  const req = { headers: cabecera ? { authorization: cabecera } : {}, body, query: {}, originalUrl: '/v3/delivery/get-mis-pedidos' };
  const res = mockRes();

  let siguio = false;
  authCliente.verificarTokenCliente(req, res, () => { siguio = true; });
  if (siguio) { await getMisPedido(req, res); }

  return { req, res, siguio, QueryServiceV1, logger };
}

const token = (idcliente) => `Bearer ${jwt.sign({ idcliente, tipo: 'cliente' }, SEMILLA, { expiresIn: '180d' })}`;

afterEach(() => {
  delete process.env.AUTH_CLIENTE_MODO;
  delete process.env.SEED_CLIENTE;
});

describe('delivery/get-mis-pedidos protegida', () => {
  it('modo log: sin token responde 200 igual que antes y deja el aviso', async () => {
    const { res, siguio, QueryServiceV1, logger } = await llamar('log', null, { idcliente: 99 });
    expect(siguio).toBe(true);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(QueryServiceV1.ejecutarProcedimiento).toHaveBeenCalledWith(expect.any(String), [99], 'getMisPedido');
    expect(logger.warn).toHaveBeenCalled();
  });

  it('modo enforce: sin token responde 401 y no toca la base', async () => {
    const { res, siguio, QueryServiceV1 } = await llamar('enforce', null, { idcliente: 99 });
    expect(siguio).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'no autorizado' });
    expect(QueryServiceV1.ejecutarProcedimiento).not.toHaveBeenCalled();
  });

  it('modo enforce: token de otro cliente responde 403 y no toca la base', async () => {
    const { res, siguio, QueryServiceV1 } = await llamar('enforce', token(15), { idcliente: 99 });
    expect(siguio).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(QueryServiceV1.ejecutarProcedimiento).not.toHaveBeenCalled();
  });

  it('modo enforce: token propio responde los pedidos y deja req.cliente', async () => {
    const { req, res, QueryServiceV1 } = await llamar('enforce', token(15), { idcliente: 15 });
    expect(req.cliente).toEqual({ idcliente: 15 });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(QueryServiceV1.ejecutarProcedimiento).toHaveBeenCalledWith(expect.any(String), [15], 'getMisPedido');
  });
});
```

- [ ] **Step 13: Ejecutar los tests del backend completos.**

Run: `npx jest test/auth.cliente.rutas.test.js test/autentificacion.cliente.test.js test/token.cliente.test.js test/token.cliente.emision.test.js test/apiDelivery.getMisPedido.test.js`
Expected: PASS en los cinco.

- [ ] **Step 14: Comprobar que el router carga y que las rutas muertas ya no existen.**

Run: `node -e "process.env.AUTH_CLIENTE_MODO='log'; require('./routes/v3.js'); console.log('router OK');"`
Expected: `router OK` (sin excepción). Si falla por una conexión a base, anotar el error textual: significa que `routes/v3.js` arrastra un módulo que abre conexión al cargarse, y entonces esta comprobación se hace en el arranque real del Step 15.

Run: `Select-String -Path routes/v3.js -Pattern "send-notification|send-sms-confirmation|verificarTokenSms"`
Expected: sin resultados.

Run: `Select-String -Path routes/v3.js -Pattern "authCliente" | Measure-Object | Select-Object -ExpandProperty Count`
Expected: `14` — 1 `require` + 13 rutas protegidas (11 con `verificarTokenCliente` y 2 con `exigirCliente`). Son 13 y no 14 porque la fila 8 de la tabla, `push/send-notification`, se borra en vez de protegerse.

- [ ] **Step 15: Arrancar el backend en modo `log` y ver que sirve.**

Run: `node -e "require('dotenv').config(); console.log('AUTH_CLIENTE_MODO =', process.env.AUTH_CLIENTE_MODO, '| SEED_CLIENTE presente:', !!process.env.SEED_CLIENTE);"`
Expected: `AUTH_CLIENTE_MODO = log | SEED_CLIENTE presente: true`. (Nunca imprimir el valor.)

- [ ] **Step 16: Commit.** Escribir `.superpowers/sdd/2026-09-10-sprint5-auth-cliente/commit-msg-task-4.txt`:

```
feat: exigir el token de cliente en las rutas de perfil, direcciones, pedidos y push

Se aplica verificarTokenCliente a las catorce rutas que tomaban el idcliente del
body sin ninguna prueba: cliente/perfil, cliente/perfil-save,
cliente/new-direccion, delivery/get-direccion-cliente, delivery/get-mis-pedidos,
delivery/get-estado-pedido, delivery/calificar-servicio, push/suscripcion,
pedido/lacuenta-cliente, pedido/lacuenta-cliente-totales,
pedido/set-datos-facturacion-cliente, ini/user-account-remove y
transaction/registrar-pago. Con AUTH_CLIENTE_MODO=log el comportamiento no
cambia: solo quedan avisos en el log.

user-account-remove y calificar-servicio usan un extractor propio porque el
idcliente viaja dentro de user y de dataCalificacion. Los rate limit por IP de
get-mis-pedidos y get-estado-pedido se conservan.

Se borra push/send-notification con su handler: enviaba notificaciones
arbitrarias a un cliente o a codigos postales enteros y ninguna pantalla lo
llamaba. Se borran tambien las dos rutas de send-sms-confirmation, el handler
sendMsjConfirmacion (con el cuerpo entero comentado, jamas respondia) y
verificarTokenSms con su SEED_SMS: el OTP real va por WhatsApp via socket.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
```

Luego:
```
git add routes/v3.js controllers/sendMsj.js middleware/autentificacion.js test/auth.cliente.rutas.test.js
git commit -F .superpowers/sdd/2026-09-10-sprint5-auth-cliente/commit-msg-task-4.txt
```

---

### Task 5: Backend: salas del socket por token, no por el entero del handshake

**Qué cierra del dossier:** §5 completo (`sockets.js:119-126`, "cualquiera se une a la sala de cualquier cliente"; el `io.use` comentado en 87-93), §7 pieza 7.

**Files (backend):**
- Modify: `controllers/sockets.js` (líneas 118-126, dentro del handler de `connection`)
- Test: `test/auth.cliente.socket.test.js`

**Interfaces:**
- Consumes: `authCliente.salaCliente(token, idclientePedido)` (Task 2).
- Consumes (handshake): `socket.handshake.query.tokenCliente` — lo produce la Task 7 en `socket.service.ts`.
- Produces (protocolo `join-cliente`): el handler acepta **dos formas**:
  - `socket.emit('join-cliente', 15)` — app vieja, número suelto; usa el token del handshake.
  - `socket.emit('join-cliente', { idcliente: 15, tokenCliente: '<jwt>' })` — app nueva; el token del payload gana y queda guardado en el socket para los `join` siguientes.
- Produces: `socket.idclienteToken` = idcliente verificado (0 si no hay), para quien lo necesite después.

- [ ] **Step 1: Escribir el spec (falla).** Crear `test/auth.cliente.socket.test.js`. Prueba la decisión pura y el contrato de las dos formas del payload, sin levantar socket.io:

```js
jest.mock('../utilitarios/logger', () => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }));
jest.mock('../_config', () => ({ SEED: 'semilla-colaborador-de-prueba', SEED_SMS: 'x' }));

const jwt = require('jsonwebtoken');
const SEMILLA = 'semilla-cliente-de-prueba-sprint5';

function cargar(modo) {
  jest.resetModules();
  process.env.AUTH_CLIENTE_MODO = modo;
  process.env.SEED_CLIENTE = SEMILLA;
  return require('../middleware/autentificacion.cliente');
}

const token = (idcliente) => jwt.sign({ idcliente, tipo: 'cliente' }, SEMILLA, { expiresIn: '180d' });

afterEach(() => {
  delete process.env.AUTH_CLIENTE_MODO;
  delete process.env.SEED_CLIENTE;
});

// Copia exacta de la lectura del payload que hace sockets.js en join-cliente.
// Si cambia alla, tiene que cambiar aca.
function leerPayloadJoin(payload, tokenHandshake) {
  const esObjeto = payload && typeof payload === 'object';
  return {
    idcliente: esObjeto ? payload.idcliente : payload,
    token: (esObjeto && payload.tokenCliente) ? payload.tokenCliente : tokenHandshake
  };
}

describe('join-cliente: formas del payload', () => {
  it('app vieja: numero suelto, usa el token del handshake', () => {
    expect(leerPayloadJoin(15, 'tk-handshake')).toEqual({ idcliente: 15, token: 'tk-handshake' });
  });

  it('app nueva: objeto, el token del payload gana', () => {
    expect(leerPayloadJoin({ idcliente: 15, tokenCliente: 'tk-nuevo' }, 'tk-handshake'))
      .toEqual({ idcliente: 15, token: 'tk-nuevo' });
  });

  it('objeto sin token cae al del handshake', () => {
    expect(leerPayloadJoin({ idcliente: 15 }, 'tk-handshake')).toEqual({ idcliente: 15, token: 'tk-handshake' });
  });

  it('payload nulo no revienta', () => {
    expect(leerPayloadJoin(null, '')).toEqual({ idcliente: null, token: '' });
  });
});

describe('salaCliente aplicada al socket', () => {
  it('log: el intruso entra igual (compatibilidad) pero queda el aviso', () => {
    const auth = cargar('log');
    expect(auth.salaCliente('', 99)).toEqual({ idcliente: 99, motivo: 'sin token' });
  });

  it('enforce: el intruso sin token no entra a ninguna sala', () => {
    const auth = cargar('enforce');
    expect(auth.salaCliente('', 99).idcliente).toBe(0);
  });

  it('enforce: el intruso con token propio no puede entrar a la sala de otro', () => {
    const auth = cargar('enforce');
    expect(auth.salaCliente(token(15), 99)).toEqual({ idcliente: 0, motivo: 'idcliente no coincide' });
  });

  it('enforce: tras nuevoPedido el token nuevo abre la sala nueva', () => {
    const auth = cargar('enforce');
    // el handshake se hizo con el cliente 15 y el SP reasigno el pedido al 20
    expect(auth.salaCliente(token(20), 20)).toEqual({ idcliente: 20, motivo: null });
    expect(auth.salaCliente(token(15), 20).idcliente).toBe(0);
  });

  it('enforce: el token del handshake sin pedir sala explicita une a la propia', () => {
    const auth = cargar('enforce');
    expect(auth.salaCliente(token(15), 0)).toEqual({ idcliente: 15, motivo: null });
  });
});
```

- [ ] **Step 2: Ejecutar y ver fallar.**

Run: `npx jest test/auth.cliente.socket.test.js`
Expected: FAIL en el bloque `salaCliente aplicada al socket` si la Task 2 no está aplicada; si ya lo está, este spec pasa entero y sirve de red para el Step 3. En ese caso anotarlo y seguir.

- [ ] **Step 3: Aplicar el token a las salas en `controllers/sockets.js`.** Añadir el require junto a los del principio (debajo del `tokenClienteService` que agregó la Task 3):

```js
const authCliente = require('../middleware/autentificacion.cliente');
```

Reemplazar las líneas 118-126 (el bloque de la sala por cliente y el handler `join-cliente`) por:

```js
		// sala por cliente: los eventos del repartidor llegan aunque cambie el socketid.
		// Sprint 5: para los sockets que se declaran cliente, la sala la decide el token del
		// handshake, no el entero. Los sockets de mozo/comercio/bot siguen igual: su idcliente
		// es el del pedido que atienden y su autenticacion es la HTTP.
		const idClienteSala = Number(dataSocket.idcliente);
		const declaraCliente = String(dataSocket.iscliente) === 'true';
		socket.tokenClienteActual = dataSocket.tokenCliente || '';
		socket.idclienteToken = 0;

		if (declaraCliente) {
			const sala = authCliente.salaCliente(socket.tokenClienteActual, idClienteSala);
			if (sala.motivo) {
				logger.warn({ socketId: socket.id, motivo: sala.motivo, idcliente: idClienteSala }, 'auth cliente socket handshake');
			}
			if (sala.idcliente > 0) {
				socket.idclienteToken = sala.idcliente;
				socket.join(`cliente_${sala.idcliente}`);
			}
		} else if (idClienteSala > 0) {
			socket.join(`cliente_${idClienteSala}`);
		}

		// el servidor puede asignar otro idcliente al guardar el pedido: la app pide unirse a
		// esa sala mandando { idcliente, tokenCliente } con el token recien emitido. Una app
		// vieja manda solo el numero y cae al token del handshake (o a ninguno).
		socket.on('join-cliente', (payload) => {
			const esObjeto = payload && typeof payload === 'object';
			const idcliente = esObjeto ? payload.idcliente : payload;
			const token = (esObjeto && payload.tokenCliente) ? payload.tokenCliente : socket.tokenClienteActual;

			const sala = authCliente.salaCliente(token, idcliente);
			if (sala.motivo) {
				logger.warn({ socketId: socket.id, motivo: sala.motivo, idcliente: Number(idcliente) || 0 }, 'auth cliente socket join-cliente');
			}
			if (sala.idcliente > 0) {
				// el token nuevo manda para los join siguientes de esta misma conexion
				if (esObjeto && payload.tokenCliente) { socket.tokenClienteActual = payload.tokenCliente; }
				socket.idclienteToken = sala.idcliente;
				socket.join(`cliente_${sala.idcliente}`);
			}
		});
```

**No** se toca el bloque comentado de las líneas 87-93 (`io.use`): sigue muerto y sigue documentando por qué no se usa (`app.js` bloqueado).

- [ ] **Step 4: Ejecutar el spec y comprobar que el archivo sigue cargando.**

Run: `npx jest test/auth.cliente.socket.test.js`
Expected: PASS, 9 specs.

Run: `Select-String -Path controllers/sockets.js -Pattern "authCliente.salaCliente"`
Expected: dos coincidencias (handshake y `join-cliente`).

Run: `Select-String -Path controllers/sockets.js -Pattern "socket.join\(.cliente_"`
Expected: tres coincidencias (cliente con token, no-cliente, `join-cliente`).

- [ ] **Step 5: Commit.** Escribir `.superpowers/sdd/2026-09-10-sprint5-auth-cliente/commit-msg-task-5.txt`:

```
feat: la sala cliente_<id> del socket se decide con el token, no con el entero

Hasta ahora el handshake y el handler join-cliente confiaban por completo en el
idcliente que mandaba el navegador: cualquiera se unia a la sala de cualquiera y
recibia en vivo el estado del pedido y la posicion del repartidor de otra
persona.

Para los sockets que se declaran cliente, la sala la decide ahora
authCliente.salaCliente con el tokenCliente del handshake. join-cliente acepta
las dos formas del payload: el numero suelto de las apps viejas y el objeto
{ idcliente, tokenCliente } de la app nueva, que es lo que permite entrar a la
sala nueva despues de que el procedimiento reasigna el idcliente al guardar el
pedido. Bajo AUTH_CLIENTE_MODO=log nada cambia salvo los avisos.

Los sockets de mozo, comercio y bot no cambian: su idcliente es el del pedido que
atienden y su autenticacion es la HTTP. app.js no se toca: todo va dentro del
handler de connection en socketsOn.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
```

Luego:
```
git add controllers/sockets.js test/auth.cliente.socket.test.js
git commit -F .superpowers/sdd/2026-09-10-sprint5-auth-cliente/commit-msg-task-5.txt
```

---

### Task 6: App: helper de almacenamiento `sys::tkc` y el interceptor que manda la cabecera

**Qué cierra del dossier:** §1 completo ("en las rutas de cliente no se identifica en absoluto"; el interceptor de `core.module.ts:36` como punto de enganche), §7 piezas 8 y 9.

**Files (app, `D:\Projects\capacitor\pwa-app-pedido`):**
- Create: `src/app/shared/utils/token-cliente.ts`
- Test: `src/app/shared/utils/token-cliente.spec.ts`
- Modify: `src/app/shared/services/http-config-interceptor.service.ts`
- Test: `src/app/shared/services/http-config-interceptor.service.spec.ts`
- Modify: `src/app/shared/services/info-token.service.ts` (solo delega en el helper)

**Interfaces:**
- Produces:
```ts
export const KEY_TOKEN_CLIENTE = 'sys::tkc';
export function esTokenClienteValido(token: any): boolean;
export function guardarTokenCliente(token: any): boolean;   // false si no lo guardo
export function leerTokenCliente(): string | null;
export function borrarTokenCliente(): void;
```
- Produces: `InfoTockenService.getTokenCliente(): string | null` y `setTokenCliente(token: any): boolean`, para los componentes que ya inyectan ese servicio.
- Produces (comportamiento de red): toda petición a `URL_SERVER` que no traiga ya `Authorization` sale con `Authorization: Bearer <sys::tkc>` cuando el token existe. Lo consume el backend de las Tasks 2 y 4.
- **`core.module.ts` NO se modifica**: `HttpConfigInterceptorService` ya está en `providers` (línea 36).

- [ ] **Step 1: Escribir el spec del helper (falla).** Crear `src/app/shared/utils/token-cliente.spec.ts`:

```ts
import {
  KEY_TOKEN_CLIENTE,
  borrarTokenCliente,
  esTokenClienteValido,
  guardarTokenCliente,
  leerTokenCliente
} from './token-cliente';

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZGNsaWVudGUiOjE1LCJ0aXBvIjoiY2xpZW50ZSJ9.Zm9vLWJhci1maXJtYS1kZS1wcnVlYmE';

describe('token-cliente', () => {

  afterEach(() => localStorage.removeItem(KEY_TOKEN_CLIENTE));

  describe('esTokenClienteValido', () => {
    it('acepta un JWT de tres partes', () => {
      expect(esTokenClienteValido(TOKEN)).toBe(true);
    });

    it('rechaza vacio, corto, sin tres partes y lo que no es texto', () => {
      expect(esTokenClienteValido('')).toBe(false);
      expect(esTokenClienteValido('   ')).toBe(false);
      expect(esTokenClienteValido('a.b.c')).toBe(false);
      expect(esTokenClienteValido('sin-puntos-pero-bastante-largo')).toBe(false);
      expect(esTokenClienteValido(`${TOKEN}.extra`)).toBe(false);
      expect(esTokenClienteValido(null)).toBe(false);
      expect(esTokenClienteValido(undefined)).toBe(false);
      expect(esTokenClienteValido(15)).toBe(false);
      expect(esTokenClienteValido({ token: TOKEN })).toBe(false);
    });
  });

  describe('guardarTokenCliente', () => {
    it('guarda el token recortado y avisa que lo guardo', () => {
      expect(guardarTokenCliente(`  ${TOKEN}  `)).toBe(true);
      expect(localStorage.getItem(KEY_TOKEN_CLIENTE)).toBe(TOKEN);
    });

    it('no guarda basura y no borra lo que ya habia', () => {
      guardarTokenCliente(TOKEN);
      expect(guardarTokenCliente('')).toBe(false);
      expect(guardarTokenCliente(null)).toBe(false);
      expect(guardarTokenCliente('undefined')).toBe(false);
      expect(localStorage.getItem(KEY_TOKEN_CLIENTE)).toBe(TOKEN);
    });
  });

  describe('leerTokenCliente', () => {
    it('devuelve null cuando no hay nada guardado', () => {
      expect(leerTokenCliente()).toBeNull();
    });

    it('devuelve el token guardado', () => {
      guardarTokenCliente(TOKEN);
      expect(leerTokenCliente()).toBe(TOKEN);
    });

    it('descarta un valor guardado que no tiene forma de JWT', () => {
      localStorage.setItem(KEY_TOKEN_CLIENTE, 'valor-viejo-cualquiera');
      expect(leerTokenCliente()).toBeNull();
    });
  });

  describe('borrarTokenCliente', () => {
    it('borra la clave', () => {
      guardarTokenCliente(TOKEN);
      borrarTokenCliente();
      expect(localStorage.getItem(KEY_TOKEN_CLIENTE)).toBeNull();
      expect(leerTokenCliente()).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Ejecutar y ver fallar.**

Run: `npx ng test --include=src/app/shared/utils/token-cliente.spec.ts --watch=false --browsers=ChromeHeadless`
Expected: FAIL — no existe el módulo `./token-cliente`.

- [ ] **Step 3: Crear `src/app/shared/utils/token-cliente.ts`:**

```ts
// Token de sesion del cliente emitido por el backend (sprint 5).
// La app solo lo guarda y lo reenvia: no lo interpreta ni confia en su contenido.
// El unico que puede leer el idcliente de dentro es el backend, que tiene la semilla.

export const KEY_TOKEN_CLIENTE = 'sys::tkc';

const LARGO_MINIMO = 40;

// Un JWT son tres partes separadas por punto. Sirve para descartar valores viejos,
// cadenas vacias y el clasico 'undefined' guardado por error, no para validar la firma.
export function esTokenClienteValido(token: any): boolean {
  if (typeof token !== 'string') { return false; }

  const limpio = token.trim();
  if (limpio.length < LARGO_MINIMO) { return false; }

  const partes = limpio.split('.');
  return partes.length === 3 && partes.every(p => p.length > 0);
}

// Devuelve false si no guardo nada (token invalido o localStorage bloqueado):
// el llamador decide si eso es un problema. Nunca borra el token anterior.
export function guardarTokenCliente(token: any): boolean {
  if (!esTokenClienteValido(token)) { return false; }

  try {
    localStorage.setItem(KEY_TOKEN_CLIENTE, (token as string).trim());
    return true;
  } catch (error) {
    // modo privado o cuota llena: la app sigue funcionando sin token (modo log del backend)
    console.error('token-cliente guardar', error);
    return false;
  }
}

export function leerTokenCliente(): string | null {
  try {
    const token = localStorage.getItem(KEY_TOKEN_CLIENTE);
    return esTokenClienteValido(token) ? (token as string).trim() : null;
  } catch (error) {
    console.error('token-cliente leer', error);
    return null;
  }
}

export function borrarTokenCliente(): void {
  try {
    localStorage.removeItem(KEY_TOKEN_CLIENTE);
  } catch (error) {
    console.error('token-cliente borrar', error);
  }
}
```

- [ ] **Step 4: Ejecutar el spec.**

Run: `npx ng test --include=src/app/shared/utils/token-cliente.spec.ts --watch=false --browsers=ChromeHeadless`
Expected: PASS, 8 specs, 0 failures.

- [ ] **Step 5: Escribir el spec del interceptor (falla).** Crear `src/app/shared/services/http-config-interceptor.service.spec.ts`:

```ts
import { HttpErrorResponse, HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { HttpConfigInterceptorService } from './http-config-interceptor.service';
import { KEY_TOKEN_CLIENTE } from '../utils/token-cliente';
import { URL_SERVER, URL_CONSULTA_RUC_DNI } from '../config/config.const';

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZGNsaWVudGUiOjE1LCJ0aXBvIjoiY2xpZW50ZSJ9.Zm9vLWJhci1maXJtYS1kZS1wcnVlYmE';

// sin TestBed: el interceptor solo necesita tres colaboradores y un next falso
function crear(tokenAuth: string = null, respuesta: () => Observable<any> = () => of(new HttpResponse())) {
  const enviadas: HttpRequest<any>[] = [];
  const refrescos: number[] = [];

  const authService: any = { setLocalToken: () => { }, setLoggedStatus: () => { } };
  const crudService: any = { refreshToken: () => { refrescos.push(1); return of({ token: 'nuevo' }); } };
  const infoToken: any = { getTokenAuth: () => tokenAuth };
  const next: any = { handle: (req: HttpRequest<any>) => { enviadas.push(req); return respuesta(); } };

  return { srv: new HttpConfigInterceptorService(authService, crudService, infoToken), next, enviadas, refrescos };
}

describe('HttpConfigInterceptorService', () => {

  afterEach(() => localStorage.removeItem(KEY_TOKEN_CLIENTE));

  describe('cabecera del token de cliente', () => {
    it('agrega Bearer cuando hay token y la peticion va al backend', () => {
      localStorage.setItem(KEY_TOKEN_CLIENTE, TOKEN);
      const { srv, next, enviadas } = crear();

      srv.intercept(new HttpRequest('POST', `${URL_SERVER}/delivery/get-mis-pedidos`, {}), next).subscribe();

      expect(enviadas.length).toBe(1);
      expect(enviadas[0].headers.get('Authorization')).toBe(`Bearer ${TOKEN}`);
    });

    it('no agrega nada cuando no hay token guardado', () => {
      const { srv, next, enviadas } = crear();

      srv.intercept(new HttpRequest('POST', `${URL_SERVER}/delivery/get-mis-pedidos`, {}), next).subscribe();

      expect(enviadas[0].headers.has('Authorization')).toBe(false);
    });

    it('no agrega nada a un host que no es el backend (consulta dni/ruc a un tercero)', () => {
      localStorage.setItem(KEY_TOKEN_CLIENTE, TOKEN);
      const { srv, next, enviadas } = crear();

      srv.intercept(new HttpRequest('GET', `${URL_CONSULTA_RUC_DNI}dni/12345678`), next).subscribe();

      expect(enviadas[0].headers.get('Authorization')).toBeNull();
    });

    it('no pisa el Authorization del colaborador', () => {
      localStorage.setItem(KEY_TOKEN_CLIENTE, TOKEN);
      const { srv, next, enviadas } = crear();
      const conMozo = new HttpRequest('POST', `${URL_SERVER}/cliente/new-direccion`, {}, {
        headers: new HttpHeaders().set('Authorization', 'token-del-mozo')
      });

      srv.intercept(conMozo, next).subscribe();

      expect(enviadas[0].headers.get('Authorization')).toBe('token-del-mozo');
    });

    it('no muta la peticion original', () => {
      localStorage.setItem(KEY_TOKEN_CLIENTE, TOKEN);
      const { srv, next, enviadas } = crear();
      const original = new HttpRequest('POST', `${URL_SERVER}/push/suscripcion`, {});

      srv.intercept(original, next).subscribe();

      expect(original.headers.has('Authorization')).toBe(false);
      expect(enviadas[0]).not.toBe(original);
    });
  });

  describe('401', () => {
    const error401 = () => throwError(new HttpErrorResponse({ status: 401 }));

    it('refresca el token cuando hay sesion de colaborador', () => {
      const { srv, next, refrescos } = crear('token-del-mozo', error401);

      srv.intercept(new HttpRequest('GET', `${URL_SERVER}/comercio/get-datos-impresion`), next)
        .subscribe({ error: () => { } });

      expect(refrescos.length).toBe(1);
    });

    it('NO intenta refrescar cuando es un cliente (no hay usuario ni pass que reenviar)', () => {
      localStorage.setItem(KEY_TOKEN_CLIENTE, TOKEN);
      const { srv, next, refrescos } = crear(null, error401);

      srv.intercept(new HttpRequest('POST', `${URL_SERVER}/delivery/get-mis-pedidos`, {}), next)
        .subscribe({ error: () => { } });

      expect(refrescos.length).toBe(0);
    });
  });
});
```

- [ ] **Step 6: Ejecutar y ver fallar.**

Run: `npx ng test --include=src/app/shared/services/http-config-interceptor.service.spec.ts --watch=false --browsers=ChromeHeadless`
Expected: FAIL — el constructor todavía recibe dos argumentos y la cabecera no se agrega.

- [ ] **Step 7: Reemplazar por completo `src/app/shared/services/http-config-interceptor.service.ts`:**

```ts
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { catchError } from 'rxjs/operators';
import { InfoTockenService } from './info-token.service';
import { CrudHttpService } from './crud-http.service';
import { AuthServiceSotrage } from './auth.service';
import { URL_SERVER } from '../config/config.const';
import { leerTokenCliente } from '../utils/token-cliente';

@Injectable()
export class HttpConfigInterceptorService implements HttpInterceptor {

  constructor(
    private authService: AuthServiceSotrage
    , private crudService: CrudHttpService
    , private infoTockenService: InfoTockenService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(this.conTokenCliente(request))
      .pipe(
        catchError((err, caught: Observable<HttpEvent<any>>) => {
          // refreshToken() reenvia usuario y pass del colaborador: sin sesion de
          // colaborador no hay nada que refrescar y atob(undefined) reventaria.
          if (err instanceof HttpErrorResponse && err.status === 401 && !!this.infoTockenService.getTokenAuth()) {
            // si es error 401 de autentificacion es decir token caducadado
            // lo refresquea
            this.crudService.refreshToken().subscribe(res => {
              this.authService.setLocalToken(res.token);
              this.authService.setLoggedStatus(true);
            });
          }
          throw err;
        })
      );
  }

  // Token de sesion del cliente (sprint 5). Se agrega aqui y no en crud-http.service para
  // no tocar la firma de postFree ni las ~20 llamadas que ya pasan conToken = false.
  // Dos condiciones: la peticion va a NUESTRO backend, y no trae ya un Authorization
  // (el del mozo en getHeaderHttpClientForm y el de la consulta de DNI/RUC a un tercero).
  private conTokenCliente(request: HttpRequest<any>): HttpRequest<any> {
    if (!request.url.startsWith(URL_SERVER)) { return request; }
    if (request.headers.has('Authorization')) { return request; }

    const token = leerTokenCliente();
    if (!token) { return request; }

    return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
}
```

- [ ] **Step 8: Delegar en el helper desde `src/app/shared/services/info-token.service.ts`.**

(a) Añadir el import junto al de `b64` (línea 9):
```ts
import { borrarTokenCliente, guardarTokenCliente, leerTokenCliente } from '../utils/token-cliente';
```

(b) Justo después de `getTokenAuth()` (línea 319) añadir los tres accesores:
```ts
  // token de sesion del cliente (sprint 5). Vive en sys::tkc; lo emite el backend.
  getTokenCliente(): string { return leerTokenCliente(); }
  setTokenCliente(token: any): boolean { return guardarTokenCliente(token); }
  clearTokenCliente(): void { borrarTokenCliente(); }
```

No se toca `setIdClienteToken` ni ningún otro método: quién guarda el token es la Task 7, en los tres puntos donde llega.

- [ ] **Step 9: Ejecutar los dos specs.**

Run: `npx ng test --include=src/app/shared/services/http-config-interceptor.service.spec.ts --watch=false --browsers=ChromeHeadless`
Expected: PASS, 7 specs.
Run: `npx ng test --include=src/app/shared/utils/token-cliente.spec.ts --watch=false --browsers=ChromeHeadless`
Expected: PASS, 8 specs.

- [ ] **Step 10: Comprobar que `core.module.ts` no hizo falta tocarlo.**

Run: `git status --short src/app/core/core.module.ts`
Expected: sin salida (el archivo no cambió).
Run: `Select-String -Path src/app/core/core.module.ts -Pattern "HttpConfigInterceptorService"`
Expected: dos coincidencias (el import y el `provide: HTTP_INTERCEPTORS`).

- [ ] **Step 11: Type-check y build de release.**

Run: `npx tsc -p src/tsconfig.app.json --noEmit`
Expected: sin errores.
Run: `npx ng build --configuration production`
Expected: exit 0.

- [ ] **Step 12: Commit.** Escribir `.superpowers/sdd/2026-09-10-sprint5-auth-cliente/commit-msg-task-6.txt`:

```
feat: la app manda el token de cliente en cada peticion al backend

Nuevo shared/utils/token-cliente.ts: guarda, lee y borra sys::tkc con validacion
de forma (tres partes) y con localStorage envuelto en try/catch, porque en modo
privado revienta. InfoTockenService delega ahi con getTokenCliente,
setTokenCliente y clearTokenCliente.

HttpConfigInterceptorService, que ya estaba registrado en core.module.ts, agrega
Authorization: Bearer <sys::tkc> a toda peticion dirigida a URL_SERVER que no
traiga ya un Authorization. Asi no cambia la firma de postFree ni ninguna de las
llamadas que pasan conToken = false, y no se pisa ni el token del mozo ni el de
la consulta de DNI/RUC, que va a un tercero.

Ademas el reintento de 401 solo se dispara si hay sesion de colaborador:
refreshToken reenvia usuario y pass, y con un cliente atob(undefined) reventaba y
enmascaraba el error original.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
```

Luego, desde `D:\Projects\capacitor\pwa-app-pedido`:
```
git add src/app/shared/utils/token-cliente.ts src/app/shared/utils/token-cliente.spec.ts src/app/shared/services/http-config-interceptor.service.ts src/app/shared/services/http-config-interceptor.service.spec.ts src/app/shared/services/info-token.service.ts
git commit -F .superpowers/sdd/2026-09-10-sprint5-auth-cliente/commit-msg-task-6.txt
```

---

### Task 7: App: guardar el token en los tres puntos, mandarlo por el socket y retirar `TOKEN_SMS`

**Qué cierra del dossier:** §2 (los tres momentos), §5 (el handshake sin token), anexo (`postSMS` / `TOKEN_SMS` muertos), §7 pieza 8.

**Files (app):**
- Modify: `src/app/shared/services/verify-auth-client.service.ts` (`registerCliente`, líneas 361-401)
- Modify: `src/app/componentes/dialog-verificar-telefono/dialog-verificar-telefono.component.ts` (`sendSMS` 83-122 y `verificarCodigoSMS` 124-152)
- Modify: `src/app/componentes/dialog-verificar-telefono/dialog-verificar-telefono.component.html` (botón SMS, línea 33)
- Modify: `src/app/pages/pedido/resumen-pedido/resumen-pedido.component.ts` (`savePedidoSocket2`, líneas 1235-1246)
- Modify: `src/app/shared/services/socket.service.ts` (`dataSocket` 79-91 y `joinCliente` 351-354)
- Modify: `src/app/shared/services/crud-http.service.ts` (borrar `postSMS` 83-88 y `getHeaderHttpClientFormSMS` 181-186)
- Modify: `src/app/shared/config/config.const.ts` (borrar `TOKEN_SMS`, línea 24)

**Interfaces:**
- Consumes: `tokenCliente` de las respuestas de la Task 3 (`rpt.tokenCliente`, `res.tokenCliente`, `_res.tokenCliente`).
- Consumes: `guardarTokenCliente` / `leerTokenCliente` de la Task 6.
- Produces (handshake del socket): `query.tokenCliente` — lo lee la Task 5.
- Produces (evento): `join-cliente` con `{ idcliente, tokenCliente }` — lo lee la Task 5.
- Borra: `CrudHttpService.postSMS()` y la constante `TOKEN_SMS`. Después de esta tarea, **ningún** secreto del backend queda horneado en el bundle salvo `TOKEN_CONSULTA`, que va a un tercero y queda para otro sprint (dossier §7, "fuera de alcance").

- [ ] **Step 1: Guardar el token del login en `verify-auth-client.service.ts`.**

(a) Añadir el import junto a los demás de `src/app/shared/`:
```ts
import { guardarTokenCliente } from '../utils/token-cliente';
```
(Comprobar la ruta relativa real del archivo con `Select-String -Path src/app/shared/services/verify-auth-client.service.ts -Pattern "^import"`; el servicio vive en `src/app/shared/services/`, así que la ruta correcta es `../utils/token-cliente`.)

(b) Dentro del `subscribe` de `registerCliente()`, inmediatamente después de `if ( !rpt.success ) {return; }` (línea 372) añadir:
```ts
      // sprint 5: el backend acaba de establecer la identidad y devuelve la prueba
      guardarTokenCliente(rpt.tokenCliente);
```

- [ ] **Step 2: Guardar el token del OTP en `dialog-verificar-telefono.component.ts`.**

(a) Añadir el import:
```ts
import { guardarTokenCliente } from 'src/app/shared/utils/token-cliente';
```
(b) Dentro del `subscribe` de `verificarCodigoSMS`, justo después de la línea `this.isVerificacionOk = res.data[0].response === 1 ? true : false;` (línea 138) añadir:
```ts
        // sprint 5: con el codigo correcto el telefono queda probado -> llega el token
        if ( this.isVerificacionOk ) { guardarTokenCliente(res.tokenCliente); }
```

- [ ] **Step 3: Retirar la rama muerta de SMS del mismo componente.** Reemplazar el cuerpo de `sendSMS` desde la línea 94 hasta la 122 (o sea desde `if ( codMedio === 0 ) {` hasta el cierre del método) por:

```ts
    // ponytail: el envio por SMS se retira. Apuntaba a delivery/send-sms-confirmation, ruta
    // que no existe (routes/v3.js la tenia comentada) y cuyo handler tenia el cuerpo entero
    // comentado: nunca respondia. El OTP real siempre fue el de WhatsApp por socket. Con eso
    // se va tambien TOKEN_SMS del bundle. Si se quiere SMS de verdad, es un sprint aparte.
    this.data.idsocket = this.socketService.getIdSocket();

    if (!this.socketService.isSocketOpen) {
      this.socketService.connect(this.infoClient, 0, false, false);
    }

    setTimeout(() => {
      this.socketService.emit('msj-confirma-telefono', this.data);
    }, 500);

    this.isContandoShow = true;
    this.contadorActvarBtnSend();
    this.intentoVerificacion++; // reintentar
  }
```

El parámetro `codMedio` deja de usarse dentro del método pero **se conserva en la firma** (`sendSMS(codMedio: number)`, `enviarCodigoSMS(codMedio: number)`, `buscarClienteTelefono(codMedio: number)`) para no tocar las tres llamadas existentes. Añadir sobre `sendSMS` el comentario:
```ts
  // codMedio se conserva por compatibilidad de firma: hoy solo hay un medio, WhatsApp.
```

- [ ] **Step 4: Quitar el botón SMS del html.** En `dialog-verificar-telefono.component.html`, borrar la línea 33 completa:

```html
            <button matRipple [disabled]="!isValidForm" (click)="enviarCodigoSMS(1)"  class="btn btn-info"><i class="fa fa-comment pr-1" aria-hidden="true"></i> SMS</button>
```

y dejar el `<div class="d-flex">` con el único botón de WhatsApp. El texto de la línea 28 ("Enviar código de verificación por:") sigue siendo correcto. **No** tocar el bloque comentado de las líneas 42-61 ni el `<div>` de verificación de las líneas 65-92.

- [ ] **Step 5: Guardar el token del pedido en `resumen-pedido.component.ts`.**

(a) Añadir el import junto a los demás de `src/app/shared/`:
```ts
import { guardarTokenCliente } from 'src/app/shared/utils/token-cliente';
```
(b) Reemplazar el bloque de las líneas 1237-1246 (`// el servidor puede haber reasignado...`) por:

```ts
    // el servidor puede haber reasignado el cliente al guardar: ese idcliente manda
    if (Number(_res.idcliente) > 0) {
      // sprint 5: primero el token, para que la suscripcion push y el join-cliente de abajo
      // ya salgan con la credencial del idcliente definitivo
      guardarTokenCliente(_res.tokenCliente);
      this.infoToken.setIdClienteToken(Number(_res.idcliente));
      // el idcliente definitivo ya esta en el token: se reenvia el token push con el cliente correcto
      // (un cliente nuevo arranca con idcliente 0 y su token quedaria sin dueño)
      this.notificacionPush.enviarSuscripcion();
      const cs = this.verifyClientService.getDataClient();
      if (cs) { cs.idcliente = Number(_res.idcliente); this.verifyClientService.setDataClient(); }
      this.socketService.joinCliente(Number(_res.idcliente));
    }
```

El resto del método (`errorSendPedido`, `rotarNonceIdem`, el `setTimeout` de limpieza del carrito, `newFomrConfirma`) no se toca.

- [ ] **Step 6: Mandar el token en el handshake y en `join-cliente` (`socket.service.ts`).**

(a) Añadir el import junto al de `config.const` (línea 8):
```ts
import { leerTokenCliente } from '../utils/token-cliente';
```
(b) Añadir un campo a `dataSocket` (líneas 79-91), después de `firts_socketid: infToken.socketId`:
```ts
      firts_socketid: infToken.socketId,
      // sprint 5: socket.io-client 2 no soporta auth:{}, el token va en el query del handshake.
      // El backend solo lo mira para los sockets que se declaran cliente (iscliente = true).
      tokenCliente: leerTokenCliente() || ''
```
(c) Reemplazar `joinCliente` (líneas 350-354) por:
```ts
  // tras guardar el pedido el servidor puede asignar otro idcliente; unirse a su sala sin reconectar.
  // El token viaja en el evento porque el del handshake es el del idcliente anterior.
  joinCliente(idcliente: number): void {
    const id = Number(idcliente);
    if (this.socket && id > 0) {
      this.socket.emit('join-cliente', { idcliente: id, tokenCliente: leerTokenCliente() || '' });
    }
  }
```

- [ ] **Step 7: Borrar `postSMS` y `getHeaderHttpClientFormSMS` de `crud-http.service.ts`.**

(a) Borrar las líneas 82-88 completas:
```ts
    // enviar mensaje SMS de seguridad
    postSMS(datos: any, controller: string, evento: string , conTokenSMS: boolean = true): Observable<any> {
        const url = this.setUrl(controller, evento);
        const header = conTokenSMS ? this.getHeaderHttpClientFormSMS() : this.getHeaderHttpClientFormNoToken();

        return this.httpClient.post<any>(url, datos, { headers: header });
    }
```
(b) Borrar las líneas 181-186 completas:
```ts
    private getHeaderHttpClientFormSMS(): HttpHeaders {
        const headers = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .set('Authorization', TOKEN_SMS);
        return headers;
    }
```
(c) Cambiar el import de la línea 5 por:
```ts
import { URL_SERVER, URL_CONSULTA_RUC_DNI, TOKEN_CONSULTA } from '../config/config.const';
```

- [ ] **Step 8: Borrar `TOKEN_SMS` de `config.const.ts`.** Reemplazar las líneas 22-24 por:

```ts
// ponytail: TOKEN_CONSULTA sigue en el bundle. Va a un tercero (apifac.papaya.com.pe), no a
// nuestro backend, asi que sacarlo exige pasar la consulta por el backend: sprint aparte.
// TOKEN_SMS se borro en el sprint 5 junto con la ruta muerta delivery/send-sms-confirmation.
export const TOKEN_CONSULTA = 'tLKbDncvyKIPcgdVAGqt7rmy7W9mU9cnbawpZdc7JJv7l6h9cU'; // token de prueba
```

- [ ] **Step 9: Comprobar que no queda ninguna referencia suelta.**

Run: `Select-String -Path src -Recurse -Pattern "TOKEN_SMS|postSMS|send-sms-confirmation"`
Expected: sin resultados.
Run: `Select-String -Path src -Recurse -Pattern "guardarTokenCliente"`
Expected: cuatro coincidencias — el `import` y el uso en `verify-auth-client.service.ts`, `dialog-verificar-telefono.component.ts` y `resumen-pedido.component.ts` (más el `export` en `token-cliente.ts`, que sale como quinta).
Run: `Select-String -Path src/app/shared/services/socket.service.ts -Pattern "tokenCliente"`
Expected: tres coincidencias (import de `leerTokenCliente`, campo del handshake, evento `join-cliente`).

- [ ] **Step 10: Type-check, specs de regresión y build de release.**

Run: `npx tsc -p src/tsconfig.app.json --noEmit`
Expected: sin errores.
Run: `npx ng test --include=src/app/shared/services/socket.service.spec.ts --watch=false --browsers=ChromeHeadless`
Expected: PASS. Si el spec afirma sobre el objeto `query` del handshake, actualizar la aserción para incluir `tokenCliente`.
Run: `npx ng test --include=src/app/shared/services/verify-auth-client.service.spec.ts --watch=false --browsers=ChromeHeadless`
Expected: PASS.
Run: `npx ng build --configuration production`
Expected: exit 0.

- [ ] **Step 11: Commit.** Escribir `.superpowers/sdd/2026-09-10-sprint5-auth-cliente/commit-msg-task-7.txt`:

```
feat: la app guarda el token de cliente y lo manda tambien por el socket

Se guarda en sys::tkc en los tres puntos donde el backend lo emite: la respuesta
de register-cliente-login (Auth0, nativo e invitado), la de verificar-codigo-sms
cuando el codigo es correcto, y el ack de nuevoPedido, ahi antes de reenviar la
suscripcion push y de pedir la sala, para que ambas salgan ya con la credencial
del idcliente definitivo.

El handshake del socket lleva tokenCliente en el query (socket.io-client 2 no
soporta auth) y join-cliente pasa a mandar { idcliente, tokenCliente }: el token
del handshake es el del cliente anterior cuando el procedimiento reasigna el id
al guardar el pedido.

Se retira el envio de OTP por SMS: apuntaba a delivery/send-sms-confirmation, una
ruta que no existia y cuyo handler nunca respondia. Con eso se van postSMS,
getHeaderHttpClientFormSMS y la constante TOKEN_SMS, que estaba horneada en el
bundle. El OTP real, por WhatsApp via socket, no cambia.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
```

Luego:
```
git add src/app/shared/services/verify-auth-client.service.ts src/app/componentes/dialog-verificar-telefono/dialog-verificar-telefono.component.ts src/app/componentes/dialog-verificar-telefono/dialog-verificar-telefono.component.html src/app/pages/pedido/resumen-pedido/resumen-pedido.component.ts src/app/shared/services/socket.service.ts src/app/shared/services/crud-http.service.ts src/app/shared/config/config.const.ts
git commit -F .superpowers/sdd/2026-09-10-sprint5-auth-cliente/commit-msg-task-7.txt
```
Antes del commit, `git status --short` no debe mostrar ningún archivo de Sprint 4 (imágenes, geolocalización, costo de entrega) dentro del `git add`.

---

### Task 8: Rollout: nota de operación y versión de la app

**Qué cierra del dossier:** §6 (la app nativa no se actualiza sola), sección de rollout de §7 ("enforce no debe activarse sin ese paso").

**Files:**
- Create: `docs/superpowers/notas/2026-09-10-auth-cliente-rollout.md` (repo de la app)
- Modify: `android/app/build.gradle` (repo de la app, líneas 15-16)

**Interfaces:**
- Consumes: todo lo anterior. No produce API nueva.

- [ ] **Step 1: Subir la versión del binario Android.** En `android/app/build.gradle`, reemplazar las líneas 15-16 por:

```gradle
        versionCode 4
        versionName "1.0.3"
```

Verificar:
Run: `Select-String -Path android/app/build.gradle -Pattern "versionCode|versionName"`
Expected: `versionCode 4` y `versionName "1.0.3"`.

- [ ] **Step 2: Confirmar cómo se compara la versión.** El endpoint existe (`routes/v3.js:350` → `apiPwa_v1.js:1980-1993`, `SELECT version, properties FROM app_version WHERE name_app = ?`), pero **esta app nunca lo llama**.

Run: `Select-String -Path src -Recurse -Pattern "version-app|get-version-app|VERSION_APP"`
Expected: sin resultados. Si aparece alguno, **detenerse**: significa que el mecanismo sí existe y hay que actualizar esa constante en lugar de solo el `build.gradle`; anotarlo en la nota del Step 3.

- [ ] **Step 3: Escribir `docs/superpowers/notas/2026-09-10-auth-cliente-rollout.md`** con este contenido exacto:

```markdown
# Sprint 5 — Autenticación del cliente: cómo pasar a `enforce`

Backend `D:\Projects\backend-pedidos`, app `D:\Projects\capacitor\pwa-app-pedido`.
Ningún valor secreto aparece en este archivo: solo nombres de variable.

## Qué se desplegó

- `SEED_CLIENTE`: secreto propio del JWT de cliente, distinto de `SEED` (colaboradores).
  Vive solo en `.env` y `.env.production`, que no se versionan. Documentado en `.env.example`.
- `AUTH_CLIENTE_MODO`: `off` | `log` | `enforce`. **Se desplegó en `log`.**
- El token lo emite el backend en `ini/register-cliente-login`, en
  `delivery/verificar-codigo-sms` (solo con `response === 1`) y en el ack del socket
  `nuevoPedido`. Dura 180 días y no se refresca: cada uno de esos tres momentos re-emite.
- La app lo guarda en `localStorage['sys::tkc']` y el interceptor de `core.module.ts` lo
  manda como `Authorization: Bearer <token>` a todo lo que va a `URL_SERVER`.

## Qué hace cada modo

| Modo | Sin token | Token inválido / vencido | `idcliente` que no coincide |
|---|---|---|---|
| `off` | pasa | pasa | pasa |
| `log` | pasa + `logger.warn` | pasa + `logger.warn` | pasa + `logger.warn` |
| `enforce` | **401** | **401** | **403** |

En `enforce`, el socket que no puede probar quién es **no se une** a `cliente_<id>`: deja de
recibir `pedido-cambio-estado` y la posición del repartidor.

`enforce` sin `SEED_CLIENTE` **no arranca**: `middleware/autentificacion.cliente.js` lanza al
cargarse. Es a propósito: es mejor no arrancar que servir 401 a todo el parque.

## Cómo mirar los avisos antes de decidir

Los avisos salen por pino con el mensaje `auth cliente` (HTTP),
`auth cliente socket handshake` y `auth cliente socket join-cliente`. Traen `ruta`, `motivo`
(`sin token` | `token invalido` | `idcliente no coincide`) e `idcliente`. **Nunca el token.**

```
pm2 logs backend-pedidos --lines 2000 | Select-String "auth cliente"
```

Contar por motivo y ver que la curva baje. Lo esperable después de publicar la app:

- Las visitas por navegador (PWA) migran en días: al recargar toman el bundle nuevo y el token
  se emite en la primera acción identificatoria (login, OTP o pedido).
- Las apps instaladas migran solo cuando el usuario actualiza.

## Requisitos para pasar a `enforce` (los cuatro, sin saltarse ninguno)

1. **Publicar la app nueva** en Play Store / App Store (`versionCode 4`, `versionName 1.0.3`).
2. **Actualizar la fila de `app_version`** para que el endpoint `version-app/get-version-app`
   devuelva la versión nueva:
   ```sql
   UPDATE app_version SET version = '1.0.3' WHERE name_app = '<nombre de la app cliente>';
   ```
   Confirmar antes el `name_app` real con `SELECT name_app, version FROM app_version;`.
   (`sql/` está en `.gitignore`: la migración no se versiona. Convención `sql/AAAA-MM-DD_nombre.sql`.)
3. **BLOQUEO CONOCIDO: esta app no consulta ese endpoint.** `Select-String -Path src -Recurse
   -Pattern "version-app"` no devuelve nada. O sea que hoy **no existe** el aviso de
   actualización dentro de la app del cliente: subir la versión en la base no obliga a nadie a
   actualizar. Antes de `enforce` hay que, o bien añadir esa comprobación a la app (sprint
   aparte, pequeño), o bien aceptar que las apps viejas se rompan y avisar por otro canal.
4. **Que los avisos `auth cliente` hayan caído a un residuo aceptable**, dos a cuatro semanas
   después de que la app nueva esté publicada y con el aviso de actualización funcionando.

## Cómo se activa

En el `.env` del servidor:
```
AUTH_CLIENTE_MODO=enforce
```
y reiniciar. Si algo sale mal, se vuelve a `log` y se reinicia: no hay migración que revertir,
el token no se persiste en ninguna tabla.

## Qué se rompe si se activa antes de tiempo

En una app o pestaña sin token:

- "Mis pedidos" queda vacío (401 en `delivery/get-mis-pedidos`).
- El seguimiento del pedido no carga (401 en `delivery/get-estado-pedido`) y el mapa del
  repartidor no se mueve (el socket no entra a la sala).
- El perfil y las direcciones no cargan ni se guardan (401 en `cliente/perfil`,
  `cliente/perfil-save`, `cliente/new-direccion`, `delivery/get-direccion-cliente`).
- No se registra el token push (401 en `push/suscripcion`): deja de recibir notificaciones.
- No se puede registrar el pago (401 en `transaction/registrar-pago`), ni calificar, ni borrar
  la cuenta.

**Lo que NO se rompe:** carta, menú, establecimientos, promociones, login/registro y el OTP
por WhatsApp. Son públicos o son los emisores del token. Tampoco se rompe el flujo del
comercio/mozo: el middleware acepta el JWT de colaborador firmado con `SEED` sin comparar
`idcliente`, porque el comercio consulta y guarda direcciones del cliente que atiende.

## Deuda declarada

- **Sala del socket forjable declarándose no-cliente.** El handshake solo valida el token para
  los sockets con `iscliente = true`. Un atacante puede mandar `iscliente=false` con el
  `idcliente` de la víctima y entrar igual a `cliente_<id>`. Cerrarlo exige que la app de mozo
  también mande un token en el handshake: sprint aparte.
- **Enumeración de clientes por teléfono.** `delivery/search-cliente-by-phone`,
  `-pwaid` y `delivery/get-cliente-telefono-chatbot` siguen sin token porque se usan *antes* de
  que exista identidad. Lo razonable es un rate limit por IP y por teléfono, no un token.
- **`TOKEN_CONSULTA` sigue en el bundle** (`config.const.ts`). Va a un tercero
  (`apifac.papaya.com.pe`), no a nuestro backend: sacarlo exige pasar la consulta de DNI/RUC
  por el backend.
- **Sin revocación.** El token vale 180 días y no se puede invalidar. Si hiciera falta, se
  agrega `cliente.token_version INT DEFAULT 0` al payload y se compara: es la única razón por
  la que este sprint tocaría la base.
- **`login.js:46,94` compara contraseñas en claro** y `loggerUsAutorizado` mete la fila
  completa del usuario (con la contraseña en base64) dentro del JWT de colaborador. Fuera de
  alcance de este sprint, pero sigue ahí.
- **`verificar-codigo-sms` con `idcliente: -2`** (cliente aún no registrado, el caso
  `isClienteNoRegister` de `dialog-verificar-telefono.component.ts:129`) responde **400** desde
  el sprint 1: la validación exige `idcliente > 0`. Ese camino ya estaba roto antes de este
  sprint y no se tocó.
```

- [ ] **Step 4: Commit.** Escribir `.superpowers/sdd/2026-09-10-sprint5-auth-cliente/commit-msg-task-8.txt`:

```
docs: nota de rollout del token de cliente y version 1.0.3 de la app

La nota explica que se desplego en AUTH_CLIENTE_MODO=log, como leer los avisos
"auth cliente" del log, los cuatro requisitos para pasar a enforce, que se rompe
si se activa antes de tiempo y como volver atras. Deja escrita la deuda: la sala
del socket sigue siendo forjable declarandose no-cliente, la enumeracion por
telefono sigue abierta, TOKEN_CONSULTA sigue en el bundle y no hay revocacion.

versionCode sube a 4 y versionName a 1.0.3. Queda anotado que esta app NO
consulta version-app/get-version-app, asi que hoy no existe aviso de
actualizacion para el cliente: es un bloqueo previo a enforce.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
```

Luego:
```
git add docs/superpowers/notas/2026-09-10-auth-cliente-rollout.md android/app/build.gradle
git commit -F .superpowers/sdd/2026-09-10-sprint5-auth-cliente/commit-msg-task-8.txt
```

---

### Task 9: Verificación del sprint

**Qué cierra:** que nada de lo anterior se declaró bueno sin comprobarlo, y deja al probador del controlador la lista exacta de escenarios e2e.

**Estado de la máquina comprobado por el planificador** (no volver a asumirlo, sí volver a comprobarlo si algo falla):
- Backend: rama `master`, último commit `c51bf42`. Sin commitear: ` M app.js`, ` M controllers/serviceSendCPE.js`, ` M firebase_config.js`, `?? INTEGRACION-YAPE.md`, `?? controllers/yapeIntegracion.js`, `?? routes/routesYape.js`, `?? .superpowers/`. **Esos seis primeros no se tocan.**
- App: rama `master`, último commit `b6d3127`. Sin commitear al empezar: `geolocation.service.ts` y su spec (Sprint 4) y `docs/` sin versionar.
- `jsonwebtoken` 8.5.1 ya es dependencia del backend: **no hay `npm install` en este sprint**.
- Socket: servidor `socket.io` 4.8.1, cliente `socket.io-client` 2.4.0 (por eso el token va en `query` y no en `auth`).

**Files:**
- Create: `docs/superpowers/notas/2026-09-10-verificacion-auth-cliente.md` (repo de la app)
- Modify: ninguno.

**Interfaces:**
- Consumes: todo lo anterior. No produce API nueva.

- [ ] **Step 1: Batería completa de Jest en el backend.**

Desde `D:\Projects\backend-pedidos`:
Run: `npx jest test/token.cliente.test.js test/autentificacion.cliente.test.js test/token.cliente.emision.test.js test/auth.cliente.rutas.test.js test/auth.cliente.socket.test.js`
Expected: PASS en los cinco, 0 failures.

- [ ] **Step 2: Regresión de los tests del backend que tocan lo modificado.**

Run: `npx jest test/apiDelivery.getMisPedido.test.js test/nuevoPedido.test.js test/push.cliente.service.test.js test/estado-pedido.service.test.js test/estado-pedido.push.test.js test/rate-limit.test.js`
Expected: PASS en los seis. Cualquier fallo aquí es un fallo de este sprint: arreglarlo, no relajar la aserción.

- [ ] **Step 3: Batería completa de Karma en la app.**

Desde `D:\Projects\capacitor\pwa-app-pedido`:
Run: `npx ng test --include=src/app/shared/utils/token-cliente.spec.ts --watch=false --browsers=ChromeHeadless`
Expected: PASS, 8 specs.
Run: `npx ng test --include=src/app/shared/services/http-config-interceptor.service.spec.ts --watch=false --browsers=ChromeHeadless`
Expected: PASS, 7 specs.
Run: `npx ng test --include=src/app/shared/services/socket.service.spec.ts --watch=false --browsers=ChromeHeadless`
Expected: PASS.
Run: `npx ng test --include=src/app/shared/services/verify-auth-client.service.spec.ts --watch=false --browsers=ChromeHeadless`
Expected: PASS.

- [ ] **Step 4: Type-check y build de release de la app.**

Run: `npx tsc -p src/tsconfig.app.json --noEmit`
Expected: sin errores.
Run: `npx ng build --configuration production`
Expected: exit 0. Anotar el tamaño del bundle principal.

- [ ] **Step 5: Comprobar que ningún secreto quedó en el bundle compilado.**

Run: `Select-String -Path dist/pwa-app-pedido -Recurse -Pattern "papaya-sms" | Measure-Object | Select-Object -ExpandProperty Count`
Expected: `0` (era el payload de `TOKEN_SMS`).
Run: `Select-String -Path dist/pwa-app-pedido -Recurse -Pattern "SEED_CLIENTE" | Measure-Object | Select-Object -ExpandProperty Count`
Expected: `0` (el secreto es solo del servidor y jamás debe aparecer en la app).

- [ ] **Step 6: Arranque real del backend en `log` y prueba con curl.**

Levantar el backend con `AUTH_CLIENTE_MODO=log` (el `.env` ya lo tiene). Con `<IDCLIENTE>` = un idcliente real de prueba:

Run: `curl -s -X POST http://localhost:5819/v3/delivery/get-mis-pedidos -H "Content-Type: application/json" -d "{\"idcliente\": <IDCLIENTE>}"`
Expected: HTTP 200 con `{"success":true,"data":[...]}` **y** una línea en el log del servidor con `auth cliente`, `motivo: sin token`, `ruta: /v3/delivery/get-mis-pedidos`, `idcliente: <IDCLIENTE>`. Comprobar que en esa línea **no aparece ningún token**.

Obtener un token real:
Run: `curl -s -X POST http://localhost:5819/v3/ini/register-cliente-login -H "Content-Type: application/json" -d "{\"datalogin\":{\"name\":\"Invitado\"},\"isLoginByInvitado\":true}"`
Expected: la respuesta trae `"tokenCliente":"eyJ..."` junto a `data[0].idcliente`. Guardar ambos en variables de la shell; **no** pegarlos en ningún archivo.

Run: `curl -s -X POST http://localhost:5819/v3/delivery/get-mis-pedidos -H "Content-Type: application/json" -H "Authorization: Bearer $TK" -d "{\"idcliente\": $ID}"`
Expected: HTTP 200 y **ninguna** línea `auth cliente` nueva en el log.

- [ ] **Step 7: Segunda corrida local en `enforce`.** Detener el backend, arrancarlo con `AUTH_CLIENTE_MODO=enforce` (variable de entorno de la sesión, sin tocar el `.env`) y repetir:

Run: `curl -s -i -X POST http://localhost:5819/v3/delivery/get-mis-pedidos -H "Content-Type: application/json" -d "{\"idcliente\": $ID}"`
Expected: **401** con `{"success":false,"error":"no autorizado"}`.

Run: `curl -s -i -X POST http://localhost:5819/v3/delivery/get-mis-pedidos -H "Content-Type: application/json" -H "Authorization: Bearer $TK" -d "{\"idcliente\": 999999}"`
Expected: **403** con `{"success":false,"error":"no autorizado"}`.

Run: `curl -s -i -X POST http://localhost:5819/v3/delivery/get-mis-pedidos -H "Content-Type: application/json" -H "Authorization: Bearer $TK" -d "{\"idcliente\": $ID}"`
Expected: **200** con los pedidos.

Run: `curl -s -i -X POST http://localhost:5819/v3/push/send-notification -H "Content-Type: application/json" -d "{}"`
Expected: **404** (la ruta ya no existe).

Run: `curl -s -i -X POST http://localhost:5819/v3/delivery/send-sms-confirmation-out -H "Content-Type: application/json" -d "{}"`
Expected: **404**.

Al terminar, **volver a arrancar en `log`**: es el modo con el que se despliega.

- [ ] **Step 8: Escenarios e2e para el probador del controlador.** No los ejecuta el implementador; van en la bitácora del Step 9 como lista de comprobación, con el modo del backend indicado en cada uno.

Con el backend en **`log`** y la app nueva (`ng serve` o el APK de depuración):
1. Abrir la app como invitado. En DevTools → Application → Local Storage debe aparecer `sys::tkc` con un valor de tres partes.
2. En DevTools → Network, cualquier POST a `delivery/get-mis-pedidos`, `cliente/perfil` o `push/suscripcion` debe llevar `Authorization: Bearer eyJ...`.
3. La consulta de DNI/RUC (`apifac.papaya.com.pe`) **no** debe llevar ese Bearer, sino el suyo.
4. Hacer un pedido completo. Al confirmarse, `sys::tkc` debe **cambiar** si el servidor reasignó el `idcliente`, y el estado del pedido debe seguir llegando en vivo (el `join-cliente` con el token nuevo).
5. Verificar el teléfono por WhatsApp: al meter el código correcto, `sys::tkc` cambia. El botón "SMS" ya no existe.
6. Entrar como comercio/mozo, tomar un pedido delivery y abrir el diálogo de direcciones de un cliente: debe funcionar igual que antes (el middleware acepta el token de colaborador).
7. Cerrar sesión ("Cerrar sesión" hace `localStorage.clear()`): `sys::tkc` desaparece.
8. Abrir la app en un navegador **sin** actualizar el bundle (pestaña vieja): todo sigue funcionando y aparecen los avisos `auth cliente` en el log. Esta es la prueba de compatibilidad.

Con el backend en **`enforce`** (segunda corrida local, nunca en producción todavía):
9. Con la app nueva: todo el flujo del punto 1 al 7 sigue funcionando.
10. Borrar `sys::tkc` a mano en DevTools y recargar "Mis pedidos": debe fallar con 401 y la pantalla quedar vacía (no colgada).
11. Editar `sys::ic-orden` en DevTools poniendo el `idcliente` de otro y recargar "Mis pedidos": **403**, no los pedidos ajenos. Este es el agujero que cierra el sprint.
12. Con dos navegadores y dos clientes distintos: abrir el seguimiento del pedido de A desde el navegador de B forzando el `idpedido`/`idcliente`: 403, y el socket de B **no** recibe `pedido-cambio-estado` del pedido de A.

- [ ] **Step 9: Escribir la bitácora `docs/superpowers/notas/2026-09-10-verificacion-auth-cliente.md`** con esta plantilla, rellenando cada campo con lo que realmente pasó (si algo no se pudo verificar, escribir `no verificado` y por qué; nunca inventar un OK):

```markdown
# Verificación Sprint 5 (autenticación del cliente) — 2026-09-10

## Automático

| Comprobación | Resultado |
|---|---|
| `token.cliente.test.js` | |
| `autentificacion.cliente.test.js` | |
| `token.cliente.emision.test.js` | |
| `auth.cliente.rutas.test.js` | |
| `auth.cliente.socket.test.js` | |
| Regresión: `apiDelivery.getMisPedido`, `nuevoPedido`, `push.cliente.service`, `estado-pedido.service`, `estado-pedido.push`, `rate-limit` | |
| `token-cliente.spec.ts` | |
| `http-config-interceptor.service.spec.ts` | |
| `socket.service.spec.ts` | |
| `verify-auth-client.service.spec.ts` | |
| `npx tsc -p src/tsconfig.app.json --noEmit` | |
| `npx ng build --configuration production` | |
| Bundle sin `papaya-sms` ni `SEED_CLIENTE` | |
| curl sin token en `log` → 200 + aviso en el log | |
| curl sin token en `enforce` → 401 | |
| curl con token de otro en `enforce` → 403 | |
| curl con token propio en `enforce` → 200 | |
| `push/send-notification` → 404 | |
| `send-sms-confirmation-out` → 404 | |

## Pendiente de prueba manual (backend en `log`)
- [ ] `sys::tkc` aparece al entrar como invitado.
- [ ] Las peticiones al backend llevan `Authorization: Bearer`; la de DNI/RUC al tercero no.
- [ ] Pedido completo: el token cambia si el servidor reasigna el idcliente y el estado sigue llegando en vivo.
- [ ] OTP por WhatsApp: el token cambia al validar el código. El botón SMS ya no está.
- [ ] Flujo del comercio: direcciones del cliente atendido siguen funcionando.
- [ ] Cerrar sesión borra `sys::tkc`.
- [ ] Pestaña con el bundle viejo: sigue funcionando y deja avisos `auth cliente`.

## Pendiente de prueba manual (backend en `enforce`, solo local)
- [ ] Flujo completo con la app nueva: sin errores.
- [ ] Sin `sys::tkc`: "Mis pedidos" da 401 y la pantalla queda vacía, no colgada.
- [ ] `sys::ic-orden` alterado con el id de otro: 403, no los pedidos ajenos.
- [ ] Dos clientes: B no recibe `pedido-cambio-estado` del pedido de A.

## Deuda declarada
Ver `docs/superpowers/notas/2026-09-10-auth-cliente-rollout.md`, sección "Deuda declarada":
sala del socket forjable con `iscliente=false`, enumeración por teléfono, `TOKEN_CONSULTA` en
el bundle, sin revocación de tokens, y la app sin aviso de actualización.

## Migraciones de base de datos
Ninguna. El token no se persiste. Lo único que toca la base al pasar a `enforce` es el
`UPDATE app_version SET version = '1.0.3'` documentado en la nota de rollout, que es del
mecanismo de versión, no de la autenticación.
```

- [ ] **Step 10: Commit.** Escribir `.superpowers/sdd/2026-09-10-sprint5-auth-cliente/commit-msg-task-9.txt`:

```
chore: bitacora de verificacion del sprint 5

Deja por escrito que paso con cada prueba automatica, con los curl en log y en
enforce, y la lista de escenarios manuales que quedan pendientes en dispositivo y
navegador. Confirma que el sprint no lleva ninguna migracion de base de datos.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BAiYqZLEaFC2hgQ77w1gAG
```

Luego, desde `D:\Projects\capacitor\pwa-app-pedido`:
```
git add docs/superpowers/notas/2026-09-10-verificacion-auth-cliente.md
git commit -F .superpowers/sdd/2026-09-10-sprint5-auth-cliente/commit-msg-task-9.txt
```

---

## Self-Review

**1. Cobertura del inventario del dossier (§4).** Las dieciséis filas de la tabla del dossier, más el socket:

| Ruta del dossier | Prioridad | Dónde se resuelve |
|---|---|---|
| `delivery/get-mis-pedidos` | P0 | Task 4, Step 6 + spec de las cuatro combinaciones en Task 4, Step 12 |
| `delivery/get-estado-pedido` | P0 | Task 4, Step 6 |
| `push/suscripcion` | P0 | Task 4, Step 8 |
| `push/send-notification` | P0 | Task 4, Steps 8 y 9: **borrada**, con el grep de cero llamadores en el Step 1 |
| socket `nuevoPedido` (handshake sin verificar) | P0 | Task 5, Step 3 (sala por token) + Task 3, Step 5 (el ack emite el token) |
| `delivery/verificar-codigo-sms` | P0 | **No se protege**: es emisor (Ruling 5). Task 3, Step 4 lo convierte en punto de emisión |
| `delivery/get-direccion-cliente` | P0 | Task 4, Step 6 |
| `cliente/perfil` | P0 | Task 4, Step 4 |
| `cliente/perfil-save` | P0 | Task 4, Step 4 |
| `cliente/new-direccion` | P0 | Task 4, Step 4 |
| `pedido/lacuenta-cliente` y `-totales` | P1 | Task 4, Step 3 |
| `transaction/registrar-pago` | P1 | Task 4, Step 5 |
| `ini/register-cliente-login` | — | **No se protege**: es emisor. Task 3, Step 3 |
| `ini/user-account-remove` | P1 | Task 4, Step 3, con extractor `body.user.idcliente` |
| `delivery/search-cliente-by-phone(-pwaid)` | P1 | **No se protege**, con motivo escrito (pre-identidad) en la tabla de la Task 4 y en la deuda de la Task 8 |
| `delivery/get-cliente-telefono-chatbot` | P1 | **No se protege**, mismo motivo |
| `delivery/calificar-servicio` | P1 | Task 4, Step 6, con extractor `body.dataCalificacion.idcliente` |
| `pedido/set-datos-facturacion-cliente` | P1 | Task 4, Step 3 |

Las ocho P0 del dossier están todas cubiertas (siete protegidas + una borrada). De las P1, se protegen las seis que llevan `idcliente` propio y se dejan fuera las tres pre-identidad, con el motivo por escrito en dos sitios.

**2. Barrido de marcadores de posición.** No hay `TBD`, `TODO`, "agregar validación" ni "similar a la Task N". Van completos: `service/token.cliente.js`, `middleware/autentificacion.cliente.js`, `src/app/shared/utils/token-cliente.ts` y `http-config-interceptor.service.ts` (archivos enteros); los bloques de `routes/v3.js`, `sockets.js`, `apiPwa_v1.js`, `apiDelivery.js`, `socket.service.ts` y `resumen-pedido.component.ts` van como reemplazo textual con las líneas exactas; los seis specs van enteros. Los tres `// ponytail:` son simplificaciones declaradas (retirar el envío por SMS, `TOKEN_CONSULTA` que se queda, `codMedio` conservado en la firma). Los dos puntos donde el implementador debe mirar el archivo real —los imports de `verify-auth-client.service.ts` y la aserción del `query` en `socket.service.spec.ts`— traen el `Select-String` exacto.

**3. Consistencia de tipos y nombres entre tareas.**
- Clave de almacenamiento: `KEY_TOKEN_CLIENTE = 'sys::tkc'` (Task 6) = la que lee el interceptor (Task 6) = la que leen `socket.service.ts` y los tres puntos de guardado (Task 7) = la que dice la nota de rollout (Task 8) = la del escenario e2e 1 (Task 9).
- Nombre del campo de red: `tokenCliente` en la respuesta HTTP (Task 3, Steps 3 y 4) = `rpt.tokenCliente` / `res.tokenCliente` en la app (Task 7, Steps 1 y 2); `rpt[0].tokenCliente` en el ack del socket (Task 3, Step 5 vía `conTokenCliente`) = `_res.tokenCliente` en `resumen-pedido` (Task 7, Step 5). La diferencia envelope/fila está declarada en las Interfaces de la Task 3 porque el ack del socket no tiene envelope.
- Firma del emisor: `emitir(idcliente) -> string|null` en la definición (Task 1, Step 3), en las tres llamadas (Task 3) y en las aserciones (Task 1, Step 1 y Task 3, Step 1).
- Firma del middleware: `verificarTokenCliente` es `exigirCliente()` ya construido (Task 2, Step 3), y así se usa en `routes/v3.js` **sin paréntesis** (Task 4, Steps 3-8); las dos rutas con extractor usan `exigirCliente({ idcliente: fn })` **con** paréntesis. Comprobado uno por uno: 11 usos de `verificarTokenCliente` (`lacuenta-cliente`, `lacuenta-cliente-totales`, `set-datos-facturacion-cliente`, `cliente/perfil`, `perfil-save`, `new-direccion`, `registrar-pago`, `get-direccion-cliente`, `get-mis-pedidos`, `get-estado-pedido`, `push/suscripcion`) y 2 de `exigirCliente` (`user-account-remove`, `calificar-servicio`), que con el `require` dan las 14 coincidencias que exige el Step 14 de la Task 4.
- `salaCliente(token, idclientePedido) -> { idcliente, motivo }`: misma firma en la definición (Task 2), en las dos llamadas de `sockets.js` (Task 5, Step 3) y en las aserciones de los dos specs (Task 2, Step 1 y Task 5, Step 1).
- Protocolo `join-cliente`: la app manda `{ idcliente, tokenCliente }` (Task 7, Step 6) y el backend lee exactamente esos dos campos, con la caída al número suelto para apps viejas (Task 5, Step 3); la función `leerPayloadJoin` del spec (Task 5, Step 1) es copia literal de esa lectura y el propio spec dice que si cambia una hay que cambiar la otra.
- Modos: los tres literales `'off' | 'log' | 'enforce'` aparecen con la misma grafía en `.env.example` (Task 1), en `MODOS` (Task 2), en los specs (Tasks 2, 4 y 5), en los curl (Task 9) y en la tabla de la nota (Task 8).
- Códigos de respuesta: 401 para "falta o inválido" y 403 para "no coincide", idénticos en el Ruling 4, en el código (Task 2, Step 3), en los tres specs y en los curl del Step 7 de la Task 9.
- Constructor del interceptor: `(authService, crudService, infoTockenService)` en la definición (Task 6, Step 7) y en el `crear()` del spec (Task 6, Step 5), en ese orden.

**4. Cosas que el plan cambia respecto de lo que decía el encargo, y por qué.** Están recogidas en "Correcciones del planificador" arriba: la salida para el token de colaborador (sin ella `enforce` rompe la toma de pedidos desde el comercio), las tres rutas pre-identidad que quedan fuera con motivo, y que la app **no** tiene mecanismo de aviso de actualización pese a que el endpoint exista — por eso la Task 8 sube el binario y declara el hueco como bloqueo previo a `enforce` en vez de fingir que lo resuelve.

**5. Migraciones.** Ninguna, confirmado leyendo los catorce handlers protegidos y los tres emisores: ninguno necesita columna nueva y el token no se guarda en ningún sitio. Lo único que toca la base en todo el sprint es el `UPDATE app_version` del rollout, que es del mecanismo de versión y está documentado, no ejecutado, porque `sql/` está en `.gitignore`.
