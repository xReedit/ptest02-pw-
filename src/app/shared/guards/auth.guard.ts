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
    const us = this.authService.getLoggedStatus();
    const infoToken = this.infoTokenService.getInfoUs();
    if (!infoToken) {
      return us ? true : this.router.parseUrl('/');
    }
    const res = infoToken.isCliente
      ? (infoToken.isDelivery || infoToken.isReserva ? true : this.verifyClientService.getIsQrSuccess() && us)
      : us;
    return res ? true : this.router.parseUrl('/');
  }

}
