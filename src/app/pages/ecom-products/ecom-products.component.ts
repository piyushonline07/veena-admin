import { Component, OnInit } from '@angular/core';
import { EcomService } from '../../core/service/ecom.service';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-ecom-products',
  templateUrl: './ecom-products.component.html',
  styleUrls: ['./ecom-products.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class EcomProductsComponent implements OnInit {
  products: any[] = [];
  categories: any[] = [];
  loading = false;
  totalRecords = 0;
  rows = 20;
  searchQuery = '';

  // Dialog
  showDialog = false;
  isEditMode = false;
  productForm: any = {};

  // Pending image files (not yet uploaded — will be sent on save)
  pendingImageFiles: File[] = [];
  pendingImagePreviews: string[] = [];

  constructor(
    private ecomService: EcomService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts(): void {
    this.loading = true;
    this.ecomService.getProducts(0, this.rows, this.searchQuery).subscribe({
      next: (data) => {
        this.products = data.content;
        this.totalRecords = data.totalElements;
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load products' });
        this.loading = false;
      }
    });
  }

  loadCategories(): void {
    this.ecomService.getCategories().subscribe({
      next: (data) => { this.categories = this.flattenCategories(data); },
      error: () => { this.categories = []; }
    });
  }

  flattenCategories(categories: any[], level: number = 0): any[] {
    let result: any[] = [];
    for (const cat of categories) {
      result.push({ ...cat, displayName: '  '.repeat(level) + cat.name });
      if (cat.children?.length > 0) {
        result = result.concat(this.flattenCategories(cat.children, level + 1));
      }
    }
    return result;
  }

  onSearch(): void { this.loadProducts(); }

  onPageChange(event: any): void {
    const page = event.page !== undefined ? event.page : Math.floor(event.first / event.rows);
    this.ecomService.getProducts(page, event.rows, this.searchQuery).subscribe({
      next: (data) => {
        this.products = data.content;
        this.totalRecords = data.totalElements;
      }
    });
  }

  openNewDialog(): void {
    this.productForm = {
      name: '', price: null, quantity: 0, isActive: true, isFeatured: false,
      taxPercent: 0, lowStockThreshold: 5, images: [], variants: []
    };
    this.pendingImageFiles = [];
    this.pendingImagePreviews = [];
    this.isEditMode = false;
    this.showDialog = true;
  }

  openEditDialog(product: any): void {
    this.productForm = { ...product };
    this.pendingImageFiles = [];
    this.pendingImagePreviews = [];
    this.isEditMode = true;
    this.showDialog = true;
  }

  hideDialog(): void {
    this.showDialog = false;
    this.pendingImageFiles = [];
    this.pendingImagePreviews = [];
  }

  save(): void {
    if (!this.productForm.name?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Product name is required' });
      return;
    }
    if (!this.productForm.categoryId) {
      this.messageService.add({ severity: 'warn', summary: 'Category is required' });
      return;
    }
    if (!this.productForm.price || this.productForm.price <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Valid price is required' });
      return;
    }

    const filesToSend = this.pendingImageFiles.length > 0 ? this.pendingImageFiles : undefined;

    if (this.isEditMode && this.productForm.id) {
      this.ecomService.updateProduct(this.productForm.id, this.productForm, filesToSend).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Product updated' });
          this.showDialog = false;
          this.loadProducts();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to update' });
        }
      });
    } else {
      this.ecomService.createProduct(this.productForm, filesToSend).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Product created' });
          this.showDialog = false;
          this.loadProducts();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to create' });
        }
      });
    }
  }

  deleteProduct(product: any): void {
    this.confirmationService.confirm({
      message: `Delete "${product.name}"? This cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.ecomService.deleteProduct(product.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'info', summary: 'Product deleted' });
            this.loadProducts();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to delete' });
          }
        });
      }
    });
  }

  getStockSeverity(product: any): string {
    if (product.quantity <= 0) return 'danger';
    if (product.quantity <= (product.lowStockThreshold || 5)) return 'warning';
    return 'success';
  }

  getStockLabel(product: any): string {
    if (product.quantity <= 0) return 'Out of Stock';
    if (product.quantity <= (product.lowStockThreshold || 5)) return 'Low Stock';
    return 'In Stock';
  }

  // ========== Product Image Handlers ==========

  onProductImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(f => this.addPendingImage(f));
      input.value = '';
    }
  }

  onProductImageDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      Array.from(event.dataTransfer.files).forEach(f => this.addPendingImage(f));
    }
  }

  removeExistingImage(index: number): void {
    if (this.productForm.images) {
      this.productForm.images.splice(index, 1);
      this.productForm.images.forEach((img: any, i: number) => {
        img.isPrimary = i === 0;
        img.displayOrder = i;
      });
    }
  }

  removePendingImage(index: number): void {
    this.pendingImageFiles.splice(index, 1);
    this.pendingImagePreviews.splice(index, 1);
  }

  private addPendingImage(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.messageService.add({ severity: 'warn', summary: 'Only image files are allowed' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.messageService.add({ severity: 'warn', summary: 'File size exceeds 10 MB limit' });
      return;
    }
    this.pendingImageFiles.push(file);
    const reader = new FileReader();
    reader.onload = () => {
      this.pendingImagePreviews.push(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
}
