import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/core/material/material.module';
import { PagarCuentaComponent } from './pagar-cuenta/pagar-cuenta.component';
import { PagarCuentaRoutingModule } from './pagar.cuenta.routing';
import { PagoRespuestaComponent } from './pago-respuesta/pago-respuesta.component';
import { DialogDesicionComponent } from 'src/app/componentes/dialog-desicion/dialog-desicion.component';
import { PedidoConfirmadoMsjComponent } from './pedido-confirmado-msj/pedido-confirmado-msj.component';
import { MainComponent } from './main/main.component';


@NgModule({
  declarations: [
    PagarCuentaComponent,
    PagoRespuestaComponent,
    DialogDesicionComponent,
    PedidoConfirmadoMsjComponent,
    MainComponent
  ],
  imports: [
    CommonModule,
    PagarCuentaRoutingModule,
    MaterialModule
  ],
  // entryComponents: [
  //   DialogDesicionComponent
  // ]
})
export class PagarCuentaModule { }
