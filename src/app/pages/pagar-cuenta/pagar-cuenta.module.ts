import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/core/material/material.module';
import { PagarCuentaComponent } from './pagar-cuenta/pagar-cuenta.component';
import { PagarCuentaRoutingModule } from './pagar.cuenta.routing';
import { PagoRespuestaComponent } from './pago-respuesta/pago-respuesta.component';
import { ComponentesModule } from 'src/app/componentes/componentes.module';
// import { DialogDesicionComponent } from 'src/app/componentes/dialog-desicion/dialog-desicion.component';


@NgModule({
  declarations: [
    PagarCuentaComponent,
    PagoRespuestaComponent,
    // DialogDesicionComponent
  ],
  imports: [
    CommonModule,
    PagarCuentaRoutingModule,
    MaterialModule,
    ComponentesModule
  ],
  // entryComponents: [
  //   DialogDesicionComponent
  // ]
})
export class PagarCuentaModule { }
