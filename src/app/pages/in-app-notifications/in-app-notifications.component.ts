import { Component, OnInit, OnDestroy } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { InAppNotificationService, InAppNotification } from '../../core/service/in-app-notification.service';

@Component({
    selector: 'app-in-app-notifications',
    templateUrl: './in-app-notifications.component.html',
    styleUrls: ['./in-app-notifications.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class InAppNotificationsComponent implements OnInit, OnDestroy {
    notifications: InAppNotification[] = [];
    filteredNotifications: InAppNotification[] = [];
    loading = false;

    // Stats
    activeCount = 0;
    inactiveCount = 0;

    // Filters
    statusFilters = [
        { label: 'All', value: null },
        { label: 'Active', value: true },
        { label: 'Inactive', value: false }
    ];
    selectedStatus: boolean | null = null;
    searchQuery = '';

    targetGroups = [
        { label: 'All Users', value: 'ALL' },
        { label: 'Regular Users', value: 'USER' },
        { label: 'Administrators', value: 'ADMIN' }
    ];

    // Create/Edit dialog
    showDialog = false;
    editMode = false;
    selectedNotification: InAppNotification | null = null;

    // Form fields
    notifForm = {
        title: '',
        description: '',
        targetGroup: 'ALL',
        isActive: true
    };
    selectedImage: File | null = null;
    imagePreview: string | null = null;

    // Details dialog
    showDetailsDialog = false;
    detailNotification: InAppNotification | null = null;

    constructor(
        private notificationService: InAppNotificationService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.loadNotifications();
    }

    ngOnDestroy(): void {}

    loadNotifications(): void {
        this.loading = true;
        this.notificationService.getAllNotifications().subscribe({
            next: (data) => {
                this.notifications = data;
                this.updateStats();
                this.filterNotifications();
                this.loading = false;
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load notifications'
                });
                this.loading = false;
            }
        });
    }

    updateStats(): void {
        this.activeCount = this.notifications.filter(n => n.isActive).length;
        this.inactiveCount = this.notifications.filter(n => !n.isActive).length;
    }

    filterNotifications(): void {
        let filtered = [...this.notifications];

        // Filter by status
        if (this.selectedStatus !== null) {
            filtered = filtered.filter(n => n.isActive === this.selectedStatus);
        }

        // Filter by search query
        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(n =>
                n.title.toLowerCase().includes(query) ||
                n.description.toLowerCase().includes(query)
            );
        }

        this.filteredNotifications = filtered;
    }

    openCreateDialog(): void {
        this.editMode = false;
        this.selectedNotification = null;
        this.notifForm = {
            title: '',
            description: '',
            targetGroup: 'ALL',
            isActive: true
        };
        this.selectedImage = null;
        this.imagePreview = null;
        this.showDialog = true;
    }

    openEditDialog(notif: InAppNotification): void {
        this.editMode = true;
        this.selectedNotification = notif;
        this.notifForm = {
            title: notif.title,
            description: notif.description,
            targetGroup: notif.targetGroup,
            isActive: notif.isActive
        };
        this.selectedImage = null;
        this.imagePreview = notif.imageUrl || null;
        this.showDialog = true;
    }

    onImageSelected(event: any): void {
        const file = event.target?.files?.[0];
        if (file) {
            this.selectedImage = file;
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.imagePreview = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    removeImage(): void {
        this.selectedImage = null;
        this.imagePreview = null;
    }

    saveNotification(): void {
        if (!this.notifForm.title || !this.notifForm.description) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation',
                detail: 'Title and description are required'
            });
            return;
        }

        this.loading = true;

        if (this.editMode && this.selectedNotification) {
            // Update existing
            this.notificationService.updateNotification(
                this.selectedNotification.id,
                this.notifForm,
                this.selectedImage || undefined
            ).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Notification updated successfully'
                    });
                    this.showDialog = false;
                    this.loadNotifications();
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to update notification'
                    });
                    this.loading = false;
                }
            });
        } else {
            // Create new
            this.notificationService.createNotification(
                this.notifForm,
                this.selectedImage || undefined
            ).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Notification created successfully'
                    });
                    this.showDialog = false;
                    this.loadNotifications();
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to create notification'
                    });
                    this.loading = false;
                }
            });
        }
    }

    toggleActive(notif: InAppNotification): void {
        this.notificationService.toggleActive(notif.id).subscribe({
            next: (updated) => {
                const index = this.notifications.findIndex(n => n.id === notif.id);
                if (index !== -1) {
                    this.notifications[index] = updated;
                    this.updateStats();
                    this.filterNotifications();
                }
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Notification ${updated.isActive ? 'activated' : 'deactivated'}`
                });
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to toggle notification status'
                });
            }
        });
    }

    confirmDelete(notif: InAppNotification): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${notif.title}"?`,
            header: 'Delete Notification',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.deleteNotification(notif)
        });
    }

    deleteNotification(notif: InAppNotification): void {
        this.notificationService.deleteNotification(notif.id).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Notification deleted successfully'
                });
                this.loadNotifications();
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to delete notification'
                });
            }
        });
    }

    showDetails(notif: InAppNotification): void {
        this.detailNotification = notif;
        this.showDetailsDialog = true;
    }

    closeDetailsDialog(): void {
        this.showDetailsDialog = false;
    }

    getAudienceLabel(targetGroup: string): string {
        const group = this.targetGroups.find(g => g.value === targetGroup);
        return group ? group.label : targetGroup;
    }

    getAudienceSeverity(targetGroup: string): string {
        switch (targetGroup) {
            case 'ALL': return 'info';
            case 'USER': return 'success';
            case 'ADMIN': return 'warning';
            default: return 'info';
        }
    }

    getStatusSeverity(isActive: boolean): string {
        return isActive ? 'success' : 'danger';
    }
}

