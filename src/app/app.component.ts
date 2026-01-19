import { Component } from '@angular/core';
import {AuthService} from "./core/services/auth.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  initialized = false;

  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.auth.isAdminAuthenticated().subscribe(isAuth => {
      if (!isAuth) {
        this.auth.redirectToLogin();
      } else {
        this.initialized = true;
      }
    });
  }
}
