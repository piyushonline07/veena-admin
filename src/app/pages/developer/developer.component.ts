import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ThemeService } from '../../core/service/theme.service';
import { AuthService } from '../../core/service/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

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
    this.swaggerCssLinkEl.disabled = true;
    this.swaggerCssLinkEl.href = `${environment.apiBaseUrl || ''}/swagger-dark.css`;
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
    this.swaggerCssLinkEl.disabled = theme !== 'dark';
  }

  private initSwagger(): void {
    const baseUrl = environment.apiBaseUrl || '';
    const apiDocsUrl = `${baseUrl}/v3/api-docs?nocache=${Date.now()}`;
    const token = this.authService.getToken();

    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    });

    console.log('Fetching API docs from:', apiDocsUrl);

    this.http.get(apiDocsUrl, { headers, responseType: 'text', observe: 'response' }).subscribe({
      next: (response) => {
        console.log('API docs response status:', response.status);
        console.log('API docs content-type:', response.headers.get('content-type'));

        const rawText = response.body || '';
        console.log('API docs raw response (first 500 chars):', rawText.substring(0, 500));

        let spec: any;
        try {
          spec = JSON.parse(rawText);
        } catch (parseErr) {
          console.error('JSON parse error. Full raw response:', rawText);
          this.hasError = true;
          this.errorMessage = 'API docs response is not valid JSON. Response starts with: ' + rawText.substring(0, 100);
          this.isLoading = false;
          return;
        }

        if (!spec.openapi && !spec.swagger) {
          console.error('Spec object:', spec);
          this.hasError = true;
          this.errorMessage = 'API docs missing openapi/swagger version field. Keys: ' + Object.keys(spec).join(', ');
          this.isLoading = false;
          return;
        }

        console.log('API docs loaded successfully, openapi version:', spec.openapi || spec.swagger);

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
          layout: 'BaseLayout',
          requestInterceptor: (req: any) => {
            if (token) {
              req.headers = { ...req.headers, 'Authorization': `Bearer ${token}` };
            }
            return req;
          }
        });
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Failed to fetch API docs. Full error:', err);
        this.isLoading = false;
        this.hasError = true;

        let errorDetail = '';
        if (err.error) {
          errorDetail = typeof err.error === 'string' ? err.error.substring(0, 200) : JSON.stringify(err.error).substring(0, 200);
        }

        this.errorMessage = `Failed to load API docs: ${err.status || 'unknown'} ${err.statusText || ''} ${errorDetail}`;
      }
    });
  }

  openSwaggerInNewTab(): void {
    const backendUrl = environment.apiBaseUrl || window.location.origin;
    window.open(`${backendUrl}/swagger-ui/index.html`, '_blank');
  }
}
