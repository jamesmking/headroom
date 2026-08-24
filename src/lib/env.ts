import 'server-only';

/**
 * Server-side environment access.
 *
 * Values are read lazily rather than validated at module load, so a missing
 * secret produces a clear runtime error instead of breaking `next build`.
 * Nothing in this module may be imported from a Client Component.
 */

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. See .env.example for the expected configuration.`
    );
  }
  return value;
};

export const env = {
  get databaseUrl() {
    return required('DATABASE_URL');
  },
  get authSecret() {
    return required('AUTH_SECRET');
  },
  get googleClientId() {
    return required('AUTH_GOOGLE_ID');
  },
  get googleClientSecret() {
    return required('AUTH_GOOGLE_SECRET');
  },
  /** Comma-separated allow-list of email addresses permitted to sign in. */
  get allowedEmails(): string[] {
    return (process.env.ALLOWED_EMAILS ?? '')
      .split(',')
      .map(entry => entry.trim().toLowerCase())
      .filter(Boolean);
  },
  /** Optional seed/fallback iCal feed. Never sent to the browser. */
  get familyIcalUrl(): string | null {
    return process.env.FAMILY_ICAL_URL?.trim() || null;
  },
  get familyIcalCacheSeconds(): number {
    const parsed = Number.parseInt(process.env.FAMILY_ICAL_CACHE_SECONDS ?? '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 900;
  },
};
