import { useState } from 'react';
import { useUsers, useDeleteUser } from '../hooks/useUsers';
import { Plus, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../types/auth';
import UserTable from '../components/users/UserTable';
import UserFormModal from '../components/users/UserFormModal';
import { Card, CardContent } from '../components/ui/card';

import PageHeader from '../components/layout/PageHeader';

export default function UsersPage() {
    const { user } = useAuth();
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const { data: usersData, isLoading: isUsersLoading, error } = useUsers(roleFilter || undefined, user?.id, user?.role);
    const deleteUser = useDeleteUser();


    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            deleteUser.mutate(id);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    if (error) {
        return (
            <Card className="border-rose-500/20 bg-rose-500/10">
                <CardContent className="pt-6">
                    <p className="text-sm font-medium text-rose-400">Erreur de chargement des utilisateurs.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Utilisateurs"
                subtitle="Gestion des comptes et des rôles."
                actions={
                    <Button onClick={() => { setEditingUser(null); setIsModalOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nouveau
                    </Button>
                }
            />

            <Card className="border-theme-border bg-theme-surface">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3 rounded-xl border border-theme-border bg-theme-surface px-4 py-3">
                        <Search className="h-4 w-4 text-theme-text-secondary" />
                        <select
                            className="w-full border-none bg-transparent px-0 py-0 text-sm font-medium text-theme-text-primary focus:ring-0 focus-visible:ring-0"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="" className="bg-theme-surface text-theme-text-primary">Tous les rôles</option>
                            <option value="student" className="bg-theme-surface text-theme-text-primary">Stagiaires</option>
                            <option value="teacher" className="bg-theme-surface text-theme-text-primary">Formateurs</option>
                            <option value="admin" className="bg-theme-surface text-theme-text-primary">Administrateurs</option>
                            <option value="parent" className="bg-theme-surface text-theme-text-primary">Parents</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            <UserTable
                usersData={usersData}
                isUsersLoading={isUsersLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <UserFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                editingUser={editingUser}
                currentUser={user}
            />
        </div>
    );
}
