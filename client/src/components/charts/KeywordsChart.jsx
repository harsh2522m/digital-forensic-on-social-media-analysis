import './ChartsCommon.css';

function KeywordsChart({ keywords }) {
  if (!keywords || keywords.length === 0) {
    return <p className="empty-message">No keywords extracted.</p>;
  }

  const maxFrequency = Math.max(...keywords.map(k => k.frequency));

  return (
    <div className="keywords-container">
      {keywords.map((kw, index) => (
        <div key={index} className="keyword-item">
          <div className="keyword-header">
            <span className="keyword-rank">#{index + 1}</span>
            <span className="keyword-text">{kw.keyword}</span>
            <span className="keyword-freq">{kw.frequency}×</span>
          </div>
          <div className="keyword-bar">
            <div
              className="keyword-bar-fill"
              style={{
                width: `${(kw.frequency / maxFrequency) * 100}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default KeywordsChart;
