import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface TranscodingJob {
    id: string;
    status: string;
    createdAt: string;
    mediaId: string;
    percentComplete: number;
}

export interface SystemHealth {
    databaseStatus: string;
    serverStatus: string;
    totalMedia: number;
    totalUsers: number;
    totalArtists: number;
    apiResponseRate: number;
    timestamp: string;
}

export interface DetailedStats {
    database: {
        status: string;
        totalMedia: number;
        totalUsers: number;
        totalArtists: number;
    };
    memory: {
        total: string;
        used: string;
        free: string;
        max: string;
        usagePercent: number;
    };
    jvm: {
        availableProcessors: number;
        javaVersion: string;
        javaVendor: string;
    };
    timestamp: string;
}

// AWS Interfaces
export interface ServiceInfo {
    name: string;
    status: string;
    desiredCount: number;
    runningCount: number;
    pendingCount: number;
}

export interface EcsStatus {
    clusterName: string;
    status: string;
    runningServices: number;
    runningTasks: number;
    pendingTasks: number;
    services: ServiceInfo[];
}

export interface RdsStatus {
    instanceId: string;
    status: string;
    engine: string;
    engineVersion: string;
    instanceClass: string;
    availabilityZone: string;
    multiAz: boolean;
    storageType: string;
    allocatedStorage: number;
    cpuUtilization: number;
    databaseConnections: number;
}

export interface CloudFrontMetrics {
    totalRequests: number;
    errorRate4xx: number;
    errorRate5xx: number;
    cacheHitRate: number;
}

export interface AwsHealthStatus {
    ecs: EcsStatus;
    rds: RdsStatus;
    s3Latency: number;
    cloudFrontMetrics: CloudFrontMetrics;
    timestamp: string;
}

export interface AwsCost {
    amount: string;
    unit: string;
}

export interface DailyCost {
    date: string;
    amount: number;
    cumulativeTotal: number;
}

export interface DailyCostBreakdown {
    dailyCosts: DailyCost[];
    totalAmount: string;
    unit: string;
}

export interface ServiceCost {
    serviceName: string;
    amount: number;
}

// Pipeline Status Interfaces
export interface PipelineStatus {
    pipelineName: string;
    status: string;
    message?: string;
    updatedAt: string;
    stages: StageStatus[];
}

export interface StageStatus {
    stageName: string;
    status: string;
    actions: ActionStatus[];
}

export interface ActionStatus {
    actionName: string;
    status: string;
    lastStatusChange: string;
    errorMessage?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AdminToolsService {
    private apiUrl = `${environment.apiBaseUrl}/api/admin/tools`;
    private healthUrl = `${environment.apiBaseUrl}/api/admin/health`;
    private pipelinesUrl = `${environment.apiBaseUrl}/api/admin/pipelines`;

    constructor(private http: HttpClient) { }

    getDistributions(): Observable<{ [key: string]: string }> {
        return this.http.get<{ [key: string]: string }>(`${this.apiUrl}/distributions`);
    }

    invalidate(distributionId: string, paths: string[]): Observable<any> {
        return this.http.post(`${this.apiUrl}/invalidate`, { distributionId, paths });
    }

    getTranscodingJobs(): Observable<TranscodingJob[]> {
        return this.http.get<TranscodingJob[]>(`${this.apiUrl}/transcoding-jobs`);
    }

    getMonthlyCost(): Observable<AwsCost> {
        return this.http.get<AwsCost>(`${this.apiUrl}/cost`);
    }

    getDailyCostBreakdown(): Observable<DailyCostBreakdown> {
        return this.http.get<DailyCostBreakdown>(`${this.apiUrl}/cost/daily`);
    }

    getCostByService(): Observable<ServiceCost[]> {
        return this.http.get<ServiceCost[]>(`${this.apiUrl}/cost/by-service`);
    }

    getSystemHealth(): Observable<SystemHealth> {
        return this.http.get<SystemHealth>(this.healthUrl);
    }

    getDetailedStats(): Observable<DetailedStats> {
        return this.http.get<DetailedStats>(`${this.healthUrl}/stats`);
    }

    getAwsHealth(): Observable<AwsHealthStatus> {
        return this.http.get<AwsHealthStatus>(`${this.healthUrl}/aws`);
    }

    getEcsHealth(): Observable<EcsStatus> {
        return this.http.get<EcsStatus>(`${this.healthUrl}/aws/ecs`);
    }

    getRdsHealth(): Observable<RdsStatus> {
        return this.http.get<RdsStatus>(`${this.healthUrl}/aws/rds`);
    }

    // Pipeline Status Methods
    getAllPipelineStatuses(): Observable<PipelineStatus[]> {
        return this.http.get<PipelineStatus[]>(this.pipelinesUrl);
    }

    getPipelineStatus(pipelineName: string): Observable<PipelineStatus> {
        return this.http.get<PipelineStatus>(`${this.pipelinesUrl}/${pipelineName}`);
    }
}
