import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import NiveauList from './NiveauList';
import NiveauForm from './NiveauForm';
import niveauService from '../../services/niveauService';
import { Loader2, AlertCircle } from 'lucide-react';

export default function Niveaux() {
  const [view, setView] = useState('list'); // 'list', 'add', 'edit'
  const [selectedNiveau, setSelectedNiveau] = useState(null);
  const queryClient = useQueryClient();

  // Queries
  const { data: niveaux, isLoading, error } = useQuery({
    queryKey: ['niveaux'],
    queryFn: niveauService.getAll
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: niveauService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['niveaux'] });
      setView('list');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => niveauService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['niveaux'] });
      setView('list');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: niveauService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['niveaux'] });
    }
  });

  const handleAdd = () => {
    setSelectedNiveau(null);
    setView('add');
  };

  const handleEdit = (niveau) => {
    setSelectedNiveau(niveau);
    setView('edit');
  };

  const handleBack = () => {
    setView('list');
    setSelectedNiveau(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce niveau ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSave = (formData) => {
    if (view === 'add') {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate({ id: selectedNiveau.id, data: formData });
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
        <p className="text-muted-foreground">{error.standardizedMessage || "Impossible de charger les niveaux"}</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {view === 'list' && (
        <NiveauList 
          niveaux={niveaux || []} 
          onAdd={handleAdd} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
        />
      )}
      
      {(view === 'add' || view === 'edit') && (
        <NiveauForm
          key={selectedNiveau ? `niveau-${selectedNiveau.id}` : 'niveau-add'}
          niveau={selectedNiveau}
          onSave={handleSave}
          onCancel={handleBack}
          mode={view}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
