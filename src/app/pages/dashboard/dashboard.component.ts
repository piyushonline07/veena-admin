import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from '../../core/service/analytics.service';


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
  trendingMedia: any[] = [];

  constructor(private analyticsService: AnalyticsService) { }

  ngOnInit() {
    this.loadStats();
    this.loadChartData();
  }

  loadStats() {
    this.analyticsService.getDashboardStats().subscribe({
      next: (data: any) => {
        this.totalDAU = data.currentDAU;
        this.totalMAU = data.currentMAU;
        this.dauGrowth = data.dauGrowth;
        this.mauGrowth = data.mauGrowth;
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

    // Load Trending Media
    this.analyticsService.getTrendingMedia().subscribe({
      next: (data: any[]) => {
        this.trendingMedia = data;
      },
      error: (err: any) => {
        console.error('Failed to load trending media', err);
      }
    });
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
