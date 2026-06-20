import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { EmptyState } from '../ui/empty-state';

import type { User } from '../../types/auth';

interface UserTableProps {
    usersData: { data: User[] } | undefined;
    isUsersLoading: boolean;
    onEdit: (user: User) => void;
    onDelete: (id: number) => void;
}

export default function UserTable({ usersData, isUsersLoading, onEdit, onDelete }: UserTableProps) {
    if (isUsersLoading) {
        return (
            <div className="rounded-2xl border border-theme-border glass-panel p-10 shadow-sm">
                <div className="flex items-center justify-center gap-2 text-theme-text-secondary">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm font-medium">Chargement des utilisateurs...</span>
                </div>
            </div>
        );
    }

    if (!usersData?.data?.length) {
        return (
            <EmptyState
                title="No data available"
                description="Aucun utilisateur ne correspond aux filtres actuels."
            />
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-theme-border bg-theme-surface/50 backdrop-blur-md shadow-sm">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-theme-border bg-theme-surface text-theme-text-secondary">
                    <tr>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide">Nom</th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide">Email</th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide">Rôle</th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide">Détails</th>
                        <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-theme-border">
                    {usersData?.data?.map((user: User) => (
                        <tr key={user.id} className="transition-colors hover:bg-theme-surface">
                            <td className="px-5 py-4 font-semibold text-theme-text-primary">{user.name}</td>
                            <td className="px-5 py-4 text-theme-text-secondary">{user.email}</td>
                            <td className="px-5 py-4 capitalize">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                    user.role === 'teacher' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                    user.role === 'student' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    'bg-theme-text-secondary/10 text-theme-text-secondary border border-theme-border/20'
                                }`}>
                                    {user.role}
                                </span>
                            </td>
                            <td className="px-5 py-4 text-xs text-theme-text-secondary">
                                {user.role === 'teacher' && user.formateur && (
                                    <div className="space-y-1">
                                        <div className="font-semibold text-theme-text-secondary">{user.formateur.specialty}</div>
                                        <div className="text-theme-text-secondary">{user.formateur.matricule}</div>
                                    </div>
                                )}
                                {user.role === 'student' && user.stagiaire && (
                                    <div className="space-y-0.5">
                                        <div className="text-theme-text-secondary">CEF: <span className="text-theme-text-secondary">{user.stagiaire.cef_number}</span></div>
                                        <div className="text-theme-text-secondary">Filière: <span className="text-theme-text-secondary">{user.stagiaire.filiere?.label ?? user.stagiaire.filiere_id ?? '-'}</span></div>
                                        <div className="text-theme-text-secondary">Groupe: <span className="text-theme-text-secondary">{user.stagiaire.groupe?.label ?? user.stagiaire.groupe_id ?? '-'}</span></div>
                                    </div>
                                )}
                            </td>
                            <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => onEdit(user)} className="h-8 w-8 text-theme-text-secondary hover:text-blue-400 hover:bg-blue-400/10">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => onDelete(user.id)} className="h-8 w-8 text-theme-text-secondary hover:text-rose-400 hover:bg-rose-400/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
    );
}
