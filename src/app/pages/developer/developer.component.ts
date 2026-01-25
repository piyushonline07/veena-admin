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

  private async initSwagger(): Promise<void> {
    const apiDocsUrl = environment.apiBaseUrl
      ? `${environment.apiBaseUrl}/v3/api-docs`
      : '/v3/api-docs';

    try {
      // Fetch JSON explicitly to avoid proxy/YAML issues
      const resp = await fetch(apiDocsUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      // Get raw text first to debug what CloudFront returns
      const rawText = await resp.text();
      console.log('API docs response status:', resp.status);
      console.log('API docs response content-type:', resp.headers.get('content-type'));
      console.log('API docs raw response (first 500 chars):', rawText.substring(0, 500));

      if (!resp.ok) {
        throw new Error(`API docs request failed: ${resp.status} ${resp.statusText}`);
      }

      // Try to parse as JSON
      let spec: any;
      try {
        spec = JSON.parse(rawText);
      } catch (parseErr) {
        console.error('JSON parse error. Raw response:', rawText.substring(0, 1000));
        throw new Error('API docs response is not valid JSON. Check CloudFront proxy configuration.');
      }

      if (!spec.openapi && !spec.swagger) {
        console.error('Spec object:', spec);
        throw new Error('API docs missing openapi/swagger version field');
      }

      SwaggerUIBundle({
        dom_id: '#swagger-container',
        spec,
        deepLinking: true,
        validatorUrl: null,
        docExpansion: 'none',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: 'BaseLayout'
      });
      this.isLoading = false;
    } catch (error: any) {
      this.isLoading = false;
      this.hasError = true;
      this.errorMessage = error?.message || 'Failed to initialize Swagger UI.';
      console.error('Swagger UI initialization error:', error);
    }
  }

  openSwaggerInNewTab(): void {
    const backendUrl = environment.apiBaseUrl || window.location.origin;
    window.open(`${backendUrl}/swagger-ui/index.html`, '_blank');
  }
}
