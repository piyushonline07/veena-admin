import { Component, OnInit } from '@angular/core';
import { EcomService } from '../../core/service/ecom.service';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-ecom-categories',
  templateUrl: './ecom-categories.component.html',
  styleUrls: ['./ecom-categories.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class EcomCategoriesComponent implements OnInit {
  categories: any[] = [];
  flatCategories: any[] = [];
  loading = false;

  // Dialog
  showDialog = false;
  isEditMode = false;
  categoryForm: any = {};

  // Image upload
  selectedCatImageFile: File | null = null;
  catImagePreview: string | null = null;

  constructor(
    private ecomService: EcomService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.ecomService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.flatCategories = this.flattenCategories(data);
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load categories' });
        this.loading = false;
      }
    });
  }

  flattenCategories(categories: any[], level: number = 0): any[] {
    let result: any[] = [];
    for (const cat of categories) {
      result.push({ ...cat, level });
      if (cat.children && cat.children.length > 0) {
        result = result.concat(this.flattenCategories(cat.children, level + 1));
      }
    }
    return result;
  }

  openNewDialog(): void {
    this.categoryForm = { name: '', description: '', displayOrder: 0, isActive: true };
    this.selectedCatImageFile = null;
    this.catImagePreview = null;
    this.isEditMode = false;
    this.showDialog = true;
  }

  openEditDialog(category: any): void {
    this.categoryForm = { ...category };
    this.selectedCatImageFile = null;
    this.catImagePreview = category.imageUrl || null; // show existing image
    this.isEditMode = true;
    this.showDialog = true;
  }

  hideDialog(): void {
    this.showDialog = false;
    this.selectedCatImageFile = null;
    this.catImagePreview = null;
  }

  save(): void {
    if (!this.categoryForm.name?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Category name is required' });
      return;
    }

    if (this.isEditMode && this.categoryForm.id) {
      this.ecomService.updateCategory(this.categoryForm.id, this.categoryForm, this.selectedCatImageFile || undefined).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Category updated' });
          this.showDialog = false;
          this.loadCategories();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to update' });
        }
      });
    } else {
      this.ecomService.createCategory(this.categoryForm, this.selectedCatImageFile || undefined).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Category created' });
          this.showDialog = false;
          this.loadCategories();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to create' });
        }
      });
    }
  }

  deleteCategory(category: any): void {
    this.confirmationService.confirm({
      message: `Delete "${category.name}"? This cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.ecomService.deleteCategory(category.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'info', summary: 'Category deleted' });
            this.loadCategories();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to delete' });
          }
        });
      }
    });
  }

  toggleActive(category: any): void {
    this.ecomService.updateCategory(category.id, { ...category, isActive: !category.isActive }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: `Category ${!category.isActive ? 'activated' : 'deactivated'}` });
        this.loadCategories();
      }
    });
  }

  // ========== Image Selection Handlers ==========

  onCatImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.setCatImageFile(input.files[0]);
      input.value = '';
    }
  }

  onCatImageDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.setCatImageFile(event.dataTransfer.files[0]);
    }
  }

  removeCatImage(event: Event): void {
    event.stopPropagation();
    this.selectedCatImageFile = null;
    this.catImagePreview = null;
    this.categoryForm.imageUrl = null;
  }

  private setCatImageFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.messageService.add({ severity: 'warn', summary: 'Only image files are allowed' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.messageService.add({ severity: 'warn', summary: 'File size exceeds 10 MB limit' });
      return;
    }
    this.selectedCatImageFile = file;
    // Generate local preview
    const reader = new FileReader();
    reader.onload = () => {
      this.catImagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }
}
