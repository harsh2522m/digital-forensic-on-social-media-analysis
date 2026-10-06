import axios from 'axios';

// Use VITE_API_URL env var for production, fallback to /api for dev (Vite proxy)
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===== INVESTIGATIONS =====

export const createInvestigation = (data) => api.post('/investigations', data);
export const getAllInvestigations = () => api.get('/investigations');
export const getInvestigation = (id) => api.get(`/investigations/${id}`);
export const updateInvestigation = (id, data) => api.put(`/investigations/${id}`, data);
export const deleteInvestigation = (id) => api.delete(`/investigations/${id}`);

// ===== EVIDENCE =====

export const createEvidence = (data) => api.post('/evidence', data);

export const getEvidenceByInvestigation = (investigationId) =>
  api.get(`/evidence/investigation/${investigationId}`);

export const getEvidence = (id) => api.get(`/evidence/${id}`);

export const deleteEvidence = (id) => api.delete(`/evidence/${id}`);

export const verifyEvidenceHash = (id) => api.post(`/evidence/${id}/verify-hash`);

export const analyzeSingleEvidence = (id) => api.post(`/evidence/${id}/analyze`);

// ===== ANALYSIS =====

export const analyzeInvestigation = (investigationId) => 
  api.post(`/analysis/${investigationId}`);

export const getAnalysis = (investigationId) => 
  api.get(`/analysis/${investigationId}`);

export const getFindings = (investigationId) => 
  api.get(`/analysis/${investigationId}/findings`);

export const getTimeline = (investigationId) => 
  api.get(`/analysis/${investigationId}/timeline`);

// ===== REPORTS =====

export const generateReport = (investigationId) => 
  api.post(`/reports/${investigationId}`);

export const getReport = (investigationId) => 
  api.get(`/reports/${investigationId}`);

export const downloadReport = (investigationId, reportId) => 
  api.get(`/reports/${investigationId}/${reportId}`, { responseType: 'arraybuffer' });

// ===== HEALTH CHECK =====

export const healthCheck = () => api.get('/health');

export default api;
