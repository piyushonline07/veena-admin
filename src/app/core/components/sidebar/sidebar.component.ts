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
                    { label: 'Link Audio/Video', icon: 'pi pi-link', routerLink: ['/media-link'] },
                    { label: 'Artists', icon: 'pi pi-star', routerLink: ['/artists'] },
                    { label: 'Upload Media', icon: 'pi pi-upload', routerLink: ['/upload'] }
                ]
            },
            {
                label: 'Growth',
                items: [
                    { label: 'Marketing Hub', icon: 'pi pi-megaphone', routerLink: ['/marketing'] },
                    { label: 'Notifications', icon: 'pi pi-bell', routerLink: ['/notifications'] }
                ]
            },
            {
                label: 'Operations',
                items: [
                    { label: 'System Health', icon: 'pi pi-shield', routerLink: ['/operations'] }
                ]
            },
            {
                label: 'Management',
                items: [
                    { label: 'Users', icon: 'pi pi-users', routerLink: ['/users'] },
                    { label: 'Settings', icon: 'pi pi-cog', routerLink: ['/settings'] }
                ]
            },
            {
                label: 'Developer',
                items: [
                    { label: 'API Docs', icon: 'pi pi-code', routerLink: ['/developer'] }
                ]
            }
        ];
    }

}
