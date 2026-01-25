import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { environment } from '../../../environments/environment';

declare const SwaggerUIBundle: any;

@Component({
  selector: 'app-developer',
  templateUrl: './developer.component.html',
  styleUrls: ['./developer.component.scss']
})
export class DeveloperComponent implements OnInit, AfterViewInit {
  @ViewChild('swaggerContainer', { static: true }) swaggerContainer!: ElementRef;

  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';

  constructor() {}

  ngOnInit(): void {
    this.loadSwaggerResources();
  }

  ngAfterViewInit(): void {}

  private loadSwaggerResources(): void {
    // Load Swagger UI CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css';
    document.head.appendChild(link);

    // Load Swagger UI JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js';
    script.onload = () => this.initSwagger();
    script.onerror = () => {
      this.isLoading = false;
      this.hasError = true;
      this.errorMessage = 'Failed to load Swagger UI resources.';
    };
    document.body.appendChild(script);
  }

  private initSwagger(): void {
    const apiDocsUrl = environment.apiBaseUrl
      ? `${environment.apiBaseUrl}/v3/api-docs`
      : '/v3/api-docs';

    try {
      SwaggerUIBundle({
        dom_id: '#swagger-container',
        url: apiDocsUrl,
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: 'BaseLayout'
      });
      this.isLoading = false;
    } catch (error) {
      this.isLoading = false;
      this.hasError = true;
      this.errorMessage = 'Failed to initialize Swagger UI.';
      console.error('Swagger UI initialization error:', error);
    }
  }

  openSwaggerInNewTab(): void {
    const backendUrl = environment.apiBaseUrl || window.location.origin;
    window.open(`${backendUrl}/swagger-ui/index.html`, '_blank');
  }
}
