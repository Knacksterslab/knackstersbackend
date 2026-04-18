/**
 * Application-wide constants — single source of truth.
 * All product URLs, contact emails, and shared magic values live here.
 * Import from this file; never hardcode these strings elsewhere.
 */

export const COMPANY = {
  name: 'Knacksters',
  email: 'connect@knacksters.co',
  websiteUrl: process.env.WEBSITE_DOMAIN || 'https://www.knacksters.co',
  emailFrom: 'Knacksters <connect@knacksters.co>',
} as const;

/**
 * Fallback avatar URL — generated from the user's email seed.
 * Usage: `avatarFallback(email)`
 */
export function avatarFallback(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

/**
 * Cache-Control header value shared by all public (unauthenticated) read routes.
 */
export const PUBLIC_CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=300';
