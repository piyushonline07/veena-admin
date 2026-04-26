import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private adminBase = `${environment.apiBaseUrl}/api/admin/subscriptions`;
  private invoiceBase = `${environment.apiBaseUrl}/api/admin`;

  constructor(private http: HttpClient) {}

  // ==================== Dashboard ====================

  getDashboard(): Observable<any> {
    return this.http.get<any>(`${this.adminBase}/dashboard`);
  }

  // ==================== Plan Management ====================

  getPlans(): Observable<any[]> {
    return this.http.get<any[]>(`${this.adminBase}/plans`);
  }

  createPlan(plan: any): Observable<any> {
    return this.http.post<any>(`${this.adminBase}/plans`, plan);
  }

  updatePlan(id: number, plan: any): Observable<any> {
    return this.http.put<any>(`${this.adminBase}/plans/${id}`, plan);
  }

  deletePlan(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminBase}/plans/${id}`);
  }

  // ==================== Subscribers ====================

  getSubscriptions(page: number = 0, size: number = 20, status?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<any>(this.adminBase, { params });
  }

  // ==================== Invoices ====================

  generateOrderInvoice(orderId: number): Observable<any> {
    return this.http.post<any>(`${this.invoiceBase}/ecom/orders/${orderId}/invoice/generate`, {});
  }

  downloadInvoicePdf(invoiceId: number): Observable<Blob> {
    return this.http.get(`${this.invoiceBase}/invoices/${invoiceId}/pdf`, {
      responseType: 'blob'
    });
  }
}
