export { initSupabase, getSupabase, resetSupabase } from './client.js';
export { ingestEvent, queryEvents, countEvents, getUniqueUsers } from './events.js';
export { createMetric, getMetricByName, listMetrics, getMetricCount } from './metrics.js';
export { createFunnel, getFunnelByName, listFunnels, saveFunnelResult, getFunnelResults } from './funnels.js';
export { createCohort, getCohortByName, listCohorts } from './cohorts.js';
export {
  createExperiment,
  getExperimentById,
  getExperimentByName,
  updateExperiment,
  listExperiments,
} from './experiments.js';
export { createFeature, getFeatureByName, updateFeature, listFeatures } from './features.js';
export { createWidget, listWidgets, deleteWidgets } from './dashboards.js';
