import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SidebarService {
    private sidebarVisibleSubject = new BehaviorSubject<boolean>(true);
    sidebarVisible$ = this.sidebarVisibleSubject.asObservable();

    constructor() {
        // Auto-collapse on mobile by default
        if (window.innerWidth <= 768) {
            this.sidebarVisibleSubject.next(false);
        }
    }

    toggleSidebar() {
        this.sidebarVisibleSubject.next(!this.sidebarVisibleSubject.value);
    }

    setSidebarState(visible: boolean) {
        this.sidebarVisibleSubject.next(visible);
    }

    get isVisible(): boolean {
        return this.sidebarVisibleSubject.value;
    }
}
