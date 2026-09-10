---
description: Flujo de confirmación de pedido para holdings con opciones de pago
---

# Flujo de Pago para Holdings

## Descripción General

Este flujo se activa cuando un cliente realiza un pedido de múltiples marcas (holding) y está listo para confirmar su pedido. El sistema presenta dos opciones de pago:

1. **Llamar a Personal**: El personal se acerca a la mesa para realizar el cobro y confirmación
2. **Pagar y Confirmar**: El cliente realiza el pago con tarjeta a través de la pasarela de pagos

## Componentes Creados

### 1. CompOpcionesPagoHoldingComponent
**Ubicación**: `src/app/componentes/holding/comp-opciones-pago-holding/`

Componente que muestra las dos opciones de pago al cliente:
- Diseño responsive con cards interactivos
- Emite evento `opcionSeleccionada` con el valor: `'llamar_personal'` o `'pagar_confirmar'`

### 2. CompNotificacionPersonalComponent
**Ubicación**: `src/app/componentes/holding/comp-notificacion-personal/`

Componente que se muestra después de seleccionar "Llamar a Personal":
- Muestra animación de notificación en progreso
- Permite cancelar y volver a las opciones
- Permite cambiar a la opción de pagar con tarjeta
- Emite eventos: `cancelarNotificacion` e `irAPagar`

## Servicio Actualizado

### HoldingService
**Método agregado**: `guardarPedidoClienteHolding(pedido, idcliente, idsede_holding)`

- **Endpoint**: `holding/guardar-pedido-cliente-holding`
- **Parámetros**:
  - `id`: 0 (nuevo pedido)
  - `pedido`: JSON stringificado del pedido completo
  - `idcliente`: ID del cliente
  - `idsede_holding`: ID de la sede del holding

## Flujo de Ejecución

### Cuando el cliente hace clic en "Continuar":

1. **Verificación de Holding**
   - En `confirmarPeiddo()` después de mostrar la pantalla de confirmación
   - Se verifica si `isHolding && isCliente`
   - Si es true, muestra inmediatamente `CompOpcionesPagoHoldingComponent`
   - Esto reemplaza la pantalla estándar de "Por favor, verifique su pedido..."

2. **Opción 1: Llamar a Personal**
   ```
   Usuario selecciona → guardarPedidoHoldingLlamarPersonal()
   → Construye dataPedido → Llama a holdingService.guardarPedidoClienteHolding()
   → Si success: Muestra CompNotificacionPersonalComponent
   → El pedido queda guardado esperando confirmación del personal
   ```

3. **Opción 2: Pagar y Confirmar**
   ```
   Usuario selecciona → guardarPedidoHoldingPagarConfirmar()
   → Construye dataPedido → Guarda en dataPedidoHoldingTemp
   → Redirige a ./pagar-cuenta (pasarela de pagos)
   → Después del pago exitoso → Se envía el pedido definitivo
   ```

### Desde la pantalla de notificación:

- **Cancelar**: Vuelve a mostrar las opciones de pago
- **Cambiar a Pagar con Tarjeta**: Ejecuta el flujo de pagar y confirmar

## Variables de Estado en ResumenPedidoComponent

```typescript
isHolding: boolean                    // Si es un pedido de holding
isShowOpcionesHolding: boolean        // Muestra el componente de opciones
isShowNotificacionPersonal: boolean   // Muestra el componente de notificación
opcionHoldingSeleccionada: string     // 'llamar_personal' o 'pagar_confirmar'
dataPedidoHoldingTemp: any           // Datos temporales del pedido para pagar
```

## Métodos Principales

### `onOpcionHoldingSeleccionada(opcion: string)`
Maneja la selección de la opción de pago

### `guardarPedidoHoldingLlamarPersonal()`
Guarda el pedido en el endpoint y muestra la notificación

### `guardarPedidoHoldingPagarConfirmar()`
Prepara el pedido y redirige a la pasarela de pagos

### `construirDataPedido()`
Construye el objeto de datos del pedido con toda la información necesaria

### `onCancelarNotificacionPersonal()`
Vuelve a las opciones de pago

### `onIrAPagarDesdeNotificacion()`
Cambia de "Llamar a Personal" a "Pagar y Confirmar"

### `onVolverAtrasOpcionesHolding()`
Vuelve desde las opciones de pago a la vista del pedido

## Integración en HTML

Los componentes se integran en `resumen-pedido.component.html` dentro de la sección de confirmación para clientes:

```html
<!-- Opciones de pago para holding -->
<ng-container *ngIf="isHolding && isShowOpcionesHolding">
    <app-comp-opciones-pago-holding
        (opcionSeleccionada)="onOpcionHoldingSeleccionada($event)"
        (volverAtras)="onVolverAtrasOpcionesHolding()">
    </app-comp-opciones-pago-holding>
</ng-container>

<!-- Notificación al personal -->
<ng-container *ngIf="isHolding && isShowNotificacionPersonal">
    <app-comp-notificacion-personal
        (cancelarNotificacion)="onCancelarNotificacionPersonal()"
        (irAPagar)="onIrAPagarDesdeNotificacion()">
    </app-comp-notificacion-personal>
</ng-container>
```

## Notas Importantes

1. El flujo solo se activa cuando `infoToken.getIsHolding()` retorna `true`
2. El pedido se guarda ANTES de mostrar la notificación en "Llamar a Personal"
3. El pedido se guarda DESPUÉS del pago exitoso en "Pagar y Confirmar"
4. Los componentes están declarados y exportados en `ComponentesModule`
5. El servicio `HoldingService` está inyectado en `ResumenPedidoComponent`
6. El footer se oculta automáticamente cuando se muestran las opciones de holding o la notificación
7. El componente de opciones incluye un botón "Volver a mi pedido" para regresar

## Próximos Pasos Sugeridos

1. Implementar la lógica en la pasarela de pagos para enviar el pedido después del pago exitoso
2. Agregar notificación push/socket al personal cuando se selecciona "Llamar a Personal"
3. Implementar timeout o cancelación automática si el personal no responde
4. Agregar analytics para trackear qué opción eligen más los clientes
