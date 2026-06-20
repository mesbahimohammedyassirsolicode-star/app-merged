import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { EmptyState } from '../../../components/ui/empty-state';
import { ListSkeleton } from '../../../components/ui/loading-skeleton';
import { ErrorBoundary } from '../../../components/ui/error-boundary';
import type { AnalyticsFiltersContract } from '../contracts';
import { useStudentsAtRiskWidget } from '../hooks/useStudentsAtRiskWidget';
import type { AnalyticsScope } from '../hooks/useAnalyticsOverview';

interface StudentsAtRiskWidgetProps {
  scope: AnalyticsScope;
  filters?: AnalyticsFiltersContract;
  limit?: number;
}

function StudentsAtRiskWidgetContent({ scope, filters, limit }: StudentsAtRiskWidgetProps) {
  const { students, isLoading, isError, error } = useStudentsAtRiskWidget({
    scope,
    filters,
    limit,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI - Etudiants a risque</CardTitle>
        </CardHeader>
        <CardContent>
          <ListSkeleton rows={3} />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    throw error ?? new Error('Erreur de chargement des etudiants a risque.');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          AI - Etudiants a risque
        </CardTitle>
      </CardHeader>
      <CardContent>
        {students.length ? (
          <ul className="space-y-2">
            {students.map((student) => (
              <li key={student.student_id} className="rounded-lg border border-theme-border px-3 py-2 text-sm">
                <p className="font-medium text-theme-text-primary">
                  #{student.risk_rank} {student.student_name}
                </p>
                <p className="text-theme-text-secondary">
                  Score risque: {student.risk_score} | Prediction: {student.prediction} | Note: {student.average_grade}
                  /20
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No data available" description="Aucun risque detecte sur votre perimetre." />
        )}
      </CardContent>
    </Card>
  );
}

export function StudentsAtRiskWidget(props: StudentsAtRiskWidgetProps) {
  return (
    <ErrorBoundary>
      <StudentsAtRiskWidgetContent {...props} />
    </ErrorBoundary>
  );
}
