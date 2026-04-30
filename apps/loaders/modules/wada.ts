import { getLogger } from '../utils/logger';

export const loadWadaList = async () => {
  const logger = getLogger();
  logger.warn('[wada] This loader is deprecated. Use "npx ofdata-normalize wada" instead.');
};