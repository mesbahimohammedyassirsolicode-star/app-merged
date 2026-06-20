import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ClassList from './ClassList';
import ClassForm from './ClassForm';
import ClassDetail from './ClassDetail';
import classeService from '../../services/classeService';
import { Loader2, AlertCircle } from 'lucide-react';

export default function Classes() {
  const [view, setView] = useState('list'); // 'list', 'add', 'edit', 'detail'
  const [selectedClassId, setSelectedClassId] = useState(null);
  const queryClient = useQueryClient();

  // Queries
  const { data: classes, isLoading, error } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classeService.getAll()
  });

  const { data: selectedClass, isLoading: isClassLoading } = useQuery({
    queryKey: ['classe', selectedClassId],
    queryFn: () => classeService.getById(selectedClassId),
    enabled: !!selectedClassId
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: classeService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setView('list');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => classeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['classe', selectedClassId] });
      setView('list');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: classeService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    }
  });

  const handleAdd = () => {
    setSelectedClassId(null);
    setView('add');
  };

  const handleEdit = (classe) => {
    setSelectedClassId(classe.id);
    setView('edit');
  };

  const handleViewDetail = (classe) => {
    setSelectedClassId(classe.id);
    setView('detail');
  };

  const handleBack = () => {
    setView('list');
    setSelectedClassId(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette classe ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSave = (formData) => {
    if (view === 'add') {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate({ id: selectedClassId, data: formData });
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
        <p className="text-muted-foreground">{error.standardizedMessage || "Impossible de charger les classes"}</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {view === 'list' && (
        <ClassList 
          classes={classes || []} 
          onAdd={handleAdd} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
          onView={handleViewDetail}
        />
      )}
      
      {(view === 'add' || view === 'edit') && (
        view === 'edit' && isClassLoading ? (
          <div className="h-[70vh] flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <ClassForm
            key={view === 'add' ? 'classe-add' : `classe-${selectedClassId}`}
            classe={view === 'add' ? null : selectedClass}
            onSave={handleSave}
            onCancel={handleBack}
            mode={view}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        )
      )}

      {view === 'detail' && (
        isClassLoading ? (
          <div className="h-[70vh] flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <ClassDetail 
            classe={selectedClass} 
            onBack={handleBack}
          />
        )
      )}
    </div>
  );
}
