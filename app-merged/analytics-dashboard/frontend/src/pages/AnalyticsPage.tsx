import React, { useEffect, useState } from 'react';
import FiltersPanel from '../components/filters/FiltersPanel';
import StatCard from '../components/cards/StatCard';
import NotesEvolutionChart from '../components/charts/NotesEvolutionChart';
import SuccessRateChart from '../components/charts/SuccessRateChart';
import AbsenceChart from '../components/charts/AbsenceChart';
import AnalyticsTable from '../components/table/AnalyticsTable';
import { fetchAnalyticsData } from '../services/api';

const AnalyticsPage: React.FC = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadAnalyticsData = async (filters = {}) => {
        setLoading(true);
        try {
            const data = await fetchAnalyticsData(filters);
            setAnalyticsData(data);
            setError(null);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnalyticsData();
    }, []);

    if (loading) {
        return (
            <main className="analytics-shell">
                <section className="analytics-hero">
                    <div>
                        <p className="analytics-eyebrow">Analytics</p>
                        <h1 className="analytics-title">Vue d'ensemble academique</h1>
                        <p className="analytics-subtitle">Preparation du tableau de bord et aggregation des indicateurs.</p>
                    </div>
                </section>
                <div className="analytics-loading-card">Chargement du tableau de bord...</div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="analytics-shell">
                <section className="analytics-hero">
                    <div>
                        <p className="analytics-eyebrow">Analytics</p>
                        <h1 className="analytics-title">Vue d'ensemble academique</h1>
                    </div>
                </section>
                <div className="analytics-error-card">Erreur de chargement: {error.message}</div>
            </main>
        );
    }

    const statCards = [
        { title: 'Total notes', value: analyticsData.totalNotes, description: 'Volume total d evaluations consolide.' },
        { title: 'Moyenne generale', value: analyticsData.average, description: 'Performance moyenne sur la periode en cours.' },
        { title: 'Taux de reussite', value: analyticsData.successRate, description: 'Part des apprenants au-dessus du seuil de validation.' },
        { title: 'Nombre d absences', value: analyticsData.absences, description: 'Absences cumulees pour les filtres actifs.' },
    ];

    return (
        <main className="analytics-shell">
            <section className="analytics-hero">
                <div>
                    <p className="analytics-eyebrow">Analytics</p>
                    <h1 className="analytics-title">Vue d'ensemble academique</h1>
                    <p className="analytics-subtitle">Une interface plus claire pour lire les signaux importants sans perdre le fil.</p>
                </div>
                <div className="analytics-chip">Lecture en direct</div>
            </section>

            <FiltersPanel onFilterChange={loadAnalyticsData} />

            <section className="analytics-stats-grid">
                {statCards.map((card) => (
                    <StatCard
                        key={card.title}
                        title={card.title}
                        value={card.value}
                        description={card.description}
                    />
                ))}
            </section>

            <section className="analytics-charts-grid">
                <div className="analytics-surface">
                    <div className="analytics-surface-header">
                        <div>
                            <p className="analytics-surface-kicker">Tendance</p>
                            <h2 className="analytics-surface-title">Evolution des notes</h2>
                        </div>
                    </div>
                    <NotesEvolutionChart data={analyticsData.notesEvolution} />
                </div>

                <div className="analytics-surface">
                    <div className="analytics-surface-header">
                        <div>
                            <p className="analytics-surface-kicker">Performance</p>
                            <h2 className="analytics-surface-title">Taux de reussite</h2>
                        </div>
                    </div>
                    <SuccessRateChart data={analyticsData.successRateData} />
                </div>

                <div className="analytics-surface analytics-surface-wide">
                    <div className="analytics-surface-header">
                        <div>
                            <p className="analytics-surface-kicker">Presence</p>
                            <h2 className="analytics-surface-title">Absences observees</h2>
                        </div>
                    </div>
                    <AbsenceChart data={analyticsData.absenceData} />
                </div>
            </section>

            <section className="analytics-surface">
                <div className="analytics-surface-header">
                    <div>
                        <p className="analytics-surface-kicker">Detail</p>
                        <h2 className="analytics-surface-title">Lignes de donnees</h2>
                    </div>
                </div>
                <AnalyticsTable data={analyticsData.records || []} loading={false} columns={[]} />
            </section>
        </main>
    );
};

export default AnalyticsPage;
