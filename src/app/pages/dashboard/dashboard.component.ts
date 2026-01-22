import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import {AuthService} from "../../core/service/auth.service";


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  items: MenuItem[] = [];

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

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.items = [
      { label: 'Home', icon: 'pi pi-fw pi-home' },
      { label: 'Users', icon: 'pi pi-fw pi-users' },
      { label: 'Settings', icon: 'pi pi-fw pi-cog' }
    ];

    this.initializeCharts();
    this.calculateStats();
  }

  initializeCharts() {
    // Last 14 days labels
    const dauLabels = this.getLast14Days();
    const dauData = [1250, 1380, 1420, 1310, 1520, 1680, 1750, 1820, 1790, 1950, 2100, 2250, 2180, 2350];

    // Last 12 months labels
    const mauLabels = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
    const mauData = [15200, 18500, 22300, 25800, 28400, 32100, 35600, 38200, 42500, 45800, 48200, 52400];

    // DAU Chart Configuration
    this.dauChartData = {
      labels: dauLabels,
      datasets: [
        {
          label: 'Daily Active Users',
          data: dauData,
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
        legend: {
          display: false
        },
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
          grid: {
            display: false
          },
          ticks: {
            color: '#9ca3af'
          }
        },
        y: {
          grid: {
            color: 'rgba(156, 163, 175, 0.1)'
          },
          ticks: {
            color: '#9ca3af',
            callback: (value: number) => value >= 1000 ? (value / 1000) + 'k' : value
          }
        }
      }
    };

    // MAU Chart Configuration
    this.mauChartData = {
      labels: mauLabels,
      datasets: [
        {
          label: 'Monthly Active Users',
          data: mauData,
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
        legend: {
          display: false
        },
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
          grid: {
            display: false
          },
          ticks: {
            color: '#9ca3af'
          }
        },
        y: {
          grid: {
            color: 'rgba(156, 163, 175, 0.1)'
          },
          ticks: {
            color: '#9ca3af',
            callback: (value: number) => value >= 1000 ? (value / 1000) + 'k' : value
          }
        }
      }
    };
  }

  calculateStats() {
    // Get current and previous values for comparison
    const currentDAU = 2350;
    const previousDAU = 2180;
    const currentMAU = 52400;
    const previousMAU = 48200;

    this.totalDAU = currentDAU;
    this.totalMAU = currentMAU;
    this.dauGrowth = Math.round(((currentDAU - previousDAU) / previousDAU) * 100);
    this.mauGrowth = Math.round(((currentMAU - previousMAU) / previousMAU) * 100);
  }

  getLast14Days(): string[] {
    const days = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return days;
  }

  onLogout() {
    this.authService.logout();
  }
}
