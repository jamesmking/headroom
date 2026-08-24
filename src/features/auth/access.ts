import {env} from '@/lib/env';

/**
 * Access control.
 *
 * Today this is a static allow-list supplied via ALLOWED_EMAILS. It is kept
 * behind this module so that supporting additional users later — an invite
 * table, a domain rule, per-user roles — means changing this file only, rather
 * than touching the authentication wiring.
 */

export type AccessDecision = {allowed: true} | {allowed: false; reason: string};

export const checkAccess = (email: string | null | undefined): AccessDecision => {
  if (!email) {
    return {allowed: false, reason: 'Google did not return an email address for this account.'};
  }

  const allowList = env.allowedEmails;

  if (allowList.length === 0) {
    return {
      allowed: false,
      reason: 'No accounts are permitted yet. ALLOWED_EMAILS has not been configured.',
    };
  }

  if (!allowList.includes(email.toLowerCase())) {
    return {allowed: false, reason: 'This Google account is not on the allow-list.'};
  }

  return {allowed: true};
};

export const isEmailAllowed = (email: string | null | undefined): boolean =>
  checkAccess(email).allowed;
