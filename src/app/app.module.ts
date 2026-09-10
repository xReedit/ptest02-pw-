import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler, APP_INITIALIZER } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
// import { SharedModule } from './shared/shared.module';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { ServiceWorkerModule } from '@angular/service-worker';
import { GlobalErrorHandler } from './shared/services/error.global.handler';
import { environment } from '../environments/environment';
import { SocketIoModule } from 'ngx-socket-io';
import { LocationStrategy, PathLocationStrategy } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthConfig, AuthModule } from '@auth0/auth0-angular';
// import config from '../../capacitor.config';
// import { IS_NATIVE } from './shared/config/config.const';
import { domain, clientId, callbackUri } from './auth.config';
import { GoogleMapsLoaderService } from './shared/services/google-maps-loader.service';
// import { GoogleMapsModule } from '@angular/google-maps';

// const redirectUri = callbackUri;
// const redirectUri = `<%= "${config.appId}" %>://${account.namespace}/capacitor/<%= "${config.appId}" %>/callback`;
// import { DirectionsMapDirectiveDirective } from './shared/directivas/directions-map-directive.directive';

const configAuth: AuthConfig = {
  domain,
  clientId,
  authorizationParams: {
    redirect_uri: callbackUri
  },
  cacheLocation: "localstorage",
  useRefreshTokens: true
}


@NgModule({
  declarations: [
    AppComponent,
    // DirectionsMapDirectiveDirective,
    // DebounceClickDirective
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    // SharedModule,
    // ReactiveFormsModule,
    FormsModule,
    AppRoutingModule,
    CoreModule,
    SocketIoModule,
    //ServiceWorkerModule.register('ngsw-worker.js', { 
    //enabled: environment.production,
     // registrationStrategy: 'registerWhenStable:30000'
     //}),
    AuthModule.forRoot(configAuth),
    // GoogleMapsModule,
    // ServiceWorkerModule.register('assets/js/custom-service-worker.js', { enabled: environment.production })
  ],
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    {provide: LocationStrategy, useClass: PathLocationStrategy}, // 22012022 eliminar el #
    {
      provide: APP_INITIALIZER,
      // ponytail: Maps se carga en segundo plano; si no llega en 5 s la app arranca igual y los mapas se cargan al usarse
      useFactory: (googleMapsLoader: GoogleMapsLoaderService) => () =>
        Promise.race([googleMapsLoader.load(), new Promise<void>(resolve => setTimeout(resolve, 5000))]).catch(() => undefined),
      deps: [GoogleMapsLoaderService],
      multi: true
    }
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
