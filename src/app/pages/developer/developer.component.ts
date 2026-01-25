import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ThemeService } from '../../core/service/theme.service';

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

  private swaggerCssLinkEl?: HTMLLinkElement;

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.loadSwaggerResources();
    // React to theme changes
    this.themeService.theme$.subscribe(theme => {
      this.applySwaggerTheme(theme);
    });
  }

  ngAfterViewInit(): void {}

  private loadSwaggerResources(): void {
    // Load Swagger UI CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css';
    document.head.appendChild(link);

    // Dark CSS link that we can toggle
    this.swaggerCssLinkEl = document.createElement('link');
    this.swaggerCssLinkEl.rel = 'stylesheet';
    this.swaggerCssLinkEl.id = 'swagger-dark-css';
    this.swaggerCssLinkEl.disabled = true; // start disabled; enable if dark
    this.swaggerCssLinkEl.href = `${environment.apiBaseUrl || ''}/swagger-dark.css` || '/swagger-dark.css';
    document.head.appendChild(this.swaggerCssLinkEl);

    // Apply initial theme
    this.applySwaggerTheme(this.themeService.currentTheme);

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

  private applySwaggerTheme(theme: 'light' | 'dark') {
    if (!this.swaggerCssLinkEl) return;
    // Toggle dark CSS when theme is dark
    this.swaggerCssLinkEl.disabled = theme !== 'dark';
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
