interface RateLimitStore {
  tokens: number;
  lastReset: number;
}

const rateLimitMap = new Map<string, RateLimitStore>();

/**
 * In-memory sliding window rate limiter
 * @param ip Client IP address or unique identifier
 * @param limit Maximum allowed requests within duration
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(
  ip: string,
  limitOrOptions: number | { limit?: number; windowMs?: number } = 10,
  windowMsParam: number = 60 * 1000
): { success: boolean; remaining: number; reset: number } {
  let limit = 10;
  let windowMs = 60 * 1000;

  if (typeof limitOrOptions === "object" && limitOrOptions !== null) {
    limit = limitOrOptions.limit ?? 10;
    windowMs = limitOrOptions.windowMs ?? 60 * 1000;
  } else {
    limit = limitOrOptions;
    windowMs = windowMsParam;
  }

  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { tokens: limit - 1, lastReset: now });
    return { success: true, remaining: limit - 1, reset: now + windowMs };
  }

  // If window time elapsed, reset token count
  if (now - record.lastReset > windowMs) {
    record.tokens = limit - 1;
    record.lastReset = now;
    rateLimitMap.set(ip, record);
    return { success: true, remaining: limit - 1, reset: now + windowMs };
  }

  // Check remaining tokens
  if (record.tokens > 0) {
    record.tokens -= 1;
    rateLimitMap.set(ip, record);
    return { success: true, remaining: record.tokens, reset: record.lastReset + windowMs };
  }

  return { success: false, remaining: 0, reset: record.lastReset + windowMs };
}

/**
 * Helper to get client IP address from headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
