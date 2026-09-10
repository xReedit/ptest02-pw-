import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthServiceSotrage } from '../services/auth.service';
import { VerifyAuthClientService } from '../services/verify-auth-client.service';
import { InfoTockenService } from '../services/info-token.service';
// import { InfoTockenService } from '../services/info-token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthServiceSotrage,
    private verifyClientService: VerifyAuthClientService,
    private infoTokenService: InfoTockenService,
    private router: Router,
  ) {}

  // canActivate(
  //   next: ActivatedRouteSnapshot,
  //   state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

  //   return true;
  // }

  canActivate(): boolean | UrlTree {
    // getInfoUs() primero: restaura '::token' desde 'sys::tpm' y recien despues
    // getLoggedStatus() puede verlo (al reves el cliente caia a '/' tras recargar)
    const infoToken = this.infoTokenService.getInfoUs();
    const us = this.authService.getLoggedStatus();
    if (!infoToken) {
      return us ? true : this.router.parseUrl('/');
    }
    const clienteAutorizado = (this.verifyClientService.getIsQrSuccess() && us) || this.verifyClientService.isLogin();
    const res = infoToken.isCliente
      ? (infoToken.isDelivery || infoToken.isReserva ? true : clienteAutorizado)
      : us;
    return res ? true : this.router.parseUrl('/');
  }

}
