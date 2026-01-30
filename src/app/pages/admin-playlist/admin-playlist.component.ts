import { Component, OnInit } from '@angular/core';
import { AdminPlaylistService, Playlist, CreatePlaylistRequest } from '../../core/service/admin-playlist.service';
import { MediaService } from '../../core/service/media.service';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-admin-playlist',
  templateUrl: './admin-playlist.component.html',
  styleUrls: ['./admin-playlist.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class AdminPlaylistComponent implements OnInit {
  playlists: Playlist[] = [];
  isLoading = false;

  // Dialog state
  showCreateDialog = false;
  showEditDialog = false;
  showTracksDialog = false;
  showAddTrackDialog = false;

  // Form data
  newPlaylist: CreatePlaylistRequest = {
    name: '',
    description: '',
    coverUrl: '',
    visibleToUsers: false
  };

  selectedPlaylist: Playlist | null = null;
  playlistTracks: any[] = [];
  isLoadingTracks = false;

  // Media search for adding tracks
  mediaSearchQuery = '';
  mediaResults: any[] = [];
  isSearchingMedia = false;
  selectedMedia: any = null;

  constructor(
    private playlistService: AdminPlaylistService,
    private mediaService: MediaService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadPlaylists();
  }

  // Stats getters
  getVisibleCount(): number {
    return this.playlists.filter(p => p.visibleToUsers).length;
  }

  getHiddenCount(): number {
    return this.playlists.filter(p => !p.visibleToUsers).length;
  }

  loadPlaylists(): void {
    this.isLoading = true;
    this.playlistService.getAdminPlaylists().subscribe({
      next: (playlists) => {
        this.playlists = playlists;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading playlists', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load playlists'
        });
        this.isLoading = false;
      }
    });
  }

  // ==================== CREATE ====================

  openCreateDialog(): void {
    this.newPlaylist = {
      name: '',
      description: '',
      coverUrl: '',
      visibleToUsers: false
    };
    this.showCreateDialog = true;
  }

  createPlaylist(): void {
    if (!this.newPlaylist.name.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Playlist name is required'
      });
      return;
    }

    this.playlistService.createPlaylist(this.newPlaylist).subscribe({
      next: (playlist) => {
        this.playlists.unshift(playlist);
        this.showCreateDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Created',
          detail: 'Playlist created successfully'
        });
      },
      error: (err) => {
        console.error('Error creating playlist', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to create playlist'
        });
      }
    });
  }

  // ==================== EDIT ====================

  openEditDialog(playlist: Playlist): void {
    this.selectedPlaylist = { ...playlist };
    this.showEditDialog = true;
  }

  updatePlaylist(): void {
    if (!this.selectedPlaylist) return;

    this.playlistService.updatePlaylist(this.selectedPlaylist.id, {
      name: this.selectedPlaylist.name,
      description: this.selectedPlaylist.description,
      coverUrl: this.selectedPlaylist.coverUrl,
      visibleToUsers: this.selectedPlaylist.visibleToUsers
    }).subscribe({
      next: (updated) => {
        const index = this.playlists.findIndex(p => p.id === updated.id);
        if (index >= 0) {
          this.playlists[index] = updated;
        }
        this.showEditDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Updated',
          detail: 'Playlist updated successfully'
        });
      },
      error: (err) => {
        console.error('Error updating playlist', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update playlist'
        });
      }
    });
  }

  // ==================== DELETE ====================

  confirmDelete(playlist: Playlist): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${playlist.name}"?`,
      header: 'Delete Playlist',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deletePlaylist(playlist)
    });
  }

  deletePlaylist(playlist: Playlist): void {
    this.playlistService.deletePlaylist(playlist.id).subscribe({
      next: () => {
        this.playlists = this.playlists.filter(p => p.id !== playlist.id);
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Playlist deleted successfully'
        });
      },
      error: (err) => {
        console.error('Error deleting playlist', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete playlist'
        });
      }
    });
  }

  // ==================== VISIBILITY TOGGLE ====================

  toggleVisibility(playlist: Playlist): void {
    const newVisibility = !playlist.visibleToUsers;
    this.playlistService.toggleVisibility(playlist.id, newVisibility).subscribe({
      next: () => {
        playlist.visibleToUsers = newVisibility;
        this.messageService.add({
          severity: 'success',
          summary: 'Updated',
          detail: newVisibility ? 'Playlist is now visible to users' : 'Playlist is now hidden from users'
        });
      },
      error: (err) => {
        console.error('Error toggling visibility', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update visibility'
        });
      }
    });
  }

  // ==================== TRACKS ====================

  openTracksDialog(playlist: Playlist): void {
    this.selectedPlaylist = playlist;
    this.loadPlaylistTracks(playlist.id);
    this.showTracksDialog = true;
  }

  loadPlaylistTracks(playlistId: string): void {
    this.isLoadingTracks = true;
    this.playlistService.getPlaylistTracks(playlistId).subscribe({
      next: (tracks) => {
        this.playlistTracks = tracks;
        this.isLoadingTracks = false;
      },
      error: (err) => {
        console.error('Error loading tracks', err);
        this.isLoadingTracks = false;
      }
    });
  }

  openAddTrackDialog(): void {
    this.mediaSearchQuery = '';
    this.mediaResults = [];
    this.selectedMedia = null;
    this.showAddTrackDialog = true;
  }

  searchMedia(): void {
    if (!this.mediaSearchQuery.trim()) {
      this.mediaResults = [];
      return;
    }

    this.isSearchingMedia = true;
    this.mediaService.getMediaList(0, 20, this.mediaSearchQuery).subscribe({
      next: (response: any) => {
        this.mediaResults = response.content || response;
        this.isSearchingMedia = false;
      },
      error: () => {
        this.isSearchingMedia = false;
      }
    });
  }

  addTrackToPlaylist(): void {
    if (!this.selectedPlaylist || !this.selectedMedia) return;

    this.playlistService.addTrack(this.selectedPlaylist.id, this.selectedMedia.id).subscribe({
      next: () => {
        this.playlistTracks.push(this.selectedMedia);
        this.selectedPlaylist!.trackCount++;
        this.showAddTrackDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Added',
          detail: 'Track added to playlist'
        });
      },
      error: (err) => {
        console.error('Error adding track', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to add track'
        });
      }
    });
  }

  removeTrack(track: any): void {
    if (!this.selectedPlaylist) return;

    this.playlistService.removeTrack(this.selectedPlaylist.id, track.id).subscribe({
      next: () => {
        this.playlistTracks = this.playlistTracks.filter(t => t.id !== track.id);
        this.selectedPlaylist!.trackCount--;
        this.messageService.add({
          severity: 'success',
          summary: 'Removed',
          detail: 'Track removed from playlist'
        });
      },
      error: (err) => {
        console.error('Error removing track', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to remove track'
        });
      }
    });
  }
}
