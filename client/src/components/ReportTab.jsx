import { useState, useEffect } from 'react';
import * as api from '../services/api';
import './ReportTab.css';

function ReportTab({ investigationId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadReport();
  }, [investigationId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await api.getReport(investigationId);
      setReport(response.data);
      setError('');
    } catch (err) {
      setError(`Failed to load report: ${err.response?.data?.error || err.message}`);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.generateReport(investigationId);
      setSuccess('Report generated successfully!');
      setReport(response.data);
      setTimeout(() => setSuccess(''), 5000);
      // Reload report info
      setTimeout(() => loadReport(), 1000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      const hint = err.response?.data?.hint;
      setError(`${errorMsg}${hint ? ': ' + hint : ''}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!report?.latestReport) {
      setError('No report available to download');
      return;
    }

    try {
      const response = await api.downloadReport(investigationId, report.latestReport.reportId);
      
      // Create blob from array buffer
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = report.latestReport.pdfFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Failed to download report: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="report-tab-container">
        <div className="loading">Loading report status...</div>
      </div>
    );
  }

  return (
    <div className="report-tab-container">
      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="success-message">
          <span>✓ {success}</span>
        </div>
      )}

      {/* Report Status Section */}
      <div className="report-section">
        <h3>Report Generation Status</h3>
        
        <div className="status-grid">
          <div className="status-card">
            <span className="status-label">Total Evidence</span>
            <span className="status-value">{report?.evidence?.total || 0}</span>
          </div>
          <div className="status-card">
            <span className="status-label">Analyzed Evidence</span>
            <span className="status-value">{report?.evidence?.analyzed || 0}</span>
          </div>
          <div className="status-card">
            <span className="status-label">Pending Analysis</span>
            <span className="status-value">{report?.evidence?.pending || 0}</span>
          </div>
          <div className="status-card">
            <span className="status-label">Report Status</span>
            <span className="status-value">
              {report?.latestReport ? '✓ Generated' : '○ Not Generated'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="button-group">
          <button
            className="btn btn-primary"
            onClick={handleGenerateReport}
            disabled={generating}
          >
            {generating ? '⏳ Generating...' : '📊 Generate Report'}
          </button>

          {report?.latestReport && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => alert(`Report ID: ${report.latestReport.reportId}\nGenerated: ${new Date(report.latestReport.generatedAt).toLocaleString()}`)}
              >
                👁️ Preview
              </button>
              <button
                className="btn btn-success"
                onClick={handleDownloadReport}
              >
                ⬇️ Download PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Latest Report Info */}
      {report?.latestReport && (
        <div className="report-section">
          <h3>Latest Report</h3>
          <div className="report-info">
            <div className="info-row">
              <span className="info-label">Report ID:</span>
              <span className="info-value">{report.latestReport.reportId}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Generated:</span>
              <span className="info-value">
                {new Date(report.latestReport.generatedAt).toLocaleString()}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Filename:</span>
              <span className="info-value">{report.latestReport.pdfFileName}</span>
            </div>
            {report.latestReport.metadata && (
              <>
                <div className="info-row">
                  <span className="info-label">Analysis Version:</span>
                  <span className="info-value">
                    {report.latestReport.metadata.generatedTimestamp ? 'Phase 3' : 'N/A'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Investigation Overview */}
      {report?.investigation && (
        <div className="report-section">
          <h3>Investigation Overview</h3>
          <div className="report-info">
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">{report.investigation.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Target:</span>
              <span className="info-value">{report.investigation.target}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Investigator:</span>
              <span className="info-value">{report.investigation.investigator}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Period:</span>
              <span className="info-value">
                {new Date(report.investigation.startDate).toLocaleDateString()} to{' '}
                {report.investigation.endDate ? new Date(report.investigation.endDate).toLocaleDateString() : 'Ongoing'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Summary */}
      {report?.analysis && (
        <div className="report-section">
          <h3>Analysis Summary</h3>
          <div className="analysis-grid">
            <div className="analysis-card">
              <span className="analysis-label">Positive Sentiment</span>
              <span className="analysis-value">{report.analysis.sentiment?.positive || 0}</span>
            </div>
            <div className="analysis-card">
              <span className="analysis-label">Neutral Sentiment</span>
              <span className="analysis-value">{report.analysis.sentiment?.neutral || 0}</span>
            </div>
            <div className="analysis-card">
              <span className="analysis-label">Negative Sentiment</span>
              <span className="analysis-value">{report.analysis.sentiment?.negative || 0}</span>
            </div>
            <div className="analysis-card">
              <span className="analysis-label">Top Topics</span>
              <span className="analysis-value">
                {report.analysis.topTopics ? report.analysis.topTopics.slice(0, 2).join(', ') : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!report?.latestReport && report?.evidence?.total > 0 && report?.evidence?.analyzed === 0 && (
        <div className="report-section info-section">
          <h3>ℹ️ Next Steps</h3>
          <p>To generate a forensic report:</p>
          <ol>
            <li>Go to the <strong>Analysis</strong> tab</li>
            <li>Click <strong>"Analyze Investigation"</strong> to analyze all evidence</li>
            <li>Return to the <strong>Report</strong> tab</li>
            <li>Click <strong>"Generate Report"</strong></li>
          </ol>
        </div>
      )}
    </div>
  );
}

export default ReportTab;
