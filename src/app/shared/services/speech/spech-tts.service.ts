import { Injectable } from '@angular/core';
import { SpechProviderConnectService } from './spech-provider-connect.service';
import { SendDataTTS } from 'src/app/modelos/send.data.tts';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Injectable({
  providedIn: 'root'
})
export class SpechTTSService {

  private isTalkingSource = new BehaviorSubject<boolean>(false);
  public isTalking$ = this.isTalkingSource.asObservable();

  sendDataTTS = new SendDataTTS();

  constructor(
    private speechProviverConnet: SpechProviderConnectService
  ) {


    this.speechProviverConnet.ttsDataEvent.subscribe(async (data) => {
      console.log('respuesta audio', data);

      // const context = new AudioContext();
      // const buffer = await context.decodeAudioData(data);
      // const source = context.createBufferSource();
      // source.buffer = buffer;
      // source.connect(context.destination);
      // source.start();

      const _urlAudio = `http://localhost:1337/resources/${data}`;
      const audio = new Audio(_urlAudio);
      audio.play();
      this.isTalkingSource.next(true);

      audio.addEventListener('ended', () => {
        console.log('finalizo hablar');
        this.isTalkingSource.next(false);
      });
    });

  }

  // enviar txt to tts
  convertTxtToVoice(data: SendDataTTS) {
    this.speechProviverConnet.emit('tts', data);
  }
}
