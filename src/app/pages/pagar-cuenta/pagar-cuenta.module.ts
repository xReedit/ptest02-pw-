import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/core/material/material.module';
import { PagarCuentaComponent } from './pagar-cuenta/pagar-cuenta.component';
import { PagarCuentaRoutingModule } from './pagar.cuenta.routing';


@NgModule({
  declarations: [
    PagarCuentaComponent
  ],
  imports: [
    CommonModule,
    PagarCuentaRoutingModule,
    MaterialModule
  ]
})
export class PagarCuentaModule { }
