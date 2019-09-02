import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';
import { MainComponent } from './main/main.component';
import { InicioComponent } from './inicio/inicio.component';
import { CartaComponent } from './carta/carta.component';
import { ResumenPedidoComponent } from './resumen-pedido/resumen-pedido.component';
import { EstadoPedidoComponent } from './estado-pedido/estado-pedido.component';
import { BuscarItemComponent } from './buscar-item/buscar-item.component';
import { PedidoRoutingModule } from './pedido.routing';
import { CoreModule } from 'src/app/core/core.module';

import { DialogItemComponent } from './resumen-pedido/dialog-item/dialog-item.component';
import { DialogResetComponent } from './resumen-pedido/dialog-reset/dialog-reset.component';



@NgModule({
  declarations: [MainComponent, InicioComponent, CartaComponent, ResumenPedidoComponent, EstadoPedidoComponent, BuscarItemComponent, DialogItemComponent, DialogResetComponent],
  imports: [
    CommonModule,
    FormsModule,
    PedidoRoutingModule,
    CoreModule
  ],
  exports: [
    DialogItemComponent,
    DialogResetComponent
  ],
  entryComponents: [DialogItemComponent, DialogResetComponent]
})
export class PedidoModule { }
