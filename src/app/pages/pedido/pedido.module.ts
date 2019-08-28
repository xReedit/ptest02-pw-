import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainComponent } from './main/main.component';
import { CartaComponent } from './carta/carta.component';
import { ResumenPedidoComponent } from './resumen-pedido/resumen-pedido.component';
import { EstadoPedidoComponent } from './estado-pedido/estado-pedido.component';
import { BuscarItemComponent } from './buscar-item/buscar-item.component';
import { PedidoRoutingModule } from './pedido.routing';
import { CoreModule } from 'src/app/core/core.module';

import { DialogItemComponent } from './resumen-pedido/dialog-item/dialog-item.component';



@NgModule({
  declarations: [MainComponent, CartaComponent, ResumenPedidoComponent, EstadoPedidoComponent, BuscarItemComponent, DialogItemComponent],
  imports: [
    CommonModule,
    PedidoRoutingModule,
    CoreModule
  ],
  exports: [
    DialogItemComponent
  ],
  entryComponents: [DialogItemComponent]
})
export class PedidoModule { }
