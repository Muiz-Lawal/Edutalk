export async function withRetry(operation, options = {}) {
  const {
    retries = 3,
    baseDelayMs = 250,
    maxDelayMs = 2000,
    shouldRetry = (error) => {
      const message = String(error?.message || error || '').toLowerCase();
      return ['timeout', 'network', 'econnreset', 'ecancelled', 'temporarily unavailable', '429', '503', '504'].some((token) => message.includes(token));
    },
    onRetry,
  } = options;

  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt >= retries || !shouldRetry(error)) {
        throw error;
      }

      const delayMs = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
      if (onRetry) {
        onRetry({ attempt: attempt + 1, retriesRemaining: retries - attempt, delayMs, error });
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
      attempt += 1;
    }
  }

  throw lastError;
}
