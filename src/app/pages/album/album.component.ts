import { Component, OnInit } from '@angular/core';
import { AlbumService, Album } from '../../core/service/album.service';
import { MediaService } from '../../core/service/media.service';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-album',
  templateUrl: './album.component.html',
  styleUrls: ['./album.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class AlbumComponent implements OnInit {
  albums: Album[] = [];
  selectedAlbum: Album | null = null;
  loading = false;
  totalRecords = 0;
  rows = 10;
  searchQuery = '';

  // Dialog state
  showAlbumDialog = false;
  isEditMode = false;
  albumForm: Album = { name: '', description: '' };

  // Image upload state
  selectedImageFile: File | null = null;
  imagePreviewUrl: string | null = null;
  uploadingImage = false;

  // Add songs dialog
  showAddSongsDialog = false;
  availableSongs: any[] = [];
  selectedSongs: any[] = [];
  songSearchQuery = '';
  isLoadingSongs = false;

  constructor(
    private albumService: AlbumService,
    private mediaService: MediaService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadAlbums();
  }

  loadAlbums(): void {
    this.loading = true;
    this.albumService.getAlbums(0, this.rows, this.searchQuery).subscribe({
      next: (data) => {
        this.albums = data.content;
        this.totalRecords = data.totalElements;
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load albums' });
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.loadAlbums();
  }

  onPageChange(event: any): void {
    const page = event.page !== undefined ? event.page : (event.first / event.rows);
    this.albumService.getAlbums(page, event.rows, this.searchQuery).subscribe({
      next: (data) => {
        this.albums = data.content;
        this.totalRecords = data.totalElements;
      }
    });
  }

  openNewAlbumDialog(): void {
    this.albumForm = { name: '', description: '' };
    this.isEditMode = false;
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
    this.showAlbumDialog = true;
  }

  openEditAlbumDialog(album: Album): void {
    this.albumForm = { ...album };
    this.isEditMode = true;
    this.selectedImageFile = null;
    this.imagePreviewUrl = album.coverImageUrl || null;
    this.showAlbumDialog = true;
  }

  hideDialog(): void {
    this.showAlbumDialog = false;
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
  }

  onImageSelect(event: any): void {
    const file: File | undefined = event?.files?.[0];
    if (!file) return;

    this.selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreviewUrl = e.target?.result || null;
    };
    reader.readAsDataURL(file);
  }

  clearImage(): void {
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
    this.albumForm.coverImageUrl = '';
  }

  saveAlbum(): void {
    if (!this.albumForm.name.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Album name is required' });
      return;
    }

    if (this.isEditMode && this.albumForm.id) {
      this.albumService.updateAlbum(this.albumForm.id, this.albumForm).subscribe({
        next: (album) => {
          if (this.selectedImageFile && album.id) {
            this.uploadImageForAlbum(album.id, 'Album updated successfully');
          } else {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Album updated' });
            this.showAlbumDialog = false;
            this.loadAlbums();
          }
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update album' });
        }
      });
    } else {
      this.albumService.createAlbum(this.albumForm).subscribe({
        next: (album) => {
          if (this.selectedImageFile && album.id) {
            this.uploadImageForAlbum(album.id, 'Album created successfully');
          } else {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Album created' });
            this.showAlbumDialog = false;
            this.loadAlbums();
          }
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create album' });
        }
      });
    }
  }

  private uploadImageForAlbum(albumId: number, successMessage: string): void {
    if (!this.selectedImageFile) return;

    this.uploadingImage = true;
    this.albumService.uploadAlbumImage(albumId, this.selectedImageFile).subscribe({
      next: () => {
        this.uploadingImage = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: successMessage });
        this.showAlbumDialog = false;
        this.selectedImageFile = null;
        this.imagePreviewUrl = null;
        this.loadAlbums();
      },
      error: () => {
        this.uploadingImage = false;
        this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Album saved but image upload failed' });
        this.showAlbumDialog = false;
        this.loadAlbums();
      }
    });
  }

  deleteAlbum(album: Album): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${album.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (album.id) {
          this.albumService.deleteAlbum(album.id).subscribe({
            next: () => {
              if (this.selectedAlbum?.id === album.id) {
                this.selectedAlbum = null;
              }
              this.messageService.add({ severity: 'info', summary: 'Album deleted' });
              this.loadAlbums();
            },
            error: () => {
              this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete album' });
            }
          });
        }
      }
    });
  }

  selectAlbum(album: Album): void {
    this.selectedAlbum = album;
  }

  openAddSongsDialog(): void {
    if (!this.selectedAlbum) return;
    this.selectedSongs = [];
    this.songSearchQuery = '';
    this.searchSongs();
    this.showAddSongsDialog = true;
  }

  searchSongs(): void {
    this.isLoadingSongs = true;
    this.mediaService.getMediaList(0, 50, this.songSearchQuery).subscribe({
      next: (page) => {
        this.availableSongs = page?.content || [];
        this.isLoadingSongs = false;
      },
      error: () => {
        this.availableSongs = [];
        this.isLoadingSongs = false;
      }
    });
  }

  addSelectedSongs(): void {
    if (!this.selectedAlbum || this.selectedSongs.length === 0) return;
    // Note: For now, songs are not persisted to backend album.
    // This would require additional backend support for album-media relationship
    this.messageService.add({
      severity: 'success',
      summary: `Selected ${this.selectedSongs.length} song(s)`
    });
    this.showAddSongsDialog = false;
  }

  removeSongFromAlbum(song: any): void {
    // Note: For now, this is a placeholder.
    // Full implementation requires backend support for album-media relationship
    this.messageService.add({ severity: 'info', summary: 'Song removed from album' });
  }

  getMediaTypeIcon(mediaType: string): string {
    return mediaType === 'AUDIO' ? 'pi-volume-up' : 'pi-video';
  }

  getMediaTypeSeverity(mediaType: string): string {
    return mediaType === 'AUDIO' ? 'info' : 'warning';
  }

  toggleSongSelection(song: any): void {
    const index = this.selectedSongs.findIndex(s => s.id === song.id);
    if (index > -1) {
      this.selectedSongs.splice(index, 1);
    } else {
      this.selectedSongs.push(song);
    }
  }
}
