import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Download,
  FileText,
  Trash2,
  Loader2,
  Search,
  ArrowUpDown,
  Video,
  FileArchive,
  Image as ImageIcon,
  FileIcon,
  FolderTree
} from 'lucide-react';
import type { CourseFile } from '../../services/api/courseFiles';
import type { User } from '../../types/auth';
import { formatBytes } from '../../utils/format';

export interface CourseFileListProps {
  files: CourseFile[];
  isLoading: boolean;
  user: User | null;
  downloadingId: number | null;
  onDownload: (id: number) => void;
  onDelete: (id: number) => void;
  filterFiliere: number | null;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  sortBy: 'date' | 'name';
  setSortBy: (val: 'date' | 'name') => void;
}

function canManageDelete(file: CourseFile, user: User | null): boolean {
  if (!user) return false;
  if (['admin', 'directeur', 'secretariat'].includes(user.role)) return true;
  if (file.uploader?.id === user.id) return true;
  return false;
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes('pdf') || mimeType.includes('text')) return <FileText className="h-8 w-8 text-red-500" />;
  if (mimeType.includes('video') || mimeType.includes('mp4')) return <Video className="h-8 w-8 text-blue-500" />;
  if (mimeType.includes('image')) return <ImageIcon className="h-8 w-8 text-emerald-500" />;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return <FileArchive className="h-8 w-8 text-amber-500" />;
  return <FileIcon className="h-8 w-8 text-gray-500" />;
}

export default function CourseFileList({
  files,
  isLoading,
  user,
  downloadingId,
  onDownload,
  onDelete,
  filterFiliere,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
}: CourseFileListProps) {

  // Local filtering & sorting
  const processedFiles = files.filter(f => {
    // text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = f.title?.toLowerCase() || '';
      const name = f.original_name.toLowerCase();
      if (!title.includes(q) && !name.includes(q)) return false;
    }
    // local filiere filter
    if (filterFiliere) {
      const gFiliere = f.groupe?.filiere?.id;
      const mFiliere = f.module?.filiere?.id;
      // Filter out files that don't match the selected filiere
      if (gFiliere !== filterFiliere && mFiliere !== filterFiliere) {
        return false;
      }
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'name') {
      const nameA = a.title || a.original_name;
      const nameB = b.title || b.original_name;
      return nameA.localeCompare(nameB);
    } else {
      // sort by date descending
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Grouping logic: Filiere -> Module -> Group
  // For UI simplicity, we will group them by a "Path string" or a structural key.
  // Group key: "Filiere | Module | Group" or "Général"
  const groupedFiles: Record<string, CourseFile[]> = {};

  for (const f of processedFiles) {
    const filiereName = f.groupe?.filiere?.label || f.module?.filiere?.label || 'Sans filière';
    const moduleName = f.module ? `${f.module.code} - ${f.module.label}` : 'Sans module';
    const groupeName = f.groupe ? f.groupe.label : 'Tous groupes';

    // Instead of nested generic objects, we combine the path to form a clean UI section header
    let groupKey = '';
    if (filiereName === 'Sans filière' && moduleName === 'Sans module' && groupeName === 'Tous groupes') {
      groupKey = 'Fichiers généraux';
    } else {
      groupKey = `${filiereName} / ${moduleName} / ${groupeName}`;
    }

    if (!groupedFiles[groupKey]) groupedFiles[groupKey] = [];
    groupedFiles[groupKey].push(f);
  }

  // Sort groups alphabetically
  const sortedGroupKeys = Object.keys(groupedFiles).sort();

  return (
    <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <FolderTree className="h-5 w-5 text-primary-600" />
            Liste des ressources
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un fichier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 h-9 flex rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy(sortBy === 'date' ? 'name' : 'date')}
              className="text-gray-600 shrink-0 w-full sm:w-auto h-9"
            >
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Tri: {sortBy === 'date' ? 'Plus récent' : 'A-Z'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement des fichiers…
          </div>
        )}
        {!isLoading && processedFiles.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileIcon className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 font-medium">Aucun fichier trouvé</p>
            <p className="text-xs text-gray-400 mt-1">Essayez de modifier vos critères de recherche.</p>
          </div>
        )}
        {!isLoading && processedFiles.length > 0 && (
          <div className="divide-y divide-gray-100/50 p-4 sm:p-6 space-y-8">
            {sortedGroupKeys.map((key) => (
              <div key={key} className="pt-2 first:pt-0">
                <div className="mb-4 inline-flex items-center rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-800 shadow-sm">
                  {key}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedFiles[key].map((f) => (
                    <div key={f.id} className="group relative flex flex-col rounded-xl border border-gray-200 bg-white hover:bg-gray-50/50 hover:shadow-md transition-all duration-200 overflow-hidden">
                      <div className="p-4 flex gap-4 items-start flex-1">
                        <div className="shrink-0 p-2 bg-gray-50 rounded-lg group-hover:bg-white transition-colors border border-gray-100">
                          {getFileIcon(f.mime_type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight" title={f.title || f.original_name}>
                            {f.title || f.original_name}
                          </h4>
                          <p className="text-xs text-gray-500 truncate mt-1" title={f.original_name}>
                            {f.original_name}
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-xs font-medium text-gray-500">
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{formatBytes(f.size_bytes)}</span>
                            {f.uploader && (
                              <span className="truncate">~ {f.uploader.name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50/50 border-t border-gray-100 px-4 py-2 flex items-center justify-end gap-2">
                        {canManageDelete(f, user) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                            onClick={() => onDelete(f.id)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-8 rounded-full shadow-sm text-xs px-3"
                          onClick={() => onDownload(f.id)}
                          disabled={downloadingId === f.id}
                        >
                          {downloadingId === f.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                          ) : (
                            <Download className="h-3 w-3 mr-1.5" />
                          )}
                          Télécharger
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
