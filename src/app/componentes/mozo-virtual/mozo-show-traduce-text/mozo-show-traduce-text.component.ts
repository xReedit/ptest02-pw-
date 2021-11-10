import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import { SpechTotextService } from 'src/app/shared/services/speech/spech-totext.service';
import { SpeechDataProviderService } from 'src/app/shared/services/speech/speech-data-provider.service';
import { UtilitariosService } from 'src/app/shared/services/utilitarios.service';

@Component({
  selector: 'app-mozo-show-traduce-text',
  templateUrl: './mozo-show-traduce-text.component.html',
  styleUrls: ['./mozo-show-traduce-text.component.css']
})
export class MozoShowTraduceTextComponent implements OnInit {

  private destroy$: Subject<boolean> = new Subject<boolean>();

  isShowTxtTraduce = false;
  isShowCheck = false;
  countTimeClose = null;
  txtResults: any;
  textTranscript = '';

  constructor(
    private spechTotextService: SpechTotextService,
    private speechDataProviderService: SpeechDataProviderService,
    private utilitariosSerivce: UtilitariosService
  ) { }

  ngOnInit(): void {

    this.spechTotextService.listenOnTraduce$
    .pipe(takeUntil(this.destroy$))
    .subscribe(res => {
      // console.log('traduciendo', res);
      if ( res ) { this.isShowTxtTraduce = res; }

      clearInterval(this.countTimeClose);
      this.activeCloseBanner();
    });

    this.spechTotextService.speechTexResponse$
    .pipe(takeUntil(this.destroy$))
    .subscribe((data: any) => {
      if ( !data ) {return; }
      this.txtResults = data;
      this.textTranscript = this.txtResults[0].alternatives[0].transcript;
      this.isShowCheck = false;
      // console.log('this.txtResults', this.txtResults);
    });

    this.speechDataProviderService.commandAceptado$
    .pipe(takeUntil(this.destroy$))
    .subscribe((codAceptado: number) => {
      console.log('codAceptado', codAceptado);
      if ( codAceptado > 0) {
         setTimeout(() => {
           this.isShowCheck = true;
         }, 100);

         const timeBeep = setInterval(() => {
           if ( codAceptado <= 0 ) {
             clearInterval(timeBeep);
             return;
           }
           this.utilitariosSerivce.beep();
           codAceptado--;
         }, 100);
      }
    });


  }

  private activeCloseBanner() {
    let countClose = 0;
    this.countTimeClose = setInterval(() => {
      if ( countClose > 4 ) {
        this.isShowTxtTraduce = false;
        clearInterval(this.countTimeClose);
      }
      countClose++;
    }, 1000);
  }

}
