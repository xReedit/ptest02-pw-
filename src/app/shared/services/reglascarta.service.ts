import { Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { StorageService } from './storage.service';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class ReglascartaService {
  objReglasCarta: any;
  private keyStorage = 'sys::rules';

  constructor(
    private storageService: StorageService,
    private socketService: SocketService
  ) { }

  // Emite primero lo cacheado en sys::rules (si existe y es legible) y luego cada emision del socket,
  // asi la vista se pinta tras una recarga aunque el servidor ya haya emitido getReglasCarta.
  loadReglasCarta(): Observable<any> {
    return new Observable(observer => {
      const cached = this.readFromStorage();
      if (cached) {
        this.objReglasCarta = cached;
        observer.next(cached);
      }
      const sub = this.socketService.onReglasCarta().subscribe((res: any) => {
        this.objReglasCarta = Array.isArray(res) ? res[0] : res;
        this.codeObjInSotrage();
        observer.next(this.objReglasCarta);
      });
      return () => sub.unsubscribe();
    });
  }

  getObjReglasCarta(): any {
    return this.objReglasCarta;
  }

  private readFromStorage(): any {
    try {
      const raw = this.storageService.get(this.keyStorage);
      return raw ? JSON.parse(atob(raw)) : null;
    } catch (error) {
      return null;
    }
  }

  private codeObjInSotrage(): void {
    this.storageService.set(this.keyStorage, btoa(JSON.stringify(this.objReglasCarta)));
  }
}
