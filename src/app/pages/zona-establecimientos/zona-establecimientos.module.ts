import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainComponent } from './main/main.component';
import { EstablecimientosComponent } from './establecimientos/establecimientos.component';
import { ZonaEstablecimientosRoutingModule } from './zona-establecimientos.routing';
import { CategoriasComponent } from './categorias/categorias.component';
import { MaterialModule } from 'src/app/core/material/material.module';
import { ComponentesModule } from 'src/app/componentes/componentes.module';
// import { DialogSelectDireccionComponent } from 'src/app/componentes/dialog-select-direccion/dialog-select-direccion.component';
import { MisOrdenesComponent } from './mis-ordenes/mis-ordenes.component';
import { MiOrdenDetalleComponent } from './mi-orden-detalle/mi-orden-detalle.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { PideLoQueQuierasComponent } from './pide-lo-que-quieras/pide-lo-que-quieras.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { CheckoutBComponent } from './checkout-b/checkout-b.component';
// import { NgxUiLoaderModule } from 'ngx-ui-loader';


@NgModule({
  declarations: [
    MainComponent,
    EstablecimientosComponent,
    CategoriasComponent,
    MisOrdenesComponent,
    // DialogSelectDireccionComponent,
    MiOrdenDetalleComponent,
    PideLoQueQuierasComponent,
    CheckoutComponent,
    CheckoutBComponent,
  ],
  imports: [
    CommonModule,
    ZonaEstablecimientosRoutingModule,
    MaterialModule,
    ComponentesModule,
    SharedModule
    // NgxUiLoaderModule
  ],
  // providers: [NgxUiLoaderModule],
  exports: [
    // DialogSelectDireccionComponent
  ],
  // entryComponents: [
  //   // DialogSelectDireccionComponent
  // ]
})
export class ZonaEstablecimientosModule { }
