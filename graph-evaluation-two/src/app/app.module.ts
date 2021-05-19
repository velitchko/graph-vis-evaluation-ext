import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NlSiComponent } from './nl-si/nl-si.component';
import { NlJpComponent } from './nl-jp/nl-jp.component';
import { NlTlComponent } from './nl-tl/nl-tl.component';
import { MSiComponent } from './m-si/m-si.component';
import { MJpComponent } from './m-jp/m-jp.component';
import { MTlComponent } from './m-tl/m-tl.component';
import { NlAnComponent } from './nl-an/nl-an.component';
import { MAnComponent } from './m-an/m-an.component';

import { DataService } from './data.service';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxBootstrapIconsModule, allIcons } from 'ngx-bootstrap-icons';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { LoadComponent } from './load/load.component';

@NgModule({
  declarations: [
    AppComponent,
    NlSiComponent,
    NlJpComponent,
    NlTlComponent,
    MSiComponent,
    MJpComponent,
    MTlComponent,
    NlAnComponent,
    MAnComponent,
    LoadComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    NgbModule,
    NgxSliderModule,
    NgxBootstrapIconsModule.pick(allIcons)
  ],
  providers: [DataService],
  bootstrap: [AppComponent]
})
export class AppModule { }
