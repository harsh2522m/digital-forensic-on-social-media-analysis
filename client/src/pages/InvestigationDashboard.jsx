import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import EvidenceForm from '../components/forms/EvidenceForm';
import EvidenceTable from '../components/tables/EvidenceTable';
import EvidenceDetails from '../components/EvidenceDetails';
import AnalysisDashboard from '../components/AnalysisDashboard';
import ReportTab from '../components/ReportTab';
import './InvestigationDashboard.css';

function InvestigationDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [investigation, setInvestigation] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview'); // overview, evidence, add-evidence, analysis, report

  useEffect(() => {
    loadInvestigation();
  }, [id]);

  useEffect(() => {
    if (investigation) {
      loadEvidence();
    }
  }, [investigation]);

  const loadInvestigation = async () => {
    try {
      setLoading(true);
      const response = await api.getInvestigation(id);
      setInvestigation(response.data.investigation);
      setError('');
    } catch (err) {
      setError(`Failed to load investigation: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadEvidence = async () => {
    try {
      const investigationId = investigation.investigationId || investigation._id;
      const response = await api.getEvidenceByInvestigation(investigationId);
      setEvidence(response.data.evidence);
    } catch (err) {
      console.error('Failed to load evidence:', err);
    }
  };

  const handleEvidenceCreated = (newEvidence) => {
    setEvidence([newEvidence, ...evidence]);
    setTab('evidence');
  };

  const handleEvidenceDeleted = (deletedId) => {
    setEvidence(evidence.filter(e => e._id !== deletedId));
  };

  const handleEvidenceClick = (ev) => {
    setSelectedEvidence(ev);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading investigation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="btn-back" onClick={() => navigate('/')}>
            ← Back to Investigations
          </button>
        </div>
      </div>
    );
  }

  if (!investigation) {
    return (
      <div className="dashboard-container">
        <div className="error-container">
          <h2>Investigation Not Found</h2>
          <button className="btn-back" onClick={() => navigate('/')}>
            ← Back to Investigations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <button className="btn-back" onClick={() => navigate('/')}>
              ←
            </button>
            <div>
              <h1>{investigation.name}</h1>
              <p className="investigationId">ID: {investigation.investigationId}</p>
            </div>
          </div>
          <div className="header-info">
            <div className="info-item">
              <span className="label">Target:</span>
              <span className="value">{investigation.target}</span>
            </div>
            <div className="info-item">
              <span className="label">Evidence:</span>
              <span className="value">{evidence.length}</span>
            </div>
            <div className="info-item">
              <span className="label">Status:</span>
              <span className={`status-badge status-${investigation.status}`}>
                {investigation.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab-button ${tab === 'overview' ? 'active' : ''}`}
          onClick={() => setTab('overview')}
        >
          📋 Overview
        </button>
        <button
          className={`tab-button ${tab === 'evidence' ? 'active' : ''}`}
          onClick={() => setTab('evidence')}
        >
          📄 Evidence ({evidence.length})
        </button>
        <button
          className={`tab-button ${tab === 'add-evidence' ? 'active' : ''}`}
          onClick={() => setTab('add-evidence')}
        >
          ➕ Add Evidence
        </button>
        <button
          className={`tab-button ${tab === 'analysis' ? 'active' : ''}`}
          onClick={() => setTab('analysis')}
        >
          📊 Analysis
        </button>
        <button
          className={`tab-button ${tab === 'report' ? 'active' : ''}`}
          onClick={() => setTab('report')}
        >
          📄 Report
        </button>
      </div>

      {/* Content */}
      <div className="dashboard-content">
        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="tab-content">
            <div className="investigation-info-grid">
              <div className="info-card">
                <h3>Investigation Details</h3>
                <div className="info-row">
                  <label>Name:</label>
                  <span>{investigation.name}</span>
                </div>
                <div className="info-row">
                  <label>Target:</label>
                  <span>{investigation.target}</span>
                </div>
                <div className="info-row">
                  <label>Description:</label>
                  <span>{investigation.description || '-'}</span>
                </div>
                <div className="info-row">
                  <label>Investigator:</label>
                  <span>{investigation.investigator}</span>
                </div>
              </div>

              <div className="info-card">
                <h3>Keywords & Dates</h3>
                <div className="info-row">
                  <label>Keywords:</label>
                  <span>
                    {investigation.keywords && investigation.keywords.length > 0
                      ? investigation.keywords.join(', ')
                      : '-'}
                  </span>
                </div>
                <div className="info-row">
                  <label>Start Date:</label>
                  <span>{formatDate(investigation.startDate)}</span>
                </div>
                <div className="info-row">
                  <label>End Date:</label>
                  <span>{investigation.endDate ? formatDate(investigation.endDate) : '-'}</span>
                </div>
                <div className="info-row">
                  <label>Created:</label>
                  <span>{formatDate(investigation.createdAt)}</span>
                </div>
              </div>

              <div className="info-card">
                <h3>Evidence Summary</h3>
                <div className="summary-stat">
                  <span className="stat-number">{evidence.length}</span>
                  <span className="stat-label">Total Evidence Items</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-number">{evidence.filter(e => e.analysisStatus === 'Pending').length}</span>
                  <span className="stat-label">Pending Analysis</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-number">{evidence.filter(e => e.analysisStatus === 'Analyzed').length}</span>
                  <span className="stat-label">Analyzed</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Evidence Tab */}
        {tab === 'evidence' && (
          <div className="tab-content">
            <EvidenceTable
              evidence={evidence}
              onEvidenceClick={handleEvidenceClick}
              onEvidenceDeleted={handleEvidenceDeleted}
            />
          </div>
        )}

        {/* Add Evidence Tab */}
        {tab === 'add-evidence' && (
          <div className="tab-content">
            <EvidenceForm
              investigationId={investigation.investigationId || investigation._id}
              onSuccess={handleEvidenceCreated}
            />
          </div>
        )}

        {/* Analysis Tab */}
        {tab === 'analysis' && (
          <div className="tab-content">
            <AnalysisDashboard
              investigationId={investigation.investigationId || investigation._id}
              evidence={evidence}
            />
          </div>
        )}

        {/* Report Tab */}
        {tab === 'report' && (
          <div className="tab-content">
            <ReportTab
              investigationId={investigation.investigationId || investigation._id}
            />
          </div>
        )}
      </div>

      {/* Evidence Details Modal */}
      {selectedEvidence && (
        <EvidenceDetails
          evidence={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
        />
      )}
    </div>
  );
}

export default InvestigationDashboard;
