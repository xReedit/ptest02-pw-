import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
// import { LayoutMainComponent } from './core/layout-main/layout-main.component';
import { AuthGuard } from './shared/guards/auth.guard';
import { ClienteProfileGuard } from './shared/guards/cliente-profile-guards';
import { LectorCodigoQrComponent } from './pages/inicio/lector-codigo-qr/lector-codigo-qr.component';

const routes: Routes = [
  // { path: '', redirectTo: '', pathMatch: 'full' },
  // {
  // path: '',
  // component: LayoutMainComponent,
  // children: [
    {
      path: 'aa',
      loadChildren: () => import('./pages/cliente-profile/cliente-profile.module').then(m => m.ClienteProfileModule),
      // canActivate: [ClienteProfileGuard],
      data: { 'tituloModulo': 'Cliente Profile' }
    },
    {
      path: '',
      loadChildren: () => import('./pages/inicio/inicio.module').then(m => m.InicioModule),
      data: { 'tituloModulo': 'Inicio' }
    },
    {
      path: 'home',
      loadChildren: () => import('./pages/inicio/inicio.module').then(m => m.InicioModule),
      data: { 'tituloModulo': 'Inicio' }
    },
    {
      path: 'pedido',
      loadChildren: () => import('./pages/pedido/pedido.module').then(m => m.PedidoModule),
      canActivate: [AuthGuard],
      data: { 'tituloModulo': 'Pedido' }
    },
    {
      path: 'lanzar-encuesta',
      loadChildren: () => import('./pages/encuesta/encuesta.module').then(m => m.EncuestaModule),
      canActivate: [AuthGuard],
      data: { 'tituloModulo': 'Encuesta' }
    },
    {
      path: 'pagar-cuenta',
      loadChildren: () => import('./pages/pagar-cuenta/pagar-cuenta.module').then(m => m.PagarCuentaModule),
      canActivate: [AuthGuard],
      data: { 'tituloModulo': 'Cuenta' }
    },
    {
      path: 'pedido-confirmado',
      loadChildren: () => import('./pages/pedido-confirmado/pedido-confirmado.module').then(m => m.PedidoConfirmadoModule),
      canActivate: [AuthGuard],
      data: { 'tituloModulo': 'pedido-confirmado' }
    },
    {
      path: 'cliente-profile',
      loadChildren: () => import('./pages/cliente-profile/cliente-profile.module').then(m => m.ClienteProfileModule),
      canActivate: [ClienteProfileGuard],
      data: { 'tituloModulo': 'Cliente Profile' }
    },
    {
      path: 'zona-delivery',
      loadChildren: () => import('./pages/zona-establecimientos/zona-establecimientos.module').then(m => m.ZonaEstablecimientosModule),
      // canActivate: [ClienteProfileGuard],
      data: { 'tituloModulo': 'Cliente Zona Delivery' }
    },
    {
      path: 'cash-atm',
      loadChildren: () => import('./pages/cash/cash.module').then(m => m.CashModule),
      data: { 'tituloModulo': 'Atm' }
    },
    {
      path: 'reservar-mesa',
      loadChildren: () => import('./pages/reservar-mesa/reservar-mesa.module').then(m => m.ReservarMesaModule),
      data: { 'tituloModulo': 'Reserva' }
    }
];

@NgModule({
  imports: [RouterModule.forRoot(
    routes, {
      useHash: true,
      scrollPositionRestoration: 'enabled',
      // anchorScrolling: 'enabled',
      paramsInheritanceStrategy: 'always'
    }
    )],
  exports: [RouterModule]
})
export class AppRoutingModule { }
