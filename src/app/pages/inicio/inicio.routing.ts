import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainComponent } from './main/main.component';
import { InicioComponent } from './inicio/inicio.component';
import { LoginPersonalAutorizadoComponent } from './login-personal-autorizado/login-personal-autorizado.component';

const routes: Routes = [{
    path: '', component: MainComponent,
    data: { titulo: 'Inicio' },
    children: [
        {
            path: '', redirectTo: 'inicio'
        },
        {
            path: 'inicio',
            component: InicioComponent,
            data: { titulo: 'Inicio' }
        },
        {
            path: 'login-personal-autorizado',
            component: LoginPersonalAutorizadoComponent,
            data: { titulo: 'Login Personal Autorizado' }
        }
    ]
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class InicioRoutingModule { }
