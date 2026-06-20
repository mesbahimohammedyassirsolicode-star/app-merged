import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TeacherList from './TeacherList';
import TeacherDetail from './TeacherDetail';
import TeacherForm from './TeacherForm';
import enseignantService from '../../services/enseignantService';
import { Loader2, AlertCircle } from 'lucide-react';

export default function Teachers() {
  const [view, setView] = useState('list'); // 'list', 'detail', 'form'
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const queryClient = useQueryClient();

  // Queries
  const { data: teachers, isLoading, error } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => enseignantService.getAll()
  });

  const { data: selectedTeacher, isLoading: isTeacherLoading } = useQuery({
    queryKey: ['teacher', selectedTeacherId],
    queryFn: () => enseignantService.getById(selectedTeacherId),
    enabled: !!selectedTeacherId
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: enseignantService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setView('list');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => enseignantService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', selectedTeacherId] });
      setView('list');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: enseignantService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    }
  });

  const handleAdd = () => {
    setSelectedTeacherId(null);
    setView('form');
  };

  const handleEdit = (teacher) => {
    setSelectedTeacherId(teacher.id);
    setView('form');
  };

  const handleView = (teacher) => {
    setSelectedTeacherId(teacher.id);
    setView('detail');
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet enseignant ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSave = (teacherData) => {
    if (selectedTeacherId) {
      updateMutation.mutate({ id: selectedTeacherId, data: teacherData });
    } else {
      createMutation.mutate(teacherData);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-semibold">Erreur de chargement</h2>
        <p className="text-muted-foreground">{error.standardizedMessage || "Impossible de charger les enseignants"}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {view === 'list' && (
        <TeacherList 
          teachers={teachers || []} 
          onView={handleView} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
          onAdd={handleAdd} 
        />
      )}

      {view === 'detail' && (
        isTeacherLoading ? (
          <div className="h-[70vh] flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <TeacherDetail 
            teacher={selectedTeacher} 
            onBack={() => setView('list')} 
          />
        )
      )}

      {view === 'form' && (
        <TeacherForm 
          teacher={selectedTeacher} 
          onSave={handleSave} 
          onCancel={() => setView('list')} 
          isLoading={createMutation.isPending || updateMutation.isPending}
          apiError={selectedTeacherId ? updateMutation.error : createMutation.error}
        />
      )}
    </div>
  );
}
