import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminToolsService, TranscodingJob, SystemHealth, DetailedStats, AwsHealthStatus } from '../../core/service/admin-tools.service';
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

    constructor(
        private adminToolsService: AdminToolsService,
        private messageService: MessageService
    ) { }

    ngOnInit(): void {
        this.loadDistributions();
        this.loadJobs();
        this.loadSystemHealth();
        this.loadAwsHealth();

        // Auto-refresh every 30 seconds
        this.refreshSub = interval(30000).subscribe(() => {
            this.loadJobs();
            this.loadSystemHealth();
            this.loadAwsHealth();
        });
    }

    ngOnDestroy(): void {
        this.refreshSub?.unsubscribe();
    }

    loadDistributions() {
        this.adminToolsService.getDistributions().subscribe(data => {
            this.distributionOptions = Object.entries(data)
                .filter(([_, value]) => !!value)
                .map(([key, value]) => ({ label: key, value: value }));
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
            error: (err) => {
                console.error('Error loading AWS health:', err);
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
            next: (res) => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Invalidation request submitted' });
                this.invalidating = false;
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to submit request' });
                this.invalidating = false;
            }
        });
    }
}
