import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
// WHY: Use path aliases as configured in vite.config.ts for cleaner imports
import { parentApi } from '@/api/api/parent';
import StagiaireSelector from '@/components/parent/StagiaireSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getApiErrorMessage } from '@/lib/api-error';

// BEFORE: All state (`selectedIds`) and data fetching was clumped in the parent component.
// When `parentId` changed, a `useEffect` was triggered to reset `selectedIds`, which is an anti-pattern.
// AFTER: We extract the Stagiaire assignment logic into a separate component.
// WHY: This allows us to use the `key` prop on it to automatically reset its internal state when `parentId` changes.
function ParentStagiaireManager({ parentId }: { parentId: number }) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<number[] | null>(null);

  const { data: rows, isLoading: loadingStagiaires } = useQuery({
    queryKey: ['admin', 'parent-links', 'linkable-stagiaires', parentId],
    queryFn: () => parentApi.getAdminLinkableStagiaires(parentId),
  });

  // BEFORE: useEffect(() => { setSelectedIds(...) }, [rows])
  // AFTER: Render-phase state update.
  // WHY: This avoids a double-render commit and eliminates `react-hooks/set-state-in-effect` violations.
  if (rows && selectedIds === null) {
    setSelectedIds(rows.filter((r) => r.linked_to_me).map((r) => r.id));
  }

  const linkMutation = useMutation({
    mutationFn: (ids: number[]) => parentApi.adminLinkStagiaires(parentId, ids),
    onSuccess: () => {
      toast.success('Affectation enregistrée.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'parent-links', 'parents'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'parent-links', 'linkable-stagiaires', parentId] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Échec de l’affectation.'));
    },
  });

  const toggle = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const current = prev ?? [];
      return checked ? [...new Set([...current, id])] : current.filter((x) => x !== id);
    });
  };

  const busy = loadingStagiaires || linkMutation.isPending;
  const currentSelectedIds = selectedIds ?? [];

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Stagiaires</CardTitle>
        <CardDescription>La sauvegarde remplace la liste actuelle de ce parent.</CardDescription>
      </CardHeader>
      <CardContent>
        {loadingStagiaires ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          </div>
        ) : !rows?.length ? (
          <p className="py-8 text-center text-sm text-slate-500">Aucun stagiaire disponible.</p>
        ) : (
          <StagiaireSelector rows={rows} selectedIds={currentSelectedIds} onToggle={toggle} disabled={busy} />
        )}
        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            onClick={() => linkMutation.mutate(currentSelectedIds)}
            disabled={busy}
          >
            {linkMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer l’affectation'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminParentStagiaireLinkPage() {
  const [parentId, setParentId] = useState<number | null>(null);

  const { data: parentAccounts, isLoading: loadingParents } = useQuery({
    queryKey: ['admin', 'parent-links', 'parents'],
    queryFn: parentApi.getParentAccounts,
  });

  // BEFORE: useEffect(() => { if (!parentId) setParentId(parentAccounts[0].id) }, [parentAccounts])
  // AFTER: Derive `activeParentId` directly during render.
  // WHY: Prevents unnecessary side-effects and re-renders when data first loads.
  const activeParentId = parentId ?? parentAccounts?.[0]?.id ?? null;

  // WHY: Memoize the active parent lookup to prevent unnecessary recalcs on re-renders.
  const activeParent = useMemo(
    () => parentAccounts?.find((row) => row.id === activeParentId) ?? null,
    [parentAccounts, activeParentId],
  );

  const busy = loadingParents;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Affecter des stagiaires à un parent</h1>
        <p className="mt-1 text-sm text-slate-600">
          Sélectionnez un compte parent, puis cochez les stagiaires à rattacher à ce parent.
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Parent cible</CardTitle>
          <CardDescription>Seuls les administrateurs peuvent modifier ces affectations.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingParents ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : !parentAccounts?.length ? (
            <p className="text-sm text-slate-500">Aucun compte parent trouvé.</p>
          ) : (
            <div className="space-y-2">
              <select
                className="app-control w-full"
                value={activeParentId ?? ''}
                onChange={(e) => setParentId(Number(e.target.value))}
                disabled={busy}
              >
                {parentAccounts.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name ?? `Parent #${row.id}`} ({row.email ?? 'sans email'}) - {row.linked_children_count} lié(s)
                  </option>
                ))}
              </select>
              {activeParent ? (
                <p className="text-xs text-slate-500">
                  Parent sélectionné: {activeParent.name ?? `#${activeParent.id}`}
                </p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {/* WHY: The key prop completely unmounts and remounts ParentStagiaireManager when parent changes, giving it a fresh initial state. */}
      {activeParentId ? (
        <ParentStagiaireManager key={activeParentId} parentId={activeParentId} />
      ) : null}
    </div>
  );
}
