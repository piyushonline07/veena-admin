import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/service/auth.service';
import { AdminSettingsService, AppSettings } from '../../core/service/admin-settings.service';

interface ProfileInfo {
  name?: string;
  email?: string;
  username?: string;
  role?: string;
  sub?: string;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  providers: [MessageService]
})
export class SettingsComponent {
  profile: ProfileInfo = {};

  // App-level preferences (UI only)
  preferences = {
    enableNotifications: false,
    autoplayMedia: true
  };

  appSettings: AppSettings = {
    enableUserNotifications: true,
    defaultAutoplayForUsers: true,
    allowUserDownloads: false,
    enableComments: true,
    maintenanceMode: false,
    minimumAppVersion: ''
  };

  endpoints = {
    backend: window.location.origin,
    swagger: `${window.location.origin}/swagger-ui/index.html`
  };

  constructor(private messageService: MessageService, private auth: AuthService, private adminSettings: AdminSettingsService) {}

  ngOnInit() {
    this.loadProfile();
    // Load saved preferences
    const saved = localStorage.getItem('veena-admin-preferences');
    if (saved) {
      try {
        const obj = JSON.parse(saved);
        this.preferences.enableNotifications = !!obj.enableNotifications;
        this.preferences.autoplayMedia = obj.autoplayMedia !== false; // default true
      } catch {}
    }
    // Load app-wide settings from backend
    this.adminSettings.getSettings().subscribe({
      next: (s) => { this.appSettings = s; },
      error: () => {
        // Fallback defaults if backend not ready
        this.messageService.add({ severity: 'info', summary: 'Using default app settings' });
      }
    });
  }

  private loadProfile() {
    const token = this.auth.getToken();
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.profile = {
        name: payload.name || payload['cognito:username'],
        email: payload.email,
        username: payload['cognito:username'],
        role: Array.isArray(payload['cognito:groups']) ? payload['cognito:groups'][0] : undefined,
        sub: payload.sub
      };
    } catch (e) {
      // ignore decode errors
    }
  }

  savePreferences() {
    localStorage.setItem('veena-admin-preferences', JSON.stringify(this.preferences));
    this.messageService.add({ severity: 'success', summary: 'Preferences saved' });
  }

  logout() {
    this.auth.logout();
  }

  saveAppSettings() {
    this.adminSettings.saveSettings(this.appSettings).subscribe({
      next: (s) => {
        this.appSettings = s;
        this.messageService.add({ severity: 'success', summary: 'App settings saved' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Failed to save app settings' });
      }
    });
  }
}
