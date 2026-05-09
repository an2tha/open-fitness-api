import {
  healthDbSchema,
  healthPingSchema,
  healthStatsSchema,
  type HealthDb,
  type HealthPing,
  type HealthStats,
} from '../schemas.js';
import type { OfdRequest } from '../request.js';

export interface HealthResource {
  ping(): Promise<HealthPing>;
  db(): Promise<HealthDb>;
  stats(): Promise<HealthStats>;
}

export function createHealthResource(request: OfdRequest): HealthResource {
  return {
    ping: () => request('/health', healthPingSchema, { method: 'GET' }),
    db: () => request('/health/db', healthDbSchema, { method: 'GET' }),
    stats: () => request('/health/stats', healthStatsSchema, { method: 'GET' }),
  };
}
