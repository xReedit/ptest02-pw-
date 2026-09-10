import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

declare global {
  interface Window {
    __gmapsReady?: () => void;
    gm_authFailure?: () => void;
  }
}

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {
  private loadPromise: Promise<void> | null = null;
  private authFallida = false;
  private authFallidaSubject = new BehaviorSubject<boolean>(false);
  authFallida$: Observable<boolean> = this.authFallidaSubject.asObservable();

  isLoaded(): boolean {
    return typeof google !== 'undefined' && !!google.maps && !!google.maps.places && !this.authFallida;
  }

  load(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }
    if (this.isLoaded()) {
      this.loadPromise = Promise.resolve();
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      const scriptId = 'google-maps-script';
      let done = false;
      const ok = () => { if (!done) { done = true; resolve(); } };
      const fail = () => { if (!done) { done = true; this.loadPromise = null; reject(new Error('No se pudo cargar Google Maps')); } };

      window.__gmapsReady = ok;
      window.gm_authFailure = () => { this.authFallida = true; this.authFallidaSubject.next(true); };

      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.async = true;
        script.defer = true;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places&callback=__gmapsReady`;
        script.onerror = fail;
        document.head.appendChild(script);
      }

      // por si el script ya existía y el callback ya corrió
      let intentos = 0;
      const poll = setInterval(() => {
        if (this.isLoaded()) { clearInterval(poll); ok(); return; }
        if (++intentos > 50) { clearInterval(poll); fail(); }
      }, 200);
    });

    return this.loadPromise;
  }
}
