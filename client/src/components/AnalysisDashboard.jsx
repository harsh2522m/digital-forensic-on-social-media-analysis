import { useState, useEffect } from 'react';
import * as api from '../services/api';
import './AnalysisDashboard.css';
import SentimentChart from './charts/SentimentChart';
import KeywordsChart from './charts/KeywordsChart';
import TopicsChart from './charts/TopicsChart';
import TimelineChart from './charts/TimelineChart';

function AnalysisDashboard({ investigationId }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    loadAnalysis();
  }, [investigationId]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const response = await api.getAnalysis(investigationId);
      setAnalysis(response.data);
      setError('');
    } catch (err) {
      if (err.response?.status === 200 && err.response?.data?.message === 'No analysis results available') {
        setAnalysis(err.response.data);
      } else {
        setError(`Failed to load analysis: ${err.response?.data?.error || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setError('');

    try {
      const response = await api.analyzeInvestigation(investigationId);
      setAnalysis(response.data);
      await loadAnalysis(); // Reload to get full results
    } catch (err) {
      setError(`Analysis failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <div className="analysis-loading">Loading analysis...</div>;
  }

  if (error) {
    return <div className="analysis-error">{error}</div>;
  }

  if (!analysis) {
    return <div className="analysis-empty">No analysis data available</div>;
  }

  if (!analysis.hasAnalysis) {
    return (
      <div className="analysis-empty-state">
        <p>No evidence available for analysis.</p>
        <p className="text-muted">Add evidence to this investigation first, then run analysis.</p>
        <button className="btn-analyze" onClick={handleRunAnalysis} disabled={analyzing}>
          {analyzing ? '⏳ Running Analysis...' : '▶ Run Analysis'}
        </button>
      </div>
    );
  }

  const { summary, findings, timeline } = analysis;

  return (
    <div className="analysis-dashboard">
      {/* Header with Run Analysis Button */}
      <div className="analysis-header">
        <h2>Analysis Results</h2>
        <button 
          className="btn-analyze" 
          onClick={handleRunAnalysis}
          disabled={analyzing}
          title="Re-run analysis"
        >
          {analyzing ? '⏳ Analyzing...' : '🔄 Re-Analyze'}
        </button>
      </div>

      {/* Section Tabs */}
      <div className="analysis-tabs">
        <button
          className={`tab-button ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab-button ${activeSection === 'sentiment' ? 'active' : ''}`}
          onClick={() => setActiveSection('sentiment')}
        >
          😊 Sentiment
        </button>
        <button
          className={`tab-button ${activeSection === 'keywords' ? 'active' : ''}`}
          onClick={() => setActiveSection('keywords')}
        >
          🔤 Keywords
        </button>
        <button
          className={`tab-button ${activeSection === 'topics' ? 'active' : ''}`}
          onClick={() => setActiveSection('topics')}
        >
          📌 Topics
        </button>
        <button
          className={`tab-button ${activeSection === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveSection('timeline')}
        >
          📈 Timeline
        </button>
        <button
          className={`tab-button ${activeSection === 'findings' ? 'active' : ''}`}
          onClick={() => setActiveSection('findings')}
        >
          📋 Findings
        </button>
      </div>

      {/* Content Sections */}
      <div className="analysis-content">
        {/* Overview */}
        {activeSection === 'overview' && (
          <div className="section">
            <h3>Analysis Overview</h3>
            {summary && (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-label">Total Evidence</div>
                    <div className="stat-value">{summary.totalEvidence}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Analyzed</div>
                    <div className="stat-value">{summary.analyzedEvidence}/{summary.activeEvidence}</div>
                    <div className="stat-bar">
                      <div 
                        className="stat-bar-fill"
                        style={{ width: `${summary.analysisProgress}%` }}
                      />
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Positive</div>
                    <div className="stat-value" style={{ color: '#10b981' }}>
                      {summary.sentimentPercentages.positivePercent}%
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Neutral</div>
                    <div className="stat-value" style={{ color: '#6b7280' }}>
                      {summary.sentimentPercentages.neutralPercent}%
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Negative</div>
                    <div className="stat-value" style={{ color: '#ef4444' }}>
                      {summary.sentimentPercentages.negativePercent}%
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Avg Relevance</div>
                    <div className="stat-value">{summary.averageRelevanceScore}</div>
                  </div>
                </div>

                <div className="metadata">
                  <p><strong>Analysis Version:</strong> {summary.analysisVersion}</p>
                  <p><strong>Last Analyzed:</strong> {new Date(summary.lastAnalysisTime || new Date()).toLocaleString()}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Sentiment */}
        {activeSection === 'sentiment' && summary && (
          <div className="section">
            <h3>Sentiment Analysis</h3>
            <SentimentChart summary={summary} />
            <div className="section-note">
              <strong>Note:</strong> Sentiment classification is based on tone analysis of evidence content and does not measure public opinion.
            </div>
          </div>
        )}

        {/* Keywords */}
        {activeSection === 'keywords' && summary && (
          <div className="section">
            <h3>Top Keywords</h3>
            <KeywordsChart keywords={summary.topKeywords} />
            {summary.topKeywords.length === 0 && <p>No keywords extracted.</p>}
          </div>
        )}

        {/* Topics */}
        {activeSection === 'topics' && summary && (
          <div className="section">
            <h3>Topic Distribution</h3>
            <TopicsChart topics={summary.topicPercentages} />
            {Object.keys(summary.topicPercentages).length === 0 && <p>No topics classified.</p>}
          </div>
        )}

        {/* Timeline */}
        {activeSection === 'timeline' && timeline && (
          <div className="section">
            <h3>Timeline & Trends</h3>
            <TimelineChart timelineData={timeline} />
            {timeline.trend && (
              <div className="trend-note">
                <strong>Trend:</strong> {timeline.trend.description}
              </div>
            )}
          </div>
        )}

        {/* Findings */}
        {activeSection === 'findings' && findings && (
          <div className="section">
            <h3>Key Findings</h3>
            <div className="findings-list">
              {findings.length > 0 ? (
                findings.map((finding, index) => (
                  <div key={index} className={`finding-item priority-${finding.priority}`}>
                    <div className="finding-header">
                      <span className="finding-icon">{finding.icon}</span>
                      <span className="finding-title">{finding.title}</span>
                      <span className="finding-category">{finding.category}</span>
                    </div>
                    <p className="finding-description">{finding.description}</p>
                    {finding.caveats && (
                      <p className="finding-caveat">⚠️ {finding.caveats}</p>
                    )}
                  </div>
                ))
              ) : (
                <p>No findings available.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalysisDashboard;
