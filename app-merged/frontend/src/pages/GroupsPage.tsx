import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { groupsApi, type Groupe } from '../api/api/groups';
import { Search, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import type { Filiere } from '../api/api/academicStructure';
import { getApiErrorMessage } from '../lib/api-error';

type FiliereGroup = NonNullable<Filiere['groups']>[number];
import FiliereSection from '../components/groups/FiliereSection';

function buildFilieresFromGroups(groups: Groupe[]): Filiere[] {
  const byFiliere = new Map<number, Filiere>();

  groups.forEach((group) => {
    const filiereId = group.filiere?.id ?? group.filiere_id;
    if (!filiereId) return;

    const existing = byFiliere.get(filiereId);
    const filiereLabel = group.filiere?.label ?? 'Filiere';
    const filiereCode = group.filiere?.code ?? '';
    const safeGroupLabel = group.label ?? `Groupe ${group.id}`;

    const mappedGroup: FiliereGroup = {
      id: group.id,
      filiere_id: filiereId,
      name: safeGroupLabel,
      label: safeGroupLabel,
      year_level: group.year_level,
      capacity: group.capacity,
      students_count: group.students_count,
      stagiaires: group.stagiaires,
    };

    if (!existing) {
      byFiliere.set(filiereId, {
        id: filiereId,
        niveau_id: group.niveau_id ?? 0,
        label: filiereLabel,
        code: filiereCode,
        groups: [mappedGroup],
      });
      return;
    }

    existing.groups = [...(existing.groups ?? []), mappedGroup];
  });

  return Array.from(byFiliere.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export default function GroupsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  /** `false` = collapsed; omitted/`undefined` = expanded (default). */
  const [expandedToggles, setExpandedToggles] = useState<Record<number, boolean>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['groups-by-filiere', user?.id, user?.role],
    queryFn: async () => {
      const response = await groupsApi.list({ per_page: 100 });
      return buildFilieresFromGroups(response.items);
    },
  });

  useEffect(() => {
    if (error) toast.error(getApiErrorMessage(error, 'Erreur chargement des groupes.'));
  }, [error]);

  const filieres = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const isFiliereExpanded = (id: number) => expandedToggles[id] ?? true;

  const toggleExpand = (id: number) => {
    setExpandedToggles((prev) => {
      const current = prev[id] ?? true;
      return { ...prev, [id]: !current };
    });
  };

  const filteredFilieres = useMemo<Filiere[]>(() => {
    if (!searchTerm) return filieres;
    const lowerSearch = searchTerm.toLowerCase();

    return filieres.reduce<Filiere[]>((acc, filiere) => {
      const matchesFiliere = filiere.label.toLowerCase().includes(lowerSearch) ||
        (filiere.code && filiere.code.toLowerCase().includes(lowerSearch));

      const matchingGroups = (filiere.groups ?? []).filter((group: FiliereGroup) =>
        group.label.toLowerCase().includes(lowerSearch)
      );

      if (matchesFiliere || matchingGroups.length > 0) {
        acc.push({
          ...filiere,
          groups: matchesFiliere ? filiere.groups : matchingGroups
        });
      }
      return acc;
    }, []);
  }, [searchTerm, filieres]);

  const totalGroups = filieres.reduce((sum, filiere) => sum + (filiere.groups?.length ?? 0), 0);
  const isEmpty = !isLoading && !error && filteredFilieres.length === 0;

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white px-6 py-6 shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">{t('nav.groups', 'Gestion des Groupes')}</h1>
          <p className="text-sm font-medium text-gray-500 mt-2">
            Gérez vos filières et les groupes d'étudiants associés au sein du système.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-xl border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-sm font-medium text-gray-900 transition-all focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 placeholder:text-gray-400"
            placeholder="Rechercher une filière ou un groupe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6 animate-pulse mt-8">
          {[1, 2, 3].map((skeleton) => (
            <div key={skeleton} className="h-32 rounded-2xl bg-gray-100 border border-gray-200/60" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-red-600 flex flex-col items-center justify-center gap-3">
          <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
          <h3 className="font-bold text-lg">Impossible de charger les données</h3>
          <p className="text-sm font-medium text-red-500/80">Veuillez vérifier votre connexion internet ou réessayer plus tard.</p>
        </div>
      ) : (
        <div className="space-y-6 mt-6">
          {filteredFilieres.map((filiere) => (
            <FiliereSection
              key={filiere.id}
              filiere={filiere}
              isExpanded={isFiliereExpanded(filiere.id)}
              onToggleExpand={toggleExpand}
            />
          ))}

          {isEmpty && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 px-4 mt-8 shadow-sm">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 mb-5 shadow-inner">
                <Search className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">Aucun résultat trouvé</h3>
              <p className="text-center text-base font-medium text-gray-500 max-w-sm">
                {searchTerm ?
                  "Nous n'avons trouvé aucune filière ou groupe correspondant à votre recherche." :
                  "Il n'y a actuellement aucune filière ou groupe enregistré dans le système."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-6 font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-all"
                >
                  Effacer la recherche
                </button>
              )}
            </div>
          )}

          {!isEmpty && !searchTerm && (
            <div className="flex flex-col items-center justify-center py-6 mt-4">
              <div className="h-px w-24 bg-gray-200 mb-4 rounded-full"></div>
              <p className="text-sm font-semibold text-gray-400">
                Total de <span className="text-gray-500">{filieres.length}</span> filière{filieres.length !== 1 ? 's' : ''} et <span className="text-gray-500">{totalGroups}</span> groupe{totalGroups !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
