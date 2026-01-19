import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  loading = true;
  dauChart: any;
  uploadChart: any;
  statusChart: any;
  dau = 0;
  totalMedia = 0;
  processingMedia = 0;
  failedMedia = 0;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadCharts();
    this.api.getAdminDashboard().subscribe({
      next: data => {
        this.dau = data.dailyActiveUsers;
        this.totalMedia = data.totalMedia;
        this.processingMedia = data.processingMedia;
        this.failedMedia = data.failedMedia;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadCharts() {

    this.api.getDauChart(7).subscribe(data => {
      this.dauChart = {
        labels: data.map(d => d.date),
        datasets: [{
          label: 'Daily Active Users',
          data: data.map(d => d.count),
          fill: false,
          tension: 0.4
        }]
      };
    });

    this.api.getUploadChart(7).subscribe(data => {
      this.uploadChart = {
        labels: data.map(d => d.date),
        datasets: [{
          label: 'Uploads',
          data: data.map(d => d.count),
          fill: false,
          tension: 0.4
        }]
      };
    });

    this.api.getStatusChart().subscribe(data => {
      this.statusChart = {
        labels: Object.keys(data),
        datasets: [{
          data: Object.values(data)
        }]
      };
    });
  }
}
