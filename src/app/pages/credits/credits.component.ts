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
  // Tab index: 0 = Writers, 1 = Composers, 2 = Lyricists
  activeTab: number = 0;

  // Data
  writers: Credit[] = [];
  composers: Credit[] = [];
  lyricists: Credit[] = [];

  // Loading states
  loadingWriters = false;
  loadingComposers = false;
  loadingLyricists = false;

  // Dialog state
  showDialog = false;
  isEditing = false;
  selectedCredit: Credit | null = null;

  // Form data
  creditForm: CreateCreditRequest = {
    name: '',
    bio: '',
    imageUrl: '',
    creditType: 'WRITER'
  };

  saving = false;

  creditTypes = [
    { label: 'Writer', value: 'WRITER' },
    { label: 'Composer', value: 'COMPOSER' },
    { label: 'Lyricist', value: 'LYRICIST' }
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
    this.loadWriters();
    this.loadComposers();
    this.loadLyricists();
  }

  loadWriters(): void {
    this.loadingWriters = true;
    this.creditService.getAllWriters().subscribe({
      next: (data) => {
        this.writers = data;
        this.loadingWriters = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load writers' });
        this.loadingWriters = false;
      }
    });
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

  // Get current type based on active tab
  getCurrentType(): CreditType {
    switch (this.activeTab) {
      case 0: return 'WRITER';
      case 1: return 'COMPOSER';
      case 2: return 'LYRICIST';
      default: return 'WRITER';
    }
  }

  getTypeLabel(type: CreditType): string {
    switch (type) {
      case 'WRITER': return 'Writer';
      case 'COMPOSER': return 'Composer';
      case 'LYRICIST': return 'Lyricist';
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
