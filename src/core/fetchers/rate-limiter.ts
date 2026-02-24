import Bottleneck from 'bottleneck';

const limiters = new Map<string, Bottleneck>();

export function getRateLimiter(
  key: string,
  options?: { maxConcurrent?: number; minTime?: number },
): Bottleneck {
  if (!limiters.has(key)) {
    limiters.set(
      key,
      new Bottleneck({
        maxConcurrent: options?.maxConcurrent ?? 2,
        minTime: options?.minTime ?? 1000,
      }),
    );
  }
  return limiters.get(key)!;
}

export function clearLimiters(): void {
  for (const limiter of limiters.values()) {
    limiter.disconnect();
  }
  limiters.clear();
}
