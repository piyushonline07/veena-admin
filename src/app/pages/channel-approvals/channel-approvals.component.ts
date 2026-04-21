import { Component, OnInit } from '@angular/core';
import { ChannelService, ChannelResponse, UserMediaResponse, PageResponse } from '../../core/service/channel.service';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
    selector: 'app-channel-approvals',
    templateUrl: './channel-approvals.component.html',
    styleUrls: ['./channel-approvals.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class ChannelApprovalsComponent implements OnInit {
    // Tab index: 0 = Pending Approvals, 1 = All Channels
    activeTabIndex: number = 0;

    // ===== Pending Media =====
    pendingMedia: UserMediaResponse[] = [];
    pendingTotalRecords: number = 0;
    pendingLoading: boolean = true;
    pendingRows: number = 10;
    selectedMedia: UserMediaResponse[] = [];

    // ===== All Channels =====
    channels: ChannelResponse[] = [];
    channelsTotalRecords: number = 0;
    channelsLoading: boolean = true;
    channelsRows: number = 10;
    channelSearchQuery: string = '';

    // ===== Dialogs =====
    // Media Preview Dialog
    previewDialog: boolean = false;
    previewMedia: UserMediaResponse | null = null;

    // Reject Dialog
    rejectDialog: boolean = false;
    rejectMediaId: string = '';
    rejectionReason: string = '';
    rejectLoading: boolean = false;

    // Channel Media Dialog
    channelMediaDialog: boolean = false;
    channelMediaItems: UserMediaResponse[] = [];
    channelMediaTotalRecords: number = 0;
    channelMediaLoading: boolean = false;
    selectedChannel: ChannelResponse | null = null;
    channelMediaFilter: string = '';
    channelMediaRows: number = 10;

    // Batch actions
    batchApproving: boolean = false;

    constructor(
        private channelService: ChannelService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) { }

    ngOnInit(): void {
        this.loadPendingMedia(0, this.pendingRows);
        this.loadChannels(0, this.channelsRows);
    }

    // ===== PENDING MEDIA TAB =====

    loadPendingMedia(page: number, size: number): void {
        this.pendingLoading = true;
        this.channelService.getPendingMedia(page, size).subscribe({
            next: (data) => {
                this.pendingMedia = data.content;
                this.pendingTotalRecords = data.totalElements;
                this.pendingLoading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load pending media' });
                this.pendingLoading = false;
            }
        });
    }

    onPendingPageChange(event: any): void {
        const page = event.page !== undefined ? event.page : Math.floor(event.first / event.rows);
        this.loadPendingMedia(page, event.rows);
    }

    // ===== APPROVE / REJECT =====

    approveMedia(media: UserMediaResponse): void {
        this.confirmationService.confirm({
            message: `Approve "${media.title}" by ${media.uploadedByName}? This will make it publicly visible.`,
            header: 'Confirm Approval',
            icon: 'pi pi-check-circle',
            accept: () => {
                this.channelService.reviewMedia(media.id, { action: 'APPROVE' }).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Approved', detail: `"${media.title}" is now live!` });
                        this.loadPendingMedia(0, this.pendingRows);
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to approve media' });
                    }
                });
            }
        });
    }

    openRejectDialog(media: UserMediaResponse): void {
        this.rejectMediaId = media.id;
        this.rejectionReason = '';
        this.rejectDialog = true;
    }

    confirmReject(): void {
        if (!this.rejectionReason.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Required', detail: 'Please provide a rejection reason' });
            return;
        }

        this.rejectLoading = true;
        this.channelService.reviewMedia(this.rejectMediaId, {
            action: 'REJECT',
            rejectionReason: this.rejectionReason
        }).subscribe({
            next: () => {
                this.messageService.add({ severity: 'info', summary: 'Rejected', detail: 'Media has been rejected' });
                this.rejectDialog = false;
                this.rejectLoading = false;
                this.loadPendingMedia(0, this.pendingRows);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to reject media' });
                this.rejectLoading = false;
            }
        });
    }

    // ===== BATCH APPROVE =====

    batchApprove(): void {
        if (this.selectedMedia.length === 0) return;

        const count = this.selectedMedia.length;
        this.confirmationService.confirm({
            message: `Approve ${count} selected media item(s)? They will become publicly visible.`,
            header: 'Batch Approval',
            icon: 'pi pi-check-circle',
            accept: () => {
                this.batchApproving = true;
                const ids = this.selectedMedia.map(m => m.id);
                this.channelService.batchApproveMedia(ids).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Approved', detail: `${count} items approved!` });
                        this.selectedMedia = [];
                        this.batchApproving = false;
                        this.loadPendingMedia(0, this.pendingRows);
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Batch approval failed' });
                        this.batchApproving = false;
                    }
                });
            }
        });
    }

    // ===== PREVIEW =====

    showPreview(media: UserMediaResponse): void {
        this.previewMedia = media;
        this.previewDialog = true;
    }

    // ===== CHANNELS TAB =====

    loadChannels(page: number, size: number): void {
        this.channelsLoading = true;
        this.channelService.getChannels(page, size, this.channelSearchQuery).subscribe({
            next: (data) => {
                this.channels = data.content;
                this.channelsTotalRecords = data.totalElements;
                this.channelsLoading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load channels' });
                this.channelsLoading = false;
            }
        });
    }

    onChannelsPageChange(event: any): void {
        const page = event.page !== undefined ? event.page : Math.floor(event.first / event.rows);
        this.loadChannels(page, event.rows);
    }

    onChannelSearch(): void {
        this.loadChannels(0, this.channelsRows);
    }

    // ===== CHANNEL MEDIA DRILL-DOWN =====

    showChannelMedia(channel: ChannelResponse): void {
        this.selectedChannel = channel;
        this.channelMediaFilter = '';
        this.channelMediaDialog = true;
        this.loadChannelMedia(channel.id, 0, this.channelMediaRows);
    }

    loadChannelMedia(channelId: string, page: number, size: number): void {
        this.channelMediaLoading = true;
        this.channelService.getChannelMedia(channelId, page, size, this.channelMediaFilter || undefined).subscribe({
            next: (data) => {
                this.channelMediaItems = data.content;
                this.channelMediaTotalRecords = data.totalElements;
                this.channelMediaLoading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load channel media' });
                this.channelMediaLoading = false;
            }
        });
    }

    onChannelMediaPageChange(event: any): void {
        if (!this.selectedChannel) return;
        const page = event.page !== undefined ? event.page : Math.floor(event.first / event.rows);
        this.loadChannelMedia(this.selectedChannel.id, page, event.rows);
    }

    onChannelMediaFilterChange(): void {
        if (!this.selectedChannel) return;
        this.loadChannelMedia(this.selectedChannel.id, 0, this.channelMediaRows);
    }

    // ===== HELPERS =====

    getApprovalSeverity(status: string): string {
        switch (status) {
            case 'PENDING': return 'warning';
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'danger';
            default: return 'info';
        }
    }

    getStatusSeverity(status: string): string {
        switch (status) {
            case 'READY': return 'success';
            case 'PROCESSING': return 'info';
            case 'UPLOADING': return 'warning';
            case 'FAILED': return 'danger';
            default: return 'info';
        }
    }

    formatFileSize(bytes: number): string {
        if (!bytes) return '-';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }

    getMediaTypeIcon(mediaType: string): string {
        return mediaType === 'VIDEO' ? 'pi pi-video' : 'pi pi-volume-up';
    }

    onTabChange(event: any): void {
        this.activeTabIndex = event.index;
    }

    // Filter options for channel media dialog
    approvalFilterOptions = [
        { label: 'All', value: '' },
        { label: 'Pending', value: 'PENDING' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Rejected', value: 'REJECTED' }
    ];
}
