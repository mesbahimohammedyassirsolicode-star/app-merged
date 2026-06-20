import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { useAnalyticsChartTheme } from '../../hooks/useAnalyticsChartTheme';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface SuccessRateChartProps {
    data: {
        labels: string[];
        values: number[];
    };
}

const SuccessRateChart: React.FC<SuccessRateChartProps> = ({ data }) => {
    const theme = useAnalyticsChartTheme();
    const chartData = {
        labels: data.labels,
        datasets: [
            {
                label: 'Taux de reussite',
                data: data.values,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.14)',
                borderWidth: 3,
                pointBackgroundColor: '#2563eb',
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
                callbacks: {
                    label: (tooltipItem: any) => `${tooltipItem.dataset.label}: ${tooltipItem.raw}%`,
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: theme.grid,
                },
                ticks: {
                    color: theme.textSecondary,
                    callback: (value: number) => `${value}%`,
                },
            },
            x: {
                grid: {
                    color: theme.grid,
                },
                ticks: {
                    color: theme.textSecondary,
                },
            },
        },
    };

    return <div className="h-72 w-full"><Line data={chartData} options={options} /></div>;
};

export default SuccessRateChart;
