import { useState } from 'react';
import * as api from '../../services/api';
import './EvidenceTable.css';

function EvidenceTable({ evidence, onEvidenceClick, onEvidenceDeleted }) {
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const handleDelete = async (evidenceId, id) => {
    if (!window.confirm('Are you sure you want to delete this evidence? This action cannot be undone.')) {
      return;
    }

    setDeleting(id);
    setDeleteError('');

    try {
      await api.deleteEvidence(id);
      if (onEvidenceDeleted) {
        onEvidenceDeleted(id);
      }
    } catch (error) {
      setDeleteError(`Failed to delete evidence: ${error.response?.data?.error || error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!evidence || evidence.length === 0) {
    return (
      <div className="evidence-table-container">
        <h3>Evidence</h3>
        <div className="no-evidence">
          <p>No evidence added yet.</p>
          <p className="text-muted">Add your first evidence to begin the investigation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="evidence-table-container">
      <h3>Evidence ({evidence.length})</h3>

      {deleteError && (
        <div className="error-message">{deleteError}</div>
      )}

      <div className="table-wrapper">
        <table className="evidence-table">
          <thead>
            <tr>
              <th>Evidence ID</th>
              <th>Source</th>
              <th>Type</th>
              <th>Published</th>
              <th>Collected</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {evidence.map(item => (
              <tr key={item._id} className="evidence-row">
                <td className="evidence-id">
                  <code>{item.evidenceId}</code>
                </td>
                <td className="source-name">{item.sourceName}</td>
                <td className="source-type">
                  <span className={`badge badge-${item.sourceType.toLowerCase().replace(' ', '-')}`}>
                    {item.sourceType}
                  </span>
                </td>
                <td className="date">
                  {item.publicationDate ? formatDate(item.publicationDate) : '-'}
                </td>
                <td className="date">
                  {formatDate(item.collectionTimestamp)}
                </td>
                <td className="status">
                  <span className={`status-badge status-${item.analysisStatus.toLowerCase()}`}>
                    {item.analysisStatus}
                  </span>
                </td>
                <td className="actions">
                  <button
                    className="btn-icon btn-view"
                    onClick={() => onEvidenceClick(item)}
                    title="View details"
                  >
                    👁️
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => handleDelete(item.evidenceId, item._id)}
                    disabled={deleting === item._id}
                    title="Delete evidence"
                  >
                    {deleting === item._id ? '⏳' : '🗑️'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EvidenceTable;
