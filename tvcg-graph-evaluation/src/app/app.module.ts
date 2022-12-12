import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { MatGridListModule } from '@angular/material/grid-list';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NlJpComponent } from './nl-jp/nl-jp.component';
import { NlAncComponent } from './nl-anc/nl-anc.component';
import { MJpComponent } from './m-jp/m-jp.component';
import { MAncComponent } from './m-anc/m-anc.component';
import { HomeComponent } from './home/home.component';

import { DataService } from './data.service';
import { ReorderService } from './reorder.service';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxBootstrapIconsModule, allIcons } from 'ngx-bootstrap-icons';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { LoadComponent } from './load/load.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent,
    NlJpComponent,
    NlAncComponent,
    MJpComponent,
    MAncComponent,
    LoadComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    NgbModule,
    NgxSliderModule,
    MatGridListModule,
    FormsModule,
    NgxBootstrapIconsModule.pick(allIcons),
    BrowserAnimationsModule
  ],
  providers: [DataService, ReorderService],
  bootstrap: [AppComponent]
})
export class AppModule { }
