import { AsyncLocalStorage } from 'async_hooks';
export const asyncLocalStorage = new AsyncLocalStorage<Map<string, unknown>>();
export const CORRELATION_ID_KEY = 'correlationId';