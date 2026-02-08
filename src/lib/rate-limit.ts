import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
    points: 5, // 5 attempts
    duration: 60, // Per 60 seconds
});

export async function checkRateLimit(ip: string) {
    try {
        await rateLimiter.consume(ip);
        return true;
    } catch (rejRes) {
        return false;
    }
}
