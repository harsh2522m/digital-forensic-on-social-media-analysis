import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function SentimentChart({ summary }) {
  const data = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [
      {
        label: 'Evidence Count',
        data: [
          summary.sentimentDistribution.positive,
          summary.sentimentDistribution.neutral,
          summary.sentimentDistribution.negative,
        ],
        backgroundColor: ['#10b981', '#6b7280', '#ef4444'],
        borderColor: ['#10b981', '#6b7280', '#ef4444'],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#e5e7eb', font: { size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const percentage = summary.sentimentPercentages[
              context.label.toLowerCase() + 'Percent'
            ];
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="chart-container">
      <Pie data={data} options={options} />
      <div className="chart-stats">
        <div className="stat">
          <span className="stat-label">Positive:</span>
          <span className="stat-value" style={{ color: '#10b981' }}>
            {summary.sentimentPercentages.positivePercent}%
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Neutral:</span>
          <span className="stat-value" style={{ color: '#6b7280' }}>
            {summary.sentimentPercentages.neutralPercent}%
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Negative:</span>
          <span className="stat-value" style={{ color: '#ef4444' }}>
            {summary.sentimentPercentages.negativePercent}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default SentimentChart;
