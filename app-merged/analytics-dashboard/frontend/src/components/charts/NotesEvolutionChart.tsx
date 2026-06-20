import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { useAnalyticsChartTheme } from '../../hooks/useAnalyticsChartTheme';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface NotesEvolutionChartProps {
    data: {
        labels: string[];
        values: number[];
    };
}

const NotesEvolutionChart: React.FC<NotesEvolutionChartProps> = ({ data }) => {
    const theme = useAnalyticsChartTheme();
    const chartData = {
        labels: data.labels,
        datasets: [
            {
                label: 'Evolution des notes',
                data: data.values,
                borderColor: '#0f766e',
                backgroundColor: 'rgba(15, 118, 110, 0.14)',
                borderWidth: 3,
                pointBackgroundColor: '#0f766e',
                pointBorderColor: theme.surface,
                pointBorderWidth: 2,
                pointRadius: 4,
                tension: 0.35,
                fill: true,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: theme.textSecondary,
                    boxWidth: 12,
                    usePointStyle: true,
                },
            },
            tooltip: {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: 1,
                bodyColor: theme.text,
                titleColor: theme.text,
                mode: 'index' as const,
                intersect: false,
            },
        },
        scales: {
            x: {
                grid: {
                    color: theme.grid,
                },
                ticks: {
                    color: theme.textSecondary,
                },
                title: {
                    display: true,
                    color: theme.textSecondary,
                    text: 'Periode',
                },
            },
            y: {
                grid: {
                    color: theme.grid,
                },
                ticks: {
                    color: theme.textSecondary,
                },
                title: {
                    display: true,
                    color: theme.textSecondary,
                    text: 'Notes',
                },
                beginAtZero: true,
            },
        },
    };

    return (
        <div className="h-72 w-full">
            <Line data={chartData} options={options} />
        </div>
    );
};

export default NotesEvolutionChart;
