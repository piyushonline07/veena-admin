import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToolbarModule } from 'primeng/toolbar';

import {BrowserAnimationsModule, NoopAnimationsModule} from "@angular/platform-browser/animations";
import {LoaderInterceptor} from "./core/interceptor/loader.interceptor";

import {ProgressSpinnerModule} from "primeng/progressspinner";
import {CredentialsInterceptor} from "./core/interceptor/credentials.interceptor";
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsersComponent } from './pages/users/users.component';
import { MediaComponent } from './pages/media/media.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TopbarComponent } from './layout/topbar/topbar.component';
import {PanelMenuModule} from "primeng/panelmenu";
import {LoaderComponent} from "./layout/loader/loader.component";



@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    UsersComponent,
    MediaComponent,
    AdminLayoutComponent,
    SidebarComponent,
    TopbarComponent,
    LoaderComponent,

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
    ProgressSpinnerModule,
    PanelMenuModule

  ],
  providers: [{
    provide: HTTP_INTERCEPTORS,
    useClass: LoaderInterceptor,
    multi: true
  }, {
    provide: HTTP_INTERCEPTORS,
    useClass: CredentialsInterceptor,
    multi: true
  }],

  bootstrap: [AppComponent]
})
export class AppModule { }
