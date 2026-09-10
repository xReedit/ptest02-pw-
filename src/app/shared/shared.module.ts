import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuicklinkModule } from 'ngx-quicklink';
import { ImgUrlPipe } from './pipes/img-url.pipe';

@NgModule({
  declarations: [
    ImgUrlPipe
  ],
  imports: [
    CommonModule,
    QuicklinkModule
  ],
  exports: [
    QuicklinkModule,
    ImgUrlPipe
  ]
})
export class SharedModule { }
