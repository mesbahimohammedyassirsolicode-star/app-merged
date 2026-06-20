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
        <Card className="overflow-hidden border border-theme-border bg-theme-surface/40 backdrop-blur-xl transition-all duration-300 hover:border-theme-border hover:shadow-glow-primary rounded-2xl">
            <div
                className="group flex cursor-pointer items-center justify-between px-6 py-5 transition-colors hover:bg-theme-surface"
                onClick={() => onToggleExpand(filiere.id)}
            >
                <div className="flex items-center gap-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:bg-blue-500/20">
                        <FolderOpen className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-theme-text-primary group-hover:text-blue-400 transition-colors">{filiere.label}</h2>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm font-medium text-theme-text-secondary">
                            {filiere.code && (
                                <span className="rounded-md glass-panel/5 px-2.5 py-0.5 text-xs font-bold tracking-wider text-theme-text-secondary border border-theme-border">
                                    {filiere.code}
                                </span>
                            )}
                            <span className="flex items-center gap-1.5 px-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-slate-600"></div>
                                {groupCount} groupe{groupCount !== 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1.5 px-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-slate-600"></div>
                                {totalStudents} étudiant{totalStudents !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center pl-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${isExpanded ? 'bg-blue-500/20 text-blue-400 shadow-inner' : 'glass-panel/5 text-theme-text-secondary group-hover:glass-panel/10 group-hover:text-theme-text-secondary'}`}>
                        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </div>
                </div>
            </div>

            <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="border-t border-theme-border glass-panel/[0.01] p-6">
                        {filiere.groups && filiere.groups.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {filiere.groups.map((group: FiliereGroup) => (
                                    <div
                                        key={group.id}
                                        className="group/card relative flex flex-col justify-between overflow-hidden rounded-xl border border-theme-border bg-theme-surface shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/30 hover:bg-theme-surface"
                                    >
                                        <div className="p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <h3
                                                    className="cursor-pointer text-[15px] font-bold leading-tight text-theme-text-primary transition-colors hover:text-blue-400 line-clamp-2"
                                                    onClick={() => navigate(`/groups/${group.id}`)}
                                                >
                                                    {group.label}
                                                </h3>
                                                <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover/card:opacity-100">
                                                    <button
                                                        className="rounded-lg p-2 text-theme-text-secondary hover:glass-panel/10 hover:text-blue-400 focus:outline-none"
                                                        title="Modifier"
                                                        onClick={(e) => { e.stopPropagation(); toast.info("L'édition sera disponible prochainement"); }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        className="rounded-lg p-2 text-theme-text-secondary hover:bg-rose-500/10 hover:text-rose-500 focus:outline-none"
                                                        title="Supprimer"
                                                        onClick={(e) => { e.stopPropagation(); toast.error("Suppression non autorisée"); }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-5 grid grid-cols-2 gap-3">
                                                <div className="flex flex-col justify-center rounded-lg bg-theme-surface p-2.5 border border-theme-border">
                                                    <span className="mb-1 text-[10px] font-bold tracking-wider text-theme-text-secondary uppercase">Capacité</span>
                                                    <span className="text-sm font-semibold text-theme-text-primary">{group.capacity ?? '-'} pl.</span>
                                                </div>
                                                <div className="flex flex-col justify-center rounded-lg bg-blue-500/5 p-2.5 border border-blue-500/10">
                                                    <span className="mb-1 text-[10px] font-bold tracking-wider text-blue-500 uppercase">Étudiants</span>
                                                    <div className="flex items-center gap-2 text-sm font-bold text-blue-400">
                                                        <Users className="h-3.5 w-3.5 opacity-70" />
                                                        {group.students_count ?? 0}
                                                    </div>
                                                </div>
                                            </div>
                                            {Array.isArray(group.stagiaires) && group.stagiaires.length > 0 && (
                                                <div className="mt-4 rounded-lg border border-theme-border bg-theme-surface p-3">
                                                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-theme-text-secondary">Stagiaires</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {(expandedStudentGroups[group.id] ? group.stagiaires : group.stagiaires.slice(0, 6))
                                                            .map((stagiaire) => stagiaire.user?.name?.trim())
                                                            .filter((name): name is string => Boolean(name))
                                                            .map((name) => (
                                                                <span
                                                                    key={`${group.id}-${name}`}
                                                                    className="rounded-full glass-panel/5 px-2.5 py-1 text-xs font-semibold text-theme-text-secondary ring-1 ring-white/10"
                                                                >
                                                                    {name}
                                                                </span>
                                                            ))}
                                                    </div>
                                                    {group.stagiaires.length > 6 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleStudentList(group.id)}
                                                            className="mt-2 text-xs font-bold text-blue-400 transition-colors hover:text-blue-300"
                                                        >
                                                            {expandedStudentGroups[group.id] ? 'Afficher moins' : `Afficher tout (${group.stagiaires.length})`}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="h-1 w-full glass-panel/5 transition-colors group-hover/card:bg-blue-500/30" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 rounded-xl glass-panel/[0.01] border border-dashed border-theme-border text-theme-text-secondary">
                                <Users className="h-10 w-10 text-theme-text-primary mb-3" />
                                <p className="font-bold text-theme-text-secondary">Aucun groupe</p>
                                <p className="font-medium text-sm text-theme-text-secondary mt-1 text-center max-w-sm">
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
