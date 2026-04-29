import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { courseFilesApi, type CourseFile } from '../services/api/courseFiles';
import { getApiErrorMessage } from '../lib/api-error';

export interface CourseFileFilters {
  groupe_id?: number;
  module_id?: number;
}

export function useCourseFiles(filters: CourseFileFilters) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['course-files', filters],
    queryFn: () => courseFilesApi.list({ ...filters, per_page: 50 }),
  });

  const uploadMutation = useMutation({
    mutationFn: courseFilesApi.upload,
    onSuccess: () => {
      toast.success('Fichier téléversé.');
      void queryClient.invalidateQueries({ queryKey: ['course-files'] });
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Echec du televersement.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => courseFilesApi.delete(id),
    onSuccess: () => {
      toast.success('Fichier supprimé.');
      void queryClient.invalidateQueries({ queryKey: ['course-files'] });
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Suppression impossible.')),
  });

  return {
    listQuery,
    uploadMutation,
    deleteMutation,
  };
}

export type { CourseFile };
