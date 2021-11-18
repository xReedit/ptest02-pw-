import { Component, OnInit } from '@angular/core';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { ComandAnalizerService } from 'src/app/shared/services/speech/comand-analizer.service';

@Component({
  selector: 'app-mozo-virtual-on-speech',
  templateUrl: './mozo-virtual-on-speech.component.html',
  styleUrls: ['./mozo-virtual-on-speech.component.css']
})
export class MozoVirtualOnSpeechComponent implements OnInit {

  isGrabando = false;

  constructor(
    private comandAnalizerService: ComandAnalizerService,
    private establecimientoService: EstablecimientoService,
  ) { }

  ngOnInit(): void {
    // si no esta habilitado
    if ( this.establecimientoService.get().speech_disabled === 0 ) {return; }

    this.comandAnalizerService.getComands();
  }

  goClickBtn() {
    if ( this.isGrabando ) { this.stopRecording(); } else { this.startRecording(); }
  }

  startRecording(): void {
    this.comandAnalizerService.startRecording();
    this.isGrabando = true;
  }

  stopRecording(): void {
    this.comandAnalizerService.stopRecording();
    this.isGrabando = false;
  }

}
