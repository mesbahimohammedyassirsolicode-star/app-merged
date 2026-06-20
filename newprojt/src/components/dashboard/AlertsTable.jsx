import { cn } from '../../lib/utils';

const alerts = [
  { id: 1, type: 'Absence Prolongée', student: 'Amine B.', date: '11 Mai', status: 'Urgent', color: 'text-rose-500 bg-rose-500/10' },
  { id: 2, type: 'Impayé', student: 'Sarah M.', date: '10 Mai', status: 'En attente', color: 'text-amber-500 bg-amber-500/10' },
  { id: 3, type: 'Performance', student: 'Youssef A.', date: '09 Mai', status: 'Suivi', color: 'text-blue-500 bg-blue-500/10' },
  { id: 4, type: 'Discipline', student: 'Lina K.', date: '08 Mai', status: 'Réglé', color: 'text-emerald-500 bg-emerald-500/10' },
];

export default function AlertsTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase text-muted-foreground border-b border-border">
          <tr>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Élève</th>
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {alerts.map((alert) => (
            <tr key={alert.id} className="hover:bg-muted/30 transition-colors group">
              <td className="px-4 py-3 font-medium text-foreground">{alert.type}</td>
              <td className="px-4 py-3 text-muted-foreground">{alert.student}</td>
              <td className="px-4 py-3 text-muted-foreground">{alert.date}</td>
              <td className="px-4 py-3">
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  alert.color
                )}>
                  {alert.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
