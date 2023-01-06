import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { SharedModule } from './shared/shared.module';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { ServiceWorkerModule } from '@angular/service-worker';
import { GlobalErrorHandler } from './shared/services/error.global.handler';
import { environment } from '../environments/environment';
import { SocketIoModule } from 'ngx-socket-io';
import { LocationStrategy, PathLocationStrategy } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AgmCoreModule } from '@agm/core';
// import { AuthConfig, AuthModule } from '@auth0/auth0-angular';
import config from '../../capacitor.config';
import { IS_NATIVE } from './shared/config/config.const';

const redirectUri = IS_NATIVE ? `${config.appId}://dev-m48s1pe2.auth0.com/capacitor/${config.appId}/callback` : 'http://localhost:4200';
// const redirectUri = `<%= "${config.appId}" %>://${account.namespace}/capacitor/<%= "${config.appId}" %>/callback`;
// import { DirectionsMapDirectiveDirective } from './shared/directivas/directions-map-directive.directive';
// const configAuth: AuthConfig = {
//   domain: "dev-m48s1pe2.auth0.com",
//   clientId: "kSs64dcx34Fo7HpDLYkE3gQH0v2MtcdR",
//   redirectUri
  /* Uncomment the following lines for better support  in browers like Safari where third-party cookies are blocked.
    See https://auth0.com/docs/libraries/auth0-single-page-app-sdk#change-storage-options for risks.
  */
  // cacheLocation: "localstorage",
  // useRefreshTokens: true
// };


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
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyAknWQFyVH1RpR2OAL0vRTHTapaIpfKSqo',
      libraries: ['places']
    }),
    // AuthModule.forRoot(configAuth),
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
