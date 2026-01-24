import { Component, OnInit } from '@angular/core';
import { MarketingService } from '../../core/service/marketing.service';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-marketing',
    templateUrl: './marketing.component.html',
    styleUrls: ['./marketing.component.scss'],
    providers: [MessageService]
})
export class MarketingComponent implements OnInit {
    // Notifications
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

    // Featured Content
    featuredSchedules: any[] = [];
    slotOptions = [
        { label: 'Hero Banner', value: 0 },
        { label: 'Trending Slot 1', value: 1 },
        { label: 'Trending Slot 2', value: 2 }
    ];
    newFeature = {
        mediaId: '',
        slotIndex: 0,
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
    };

    constructor(
        private marketingService: MarketingService,
        private messageService: MessageService
    ) { }

    ngOnInit(): void {
        this.refreshAll();
    }

    refreshAll() {
        this.loadNotifications();
        this.loadFeatured();
    }

    loadNotifications() {
        this.marketingService.getNotifications().subscribe(data => this.notifications = data);
    }

    onSaveNotif() {
        this.marketingService.draftNotification(this.newNotif).subscribe(() => {
            this.messageService.add({ severity: 'success', summary: 'Draft Saved' });
            this.loadNotifications();
            this.newNotif = { title: '', body: '', imageUrl: '', targetGroup: 'ALL' };
        });
    }

    onSendNotif(id: string) {
        this.marketingService.sendNotification(id).subscribe(() => {
            this.messageService.add({ severity: 'success', summary: 'Sent', detail: 'Notification broadcast started' });
            this.loadNotifications();
        });
    }

    loadFeatured() {
        this.marketingService.getFeaturedSchedules().subscribe(data => this.featuredSchedules = data);
    }

    onScheduleFeature() {
        this.marketingService.scheduleFeature(this.newFeature).subscribe(() => {
            this.messageService.add({ severity: 'success', summary: 'Scheduled' });
            this.loadFeatured();
            this.newFeature.mediaId = '';
        });
    }

    onDeleteFeature(id: string) {
        this.marketingService.deleteFeature(id).subscribe(() => {
            this.messageService.add({ severity: 'info', summary: 'Deleted' });
            this.loadFeatured();
        });
    }
}
