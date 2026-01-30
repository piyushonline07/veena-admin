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
import { DeveloperComponent } from './pages/developer/developer.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { MediaLinkComponent } from './pages/media-link/media-link.component';
import { AlbumComponent } from './pages/album/album.component';
import { BillingComponent } from './pages/billing/billing.component';
import { BulkUploadComponent } from './pages/bulk-upload/bulk-upload.component';
import { AdminPlaylistComponent } from './pages/admin-playlist/admin-playlist.component';

const routes: Routes = [
  { path: '', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'upload', component: UploadMediaComponent, canActivate: [AuthGuard] },
  { path: 'bulk-upload', component: BulkUploadComponent, canActivate: [AuthGuard] },
  { path: 'media-list', component: MediaListComponent, canActivate: [AuthGuard] },
  { path: 'artists', component: ArtistListComponent, canActivate: [AuthGuard] },
  { path: 'albums', component: AlbumComponent, canActivate: [AuthGuard] },
  { path: 'playlists', component: AdminPlaylistComponent, canActivate: [AuthGuard] },
  { path: 'marketing', component: MarketingComponent, canActivate: [AuthGuard] },
  { path: 'operations', component: OperationsComponent, canActivate: [AuthGuard] },
  { path: 'users', component: UserListComponent, canActivate: [AuthGuard] },
  { path: 'developer', component: DeveloperComponent, canActivate: [AuthGuard] },
  { path: 'notifications', component: NotificationsComponent, canActivate: [AuthGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
  { path: 'media-link', component: MediaLinkComponent, canActivate: [AuthGuard] },
  { path: 'billing', component: BillingComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
