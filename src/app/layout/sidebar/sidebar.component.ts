import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  items = [
    { label: 'Dashboard', icon: 'pi pi-home', routerLink: '/' },
    { label: 'Users', icon: 'pi pi-users', routerLink: '/users' },
    { label: 'Media', icon: 'pi pi-video', routerLink: '/media' }
  ];
  constructor() { }

  ngOnInit(): void {
  }

}
