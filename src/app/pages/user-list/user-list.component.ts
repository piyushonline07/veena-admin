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
    originalRole: string = '';

    // Role options for dropdown
    roleOptions = [
        { label: 'User', value: 'USER' },
        { label: 'Admin', value: 'ADMIN' }
    ];

    updatingRole: boolean = false;
    updatingAccess: boolean = false;

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
            error: () => {
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
        this.originalRole = user.role;
        this.userDialog = true;
    }

    hideDialog() {
        this.userDialog = false;
        this.selectedUser = {};
        this.originalRole = '';
    }

    hasRoleChanged(): boolean {
        return this.selectedUser.role !== this.originalRole;
    }

    saveUserRole() {
        if (!this.hasRoleChanged()) {
            this.hideDialog();
            return;
        }

        this.confirmationService.confirm({
            message: `Are you sure you want to change this user's role from ${this.originalRole} to ${this.selectedUser.role}?`,
            header: 'Confirm Role Change',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.updateRole(this.selectedUser.role);
            }
        });
    }

    updateRole(newRole: string) {
        this.updatingRole = true;
        this.userService.updateUserRole(this.selectedUser.id, newRole).subscribe({
            next: (updatedUser) => {
                this.selectedUser = updatedUser;
                this.originalRole = updatedUser.role;
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
                this.hideDialog();
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error?.message || 'Failed to update user role'
                });
                this.updatingRole = false;
                // Reset to original role on error
                this.selectedUser.role = this.originalRole;
            }
        });
    }

    toggleDirectAccess(user: any) {
        const newValue = !user.directAccess;
        const action = newValue ? 'grant' : 'revoke';

        this.confirmationService.confirm({
            message: `Are you sure you want to ${action} direct access for "${user.name || user.email}"? ${newValue ? 'This will give them full subscribed-level access without a subscription.' : 'They will need a subscription to access premium features.'}`,
            header: `${newValue ? 'Grant' : 'Revoke'} Direct Access`,
            icon: newValue ? 'pi pi-unlock' : 'pi pi-lock',
            acceptButtonStyleClass: newValue ? 'p-button-success' : 'p-button-danger',
            accept: () => {
                this.updatingAccess = true;
                this.userService.setDirectAccess(user.id, newValue).subscribe({
                    next: (updatedUser) => {
                        // Update in the list
                        const index = this.users.findIndex(u => u.id === updatedUser.id);
                        if (index !== -1) {
                            this.users[index] = updatedUser;
                        }
                        // Update dialog if open
                        if (this.selectedUser?.id === updatedUser.id) {
                            this.selectedUser = { ...this.selectedUser, directAccess: updatedUser.directAccess };
                        }
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: `Direct access ${action}ed for ${updatedUser.name || updatedUser.email}`
                        });
                        this.updatingAccess = false;
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: err.error?.message || `Failed to ${action} direct access`
                        });
                        this.updatingAccess = false;
                    }
                });
            }
        });
    }
}
