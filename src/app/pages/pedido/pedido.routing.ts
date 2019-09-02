import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainComponent } from './main/main.component';
import { InicioComponent } from './inicio/inicio.component';
import { CartaComponent } from './carta/carta.component';


const routes: Routes = [{
    path: '', component: MainComponent,
    data: { titulo: 'Pedido' },
    children: [
        // {
        //     path: '', redirectTo: 'inicio/1', pathMatch: 'full'
        // },
        // {
        //     path: 'inicio/:id',
        //     component: InicioComponent,
        //     data: { titulo: 'Inicio' }
        // },
        {
            path: 'lacarta/:id',
            component: CartaComponent,
            data: { titulo: 'Carta' }
        },
        // {
        //     path: 'resumen',
        //     component: ResumenPedidoComponent,
        //     data: { titulo: 'Resumen' }
        // }
    ]
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PedidoRoutingModule { }
