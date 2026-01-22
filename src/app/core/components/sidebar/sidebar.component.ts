import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
    items: MenuItem[] = [];

    constructor() { }

    ngOnInit(): void {
        this.items = [
            {
                label: 'Navigation',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-home', routerLink: ['/'] },
                    { label: 'Manage Media', icon: 'pi pi-list', routerLink: ['/media-list'] },
                    { label: 'Upload Media', icon: 'pi pi-upload', routerLink: ['/upload'] }
                ]
            },
            {
                label: 'Management',
                items: [
                    { label: 'Users', icon: 'pi pi-users', routerLink: ['/users'] },
                    { label: 'Settings', icon: 'pi pi-cog' }
                ]
            }
        ];
    }

}
