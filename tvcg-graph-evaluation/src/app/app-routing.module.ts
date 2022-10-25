import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MAncComponent } from './m-anc/m-anc.component';
import { MJpComponent } from './m-jp/m-jp.component';
import { NlAncComponent } from './nl-anc/nl-anc.component';
import { NlJpComponent } from './nl-jp/nl-jp.component';
import { NlAnComponent } from './nl-an/nl-an.component';
import { MAnComponent } from './m-an/m-an.component';
import { LoadComponent } from './load/load.component';


const routes: Routes = [
  { path: 'nl-jp', component: NlJpComponent },
  { path: 'nl-anc', component: NlAncComponent },
  { path: 'nl-an', component: NlAnComponent },
  { path: 'm-jp', component: MJpComponent },
  { path: 'm-anc', component: MAncComponent },
  { path: 'm-an', component: MAnComponent },
  { path: 'load', component: LoadComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
