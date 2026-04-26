import { Component, OnInit } from '@angular/core';
import { EcomService } from '../../core/service/ecom.service';
import { SubscriptionService } from '../../core/service/subscription.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-ecom-orders',
  templateUrl: './ecom-orders.component.html',
  styleUrls: ['./ecom-orders.component.scss'],
  providers: [MessageService]
})
export class EcomOrdersComponent implements OnInit {
  orders: any[] = [];
  loading = false;
  totalRecords = 0;
  rows = 20;
  searchQuery = '';
  statusFilter = '';

  // Detail dialog
  showDetailDialog = false;
  selectedOrder: any = null;
  loadingDetail = false;

  // Status update
  showStatusDialog = false;
  newStatus = '';

  // Dashboard
  dashboard: any = null;

  orderStatuses = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Shipped', value: 'SHIPPED' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ];

  statusOptions = [
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Shipped', value: 'SHIPPED' },
    { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ];

  constructor(
    private ecomService: EcomService,
    private subscriptionService: SubscriptionService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadOrders();
  }

  loadDashboard(): void {
    this.ecomService.getDashboard().subscribe({
      next: (data) => { this.dashboard = data; },
      error: () => {}
    });
  }

  loadOrders(): void {
    this.loading = true;
    this.ecomService.getOrders(0, this.rows, this.searchQuery, this.statusFilter).subscribe({
      next: (data) => {
        this.orders = data.content;
        this.totalRecords = data.totalElements;
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load orders' });
        this.loading = false;
      }
    });
  }

  onSearch(): void { this.loadOrders(); }

  onStatusFilter(): void { this.loadOrders(); }

  onPageChange(event: any): void {
    const page = event.page !== undefined ? event.page : Math.floor(event.first / event.rows);
    this.ecomService.getOrders(page, event.rows, this.searchQuery, this.statusFilter).subscribe({
      next: (data) => {
        this.orders = data.content;
        this.totalRecords = data.totalElements;
      }
    });
  }

  viewOrder(order: any): void {
    this.loadingDetail = true;
    this.showDetailDialog = true;
    this.ecomService.getOrderById(order.id).subscribe({
      next: (data) => {
        this.selectedOrder = data;
        this.loadingDetail = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Failed to load order details' });
        this.loadingDetail = false;
      }
    });
  }

  openStatusDialog(order: any): void {
    this.selectedOrder = order;
    this.newStatus = '';
    this.showStatusDialog = true;
  }

  updateStatus(): void {
    if (!this.newStatus || !this.selectedOrder) return;
    this.ecomService.updateOrderStatus(this.selectedOrder.id, this.newStatus).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Order status updated' });
        this.showStatusDialog = false;
        this.loadOrders();
        this.loadDashboard();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to update status' });
      }
    });
  }

  createShipment(order: any): void {
    this.ecomService.createShipment(order.id).subscribe({
      next: (data) => {
        this.messageService.add({ severity: 'success', summary: 'Shipment created', detail: 'Shiprocket order: ' + data.shiprocketOrderId });
        this.loadOrders();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to create shipment' });
      }
    });
  }

  getStatusSeverity(status: string): string {
    const map: any = {
      'PENDING': 'warning', 'CONFIRMED': 'info', 'PROCESSING': 'info',
      'SHIPPED': 'info', 'OUT_FOR_DELIVERY': 'info', 'DELIVERED': 'success',
      'CANCELLED': 'danger', 'RETURN_REQUESTED': 'warning',
      'RETURNED': 'warning', 'REFUNDED': 'danger'
    };
    return map[status] || 'info';
  }

  generateInvoice(order: any): void {
    this.subscriptionService.generateOrderInvoice(order.id).subscribe({
      next: (invoice) => {
        this.messageService.add({ severity: 'success', summary: 'Invoice generated', detail: 'Invoice #' + invoice.invoiceNumber });
        if (invoice.pdfUrl) {
          window.open(invoice.pdfUrl, '_blank');
        }
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to generate invoice' });
      }
    });
  }
}
