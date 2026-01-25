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
  targetGroups = [
    { label: 'All Users', value: 'ALL' },
    { label: 'Regular Users', value: 'USER' },
    { label: 'Administrators', value: 'ADMIN' }
  ];
  newNotif = {
    title: '',
    body: '',
    imageUrl: '',
    targetGroup: 'ALL'
  };

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
      next: (data) => (this.notifications = data),
      error: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Notifications disabled in this environment'
        });
        this.notificationsEnabled = false;
      }
    });
  }

  onSaveNotif() {
    if (!this.notificationsEnabled) return;
    this.marketingService.draftNotification(this.newNotif).subscribe(() => {
      this.messageService.add({ severity: 'success', summary: 'Draft Saved' });
      this.loadNotifications();
      this.newNotif = { title: '', body: '', imageUrl: '', targetGroup: 'ALL' };
    });
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
