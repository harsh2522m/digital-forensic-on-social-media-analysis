import { useState } from 'react';
import * as api from '../services/api';
import './EvidenceDetails.css';

function EvidenceDetails({ evidence, onClose }) {
  const [verifying, setVerifying] = useState(false);
  const [hashVerification, setHashVerification] = useState(null);
  const [verifyError, setVerifyError] = useState('');
  const [hashCopied, setHashCopied] = useState(false);

  const handleVerifyHash = async () => {
    setVerifying(true);
    setVerifyError('');
    setHashVerification(null);

    try {
      const response = await api.verifyEvidenceHash(evidence._id);
      setHashVerification(response.data);
    } catch (error) {
      setVerifyError(
        `Failed to verify hash: ${error.response?.data?.error || error.message}`
      );
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setHashCopied(true);
    setTimeout(() => setHashCopied(false), 2000);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDateShort = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="evidence-details-overlay">
      <div className="evidence-details-container">
        <div className="details-header">
          <h2>Evidence Details</h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="details-body">
          {/* Header Section */}
          <div className="detail-section">
            <div className="detail-row">
              <div className="detail-item">
                <label>Evidence ID</label>
                <div className="evidence-id-display">
                  <code>{evidence.evidenceId}</code>
                </div>
              </div>
              <div className="detail-item">
                <label>Investigation ID</label>
                <div className="detail-value">{evidence.investigationId}</div>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-item">
                <label>Analysis Status</label>
                <span className={`status-badge status-${evidence.analysisStatus.toLowerCase()}`}>
                  {evidence.analysisStatus}
                </span>
              </div>
              <div className="detail-item">
                <label>Source Type</label>
                <span className={`badge badge-${evidence.sourceType.toLowerCase().replace(' ', '-')}`}>
                  {evidence.sourceType}
                </span>
              </div>
            </div>
          </div>

          {/* Source Section */}
          <div className="detail-section">
            <h3>Source Information</h3>
            <div className="detail-row">
              <div className="detail-item">
                <label>Source Name</label>
                <div className="detail-value">{evidence.sourceName}</div>
              </div>
              <div className="detail-item">
                <label>Author</label>
                <div className="detail-value">{evidence.author || '-'}</div>
              </div>
            </div>
            {evidence.sourceUrl && (
              <div className="detail-row">
                <div className="detail-item full-width">
                  <label>Source URL</label>
                  <a href={evidence.sourceUrl} target="_blank" rel="noopener noreferrer" className="url-link">
                    {evidence.sourceUrl}
                  </a>
                  <small>Opens in new tab (publicly accessible)</small>
                </div>
              </div>
            )}
          </div>

          {/* Dates Section */}
          <div className="detail-section">
            <h3>Timestamps</h3>
            <div className="detail-row">
              <div className="detail-item">
                <label>Publication Date</label>
                <div className="detail-value">
                  {evidence.publicationDate ? formatDateShort(evidence.publicationDate) : '-'}
                </div>
              </div>
              <div className="detail-item">
                <label>Collection Timestamp</label>
                <div className="detail-value">
                  {formatDate(evidence.collectionTimestamp)}
                </div>
                <small>Server-generated, immutable</small>
              </div>
            </div>
          </div>

          {/* Evidence Content Section */}
          <div className="detail-section">
            <h3>Evidence Content</h3>
            <div className="evidence-content-box">
              <p>{evidence.content}</p>
            </div>
            <small>This content is immutable and cannot be edited after creation.</small>
          </div>

          {/* Notes Section */}
          {evidence.notes && (
            <div className="detail-section">
              <h3>Notes</h3>
              <div className="evidence-content-box">
                <p>{evidence.notes}</p>
              </div>
            </div>
          )}

          {/* SHA-256 Hash Section */}
          <div className="detail-section hash-section">
            <h3>Integrity Verification</h3>
            <p className="hash-info">
              SHA-256 is used as an integrity reference for the stored evidence content.
              It is NOT used to prove authenticity or legal admissibility.
            </p>

            <div className="hash-display">
              <label>SHA-256 Hash</label>
              <div className="hash-value-container">
                <code className="hash-value">{evidence.sha256Hash}</code>
                <button
                  className="btn-copy"
                  onClick={() => copyToClipboard(evidence.sha256Hash)}
                  title="Copy hash"
                >
                  {hashCopied ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
            </div>

            <button
              className="btn-verify"
              onClick={handleVerifyHash}
              disabled={verifying}
            >
              {verifying ? '⏳ Verifying...' : '✓ Verify Hash'}
            </button>

            {verifyError && (
              <div className="verification-error">{verifyError}</div>
            )}

            {hashVerification && (
              <div className={`verification-result ${hashVerification.verified ? 'verified' : 'mismatch'}`}>
                <div className="verification-status">
                  {hashVerification.verified ? '✓ HASH VERIFIED' : '✗ HASH MISMATCH'}
                </div>
                <div className="verification-details">
                  <small>
                    {hashVerification.message}
                  </small>
                </div>
              </div>
            )}
          </div>

          {/* Metadata Section */}
          <div className="detail-section">
            <h3>Metadata</h3>
            <div className="detail-row">
              <div className="detail-item">
                <label>Created</label>
                <div className="detail-value">{formatDate(evidence.createdAt)}</div>
              </div>
              <div className="detail-item">
                <label>Last Updated</label>
                <div className="detail-value">{formatDate(evidence.updatedAt)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="details-footer">
          <button className="btn-close-main" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default EvidenceDetails;
