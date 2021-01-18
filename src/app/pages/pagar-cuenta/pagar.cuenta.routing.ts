import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PagarCuentaComponent } from './pagar-cuenta/pagar-cuenta.component';
import { PagoRespuestaComponent } from './pago-respuesta/pago-respuesta.component';
import { PedidoConfirmadoMsjComponent } from './pedido-confirmado-msj/pedido-confirmado-msj.component';

const routes: Routes = [{
    path: '', component: PagarCuentaComponent,
    data: { titulo: 'Cuenta' },
    children: [
        {
            path: '', redirectTo: 'pagar-cuenta'
        }, {
            path: 'pago-res',
            component: PagoRespuestaComponent
        }, {
            path: 'pedido-confirmado',
            component: PedidoConfirmadoMsjComponent
        }
    ]
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PagarCuentaRoutingModule { }
