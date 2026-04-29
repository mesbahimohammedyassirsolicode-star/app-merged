import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { academicStructureApi, type Filiere } from '../../api/api/academicStructure';
import { groupsApi } from '../../api/api/groups';
import { modulesApi } from '../../api/api/modules';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import Modal from '../../components/ui/modal';
import {
  BookOpen,
  FolderOpen,
  Layers3,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { getApiErrorMessage } from '../../lib/api-error';

type ModalState =
  | { type: 'create-group'; filiere: Filiere }
  | { type: 'create-module'; filiere: Filiere }
  | { type: 'edit-filiere'; filiere: Filiere }
  | { type: 'delete-filiere'; filiere: Filiere }
  | null;

type GroupFormState = {
  label: string;
  year_level: string;
  capacity: string;
  annee_scolaire_id: string;
};

type ModuleFormState = {
  code: string;
  label: string;
  masse_horaire: string;
  coefficient: string;
  semester: string;
};

type FiliereFormState = {
  label: string;
  code: string;
  description: string;
  niveau_id: string;
};

function StatPill({
  icon: Icon,
  label,
  value,
  tone = 'default',
  onDark = false,
}: {
  icon: typeof Layers3;
  label: string;
  value: string | number;
  tone?: 'default' | 'accent';
  onDark?: boolean;
}) {
  const containerClass = tone === 'accent'
    ? onDark
      ? 'rounded-2xl border border-primary-600 bg-primary/20 px-4 py-3'
      : 'rounded-2xl border border-primary-100 bg-primary-50/80 px-4 py-3'
    : onDark
    ? 'rounded-2xl border border-white/10 bg-white/5 px-4 py-3'
    : 'rounded-2xl border border-slate-200 bg-white/80 px-4 py-3';

  const labelClass = onDark
    ? 'flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200'
    : 'flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500';

  const iconClass = tone === 'accent' ? (onDark ? 'h-4 w-4 text-primary-200' : 'h-4 w-4 text-primary-600') : (onDark ? 'h-4 w-4 text-slate-200' : 'h-4 w-4 text-slate-400');

  const valueClass = onDark ? 'mt-2 text-xl font-bold text-white' : 'mt-2 text-xl font-bold text-slate-900';

  return (
    <div className={containerClass}>
      <div className={labelClass}>
        <Icon className={iconClass} />
        {label}
      </div>
      <p className={valueClass}>{value}</p>
    </div>
  );
}

function FiliereCardSkeleton() {
  return (
    <div className="animate-pulse rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="h-4 w-20 rounded-full bg-slate-100" />
          <div className="h-7 w-56 rounded-full bg-slate-200" />
          <div className="h-4 w-40 rounded-full bg-slate-100" />
        </div>
        <div className="h-12 w-12 rounded-2xl bg-slate-100" />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="h-20 rounded-2xl bg-slate-100" />
        <div className="h-20 rounded-2xl bg-slate-100" />
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-4 w-24 rounded-full bg-slate-100" />
        <div className="h-16 rounded-2xl bg-slate-100" />
        <div className="h-16 rounded-2xl bg-slate-100" />
      </div>
      <div className="mt-6 flex gap-3">
        <div className="h-10 flex-1 rounded-xl bg-slate-100" />
        <div className="h-10 flex-1 rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

function EmptyState({ hasSearch, onClear }: { hasSearch: boolean; onClear: () => void }) {
  return (
    <div className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-slate-100 text-slate-500">
        <Search className="h-9 w-9" />
      </div>
      <h3 className="mt-6 text-2xl font-bold text-slate-900">
        {hasSearch ? 'Aucune filière trouvée' : 'Aucune filière disponible'}
      </h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
        {hasSearch
          ? 'Aucun résultat ne correspond à votre recherche. Essayez un autre mot-clé ou réinitialisez le filtre.'
          : 'Les filières apparaîtront ici sous forme de cartes dès qu’elles seront disponibles.'}
      </p>
      {hasSearch && (
        <Button variant="outline" className="mt-6 rounded-xl" onClick={onClear}>
          Effacer la recherche
        </Button>
      )}
    </div>
  );
}

function FieldShell({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </label>
  );
}

function toGroupForm(filiere: Filiere, firstYearId?: number): GroupFormState {
  return {
    label: '',
    year_level: String(filiere.groups?.[0]?.year_level ?? 1),
    capacity: String(filiere.groups?.[0]?.capacity ?? 30),
    annee_scolaire_id: firstYearId ? String(firstYearId) : '',
  };
}

function toModuleForm(): ModuleFormState {
  return {
    code: '',
    label: '',
    masse_horaire: '30',
    coefficient: '1',
    semester: 'S1',
  };
}

function toFiliereForm(filiere: Filiere): FiliereFormState {
  return {
    label: filiere.label ?? '',
    code: filiere.code ?? '',
    description: filiere.description ?? '',
    niveau_id: filiere.niveau_id ? String(filiere.niveau_id) : '',
  };
}

export default function FilieresPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState<ModalState>(null);
  const [groupForm, setGroupForm] = useState<GroupFormState>({
    label: '',
    year_level: '1',
    capacity: '30',
    annee_scolaire_id: '',
  });
  const [moduleForm, setModuleForm] = useState<ModuleFormState>(toModuleForm());
  const [filiereForm, setFiliereForm] = useState<FiliereFormState>({
    label: '',
    code: '',
    description: '',
    niveau_id: '',
  });

  const filieresQuery = useQuery({
    queryKey: ['academic', 'filieres', user?.id, user?.role],
    queryFn: () => academicStructureApi.getFilieres(),
  });

  const yearsQuery = useQuery({
    queryKey: ['academic', 'years', user?.id, user?.role],
    queryFn: academicStructureApi.getYears,
  });

  const levelsQuery = useQuery({
    queryKey: ['academic', 'levels', user?.id, user?.role],
    queryFn: academicStructureApi.getLevels,
  });

  useEffect(() => {
    if (filieresQuery.error) toast.error(getApiErrorMessage(filieresQuery.error, 'Erreur chargement des filieres.'));
  }, [filieresQuery.error]);

  useEffect(() => {
    if (yearsQuery.error) toast.error(getApiErrorMessage(yearsQuery.error, 'Erreur chargement des annees scolaires.'));
  }, [yearsQuery.error]);

  useEffect(() => {
    if (levelsQuery.error) toast.error(getApiErrorMessage(levelsQuery.error, 'Erreur chargement des niveaux.'));
  }, [levelsQuery.error]);

  const filieres = useMemo(() => (Array.isArray(filieresQuery.data) ? filieresQuery.data : []), [filieresQuery.data]);
  const years = useMemo(() => (Array.isArray(yearsQuery.data) ? yearsQuery.data : []), [yearsQuery.data]);
  const levels = useMemo(() => (Array.isArray(levelsQuery.data) ? levelsQuery.data : []), [levelsQuery.data]);

  const filteredFilieres = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filieres;

    return filieres.filter((filiere) => {
      const matchesFiliere =
        filiere.label.toLowerCase().includes(q) ||
        filiere.code.toLowerCase().includes(q) ||
        (filiere.description ?? '').toLowerCase().includes(q) ||
        (filiere.niveau?.label ?? '').toLowerCase().includes(q);

      const matchesGroup = (filiere.groups ?? []).some((group) => group.label.toLowerCase().includes(q));
      const matchesModule = (filiere.modules ?? []).some((module) => {
        const moduleLabel = module.label ?? module.name ?? '';
        return moduleLabel.toLowerCase().includes(q) || module.code.toLowerCase().includes(q);
      });

      return matchesFiliere || matchesGroup || matchesModule;
    });
  }, [filieres, searchQuery]);

  const totalGroups = filieres.reduce((sum, filiere) => sum + (filiere.groups?.length ?? 0), 0);
  const totalModules = filieres.reduce((sum, filiere) => sum + (filiere.modules?.length ?? 0), 0);
  const hasSearch = searchQuery.trim().length > 0;

  const refreshAcademicViews = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['academic', 'filieres'] }),
      queryClient.invalidateQueries({ queryKey: ['groups-by-filiere'] }),
      queryClient.invalidateQueries({ queryKey: ['modules-academic-catalog'] }),
    ]);
  };

  const createGroupMutation = useMutation({
    mutationFn: () =>
      groupsApi.create({
        filiere_id: activeModal?.type === 'create-group' ? activeModal.filiere.id : 0,
        annee_scolaire_id: Number(groupForm.annee_scolaire_id),
        label: groupForm.label.trim(),
        year_level: Number(groupForm.year_level),
        capacity: groupForm.capacity ? Number(groupForm.capacity) : undefined,
      }),
    onSuccess: async () => {
      toast.success('Groupe ajouté avec succès.');
      setActiveModal(null);
      await refreshAcademicViews();
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, "Impossible d'ajouter le groupe.")),
  });

  const createModuleMutation = useMutation({
    mutationFn: () =>
      modulesApi.create({
        filiere_id: activeModal?.type === 'create-module' ? activeModal.filiere.id : 0,
        code: moduleForm.code.trim(),
        label: moduleForm.label.trim(),
        masse_horaire: Number(moduleForm.masse_horaire),
        coefficient: Number(moduleForm.coefficient),
        semester: moduleForm.semester.trim(),
      }),
    onSuccess: async () => {
      toast.success('Module ajouté avec succès.');
      setActiveModal(null);
      await refreshAcademicViews();
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, "Impossible d'ajouter le module.")),
  });

  const updateFiliereMutation = useMutation({
    mutationFn: () =>
      academicStructureApi.updateFiliere(
        activeModal?.type === 'edit-filiere' ? activeModal.filiere.id : 0,
        {
          label: filiereForm.label.trim(),
          code: filiereForm.code.trim(),
          description: filiereForm.description.trim() || undefined,
          niveau_id: filiereForm.niveau_id ? Number(filiereForm.niveau_id) : undefined,
        },
      ),
    onSuccess: async () => {
      toast.success('Filière mise à jour.');
      setActiveModal(null);
      await refreshAcademicViews();
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, "Impossible de modifier la filiere.")),
  });

  const deleteFiliereMutation = useMutation({
    mutationFn: () =>
      academicStructureApi.deleteFiliere(activeModal?.type === 'delete-filiere' ? activeModal.filiere.id : 0),
    onSuccess: async () => {
      toast.success('Filière supprimée.');
      setActiveModal(null);
      await refreshAcademicViews();
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, "Impossible de supprimer la filiere.")),
  });

  const openModal = (state: ModalState) => {
    setActiveModal(state);

    if (state?.type === 'create-group') {
      setGroupForm(toGroupForm(state.filiere, years[0]?.id));
    }

    if (state?.type === 'create-module') {
      setModuleForm(toModuleForm());
    }

    if (state?.type === 'edit-filiere') {
      setFiliereForm(toFiliereForm(state.filiere));
    }
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const handleCreateGroup = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!groupForm.label.trim() || !groupForm.annee_scolaire_id) {
      toast.error('Veuillez renseigner le nom du groupe et l’année scolaire.');
      return;
    }

    createGroupMutation.mutate();
  };

  const handleCreateModule = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!moduleForm.code.trim() || !moduleForm.label.trim()) {
      toast.error('Veuillez renseigner le code et le libellé du module.');
      return;
    }

    createModuleMutation.mutate();
  };

  const handleEditFiliere = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!filiereForm.label.trim() || !filiereForm.code.trim()) {
      toast.error('Veuillez renseigner le nom et le code de la filière.');
      return;
    }

    updateFiliereMutation.mutate();
  };

  return (
    <div className="space-y-8 pb-12">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-primary/90 text-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.65)]">
        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.25fr_0.9fr] lg:px-10">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              <Sparkles className="h-3.5 w-3.5" />
              Academic dashboard
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                {t('nav.filieres', 'Gestion des Filières')}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                Parcourez vos filières sous forme de cartes, consultez rapidement les groupes et modules associés,
                puis gérez les actions clés sans quitter la page.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <StatPill icon={FolderOpen} label="Filières" value={filieres.length} tone="accent" onDark />
            <StatPill icon={Users} label="Groupes" value={totalGroups} onDark />
            <StatPill icon={BookOpen} label="Modules" value={totalModules} onDark />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Vue cartes</h2>
            <p className="mt-1 text-sm text-slate-500">
              Recherchez par filière, code, groupe, module ou niveau.
            </p>
          </div>

          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Rechercher une filière, un groupe ou un module..."
              className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-11 pr-4 shadow-none transition focus-visible:border-primary/50 focus-visible:bg-white"
            />
          </div>
        </div>
      </section>

      {filieresQuery.isLoading ? (
        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          <FiliereCardSkeleton />
          <FiliereCardSkeleton />
          <FiliereCardSkeleton />
        </div>
      ) : filteredFilieres.length === 0 ? (
        <EmptyState hasSearch={hasSearch} onClear={() => setSearchQuery('')} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {filteredFilieres.map((filiere) => {
            const groups = filiere.groups ?? [];
            const modules = filiere.modules ?? [];
            const groupPreview = groups.slice(0, 3);
            const hiddenGroups = Math.max(groups.length - groupPreview.length, 0);

            return (
              <Card
                key={filiere.id}
                className="group rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_-28px_rgba(15,23,42,0.2)] transition duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_22px_60px_-28px_rgba(14,116,144,0.28)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      {filiere.code}
                    </div>
                    <h3 className="mt-4 text-xl font-bold leading-tight text-slate-900">
                      {filiere.label}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {filiere.niveau?.label ? `Niveau ${filiere.niveau.label}` : 'Niveau non renseigné'}
                    </p>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary/10 text-primary transition group-hover:scale-105 group-hover:bg-primary/15">
                    <FolderOpen className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <Users className="h-4 w-4 text-slate-400" />
                      Groupes
                    </div>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{groups.length}</p>
                  </div>

                  <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                      <BookOpen className="h-4 w-4" />
                      Modules
                    </div>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{modules.length}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-bold text-slate-900">Aperçu des groupes</h4>
                    <span className="text-xs font-medium text-slate-500">
                      {groups.length > 0 ? `${groups.length} au total` : 'Aucun groupe'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {groupPreview.length > 0 ? (
                      <>
                        {groupPreview.map((group) => (
                          <div
                            key={group.id}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-white bg-white px-4 py-3 shadow-sm"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">{group.label}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {group.year_level ? `Année ${group.year_level}` : 'Niveau non défini'}
                              </p>
                            </div>
                            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              {group.capacity ?? 0} pl.
                            </div>
                          </div>
                        ))}
                        {hiddenGroups > 0 && (
                          <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-500">
                            + {hiddenGroups} autre{hiddenGroups > 1 ? 's' : ''} groupe{hiddenGroups > 1 ? 's' : ''}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                        Aucun groupe associé pour le moment.
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    className="h-11 flex-1 rounded-2xl"
                    onClick={() => openModal({ type: 'create-group', filiere })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un groupe
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 flex-1 rounded-2xl border-slate-200"
                    onClick={() => openModal({ type: 'create-module', filiere })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un module
                  </Button>
                </div>

                <div className="mt-3 flex flex-wrap gap-3">
                  <Button
                    variant="ghost"
                    className="h-11 flex-1 rounded-2xl bg-slate-50 text-slate-700 hover:bg-slate-100"
                    onClick={() => openModal({ type: 'edit-filiere', filiere })}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Modifier la filière
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-11 flex-1 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                    onClick={() => openModal({ type: 'delete-filiere', filiere })}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer la filière
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {activeModal?.type === 'create-group' ? (
        <Modal isOpen onClose={closeModal} title={`Ajouter un groupe à ${activeModal.filiere.label}`}>
          <form className="space-y-5" onSubmit={handleCreateGroup}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldShell label="Nom du groupe">
                <Input
                  value={groupForm.label}
                  onChange={(event) => setGroupForm((prev) => ({ ...prev, label: event.target.value }))}
                  placeholder="Ex: TSDI 1A - Groupe A"
                  className="rounded-xl"
                />
              </FieldShell>

              <FieldShell label="Année scolaire">
                <select
                  value={groupForm.annee_scolaire_id}
                  onChange={(event) => setGroupForm((prev) => ({ ...prev, annee_scolaire_id: event.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Sélectionner une année</option>
                  {years.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.label}
                    </option>
                  ))}
                </select>
              </FieldShell>

              <FieldShell label="Niveau / année">
                <Input
                  type="number"
                  min="1"
                  value={groupForm.year_level}
                  onChange={(event) => setGroupForm((prev) => ({ ...prev, year_level: event.target.value }))}
                  className="rounded-xl"
                />
              </FieldShell>

              <FieldShell label="Capacité">
                <Input
                  type="number"
                  min="1"
                  value={groupForm.capacity}
                  onChange={(event) => setGroupForm((prev) => ({ ...prev, capacity: event.target.value }))}
                  className="rounded-xl"
                />
              </FieldShell>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-xl" onClick={closeModal}>
                Annuler
              </Button>
              <Button type="submit" className="rounded-xl" isLoading={createGroupMutation.isPending}>
                Ajouter le groupe
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {activeModal?.type === 'create-module' ? (
        <Modal isOpen onClose={closeModal} title={`Ajouter un module à ${activeModal.filiere.label}`}>
          <form className="space-y-5" onSubmit={handleCreateModule}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldShell label="Code module">
                <Input
                  value={moduleForm.code}
                  onChange={(event) => setModuleForm((prev) => ({ ...prev, code: event.target.value }))}
                  placeholder="Ex: DEV101"
                  className="rounded-xl"
                />
              </FieldShell>

              <FieldShell label="Semestre">
                <Input
                  value={moduleForm.semester}
                  onChange={(event) => setModuleForm((prev) => ({ ...prev, semester: event.target.value }))}
                  placeholder="S1"
                  className="rounded-xl"
                />
              </FieldShell>

              <div className="sm:col-span-2">
                <FieldShell label="Libellé">
                  <Input
                    value={moduleForm.label}
                    onChange={(event) => setModuleForm((prev) => ({ ...prev, label: event.target.value }))}
                    placeholder="Nom du module"
                    className="rounded-xl"
                  />
                </FieldShell>
              </div>

              <FieldShell label="Masse horaire">
                <Input
                  type="number"
                  min="1"
                  value={moduleForm.masse_horaire}
                  onChange={(event) => setModuleForm((prev) => ({ ...prev, masse_horaire: event.target.value }))}
                  className="rounded-xl"
                />
              </FieldShell>

              <FieldShell label="Coefficient">
                <Input
                  type="number"
                  min="1"
                  value={moduleForm.coefficient}
                  onChange={(event) => setModuleForm((prev) => ({ ...prev, coefficient: event.target.value }))}
                  className="rounded-xl"
                />
              </FieldShell>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-xl" onClick={closeModal}>
                Annuler
              </Button>
              <Button type="submit" className="rounded-xl" isLoading={createModuleMutation.isPending}>
                Ajouter le module
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {activeModal?.type === 'edit-filiere' ? (
        <Modal isOpen onClose={closeModal} title={`Modifier ${activeModal.filiere.label}`}>
          <form className="space-y-5" onSubmit={handleEditFiliere}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldShell label="Nom de la filière">
                <Input
                  value={filiereForm.label}
                  onChange={(event) => setFiliereForm((prev) => ({ ...prev, label: event.target.value }))}
                  className="rounded-xl"
                />
              </FieldShell>

              <FieldShell label="Code">
                <Input
                  value={filiereForm.code}
                  onChange={(event) => setFiliereForm((prev) => ({ ...prev, code: event.target.value }))}
                  className="rounded-xl"
                />
              </FieldShell>

              <FieldShell label="Niveau">
                <select
                  value={filiereForm.niveau_id}
                  onChange={(event) => setFiliereForm((prev) => ({ ...prev, niveau_id: event.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Conserver le niveau actuel</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </FieldShell>

              <FieldShell label="Description" hint="Optionnel">
                <textarea
                  rows={4}
                  value={filiereForm.description}
                  onChange={(event) => setFiliereForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="min-h-[104px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Brève description de la filière"
                />
              </FieldShell>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-xl" onClick={closeModal}>
                Annuler
              </Button>
              <Button type="submit" className="rounded-xl" isLoading={updateFiliereMutation.isPending}>
                Enregistrer
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {activeModal?.type === 'delete-filiere' ? (
        <Modal isOpen onClose={closeModal} title="Supprimer la filière">
          <div className="space-y-5">
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              Vous êtes sur le point de supprimer <span className="font-semibold">{activeModal.filiere.label}</span>.
              Cette action est définitive.
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-xl" onClick={closeModal}>
                Annuler
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="rounded-xl"
                isLoading={deleteFiliereMutation.isPending}
                onClick={() => deleteFiliereMutation.mutate()}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {(createGroupMutation.isPending ||
        createModuleMutation.isPending ||
        updateFiliereMutation.isPending ||
        deleteFiliereMutation.isPending) && (
        <div className="fixed bottom-5 right-5 flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Mise à jour en cours...
        </div>
      )}
    </div>
  );
}
