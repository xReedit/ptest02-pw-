import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule } from '@angular/google-maps';
import { DatosDeliveryComponent } from './datos-delivery/datos-delivery.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../core/material/material.module';
import { DebounceClickDirective } from '../shared/directivas/debounce-click.directive';
import { SharedModule } from '../shared/shared.module';
import { EncuestaOpcionComponent } from './encuesta-opcion/encuesta-opcion.component';
// import { DialogUbicacionComponent } from './dialog-ubicacion/dialog-ubicacion.component';

import { AgregarDireccionComponent } from './agregar-direccion/agregar-direccion.component';

import { ItemComercioComponent } from './item-comercio/item-comercio.component';
import { SeleccionarDireccionComponent } from './seleccionar-direccion/seleccionar-direccion.component';
import { ConfirmarDeliveryComponent } from './confirmar-delivery/confirmar-delivery.component';
import { MenuLateralClienteComponent } from './menu-lateral-cliente/menu-lateral-cliente.component';
import { DialogMetodoPagoComponent } from './dialog-metodo-pago/dialog-metodo-pago.component';
import { DialogVerificarTelefonoComponent } from './dialog-verificar-telefono/dialog-verificar-telefono.component';
import { DialogTipoComprobanteComponent } from './dialog-tipo-comprobante/dialog-tipo-comprobante.component';
import { CompPropinaDeliveryComponent } from './comp-propina-delivery/comp-propina-delivery.component';
import { MapaSoloComponent } from './mapa-solo/mapa-solo.component';
import { CompPedidoDetalleComponent } from './comp-pedido-detalle/comp-pedido-detalle.component';
import { CompCalificacionComponent } from './comp-calificacion/comp-calificacion.component';
// import { DialogDesicionComponent } from './dialog-desicion/dialog-desicion.component';
// import { DialogSelectDireccionComponent } from './dialog-select-direccion/dialog-select-direccion.component';

import { StarRatingModule } from 'angular-star-rating';
import { DialogCalificacionComponent } from './dialog-calificacion/dialog-calificacion.component';
import { DialogSelectDireccionComponent } from './dialog-select-direccion/dialog-select-direccion.component';
import { DialogTiempoEntregaComponent } from './dialog-tiempo-entrega/dialog-tiempo-entrega.component';
import { TiempoProgramadoComponent } from './tiempo-programado/tiempo-programado.component';
import { CompCajaTextoComponent } from './comp-caja-texto/comp-caja-texto.component';
import { CompOpCostoEstimadoComponent } from './comp-op-costo-estimado/comp-op-costo-estimado.component';
import { CompPideLoQueQuierasComponent } from './comp-pide-lo-que-quieras/comp-pide-lo-que-quieras.component';
import { TipoVehiculoComponent } from './tipo-vehiculo/tipo-vehiculo.component';
import { CompPideExpressComponent } from './comp-pide-express/comp-pide-express.component';
import { CompCheckComponent } from './comp-check/comp-check.component';
import { CompCtrlAddFastComponent } from './comp-ctrl-add-fast/comp-ctrl-add-fast.component';
import { CompGetDatosClienteComponent } from './comp-get-datos-cliente/comp-get-datos-cliente.component';
import { CompPasarelaPagoComponent } from './comp-pasarela-pago/comp-pasarela-pago.component';
import { SelectCiudadDeliveryComponent } from './select-ciudad-delivery/select-ciudad-delivery.component';
import { CompDatosReservaComponent } from './comp-datos-reserva/comp-datos-reserva.component';
import { CompGetHoraComponent } from './comp-get-hora/comp-get-hora.component';
import { CompTecladoNumerico } from './comp-teclado-numerico/comp-teclado-numerico.component';

// import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { DialogCalificacionSedeComponent } from './dialog-calificacion-sede/dialog-calificacion-sede.component';
import { DialogNombreClienteComponent } from './dialog-nombre-cliente/dialog-nombre-cliente.component';
import { DialogDireccionClienteDeliveryComponent } from './dialog-direccion-cliente-delivery/dialog-direccion-cliente-delivery.component';
import { CompListItemPedidoClienteComponent } from './comp-list-item-pedido-cliente/comp-list-item-pedido-cliente.component';
import { TextNomClienteComponent } from './text-nom-cliente/text-nom-cliente.component';
import { DialogConfigPuntoComponent } from './dialog-config-punto/dialog-config-punto.component';
import { MozoVirtualOnSpeechComponent } from './mozo-virtual/mozo-virtual-on-speech/mozo-virtual-on-speech.component';
import { MozoShowTraduceTextComponent } from './mozo-virtual/mozo-show-traduce-text/mozo-show-traduce-text.component';
import { ItemPromocionComponent } from './item-promocion/item-promocion.component';
import { MozoDialogComponent } from './mozo-virtual/mozo-dialog/mozo-dialog.component';
import { CompViewPromoComponent } from './comp-view-promo/comp-view-promo.component';
import { CompListCallClientComponent } from './comp-list-call-client/comp-list-call-client.component';
import { DatosFacturacionClienteComponent } from './datos-facturacion-cliente/datos-facturacion-cliente.component';
import { CompListMesasComponent } from './comp-list-mesas/comp-list-mesas.component';
import { DialogOutAuthIosComponent } from './dialog-out-auth-ios/dialog-out-auth-ios.component';
import { DialogChangeUser } from './dialog-change-user/dialog-change-user.component';

import { HoldingMarcasComponent } from './holding/marcas/marcas.component';
import { ListComponent } from './holding/marcas/list/list.component';
import { ItemComponent } from './holding/marcas/item/item.component';
import { FormaPagoComponent } from './holding/forma-pago/forma-pago.component';
import { CompListPedidosHoldingComponent } from './comp-list-pedidos-holding/comp-list-pedidos-holding.component';
import { CompOpcionesPagoHoldingComponent } from './holding/comp-opciones-pago-holding/comp-opciones-pago-holding.component';
import { CompNotificacionPersonalComponent } from './holding/comp-notificacion-personal/comp-notificacion-personal.component';
import { CompNiubizPaymentComponent } from './comp-niubiz-payment/comp-niubiz-payment.component';
import { EstadoPedidosHoldingClienteComponent } from './estado-pedidos-holding-cliente/estado-pedidos-holding-cliente.component';

@NgModule({
  declarations: [
    DatosDeliveryComponent,
    DebounceClickDirective,
    EncuestaOpcionComponent,
    AgregarDireccionComponent,
    ItemComercioComponent,
    SeleccionarDireccionComponent,
    ConfirmarDeliveryComponent,
    MenuLateralClienteComponent,
    DialogMetodoPagoComponent,
    DialogVerificarTelefonoComponent,
    DialogTipoComprobanteComponent,
    CompPropinaDeliveryComponent,
    MapaSoloComponent,
    CompPedidoDetalleComponent,
    CompCalificacionComponent,
    DialogCalificacionComponent,
    DialogSelectDireccionComponent,
    DialogTiempoEntregaComponent,
    TiempoProgramadoComponent,
    CompCajaTextoComponent,
    CompOpCostoEstimadoComponent,
    CompPideLoQueQuierasComponent,
    TipoVehiculoComponent,
    CompPideExpressComponent,
    CompCheckComponent,
    CompCtrlAddFastComponent,
    CompGetDatosClienteComponent,
    CompPasarelaPagoComponent,
    SelectCiudadDeliveryComponent,
    CompDatosReservaComponent,
    CompGetHoraComponent,
    DialogCalificacionSedeComponent,
    DialogNombreClienteComponent,
    DialogDireccionClienteDeliveryComponent,
    CompListItemPedidoClienteComponent,
    TextNomClienteComponent,
    DialogConfigPuntoComponent,
    MozoVirtualOnSpeechComponent,
    MozoShowTraduceTextComponent,
    ItemPromocionComponent,
    MozoDialogComponent,
    CompViewPromoComponent,
    CompListCallClientComponent,
    DatosFacturacionClienteComponent,
    CompListMesasComponent,
    DialogOutAuthIosComponent,
    DialogChangeUser,
    CompTecladoNumerico,
    CompListMesasComponent,
    HoldingMarcasComponent,
    ListComponent,
    ItemComponent,
    FormaPagoComponent,
    CompListPedidosHoldingComponent,
    CompOpcionesPagoHoldingComponent,
    CompNotificacionPersonalComponent,
    CompNiubizPaymentComponent,
    EstadoPedidosHoldingClienteComponent,
    // DialogDesicionComponent,
    // DialogUbicacionComponent
  ],
  imports: [
    GoogleMapsModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule,
    StarRatingModule.forRoot(),
    // NgxMaterialTimepickerModule
  ],
  exports: [
    AgregarDireccionComponent,
    DatosDeliveryComponent,
    DebounceClickDirective,
    EncuestaOpcionComponent,
    ItemComercioComponent,
    SeleccionarDireccionComponent,
    ConfirmarDeliveryComponent,
    DialogMetodoPagoComponent,
    DialogVerificarTelefonoComponent,
    DialogTipoComprobanteComponent,
    CompPropinaDeliveryComponent,
    MapaSoloComponent,
    CompPedidoDetalleComponent,
    CompCalificacionComponent,
    DialogCalificacionComponent,
    DialogSelectDireccionComponent,
    DialogTiempoEntregaComponent,
    TiempoProgramadoComponent,
    CompOpCostoEstimadoComponent,
    CompCajaTextoComponent,
    CompPideLoQueQuierasComponent,
    CompPideExpressComponent,
    TipoVehiculoComponent,
    CompCtrlAddFastComponent,
    CompGetDatosClienteComponent,
    CompPasarelaPagoComponent,
    SelectCiudadDeliveryComponent,
    CompDatosReservaComponent,
    CompGetHoraComponent,
    DialogCalificacionSedeComponent,
    CompListItemPedidoClienteComponent,
    TextNomClienteComponent,
    DialogConfigPuntoComponent,
    MozoVirtualOnSpeechComponent,
    MozoShowTraduceTextComponent,
    ItemPromocionComponent,
    MozoDialogComponent,
    CompViewPromoComponent,
    CompListCallClientComponent,
    DatosFacturacionClienteComponent,
    CompListMesasComponent,
    DialogChangeUser,
    CompTecladoNumerico,
    CompListMesasComponent,
    HoldingMarcasComponent,
    ListComponent,
    ItemComponent,
    FormaPagoComponent,
    CompListPedidosHoldingComponent,
    CompOpcionesPagoHoldingComponent,
    CompNotificacionPersonalComponent,
    CompNiubizPaymentComponent,
    EstadoPedidosHoldingClienteComponent,
    // DialogDesicionComponent
  ],

  // entryComponents: [
  //   DialogMetodoPagoComponent,
  //   DialogVerificarTelefonoComponent,
  //   DialogTipoComprobanteComponent,
  //   DialogCalificacionComponent,
  //   DialogSelectDireccionComponent,
  //   DialogTiempoEntregaComponent
  //   // DialogDesicionComponent
  // ]
})
export class ComponentesModule { }
