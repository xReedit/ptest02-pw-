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
// import { DirectionsMapDirectiveDirective } from './shared/directivas/directions-map-directive.directive';


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
    // ServiceWorkerModule.register('assets/js/custom-service-worker.js', { enabled: environment.production })
  ],
  providers: [{provide: ErrorHandler, useClass: GlobalErrorHandler}],
  bootstrap: [AppComponent]
})
export class AppModule { }
