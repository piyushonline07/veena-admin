import { Component, OnInit } from '@angular/core';
import { UserService } from '../../core/service/user.service';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-user-list',
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.scss'],
    providers: [MessageService]
})
export class UserListComponent implements OnInit {
    users: any[] = [];
    totalRecords: number = 0;
    loading: boolean = true;
    rows: number = 10;
    searchQuery: string = '';

    userDialog: boolean = false;
    selectedUser: any = {};

    constructor(
        private userService: UserService,
        private messageService: MessageService
    ) { }

    ngOnInit(): void {
        this.loadUsers(0, this.rows);
    }

    loadUsers(page: number, size: number) {
        this.loading = true;
        this.userService.getUsers(page, size, this.searchQuery).subscribe({
            next: (data) => {
                this.users = data.content;
                this.totalRecords = data.totalElements;
                this.loading = false;
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load users' });
                this.loading = false;
            }
        });
    }

    onPageChange(event: any) {
        const page = event.page !== undefined ? event.page : (event.first / event.rows);
        this.loadUsers(page, event.rows);
    }

    onSearch() {
        this.loadUsers(0, this.rows);
    }

    showDetails(user: any) {
        this.selectedUser = { ...user };
        this.userDialog = true;
    }

    hideDialog() {
        this.userDialog = false;
    }
}
