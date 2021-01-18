import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ConfirmadoComponent } from './confirmado/confirmado.component';

const routes: Routes = [{
    path: '', component: ConfirmadoComponent,
    data: { titulo: 'Cuenta' },
    children: [
        {
            path: '',
            redirectTo: 'confirmado'
        }
    ]
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class PedidoConfirmadoRoutingModule { }
