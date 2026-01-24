import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly THEME_KEY = 'veena-admin-theme';
    private themeSubject = new BehaviorSubject<Theme>(this.getStoredTheme());

    theme$ = this.themeSubject.asObservable();

    constructor() {
        // Apply initial theme on service creation
        this.applyTheme(this.themeSubject.value);
    }

    private getStoredTheme(): Theme {
        const stored = localStorage.getItem(this.THEME_KEY);
        if (stored === 'light' || stored === 'dark') {
            return stored;
        }
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    get currentTheme(): Theme {
        return this.themeSubject.value;
    }

    get isDarkMode(): boolean {
        return this.themeSubject.value === 'dark';
    }

    toggleTheme(): void {
        const newTheme = this.themeSubject.value === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    setTheme(theme: Theme): void {
        localStorage.setItem(this.THEME_KEY, theme);
        this.themeSubject.next(theme);
        this.applyTheme(theme);
    }

    private applyTheme(theme: Theme): void {
        const body = document.body;
        const themeLink = document.getElementById('app-theme') as HTMLLinkElement;

        if (theme === 'dark') {
            body.classList.add('dark-theme');
            body.classList.remove('light-theme');

            if (themeLink) {
                themeLink.href = 'assets/themes/arya-blue/theme.css';
            }
        } else {
            body.classList.add('light-theme');
            body.classList.remove('dark-theme');

            if (themeLink) {
                themeLink.href = 'assets/themes/saga-blue/theme.css';
            }
        }
    }
}
