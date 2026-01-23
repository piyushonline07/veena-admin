import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToolbarModule } from 'primeng/toolbar';

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
import { DialogModule } from "primeng/dialog";
import { SelectButtonModule } from 'primeng/selectbutton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';




@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    UploadMediaComponent,
    HeaderComponent,
    SidebarComponent,
    MediaListComponent,
    UserListComponent,
    HlsPlayerComponent,
    HlsAudioPlayerComponent
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
    TooltipModule
  ],
  providers: [MessageService],

  bootstrap: [AppComponent]
})
export class AppModule { }
