import { Component, OnInit } from '@angular/core';
import { FeaturedContentService, FeaturedContent } from '../../core/service/featured-content.service';
import { MediaService } from '../../core/service/media.service';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-featured-content',
  templateUrl: './featured-content.component.html',
  styleUrls: ['./featured-content.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class FeaturedContentComponent implements OnInit {
  allContent: FeaturedContent[] = [];
  isLoading = false;

  // Tabs
  activeTab = 0; // 0=All, 1=Songs, 2=Ads

  // Add Featured Song dialog
  showSongDialog = false;
  songSearchQuery = '';
  songSearchResults: any[] = [];
  isSearchingSongs = false;
  selectedSong: any = null;
  songSlotIndex: number | null = null;
  songStartTime: Date = new Date();
  songEndTime: Date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 days
  songFeaturedImage: File | null = null;
  songFeaturedImagePreview: string | null = null;
  isAddingSong = false;
  private songSearchTimer: any = null;

  // Add Ad dialog
  showAdDialog = false;
  adContentType: any = { label: 'Image Ad', value: 'IMAGE_AD' };
  adContentTypes = [
    { label: 'Image Ad', value: 'IMAGE_AD' },
    { label: 'Video Ad', value: 'VIDEO_AD' },
    { label: 'Audio Ad', value: 'AUDIO_AD' }
  ];
  adTitle = '';
  adSlotIndex: number | null = null;
  adStartTime: Date = new Date();
  adEndTime: Date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  adFile: File | null = null;
  adImage: File | null = null;
  adFilePreview: string | null = null;
  adImagePreview: string | null = null;
  adFeaturedImage: File | null = null;
  adFeaturedImagePreview: string | null = null;
  isUploadingAd = false;

  // Edit dialog
  showEditDialog = false;
  editItem: FeaturedContent | null = null;
  editTitle = '';
  editSlotIndex = 0;
  editStartTime: Date = new Date();
  editEndTime: Date = new Date();
  editIsActive = true;

  constructor(
    private featuredService: FeaturedContentService,
    private mediaService: MediaService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.isLoading = true;
    this.featuredService.getAll().subscribe({
      next: (data) => {
        this.allContent = data;
        this.isLoading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load featured content' });
        this.isLoading = false;
      }
    });
  }

  get filteredContent(): FeaturedContent[] {
    if (this.activeTab === 1) return this.allContent.filter(c => c.contentType === 'FEATURED_SONG');
    if (this.activeTab === 2) return this.allContent.filter(c => c.contentType !== 'FEATURED_SONG');
    return this.allContent;
  }

  get featuredSongsCount(): number {
    return this.allContent.filter(c => c.contentType === 'FEATURED_SONG').length;
  }

  get adsCount(): number {
    return this.allContent.filter(c => c.contentType !== 'FEATURED_SONG').length;
  }

  get activeCount(): number {
    return this.allContent.filter(c => c.isActive).length;
  }

  // ───── Featured Song Dialog ─────

  openSongDialog(): void {
    this.selectedSong = null;
    this.songSearchQuery = '';
    this.songSearchResults = [];
    this.songSlotIndex = null;
    this.songStartTime = new Date();
    this.songEndTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    this.songFeaturedImage = null;
    this.songFeaturedImagePreview = null;
    this.showSongDialog = true;
  }

  searchSongs(): void {
    if (!this.songSearchQuery?.trim()) {
      this.songSearchResults = [];
      return;
    }
    this.isSearchingSongs = true;
    this.mediaService.getMediaList(0, 20, this.songSearchQuery.trim()).subscribe({
      next: (resp: any) => {
        this.songSearchResults = resp?.content || [];
        this.isSearchingSongs = false;
      },
      error: () => {
        this.isSearchingSongs = false;
      }
    });
  }

  onSongSearchInput(): void {
    if (this.songSearchTimer) {
      clearTimeout(this.songSearchTimer);
    }
    this.songSearchTimer = setTimeout(() => {
      this.searchSongs();
    }, 400);
  }

  selectSong(song: any): void {
    this.selectedSong = song;
  }

  addFeaturedSong(): void {
    if (!this.selectedSong) return;

    this.isAddingSong = true;
    const formData = new FormData();
    formData.append('mediaId', this.selectedSong.id);
    if (this.songSlotIndex != null) {
      formData.append('slotIndex', this.songSlotIndex.toString());
    }
    formData.append('startTime', this.songStartTime.toISOString());
    formData.append('endTime', this.songEndTime.toISOString());
    if (this.songFeaturedImage) {
      formData.append('featuredImage', this.songFeaturedImage);
    }

    this.featuredService.addFeaturedSong(formData).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Added', detail: `"${this.selectedSong.title}" added to featured` });
        this.showSongDialog = false;
        this.isAddingSong = false;
        this.loadAll();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to add featured song' });
        this.isAddingSong = false;
      }
    });
  }

  onSongFeaturedImageSelected(event: any): void {
    const file = event.files?.[0] || event.target?.files?.[0];
    if (file) {
      this.songFeaturedImage = file;
      const reader = new FileReader();
      reader.onload = (e: any) => this.songFeaturedImagePreview = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  removeSongFeaturedImage(): void {
    this.songFeaturedImage = null;
    this.songFeaturedImagePreview = null;
  }

  // ───── Ad Dialog ─────

  openAdDialog(): void {
    this.adTitle = '';
    this.adSlotIndex = null;
    this.adFile = null;
    this.adImage = null;
    this.adFilePreview = null;
    this.adImagePreview = null;
    this.adFeaturedImage = null;
    this.adFeaturedImagePreview = null;
    this.adContentType = this.adContentTypes[0];
    this.adStartTime = new Date();
    this.adEndTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    this.showAdDialog = true;
  }

  onAdFileSelected(event: any): void {
    const file = event.files?.[0] || event.target?.files?.[0];
    if (file) {
      this.adFile = file;
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e: any) => this.adFilePreview = e.target.result;
        reader.readAsDataURL(file);
      } else {
        this.adFilePreview = null;
      }
    }
  }

  onAdImageSelected(event: any): void {
    const file = event.files?.[0] || event.target?.files?.[0];
    if (file) {
      this.adImage = file;
      const reader = new FileReader();
      reader.onload = (e: any) => this.adImagePreview = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  get adAcceptTypes(): string {
    switch (this.adContentType?.value) {
      case 'VIDEO_AD': return '.mp4,.mov';
      case 'AUDIO_AD': return '.mp3,.wav';
      case 'IMAGE_AD': return '.jpg,.jpeg,.png,.webp,.gif';
      default: return '*';
    }
  }

  uploadAd(): void {
    if (!this.adTitle?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Required', detail: 'Please enter ad title' });
      return;
    }
    if (!this.adFile && this.adContentType?.value !== 'IMAGE_AD') {
      this.messageService.add({ severity: 'warn', summary: 'Required', detail: 'Please select an ad file' });
      return;
    }
    if (!this.adFile && !this.adImage) {
      this.messageService.add({ severity: 'warn', summary: 'Required', detail: 'Please select an ad file or image' });
      return;
    }

    this.isUploadingAd = true;
    const formData = new FormData();
    formData.append('contentType', this.adContentType.value);
    formData.append('title', this.adTitle.trim());
    if (this.adSlotIndex != null) {
      formData.append('slotIndex', this.adSlotIndex.toString());
    }
    formData.append('startTime', this.adStartTime.toISOString());
    formData.append('endTime', this.adEndTime.toISOString());
    if (this.adFile) formData.append('adFile', this.adFile);
    if (this.adImage) formData.append('adImage', this.adImage);
    if (this.adFeaturedImage) formData.append('featuredImage', this.adFeaturedImage);

    this.featuredService.addAd(formData).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Uploaded', detail: 'Ad uploaded successfully' });
        this.showAdDialog = false;
        this.isUploadingAd = false;
        this.loadAll();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to upload ad' });
        this.isUploadingAd = false;
      }
    });
  }

  onAdFeaturedImageSelected(event: any): void {
    const file = event.files?.[0] || event.target?.files?.[0];
    if (file) {
      this.adFeaturedImage = file;
      const reader = new FileReader();
      reader.onload = (e: any) => this.adFeaturedImagePreview = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  removeAdFeaturedImage(): void {
    this.adFeaturedImage = null;
    this.adFeaturedImagePreview = null;
  }

  // ───── Edit Dialog ─────

  openEditDialog(item: FeaturedContent): void {
    this.editItem = item;
    this.editTitle = item.title || '';
    this.editSlotIndex = item.slotIndex;
    this.editStartTime = new Date(item.startTime);
    this.editEndTime = new Date(item.endTime);
    this.editIsActive = item.isActive;
    this.showEditDialog = true;
  }

  saveEdit(): void {
    if (!this.editItem) return;
    this.featuredService.update(this.editItem.id, {
      title: this.editTitle,
      slotIndex: this.editSlotIndex,
      startTime: this.editStartTime.toISOString(),
      endTime: this.editEndTime.toISOString(),
      isActive: this.editIsActive
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Featured content updated' });
        this.showEditDialog = false;
        this.loadAll();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update' });
      }
    });
  }

  // ───── Toggle / Delete ─────

  toggleActive(item: FeaturedContent): void {
    this.featuredService.toggleActive(item.id).subscribe({
      next: (updated) => {
        item.isActive = updated.isActive;
        this.messageService.add({ severity: 'info', summary: updated.isActive ? 'Activated' : 'Deactivated', detail: `"${item.title}" is now ${updated.isActive ? 'active' : 'inactive'}` });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to toggle' });
      }
    });
  }

  deleteItem(item: FeaturedContent): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${item.title}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.featuredService.delete(item.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: `"${item.title}" removed` });
            this.loadAll();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete' });
          }
        });
      }
    });
  }

  // ───── Helpers ─────

  updateSlotIndex(item: FeaturedContent, newSlot: number): void {
    if (!newSlot || newSlot < 1 || newSlot === item.slotIndex) return;

    this.featuredService.update(item.id, { slotIndex: newSlot }).subscribe({
      next: () => {
        item.slotIndex = newSlot;
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: `Order updated to ${newSlot}` });
        this.loadAll();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update order' });
      }
    });
  }

  getContentTypeLabel(type: string): string {
    switch (type) {
      case 'FEATURED_SONG': return 'Featured Song';
      case 'VIDEO_AD': return 'Video Ad';
      case 'AUDIO_AD': return 'Audio Ad';
      case 'IMAGE_AD': return 'Image Ad';
      default: return type;
    }
  }

  getContentTypeSeverity(type: string): string {
    switch (type) {
      case 'FEATURED_SONG': return 'info';
      case 'VIDEO_AD': return 'warning';
      case 'AUDIO_AD': return 'success';
      case 'IMAGE_AD': return 'secondary';
      default: return 'info';
    }
  }

  getContentTypeIcon(type: string): string {
    switch (type) {
      case 'FEATURED_SONG': return 'pi pi-headphones';
      case 'VIDEO_AD': return 'pi pi-video';
      case 'AUDIO_AD': return 'pi pi-volume-up';
      case 'IMAGE_AD': return 'pi pi-image';
      default: return 'pi pi-circle';
    }
  }

  isExpired(item: FeaturedContent): boolean {
    return new Date(item.endTime) < new Date();
  }

  isScheduled(item: FeaturedContent): boolean {
    return new Date(item.startTime) > new Date();
  }
}

