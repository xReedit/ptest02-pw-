import { HttpErrorResponse, HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { HttpConfigInterceptorService } from './http-config-interceptor.service';
import { KEY_TOKEN_CLIENTE } from '../utils/token-cliente';
import { URL_SERVER, URL_CONSULTA_RUC_DNI } from '../config/config.const';

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZGNsaWVudGUiOjE1LCJ0aXBvIjoiY2xpZW50ZSJ9.Zm9vLWJhci1maXJtYS1kZS1wcnVlYmE';

// sin TestBed: el interceptor solo necesita tres colaboradores y un next falso
function crear(tokenAuth: string = null, respuesta: () => Observable<any> = () => of(new HttpResponse())) {
  const enviadas: HttpRequest<any>[] = [];
  const refrescos: number[] = [];

  const authService: any = { setLocalToken: () => { }, setLoggedStatus: () => { } };
  const crudService: any = { refreshToken: () => { refrescos.push(1); return of({ token: 'nuevo' }); } };
  const infoToken: any = { getTokenAuth: () => tokenAuth };
  const next: any = { handle: (req: HttpRequest<any>) => { enviadas.push(req); return respuesta(); } };

  return { srv: new HttpConfigInterceptorService(authService, crudService, infoToken), next, enviadas, refrescos };
}

describe('HttpConfigInterceptorService', () => {

  afterEach(() => localStorage.removeItem(KEY_TOKEN_CLIENTE));

  describe('cabecera del token de cliente', () => {
    it('agrega Bearer cuando hay token y la peticion va al backend', () => {
      localStorage.setItem(KEY_TOKEN_CLIENTE, TOKEN);
      const { srv, next, enviadas } = crear();

      srv.intercept(new HttpRequest('POST', `${URL_SERVER}/delivery/get-mis-pedidos`, {}), next).subscribe();

      expect(enviadas.length).toBe(1);
      expect(enviadas[0].headers.get('Authorization')).toBe(`Bearer ${TOKEN}`);
    });

    it('no agrega nada cuando no hay token guardado', () => {
      const { srv, next, enviadas } = crear();

      srv.intercept(new HttpRequest('POST', `${URL_SERVER}/delivery/get-mis-pedidos`, {}), next).subscribe();

      expect(enviadas[0].headers.has('Authorization')).toBe(false);
    });

    it('no agrega nada a un host que no es el backend (consulta dni/ruc a un tercero)', () => {
      localStorage.setItem(KEY_TOKEN_CLIENTE, TOKEN);
      const { srv, next, enviadas } = crear();

      srv.intercept(new HttpRequest('GET', `${URL_CONSULTA_RUC_DNI}dni/12345678`), next).subscribe();

      expect(enviadas[0].headers.get('Authorization')).toBeNull();
    });

    it('no pisa el Authorization del colaborador', () => {
      localStorage.setItem(KEY_TOKEN_CLIENTE, TOKEN);
      const { srv, next, enviadas } = crear();
      const conMozo = new HttpRequest('POST', `${URL_SERVER}/cliente/new-direccion`, {}, {
        headers: new HttpHeaders().set('Authorization', 'token-del-mozo')
      });

      srv.intercept(conMozo, next).subscribe();

      expect(enviadas[0].headers.get('Authorization')).toBe('token-del-mozo');
    });

    it('no muta la peticion original', () => {
      localStorage.setItem(KEY_TOKEN_CLIENTE, TOKEN);
      const { srv, next, enviadas } = crear();
      const original = new HttpRequest('POST', `${URL_SERVER}/push/suscripcion`, {});

      srv.intercept(original, next).subscribe();

      expect(original.headers.has('Authorization')).toBe(false);
      expect(enviadas[0]).not.toBe(original);
    });
  });

  describe('401', () => {
    const error401 = () => throwError(new HttpErrorResponse({ status: 401 }));

    it('refresca el token cuando hay sesion de colaborador', () => {
      const { srv, next, refrescos } = crear('token-del-mozo', error401);

      srv.intercept(new HttpRequest('GET', `${URL_SERVER}/comercio/get-datos-impresion`), next)
        .subscribe({ error: () => { } });

      expect(refrescos.length).toBe(1);
    });

    it('NO intenta refrescar cuando es un cliente (no hay usuario ni pass que reenviar)', () => {
      localStorage.setItem(KEY_TOKEN_CLIENTE, TOKEN);
      const { srv, next, refrescos } = crear(null, error401);

      srv.intercept(new HttpRequest('POST', `${URL_SERVER}/delivery/get-mis-pedidos`, {}), next)
        .subscribe({ error: () => { } });

      expect(refrescos.length).toBe(0);
    });
  });
});
