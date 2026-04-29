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
            <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
                <div className="flex items-center justify-center gap-2 text-slate-500">
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
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <tr>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide">Nom</th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide">Email</th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide">Rôle</th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide">Détails</th>
                        <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {usersData?.data?.map((user: User) => (
                        <tr key={user.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50/70">
                            <td className="px-5 py-4 font-semibold text-slate-900">{user.name}</td>
                            <td className="px-5 py-4 text-slate-600">{user.email}</td>
                            <td className="px-5 py-4 capitalize">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                    user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                                        user.role === 'student' ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}>
                                    {user.role}
                                </span>
                            </td>
                            <td className="px-5 py-4 text-xs text-slate-500">
                                {user.role === 'teacher' && user.formateur && (
                                    <>
                                        <div className="font-semibold">{user.formateur.specialty}</div>
                                        <div>{user.formateur.matricule}</div>
                                    </>
                                )}
                                {user.role === 'student' && user.stagiaire && (
                                    <>
                                        <div>CEF: {user.stagiaire.cef_number}</div>
                                        <div>Filière: {user.stagiaire.filiere?.label ?? user.stagiaire.filiere_id ?? '-'}</div>
                                        <div>Groupe: {user.stagiaire.groupe?.label ?? user.stagiaire.groupe_id ?? '-'}</div>
                                        <div>Né(e): {user.stagiaire.date_naissance}</div>
                                    </>
                                )}
                            </td>
                            <td className="space-x-2 px-5 py-4 text-right">
                                <Button variant="ghost" size="icon" onClick={() => onEdit(user)} title="Modifier">
                                    <Pencil className="h-4 w-4 text-slate-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => onDelete(user.id)} title="Supprimer">
                                    <Trash2 className="h-4 w-4 text-rose-500" />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
