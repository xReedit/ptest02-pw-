# Sprint 5 — Autenticación del cliente: cómo pasar a `enforce`

Backend `D:\Projects\backend-pedidos`, app `D:\Projects\capacitor\pwa-app-pedido`.
Ningún valor secreto aparece en este archivo: solo nombres de variable.

## Qué se desplegó

- `SEED_CLIENTE`: secreto propio del JWT de cliente, distinto de `SEED` (colaboradores).
  Vive solo en `.env` y `.env.production`, que no se versionan. Documentado en
  `.env.example` del backend.
- `AUTH_CLIENTE_MODO`: `off` | `log` | `enforce`. **Se desplegó en `log`.**
- El token lo emite el backend en `ini/register-cliente-login`, en
  `delivery/verificar-codigo-sms` (solo con `response === 1`) y en el ack del socket
  `nuevoPedido`. Dura 180 días y no se refresca: cada uno de esos tres momentos re-emite.
- La app lo guarda en `localStorage['sys::tkc']` y el interceptor de `core.module.ts` lo
  manda como `Authorization: Bearer <token>` a todo lo que va a `URL_SERVER`.
- **Corregido en este sprint:** `delivery/verificar-codigo-sms` con `idcliente: -2`
  (centinela de "cliente aún no registrado", caso `isClienteNoRegister` de
  `dialog-verificar-telefono.component.ts:129`) respondía **400** desde el Sprint 1 por una
  validación que exigía `idcliente > 0`. Se corrigió en `controllers/apiDelivery.js`
  (commit `d1dbb91`, Task 3 de este sprint) para aceptar `-2` como centinela válido. No es
  deuda: ya está resuelto y cubierto por specs.

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

Los avisos salen por pino con el mensaje `auth cliente` (HTTP), `auth cliente socket
handshake` y `auth cliente socket join-cliente`. Traen `ruta`, `motivo` (`sin token` |
`token invalido` | `idcliente no coincide`) e `idcliente`. **Nunca el token.**

```
pm2 logs backend-pedidos --lines 2000 | Select-String "auth cliente"
```

### Qué medir antes de activar `enforce`

- Conteo de avisos por `motivo`, por día, y que la curva esté bajando (no solo que sea
  baja un día puntual).
- Conteo por `ruta`: si `delivery/get-mis-pedidos` o `delivery/get-estado-pedido` siguen
  altos, todavía hay tráfico sin token real (apps viejas o sesiones sin login).
- Proporción de avisos que vienen del socket (`auth cliente socket *`) vs HTTP: el socket
  se rompe de forma más visible para el usuario (mapa que no se mueve) y conviene que baje
  primero o al mismo ritmo.
- Lo esperable después de publicar la app nueva:
  - Las visitas por navegador (PWA) migran en días: al recargar toman el bundle nuevo y el
    token se emite en la primera acción identificatoria (login, OTP o pedido).
  - Las apps instaladas migran solo cuando el usuario actualiza manualmente (ver bloqueo 1
    más abajo).

## Requisitos para pasar a `enforce` (los cuatro, sin saltarse ninguno)

1. **BLOQUEO: no hay aviso de actualización dentro de la app.** El endpoint
   `version-app/get-version-app` lo consume **otra app**, no esta
   (`Select-String -Path src -Recurse -Pattern "version-app|get-version-app|VERSION_APP"`
   no devuelve nada en este repo). Sin ese aviso, activar `enforce` rompe **todas las apps
   nativas ya instaladas** hasta que el usuario actualice por su cuenta desde la tienda; no
   hay forma de notificarlo dentro de la app. Los usuarios de la PWA web sí se actualizan
   solos (toman el bundle nuevo al recargar). Antes de `enforce` hay que, o bien añadir esa
   comprobación a la app (sprint aparte, pequeño), o bien aceptar la rotura de las apps
   nativas y avisar por otro canal (push, redes, tiendas).
2. **`SEED_CLIENTE` debe existir en el `.env` de producción incluso en modo `log`.** Si
   falta, ningún cliente puede obtener nunca un `tokenCliente` (los tres emisores devuelven
   el campo vacío) y **cada petición autenticable genera un `logger.warn`**: 100% de ruido,
   cero señal real sobre cuántos clientes ya migraron. Confirmar con
   `pm2 env <id> | Select-String SEED_CLIENTE` que la variable está seteada (sin imprimir su
   valor) antes de sacar conclusiones de los conteos de avisos.
3. **Verificar el fix del OTP en el backend.** El endpoint
   `delivery/verificar-codigo-sms` no tenía límite de peticiones y su código de 4 dígitos
   nunca se invalidaba, lo que lo hacía fuerza-bruteable hacia un token de 180 días. Esto se
   está **corrigiendo en el backend en paralelo** (límite de peticiones + invalidación del
   código); no es deuda de este sprint. Antes de `enforce`, confirmar en el repo del backend
   que ese fix está desplegado y con sus specs en verde — es un ítem de verificación, no un
   bloqueo estructural como el 1.
4. **Que los avisos `auth cliente` hayan caído a un residuo aceptable**, dos a cuatro
   semanas después de que la app nueva esté publicada (`versionCode 4`, `versionName
   1.0.3`) y de haber actualizado la fila de `app_version`:
   ```sql
   UPDATE app_version SET version = '1.0.3' WHERE name_app = '<nombre de la app cliente>';
   ```
   Confirmar antes el `name_app` real con `SELECT name_app, version FROM app_version;`.
   (`sql/` está en `.gitignore`: la migración no se versiona. Convención
   `sql/AAAA-MM-DD_nombre.sql`.) Este paso solo importa una vez resuelto el bloqueo 1: hoy
   subir la versión en la base no obliga a nadie a actualizar.

## Variables de entorno a agregar en producción

En el `.env` de producción del backend, agregar (nunca pegar el valor generado en un commit,
un chat ni un log):

```
SEED_CLIENTE=
AUTH_CLIENTE_MODO=log
```

Generar el valor de `SEED_CLIENTE` con:
```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Pegar el resultado directo en el `.env` del servidor (nunca en una terminal compartida, un
PR ni un mensaje) y reiniciar el proceso para que lo tome.

## Cómo se activa

En el `.env` del servidor:
```
AUTH_CLIENTE_MODO=enforce
```
y reiniciar.

## Cómo volver atrás (rollback)

En el `.env` del servidor:
```
AUTH_CLIENTE_MODO=off
```
y reiniciar. `off` es el rollback recomendado (no `log`): deja de verificar y de generar
avisos por completo mientras se investiga qué salió mal, en vez de seguir registrando ruido
a mitad de un incidente. No hay migración que revertir: el token no se persiste en ninguna
tabla, así que el rollback es inmediato y sin efectos secundarios en la base.

## Qué se rompe si se activa antes de tiempo

En una app o pestaña sin token:

- "Mis pedidos" queda vacío (401 en `delivery/get-mis-pedidos`).
- El seguimiento del pedido no carga (401 en `delivery/get-estado-pedido`) y el mapa del
  repartidor no se mueve (el socket no entra a la sala).
- El perfil y las direcciones no cargan ni se guardan (401 en `cliente/perfil`,
  `cliente/perfil-save`, `cliente/new-direccion`, `delivery/get-direccion-cliente`).
- No se registra el token push (401 en `push/suscripcion`): deja de recibir notificaciones.
- No se puede registrar el pago (401 en `transaction/registrar-pago`), ni calificar, ni
  borrar la cuenta.

**Lo que NO se rompe:** carta, menú, establecimientos, promociones, login/registro y el OTP
por WhatsApp. Son públicos o son los emisores del token. Tampoco se rompe el flujo del
comercio/mozo: el middleware acepta el JWT de colaborador firmado con `SEED` sin comparar
`idcliente`, porque el comercio consulta y guarda direcciones del cliente que atiende.

## Deuda declarada (queda abierta, no la resuelve este sprint)

- **Sala del socket forjable declarándose no-cliente.** El handshake solo valida el token
  para los sockets con `iscliente = true`. Los sockets de las apps de mozo, comercio y bot
  pueden unirse igual a la sala de otro cliente (`cliente_<id>`) porque su autenticación es
  del lado HTTP, no del socket. Cerrarlo exige que esas apps también manden un token en el
  handshake: sprint aparte.
- **Un JWT de colaborador puede leer cualquier cliente.** `esColaborador()` deja pasar sin
  comparar `idcliente`: cualquier token de colaborador válido (firmado con `SEED`) puede
  leer o escribir perfil, direcciones y pedidos de **cualquier** cliente, no solo el que
  está atendiendo en ese momento. Se acepta así porque el comercio necesita consultar y
  guardar direcciones del cliente que atiende (ver más arriba), pero no hay chequeo de que
  el colaborador esté realmente vinculado a ese `idcliente`.
- **En modo `log`, `salaCliente` no protege nada de verdad.** Concede la sala del socket que
  el cliente pide aunque el token diga otro `idcliente` distinto (o no haya token): es
  esperado durante el despliegue gradual, pero significa que mientras dure `log` la fuga de
  lectura vía socket sigue abierta igual que antes del sprint.
- **Enumeración de clientes por teléfono.** `delivery/search-cliente-by-phone`,
  `-pwaid` y `delivery/get-cliente-telefono-chatbot` siguen sin token porque se usan *antes*
  de que exista identidad. Lo razonable es un rate limit por IP y por teléfono, no un token.
- **`TOKEN_CONSULTA` sigue en el bundle** (`config.const.ts`). Va a un tercero
  (`apifac.papaya.com.pe`), no a nuestro backend: sacarlo exige pasar la consulta de DNI/RUC
  por el backend.
- **Sin revocación.** El token vale 180 días y no se puede invalidar. Si hiciera falta, se
  agrega `cliente.token_version INT DEFAULT 0` al payload y se compara: es la única razón por
  la que este sprint tocaría la base.
- **`login.js:46,94` compara contraseñas en claro** y `loggerUsAutorizado` mete la fila
  completa del usuario (con la contraseña en base64) dentro del JWT de colaborador. Fuera de
  alcance de este sprint, pero sigue ahí.
