import { Component, OnInit } from '@angular/core';
import { AnalyticsService, TrendingMediaItem, AllTrendingResponse } from '../../core/service/analytics.service';
import { AdminToolsService, PipelineStatus } from '../../core/service/admin-tools.service';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // DAU Chart Data
  dauChartData: any;
  dauChartOptions: any;

  // MAU Chart Data
  mauChartData: any;
  mauChartOptions: any;

  // Summary Stats
  totalDAU: number = 0;
  totalMAU: number = 0;
  dauGrowth: number = 0;
  mauGrowth: number = 0;
  retentionRate: number = 0;
  avgSessionMinutes: number = 0;
  serverCost: string = '0.00';
  costUnit: string = 'USD';
  currentMonth: string = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  // Trending Media - Multi-period support
  trendingPeriods = [
    { key: '1_DAY', label: 'Today', icon: 'pi pi-clock' },
    { key: '7_DAYS', label: 'This Week', icon: 'pi pi-calendar' },
    { key: '30_DAYS', label: 'This Month', icon: 'pi pi-calendar-plus' },
    { key: '1_YEAR', label: 'This Year', icon: 'pi pi-history' }
  ];
  selectedTrendingPeriod: string = '7_DAYS';
  allTrendingMedia: AllTrendingResponse | null = null;
  trendingMedia: TrendingMediaItem[] = [];
  trendingLoading: boolean = false;

  // Pipeline Status
  pipelines: PipelineStatus[] = [];
  pipelinesLoading: boolean = false;

  constructor(
    private analyticsService: AnalyticsService,
    private adminToolsService: AdminToolsService
  ) { }

  ngOnInit() {
    this.loadStats();
    this.loadChartData();
    this.loadServerCost();
    this.loadPipelineStatuses();
    this.loadAllTrendingMedia();
  }

  loadServerCost() {
    this.adminToolsService.getMonthlyCost().subscribe({
      next: (data) => {
        this.serverCost = parseFloat(data.amount).toFixed(2);
        this.costUnit = data.unit;
      },
      error: (err) => {
        console.error('Failed to load server cost', err);
        this.serverCost = 'N/A';
      }
    });
  }

  loadPipelineStatuses() {
    this.pipelinesLoading = true;
    this.adminToolsService.getAllPipelineStatuses().subscribe({
      next: (data) => {
        this.pipelines = data;
        this.pipelinesLoading = false;
      },
      error: (err) => {
        console.error('Failed to load pipeline statuses', err);
        this.pipelinesLoading = false;
      }
    });
  }

  getPipelineStatusSeverity(status: string): string {
    switch (status?.toLowerCase()) {
      case 'succeeded': return 'success';
      case 'inprogress': return 'warning';
      case 'failed': return 'danger';
      default: return 'info';
    }
  }

  getPipelineIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'succeeded': return 'pi pi-check-circle';
      case 'inprogress': return 'pi pi-spin pi-spinner';
      case 'failed': return 'pi pi-times-circle';
      default: return 'pi pi-circle';
    }
  }

  loadStats() {
    this.analyticsService.getDashboardStats().subscribe({
      next: (data: any) => {
        this.totalDAU = data.currentDAU;
        this.totalMAU = data.currentMAU;
        this.dauGrowth = data.dauGrowth;
        this.mauGrowth = data.mauGrowth;
        this.retentionRate = data.retentionRate;
        this.avgSessionMinutes = data.avgSessionMinutes;
      },
      error: (err: any) => {
        console.error('Failed to load dashboard stats', err);
      }
    });
  }

  loadChartData() {
    // Load DAU Chart Data
    this.analyticsService.getDAUChartData().subscribe({
      next: (data: any[]) => {
        const labels = data.map(item => {
          const date = new Date(item.label);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        const values = data.map(item => item.count);
        this.initializeDAUChart(labels, values);
      }
    });

    // Load MAU Chart Data
    this.analyticsService.getMAUChartData().subscribe({
      next: (data: any[]) => {
        const labels = data.map(item => item.label);
        const values = data.map(item => item.count);
        this.initializeMAUChart(labels, values);
      }
    });
  }

  loadAllTrendingMedia() {
    this.trendingLoading = true;
    this.analyticsService.getAllTrendingMedia().subscribe({
      next: (data: AllTrendingResponse) => {
        this.allTrendingMedia = data;
        this.updateTrendingDisplay();
        this.trendingLoading = false;
      },
      error: (err: any) => {
        console.error('Failed to load trending media', err);
        this.trendingLoading = false;
      }
    });
  }

  onTrendingPeriodChange(period: string) {
    this.selectedTrendingPeriod = period;
    this.updateTrendingDisplay();
  }

  updateTrendingDisplay() {
    if (this.allTrendingMedia) {
      this.trendingMedia = this.allTrendingMedia[this.selectedTrendingPeriod as keyof AllTrendingResponse] || [];
    }
  }

  getPeriodLabel(period: string): string {
    const found = this.trendingPeriods.find(p => p.key === period);
    return found ? found.label : period;
  }

  initializeDAUChart(labels: string[], data: number[]) {
    this.dauChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Daily Active Users',
          data: data,
          fill: true,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        }
      ]
    };

    this.dauChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#6366f1',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: (context: any) => `${context.parsed.y.toLocaleString()} users`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#9ca3af' }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(156, 163, 175, 0.1)' },
          ticks: {
            color: '#9ca3af',
            callback: (value: number) => value >= 1000 ? (value / 1000) + 'k' : value
          }
        }
      }
    };
  }

  initializeMAUChart(labels: string[], data: number[]) {
    this.mauChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Monthly Active Users',
          data: data,
          fill: true,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        }
      ]
    };

    this.mauChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#10b981',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: (context: any) => `${context.parsed.y.toLocaleString()} users`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#9ca3af' }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(156, 163, 175, 0.1)' },
          ticks: {
            color: '#9ca3af',
            callback: (value: number) => value >= 1000 ? (value / 1000) + 'k' : value
          }
        }
      }
    };
  }
}
