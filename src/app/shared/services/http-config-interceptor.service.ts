import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { catchError } from 'rxjs/operators';
import { InfoTockenService } from './info-token.service';
import { CrudHttpService } from './crud-http.service';
import { AuthServiceSotrage } from './auth.service';
import { URL_SERVER } from '../config/config.const';
import { leerTokenCliente } from '../utils/token-cliente';

@Injectable()
export class HttpConfigInterceptorService implements HttpInterceptor {

  constructor(
    private authService: AuthServiceSotrage
    , private crudService: CrudHttpService
    , private infoTockenService: InfoTockenService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(this.conTokenCliente(request))
      .pipe(
        catchError((err, caught: Observable<HttpEvent<any>>) => {
          // refreshToken() reenvia usuario y pass del colaborador: sin sesion de
          // colaborador no hay nada que refrescar y atob(undefined) reventaria.
          if (err instanceof HttpErrorResponse && err.status === 401 && !!this.infoTockenService.getTokenAuth()) {
            // si es error 401 de autentificacion es decir token caducadado
            // lo refresquea
            this.crudService.refreshToken().subscribe(res => {
              this.authService.setLocalToken(res.token);
              this.authService.setLoggedStatus(true);
            });
          }
          throw err;
        })
      );
  }

  // Token de sesion del cliente (sprint 5). Se agrega aqui y no en crud-http.service para
  // no tocar la firma de postFree ni las ~20 llamadas que ya pasan conToken = false.
  // Dos condiciones: la peticion va a NUESTRO backend, y no trae ya un Authorization
  // (el del mozo en getHeaderHttpClientForm y el de la consulta de DNI/RUC a un tercero).
  private conTokenCliente(request: HttpRequest<any>): HttpRequest<any> {
    if (!request.url.startsWith(URL_SERVER)) { return request; }
    if (request.headers.has('Authorization')) { return request; }

    const token = leerTokenCliente();
    if (!token) { return request; }

    return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
}
