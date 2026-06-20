import { useNavigate } from 'react-router-dom';
import { Calendar, BookOpen, ClipboardCheck, PenLine, AlertTriangle } from 'lucide-react';
import type { TeacherDashboardData } from '../../api/dashboardService';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { StatCard } from './StatCard';
import { StudentsAtRiskWidget } from '../../features/analytics/widgets/StudentsAtRiskWidget';

interface TeacherDashboardProps {
  data: TeacherDashboardData;
  userName: string;
}

export default function TeacherDashboard({ data, userName }: TeacherDashboardProps) {
  const navigate = useNavigate();
  const { todays_sessions, assigned_modules, attendance, teaching_scope } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-theme-text-primary">Tableau de bord - Formateur</h1>
        <p className="mt-1 text-sm text-theme-text-secondary">Bienvenue, {userName}.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-indigo-400" />
          Seances du jour
          </CardTitle>
        </CardHeader>
        <CardContent>
        {todays_sessions?.length > 0 ? (
          <ul className="divide-y divide-theme-border">
            {todays_sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-3">
                <span className="font-medium text-theme-text-primary">{s.module}</span>
                <span className="text-sm text-theme-text-secondary">
                  {s.groupe} - {String(s.start_time).slice(0, 5)} - {String(s.end_time).slice(0, 5)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No data available" description="Aucune seance aujourd'hui." />
        )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
          <BookOpen className="mr-2 h-5 w-5 text-indigo-400" />
          Modules assignes
          </CardTitle>
        </CardHeader>
        <CardContent>
        {assigned_modules?.length > 0 ? (
          <ul className="space-y-2">
            {assigned_modules.map((m) => (
              <li key={m.module_id} className="flex justify-between rounded-lg border border-theme-border px-3 py-2 text-sm">
                <span className="text-theme-text-primary">{m.module_code} - {m.module_label}</span>
                <span className="text-theme-text-secondary">{m.groupes?.map((g) => g.label).join(', ') || '-'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No data available" description="Aucun module assigne." />
        )}
        </CardContent>
      </Card>

      {teaching_scope && (
        <Card>
          <CardHeader>
            <CardTitle>Perimetre pedagogique</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Filiere"
                value={teaching_scope.filiere?.code ?? '-'}
                icon={<BookOpen className="h-6 w-6" />}
                colorTheme="orange"
                delay={0.1}
              />
              <StatCard
                title="Modules"
                value={teaching_scope.modules_count}
                icon={<BookOpen className="h-6 w-6" />}
                colorTheme="blue"
                delay={0.2}
              />
              <StatCard
                title="Groupes"
                value={teaching_scope.groups_count}
                icon={<ClipboardCheck className="h-6 w-6" />}
                colorTheme="purple"
                delay={0.3}
              />
              <StatCard
                title="Stagiaires lies"
                value={teaching_scope.stagiaires_count}
                icon={<Calendar className="h-6 w-6" />}
                colorTheme="emerald"
                delay={0.4}
              />
            </div>

            {teaching_scope.stagiaires?.length > 0 ? (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {teaching_scope.stagiaires.map((stagiaire) => (
                  <li
                    key={stagiaire.id}
                    className="rounded-lg border border-theme-border px-3 py-2 text-sm text-theme-text-primary"
                  >
                    {stagiaire.name}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No data available" description="Aucun stagiaire lie a ce formateur." />
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
            <ClipboardCheck className="mr-2 h-5 w-5 text-indigo-400" />
            Presences a marquer (aujourd'hui)
            </CardTitle>
          </CardHeader>
          <CardContent>
          {attendance.pending_today?.length > 0 ? (
            <ul className="space-y-2">
              {attendance.pending_today.map((p) => (
                <li key={`${p.module_id}-${p.group_id}`} className="flex items-center justify-between rounded-lg border border-theme-border px-3 py-2 text-sm">
                  <span className="text-theme-text-primary">{p.module_code} - {p.module_label}</span>
                  <span className="text-theme-text-secondary">{p.group_label}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-emerald-400 font-medium">Aucune presence en attente pour aujourd'hui.</p>
          )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-amber-600" />
            Absences recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
          {attendance.recent_absences?.length > 0 ? (
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {attendance.recent_absences.map((a) => (
                <li key={a.id} className="rounded-lg border border-theme-border px-3 py-2 text-sm">
                  <p className="font-medium text-theme-text-primary">{a.student_name}</p>
                  <p className="text-theme-text-secondary">{a.module_code} - {a.group_label} - {a.date}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No data available" description="Aucune absence recente." />
          )}
          </CardContent>
        </Card>
      </div>

      <StudentsAtRiskWidget scope="teacher" limit={5} />

      <Card>
        <CardHeader>
          <CardTitle>Raccourcis</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/attendance')}>
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Marquer les presences
          </Button>
          <Button variant="outline" onClick={() => navigate('/evaluations')}>
            <PenLine className="mr-2 h-4 w-4" />
            Saisir les notes
          </Button>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
