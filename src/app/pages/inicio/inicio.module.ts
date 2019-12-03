import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InicioRoutingModule } from './inicio.routing';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/core/material/material.module';

import { MainComponent } from './main/main.component';
import { InicioComponent } from './inicio/inicio.component';
import { LoginPersonalAutorizadoComponent } from './login-personal-autorizado/login-personal-autorizado.component';
import { LectorCodigoQrComponent } from './lector-codigo-qr/lector-codigo-qr.component';

import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { LectorSuccessComponent } from './lector-success/lector-success.component';
import { CallbackAuthComponent } from './callback-auth/callback-auth.component';
// import { CallbackAuth0Component } from './callback-auth0/callback-auth0.component';

@NgModule({
  declarations: [MainComponent, InicioComponent, LoginPersonalAutorizadoComponent, LectorCodigoQrComponent, LectorSuccessComponent, CallbackAuthComponent],
  imports: [
    CommonModule,
    FormsModule,
    InicioRoutingModule,
    MaterialModule,
    ZXingScannerModule
  ]
})
export class InicioModule { }
