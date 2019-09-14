import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HttpClientModule } from '@angular/common/http';
import { CrudHttpService } from '../shared/services/crud-http.service';

import { LayoutMainComponent } from './layout-main/layout-main.component';
import { RouterModule } from '@angular/router';
import { MaterialModule } from './material/material.module';
import { ToolBarComponent } from './tool-bar/tool-bar.component';
import { ProgressTimeLimitComponent } from './progress-time-limit/progress-time-limit.component';


@NgModule({
  declarations: [
    LayoutMainComponent,
    ToolBarComponent,
    ProgressTimeLimitComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    MaterialModule
  ],
  exports: [
    MaterialModule,
    ToolBarComponent,
    ProgressTimeLimitComponent
  ],
  providers: [
    CrudHttpService
  ]
})
export class CoreModule { }
