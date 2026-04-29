import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seancesApi } from '../api/api/seances';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../lib/api-error';

export default function SeanceRollCallPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [localStatus, setLocalStatus] = useState<Record<number, string>>({});

  const { data: rollCall, isLoading, error } = useQuery({
    queryKey: ['seances', user?.id, user?.role, id, 'roll-call'],
    queryFn: () => seancesApi.getRollCall(Number(id)),
    enabled: !!id,
  });

  const submit = useMutation({
    mutationFn: (attendances: { stagiaire_id: number; status: string }[]) =>
      seancesApi.submitRollCall(Number(id), attendances),
    onSuccess: () => {
      toast.success('Présences enregistrées.');
      qc.invalidateQueries({ queryKey: ['seances', user?.id, user?.role, id, 'roll-call'] });
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Erreur enregistrement.')),
  });

  useEffect(() => {
    if (error) toast.error(getApiErrorMessage(error, 'Erreur chargement de l\'appel.'));
  }, [error]);

  const [prevRollCall, setPrevRollCall] = useState(rollCall);

  if (rollCall !== prevRollCall) {
    setPrevRollCall(rollCall);
    if (rollCall?.length) {
      const next: Record<number, string> = {};
      for (const r of rollCall) {
        next[r.stagiaire.id] = r.status ?? 'present';
      }
      setLocalStatus(next);
    }
  }

  const rows = rollCall ?? [];
  const statusByStagiaire = rows.reduce<Record<number, string>>((acc, r) => {
    acc[r.stagiaire.id] = localStatus[r.stagiaire.id] ?? r.status ?? 'present';
    return acc;
  }, {});

  const handleSubmit = () => {
    const attendances = Object.entries(statusByStagiaire).map(([sid, status]) => ({
      stagiaire_id: Number(sid),
      status,
    }));
    submit.mutate(attendances);
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/attendance/seances')}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>
      <h1 className="text-2xl font-bold text-gray-900">Appel — Séance #{id}</h1>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Présences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {rows.map((r) => (
                <div key={r.stagiaire.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span>{r.stagiaire.user?.name ?? `#${r.stagiaire.id}`}</span>
                  <select
                    value={statusByStagiaire[r.stagiaire.id] ?? 'present'}
                    onChange={(e) => setLocalStatus((s) => ({ ...s, [r.stagiaire.id]: e.target.value }))}
                    className="rounded border px-2 py-1 text-sm"
                  >
                    <option value="present">Présent</option>
                    <option value="absent">Absent</option>
                    <option value="retard">Retard</option>
                  </select>
                </div>
              ))}
            </CardContent>
          </Card>
          <Button onClick={handleSubmit} disabled={submit.isPending}>
            Enregistrer l'appel
          </Button>
        </>
      )}
    </div>
  );
}
