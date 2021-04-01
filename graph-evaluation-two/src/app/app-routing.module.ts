import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MAnComponent } from './m-an/m-an.component';
import { MJpComponent } from './m-jp/m-jp.component';
import { MSiComponent } from './m-si/m-si.component';
import { NlAnComponent } from './nl-an/nl-an.component';
import { NlJpComponent } from './nl-jp/nl-jp.component';
import { NlSiComponent } from './nl-si/nl-si.component';


const routes: Routes = [
  { path: 'nl-si', component: NlSiComponent },
  { path: 'nl-jp', component: NlJpComponent },
  { path: 'nl-an', component: NlAnComponent },
  { path: 'm-si', component: MSiComponent },
  { path: 'm-jp', component: MJpComponent },
  { path: 'm-an', component: MAnComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
