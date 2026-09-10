import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuicklinkModule } from 'ngx-quicklink';
import { ImgUrlPipe } from './pipes/img-url.pipe';
import { ImgFallbackDirective } from './directivas/img-fallback.directive';

@NgModule({
  declarations: [
    ImgUrlPipe,
    ImgFallbackDirective
  ],
  imports: [
    CommonModule,
    QuicklinkModule
  ],
  exports: [
    QuicklinkModule,
    ImgUrlPipe,
    ImgFallbackDirective
  ]
})
export class SharedModule { }
