import { useNavigate } from 'react-router-dom';
import { Calendar, BookOpen, ClipboardCheck, PenLine, AlertTriangle } from 'lucide-react';
import type { TeacherDashboardData } from '../../api/dashboardService';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { EmptyState } from '../ui/empty-state';

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
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord - Formateur</h1>
        <p className="mt-1 text-sm text-slate-600">Bienvenue, {userName}.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-indigo-600" />
          Seances du jour
          </CardTitle>
        </CardHeader>
        <CardContent>
        {todays_sessions?.length > 0 ? (
          <ul className="divide-y divide-slate-200">
            {todays_sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-3">
                <span className="font-medium text-slate-800">{s.module}</span>
                <span className="text-sm text-slate-500">
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
          <BookOpen className="mr-2 h-5 w-5 text-indigo-600" />
          Modules assignes
          </CardTitle>
        </CardHeader>
        <CardContent>
        {assigned_modules?.length > 0 ? (
          <ul className="space-y-2">
            {assigned_modules.map((m) => (
              <li key={m.module_id} className="flex justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <span className="text-slate-700">{m.module_code} - {m.module_label}</span>
                <span className="text-slate-500">{m.groupes?.map((g) => g.label).join(', ') || '-'}</span>
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Filiere</p>
                <p className="font-semibold text-slate-800">
                  {teaching_scope.filiere?.code ?? '-'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Modules</p>
                <p className="font-semibold text-slate-800">{teaching_scope.modules_count}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Groupes</p>
                <p className="font-semibold text-slate-800">{teaching_scope.groups_count}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Stagiaires lies</p>
                <p className="font-semibold text-slate-800">{teaching_scope.stagiaires_count}</p>
              </div>
            </div>

            {teaching_scope.stagiaires?.length > 0 ? (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {teaching_scope.stagiaires.map((stagiaire) => (
                  <li
                    key={stagiaire.id}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
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
            <ClipboardCheck className="mr-2 h-5 w-5 text-indigo-600" />
            Presences a marquer (aujourd'hui)
            </CardTitle>
          </CardHeader>
          <CardContent>
          {attendance.pending_today?.length > 0 ? (
            <ul className="space-y-2">
              {attendance.pending_today.map((p) => (
                <li key={`${p.module_id}-${p.group_id}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <span className="text-slate-700">{p.module_code} - {p.module_label}</span>
                  <span className="text-slate-500">{p.group_label}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-emerald-700 font-medium">Aucune presence en attente pour aujourd'hui.</p>
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
                <li key={a.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <p className="font-medium text-slate-800">{a.student_name}</p>
                  <p className="text-slate-500">{a.module_code} - {a.group_label} - {a.date}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No data available" description="Aucune absence recente." />
          )}
          </CardContent>
        </Card>
      </div>

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
