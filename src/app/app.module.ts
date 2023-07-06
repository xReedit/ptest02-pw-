import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
// import { SharedModule } from './shared/shared.module';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { ServiceWorkerModule } from '@angular/service-worker';
// import { GlobalErrorHandler } from './shared/services/error.global.handler';
import { environment } from '../environments/environment';
import { SocketIoModule } from 'ngx-socket-io';
import { LocationStrategy, PathLocationStrategy } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
// import { AgmCoreModule } from '@agm/core';
import { AuthConfig, AuthModule } from '@auth0/auth0-angular';
// import config from '../../capacitor.config';
// import { IS_NATIVE } from './shared/config/config.const';
import { domain, clientId, callbackUri } from './auth.config';

// const redirectUri = callbackUri;
// const redirectUri = `<%= "${config.appId}" %>://${account.namespace}/capacitor/<%= "${config.appId}" %>/callback`;
// import { DirectionsMapDirectiveDirective } from './shared/directivas/directions-map-directive.directive';

const configAuth: AuthConfig = {
  domain,
  clientId,
  redirectUri: callbackUri,
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
    ServiceWorkerModule.register('ngsw-worker.js', { 
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000'
     }),
    // AgmCoreModule.forRoot({
    //   apiKey: 'AIzaSyAknWQFyVH1RpR2OAL0vRTHTapaIpfKSqo',
    //   libraries: ['places']
    // }),
    AuthModule.forRoot(configAuth),
    // ServiceWorkerModule.register('assets/js/custom-service-worker.js', { enabled: environment.production })
  ],
  providers: [
    // {provide: ErrorHandler, useClass: GlobalErrorHandler},
    {provide: LocationStrategy, useClass: PathLocationStrategy} // 22012022 eliminar el #
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
