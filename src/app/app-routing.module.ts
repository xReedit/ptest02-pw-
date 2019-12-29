import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutMainComponent } from './core/layout-main/layout-main.component';
import { AuthGuard } from './shared/guards/auth.guard';

const routes: Routes = [{
  path: '',
  component: LayoutMainComponent,
  children: [
    {
      path: '',
      loadChildren: () => import('./pages/inicio/inicio.module').then(m => m.InicioModule),
      data: { 'tituloModulo': 'Inicio' }
    },
    {
      path: 'pedido',
      loadChildren: () => import('./pages/pedido/pedido.module').then(m => m.PedidoModule),
      canActivate: [AuthGuard],
      data: { 'tituloModulo': 'Pedido' }
    }
  ]
}];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
