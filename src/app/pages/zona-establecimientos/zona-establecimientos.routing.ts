import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './main/main.component';
import { EstablecimientosComponent } from './establecimientos/establecimientos.component';
import { CategoriasComponent } from './categorias/categorias.component';
import { MisOrdenesComponent } from './mis-ordenes/mis-ordenes.component';
import { MiOrdenDetalleComponent } from './mi-orden-detalle/mi-orden-detalle.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { CheckoutBComponent } from './checkout-b/checkout-b.component';
import { PideLoQueQuierasComponent } from './pide-lo-que-quieras/pide-lo-que-quieras.component';

const routes: Routes = [{
    path: '', component: MainComponent,
    data: { titulo: 'Inicio' },
    children: [
        {
            path: '', redirectTo: 'establecimientos'
        },
        {
            path: 'categorias',
            component: CategoriasComponent,
            data: { titulo: 'Categorias' }
        },
        {
            path: 'establecimientos',
            component: EstablecimientosComponent,
            data: { titulo: 'Establecimientos' }
        },
        {
            path: 'pedidos',
            component: MisOrdenesComponent,
            data: { titulo: 'Mis Pedidos' }
        },
        {
            path: 'pedido-detalle',
            component: MiOrdenDetalleComponent,
            data: { titulo: 'Pedido Detalle' }
        },
        {
            path: 'lo-que-quieras',
            component: PideLoQueQuierasComponent,
            data: { titulo: 'Checkout' }
        },
        {
            path: 'checkout-b',
            component: CheckoutBComponent,
            data: { titulo: 'Checkout' }
        }
    ]
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ZonaEstablecimientosRoutingModule { }
