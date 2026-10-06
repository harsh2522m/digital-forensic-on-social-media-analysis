import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

function TimelineChart({ timelineData }) {
  if (!timelineData || !timelineData.sentimentTimeline || timelineData.sentimentTimeline.length === 0) {
    return <p className="empty-message">No timeline data available.</p>;
  }

  const { sentimentTimeline } = timelineData;

  const chartData = {
    labels: sentimentTimeline.map(t => t.date),
    datasets: [
      {
        label: 'Positive',
        data: sentimentTimeline.map(t => t.positive),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Neutral',
        data: sentimentTimeline.map(t => t.neutral),
        borderColor: '#6b7280',
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Negative',
        data: sentimentTimeline.map(t => t.negative),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
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
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#e5e7eb' },
        grid: { color: 'rgba(59, 130, 246, 0.1)' },
      },
      x: {
        ticks: { color: '#e5e7eb' },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="timeline-container">
      <Line data={chartData} options={options} />
      {timelineData.peakPeriods && timelineData.peakPeriods.length > 0 && (
        <div className="peak-periods">
          <h4>Peak Periods:</h4>
          {timelineData.peakPeriods.map((period, idx) => (
            <div key={idx} className="period-item">
              <span>{period.date}:</span>
              <strong>{period.count} records</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TimelineChart;
