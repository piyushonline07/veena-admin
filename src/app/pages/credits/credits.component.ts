import { Component, OnInit } from '@angular/core';
import { CreditService, Credit, CreditType, CreateCreditRequest } from '../../core/service/credit.service';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-credits',
  templateUrl: './credits.component.html',
  styleUrls: ['./credits.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class CreditsComponent implements OnInit {
  // Tab index: 0 = Composers, 1 = Lyricists, 2 = Producers, 3 = Directors
  activeTab: number = 0;

  // Search
  searchQuery: string = '';

  // Data
  composers: Credit[] = [];
  lyricists: Credit[] = [];
  producers: Credit[] = [];
  directors: Credit[] = [];

  // Filtered data (by search)
  filteredComposers: Credit[] = [];
  filteredLyricists: Credit[] = [];
  filteredProducers: Credit[] = [];
  filteredDirectors: Credit[] = [];

  // Loading states
  loadingComposers = false;
  loadingLyricists = false;
  loadingProducers = false;
  loadingDirectors = false;

  // Dialog state
  showDialog = false;
  isEditing = false;
  selectedCredit: Credit | null = null;

  // Related songs dialog
  showSongsDialog = false;
  selectedCreditForSongs: Credit | null = null;
  relatedSongs: any[] = [];
  loadingSongs = false;

  // Form data
  creditForm: CreateCreditRequest = {
    name: '',
    bio: '',
    imageUrl: '',
    creditType: 'COMPOSER'
  };

  saving = false;

  // Image upload state
  selectedImageFile: File | null = null;
  imagePreview: string | null = null;

  creditTypes = [
    { label: 'Composer', value: 'COMPOSER' },
    { label: 'Lyricist', value: 'LYRICIST' },
    { label: 'Producer', value: 'PRODUCER' },
    { label: 'Director', value: 'DIRECTOR' }
  ];

  constructor(
    private creditService: CreditService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadAllCredits();
  }

  loadAllCredits(): void {
    this.loadComposers();
    this.loadLyricists();
    this.loadProducers();
    this.loadDirectors();
  }

  loadComposers(): void {
    this.loadingComposers = true;
    this.creditService.getAllComposers().subscribe({
      next: (data) => {
        this.composers = data;
        this.applySearch();
        this.loadingComposers = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load composers' });
        this.loadingComposers = false;
      }
    });
  }

  loadLyricists(): void {
    this.loadingLyricists = true;
    this.creditService.getAllLyricists().subscribe({
      next: (data) => {
        this.lyricists = data;
        this.applySearch();
        this.loadingLyricists = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load lyricists' });
        this.loadingLyricists = false;
      }
    });
  }

  loadProducers(): void {
    this.loadingProducers = true;
    this.creditService.getAllProducers().subscribe({
      next: (data) => {
        this.producers = data;
        this.applySearch();
        this.loadingProducers = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load producers' });
        this.loadingProducers = false;
      }
    });
  }

  loadDirectors(): void {
    this.loadingDirectors = true;
    this.creditService.getAllDirectors().subscribe({
      next: (data) => {
        this.directors = data;
        this.applySearch();
        this.loadingDirectors = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load directors' });
        this.loadingDirectors = false;
      }
    });
  }

  // Search functionality
  onSearch(): void {
    this.applySearch();
  }

  applySearch(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.filteredComposers = [...this.composers];
      this.filteredLyricists = [...this.lyricists];
      this.filteredProducers = [...this.producers];
      this.filteredDirectors = [...this.directors];
    } else {
      this.filteredComposers = this.composers.filter(c => c.name.toLowerCase().includes(q));
      this.filteredLyricists = this.lyricists.filter(c => c.name.toLowerCase().includes(q));
      this.filteredProducers = this.producers.filter(c => c.name.toLowerCase().includes(q));
      this.filteredDirectors = this.directors.filter(c => c.name.toLowerCase().includes(q));
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applySearch();
  }

  // Related songs
  onCreditClick(credit: Credit): void {
    this.selectedCreditForSongs = credit;
    this.relatedSongs = [];
    this.loadingSongs = true;
    this.showSongsDialog = true;
    this.creditService.getMediaByCreditId(credit.id).subscribe({
      next: (data) => {
        this.relatedSongs = data || [];
        this.loadingSongs = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load related songs' });
        this.loadingSongs = false;
      }
    });
  }

  closeSongsDialog(): void {
    this.showSongsDialog = false;
    this.selectedCreditForSongs = null;
    this.relatedSongs = [];
  }

  getCreditRoleInSong(song: any): string {
    const roles: string[] = [];
    if (song.composer?.id === this.selectedCreditForSongs?.id) roles.push('Composer');
    if (song.lyricist?.id === this.selectedCreditForSongs?.id) roles.push('Lyricist');
    if (song.producer?.id === this.selectedCreditForSongs?.id) roles.push('Producer');
    if (song.director?.id === this.selectedCreditForSongs?.id) roles.push('Director');
    return roles.length > 0 ? roles.join(', ') : 'Credit';
  }

  // Image upload handlers
  onImageSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (file) {
      this.selectedImageFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedImageFile = null;
    this.imagePreview = null;
  }

  // Get current type based on active tab
  getCurrentType(): CreditType {
    switch (this.activeTab) {
      case 0: return 'COMPOSER';
      case 1: return 'LYRICIST';
      case 2: return 'PRODUCER';
      case 3: return 'DIRECTOR';
      default: return 'COMPOSER';
    }
  }

  getTypeLabel(type: CreditType): string {
    switch (type) {
      case 'COMPOSER': return 'Composer';
      case 'LYRICIST': return 'Lyricist';
      case 'PRODUCER': return 'Producer';
      case 'DIRECTOR': return 'Director';
      default: return type;
    }
  }

  // Open dialog to create new credit
  openCreateDialog(): void {
    this.isEditing = false;
    this.selectedCredit = null;
    this.selectedImageFile = null;
    this.imagePreview = null;
    this.creditForm = {
      name: '',
      bio: '',
      imageUrl: '',
      creditType: this.getCurrentType()
    };
    this.showDialog = true;
  }

  // Open dialog to edit credit
  openEditDialog(credit: Credit): void {
    this.isEditing = true;
    this.selectedCredit = credit;
    this.selectedImageFile = null;
    this.imagePreview = credit.imageUrl || null;
    this.creditForm = {
      name: credit.name,
      bio: credit.bio || '',
      imageUrl: credit.imageUrl || '',
      creditType: credit.creditType
    };
    this.showDialog = true;
  }

  // Save credit (create or update)
  saveCredit(): void {
    if (!this.creditForm.name.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Name is required' });
      return;
    }

    this.saving = true;

    if (this.isEditing && this.selectedCredit) {
      // Update
      this.creditService.updateCredit(this.selectedCredit.id, {
        name: this.creditForm.name,
        bio: this.creditForm.bio
      }, this.selectedImageFile || undefined).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Credit updated successfully' });
          this.loadAllCredits();
          this.showDialog = false;
          this.saving = false;
          this.selectedImageFile = null;
          this.imagePreview = null;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update credit' });
          this.saving = false;
        }
      });
    } else {
      // Create
      this.creditService.createCredit(this.creditForm, this.selectedImageFile || undefined).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Credit created successfully' });
          this.loadAllCredits();
          this.showDialog = false;
          this.saving = false;
          this.selectedImageFile = null;
          this.imagePreview = null;
        },
        error: (err) => {
          const message = err.error?.message || 'Failed to create credit';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
          this.saving = false;
        }
      });
    }
  }

  // Confirm delete
  confirmDelete(credit: Credit): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${credit.name}"?`,
      header: 'Delete Credit',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteCredit(credit)
    });
  }

  // Delete credit
  deleteCredit(credit: Credit): void {
    this.creditService.deleteCredit(credit.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Credit deleted successfully' });
        this.loadAllCredits();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete credit' });
      }
    });
  }
}
