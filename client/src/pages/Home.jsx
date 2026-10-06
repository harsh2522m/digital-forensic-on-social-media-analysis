import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
      <div className="hero">
        <h1>Digital Forensic Social Media Analysis</h1>
        <p className="subtitle">
          Collect, analyze, and report on publicly available online evidence
        </p>
        <button className="btn-hero" onClick={() => navigate('/investigations')}>
          Get Started →
        </button>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">📋</div>
          <h3>Investigation Management</h3>
          <p>Create and manage forensic investigations with targets, keywords, and timelines.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📄</div>
          <h3>Evidence Management</h3>
          <p>Store publicly available evidence with SHA-256 integrity verification and metadata.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Analysis</h3>
          <p>Analyze evidence with sentiment analysis, keyword extraction, and topic classification.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📑</div>
          <h3>Professional Reports</h3>
          <p>Generate comprehensive forensic-style PDF reports with all findings and evidence.</p>
        </div>
      </div>

      <div className="workflow-section">
        <h2>Typical Investigation Workflow</h2>
        <div className="workflow-steps">
          <div className="step">
            <span className="step-number">1</span>
            <span className="step-label">Create Investigation</span>
          </div>
          <div className="arrow">→</div>
          <div className="step">
            <span className="step-number">2</span>
            <span className="step-label">Add Evidence</span>
          </div>
          <div className="arrow">→</div>
          <div className="step">
            <span className="step-number">3</span>
            <span className="step-label">Run Analysis</span>
          </div>
          <div className="arrow">→</div>
          <div className="step">
            <span className="step-number">4</span>
            <span className="step-label">Generate Report</span>
          </div>
        </div>
      </div>

      <div className="info-section">
        <h2>About This Application</h2>
        <p>
          This academic project demonstrates how publicly available online information can be collected,
          organized as digital evidence, analyzed, and converted into a structured forensic-style
          investigation report. All data collection is limited to publicly available sources only.
        </p>
        <div className="info-box">
          <strong>Status:</strong> Phase 2 - Evidence Management (In Progress)
        </div>
      </div>
    </div>
  );
}

export default Home;
