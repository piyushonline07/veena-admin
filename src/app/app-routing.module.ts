import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from "./core/gaurd/auth.guard";
import { DashboardComponent } from "./pages/dashboard/dashboard.component";
import { UploadMediaComponent } from './pages/upload-media/upload-media.component';
import { MediaListComponent } from './pages/media-list/media-list.component';
import { UserListComponent } from './pages/user-list/user-list.component';

const routes: Routes = [
  { path: '', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'upload', component: UploadMediaComponent, canActivate: [AuthGuard] },
  { path: 'media-list', component: MediaListComponent, canActivate: [AuthGuard] },
  { path: 'users', component: UserListComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

