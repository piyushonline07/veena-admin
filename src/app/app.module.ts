import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import { AuthInterceptor } from "./core/interceptor/auth.interceptor";
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToolbarModule } from 'primeng/toolbar';
import { StepsModule } from 'primeng/steps';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';

import { BrowserAnimationsModule, NoopAnimationsModule } from "@angular/platform-browser/animations";
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { MenubarModule } from "primeng/menubar";
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { FormsModule } from '@angular/forms';
import { UploadMediaComponent } from './pages/upload-media/upload-media.component';
import { MessageService } from 'primeng/api';
import { HeaderComponent } from './core/components/header/header.component';
import { SidebarComponent } from './core/components/sidebar/sidebar.component';
import { MenuModule } from 'primeng/menu';
import { HlsPlayerComponent } from './core/components/hls-player/hls-player.component';
import { HlsAudioPlayerComponent } from './core/components/hls-audio-player/hls-audio-player.component';
import { MediaListComponent } from './pages/media-list/media-list.component';
import { TagModule } from 'primeng/tag';
import { UserListComponent } from './pages/user-list/user-list.component';
import { ArtistListComponent } from './pages/artist-list/artist-list.component';
import { DialogModule } from "primeng/dialog";
import { SelectButtonModule } from 'primeng/selectbutton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';




import { MarketingComponent } from './pages/marketing/marketing.component';
import { OperationsComponent } from './pages/operations/operations.component';
import { DeveloperComponent } from './pages/developer/developer.component';
import { TabViewModule } from 'primeng/tabview';
import { ProgressBarModule } from 'primeng/progressbar';
import { CalendarModule } from 'primeng/calendar';
import { DividerModule } from "primeng/divider";
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MultiSelectModule } from 'primeng/multiselect';

import { SyncLyricsComponent } from './core/components/sync-lyrics/sync-lyrics.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { MediaLinkComponent } from './pages/media-link/media-link.component';
import { AlbumComponent } from './pages/album/album.component';
import { BillingComponent } from './pages/billing/billing.component';
import { BulkUploadComponent } from './pages/bulk-upload/bulk-upload.component';
import { AdminPlaylistComponent } from './pages/admin-playlist/admin-playlist.component';
import { CreditsComponent } from './pages/credits/credits.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    UploadMediaComponent,
    HeaderComponent,
    SidebarComponent,
    MediaListComponent,
    UserListComponent,
    ArtistListComponent,
    HlsPlayerComponent,
    HlsAudioPlayerComponent,
    SyncLyricsComponent,
    MarketingComponent,
    OperationsComponent,
    DeveloperComponent,
    NotificationsComponent,
    SettingsComponent,
    MediaLinkComponent,
    AlbumComponent,
    BillingComponent,
    BulkUploadComponent,
    AdminPlaylistComponent,
    CreditsComponent
  ],
  imports: [
    InputTextareaModule,
    ToolbarModule,
    NoopAnimationsModule,
    BrowserAnimationsModule,
    InputTextModule,
    TableModule,
    FileUploadModule,
    CardModule,
    ButtonModule,
    ChartModule,
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    HttpClientModule,
    MenubarModule,
    DropdownModule,
    ToastModule,
    FormsModule,
    MenuModule,
    TagModule,
    DialogModule,
    SelectButtonModule,
    ProgressSpinnerModule,
    PaginatorModule,
    TooltipModule,
    TabViewModule,
    ProgressBarModule,
    CalendarModule,
    DividerModule,
    CheckboxModule,
    ConfirmDialogModule,
    StepsModule,
    MessagesModule,
    MessageModule,
    InputSwitchModule,
    MultiSelectModule
  ],
  providers: [
    MessageService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],

  bootstrap: [AppComponent]
})
export class AppModule { }
