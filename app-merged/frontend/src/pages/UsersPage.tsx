import { useState } from 'react';
import { useUsers, useDeleteUser } from '../hooks/useUsers';
import { Plus, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../types/auth';
import UserTable from '../components/users/UserTable';
import UserFormModal from '../components/users/UserFormModal';
import { Card, CardContent } from '../components/ui/card';

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
            <Card className="border-rose-200 bg-rose-50">
                <CardContent className="pt-6">
                    <p className="text-sm font-medium text-rose-700">Erreur de chargement des utilisateurs.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Utilisateurs</h1>
                    <p className="mt-1 text-sm text-slate-500">Gestion des comptes et des rôles.</p>
                </div>
                <Button onClick={() => { setEditingUser(null); setIsModalOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                        <Search className="h-4 w-4 text-slate-400" />
                        <select
                            className="app-control w-full border-none bg-transparent px-0 py-0 shadow-none ring-0 focus-visible:ring-0"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="">Tous les rôles</option>
                            <option value="student">Stagiaires</option>
                            <option value="teacher">Formateurs</option>
                            <option value="admin">Administrateurs</option>
                            <option value="parent">Parents</option>
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
