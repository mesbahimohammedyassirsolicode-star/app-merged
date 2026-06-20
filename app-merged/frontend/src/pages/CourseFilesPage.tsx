import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { useCourseFiles } from '../hooks/useCourseFiles';
import { courseFilesApi } from '../services/api/courseFiles';
import { modulesApi } from '../api/api/modules';
import { academicStructureApi } from '../services/api/academicStructure';
import CourseFileUploadForm from '../components/course-files/CourseFileUploadForm';
import CourseFileList from '../components/course-files/CourseFileList';
import { Label } from '../components/ui/label';
import { getApiErrorMessage } from '../lib/api-error';

const UPLOAD_ROLES = ['admin', 'directeur', 'secretariat', 'teacher', 'formateur'] as const;

export default function CourseFilesPage() {
  const { user } = useAuth();
  const [filterFiliere, setFilterFiliere] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const filters = useMemo(() => ({}), []);

  const { listQuery, uploadMutation, deleteMutation } = useCourseFiles(filters);
  const [uploadFormKey, setUploadFormKey] = useState(0);

  const { data: modulesList = [] } = useQuery({
    queryKey: ['course-files-modules'],
    queryFn: () => modulesApi.list(),
  });

  const { data: filieresList = [] } = useQuery({
    queryKey: ['course-files-filieres'],
    queryFn: () => academicStructureApi.getFilieres(),
  });

  const canUpload = user && UPLOAD_ROLES.includes(user.role as (typeof UPLOAD_ROLES)[number]);

  useEffect(() => {
    if (listQuery.error) toast.error(getApiErrorMessage(listQuery.error, 'Impossible de charger les fichiers.'));
  }, [listQuery.error]);

  const handleDownload = async (id: number) => {
    setDownloadingId(id);
    try {
      const { blob, filename } = await courseFilesApi.download(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Telechargement refuse ou erreur reseau.'));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = (id: number) => {
    if (!window.confirm('Supprimer ce fichier ?')) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-8 pb-10 max-w-5xl mx-auto">
      <div className="rounded-2xl glass-panel px-6 py-6 shadow-sm border border-theme-border">
        <h1 className="text-2xl font-bold text-theme-text-primary">Fichiers de cours</h1>
        <p className="text-sm text-theme-text-secondary mt-2">
          Ressources liées aux groupes et aux modules. Accès contrôlé selon votre rôle et vos affectations.
        </p>
      </div>

      <div className="rounded-2xl glass-panel p-6 shadow-sm border border-theme-border">
        <div className="max-w-xs">
          <Label htmlFor="filter-filiere">Filtrer par filière</Label>
          <select
            id="filter-filiere"
            className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filterFiliere}
            onChange={(e) => setFilterFiliere(e.target.value)}
          >
            <option value="">Toutes</option>
            {filieresList.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {canUpload && (
        <CourseFileUploadForm
          key={uploadFormKey}
          modules={modulesList}
          filieres={filieresList}
          isSubmitting={uploadMutation.isPending}
          onSubmit={(payload) =>
            uploadMutation.mutate(payload, {
              onSettled: (_data, err) => {
                if (!err) setUploadFormKey((k) => k + 1);
              },
            })
          }
        />
      )}

      <CourseFileList
        files={listQuery.data?.items ?? []}
        isLoading={listQuery.isLoading}
        user={user}
        downloadingId={downloadingId}
        onDownload={handleDownload}
        onDelete={handleDelete}
        filterFiliere={filterFiliere ? parseInt(filterFiliere) : null}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
    </div>
  );
}
