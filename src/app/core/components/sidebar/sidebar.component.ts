import { Component, OnInit, HostListener } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router, NavigationEnd } from '@angular/router';
import { SidebarService } from '../../service/sidebar.service';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
    items: MenuItem[] = [];
    private isMobile = false;

    constructor(
        private router: Router,
        private sidebarService: SidebarService
    ) {
        this.checkMobile();
    }

    @HostListener('window:resize')
    onResize() {
        this.checkMobile();
    }

    private checkMobile(): void {
        this.isMobile = window.innerWidth <= 768;
    }

    ngOnInit(): void {
        // Close sidebar on navigation on mobile
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            if (this.isMobile) {
                this.sidebarService.close();
            }
        });

        this.items = [
            {
                label: 'Dashboard',
                items: [
                    { label: 'Overview', icon: 'pi pi-home', routerLink: ['/'] }
                ]
            },
            {
                label: 'Media',
                items: [
                    { label: 'Manage Media', icon: 'pi pi-list', routerLink: ['/media-list'] },
                    { label: 'Upload Media', icon: 'pi pi-upload', routerLink: ['/upload'] },
                    { label: 'Bulk Upload', icon: 'pi pi-cloud-upload', routerLink: ['/bulk-upload'] },
                    { label: 'Link Audio/Video', icon: 'pi pi-link', routerLink: ['/media-link'] },
                    { label: 'Playlists', icon: 'pi pi-play', routerLink: ['/playlists'] }
                ]
            },
            {
                label: 'Master Data',
                items: [
                    { label: 'Artists', icon: 'pi pi-star', routerLink: ['/artists'] },
                    { label: 'Albums', icon: 'pi pi-book', routerLink: ['/albums'] },
                    { label: 'Credits', icon: 'pi pi-id-card', routerLink: ['/credits'] }
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
                    { label: 'System Health', icon: 'pi pi-shield', routerLink: ['/operations'] },
                    { label: 'AWS Billing', icon: 'pi pi-dollar', routerLink: ['/billing'] }
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
