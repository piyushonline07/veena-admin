import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminToolsService, DailyCostBreakdown, ServiceCost } from '../../core/service/admin-tools.service';
import { MessageService } from 'primeng/api';
import { interval, Subscription } from 'rxjs';

@Component({
    selector: 'app-billing',
    templateUrl: './billing.component.html',
    styleUrls: ['./billing.component.scss'],
    providers: [MessageService]
})
export class BillingComponent implements OnInit, OnDestroy {
    loading: boolean = true;
    dailyCostData: DailyCostBreakdown | null = null;
    serviceCosts: ServiceCost[] = [];

    // Chart data
    dailyChartData: any;
    cumulativeChartData: any;
    serviceChartData: any;

    chartOptions: any;
    pieChartOptions: any;

    // Auto-refresh
    autoRefresh: boolean = true;
    refreshInterval: number = 60000; // 1 minute
    private refreshSubscription: Subscription | null = null;
    lastUpdated: Date | null = null;

    constructor(
        private adminToolsService: AdminToolsService,
        private messageService: MessageService
    ) {
        this.initChartOptions();
    }

    ngOnInit(): void {
        this.loadBillingData();
        this.startAutoRefresh();
    }

    ngOnDestroy(): void {
        this.stopAutoRefresh();
    }

    initChartOptions(): void {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color') || '#495057';
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#6c757d';
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#dee2e6';

        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: textColor,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context: any) => `$${context.parsed.y.toFixed(2)}`
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary,
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: surfaceBorder,
                        display: false
                    }
                },
                y: {
                    ticks: {
                        color: textColorSecondary,
                        callback: (value: number) => `$${value}`
                    },
                    grid: {
                        color: surfaceBorder
                    },
                    beginAtZero: true
                }
            }
        };

        this.pieChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context: any) => `${context.label}: $${context.parsed.toFixed(2)}`
                    }
                }
            }
        };
    }

    loadBillingData(): void {
        this.loading = true;

        // Load daily cost breakdown
        this.adminToolsService.getDailyCostBreakdown().subscribe({
            next: (data) => {
                this.dailyCostData = data;
                this.buildDailyCharts(data);
                this.lastUpdated = new Date();
                this.loading = false;
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load daily cost data'
                });
                this.loading = false;
            }
        });

        // Load cost by service
        this.adminToolsService.getCostByService().subscribe({
            next: (data) => {
                this.serviceCosts = data;
                this.buildServiceChart(data);
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load service cost data'
                });
            }
        });
    }

    buildDailyCharts(data: DailyCostBreakdown): void {
        const labels = data.dailyCosts.map(dc => this.formatDate(dc.date));
        const dailyAmounts = data.dailyCosts.map(dc => dc.amount);
        const cumulativeAmounts = data.dailyCosts.map(dc => dc.cumulativeTotal);

        // Daily cost bar chart
        this.dailyChartData = {
            labels: labels,
            datasets: [
                {
                    label: 'Daily Cost ($)',
                    data: dailyAmounts,
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1
                }
            ]
        };

        // Cumulative cost line chart
        this.cumulativeChartData = {
            labels: labels,
            datasets: [
                {
                    label: 'Cumulative Cost ($)',
                    data: cumulativeAmounts,
                    fill: true,
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    borderColor: 'rgb(34, 197, 94)',
                    tension: 0.4
                }
            ]
        };
    }

    buildServiceChart(data: ServiceCost[]): void {
        const colors = [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
            '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
        ];

        this.serviceChartData = {
            labels: data.map(sc => this.shortenServiceName(sc.serviceName)),
            datasets: [
                {
                    data: data.map(sc => sc.amount),
                    backgroundColor: colors.slice(0, data.length),
                    hoverBackgroundColor: colors.slice(0, data.length)
                }
            ]
        };
    }

    formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    shortenServiceName(name: string): string {
        // Shorten AWS service names for better display
        return name
            .replace('Amazon ', '')
            .replace('AWS ', '')
            .replace(' Service', '')
            .replace('Elastic Compute Cloud', 'EC2')
            .replace('Simple Storage Service', 'S3')
            .replace('Relational Database Service', 'RDS');
    }

    startAutoRefresh(): void {
        if (this.autoRefresh) {
            this.refreshSubscription = interval(this.refreshInterval).subscribe(() => {
                this.loadBillingData();
            });
        }
    }

    stopAutoRefresh(): void {
        if (this.refreshSubscription) {
            this.refreshSubscription.unsubscribe();
            this.refreshSubscription = null;
        }
    }

    toggleAutoRefresh(): void {
        if (this.autoRefresh) {
            this.startAutoRefresh();
        } else {
            this.stopAutoRefresh();
        }
    }

    refreshNow(): void {
        this.loadBillingData();
        this.messageService.add({
            severity: 'info',
            summary: 'Refreshing',
            detail: 'Fetching latest billing data...'
        });
    }

    getTotalCost(): string {
        return this.dailyCostData?.totalAmount || '0.00';
    }

    getAverageDailyCost(): string {
        if (!this.dailyCostData || this.dailyCostData.dailyCosts.length === 0) {
            return '0.00';
        }
        const total = parseFloat(this.dailyCostData.totalAmount);
        const days = this.dailyCostData.dailyCosts.length;
        return (total / days).toFixed(2);
    }

    getProjectedMonthlyCost(): string {
        if (!this.dailyCostData || this.dailyCostData.dailyCosts.length === 0) {
            return '0.00';
        }
        const avgDaily = parseFloat(this.getAverageDailyCost());
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        return (avgDaily * daysInMonth).toFixed(2);
    }

    getTopService(): string {
        if (this.serviceCosts.length === 0) return 'N/A';
        return this.shortenServiceName(this.serviceCosts[0].serviceName);
    }
}
