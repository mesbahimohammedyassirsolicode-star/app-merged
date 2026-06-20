import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import StudentList from './StudentList';
import StudentDetail from './StudentDetail';
import StudentForm from './StudentForm';
import eleveService from '../../services/eleveService';
import { Loader2, AlertCircle } from 'lucide-react';

export default function Students() {
  const [view, setView] = useState('list'); // 'list', 'detail', 'add', 'edit'
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const queryClient = useQueryClient();

  // Queries
  const { data: students, isLoading, error } = useQuery({
    queryKey: ['students'],
    queryFn: () => eleveService.getAll()
  });

  const { data: selectedStudent, isLoading: isStudentLoading } = useQuery({
    queryKey: ['student', selectedStudentId],
    queryFn: () => eleveService.getById(selectedStudentId),
    enabled: !!selectedStudentId
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: eleveService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setView('list');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => eleveService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', selectedStudentId] });
      setView('list');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: eleveService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    }
  });

  const handleViewDetail = (student) => {
    setSelectedStudentId(student.id);
    setView('detail');
  };

  const handleAddStudent = () => {
    setSelectedStudentId(null);
    setView('add');
  };

  const handleEditStudent = (student) => {
    setSelectedStudentId(student.id);
    setView('edit');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedStudentId(null);
  };

  const handleDeleteStudent = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élève ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSaveStudent = (studentData) => {
    if (view === 'add') {
      createMutation.mutate(studentData);
    } else {
      updateMutation.mutate({ id: selectedStudentId, data: studentData });
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
        <p className="text-muted-foreground">{error.standardizedMessage || "Impossible de charger les élèves"}</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {view === 'list' && (
        <StudentList 
          students={students || []} 
          onView={handleViewDetail} 
          onEdit={handleEditStudent} 
          onDelete={handleDeleteStudent}
          onAdd={handleAddStudent}
        />
      )}
      
      {view === 'detail' && (
        isStudentLoading ? (
          <div className="h-[70vh] flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <StudentDetail 
            student={selectedStudent} 
            onBack={handleBackToList} 
            onEdit={() => setView('edit')}
          />
        )
      )}
      
      {(view === 'add' || view === 'edit') && (
        view === 'edit' && isStudentLoading ? (
          <div className="h-[70vh] flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <StudentForm
            key={view === 'add' ? 'student-add' : `student-${selectedStudentId}`}
            student={view === 'add' ? null : selectedStudent}
            onSave={handleSaveStudent}
            onCancel={handleBackToList}
            mode={view}
            isLoading={createMutation.isPending || updateMutation.isPending}
            apiError={view === 'add' ? createMutation.error : updateMutation.error}
          />
        )
      )}
    </div>
  );
}
