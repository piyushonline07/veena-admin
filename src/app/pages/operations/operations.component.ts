import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminToolsService, TranscodingJob, SystemHealth, DetailedStats, AwsHealthStatus, DailyApiMetrics, EndpointMetrics, ApiSummary } from '../../core/service/admin-tools.service';
import { MessageService } from 'primeng/api';
import { interval, Subscription } from 'rxjs';

@Component({
    selector: 'app-operations',
    templateUrl: './operations.component.html',
    styleUrls: ['./operations.component.scss'],
    providers: [MessageService]
})
export class OperationsComponent implements OnInit, OnDestroy {
    distributionOptions: any[] = [];
    selectedDist: string = '';
    pathsText: string = '/*';
    invalidating: boolean = false;

    jobs: TranscodingJob[] = [];
    loadingJobs: boolean = false;
    private refreshSub?: Subscription;

    // System health data
    systemHealth: SystemHealth | null = null;
    detailedStats: DetailedStats | null = null;
    awsHealth: AwsHealthStatus | null = null;
    loadingHealth: boolean = false;
    loadingAws: boolean = false;
    systemStatus: string = 'Loading...';

    // CloudFront info
    cloudfrontInfo: any = {};

    // API Metrics data
    dailyApiMetrics: DailyApiMetrics[] = [];
    topEndpoints: EndpointMetrics[] = [];
    todaySummary: ApiSummary | null = null;
    loadingApiMetrics: boolean = false;
    apiMetricsChartData: any;
    apiMetricsChartOptions: any;

    constructor(
        private adminToolsService: AdminToolsService,
        private messageService: MessageService
    ) { }

    ngOnInit(): void {
        this.loadDistributions();
        this.loadJobs();
        this.initApiMetricsChart();
        this.loadSystemHealth();
        this.loadAwsHealth();
        this.loadApiMetrics();

        // Auto-refresh every 30 seconds
        this.refreshSub = interval(30000).subscribe(() => {
            this.loadJobs();
            this.loadSystemHealth();
            this.loadAwsHealth();
            this.loadApiMetrics();
        });
    }

    ngOnDestroy(): void {
        this.refreshSub?.unsubscribe();
    }

    loadDistributions() {
        this.adminToolsService.getDistributions().subscribe(data => {
            // Filter out non-distribution values (like domainName, url)
            const distOptions = Object.entries(data)
                .filter(([key, value]) => {
                    const isValue = !!value && key !== 'domainName' && key !== 'url';
                    if (key === 'domainName' || key === 'url') {
                        this.cloudfrontInfo[key] = value;
                    }
                    return isValue;
                })
                .map(([key, value]) => ({ label: key, value: value }));

            this.distributionOptions = distOptions;

            // Auto-select the first (usually only) distribution
            if (distOptions.length > 0 && !this.selectedDist) {
                this.selectedDist = distOptions[0].value;
            }
        });
    }

    loadJobs() {
        this.loadingJobs = true;
        this.adminToolsService.getTranscodingJobs().subscribe({
            next: (data) => {
                this.jobs = data;
                this.loadingJobs = false;
            },
            error: () => {
                this.loadingJobs = false;
            }
        });
    }

    loadSystemHealth() {
        this.loadingHealth = true;
        this.adminToolsService.getSystemHealth().subscribe({
            next: (data) => {
                this.systemHealth = data;
                this.updateSystemStatus();
                this.loadingHealth = false;
            },
            error: () => {
                this.systemStatus = 'Error';
                this.loadingHealth = false;
            }
        });

        this.adminToolsService.getDetailedStats().subscribe({
            next: (data) => {
                this.detailedStats = data;
            },
            error: () => {
                // Silently fail for detailed stats
            }
        });
    }

    loadAwsHealth() {
        this.loadingAws = true;
        this.adminToolsService.getAwsHealth().subscribe({
            next: (data) => {
                this.awsHealth = data;
                this.loadingAws = false;
            },
            error: () => {
                this.loadingAws = false;
            }
        });
    }

    updateSystemStatus() {
        if (!this.systemHealth) {
            this.systemStatus = 'Unknown';
            return;
        }

        if (this.systemHealth.databaseStatus === 'Healthy' &&
            this.systemHealth.serverStatus === 'Healthy' &&
            this.systemHealth.apiResponseRate === 100) {
            this.systemStatus = 'Optimal';
        } else if (this.systemHealth.databaseStatus === 'Unhealthy') {
            this.systemStatus = 'Critical';
        } else {
            this.systemStatus = 'Degraded';
        }
    }

    getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
        switch (status) {
            case 'COMPLETE': return 'success';
            case 'PROGRESSING': return 'info';
            case 'SUBMITTED': return 'warn';
            case 'ERROR': return 'danger';
            default: return 'info';
        }
    }

    getHealthSeverity(): "success" | "info" | "warn" | "danger" {
        switch (this.systemStatus) {
            case 'Optimal': return 'success';
            case 'Degraded': return 'warn';
            case 'Critical': return 'danger';
            default: return 'info';
        }
    }

    getHealthIcon(status: string): string {
        const lowerStatus = status?.toLowerCase() || '';
        if (lowerStatus === 'healthy' || lowerStatus === 'available' || lowerStatus === 'active') {
            return 'pi-check-circle text-green-500';
        } else if (lowerStatus.includes('degraded') || lowerStatus.includes('pending')) {
            return 'pi-exclamation-triangle text-yellow-500';
        } else if (lowerStatus.includes('error') || lowerStatus.includes('unhealthy') || lowerStatus.includes('stopped')) {
            return 'pi-times-circle text-red-500';
        }
        return 'pi-question-circle text-gray-500';
    }

    getRdsStatusSeverity(): "success" | "info" | "warn" | "danger" {
        if (!this.awsHealth?.rds?.status) return 'info';
        const status = this.awsHealth.rds.status.toLowerCase();
        if (status === 'available') return 'success';
        if (status.includes('error') || status.includes('failed')) return 'danger';
        return 'warn';
    }

    getEcsStatusSeverity(): "success" | "info" | "warn" | "danger" {
        if (!this.awsHealth?.ecs?.status) return 'info';
        const status = this.awsHealth.ecs.status.toLowerCase();
        if (status === 'active') return 'success';
        if (status.includes('error') || status.includes('failed')) return 'danger';
        return 'warn';
    }

    onInvalidate() {
        if (!this.selectedDist) {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please select a distribution' });
            return;
        }

        const paths = this.pathsText.split('\n').filter(p => p.trim() !== '');
        if (paths.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please enter at least one path' });
            return;
        }

        this.invalidating = true;
        this.adminToolsService.invalidate(this.selectedDist, paths).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Invalidation request submitted' });
                this.invalidating = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to submit request' });
                this.invalidating = false;
            }
        });
    }

    // ==================== API METRICS ====================

    initApiMetricsChart() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color') || '#495057';
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#6c757d';
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#dee2e6';

        this.apiMetricsChartOptions = {
            maintainAspectRatio: false,
            aspectRatio: 0.6,
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                },
                y: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    },
                    beginAtZero: true
                }
            }
        };
    }

    loadApiMetrics() {
        this.loadingApiMetrics = true;

        // Load daily metrics for chart
        this.adminToolsService.getDailyApiMetrics(14).subscribe({
            next: (data) => {
                this.dailyApiMetrics = data;
                this.updateApiMetricsChart();
                this.loadingApiMetrics = false;
            },
            error: () => {
                this.loadingApiMetrics = false;
            }
        });

        // Load top endpoints
        this.adminToolsService.getTopEndpoints(7, 10).subscribe({
            next: (data) => {
                this.topEndpoints = data;
            },
            error: () => { }
        });

        // Load today's summary
        this.adminToolsService.getTodayApiSummary().subscribe({
            next: (data) => {
                this.todaySummary = data;
            },
            error: () => { }
        });
    }

    updateApiMetricsChart() {
        const documentStyle = getComputedStyle(document.documentElement);

        this.apiMetricsChartData = {
            labels: this.dailyApiMetrics.map(m => {
                const date = new Date(m.date);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [
                {
                    label: 'Total Requests',
                    data: this.dailyApiMetrics.map(m => m.totalRequests),
                    fill: true,
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: documentStyle.getPropertyValue('--blue-500') || '#3b82f6',
                    tension: 0.4
                },
                {
                    label: 'Successful',
                    data: this.dailyApiMetrics.map(m => m.successCount),
                    fill: false,
                    borderColor: documentStyle.getPropertyValue('--green-500') || '#22c55e',
                    tension: 0.4
                },
                {
                    label: 'Errors',
                    data: this.dailyApiMetrics.map(m => m.errorCount),
                    fill: false,
                    borderColor: documentStyle.getPropertyValue('--red-500') || '#ef4444',
                    tension: 0.4
                }
            ]
        };
    }

    getMethodClass(method: string): string {
        switch (method) {
            case 'GET': return 'bg-blue-100 text-blue-700';
            case 'POST': return 'bg-green-100 text-green-700';
            case 'PUT': return 'bg-yellow-100 text-yellow-700';
            case 'DELETE': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }
}
