import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './main/main.component';
import { EstablecimientosComponent } from './establecimientos/establecimientos.component';
import { CategoriasComponent } from './categorias/categorias.component';
import { MisOrdenesComponent } from './mis-ordenes/mis-ordenes.component';
import { MiOrdenDetalleComponent } from './mi-orden-detalle/mi-orden-detalle.component';

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
        }
    ]
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ZonaEstablecimientosRoutingModule { }
