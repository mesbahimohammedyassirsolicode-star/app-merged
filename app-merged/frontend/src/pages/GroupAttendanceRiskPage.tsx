import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { groupsApi } from '../api/api/groups';
import { attendanceRiskApi } from '../api/api/attendanceRisk';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../lib/api-error';

const THRESHOLD = 80;

export default function GroupAttendanceRiskPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const groupId = Number(id);

  const { data: group } = useQuery({
    queryKey: ['groups', user?.id, user?.role, groupId],
    queryFn: () => groupsApi.get(groupId),
    enabled: !!groupId,
  });

  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['attendance-summary', user?.id, user?.role, groupId],
    queryFn: () => attendanceRiskApi.summaryByGroup(groupId, { annee_scolaire_id: group?.annee_scolaire_id }),
    enabled: !!groupId && !!group,
  });

  useEffect(() => {
    if (error) toast.error(getApiErrorMessage(error, 'Erreur chargement du resume de presences.'));
  }, [error]);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/groups')}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux groupes
      </Button>
      <h1 className="text-2xl font-bold text-gray-900">
        Présences — {group?.label ?? 'Groupe'} (seuil {THRESHOLD}%)
      </h1>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : !summary?.length ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center text-sm text-gray-500">
          Aucune donnee de presence disponible.
        </div>
      ) : (
        <div className="space-y-4">
          {summary?.map((row) => (
            <Card key={row.stagiaire_id} className={row.is_risk ? 'border-amber-200 bg-amber-50/50' : ''}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">
                  {row.stagiaire?.user?.name ?? `Stagiaire #${row.stagiaire_id}`}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {row.is_risk ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium bg-amber-100 text-amber-800">
                      <AlertTriangle className="w-4 h-4" /> À risque
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-4 h-4" /> OK
                    </span>
                  )}
                  <span className="text-sm text-gray-600">
                    Taux global : <strong>{row.global_rate_percent}%</strong>
                    {!row.can_sit_exam && (
                      <span className="ml-2 text-amber-700">(examen bloqué)</span>
                    )}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="text-gray-600 mb-2">Par module :</p>
                <ul className="space-y-1">
                  {row.by_affectation?.map((a) => (
                    <li key={a.affectation_id}>
                      {a.module ?? a.affectation_id} — {a.rate_percent}%
                      {a.is_risk && <span className="text-amber-600 ml-1">(à risque)</span>}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
