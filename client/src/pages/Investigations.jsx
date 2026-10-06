import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import './Investigations.css';

function Investigations() {
  const navigate = useNavigate();
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    target: '',
    description: '',
    keywords: '',
    startDate: '',
    investigator: '',
  });
  const [creatingInv, setCreatingInv] = useState(false);

  useEffect(() => {
    loadInvestigations();
  }, []);

  const loadInvestigations = async () => {
    try {
      setLoading(true);
      const response = await api.getAllInvestigations();
      setInvestigations(response.data.investigations || []);
      setError('');
    } catch (err) {
      setError(`Failed to load investigations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreatingInv(true);

    try {
      const keywords = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const response = await api.createInvestigation({
        name: formData.name,
        target: formData.target,
        description: formData.description,
        keywords,
        startDate: formData.startDate,
        investigator: formData.investigator,
      });

      setInvestigations([response.data.investigation, ...investigations]);
      setShowForm(false);
      setFormData({
        name: '',
        target: '',
        description: '',
        keywords: '',
        startDate: '',
        investigator: '',
      });
    } catch (err) {
      setError(`Failed to create investigation: ${err.response?.data?.error || err.message}`);
    } finally {
      setCreatingInv(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this investigation?')) {
      return;
    }

    try {
      await api.deleteInvestigation(id);
      setInvestigations(investigations.filter(inv => inv._id !== id));
    } catch (err) {
      setError(`Failed to delete investigation: ${err.message}`);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="investigations-page">
      <div className="page-header">
        <h1>Investigations</h1>
        <button
          className="btn-create"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancel' : '+ New Investigation'}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {showForm && (
        <div className="create-form">
          <h2>Create New Investigation</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Investigation Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="e.g., Data Breach Analysis Q4 2026"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="target">Target *</label>
                <input
                  type="text"
                  id="target"
                  name="target"
                  value={formData.target}
                  onChange={handleFormChange}
                  placeholder="e.g., Company XYZ, Person/Event"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="investigator">Investigator *</label>
                <input
                  type="text"
                  id="investigator"
                  name="investigator"
                  value={formData.investigator}
                  onChange={handleFormChange}
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="startDate">Start Date *</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="keywords">Keywords (comma-separated)</label>
                <input
                  type="text"
                  id="keywords"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleFormChange}
                  placeholder="e.g., security, breach, incident"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Additional details about the investigation"
                  rows="3"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={creatingInv}>
                {creatingInv ? 'Creating...' : 'Create Investigation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-state">Loading investigations...</div>
      ) : investigations.length === 0 ? (
        <div className="empty-state">
          <p>No investigations yet.</p>
          <p className="text-muted">Create your first investigation to begin.</p>
        </div>
      ) : (
        <div className="investigations-grid">
          {investigations.map(inv => (
            <div key={inv._id} className="investigation-card">
              <div className="card-header">
                <h3>{inv.name}</h3>
                <span className="status-badge">{inv.status}</span>
              </div>

              <div className="card-body">
                <div className="card-row">
                  <label>Target:</label>
                  <span>{inv.target}</span>
                </div>
                <div className="card-row">
                  <label>Investigator:</label>
                  <span>{inv.investigator}</span>
                </div>
                <div className="card-row">
                  <label>Start Date:</label>
                  <span>{formatDate(inv.startDate)}</span>
                </div>
                {inv.keywords && inv.keywords.length > 0 && (
                  <div className="card-row">
                    <label>Keywords:</label>
                    <div className="keywords">
                      {inv.keywords.map(kw => (
                        <span key={kw} className="keyword-badge">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <button
                  className="btn-open"
                  onClick={() => navigate(`/investigate/${inv._id}`)}
                >
                  Open Investigation
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(inv._id)}
                  title="Delete investigation"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Investigations;
