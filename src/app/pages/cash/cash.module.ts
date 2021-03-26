import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainComponent } from './main/main.component';
import { AtmComponent } from './atm/atm.component';
import { CashRoutingModule } from './cash.rounting';
import { MaterialModule } from 'src/app/core/material/material.module';
import { ComponentesModule } from 'src/app/componentes/componentes.module';



@NgModule({
  declarations: [MainComponent, AtmComponent],
  imports: [
    CommonModule,
    CashRoutingModule,
    MaterialModule,
    ComponentesModule
  ]
})
export class CashModule { }
