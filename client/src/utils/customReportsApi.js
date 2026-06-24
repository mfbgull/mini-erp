/**
 * Custom Reports API
 * API functions for the ad-hoc report builder.
 */

import api from './api';

export const customReportsApi = {
  // ── Saved Reports CRUD ──────────────────────────────

  /** List all reports for the current user */
  list: () =>
    api.get('/reports/custom').then(r => r.data.data || []),

  /** Get a single report by ID */
  get: (id) =>
    api.get(`/reports/custom/${id}`).then(r => r.data.data),

  /** Create a new saved report */
  create: (data) =>
    api.post('/reports/custom', data).then(r => r.data.data),

  /** Update a saved report */
  update: (id, data) =>
    api.put(`/reports/custom/${id}`, data).then(r => r.data.data),

  /** Delete a saved report */
  delete: (id) =>
    api.delete(`/reports/custom/${id}`).then(r => r.data),

  /** Duplicate a saved report */
  duplicate: (id) =>
    api.post(`/reports/custom/${id}/duplicate`).then(r => r.data.data),

  // ── Templates ───────────────────────────────────────

  /** List pre-built report templates */
  listTemplates: () =>
    api.get('/reports/custom/templates').then(r => r.data.data || []),

  /** Save current report config as a reusable template */
  createTemplate: (data) =>
    api.post('/reports/custom/templates', data).then(r => r.data.data),

  // ── Entity Discovery ────────────────────────────────

  /** List all available entities */
  listEntities: () =>
    api.get('/reports/custom/entities').then(r => r.data.data || []),

  /** Get a single entity definition */
  getEntity: (key) =>
    api.get(`/reports/custom/entities/${key}`).then(r => r.data.data),

  // ── Execution ───────────────────────────────────────

  /** Run a report (by saved ID or inline config) */
  run: (payload) =>
    api.post('/reports/custom/run', payload).then(r => r.data.data),
};

export default customReportsApi;
