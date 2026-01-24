import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from "./core/gaurd/auth.guard";
import { DashboardComponent } from "./pages/dashboard/dashboard.component";
import { UploadMediaComponent } from './pages/upload-media/upload-media.component';
import { MediaListComponent } from './pages/media-list/media-list.component';
import { UserListComponent } from './pages/user-list/user-list.component';
import { ArtistListComponent } from './pages/artist-list/artist-list.component';

import { MarketingComponent } from './pages/marketing/marketing.component';
import { OperationsComponent } from './pages/operations/operations.component';

const routes: Routes = [
  { path: '', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'upload', component: UploadMediaComponent, canActivate: [AuthGuard] },
  { path: 'media-list', component: MediaListComponent, canActivate: [AuthGuard] },
  { path: 'artists', component: ArtistListComponent, canActivate: [AuthGuard] },
  { path: 'marketing', component: MarketingComponent, canActivate: [AuthGuard] },
  { path: 'operations', component: OperationsComponent, canActivate: [AuthGuard] },
  { path: 'users', component: UserListComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

