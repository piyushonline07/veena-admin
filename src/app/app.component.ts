import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from "./core/service/auth.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  initialized = false;

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {

    if (this.auth.isLoggedIn()) {
      this.initialized = true;

      this.router.navigate(['/'], {
        queryParams: { token: null },
        queryParamsHandling: 'merge'
      });
    }
  }
}
