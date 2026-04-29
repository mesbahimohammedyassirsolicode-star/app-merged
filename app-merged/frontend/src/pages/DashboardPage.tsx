import { useQuery } from '@tanstack/react-query';
import ParentDashboard from '../components/dashboard/ParentDashboard';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import StudentDashboard from '../components/dashboard/StudentDashboard';
import TeacherDashboard from '../components/dashboard/TeacherDashboard';
import { useAuth } from '../hooks/useAuth';
import { dashboardService } from '../api/dashboardService';
import type {
    AdminDashboardData,
    ParentDashboardData,
    StudentDashboardData,
    TeacherDashboardData,
} from '../api/dashboardService';
import { getApiErrorMessage } from '../lib/api-error';
import { LoadingSkeleton } from '../components/ui/loading-skeleton';

export default function DashboardPage() {
    const { user } = useAuth();
    const { data, isLoading, error } = useQuery({
        queryKey: ['dashboard', user?.id],
        queryFn: () => dashboardService.getDashboard(user?.role ?? undefined),
        enabled: !!user,
    });

    if (!user) {
        return <div className="p-6 text-gray-500">Veuillez vous connecter.</div>;
    }

    if (isLoading) {
        return (
            <LoadingSkeleton />
        );
    }

    if (error || !data) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        const errMessage = error ? getApiErrorMessage(error, 'Erreur de chargement du tableau de bord.') : undefined;

        return (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
                <p>
                    {status === 401
                        ? 'Non authentifie: veuillez vous reconnecter.'
                        : status === 403
                            ? 'Acces interdit: role non autorise pour ce tableau de bord.'
                            : 'Erreur de chargement du tableau de bord. Reessayez plus tard.'}
                </p>
                {errMessage && <p className="mt-2 text-sm font-mono text-rose-600">{errMessage}</p>}
            </div>
        );
    }

    const role = data.role;
    const payload = data.data as unknown;
    const userName = user.name ?? '';

    switch (role) {
        case 'admin':
        case 'directeur':
        case 'secretariat':
            return <AdminDashboard data={payload as AdminDashboardData} userName={userName} />;
        case 'teacher':
        case 'formateur':
            return <TeacherDashboard data={payload as TeacherDashboardData} userName={userName} />;
        case 'student':
        case 'stagiaire':
            return <StudentDashboard data={payload as StudentDashboardData} userName={userName} />;
        case 'parent':
            return <ParentDashboard data={payload as ParentDashboardData} userName={userName} />;
        default:
            return (
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
                    <p className="text-gray-600 mt-2">Role non reconnu ou donnees indisponibles.</p>
                </div>
            );
    }
}
