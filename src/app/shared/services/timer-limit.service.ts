import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Injectable({
  providedIn: 'root'
})
export class TimerLimitService {

  private countdownTimerRef = null;
  private init = 0;
  public maxTime: number; // 3min defult
  private valPorcentaje = 0;
  private isPlayTimer = false;


  private countdownSource = new BehaviorSubject<number>(0);
  public countdown$ = this.countdownSource.asObservable();

  private isTimeLimitSource = new BehaviorSubject<boolean>(false);
  public isTimeLimitComplet$ = this.isTimeLimitSource.asObservable();

  private isPorgressVisibleSource = new BehaviorSubject<boolean>(false);
  public isPorgressVisible$ = this.isPorgressVisibleSource.asObservable();

  constructor() {
   }

  destroy(): void {
    this.clearTimeout();
  }

  playCountTimerLimit(): void {
    if (this.isPlayTimer) {return; }
    this.initCount();
    this.isPlayTimer = true;
  }

  resetCountTimerLimit(): void {
    if (localStorage.getItem('sys::tcount') ) {
      this.initCount();
    } else {
      this.stopCountTimerLimit();
    }
  }

  private initCount(): void {
    this.valPorcentaje = 0;
    this.init = localStorage.getItem('sys::tcount') ? parseInt(localStorage.getItem('sys::tcount'), 0) : 0;
    this.isTimeLimitSource.next(false);
    this.isPorgressVisibleSource.next(true);
    this.progressCount();
  }

  private progressCount(): void {
    this.countdownTimerRef = setTimeout(() => {
      this.init++;
      this.valPorcentaje = Math.round((this.init / this.maxTime) * 100);
      // guardamos en el
      localStorage.setItem('sys::tcount', this.init.toString());

      if ( this.init > this.maxTime ) {
        this.init = this.maxTime;
        this.valPorcentaje = 100;
        this.isTimeLimitSource.next(true);
        this.stopCountTimerLimit();
      } else {
        // console.log('timer limit', this.valPorcentaje);
        this.countdownSource.next(this.valPorcentaje);
        this.progressCount();
      }

    }, 1000);
  }

  private stopCountTimerLimit(): void {
    this.isPlayTimer = false;
    this.init = 0;
    this.valPorcentaje = 0;
    localStorage.removeItem('sys::tcount');
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