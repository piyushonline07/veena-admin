import { Component, OnInit } from '@angular/core';
import { MarketingService } from '../../core/service/marketing.service';
import { MessageService } from 'primeng/api';
import { environment } from '../../../environments/environment';
import { MediaService } from '../../core/service/media.service';

@Component({
    selector: 'app-marketing',
    templateUrl: './marketing.component.html',
    styleUrls: ['./marketing.component.scss'],
    providers: [MessageService]
})
export class MarketingComponent implements OnInit {
    // Feature flags
    notificationsEnabled = environment.enableNotifications;

    // Responsive
    isMobile = false;

    // Notifications
    notifications: any[] = [];
    targetGroups = [
        { label: 'All Users', value: 'ALL' },
        { label: 'Regular Users', value: 'USER' },
        { label: 'Administrators', value: 'ADMIN' }
    ];
    contentTypes = [
        { label: 'None', value: null },
        { label: 'Song', value: 'song' },
        { label: 'Album', value: 'album' },
        { label: 'Playlist', value: 'playlist' }
    ];
    contentItems: any[] = [];
    selectedContentItem: any = null;
    isContentLoading = false;
    contentSearchQuery = '';
    newNotif = {
        title: '',
        body: '',
        targetGroup: 'ALL',
        contentType: null as string | null,
        contentId: '',
        contentTitle: ''
    };
    selectedNotifImage: File | null = null;
    notifImagePreview: string | null = null;

    // Featured Content
    featuredSchedules: any[] = [];
    slotOptions = [
        { label: 'Hero Banner', value: 0 },
        { label: 'Trending Slot 1', value: 1 },
        { label: 'Trending Slot 2', value: 2 }
    ];

    // Media selection
    mediaResults: any[] = [];
    isMediaLoading = false;
    selectedMedia: any = null;
    mediaQuery: string = '';

    newFeature = {
        mediaId: '',
        slotIndex: 0,
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
    };

    constructor(
        private marketingService: MarketingService,
        private mediaService: MediaService,
        private messageService: MessageService
    ) { }

    ngOnInit(): void {
        this.checkMobile();
        window.addEventListener('resize', () => this.checkMobile());
        this.refreshAll();
    }

    checkMobile(): void {
        this.isMobile = window.innerWidth < 768;
    }

    refreshAll() {
        if (this.notificationsEnabled) {
            this.loadNotifications();
        }
        this.loadFeatured();
        this.searchMedia();
    }

    // Notifications
    loadNotifications() {
        this.marketingService.getNotifications().subscribe({
            next: (data) => this.notifications = data,
            error: () => {
                this.notifications = [];
                this.messageService.add({ severity: 'info', summary: 'Notifications disabled in this environment' });
                this.notificationsEnabled = false;
            }
        });
    }

    onNotifImageSelected(event: any) {
        const file = event.target?.files?.[0];
        if (file) {
            this.selectedNotifImage = file;
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.notifImagePreview = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    removeNotifImage() {
        this.selectedNotifImage = null;
        this.notifImagePreview = null;
    }

    onSaveNotif() {
        if (!this.notificationsEnabled) return;
        this.marketingService.draftNotification(this.newNotif, this.selectedNotifImage || undefined).subscribe(() => {
            this.messageService.add({ severity: 'success', summary: 'Draft Saved' });
            this.loadNotifications();
            this.newNotif = { title: '', body: '', targetGroup: 'ALL', contentType: null, contentId: '', contentTitle: '' };
            this.selectedNotifImage = null;
            this.notifImagePreview = null;
            this.selectedContentItem = null;
            this.contentItems = [];
            this.contentSearchQuery = '';
        });
    }

    onContentTypeChange() {
        this.contentItems = [];
        this.selectedContentItem = null;
        this.newNotif.contentId = '';
        this.newNotif.contentTitle = '';
        this.contentSearchQuery = '';
        if (this.newNotif.contentType) {
            this.loadContentItems();
        }
    }

    loadContentItems() {
        if (!this.newNotif.contentType) return;
        this.isContentLoading = true;
        this.marketingService.getContentItems(this.newNotif.contentType, this.contentSearchQuery || undefined).subscribe({
            next: (items) => {
                this.contentItems = items;
                this.isContentLoading = false;
            },
            error: () => {
                this.contentItems = [];
                this.isContentLoading = false;
            }
        });
    }

    onContentItemSelected() {
        if (this.selectedContentItem) {
            this.newNotif.contentId = this.selectedContentItem.id;
            this.newNotif.contentTitle = this.selectedContentItem.title;
        } else {
            this.newNotif.contentId = '';
            this.newNotif.contentTitle = '';
        }
    }

    onSendNotif(id: string) {
        if (!this.notificationsEnabled) return;
        this.marketingService.sendNotification(id).subscribe(() => {
            this.messageService.add({ severity: 'success', summary: 'Sent', detail: 'Notification broadcast started' });
            this.loadNotifications();
        });
    }

    // Featured Content
    loadFeatured() {
        this.marketingService.getFeaturedSchedules().subscribe(data => this.featuredSchedules = data);
    }

    onScheduleFeature() {
        if (!this.selectedMedia) {
            this.messageService.add({ severity: 'warn', summary: 'Please select a media item' });
            return;
        }
        const payload = {
            mediaId: this.selectedMedia.id,
            slotIndex: this.newFeature.slotIndex,
            startTime: this.newFeature.startTime,
            endTime: this.newFeature.endTime
        };
        this.marketingService.scheduleFeature(payload).subscribe(() => {
            this.messageService.add({ severity: 'success', summary: 'Scheduled' });
            this.loadFeatured();
            this.selectedMedia = null;
            this.mediaQuery = '';
        });
    }

    onDeleteFeature(id: string) {
        this.marketingService.deleteFeature(id).subscribe(() => {
            this.messageService.add({ severity: 'info', summary: 'Deleted' });
            this.loadFeatured();
        });
    }

    // Media search
    searchMedia() {
        this.isMediaLoading = true;
        // Use first page with reasonable size; backend supports optional query
        this.mediaService.getMediaList(0, 20, this.mediaQuery).subscribe({
            next: (page) => {
                this.mediaResults = page?.content || [];
                this.isMediaLoading = false;
            },
            error: () => {
                this.mediaResults = [];
                this.isMediaLoading = false;
            }
        });
    }
}
