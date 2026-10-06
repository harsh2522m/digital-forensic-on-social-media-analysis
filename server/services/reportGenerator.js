/**
 * Report Generator Service
 * Generates professional forensic-style PDF reports from investigation data
 */

const jsPDF = require('jspdf');
const autoTable = require('jspdf-autotable');

class ReportGenerator {
  /**
   * Generate complete forensic report PDF
   * @param {Object} investigation - Investigation document
   * @param {Array} evidence - Evidence items array
   * @param {Object} analysis - Analysis results
   * @returns {Buffer} PDF buffer
   */
  generateReport(investigation, evidence, analysis) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Constants
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const lineHeight = 7;
    const colors = {
      primary: [41, 84, 209],      // Professional blue
      secondary: [70, 70, 70],      // Dark gray
      text: [0, 0, 0],              // Black
      lightBg: [245, 245, 245]      // Light gray
    };

    let currentPage = 1;
    let yPosition = margin;

    // ==================== PAGE 1: COVER PAGE ====================
    this._addCoverPage(doc, investigation, colors, pageWidth, pageHeight, margin);

    // Add page break
    doc.addPage();
    currentPage++;
    yPosition = margin;

    // ==================== EXECUTIVE SUMMARY ====================
    yPosition = this._addSection(doc, 'EXECUTIVE SUMMARY', yPosition, margin, pageWidth, colors);
    yPosition = this._addExecutiveSummary(doc, investigation, evidence, analysis, yPosition, margin, pageWidth, colors, lineHeight);

    // ==================== METHODOLOGY ====================
    yPosition = this._checkPageBreak(doc, yPosition, margin, pageHeight, pageWidth, colors);
    yPosition = this._addSection(doc, 'METHODOLOGY', yPosition, margin, pageWidth, colors);
    yPosition = this._addMethodology(doc, yPosition, margin, pageWidth, colors, lineHeight);

    // ==================== INVESTIGATION INFORMATION ====================
    yPosition = this._checkPageBreak(doc, yPosition, margin, pageHeight, pageWidth, colors);
    yPosition = this._addSection(doc, 'INVESTIGATION INFORMATION', yPosition, margin, pageWidth, colors);
    yPosition = this._addInvestigationInfo(doc, investigation, yPosition, margin, pageWidth, colors, lineHeight);

    // ==================== EVIDENCE SUMMARY ====================
    yPosition = this._checkPageBreak(doc, yPosition, margin, pageHeight, pageWidth, colors);
    yPosition = this._addSection(doc, 'EVIDENCE SUMMARY', yPosition, margin, pageWidth, colors);
    yPosition = this._addEvidenceSummary(doc, evidence, yPosition, margin, pageWidth, colors, lineHeight);

    // ==================== EVIDENCE REGISTER ====================
    yPosition = this._checkPageBreak(doc, yPosition, margin, pageHeight, pageWidth, colors);
    yPosition = this._addSection(doc, 'EVIDENCE REGISTER', yPosition, margin, pageWidth, colors);
    yPosition = this._addEvidenceRegister(doc, evidence, yPosition, margin, pageWidth, colors);

    // ==================== EVIDENCE DETAILS ====================
    yPosition = this._checkPageBreak(doc, yPosition, margin, pageHeight, pageWidth, colors);
    yPosition = this._addSection(doc, 'EVIDENCE DETAILS', yPosition, margin, pageWidth, colors);
    yPosition = this._addEvidenceDetails(doc, evidence, yPosition, margin, pageWidth, colors, lineHeight, pageHeight);

    // ==================== SENTIMENT ANALYSIS ====================
    yPosition = this._checkPageBreak(doc, yPosition, margin, pageHeight, pageWidth, colors);
    yPosition = this._addSection(doc, 'SENTIMENT ANALYSIS', yPosition, margin, pageWidth, colors);
    yPosition = this._addSentimentAnalysis(doc, analysis, yPosition, margin, pageWidth, colors, lineHeight);

    // ==================== KEYWORD ANALYSIS ====================
    yPosition = this._checkPageBreak(doc, yPosition, margin, pageHeight, pageWidth, colors);
    yPosition = this._addSection(doc, 'KEYWORD ANALYSIS', yPosition, margin, pageWidth, colors);
    yPosition = this._addKeywordAnalysis(doc, analysis, yPosition, margin, pageWidth, colors, lineHeight);

    // ==================== TOPIC ANALYSIS ====================
    yPosition = this._checkPageBreak(doc, yPosition, margin, pageHeight, pageWidth, colors);
    yPosition = this._addSection(doc, 'TOPIC ANALYSIS', yPosition, margin, pageWidth, colors);
    yPosition = this._addTopicAnalysis(doc, analysis, yPosition, margin, pageWidth, colors, lineHeight);

    // ==================== RELEVANCE ANALYSIS ====================
    yPosition = this._checkPageBreak(doc, yPosition, margin, pageHeight, pageWidth, colors);
    yPosition = this._addSection(doc, 'RELEVANCE ANALYSIS', yPosition, margin, pageWidth, colors);
    yPosition = this._addRelevanceAnalysis(doc, evidence, yPosition, margin, pageWidth, colors, lineHeight);

    // ==================== TIMELINE ANALYSIS ====================
    yPosition = this._checkPageBreak(doc, yPosition, margin, pageHeight, pageWidth, colors);
    yPosition = this._addSection(doc, 'TIMELINE ANALYSIS', yPosition, margin, pageWidth, colors);
    yPosition = this._addTimelineAnalysis(doc, analysis, yPosition, margin, pageWidth, colors, lineHeight);

    // ==================== FINDINGS ====================
    yPosition = this._checkPageBreak(doc, yPosition, margin, pageHeight, pageWidth, colors);
    yPosition = this._addSection(doc, 'FINDINGS', yPosition, margin, pageWidth, colors);
    yPosition = this._addFindings(doc, analysis, yPosition, margin, pageWidth, colors, lineHeight, pageHeight);

    // ==================== EVIDENCE INTEGRITY ====================
    yPosition = this._checkPageBreak(doc, yPosition, margin, pageHeight, pageWidth, colors);
    yPosition = this._addSection(doc, 'EVIDENCE INTEGRITY', yPosition, margin, pageWidth, colors);
    yPosition = this._addEvidenceIntegrity(doc, evidence, yPosition, margin, pageWidth, colors);

    // ==================== LIMITATIONS ====================
    yPosition = this._checkPageBreak(doc, yPosition, margin, pageHeight, pageWidth, colors);
    yPosition = this._addSection(doc, 'LIMITATIONS', yPosition, margin, pageWidth, colors);
    yPosition = this._addLimitations(doc, yPosition, margin, pageWidth, colors, lineHeight);

    // ==================== CONCLUSION ====================
    yPosition = this._checkPageBreak(doc, yPosition, margin, pageHeight, pageWidth, colors);
    yPosition = this._addSection(doc, 'CONCLUSION', yPosition, margin, pageWidth, colors);
    yPosition = this._addConclusion(doc, investigation, evidence, analysis, yPosition, margin, pageWidth, colors, lineHeight);

    // ==================== REPORT METADATA ====================
    yPosition = this._checkPageBreak(doc, yPosition, margin, pageHeight, pageWidth, colors);
    yPosition = this._addSection(doc, 'REPORT METADATA', yPosition, margin, pageWidth, colors);
    yPosition = this._addReportMetadata(doc, investigation, analysis, yPosition, margin, pageWidth, colors, lineHeight);

    // Add page numbers
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(...colors.secondary);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - margin - 20,
        pageHeight - 10,
        { align: 'right' }
      );
    }

    return doc.output('arraybuffer');
  }

  // ==================== HELPER METHODS ====================

  _addCoverPage(doc, investigation, colors, pageWidth, pageHeight, margin) {
    const centerX = pageWidth / 2;
    
    // Title
    doc.setFontSize(24);
    doc.setTextColor(...colors.primary);
    doc.text('DIGITAL FORENSIC ON SOCIAL MEDIA ANALYSIS', centerX, pageHeight / 4, { align: 'center' });

    // Subtitle
    doc.setFontSize(16);
    doc.setTextColor(...colors.secondary);
    doc.text('FORENSIC INVESTIGATION REPORT', centerX, pageHeight / 4 + 20, { align: 'center' });

    // Investigation details
    doc.setFontSize(11);
    doc.setTextColor(...colors.text);
    const yStart = pageHeight / 2;
    const spacing = 8;
    
    doc.text(`Investigation Name: ${investigation.name}`, centerX, yStart, { align: 'center' });
    doc.text(`Investigation ID: ${investigation.investigationId}`, centerX, yStart + spacing, { align: 'center' });
    doc.text(`Target: ${investigation.target}`, centerX, yStart + spacing * 2, { align: 'center' });
    doc.text(`Investigator: ${investigation.investigator}`, centerX, yStart + spacing * 3, { align: 'center' });
    
    const startDate = new Date(investigation.startDate).toLocaleDateString();
    const endDate = investigation.endDate ? new Date(investigation.endDate).toLocaleDateString() : 'Ongoing';
    doc.text(`Investigation Period: ${startDate} to ${endDate}`, centerX, yStart + spacing * 4, { align: 'center' });
    
    doc.text(`Report ID: report_${Math.random().toString(36).substr(2, 9)}`, centerX, yStart + spacing * 5, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, centerX, yStart + spacing * 6, { align: 'center' });

    // Disclaimer
    doc.setFontSize(9);
    doc.setTextColor(...colors.secondary);
    const disclaimer = 'This report is an academic forensic-style analysis of publicly available information. It is not a determination of legal admissibility, authenticity, attribution, or guilt.';
    doc.text(disclaimer, margin, pageHeight - 40, { maxWidth: pageWidth - 2 * margin, align: 'justify' });
  }

  _addSection(doc, title, yPosition, margin, pageWidth, colors) {
    doc.setFontSize(14);
    doc.setTextColor(...colors.primary);
    doc.setFont(undefined, 'bold');
    doc.text(title, margin, yPosition);
    
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);
    
    doc.setFont(undefined, 'normal');
    return yPosition + 10;
  }

  _checkPageBreak(doc, yPosition, margin, pageHeight, pageWidth, colors) {
    if (yPosition > pageHeight - margin - 10) {
      doc.addPage();
      return margin;
    }
    return yPosition;
  }

  _addExecutiveSummary(doc, investigation, evidence, analysis, yPosition, margin, pageWidth, colors, lineHeight) {
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);

    const summaryText = [];
    summaryText.push(`Target: ${investigation.target}`);
    summaryText.push(`Investigation Period: ${new Date(investigation.startDate).toLocaleDateString()} to ${investigation.endDate ? new Date(investigation.endDate).toLocaleDateString() : 'Ongoing'}`);
    summaryText.push(`Total Evidence Collected: ${evidence.length}`);
    summaryText.push(`Active Evidence: ${evidence.filter(e => e.analysisStatus !== 'Archived').length}`);
    summaryText.push(`Analyzed Evidence: ${evidence.filter(e => e.sentimentLabel).length}`);

    if (analysis && analysis.summary) {
      const sentiments = analysis.summary.sentiment;
      if (sentiments) {
        summaryText.push(`Sentiment Distribution: Positive ${sentiments.positive}, Neutral ${sentiments.neutral}, Negative ${sentiments.negative}`);
      }
      if (analysis.summary.topTopics && analysis.summary.topTopics.length > 0) {
        summaryText.push(`Primary Topics: ${analysis.summary.topTopics.slice(0, 3).join(', ')}`);
      }
      if (analysis.summary.topKeywords && analysis.summary.topKeywords.length > 0) {
        summaryText.push(`Key Keywords: ${analysis.summary.topKeywords.slice(0, 5).join(', ')}`);
      }
    }

    summaryText.forEach(text => {
      yPosition = this._checkPageBreak(doc, yPosition, margin, doc.internal.pageSize.getHeight(), pageWidth, colors);
      doc.text(text, margin, yPosition);
      yPosition += lineHeight;
    });

    return yPosition + 5;
  }

  _addMethodology(doc, yPosition, margin, pageWidth, colors, lineHeight) {
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);

    const methodology = [
      '1. Target selection and investigation scope definition',
      '2. Identification of publicly available information sources',
      '3. Evidence recording with metadata',
      '4. SHA-256 integrity hashing of evidence content',
      '5. Text preprocessing and tokenization',
      '6. Sentiment classification using lexicon-based approach',
      '7. Keyword extraction with frequency analysis',
      '8. Topic classification using predefined rules',
      '9. Relevance scoring based on investigation context',
      '10. Timeline analysis with sentiment trends',
      '11. Findings generation from analytical results',
      '12. PDF report generation and storage'
    ];

    methodology.forEach(item => {
      yPosition = this._checkPageBreak(doc, yPosition, margin, doc.internal.pageSize.getHeight(), pageWidth, colors);
      doc.text(item, margin, yPosition);
      yPosition += lineHeight;
    });

    return yPosition + 5;
  }

  _addInvestigationInfo(doc, investigation, yPosition, margin, pageWidth, colors, lineHeight) {
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);

    const info = [
      [`Investigation ID:`, investigation.investigationId],
      [`Name:`, investigation.name],
      [`Target:`, investigation.target],
      [`Description:`, investigation.description || 'N/A'],
      [`Keywords:`, investigation.keywords ? investigation.keywords.join(', ') : 'N/A'],
      [`Investigator:`, investigation.investigator],
      [`Start Date:`, new Date(investigation.startDate).toLocaleDateString()],
      [`End Date:`, investigation.endDate ? new Date(investigation.endDate).toLocaleDateString() : 'Ongoing'],
      [`Created:`, new Date(investigation.createdAt).toLocaleString()]
    ];

    info.forEach(([label, value]) => {
      yPosition = this._checkPageBreak(doc, yPosition, margin, doc.internal.pageSize.getHeight(), pageWidth, colors);
      doc.setFont(undefined, 'bold');
      doc.text(label, margin, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(String(value), margin + 50, yPosition);
      yPosition += lineHeight;
    });

    return yPosition + 5;
  }

  _addEvidenceSummary(doc, evidence, yPosition, margin, pageWidth, colors, lineHeight) {
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);

    const active = evidence.filter(e => e.analysisStatus !== 'Archived').length;
    const archived = evidence.filter(e => e.analysisStatus === 'Archived').length;
    const analyzed = evidence.filter(e => e.sentimentLabel).length;
    const pending = active - analyzed;

    // Count by source type
    const sourceTypes = {};
    evidence.forEach(e => {
      const type = e.sourceType || 'Other';
      sourceTypes[type] = (sourceTypes[type] || 0) + 1;
    });

    const summary = [
      [`Total Evidence:`, String(evidence.length)],
      [`Active Evidence:`, String(active)],
      [`Archived Evidence:`, String(archived)],
      [`Analyzed Evidence:`, String(analyzed)],
      [`Pending Analysis:`, String(pending)]
    ];

    summary.forEach(([label, value]) => {
      yPosition = this._checkPageBreak(doc, yPosition, margin, doc.internal.pageSize.getHeight(), pageWidth, colors);
      doc.setFont(undefined, 'bold');
      doc.text(label, margin, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(value, margin + 50, yPosition);
      yPosition += lineHeight;
    });

    yPosition += 5;
    doc.setFont(undefined, 'bold');
    doc.text('Evidence by Source Type:', margin, yPosition);
    yPosition += lineHeight;
    doc.setFont(undefined, 'normal');

    Object.entries(sourceTypes).forEach(([type, count]) => {
      yPosition = this._checkPageBreak(doc, yPosition, margin, doc.internal.pageSize.getHeight(), pageWidth, colors);
      doc.text(`${type}: ${count}`, margin + 10, yPosition);
      yPosition += lineHeight;
    });

    return yPosition + 5;
  }

  _addEvidenceRegister(doc, evidence, yPosition, margin, pageWidth, colors) {
    const tableData = evidence.map(e => [
      e.evidenceId || 'N/A',
      (e.sourceName || 'N/A').substring(0, 15),
      (e.sourceType || 'N/A').substring(0, 10),
      e.publicationDate ? new Date(e.publicationDate).toLocaleDateString() : 'N/A',
      new Date(e.createdAt).toLocaleDateString(),
      e.sentimentLabel || 'Pending',
      (e.topics && e.topics[0] ? e.topics[0].name : 'N/A').substring(0, 10),
      e.relevanceLevel || 'N/A',
      e.analysisStatus === 'Analyzed' ? '✓' : '✗',
      (e.contentHash || '').substring(0, 10) + '...'
    ]);

    autoTable(doc, {
      head: [['Evidence ID', 'Source', 'Type', 'Pub. Date', 'Coll. Date', 'Sentiment', 'Topic', 'Relevance', 'Verified', 'SHA-256']],
      body: tableData,
      startY: yPosition,
      margin: margin,
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 15 }, 9: { cellWidth: 12 } }
    });

    return doc.internal.pages[doc.internal.pages.length - 1] ? doc.lastAutoTable.finalY + 10 : yPosition + 50;
  }

  _addEvidenceDetails(doc, evidence, yPosition, margin, pageWidth, colors, lineHeight, pageHeight) {
    doc.setFontSize(10);

    evidence.slice(0, 10).forEach((e, idx) => {
      yPosition = this._checkPageBreak(doc, yPosition + lineHeight * 2, margin, pageHeight, pageWidth, colors);
      
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...colors.primary);
      doc.text(`Evidence ${idx + 1}: ${e.evidenceId}`, margin, yPosition);
      yPosition += lineHeight;

      doc.setFont(undefined, 'normal');
      doc.setTextColor(...colors.text);
      
      const details = [
        [`Source:`, e.sourceName || 'N/A'],
        [`Type:`, e.sourceType || 'N/A'],
        [`URL:`, (e.url || 'N/A').substring(0, 50)],
        [`Pub. Date:`, e.publicationDate ? new Date(e.publicationDate).toLocaleDateString() : 'N/A'],
        [`Coll. Date:`, new Date(e.createdAt).toLocaleString()],
        [`Sentiment:`, e.sentimentLabel || 'Pending'],
        [`Relevance:`, `${e.relevanceScore}/100 (${e.relevanceLevel})`],
        [`SHA-256:`, e.contentHash || 'N/A']
      ];

      details.forEach(([label, value]) => {
        yPosition = this._checkPageBreak(doc, yPosition, margin, pageHeight, pageWidth, colors);
        doc.setFont(undefined, 'bold');
        doc.text(label, margin, yPosition);
        doc.setFont(undefined, 'normal');
        const wrappedText = doc.splitTextToSize(String(value), pageWidth - 2 * margin - 50);
        doc.text(wrappedText, margin + 45, yPosition);
        yPosition += lineHeight * Math.max(1, wrappedText.length / 2);
      });

      if (e.content) {
        yPosition = this._checkPageBreak(doc, yPosition, margin, pageHeight, pageWidth, colors);
        doc.setFont(undefined, 'bold');
        doc.text('Content:', margin, yPosition);
        yPosition += lineHeight;
        doc.setFont(undefined, 'normal');
        const wrappedContent = doc.splitTextToSize(e.content.substring(0, 300), pageWidth - 2 * margin - 5);
        doc.text(wrappedContent, margin, yPosition);
        yPosition += lineHeight * wrappedContent.length;
      }

      yPosition += 5;
    });

    return yPosition;
  }

  _addSentimentAnalysis(doc, analysis, yPosition, margin, pageWidth, colors, lineHeight) {
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);

    if (analysis && analysis.summary && analysis.summary.sentiment) {
      const sentiments = analysis.summary.sentiment;
      const total = sentiments.positive + sentiments.neutral + sentiments.negative;
      
      const data = [
        ['Sentiment', 'Count', 'Percentage'],
        ['Positive', String(sentiments.positive), `${total > 0 ? ((sentiments.positive / total) * 100).toFixed(1) : 0}%`],
        ['Neutral', String(sentiments.neutral), `${total > 0 ? ((sentiments.neutral / total) * 100).toFixed(1) : 0}%`],
        ['Negative', String(sentiments.negative), `${total > 0 ? ((sentiments.negative / total) * 100).toFixed(1) : 0}%`]
      ];

      autoTable(doc, {
        head: [data[0]],
        body: data.slice(1),
        startY: yPosition,
        margin: margin
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    }

    doc.setFontSize(9);
    doc.setTextColor(...colors.secondary);
    const note = 'Note: Sentiment classification represents analysis of the available evidence dataset and should not be interpreted as a direct measurement of overall public opinion.';
    doc.text(note, margin, yPosition, { maxWidth: pageWidth - 2 * margin });
    
    return yPosition + 20;
  }

  _addKeywordAnalysis(doc, analysis, yPosition, margin, pageWidth, colors, lineHeight) {
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);

    if (analysis && analysis.summary && analysis.summary.topKeywords) {
      const keywords = analysis.summary.topKeywords.slice(0, 10);
      doc.setFont(undefined, 'bold');
      doc.text('Top Keywords:', margin, yPosition);
      yPosition += lineHeight;
      doc.setFont(undefined, 'normal');

      keywords.forEach((kw, idx) => {
        yPosition = this._checkPageBreak(doc, yPosition, margin, doc.internal.pageSize.getHeight(), pageWidth, colors);
        doc.text(`${idx + 1}. ${kw}`, margin + 5, yPosition);
        yPosition += lineHeight;
      });
    }

    return yPosition + 5;
  }

  _addTopicAnalysis(doc, analysis, yPosition, margin, pageWidth, colors, lineHeight) {
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);

    if (analysis && analysis.summary && analysis.summary.topTopics) {
      const topics = analysis.summary.topTopics;
      doc.setFont(undefined, 'bold');
      doc.text('Topic Distribution:', margin, yPosition);
      yPosition += lineHeight;
      doc.setFont(undefined, 'normal');

      topics.forEach((topic, idx) => {
        yPosition = this._checkPageBreak(doc, yPosition, margin, doc.internal.pageSize.getHeight(), pageWidth, colors);
        doc.text(`${idx + 1}. ${topic}`, margin + 5, yPosition);
        yPosition += lineHeight;
      });
    }

    return yPosition + 5;
  }

  _addRelevanceAnalysis(doc, evidence, yPosition, margin, pageWidth, colors, lineHeight) {
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);

    const high = evidence.filter(e => e.relevanceLevel === 'High').length;
    const medium = evidence.filter(e => e.relevanceLevel === 'Medium').length;
    const low = evidence.filter(e => e.relevanceLevel === 'Low').length;
    const total = evidence.filter(e => e.relevanceScore !== undefined).length;
    const avgRelevance = total > 0 ? (evidence.filter(e => e.relevanceScore !== undefined).reduce((sum, e) => sum + (e.relevanceScore || 0), 0) / total).toFixed(1) : 'N/A';

    const data = [
      [`Average Relevance Score:`, String(avgRelevance)],
      [`High Relevance:`, String(high)],
      [`Medium Relevance:`, String(medium)],
      [`Low Relevance:`, String(low)]
    ];

    data.forEach(([label, value]) => {
      yPosition = this._checkPageBreak(doc, yPosition, margin, doc.internal.pageSize.getHeight(), pageWidth, colors);
      doc.setFont(undefined, 'bold');
      doc.text(label, margin, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(value, margin + 60, yPosition);
      yPosition += lineHeight;
    });

    return yPosition + 10;
  }

  _addTimelineAnalysis(doc, analysis, yPosition, margin, pageWidth, colors, lineHeight) {
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);

    if (analysis && analysis.timeline && analysis.timeline.data) {
      const timelineData = analysis.timeline.data;
      doc.setFont(undefined, 'bold');
      doc.text('Evidence Timeline:', margin, yPosition);
      yPosition += lineHeight;
      doc.setFont(undefined, 'normal');

      timelineData.slice(0, 5).forEach(day => {
        yPosition = this._checkPageBreak(doc, yPosition, margin, doc.internal.pageSize.getHeight(), pageWidth, colors);
        const sentiment = day.sentiment;
        doc.text(`${day.date}: ${day.count} items (Pos: ${sentiment.positive.count}, Neu: ${sentiment.neutral.count}, Neg: ${sentiment.negative.count})`, margin, yPosition);
        yPosition += lineHeight;
      });
    }

    if (analysis && analysis.timeline && analysis.timeline.trends) {
      yPosition += 5;
      doc.setFont(undefined, 'bold');
      doc.text('Observed Trends:', margin, yPosition);
      yPosition += lineHeight;
      doc.setFont(undefined, 'normal');

      analysis.timeline.trends.slice(0, 3).forEach(trend => {
        yPosition = this._checkPageBreak(doc, yPosition, margin, doc.internal.pageSize.getHeight(), pageWidth, colors);
        doc.text(`${trend.period}: ${trend.type}`, margin, yPosition);
        yPosition += lineHeight;
      });
    }

    doc.setFontSize(9);
    doc.setTextColor(...colors.secondary);
    yPosition += 5;
    const timelineNote = 'Note: Temporal association does not by itself establish causation.';
    doc.text(timelineNote, margin, yPosition);
    
    return yPosition + 15;
  }

  _addFindings(doc, analysis, yPosition, margin, pageWidth, colors, lineHeight, pageHeight) {
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);

    if (analysis && analysis.findings && analysis.findings.length > 0) {
      analysis.findings.forEach((finding, idx) => {
        yPosition = this._checkPageBreak(doc, yPosition + lineHeight, margin, pageHeight, pageWidth, colors);
        
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...colors.primary);
        doc.text(`Finding ${idx + 1}: ${finding.title || 'Finding'}`, margin, yPosition);
        yPosition += lineHeight;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(...colors.text);
        
        if (finding.severity) {
          doc.text(`Severity: ${finding.severity}`, margin + 5, yPosition);
          yPosition += lineHeight;
        }

        if (finding.description) {
          const wrappedDesc = doc.splitTextToSize(finding.description, pageWidth - 2 * margin - 5);
          doc.text(wrappedDesc, margin + 5, yPosition);
          yPosition += lineHeight * wrappedDesc.length;
        }

        yPosition += 3;
      });
    } else {
      doc.text('No findings generated. Analysis may be pending or evidence may be insufficient.', margin, yPosition);
      yPosition += lineHeight * 2;
    }

    return yPosition + 5;
  }

  _addEvidenceIntegrity(doc, evidence, yPosition, margin, pageWidth, colors) {
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);

    const integrityData = evidence.map(e => [
      (e.evidenceId || 'N/A').substring(0, 15),
      new Date(e.createdAt).toLocaleString(),
      (e.contentHash || 'N/A').substring(0, 20) + '...',
      e.analysisStatus === 'Analyzed' ? 'Referenced' : 'Pending'
    ]);

    autoTable(doc, {
      head: [['Evidence ID', 'Collection Timestamp', 'SHA-256 (Integrity Reference)', 'Verification Status']],
      body: integrityData.slice(0, 20),
      startY: yPosition,
      margin: margin,
      styles: { fontSize: 8 },
      columnStyles: { 2: { cellWidth: 30 } }
    });

    yPosition = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(9);
    doc.setTextColor(...colors.secondary);
    const integrityNote = 'SHA-256 provides an integrity reference by allowing the stored evidence content to be hashed again and compared with the originally stored hash. This does not independently establish authenticity or authorship.';
    doc.text(integrityNote, margin, yPosition, { maxWidth: pageWidth - 2 * margin });
    
    return yPosition + 20;
  }

  _addLimitations(doc, yPosition, margin, pageWidth, colors, lineHeight) {
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);

    const limitations = [
      'Analysis is based on available/publicly provided information only.',
      'Private social-media accounts are not accessed.',
      'Private messages and protected content are not accessed.',
      'Sentiment analysis uses a lexicon/rule-based approach, not machine learning.',
      'Topic classification uses predefined rules and keyword matching.',
      'Results depend heavily on evidence and dataset quality.',
      'SHA-256 provides an integrity reference but does not establish authenticity or authorship.',
      'Timeline correlation does not prove causation.',
      'This system is an academic forensic-style prototype, not a forensic certification system.',
      'Analyst bias and data collection methodology affect results.'
    ];

    limitations.forEach(limitation => {
      yPosition = this._checkPageBreak(doc, yPosition, margin, doc.internal.pageSize.getHeight(), pageWidth, colors);
      doc.setFont(undefined, 'bold');
      doc.text('•', margin, yPosition);
      doc.setFont(undefined, 'normal');
      const wrappedText = doc.splitTextToSize(limitation, pageWidth - 2 * margin - 10);
      doc.text(wrappedText, margin + 5, yPosition);
      yPosition += lineHeight * wrappedText.length + 2;
    });

    return yPosition + 5;
  }

  _addConclusion(doc, investigation, evidence, analysis, yPosition, margin, pageWidth, colors, lineHeight) {
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);

    const totalEvidence = evidence.length;
    const analyzedEvidence = evidence.filter(e => e.sentimentLabel).length;

    const conclusion = [
      `This forensic investigation report documents the analysis of ${totalEvidence} evidence items related to "${investigation.target}".`,
      `Of the evidence collected, ${analyzedEvidence} items were successfully analyzed using the defined methodology.`,
      '',
      `The investigation identified ${analysis && analysis.findings ? analysis.findings.length : 0} findings based on sentiment analysis, keyword extraction, topic classification, and relevance scoring.`,
      '',
      'The analysis demonstrates a systematic approach to evidence evaluation using publicly available information and forensic-style methodology.',
      '',
      'All evidence integrity references (SHA-256 hashes) have been recorded for future verification.',
      '',
      'This report and its findings are intended for academic and investigative purposes and should be understood within the context of the methodology and limitations outlined in this document.'
    ];

    conclusion.forEach(text => {
      if (text === '') {
        yPosition += lineHeight / 2;
      } else {
        yPosition = this._checkPageBreak(doc, yPosition, margin, doc.internal.pageSize.getHeight(), pageWidth, colors);
        const wrappedText = doc.splitTextToSize(text, pageWidth - 2 * margin);
        doc.text(wrappedText, margin, yPosition);
        yPosition += lineHeight * wrappedText.length + 2;
      }
    });

    return yPosition + 10;
  }

  _addReportMetadata(doc, investigation, analysis, yPosition, margin, pageWidth, colors, lineHeight) {
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);

    const reportId = 'report_' + Math.random().toString(36).substr(2, 9);
    const now = new Date();

    const metadata = [
      [`Report ID:`, reportId],
      [`Investigation ID:`, investigation.investigationId],
      [`Generated:`, now.toLocaleString()],
      [`Analysis Version:`, analysis && analysis.analysisVersion ? analysis.analysisVersion : '1.0'],
      [`Application Version:`, '1.0'],
      [`Report Version:`, '1.0'],
      [`System:`, 'Digital Forensic on Social Media Analysis']
    ];

    metadata.forEach(([label, value]) => {
      yPosition = this._checkPageBreak(doc, yPosition, margin, doc.internal.pageSize.getHeight(), pageWidth, colors);
      doc.setFont(undefined, 'bold');
      doc.text(label, margin, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(String(value), margin + 50, yPosition);
      yPosition += lineHeight;
    });

    return yPosition + 5;
  }
}

module.exports = new ReportGenerator();
