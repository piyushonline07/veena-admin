import { Component, OnInit } from '@angular/core';
import { ArtistService, Artist } from '../../core/service/artist.service';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
    selector: 'app-artist-list',
    templateUrl: './artist-list.component.html',
    styleUrls: ['./artist-list.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class ArtistListComponent implements OnInit {
    artists: Artist[] = [];
    totalRecords: number = 0;
    loading: boolean = true;
    rows: number = 10;
    searchQuery: string = '';

    // Dialog state
    artistDialog: boolean = false;
    deleteDialog: boolean = false;
    isNewArtist: boolean = false;
    selectedArtist: Artist = this.createEmptyArtist();

    // Form fields for creating/editing
    genres: string[] = ['Pop', 'Rock', 'Hip Hop', 'R&B', 'Electronic', 'Classical', 'Jazz', 'Country', 'Folk', 'Indie', 'Metal', 'Devotional', 'Bollywood', 'Other'];
    countries: string[] = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'South Korea', 'Brazil', 'Other'];

    constructor(
        private artistService: ArtistService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) { }

    ngOnInit(): void {
        this.loadArtists(0, this.rows);
    }

    createEmptyArtist(): Artist {
        return {
            name: '',
            genre: '',
            country: '',
            bio: '',
            imageUrl: '',
            spotifyUrl: '',
            youtubeUrl: '',
            instagramUrl: '',
            websiteUrl: '',
            monthlyListeners: 0,
            verified: false,
            active: true
        };
    }

    loadArtists(page: number, size: number) {
        this.loading = true;
        this.artistService.getArtists(page, size, this.searchQuery).subscribe({
            next: (data) => {
                this.artists = data.content;
                this.totalRecords = data.totalElements;
                this.loading = false;
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load artists' });
                this.loading = false;
            }
        });
    }

    onPageChange(event: any) {
        const page = event.page !== undefined ? event.page : (event.first / event.rows);
        this.loadArtists(page, event.rows);
    }

    onSearch() {
        this.loadArtists(0, this.rows);
    }

    openNewArtist() {
        this.selectedArtist = this.createEmptyArtist();
        this.isNewArtist = true;
        this.artistDialog = true;
    }

    editArtist(artist: Artist) {
        this.selectedArtist = { ...artist };
        this.isNewArtist = false;
        this.artistDialog = true;
    }

    hideDialog() {
        this.artistDialog = false;
    }

    saveArtist() {
        if (!this.selectedArtist.name?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Artist name is required' });
            return;
        }

        if (this.isNewArtist) {
            this.artistService.createArtist(this.selectedArtist).subscribe({
                next: (artist) => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Artist created successfully' });
                    this.artistDialog = false;
                    this.loadArtists(0, this.rows);
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create artist' });
                }
            });
        } else {
            this.artistService.updateArtist(this.selectedArtist.id!, this.selectedArtist).subscribe({
                next: (artist) => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Artist updated successfully' });
                    this.artistDialog = false;
                    this.loadArtists(0, this.rows);
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update artist' });
                }
            });
        }
    }

    confirmDelete(artist: Artist) {
        this.selectedArtist = artist;
        this.deleteDialog = true;
    }

    deleteArtist() {
        this.artistService.deleteArtist(this.selectedArtist.id!).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Artist deleted successfully' });
                this.deleteDialog = false;
                this.loadArtists(0, this.rows);
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete artist' });
            }
        });
    }

    toggleVerification(artist: Artist) {
        this.artistService.toggleVerification(artist.id!).subscribe({
            next: (updatedArtist) => {
                const index = this.artists.findIndex(a => a.id === artist.id);
                if (index !== -1) {
                    this.artists[index] = updatedArtist;
                }
                const status = updatedArtist.verified ? 'verified' : 'unverified';
                this.messageService.add({ severity: 'success', summary: 'Success', detail: `Artist is now ${status}` });
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update verification status' });
            }
        });
    }

    formatNumber(num: number | undefined): string {
        if (!num) return '0';
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
}
