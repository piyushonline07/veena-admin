import { Component, OnInit } from '@angular/core';
import { UserService } from '../../core/service/user.service';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
    selector: 'app-user-list',
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class UserListComponent implements OnInit {
    users: any[] = [];
    totalRecords: number = 0;
    loading: boolean = true;
    rows: number = 10;
    searchQuery: string = '';

    userDialog: boolean = false;
    selectedUser: any = {};

    // Role options for dropdown
    roleOptions = [
        { label: 'User', value: 'USER' },
        { label: 'Admin', value: 'ADMIN' }
    ];

    updatingRole: boolean = false;

    constructor(
        private userService: UserService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
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

    confirmRoleChange(newRole: string) {
        if (newRole === this.selectedUser.role) {
            return;
        }

        this.confirmationService.confirm({
            message: `Are you sure you want to change this user's role to ${newRole}?`,
            header: 'Confirm Role Change',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.updateRole(newRole);
            },
            reject: () => {
                // Reset the dropdown to original value
                this.selectedUser = { ...this.selectedUser };
            }
        });
    }

    updateRole(newRole: string) {
        this.updatingRole = true;
        this.userService.updateUserRole(this.selectedUser.id, newRole).subscribe({
            next: (updatedUser) => {
                this.selectedUser = updatedUser;
                // Update the user in the list
                const index = this.users.findIndex(u => u.id === updatedUser.id);
                if (index !== -1) {
                    this.users[index] = updatedUser;
                }
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `User role updated to ${newRole}`
                });
                this.updatingRole = false;
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error?.message || 'Failed to update user role'
                });
                this.updatingRole = false;
                // Reload to get correct state
                this.loadUsers(0, this.rows);
            }
        });
    }
}
