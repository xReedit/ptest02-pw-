import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainComponent } from './main/main.component';
import { CartaComponent } from './carta/carta.component';

const routes: Routes = [{
    path: '', component: MainComponent,
    data: { titulo: 'Pedido' },
    children: [
        // {
        //     path: '', redirectTo: 'lacarta'
        // },
        {
            path: 'lacarta',
            component: CartaComponent,
            data: { titulo: 'La Carta' }
        }
    ]
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PedidoRoutingModule { }
