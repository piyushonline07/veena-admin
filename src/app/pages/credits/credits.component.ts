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
  // Tab index: 0 = Composers, 1 = Lyricists, 2 = Producers
  activeTab: number = 0;

  // Data
  composers: Credit[] = [];
  lyricists: Credit[] = [];
  producers: Credit[] = [];

  // Loading states
  loadingComposers = false;
  loadingLyricists = false;
  loadingProducers = false;

  // Dialog state
  showDialog = false;
  isEditing = false;
  selectedCredit: Credit | null = null;

  // Form data
  creditForm: CreateCreditRequest = {
    name: '',
    bio: '',
    imageUrl: '',
    creditType: 'COMPOSER'
  };

  saving = false;

  creditTypes = [
    { label: 'Composer', value: 'COMPOSER' },
    { label: 'Lyricist', value: 'LYRICIST' },
    { label: 'Producer', value: 'PRODUCER' }
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
  }

  loadComposers(): void {
    this.loadingComposers = true;
    this.creditService.getAllComposers().subscribe({
      next: (data) => {
        this.composers = data;
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
        this.loadingProducers = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load producers' });
        this.loadingProducers = false;
      }
    });
  }

  // Get current type based on active tab
  getCurrentType(): CreditType {
    switch (this.activeTab) {
      case 0: return 'COMPOSER';
      case 1: return 'LYRICIST';
      case 2: return 'PRODUCER';
      default: return 'COMPOSER';
    }
  }

  getTypeLabel(type: CreditType): string {
    switch (type) {
      case 'COMPOSER': return 'Composer';
      case 'LYRICIST': return 'Lyricist';
      case 'PRODUCER': return 'Producer';
      default: return type;
    }
  }

  // Open dialog to create new credit
  openCreateDialog(): void {
    this.isEditing = false;
    this.selectedCredit = null;
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
        bio: this.creditForm.bio,
        imageUrl: this.creditForm.imageUrl
      }).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Credit updated successfully' });
          this.loadAllCredits();
          this.showDialog = false;
          this.saving = false;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update credit' });
          this.saving = false;
        }
      });
    } else {
      // Create
      this.creditService.createCredit(this.creditForm).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Credit created successfully' });
          this.loadAllCredits();
          this.showDialog = false;
          this.saving = false;
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
