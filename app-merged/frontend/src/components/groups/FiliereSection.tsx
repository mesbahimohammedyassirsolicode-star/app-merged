import { useNavigate } from 'react-router-dom';
import { memo, useState } from 'react';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, FolderOpen, Users, Edit, Trash2 } from 'lucide-react';
import { Card } from '../ui/card';

import type { Filiere } from '../../api/api/academicStructure';

type FiliereGroup = NonNullable<Filiere['groups']>[number];

interface FiliereSectionProps {
    filiere: Filiere;
    isExpanded: boolean;
    onToggleExpand: (id: number) => void;
}

// Performance: React.memo prevents re-rendering all filiere sections when
// only one section is toggled (each section only re-renders if its own props change).
const FiliereSection = memo(function FiliereSection({ filiere, isExpanded, onToggleExpand }: FiliereSectionProps) {
    const navigate = useNavigate();
    const [expandedStudentGroups, setExpandedStudentGroups] = useState<Record<number, boolean>>({});
    const groupCount = filiere.groups?.length ?? 0;
    const totalStudents = (filiere.groups ?? []).reduce((sum: number, g: FiliereGroup) => sum + (g.students_count ?? 0), 0);

    const toggleStudentList = (groupId: number) => {
        setExpandedStudentGroups((prev) => ({ ...prev, [groupId]: !(prev[groupId] ?? false) }));
    };

    return (
        <Card className="overflow-hidden border-0 shadow-[0_2px_12px_-3px_rgba(6,81,237,0.08)] ring-1 ring-gray-200 transition-all duration-300 hover:shadow-[0_8px_20px_-6px_rgba(6,81,237,0.12)] rounded-2xl bg-white">
            <div
                className="group flex cursor-pointer items-center justify-between bg-white px-6 py-5 transition-colors hover:bg-gray-50/60"
                onClick={() => onToggleExpand(filiere.id)}
            >
                <div className="flex items-center gap-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50/80 text-primary-600 shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:bg-primary-100">
                        <FolderOpen className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 group-hover:text-primary-700 transition-colors">{filiere.label}</h2>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm font-medium text-gray-500">
                            {filiere.code && (
                                <span className="rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-bold tracking-wider text-gray-600">
                                    {filiere.code}
                                </span>
                            )}
                            <span className="flex items-center gap-1.5 px-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-gray-300"></div>
                                {groupCount} groupe{groupCount !== 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1.5 px-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-gray-300"></div>
                                {totalStudents} étudiant{totalStudents !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center pl-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${isExpanded ? 'bg-primary-50 text-primary-600 shadow-inner' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-700'}`}>
                        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </div>
                </div>
            </div>

            <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="border-t border-gray-100/80 bg-gray-50/40 p-6">
                        {filiere.groups && filiere.groups.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {filiere.groups.map((group: FiliereGroup) => (
                                    <div
                                        key={group.id}
                                        className="group/card relative flex flex-col justify-between overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
                                    >
                                        <div className="p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <h3
                                                    className="cursor-pointer text-[15px] font-bold leading-tight text-gray-900 transition-colors hover:text-primary-600 line-clamp-2"
                                                    onClick={() => navigate(`/groups/${group.id}`)}
                                                >
                                                    {group.label}
                                                </h3>
                                                <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover/card:opacity-100">
                                                    <button
                                                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                                        title="Modifier"
                                                        onClick={(e) => { e.stopPropagation(); toast.info("L'édition sera disponible prochainement"); }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                                        title="Supprimer"
                                                        onClick={(e) => { e.stopPropagation(); toast.error("Suppression non autorisée"); }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-5 grid grid-cols-2 gap-3">
                                                <div className="flex flex-col justify-center rounded-lg bg-gray-50 p-2.5 outline outline-1 outline-gray-100/50">
                                                    <span className="mb-1 text-[11px] font-bold tracking-wider text-gray-500 uppercase">Capacité</span>
                                                    <span className="text-sm font-semibold text-gray-900">{group.capacity ?? '-'} pl.</span>
                                                </div>
                                                <div className="flex flex-col justify-center rounded-lg bg-primary-50/50 p-2.5 outline outline-1 outline-primary-100/50">
                                                    <span className="mb-1 text-[11px] font-bold tracking-wider text-primary-600 uppercase">Étudiants</span>
                                                    <div className="flex items-center gap-2 text-sm font-bold text-primary-700">
                                                        <Users className="h-3.5 w-3.5 opacity-70" />
                                                        {group.students_count ?? 0}
                                                    </div>
                                                </div>
                                            </div>
                                            {Array.isArray(group.stagiaires) && group.stagiaires.length > 0 && (
                                                <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50/70 p-3">
                                                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">Stagiaires</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {(expandedStudentGroups[group.id] ? group.stagiaires : group.stagiaires.slice(0, 6))
                                                            .map((stagiaire) => stagiaire.user?.name?.trim())
                                                            .filter((name): name is string => Boolean(name))
                                                            .map((name) => (
                                                                <span
                                                                    key={`${group.id}-${name}`}
                                                                    className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200"
                                                                >
                                                                    {name}
                                                                </span>
                                                            ))}
                                                    </div>
                                                    {group.stagiaires.length > 6 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleStudentList(group.id)}
                                                            className="mt-2 text-xs font-semibold text-primary-600 transition-colors hover:text-primary-700 hover:underline"
                                                        >
                                                            {expandedStudentGroups[group.id] ? 'Afficher moins' : `Afficher tout (${group.stagiaires.length})`}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="h-1 w-full bg-gray-100 transition-colors group-hover/card:bg-primary-100" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 rounded-xl bg-white border border-dashed border-gray-200 text-gray-500">
                                <Users className="h-10 w-10 text-gray-300 mb-3" />
                                <p className="font-semibold text-gray-700">Aucun groupe</p>
                                <p className="font-medium text-sm text-gray-500 mt-1 text-center max-w-sm">
                                    Il n'y a aucun groupe pour cette filière actuellement.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
});

export default FiliereSection;
