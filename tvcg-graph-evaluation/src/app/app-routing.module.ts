import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MAncComponent } from './m-anc/m-anc.component';
import { MJpComponent } from './m-jp/m-jp.component';
import { NlAncComponent } from './nl-anc/nl-anc.component';
import { NlJpComponent } from './nl-jp/nl-jp.component';
import { LoadComponent } from './load/load.component';
import { HomeComponent } from './home/home.component';


const routes: Routes = [
  { path: 'nl-jp', component: NlJpComponent },
  { path: 'nl-anc', component: NlAncComponent },
  { path: 'm-jp', component: MJpComponent },
  { path: 'm-anc', component: MAncComponent },
  { path: 'load', component: LoadComponent },
  { path: 'home', component: HomeComponent },
  { path: '**', redirectTo: '/home', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
