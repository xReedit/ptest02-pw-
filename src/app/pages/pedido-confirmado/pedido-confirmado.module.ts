import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmadoComponent } from './confirmado/confirmado.component';
import { PedidoConfirmadoRoutingModule } from './pedido-confirmado.routing';
import { MaterialModule } from 'src/app/core/material/material.module';



@NgModule({
  declarations: [
    ConfirmadoComponent
  ],
  imports: [
    CommonModule,
    PedidoConfirmadoRoutingModule,
    MaterialModule
  ]
})
export class PedidoConfirmadoModule { }
