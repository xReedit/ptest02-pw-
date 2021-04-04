import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './main/main.component';
import { InfoReservaComponent } from './info-reserva/info-reserva.component';
import { ListaComerciosComponent } from './lista-comercios/lista-comercios.component';

const routes: Routes = [{
    path: '', component: MainComponent,
    data: { titulo: 'Inicio' },
    children: [
        {
            path: '', redirectTo: 'info-reserva'
        },
        {
            path: 'info-reserva',
            component: InfoReservaComponent,
            data: { titulo: 'Informacion reserva' }
        },
        {
            path: 'lista-comercios-reserva',
            component: ListaComerciosComponent,
            data: { titulo: 'Lista de comercios' }
        }
    ]
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ReservarMesaRoutingModule { }
