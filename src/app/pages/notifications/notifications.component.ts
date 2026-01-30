import { Component, OnInit } from '@angular/core';
import { MarketingService } from '../../core/service/marketing.service';
import { MessageService } from 'primeng/api';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  providers: [MessageService]
})
export class NotificationsComponent implements OnInit {
  notificationsEnabled = environment.enableNotifications;

  notifications: any[] = [];
  filteredNotifications: any[] = [];

  // Filters
  statusFilters = [
    { label: 'All', value: null },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Sent', value: 'SENT' },
    { label: 'Failed', value: 'FAILED' }
  ];
  selectedStatus: string | null = null;

  // Details dialog
  showDetailsDialog = false;
  selectedNotification: any = null;

  constructor(
    private marketingService: MarketingService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    if (this.notificationsEnabled) {
      this.loadNotifications();
    }
  }

  loadNotifications() {
    this.marketingService.getNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.filterNotifications();
      },
      error: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Notifications disabled in this environment'
        });
        this.notificationsEnabled = false;
      }
    });
  }

  filterNotifications() {
    if (!this.selectedStatus) {
      this.filteredNotifications = [...this.notifications];
    } else {
      this.filteredNotifications = this.notifications.filter(
        n => n.status === this.selectedStatus
      );
    }
  }

  getAudienceLabel(targetGroup: string): string {
    switch (targetGroup) {
      case 'ALL': return 'All Users';
      case 'USER': return 'Regular Users';
      case 'ADMIN': return 'Administrators';
      default: return targetGroup;
    }
  }

  getAudienceSeverity(targetGroup: string): string {
    switch (targetGroup) {
      case 'ALL': return 'info';
      case 'USER': return 'success';
      case 'ADMIN': return 'warning';
      default: return 'info';
    }
  }

  getStatusSeverity(status: string): string {
    switch (status) {
      case 'SENT': return 'success';
      case 'DRAFT': return 'info';
      case 'FAILED': return 'danger';
      default: return 'info';
    }
  }

  showDetails(notif: any) {
    this.selectedNotification = notif;
    this.showDetailsDialog = true;
  }

  onSendNotif(id: string) {
    if (!this.notificationsEnabled) return;
    this.marketingService.sendNotification(id).subscribe(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Sent',
        detail: 'Notification broadcast started'
      });
      this.loadNotifications();
    });
  }
}
