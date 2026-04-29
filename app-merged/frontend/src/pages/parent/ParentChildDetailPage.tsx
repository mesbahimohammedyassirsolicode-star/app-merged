import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { parentApi } from '../../api/api/parent';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { getApiErrorMessage } from '../../lib/api-error';

export default function ParentChildDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['parent', 'child', user?.id, user?.role, id],
    queryFn: () => parentApi.getChildDetails(Number(id)),
    enabled: !!id,
  });

  useEffect(() => {
    if (error) toast.error(getApiErrorMessage(error, 'Erreur chargement.'));
  }, [error]);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/parent/children')}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>
      {isLoading || !data?.child ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-gray-900">{data.child.name ?? `Enfant #${id}`}</h1>
          <p className="text-sm text-gray-600">
            {data.child.filiere?.label ?? 'Filière non définie'}
            {data.child.groups.length ? ` · ${data.child.groups.map((g) => g.label ?? 'Groupe').join(', ')}` : ''}
          </p>
          <Card>
            <CardHeader>
              <CardTitle>Notes récentes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {Array.isArray(data.notes) && data.notes.length > 0 ? (
                <ul className="space-y-1">
                  {data.notes.slice(0, 10).map((g) => (
                    <li key={g.id}>{g.evaluation?.label ?? 'Note'} : {g.value}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Aucune note.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Emploi du temps</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {Array.isArray(data.timetable) && data.timetable.length > 0 ? (
                <ul className="space-y-2">
                  {data.timetable.slice(0, 8).map((row) => (
                    <li key={row.id} className="rounded-lg border border-gray-200 px-3 py-2">
                      <p className="font-medium text-gray-800">{row.module?.label ?? 'Module'}</p>
                      <p className="text-gray-600">{row.date} · {row.start_time} - {row.end_time}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Aucune séance planifiée.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Absences</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {Array.isArray(data.absences) && data.absences.length > 0 ? (
                <ul className="space-y-2">
                  {data.absences.slice(0, 10).map((row) => (
                    <li key={row.id} className="rounded-lg border border-gray-200 px-3 py-2">
                      <p className="font-medium text-gray-800">{row.module?.label ?? 'Module'}</p>
                      <p className="text-gray-600">{row.date} · {row.group?.label ?? 'Groupe non défini'}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Aucune absence.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
