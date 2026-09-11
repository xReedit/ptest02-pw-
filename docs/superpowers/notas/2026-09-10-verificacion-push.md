# Verificación Sprint 3 (push) — 2026-09-10

Commit verificado: `5135745` (`fix: no abrir el dialogo de permiso de push en web/PWA`).
Entorno: Windows 11, PowerShell 5.1, Node + npm del sistema, Gradle 7.4.2 / AGP 7.3.1, JDK 17 forzado en la sesión (`JAVA_HOME` del sistema apunta a jdk-21, que Gradle 7.4.2 no soporta).

| Comprobación | Resultado |
|---|---|
| `npx ng build --configuration production` | **OK** (exit 0). `main` 1.42 MB raw / 316.78 kB transfer; Initial Total 1.60 MB raw / 341.05 kB transfer. Hash `5185fea1fd2dc446`, 8814 ms. |
| `npx cap sync android` | **OK** (exit 0). `Sync finished in 0.489s`. No generó ningún cambio en archivos trackeados (`git status --short` siguió mostrando sólo `?? docs/`). |
| Plugins sincronizados (sin `@capacitor-firebase/messaging`) | **OK**. `Found 6 Capacitor plugins for android`: `@capacitor-community/barcode-scanner@3.0.1`, `@capacitor/app@4.1.1`, `@capacitor/browser@4.1.0`, `@capacitor/camera@4.1.4`, `@capacitor/geolocation@4.1.0`, `@capacitor/push-notifications@4.1.2`. `Select-String -Path android/app/capacitor.build.gradle -Pattern "firebase"` → sin resultados. |
| `gradlew assembleDebug` (JDK 17) | **OK** (exit 0). `BUILD SUCCESSFUL in 1m 9s`, 246 tareas (175 ejecutadas, 71 up-to-date). APK: `android/app/build/outputs/apk/debug/app-debug.apk`, 18 954 208 bytes (18.08 MB). |
| `push-payload.spec.ts` | **PASS**. `TOTAL: 10 SUCCESS` en Chrome Headless 152. |
| `push.cliente.service.test.js` | **PASS**. |
| `estado-pedido.push.test.js` | **PASS**. |
| `estado-pedido.service.test.js` | **PASS**. Los tres suites juntos: `Test Suites: 3 passed, 3 total` / `Tests: 32 passed, 32 total`. |

## Detalle de las comprobaciones

### Manifiesto fuente (`android/app/src/main/AndroidManifest.xml`)

Las tres coincidencias que pide el brief están:

- L44 `com.google.android.geo.API_KEY` (valor por placeholder `${GOOGLE_MAPS_API_KEY}`, resuelto desde `android/local.properties`, que no está trackeado). El cierre `</application>` está en la L56, así que la meta-data de Maps queda **dentro** de `<application>`.
- L48 `com.google.firebase.messaging.default_notification_channel_id`.
- L63 `android.permission.POST_NOTIFICATIONS` (a nivel de `<manifest>`, después de `</application>`, que es donde corresponde un `uses-permission`).

### Manifiesto fusionado (`android/app/build/intermediates/merged_manifest/debug/AndroidManifest.xml`)

Regenerado por este `assembleDebug` y vuelto a comprobar:

- L18 `POST_NOTIFICATIONS`.
- L102 `com.google.android.geo.API_KEY` — dentro de `<application>`, confirmando que el hallazgo 7 sigue cerrado tras el `sync`.
- L107 / L110 / L113 los tres `default_notification_channel_id`, `default_notification_icon` y `default_notification_color` de FCM.

### Avisos del build de Gradle

Los únicos warnings son preexistentes y ajenos al sprint: `WARNING:Using flatDir should be avoided because it doesn't support any meta-data formats.` (x2) y el aviso genérico de features deprecadas de cara a Gradle 8.0. **No** hubo ningún error de recurso no encontrado para `ic_stat_notify` ni `notification_color`, que era el riesgo que este paso venía a descartar.

### Avisos del build de producción de la app

Preexistentes: archivos de `src/app/pages/cash/**`, `pages.module.ts`, `imagen-no-encontrada.pipe.ts` y `comand-accion-text.service.ts` marcados como "part of the TypeScript compilation but it's unused", y bailouts de CommonJS (`@zxing/library`, `ngx-socket-io`, `geolocation-utils`, `string-similarity`, imports profundos de `rxjs/internal/**`). Ninguno lo introduce este sprint.

### `cap sync` no produjo diff

`npx cap sync android` reescribió `android/app/src/main/assets/public/**` (ignorado por `android/.gitignore:96`) y `android/app/src/main/assets/capacitor.config.json`, pero el contenido resultante es idéntico al que ya estaba trackeado. `android/app/capacitor.build.gradle`, `android/capacitor.settings.gradle` y `android/app/src/main/assets/capacitor.plugins.json` tampoco cambiaron: Task 2 ya los había regenerado con `npx cap update android` al desinstalar `@capacitor-firebase/messaging`. Es decir, de los cuatro archivos que el Step 7 mandaba agregar al commit, ninguno tiene diff.

El único archivo nuevo de esta tarea es esta misma bitácora. `docs/` **no** está en `.gitignore` (`git check-ignore` sobre este archivo devuelve exit 1), pero por el contrato del sprint `docs/` se mantiene sin trackear, igual que en las Tasks 1 a 5. Por eso esta tarea **no produce commit**: `HEAD` sigue en `5135745` y `git status --short` sigue mostrando sólo `?? docs/`. Si se decide versionar la bitácora, el mensaje ya está escrito en `.superpowers/sdd/2026-09-10-sprint3-push/commit-msg-task-6.txt`.

## No verificado

- **iOS.** No se corrió `npx cap sync ios`: CocoaPods no está instalado en esta máquina (`pod` y `ruby` no existen en el PATH), y el `sync` de iOS termina en `pod install`. Las ediciones de iOS de Task 2 (`Podfile` sin `CapacitorFirebaseMessaging`, `App.entitlements` con `aps-environment = production`, `Info.plist` con `UIBackgroundModes: remote-notification`) están hechas a mano pero **sin compilar**. Queda pendiente `pod install` + build en una máquina macOS con Xcode.
- **APK de release.** Sólo se compiló `assembleDebug`. `assembleRelease` (firma, minificación R8) no se probó.
- **Comportamiento en dispositivo.** Todo lo de la sección siguiente.

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
- El icono `ic_stat_notify` es un círculo blanco liso (placeholder funcional); la silueta real de la marca queda pendiente.
- iOS sin verificar en build (ver "No verificado").
