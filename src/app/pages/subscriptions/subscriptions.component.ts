import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { SubscriptionService } from '../../core/service/subscription.service';

@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.scss'],
  providers: [MessageService]
})
export class SubscriptionsComponent implements OnInit {
  dashboard: any = null;
  subscriptions: any[] = [];
  loading = false;
  totalRecords = 0;
  rows = 20;
  statusFilter = '';

  plans: any[] = [];
  showPlanDialog = false;
  editingPlan: any = null;
  planForm: any = {
    name: '',
    planType: 'MONTHLY',
    durationMonths: 1,
    price: 0,
    currency: 'INR',
    description: '',
    isActive: true
  };

  planTypes = [
    { label: 'Monthly', value: 'MONTHLY' },
    { label: 'Quarterly', value: 'QUARTERLY' },
    { label: 'Yearly', value: 'YEARLY' }
  ];

  subscriptionStatuses = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Expired', value: 'EXPIRED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ];

  chartData: any;
  chartOptions: any;

  constructor(
    private subscriptionService: SubscriptionService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadSubscriptions();
  }

  loadDashboard(): void {
    this.subscriptionService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.plans = data.plans || [];
        this.buildChart();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Failed to load dashboard' });
      }
    });
  }

  loadSubscriptions(): void {
    this.loading = true;
    this.subscriptionService.getSubscriptions(0, this.rows, this.statusFilter).subscribe({
      next: (data) => {
        this.subscriptions = data.content;
        this.totalRecords = data.totalElements;
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Failed to load subscriptions' });
        this.loading = false;
      }
    });
  }

  onStatusFilter(): void {
    this.loadSubscriptions();
  }

  onPageChange(event: any): void {
    const page = event.page !== undefined ? event.page : Math.floor(event.first / event.rows);
    this.subscriptionService.getSubscriptions(page, event.rows, this.statusFilter).subscribe({
      next: (data) => {
        this.subscriptions = data.content;
        this.totalRecords = data.totalElements;
      }
    });
  }

  // ==================== Plan Management ====================

  openNewPlanDialog(): void {
    this.editingPlan = null;
    this.planForm = {
      name: '',
      planType: 'MONTHLY',
      durationMonths: 1,
      price: 0,
      currency: 'INR',
      description: '',
      isActive: true
    };
    this.showPlanDialog = true;
  }

  editPlan(plan: any): void {
    this.editingPlan = plan;
    this.planForm = { ...plan };
    this.showPlanDialog = true;
  }

  savePlan(): void {
    if (this.editingPlan) {
      this.subscriptionService.updatePlan(this.editingPlan.id, this.planForm).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Plan updated' });
          this.showPlanDialog = false;
          this.loadDashboard();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Failed to update plan' });
        }
      });
    } else {
      this.subscriptionService.createPlan(this.planForm).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Plan created' });
          this.showPlanDialog = false;
          this.loadDashboard();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Failed to create plan' });
        }
      });
    }
  }

  deletePlan(plan: any): void {
    if (confirm(`Delete plan "${plan.name}"?`)) {
      this.subscriptionService.deletePlan(plan.id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Plan deleted' });
          this.loadDashboard();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Failed to delete plan' });
        }
      });
    }
  }

  // ==================== Chart ====================

  buildChart(): void {
    if (!this.dashboard) return;
    this.chartData = {
      labels: ['Active', 'Expired', 'Cancelled', 'Pending'],
      datasets: [
        {
          data: [
            this.dashboard.activeSubscriptions,
            this.dashboard.expiredSubscriptions,
            this.dashboard.cancelledSubscriptions,
            this.dashboard.pendingSubscriptions
          ],
          backgroundColor: ['#22c55e', '#6366f1', '#ef4444', '#f59e0b'],
          hoverBackgroundColor: ['#16a34a', '#4f46e5', '#dc2626', '#d97706']
        }
      ]
    };
    this.chartOptions = {
      plugins: {
        legend: { position: 'bottom' }
      },
      responsive: true,
      maintainAspectRatio: false
    };
  }

  getStatusSeverity(status: string): string {
    const map: any = {
      'ACTIVE': 'success',
      'PENDING': 'warning',
      'EXPIRED': 'info',
      'CANCELLED': 'danger'
    };
    return map[status] || 'info';
  }

  formatCurrency(amount: number): string {
    if (amount == null) return '₹0';
    return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }
}
