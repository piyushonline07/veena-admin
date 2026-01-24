import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../service/auth.service';
import { ThemeService, Theme } from '../../service/theme.service';
import { SidebarService } from '../../service/sidebar.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
    currentTheme: Theme = 'light';
    private themeSubscription?: Subscription;

    constructor(
        private authService: AuthService,
        private themeService: ThemeService,
        private sidebarService: SidebarService
    ) { }

    ngOnInit(): void {
        this.themeSubscription = this.themeService.theme$.subscribe(theme => {
            this.currentTheme = theme;
        });
    }

    ngOnDestroy(): void {
        this.themeSubscription?.unsubscribe();
    }

    get isDarkMode(): boolean {
        return this.currentTheme === 'dark';
    }

    toggleTheme(): void {
        this.themeService.toggleTheme();
    }

    toggleSidebar(): void {
        this.sidebarService.toggleSidebar();
    }

    onLogout() {
        this.authService.logout();
    }
}
