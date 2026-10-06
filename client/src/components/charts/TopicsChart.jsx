import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function TopicsChart({ topics }) {
  if (!topics || Object.keys(topics).length === 0) {
    return <p className="empty-message">No topics classified.</p>;
  }

  const labels = Object.keys(topics);
  const data = Object.values(topics);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Percentage of Evidence',
        data,
        backgroundColor: '#3b82f6',
        borderColor: '#60a5fa',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.x}%`,
        },
      },
    },
    scales: {
      x: {
        max: 100,
        ticks: { color: '#e5e7eb' },
        grid: { color: 'rgba(59, 130, 246, 0.1)' },
      },
      y: {
        ticks: { color: '#e5e7eb' },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}

export default TopicsChart;
