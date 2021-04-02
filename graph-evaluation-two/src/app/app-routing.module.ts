import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MTlComponent } from './m-tl/m-tl.component';
import { MJpComponent } from './m-jp/m-jp.component';
import { MSiComponent } from './m-si/m-si.component';
import { NlTlComponent } from './nl-tl/nl-tl.component';
import { NlJpComponent } from './nl-jp/nl-jp.component';
import { NlSiComponent } from './nl-si/nl-si.component';


const routes: Routes = [
  { path: 'nl-si', component: NlSiComponent },
  { path: 'nl-jp', component: NlJpComponent },
  { path: 'nl-an', component: NlTlComponent },
  { path: 'm-si', component: MSiComponent },
  { path: 'm-jp', component: MJpComponent },
  { path: 'm-an', component: MTlComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
