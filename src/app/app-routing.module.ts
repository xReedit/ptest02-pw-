import { NgModule } from '@angular/core';
import { Routes, RouterModule, Router, PreloadAllModules } from '@angular/router';
// import { LayoutMainComponent } from './core/layout-main/layout-main.component';
import { AuthGuard } from './shared/guards/auth.guard';
import { ClienteProfileGuard } from './shared/guards/cliente-profile-guards';
import { LocationStrategy, PathLocationStrategy } from '@angular/common';

// para acceso directo url a la carta y lector qr
import { MainComponent } from './pages/inicio/main/main.component';
import { RedirecLectorComponent } from './pages/inicio/redirec-lector/redirec-lector.component';
import { LectorCodigoQrComponent } from './pages/inicio/lector-codigo-qr/lector-codigo-qr.component';
// import { LectorCodigoQrComponent } from './pages/inicio/lector-codigo-qr/lector-codigo-qr.component';

const routes: Routes = [
  // { path: '', redirectTo: '', pathMatch: 'full' },
  // {
  // path: '',
  // component: LayoutMainComponent,
  // children: [
    // {
    //   path: 'aa',
    //   loadChildren: () => import('./pages/cliente-profile/cliente-profile.module').then(m => m.ClienteProfileModule),
    //   // canActivate: [ClienteProfileGuard],
    //   data: { 'tituloModulo': 'Cliente Profile' }
    // },
    // {
    //   path: 'carta/:nomsede',
    //   loadChildren: () => import('./pages/inicio/inicio.module').then(m => m.InicioModule),
    //   data: { 'tituloModulo': 'Inicio' }
    // },
    {
      path: '',
      loadChildren: () => import('./pages/inicio/inicio.module').then(m => m.InicioModule),
      data: { 'tituloModulo': 'Inicio' }
    },
    {
      path: '#',
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
    // {
    //   path: 'cash-atm',
    //   loadChildren: () => import('./pages/cash/cash.module').then(m => m.CashModule),
    //   data: { 'tituloModulo': 'Atm' }
    // },
    {
      path: 'reservar-mesa',
      loadChildren: () => import('./pages/reservar-mesa/reservar-mesa.module').then(m => m.ReservarMesaModule),
      data: { 'tituloModulo': 'Reserva' }
    },
    // {
    //   path: '*',
    //   loadChildren: () => import('./pages/inicio/inicio.module').then(m => m.InicioModule),
    //   data: { 'tituloModulo': 'Inicio' }
    // },
  
    // para acceso directo url a la carta y lector qr 0623
    {
      path: 'carta/:nomsede',
      component: MainComponent,
      data: { titulo: 'Login Personal Autorizado' }
    },
    {
      path: 'redirec/:nomsede',
      component: RedirecLectorComponent,
      data: { titulo: 'Login Personal Autorizado' }
    },
    {
      path: 'lector-qr',
      component: LectorCodigoQrComponent,
      data: { titulo: 'Lector QR' }
    },
    {
      path: '#/lector-qr',
      component: LectorCodigoQrComponent,
      data: { titulo: 'Login Personal Autorizado' }
    },

    { path: '**', redirectTo: '' },
];

// Anti-bucle del errorHandler del router (ver constructor de AppRoutingModule).
const REDIRECT_COOLDOWN_MS = 5000;
let ultimaRedireccionPorError = 0;

@NgModule({
  imports: [RouterModule.forRoot(
    routes, {
    preloadingStrategy: PreloadAllModules,
    // useHash: false,
    // scrollPositionRestoration: 'top',
    // relativeLinkResolution: 'legacy'
}
    )],
    providers: [
      // 22012022 eliminar el #
      // {provide: LocationStrategy, useClass: PathLocationStrategy}
    ],
  exports: [RouterModule]
})
export class AppRoutingModule {

  constructor(private router: Router) {
    // ponytail: el errorHandler solo registra y, como mucho, redirige una vez cada
    // REDIRECT_COOLDOWN_MS. Antes convertia cualquier error del router en una nueva
    // navegacion inmediata a '' -> el mismo error -> bucle infinito (NG04014).
    this.router.errorHandler = (error: any) => {
      console.error('Router error', error);

      // Error de configuracion de rutas: redirigir volveria a lanzar el mismo error.
      const _mensaje = String((error && error.message) || error || '');
      if (error?.code === 'NG04014' || _mensaje.indexOf('Invalid configuration') > -1) { return; }

      // Si ya estamos en la ruta raiz, redirigir a '' no aporta nada.
      const _urlActual = this.router.url || '';
      if (_urlActual === '' || _urlActual === '/') { return; }

      const _ahora = Date.now();
      if (_ahora - ultimaRedireccionPorError < REDIRECT_COOLDOWN_MS) { return; }
      ultimaRedireccionPorError = _ahora;

      this.router.navigate(['']);
    };
  }

}
