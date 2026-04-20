import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EcomService {
  private baseUrl = `${environment.apiBaseUrl}/api/admin/ecom`;

  constructor(private http: HttpClient) {}

  // ==================== Categories ====================

  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/categories`);
  }

  getCategoryById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/categories/${id}`);
  }

  createCategory(category: any, imageFile?: File): Observable<any> {
    const formData = this.buildCategoryFormData(category, imageFile);
    return this.http.post<any>(`${this.baseUrl}/categories`, formData);
  }

  updateCategory(id: number, category: any, imageFile?: File): Observable<any> {
    const formData = this.buildCategoryFormData(category, imageFile);
    return this.http.put<any>(`${this.baseUrl}/categories/${id}`, formData);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/categories/${id}`);
  }

  private buildCategoryFormData(category: any, imageFile?: File): FormData {
    const formData = new FormData();
    // Send the category JSON as a Blob with application/json content type
    const dataBlob = new Blob([JSON.stringify(category)], { type: 'application/json' });
    formData.append('data', dataBlob);
    if (imageFile) {
      formData.append('image', imageFile, imageFile.name);
    }
    return formData;
  }

  // ==================== Products ====================

  getProducts(page: number = 0, size: number = 20, query?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (query) {
      params = params.set('query', query);
    }
    return this.http.get<any>(`${this.baseUrl}/products`, { params });
  }

  getProductById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/products/${id}`);
  }

  createProduct(product: any, imageFiles?: File[]): Observable<any> {
    const formData = this.buildProductFormData(product, imageFiles);
    return this.http.post<any>(`${this.baseUrl}/products`, formData);
  }

  updateProduct(id: number, product: any, imageFiles?: File[]): Observable<any> {
    const formData = this.buildProductFormData(product, imageFiles);
    return this.http.put<any>(`${this.baseUrl}/products/${id}`, formData);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/${id}`);
  }

  getLowStockProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/products/low-stock`);
  }

  private buildProductFormData(product: any, imageFiles?: File[]): FormData {
    const formData = new FormData();
    const dataBlob = new Blob([JSON.stringify(product)], { type: 'application/json' });
    formData.append('data', dataBlob);
    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach(file => {
        formData.append('images', file, file.name);
      });
    }
    return formData;
  }

  // ==================== Orders ====================

  getOrders(page: number = 0, size: number = 20, query?: string, status?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (query) {
      params = params.set('query', query);
    }
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<any>(`${this.baseUrl}/orders`, { params });
  }

  getOrderById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/orders/${id}`);
  }

  updateOrderStatus(id: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/orders/${id}/status`, { status });
  }

  createShipment(orderId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/orders/${orderId}/shipment`, {});
  }

  trackShipment(orderId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/orders/${orderId}/tracking`);
  }

  getDashboard(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/orders/dashboard`);
  }
}
