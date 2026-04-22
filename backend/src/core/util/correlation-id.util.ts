import { asyncLocalStorage, CORRELATION_ID_KEY } from '@core/config/storage/correlation-id.storage';

export function getCorrelationId(): string | undefined | unknown {
    const store = asyncLocalStorage.getStore();
    return store?.get(CORRELATION_ID_KEY);
}