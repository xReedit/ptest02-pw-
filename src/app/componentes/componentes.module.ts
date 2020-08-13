import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatosDeliveryComponent } from './datos-delivery/datos-delivery.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../core/material/material.module';
import { DebounceClickDirective } from '../shared/directivas/debounce-click.directive';
import { EncuestaOpcionComponent } from './encuesta-opcion/encuesta-opcion.component';
// import { DialogUbicacionComponent } from './dialog-ubicacion/dialog-ubicacion.component';
import { AgregarDireccionComponent } from './agregar-direccion/agregar-direccion.component';

import { AgmCoreModule } from '@agm/core';
import { ItemComercioComponent } from './item-comercio/item-comercio.component';
import { SeleccionarDireccionComponent } from './seleccionar-direccion/seleccionar-direccion.component';
import { ConfirmarDeliveryComponent } from './confirmar-delivery/confirmar-delivery.component';
import { MenuLateralClienteComponent } from './menu-lateral-cliente/menu-lateral-cliente.component';
import { DialogMetodoPagoComponent } from './dialog-metodo-pago/dialog-metodo-pago.component';
import { DialogVerificarTelefonoComponent } from './dialog-verificar-telefono/dialog-verificar-telefono.component';
import { DialogTipoComprobanteComponent } from './dialog-tipo-comprobante/dialog-tipo-comprobante.component';
import { CompPropinaDeliveryComponent } from './comp-propina-delivery/comp-propina-delivery.component';
import { MapaSoloComponent } from './mapa-solo/mapa-solo.component';
import { DirectionsMapDirectiveDirective } from '../shared/directivas/directions-map-directive.directive';
import { CompPedidoDetalleComponent } from './comp-pedido-detalle/comp-pedido-detalle.component';
import { CompCalificacionComponent } from './comp-calificacion/comp-calificacion.component';
import { DialogDesicionComponent } from './dialog-desicion/dialog-desicion.component';
// import { DialogSelectDireccionComponent } from './dialog-select-direccion/dialog-select-direccion.component';

import { StarRatingModule } from 'angular-star-rating';
import { DialogCalificacionComponent } from './dialog-calificacion/dialog-calificacion.component';
import { DialogSelectDireccionComponent } from './dialog-select-direccion/dialog-select-direccion.component';
import { DialogTiempoEntregaComponent } from './dialog-tiempo-entrega/dialog-tiempo-entrega.component';
import { TiempoProgramadoComponent } from './tiempo-programado/tiempo-programado.component';

@NgModule({
  declarations: [
    DatosDeliveryComponent,
    DebounceClickDirective,
    DirectionsMapDirectiveDirective,
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
    DialogDesicionComponent,
    // DialogUbicacionComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyAknWQFyVH1RpR2OAL0vRTHTapaIpfKSqo',
      libraries: ['places']
    }),

    StarRatingModule.forRoot()
  ],
  exports: [
    DatosDeliveryComponent,
    DebounceClickDirective,
    EncuestaOpcionComponent,
    AgregarDireccionComponent,
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
    DialogDesicionComponent
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
