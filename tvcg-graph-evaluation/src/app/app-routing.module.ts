import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MTlComponent } from './m-tl/m-tl.component';
import { MJpComponent } from './m-jp/m-jp.component';
import { MSiComponent } from './m-si/m-si.component';
import { NlTlComponent } from './nl-tl/nl-tl.component';
import { NlJpComponent } from './nl-jp/nl-jp.component';
import { NlSiComponent } from './nl-si/nl-si.component';
import { NlAnComponent } from './nl-an/nl-an.component';
import { MAnComponent } from './m-an/m-an.component';
import { LoadComponent } from './load/load.component';


const routes: Routes = [
  { path: 'nl-si', component: NlSiComponent },
  { path: 'nl-jp', component: NlJpComponent },
  { path: 'nl-tl', component: NlTlComponent },
  { path: 'nl-an', component: NlAnComponent },
  { path: 'm-si', component: MSiComponent },
  { path: 'm-jp', component: MJpComponent },
  { path: 'm-tl', component: MTlComponent },
  { path: 'm-an', component: MAnComponent },
  { path: 'load', component: LoadComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
