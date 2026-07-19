import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const startResearch = (topic, maxPapers = 20) =>
  api.post('/research/start', { topic, max_papers: maxPapers }).then(r => r.data)

export const getStatus = (jobId) =>
  api.get(`/research/${jobId}/status`).then(r => r.data)

export const getReport = (jobId) =>
  api.get(`/research/${jobId}/report`).then(r => r.data)

export const queryPapers = (jobId, question) =>
  api.post(`/research/${jobId}/query`, { question, job_id: jobId }).then(r => r.data)

export const getGraph = (jobId) =>
  api.get(`/research/${jobId}/graph`).then(r => r.data)

export const getContradictions = (jobId) =>
  api.get(`/research/${jobId}/contradictions`).then(r => r.data)

export const listJobs = () =>
  api.get('/jobs').then(r => r.data)

export const deleteJob = (jobId) =>
  api.delete(`/jobs/${jobId}`).then(r => r.data)

export const healthCheck = () =>
  api.get('/health').then(r => r.data)
