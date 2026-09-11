# Verificación Sprint 5 (autenticación del cliente) — 2026-09-10

Verificación ejecutada la madrugada del 2026-09-11 (hora local de Lima) sobre el sprint
cerrado el 2026-09-10. El verificador **no modificó código, no commiteó y no hizo push**.

- App: `D:\Projects\capacitor\pwa-app-pedido`, rama `master`, HEAD `7786c50` + `caa2d1e` + `54fa909`.
- Backend: `D:\Projects\backend-pedidos`, rama `master`, HEAD `34a0f1b`.
- Instancia de desarrollo: `node app.js` en **5819**, PID **36868**, `AUTH_CLIENTE_MODO=log` (no se
  detuvo ni se reinició en ningún momento). `ng serve` en **4300**, PID 23388 (intacto).
- Para el modo `enforce` se levantó una **segunda instancia efímera** en el puerto **5820**
  (`PORT=5820 PORT_SOCKET=16920 AUTH_CLIENTE_MODO=enforce node app.js`, PID 43336), que se apagó al
  terminar. `_config.js:23-24` lee `process.env.PORT` / `process.env.PORT_SOCKET`, por eso se pudo
  hacer sin tocar la instancia de 5819.
- **Prefijo real de rutas: `/v3`** (no `/api/v3`, como decía el brief).
- En este documento ningún token aparece completo: como máximo 12 caracteres.

---

## 1. Suites unitarias

### Backend — `npx jest` (desde `D:\Projects\backend-pedidos`)

```
npx jest test/token.cliente.test.js test/autentificacion.cliente.test.js \
         test/token.cliente.emision.test.js test/auth.cliente.rutas.test.js \
         test/auth.cliente.socket.test.js test/rate-limit.test.js \
         test/apiDelivery.getMisPedido.test.js test/push.cliente.service.test.js \
         test/estado-pedido.push.test.js
```

| Suite | Resultado |
|---|---|
| `token.cliente.test.js` | PASS |
| `autentificacion.cliente.test.js` | PASS |
| `token.cliente.emision.test.js` | PASS |
| `auth.cliente.rutas.test.js` | PASS |
| `auth.cliente.socket.test.js` | PASS |
| `rate-limit.test.js` | PASS |
| `apiDelivery.getMisPedido.test.js` | PASS |
| `push.cliente.service.test.js` | PASS |
| `estado-pedido.push.test.js` | PASS |

**Totales: `Test Suites: 9 passed, 9 total` · `Tests: 147 passed, 147 total` · 1.266 s · exit 0.**

> `nuevoPedido.test.js` y `estado-pedido.service.test.js` (que el brief original listaba en su
> Step 2) **no se ejecutaron**: el ledger los declara rojos de forma preexistente por depender de la
> base real, y el encargo de esta verificación no los incluye. Queda como deuda conocida, no como
> fallo del sprint.

### App — Karma (desde `D:\Projects\capacitor\pwa-app-pedido`)

```
npx ng test --include=src/app/shared/utils/token-cliente.spec.ts \
            --include=src/app/shared/services/http-config-interceptor.service.spec.ts \
            --include=src/app/shared/services/socket.service.spec.ts \
            --include=src/app/shared/services/verify-auth-client.service.spec.ts \
            --include=src/app/shared/utils/push-payload.spec.ts \
            --watch=false --browsers=ChromeHeadless
```

**`TOTAL: 34 SUCCESS`, exit 0** (Chrome Headless 152). Cubre los cinco specs que nombra
`task-6-7-report.md`: helper `token-cliente`, interceptor HTTP, socket, `verify-auth-client` y
`push-payload`.

### Type-check y build de release

| Comando | Resultado |
|---|---|
| `npx tsc -p src/tsconfig.app.json --noEmit` | **exit 0**, sin errores |
| `npx ng build --configuration production` | **exit 0**; 17 warnings, todos preexistentes (CommonJS / sourcemaps de `.ts` fuera del programa) |

Bundle: `main.91377fd10d128ffa.js` **1.44 MB** (320.48 kB comprimido); **Initial Total 1.62 MB**
(344.75 kB comprimido).

### Secretos en el bundle compilado

| Búsqueda sobre `dist/` | Coincidencias |
|---|---|
| `papaya-sms` (payload del viejo `TOKEN_SMS`) | **0** |
| `SEED_CLIENTE` | **0** |

**Veredicto ítem 1: PASS.**

---

## 2. Modo `log` contra la instancia viva de 5819

Log del servidor: `…\scratchpad\backend-out.log` (el `backend-err.log` sólo contiene el
`DeprecationWarning` de Sequelize).

### 2.a Sin cabecera `Authorization`

```
POST http://localhost:5819/v3/delivery/get-mis-pedidos
Content-Type: application/json
{"idcliente":1274}
```

- **Observado: HTTP 200**, cuerpo de 38 380 bytes con `{"data":[{"idpedido":26082,…}],…}`.
- Línea nueva en el log, literal:

```
[2026-09-11 00:00:49.486 -0500] WARN: auth cliente
    ruta: "/v3/delivery/get-mis-pedidos"
    motivo: "sin token"
    idcliente: 1274
```

- La línea trae ruta y `idcliente`, y **no contiene ningún token** (ni un fragmento).

### 2.b Con `Authorization: Bearer basura.basura.basura`

- **Observado: HTTP 200**, mismo cuerpo (38 380 bytes): en `log` se deja pasar siempre.
- Línea nueva en el log:

```
[2026-09-11 00:01:00.890 -0500] WARN: auth cliente
    ruta: "/v3/delivery/get-mis-pedidos"
    motivo: "token invalido"
    idcliente: 1274
```

- De nuevo, sin token en el texto.

**Veredicto ítem 2: PASS.** Compatibilidad hacia atrás confirmada (una app vieja sigue funcionando)
y el aviso identifica la ruta y el cliente sin filtrar la credencial.

---

## 3. Modo `enforce` (segunda instancia, puerto 5820)

Token de prueba acuñado con `service/token.cliente.js` desde un script **fuera del repo**
(`…\scratchpad\v9-mint.js`), usando el `.env` del backend. Cliente A = `1274`, cliente B = `1275`.
Comprobación del propio emisor: `verificar(tkA) === {"idcliente":1274}`. Prefijo del token A:
`eyJhbGciOiJI` (12 caracteres, el resto no se registra en ninguna parte).

| Escenario | Esperado | Observado |
|---|---|---|
| Sin `Authorization`, body `{"idcliente":1274}` | 401 `{success:false,error:'no autorizado'}` | **401**, cuerpo exacto `{"success":false,"error":"no autorizado"}` |
| `Bearer <token de 1274>`, body `{"idcliente":1275}` | 403 | **403**, cuerpo exacto `{"success":false,"error":"no autorizado"}` |
| `Bearer <token de 1274>`, body `{"idcliente":1274}` | 200 con los pedidos | **200**, 38 380 bytes de datos |
| `Bearer basura.basura.basura`, body `{"idcliente":1274}` | 401 | **401** |

Rutas retiradas, contra la misma instancia:

| Ruta | Esperado | Observado |
|---|---|---|
| `POST /v3/push/send-notification` | 404 | **404** `{"status":0,"data":"Not Found"}` |
| `POST /v3/delivery/send-sms-confirmation-out` | 404 | **404** `{"status":0,"data":"Not Found"}` |

La instancia de 5820 se apagó al terminar (PID 43336 ya no existe, el puerto no escucha).
**5819 sigue siendo el proceso original, PID 36868 (`node.exe`, arrancado el 2026-09-10 23:17:55),
en modo `log`**: un POST sin token a `get-mis-pedidos` sigue devolviendo 200.

**Veredicto ítem 3: PASS.** Éste es el agujero que cierra el sprint: con `enforce`, pedir los
pedidos de otro `idcliente` con credencial propia da 403.

---

## 4. Endurecimiento del OTP

### 4.a Límite de peticiones

`routes/v3.js:169` monta `rateLimit(10, 60000)` **antes** del handler, así que cuenta incluso las
peticiones que luego fallan por validación.

11 POST seguidos a `http://localhost:5820/v3/delivery/verificar-codigo-sms` desde la misma IP, con
un cuerpo deliberadamente inválido (no toca la base):

```
 1..10  → 400 {"success":false,"error":"datos inválidos"}
 11     → 429 {"success":false,"error":"Demasiadas solicitudes"}
```

**PASS.** La 11.ª petición dentro de la ventana de 60 s se corta con 429.

### 4.b Invalidación del código tras una verificación correcta

Confirmado **por código**, no por fuerza bruta —
`controllers/apiDelivery.js:191-205`:

```js
if (aprobado && idcliente > 0) {
    const invalidado = await QueryServiceV1.ejecutarConsulta(
        'UPDATE cliente SET pwa_code_verification = NULL WHERE idcliente = ?', …);
```

donde `aprobado` es `Number(rows[0].response) === 1` (línea 185). El `UPDATE` es parametrizado y no
toca el procedimiento almacenado. `test/rate-limit.test.js` y las 25 pruebas del fix `34a0f1b` lo
cubren en verde.

### 4.c Comprobación en la base (solo lectura)

`SELECT` sobre `cliente` con el MCP de MySQL en modo lectura:

- 1 548 clientes: **1 529 con `pwa_code_verification` NULL**, 17 con un código de 4 caracteres.
- Los 17 que conservan código tienen `idcliente` ≤ 1373 (incluido el 1274 de las pruebas e2e), es
  decir, son **códigos anteriores al fix `34a0f1b`**.
- La tabla `cliente` **no tiene columna de fecha de verificación**, así que no se pudo identificar un
  cliente que haya verificado *después* del fix sin escribir en la base.

**Veredicto ítem 4: PASS con una reserva.** El límite de peticiones está verificado en vivo; la
puesta a NULL está verificada por código y por pruebas unitarias, pero **no verificada en vivo**:
ningún cliente ha completado una verificación desde que el fix se desplegó, y comprobarlo
ejecutándolo habría modificado datos. Primer OTP real que se valide en `log` debería dejar ese
`pwa_code_verification` en NULL; conviene mirarlo entonces.

---

## 5. Integración de la app en el navegador

Herramienta: CLI `agent-browser`, sesión `verif9`, backend en 5819 (`log`), app en
`http://127.0.0.1:4300`. Tienda `carta/elasador` (sede 13), cliente DNI `41526548` → **idcliente 1274**.

Instrumentación: un *init script* propio (fuera del repo) que envuelve `XMLHttpRequest` y `fetch` y
anota, por petición, la URL y **sólo los 12 primeros caracteres** de la cabecera `Authorization`.
Ese mismo script adelanta el reloj del navegador 12 h, porque la verificación corrió a las 00:15 y
las dos cartas de la sede (10:00–16:00 y 07:00–23:59) salían **bloqueadas por horario**; el backend
usa su propio reloj y no se vio afectado (el pedido quedó grabado con la hora real, 00:15:06).

### 5.a Token obtenido

| Momento | Clave | Contenido |
|---|---|---|
| Entrada como invitado | `localStorage['sys::tkc']` | presente, prefijo `eyJhbGciOiJI`, payload `{idcliente: 1566, tipo:"cliente"}` |
| Tras login con DNI | `localStorage['sys::tkc']` | prefijo `eyJhbGciOiJI`, payload `{idcliente: 1274, tipo:"cliente"}`, 173 caracteres |
| Tras confirmar el pedido | `localStorage['sys::tkc']` | reemitido (`iat` 1789103443 → 1789103706), sigue con `idcliente: 1274` |

Vigencia observada: `exp − iat = 15 552 000 s` = **180 días**, como manda el ruling 1.
El token **cambió** cuando el servidor reasignó la identidad (1566 → 1274) y se **volvió a guardar**
en el ack del pedido: los tres puntos de emisión funcionan.

### 5.b Cabecera `Authorization` — backend sí, terceros no

Peticiones registradas durante el recorrido completo (URL | cabecera truncada):

```
BK/v3/ini/carta-virtual                      | auth=Bearer eyJhb
BK/v3/delivery/get-establecimientos          | auth=Bearer eyJhb
BK/v3/pedido/register-scan                   | auth=Bearer eyJhb
BK/v3/ini/info-sede                          | auth=Bearer eyJhb
BK/v3/ini/reglas-app/                        | auth=Bearer eyJhb
BK/v3/ini/register-cliente-login             | auth=Bearer eyJhb
BK/v3/delivery/get-shared-url-carta          | auth=Bearer eyJhb
BK/v3/delivery/get-parametros-tienda-linea   | auth=Bearer eyJhb
BK/v3/delivery/get-calificacion-sede         | auth=Bearer eyJhb
BK/v3/holding/get-marcas                     | auth=Bearer eyJhb
BK/v3/delivery/get-direccion-cliente         | auth=Bearer eyJhb
BK/v3/service/consulta-dni-ruc-no-tk         | auth=Bearer eyJhb
BK/v3/delivery/get-mis-pedidos               | auth=Bearer eyJhb
https://maps.googleapis.com/…/gen_204        | auth=NINGUNA
https://apifac.papaya.com.pe/api/services/dni/41526548 | auth=Bearer tLKbD  ← token propio del tercero, NO el del cliente
```

(`BK` = `http://localhost:5819`.) Ninguna petición a Google lleva cabecera `Authorization`, y la
consulta de DNI al tercero lleva **su propio** token (`tLKbD…`, no un JWT `eyJ…`): el interceptor no
pisa las cabeceras ajenas ni filtra la credencial del cliente fuera del host del backend.

El handshake del socket (`GET /socket.io/?…`) viaja con `tokenCliente=…` en el *query*, como
especifica el ruling 3.

Prueba negativa complementaria: **durante todo el recorrido no apareció ni un solo aviso
`auth cliente` nuevo en el log del backend** (el total del archivo sigue en 6, el último de las
00:01, todos de las pruebas con `curl` del ítem 2). Es decir, la app mandó siempre un token válido y
coincidente.

### 5.c Pedido en efectivo de punta a punta

Carta `CARTA MENU` → `GASEOSAS Y BEBIDAS` → *Agua San Carlos 625ml* (S/ 1.00) + *Agua Cielo 2,5l*
(S/ 15.00); dirección guardada «Serafín Filomeno 750»; **Método de pago: Efectivo**; propina 0.
Sub Total 16.00 + Entrega 4.00 = **Total 20.00**. → pantalla «Pedido Confirmado».

«Mis Pedidos» muestra arriba del todo:

```
Pedido: #26089        Recibido
11/09/2026 00:15:06   S/.20.00
EL ASADOR | SAN BORJA
```

y la única petición que disparó esa pantalla fue `BK/v3/delivery/get-mis-pedidos | auth=Bearer eyJhb`.

Confirmación en base (lectura): `SELECT idpedido, idcliente, total, fecha_hora, pwa_estado FROM pedido
WHERE idpedido = 26089` → `26089 | 1274 | 16.00 | 2026-09-11 00:15:06 | P`.

**Veredicto ítem 5: PASS.**

---

## 6. Barrido de regresión

`push/send-notification`, `sendPushNotificaction`, `verificarTokenSms`, `sendMsjConfirmacion`,
`TOKEN_SMS`, `send-sms-confirmation` — grep sobre los dos repos (sin `node_modules`):

| Símbolo | Backend | App |
|---|---|---|
| `push/send-notification` | sólo el comentario de borrado en `routes/v3.js:192` | sólo el plan en `docs/superpowers/plans/` |
| `sendPushNotificaction` (exacto) | **cero**; sólo el comentario `sendMsj.js:291`. Lo que queda son funciones distintas y vivas: `…Comercio`, `…OneRepartidor`, `…RepartidorAceptaPedido`, `…OneRepartidorTEST` | — |
| `verificarTokenSms` | sólo el comentario `middleware/autentificacion.js:5` | — |
| `sendMsjConfirmacion` | sólo el comentario `controllers/sendMsj.js:47` | — |
| `TOKEN_SMS` | — | sólo dos comentarios (`config.const.ts:24`, `dialog-verificar-telefono.component.ts:95`) **y el valor completo en `docs/superpowers/plans/2026-09-09-sprint1-sesion-confirmacion.md:133`** (ver BUG-V02) |
| `send-sms-confirmation` | sólo comentarios | sólo comentarios + el plan |
| `postSMS` | — | cero código |

Las dos rutas retiradas responden 404 en caliente (ítem 3).

**Veredicto ítem 6: PASS** (con el hallazgo BUG-V02 abajo, que es del repositorio de documentación,
no del código de la aplicación).

---

## BUGS ENCONTRADOS

| Id | Severidad | Qué pasa | Dónde |
|---|---|---|---|
| BUG-V01 | MEDIA | La puesta a NULL de `pwa_code_verification` no pudo comprobarse contra datos reales: los 17 clientes que aún conservan código son todos anteriores al fix y la tabla no tiene marca de tiempo para identificar una verificación reciente. El código y 25 pruebas unitarias lo respaldan, pero **el camino nunca se ha ejecutado en vivo**. | `controllers/apiDelivery.js:191-205` |
| BUG-V02 | MEDIA | El JWT completo de `TOKEN_SMS` (payload `papaya-sms`, firmado con `SEED_SMS`) sigue **versionado en claro** dentro del plan del sprint 1, pese a que el sprint 5 lo sacó del bundle. Hoy es inerte —`verificarTokenSms` y la ruta que lo consumía están borrados— pero es un secreto en un archivo rastreado por git. | `docs/superpowers/plans/2026-09-09-sprint1-sesion-confirmacion.md:133` (repo de la app) |
| BUG-V03 | BAJA | `SEED_SMS` sigue declarado en la configuración y en `.env.example` sin ningún consumidor tras el borrado de `verificarTokenSms`. Ya estaba aparcado como *minor* en el ledger; se confirma que sigue ahí. | `_config.js:56`, `.env.example:32` (backend) |

**No se encontró ningún defecto funcional ni de seguridad en el mecanismo del token de cliente.**
Los tres modos (`off` implícito, `log`, `enforce`), los tres puntos de emisión, el interceptor, el
handshake del socket, el límite de peticiones y el borrado de código muerto se comportan como
especifica el plan.

---

## Pendiente de prueba manual (backend en `log`)
- [x] `sys::tkc` aparece al entrar como invitado — **verificado** (payload `idcliente:1566`).
- [x] Las peticiones al backend llevan `Authorization: Bearer`; la de DNI/RUC al tercero no — **verificado**.
- [x] Pedido completo: el token se reemite al confirmar y el pedido aparece en «Mis Pedidos» — **verificado** (#26089).
- [ ] OTP por WhatsApp: el token cambia al validar el código. El botón SMS ya no está. *(no verificado: requiere un WhatsApp real; el botón SMS sí se confirmó borrado del HTML)*
- [ ] Flujo del comercio: direcciones del cliente atendido siguen funcionando con token de colaborador. *(no verificado: requiere sesión de mozo/comercio)*
- [ ] Cerrar sesión borra `sys::tkc`. *(no verificado)*
- [ ] Pestaña con el bundle viejo: sigue funcionando y deja avisos `auth cliente`. *(equivalente verificado por `curl` sin token en el ítem 2: 200 + aviso)*

## Pendiente de prueba manual (backend en `enforce`, solo local)
- [x] Sin token → 401; token de otro → 403; token propio → 200 — **verificado con la instancia de 5820**.
- [ ] Flujo completo de la app nueva apuntando a una instancia en `enforce`. *(no verificado: la app apunta a 5819, que corre en `log`; cambiar el destino de la app habría requerido tocar el entorno y recargar `ng serve`)*
- [ ] Sin `sys::tkc`: «Mis pedidos» da 401 y la pantalla queda vacía, no colgada. *(no verificado)*
- [ ] Dos clientes: B no recibe `pedido-cambio-estado` del pedido de A. *(no verificado)*

## Deuda declarada
Ver `docs/superpowers/notas/2026-09-10-auth-cliente-rollout.md`, sección «Deuda declarada»:
sala del socket forjable con `iscliente=false`, enumeración por teléfono, `TOKEN_CONSULTA` en el
bundle, sin revocación de tokens, y la app sin aviso de actualización. A esa lista se suman los tres
hallazgos de arriba (BUG-V01 a BUG-V03).

## Migraciones de base de datos
Ninguna. El token no se persiste. Lo único que toca la base al pasar a `enforce` es el
`UPDATE app_version SET version = '1.0.3'` documentado en la nota de rollout, que es del mecanismo
de versión, no de la autenticación.

## Estado del entorno al cerrar
- **5819: PID 36868 (`node.exe`, arrancado 2026-09-10 23:17:55), vivo y en modo `log`.** No se
  detuvo ni se reinició.
- **4300: `ng serve`, PID 23388, vivo.** No se tocó.
- La segunda instancia de `enforce` (5820, PID 43336) está apagada; el puerto ya no escucha.
- Sesión de navegador `verif9` cerrada.
- Dato nuevo en la base: pedido **26089** del cliente 1274 (S/ 20.00, efectivo), creado como
  evidencia del ítem 5.
- Repositorios sin cambios de código, sin commits, sin push.
