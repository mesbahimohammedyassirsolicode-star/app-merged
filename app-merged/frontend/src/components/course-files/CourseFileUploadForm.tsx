import { useState, useCallback, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Upload, FileIcon, X } from 'lucide-react';
import type { Module } from '../../api/api/modules';
import type { Filiere } from '../../services/api/academicStructure';
import { formatBytes } from '../../utils/format';

export interface CourseFileUploadFormProps {
  modules: Module[];
  filieres: Filiere[];
  isSubmitting: boolean;
  onSubmit: (payload: {
    file: File;
    filiere_id: number;
    module_id: number;
    title?: string;
    description?: string;
  }) => void;
}

export default function CourseFileUploadForm({
  modules,
  filieres,
  isSubmitting,
  onSubmit,
}: CourseFileUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [filiereId, setFiliereId] = useState<string>('');
  const [moduleId, setModuleId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prefer modules embedded in the selected filiere (already eager-loaded by the backend
  // via Filiere::with('modules')). Fall back to filtering the flat list only if the
  // filiere has no embedded modules (safety net for older API responses).
  const selectedFiliere = filiereId ? filieres.find((f) => f.id === Number(filiereId)) : undefined;
  const filteredModules: { id: number; code: string; label: string; filiere_id?: number }[] = filiereId
    ? (selectedFiliere?.modules?.length ?? 0) > 0
      ? (selectedFiliere!.modules as { id: number; code: string; label: string; filiere_id?: number }[])
      : modules.filter((m) => m.filiere_id === Number(filiereId))
    : [];


  const handleFile = useCallback((selectedFile: File | null) => {
    if (!selectedFile) return;
    setFile(selectedFile);

    // Auto-fill title without extension
    const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
    if (!title) {
      setTitle(nameWithoutExt);
    }
  }, [title]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !filiereId || !moduleId) return;
    onSubmit({
      file,
      filiere_id: Number(filiereId),
      module_id: Number(moduleId),
      title: title.trim() || undefined,
      description: description.trim() || undefined,
    });
  };



  return (
    <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden transition-all">
      <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-800">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Upload className="h-5 w-5 text-primary-600" />
          </div>
          Nouveau fichier de cours
        </CardTitle>
        <p className="text-sm text-gray-500 mt-1.5">
          Partagez un document pour une filière et un module spécifiques.
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Drag & Drop Zone */}
          <div
            className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors cursor-pointer
             ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'}
             ${file ? 'border-success-500 bg-success-50/10' : ''}
             `}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            {!file ? (
              <>
                <div className="p-4 bg-primary-50 rounded-full mb-3">
                  <Upload className="h-8 w-8 text-primary-500" />
                </div>
                <p className="text-sm font-medium text-gray-700">Cliquez ou glissez-déposez votre fichier ici</p>
                <p className="text-xs text-gray-500 mt-1">PDF, Word, Excel, PowerPoint, MP4, etc. (Max: 50MB)</p>
              </>
            ) : (
              <div className="flex items-center gap-4 w-full bg-white p-4 rounded-lg shadow-sm border border-gray-100" onClick={(e) => e.stopPropagation()}>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <FileIcon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="filiere" className="text-sm font-medium text-gray-700">Filière <span className="text-red-500">*</span></Label>
              <select
                id="filiere"
                className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                value={filiereId}
                onChange={(e) => {
                  setFiliereId(e.target.value);
                  setModuleId('');
                }}
                required
              >
                <option value="">Sélectionnez une filière</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="module" className="text-sm font-medium text-gray-700">Module <span className="text-red-500">*</span></Label>
              <select
                id="module"
                className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                disabled={!filiereId}
                required
              >
                <option value="">{filiereId ? 'Sélectionnez un module' : "Sélectionnez d'abord une filière"}</option>
                {filteredModules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} — {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">Titre affiché <span className="text-gray-400 font-normal">(Optionnel)</span></Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. Support de cours - Chapitre 1"
              className="h-11 rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description <span className="text-gray-400 font-normal">(Optionnel)</span></Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Ajoutez des détails sur le fichier..."
              className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !file || !filiereId || !moduleId}
              className="h-11 px-8 rounded-lg shadow-sm font-medium"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Envoi en cours...
                </span>
              ) : 'Téléverser le fichier'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
