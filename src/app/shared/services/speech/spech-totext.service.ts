import { EventEmitter, Injectable, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { SpechProviderConnectService } from './spech-provider-connect.service';

@Injectable({
  providedIn: 'root'
})
export class SpechTotextService {

  // @Output() speechTexResponse: EventEmitter<any> = new EventEmitter();
  private speechTexResponseSource = new BehaviorSubject<any>(null);
  public speechTexResponse$ = this.speechTexResponseSource.asObservable();

  // si esta recibiendo traducciones
  private listenOnTraduceSource = new BehaviorSubject<boolean>(false);
  public listenOnTraduce$ = this.listenOnTraduceSource.asObservable();

  lastTranscript = '';


  // ================= CONFIG =================
  // Stream Audio
  bufferSize = 2048;
  AudioContext;
  context;
  processor;
  input;
  globalStream;

  // variables
  audioElement = document.querySelector('audio');
  finalWord = false;
  // resultText = document.getElementById('ResultText');
  removeLastSentence = true;
  streamStreaming = false;

  // audioStream constraints
  constraints = {
    audio: true,
    video: false,
  };


  constructor(
    private speechProviverConnet: SpechProviderConnectService
  ) {
    this.speechProviverConnet.speechDataEvent.subscribe(data => {
      this.speechData(data);
      this.listenOnTraduceSource.next(true);
    });
  }

  // connectar() {
  //   this.speechProviverConnet.connectar();
  // }

  startRecording() {
    this.initRecording();
  }

  private initRecording() {
    this.speechProviverConnet.emit('startGoogleCloudStream', ''); // init socket Google Speech Connection
    this.streamStreaming = true;

    this.AudioContext = window.AudioContext;
    this.context = new AudioContext({
      // if Non-interactive, use 'playback' or 'balanced' // https://developer.mozilla.org/en-US/docs/Web/API/AudioContextLatencyCategory
      // latencyHint: 'interactive',
    });
    this.processor = this.context.createScriptProcessor(this.bufferSize, 1, 1);
    this.processor.connect(this.context.destination);
    this.context.resume();

    const handleSuccess = (stream)  => {
      this.globalStream = stream;
      this.input = this.context.createMediaStreamSource(stream);
      this.input.connect(this.processor);

      this.processor.onaudioprocess = (e) => {
        // this.microphoneProcess(e);

        const left = e.inputBuffer.getChannelData(0);
        // var left16 = convertFloat32ToInt16(left); // old 32 to 16 function
        const left16 = this.downsampleBuffer(left, 44100, 16000);
        // console.log('emit audio');
        this.speechProviverConnet.emit('binaryData', left16);
      };
    };

    navigator.mediaDevices.getUserMedia(this.constraints).then(handleSuccess);
  }

  microphoneProcess(e) {
    const left = e.inputBuffer.getChannelData(0);
    // var left16 = convertFloat32ToInt16(left); // old 32 to 16 function
    const left16 = this.downsampleBuffer(left, 44100, 16000);
    this.speechProviverConnet.emit('binaryData', left16);
  }

  private downsampleBuffer = function (buffer, sampleRate, outSampleRate) {
    if (outSampleRate === sampleRate) {
      return buffer;
    }
    if (outSampleRate > sampleRate) {
      throw new Error('downsampling rate show be smaller than original sample rate');
    }
    const sampleRateRatio = sampleRate / outSampleRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Int16Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0,
        count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }

      result[offsetResult] = Math.min(1, accum / count) * 0x7fff;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result.buffer;
  };


  stopRecording() {
    // waited for FinalWord
    this.streamStreaming = false;
    this.speechProviverConnet.emit('endGoogleCloudStream', '');
    this.listenOnTraduceSource.next(false);

    const track = this.globalStream.getTracks()[0];
    track.stop();

    this.input.disconnect(this.processor);
    this.processor.disconnect(this.context.destination);
    this.context.close().then(() => {
      this.input = null;
      this.processor = null;
      this.context = null;
      this.AudioContext = null;
      // this.startButton.disabled = false;
    });
  }

  private speechData(data) {
    const dataFinal = undefined || data.results[0].isFinal;
    // console.log('api speech response from speech to text', data.results);
    // console.log(data.results[0].alternatives[0].transcript);
    // this.speechTexResponse.emit(data.results);
    if ( this.lastTranscript ===  data.results[0].alternatives[0].transcript.toLowerCase()) { return; }
    this.speechTexResponseSource.next(data.results);
    this.lastTranscript = data.results[0].alternatives[0].transcript.toLowerCase();

    if (dataFinal === false) {}
    // console.log('Google Speech sent final Sentence.');
    this.finalWord = true;
  }

  private capitalize(s) {
    if (s.length < 1) {
      return s;
    }
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
