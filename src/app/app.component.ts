import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from "./core/service/auth.service";
import { SidebarService } from "./core/service/sidebar.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  initialized = false;
  isSidebarVisible = true;

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private sidebarService: SidebarService
  ) { }

  ngOnInit() {
    this.sidebarService.sidebarVisible$.subscribe(visible => {
      this.isSidebarVisible = visible;
    });

    if (this.auth.isLoggedIn()) {
      this.initialized = true;

      // Only clear token from URL if it exists, without changing the current route
      this.route.queryParams.subscribe(params => {
        if (params['token']) {
          // Remove token from URL while staying on the current page
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { token: null },
            queryParamsHandling: 'merge',
            replaceUrl: true
          });
        }
      });
    }
  }

  closeSidebar(): void {
    this.sidebarService.toggle();
  }
}
