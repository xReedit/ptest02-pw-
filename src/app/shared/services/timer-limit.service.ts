import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { InfoTockenService } from './info-token.service';

@Injectable({
  providedIn: 'root'
})
export class TimerLimitService {

  private countdownTimerRef = null;
  private init = 0;
  public maxTime: number; // 3min defult
  private valPorcentaje = 0;
  private isPlayTimer = false;
  private dateNow = new Date();


  private countdownSource = new BehaviorSubject<number>(0);
  public countdown$ = this.countdownSource.asObservable();

  private isTimeLimitSource = new BehaviorSubject<boolean>(false);
  public isTimeLimitComplet$ = this.isTimeLimitSource.asObservable();

  private isPorgressVisibleSource = new BehaviorSubject<boolean>(false);
  public isPorgressVisible$ = this.isPorgressVisibleSource.asObservable();

  constructor(
    private infoToken: InfoTockenService,
  ) {
   }

  destroy(): void {
    this.clearTimeout();
  }

  playCountTimerLimit(): void {
    if ( this.infoToken.isDelivery() || this.infoToken.isReserva() ) { return; } // cuando es delivery no cuenta tiempo
    if (this.isPlayTimer) {return; }
    this.isPlayTimer = true;
    this.initCount();
  }

  resetCountTimerLimit(): void {
    if ( this.infoToken.isDelivery() ) { return; } // cuando es delivery no cuenta tiempo
    if (localStorage.getItem('sys::tcount') ) {
      this.isPlayTimer = true;
      this.initCount();
    } else {
      this.stopCountTimerLimit();
    }
  }

  private initCount(): void {
    if ( this.infoToken.isDelivery() ) { return; } // cuando es delivery no cuenta tiempo
    this.valPorcentaje = 0;
    this.init = localStorage.getItem('sys::tcount') ? parseInt(localStorage.getItem('sys::tcount'), 0) : 0;
    this.isTimeLimitSource.next(false);
    this.isPorgressVisibleSource.next(true);
    this.progressCount();
  }

  private progressCount(): void {
    let lastValPorcentaje = 0;
    if ( !this.isPlayTimer ) {return; }
    this.countdownTimerRef = setTimeout(() => {
      this.init = this.setTimeDate();
      this.valPorcentaje = Math.round((this.init / this.maxTime) * 100);
      // guardamos en el
      localStorage.setItem('sys::tcount', this.init.toString());

      if ( this.init > this.maxTime ) {
        this.init = this.maxTime;
        this.valPorcentaje = 100;
        this.countdownSource.next(this.valPorcentaje);
        this.isTimeLimitSource.next(true);
        this.stopCountTimerLimit();
      } else {
        // console.log('timer limit', this.valPorcentaje);
        // para que no salga la alerta de incio solo una vez
        if ( lastValPorcentaje !==  this.valPorcentaje) {
          this.countdownSource.next(this.valPorcentaje);
        }
        this.progressCount();
      }

      lastValPorcentaje = this.valPorcentaje;

    }, 1000);
  }

  private setTimeDate(): number {
    const ms_new = new Date().getTime();
    const timeAfter = localStorage.getItem('sys::tnum') ? parseInt(localStorage.getItem('sys::tnum'), 0) : ms_new;
    const ms = ms_new - timeAfter;
    const sec = Math.floor((ms / 1000));

    localStorage.setItem('sys::tnum', timeAfter.toString());
    return sec;

  }

  private stopCountTimerLimit(): void {
    this.isPlayTimer = false;
    this.init = 0;
    this.valPorcentaje = 0;
    localStorage.removeItem('sys::tcount');
    localStorage.removeItem('sys::tnum');
    this.clearTimeout();
    this.isPorgressVisibleSource.next(false);
    this.isTimeLimitSource.next(false);
  }

  private clearTimeout(): void {
    if (this.countdownTimerRef) {
      clearTimeout(this.countdownTimerRef);
      this.countdownTimerRef = null;
    }
  }
}
