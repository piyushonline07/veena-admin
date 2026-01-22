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
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import {MenubarModule} from "primeng/menubar";




@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent

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
    MenubarModule

  ],
  providers: [],

  bootstrap: [AppComponent]
})
export class AppModule { }
