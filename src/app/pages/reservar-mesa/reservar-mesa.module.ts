import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainComponent } from './main/main.component';
import { InfoReservaComponent } from './info-reserva/info-reserva.component';
import { ListaComerciosComponent } from './lista-comercios/lista-comercios.component';
import { ReservarMesaRoutingModule } from './reservar-mesa.routing';
import { MaterialModule } from 'src/app/core/material/material.module';
import { ComponentesModule } from 'src/app/componentes/componentes.module';



@NgModule({
  declarations: [MainComponent, InfoReservaComponent, ListaComerciosComponent],
  imports: [
    CommonModule,
    ReservarMesaRoutingModule,
    MaterialModule,
    ComponentesModule
  ]
})
export class ReservarMesaModule { }
