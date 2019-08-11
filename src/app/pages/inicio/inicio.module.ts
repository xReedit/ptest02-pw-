import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InicioRoutingModule } from './inicio.routing';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/core/material/material.module';

import { MainComponent } from './main/main.component';
import { InicioComponent } from './inicio/inicio.component';
import { LoginPersonalAutorizadoComponent } from './login-personal-autorizado/login-personal-autorizado.component';

@NgModule({
  declarations: [MainComponent, InicioComponent, LoginPersonalAutorizadoComponent],
  imports: [
    CommonModule,
    FormsModule,
    InicioRoutingModule,
    MaterialModule
  ]
})
export class InicioModule { }
