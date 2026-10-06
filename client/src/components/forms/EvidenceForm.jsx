import { useState } from 'react';
import * as api from '../../services/api';
import './EvidenceForm.css';

function EvidenceForm({ investigationId, onSuccess }) {
  const [formData, setFormData] = useState({
    sourceName: '',
    sourceType: 'News',
    sourceUrl: '',
    author: '',
    publicationDate: '',
    content: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sourceTypeOptions = [
    'News',
    'Blog',
    'Forum',
    'Public Social Media',
    'Other Public Web Source',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Basic validation
      if (!formData.sourceName.trim()) {
        setError('Source Name is required');
        setLoading(false);
        return;
      }

      if (!formData.content.trim()) {
        setError('Evidence Content is required');
        setLoading(false);
        return;
      }

      if (formData.sourceUrl && !isValidUrl(formData.sourceUrl)) {
        setError('Please enter a valid URL (e.g., https://example.com)');
        setLoading(false);
        return;
      }

      if (formData.publicationDate && !isValidDate(formData.publicationDate)) {
        setError('Please enter a valid publication date');
        setLoading(false);
        return;
      }

      // Create evidence
      const response = await api.createEvidence({
        investigationId,
        sourceName: formData.sourceName,
        sourceType: formData.sourceType,
        sourceUrl: formData.sourceUrl || undefined,
        author: formData.author || undefined,
        publicationDate: formData.publicationDate || undefined,
        content: formData.content,
        notes: formData.notes || undefined,
      });

      setSuccess(`Evidence created successfully! ID: ${response.data.evidence.evidenceId}`);
      
      // Reset form
      setFormData({
        sourceName: '',
        sourceType: 'News',
        sourceUrl: '',
        author: '',
        publicationDate: '',
        content: '',
        notes: '',
      });

      // Call parent callback
      if (onSuccess) {
        onSuccess(response.data.evidence);
      }
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to create evidence. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  return (
    <div className="evidence-form-container">
      <h2>Add Evidence</h2>
      
      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      <form onSubmit={handleSubmit} className="evidence-form">
        <div className="form-group">
          <label htmlFor="sourceName">
            Source Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="sourceName"
            name="sourceName"
            value={formData.sourceName}
            onChange={handleChange}
            placeholder="e.g., CNN News, Reddit Thread, Tech Blog"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="sourceType">
            Source Type <span className="required">*</span>
          </label>
          <select
            id="sourceType"
            name="sourceType"
            value={formData.sourceType}
            onChange={handleChange}
            required
          >
            {sourceTypeOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="sourceUrl">Source URL</label>
          <input
            type="url"
            id="sourceUrl"
            name="sourceUrl"
            value={formData.sourceUrl}
            onChange={handleChange}
            placeholder="https://example.com/article"
          />
          <small>Must be publicly accessible</small>
        </div>

        <div className="form-group">
          <label htmlFor="author">Author / Source Attribution</label>
          <input
            type="text"
            id="author"
            name="author"
            value={formData.author}
            onChange={handleChange}
            placeholder="e.g., John Doe, News Organization"
          />
        </div>

        <div className="form-group">
          <label htmlFor="publicationDate">Publication Date</label>
          <input
            type="date"
            id="publicationDate"
            name="publicationDate"
            value={formData.publicationDate}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">
            Evidence Content <span className="required">*</span>
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Paste the evidence content here (text, quotes, screenshots text, etc.)"
            rows="8"
            required
          />
          <small>Cannot be empty. This content will be hashed for integrity verification.</small>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any additional notes about this evidence"
            rows="3"
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Creating Evidence...' : 'Create Evidence'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EvidenceForm;
