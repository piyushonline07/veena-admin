import { Component, OnInit } from '@angular/core';
import {AuthService} from "../../core/services/auth.service";

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent implements OnInit {

  constructor(private auth: AuthService ) { }
  logout() {
    this.auth.logout();
  }
  ngOnInit(): void {
  }

}
