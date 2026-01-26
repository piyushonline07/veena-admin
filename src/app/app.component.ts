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

      this.router.navigate(['/'], {
        queryParams: { token: null },
        queryParamsHandling: 'merge'
      });
    }
  }

  closeSidebar(): void {
    this.sidebarService.toggle();
  }
}
