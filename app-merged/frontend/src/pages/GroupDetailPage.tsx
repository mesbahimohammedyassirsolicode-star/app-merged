import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { groupsApi } from '../api/api/groups';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../lib/api-error';

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const groupId = id ? parseInt(id, 10) : NaN;
  const isValidId = !isNaN(groupId) && groupId > 0;
  const { data, isLoading, error } = useQuery({
    queryKey: ['groups', user?.id, user?.role, groupId],
    queryFn: () => groupsApi.get(groupId),
    enabled: isValidId,
  });

  useEffect(() => {
    if (error) toast.error(getApiErrorMessage(error, 'Erreur chargement du groupe.'));
  }, [error]);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/groups')}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
      ) : !isValidId ? (
        <p className="text-theme-text-secondary">ID de groupe invalide.</p>
      ) : error ? (
        <p className="text-theme-text-secondary">Impossible de charger le groupe.</p>
      ) : data ? (
        <Card>
          <CardHeader>
            <CardTitle>{data.label}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-theme-text-secondary">
            <p>Filière : {data.filiere?.label}</p>
            <p>Année : {data.annee_scolaire?.label ?? data.anneeScolaire?.label}</p>
            <p>Capacité : {data.capacity}</p>
            {data.stagiaires && <p>Inscrits : {data.stagiaires.length}</p>}
            <Button size="sm" className="mt-2" onClick={() => navigate(`/groups/${data.id}/attendance-summary`)}>
              Voir présences (à risque)
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
