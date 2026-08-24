/**
 * @jest-environment node
 */
import {checkAccess, isEmailAllowed} from './access';

const withAllowList = (value: string | undefined, run: () => void) => {
  const previous = process.env.ALLOWED_EMAILS;
  if (value === undefined) delete process.env.ALLOWED_EMAILS;
  else process.env.ALLOWED_EMAILS = value;
  try {
    run();
  } finally {
    if (previous === undefined) delete process.env.ALLOWED_EMAILS;
    else process.env.ALLOWED_EMAILS = previous;
  }
};

describe('checkAccess', () => {
  it('allows an address on the list', () => {
    withAllowList('me@example.com,other@example.com', () => {
      expect(isEmailAllowed('me@example.com')).toBe(true);
      expect(isEmailAllowed('other@example.com')).toBe(true);
    });
  });

  it('is case-insensitive and tolerates surrounding spaces', () => {
    withAllowList(' Me@Example.com , other@example.com ', () => {
      expect(isEmailAllowed('me@example.COM')).toBe(true);
    });
  });

  it('denies an address that is not on the list', () => {
    withAllowList('me@example.com', () => {
      const decision = checkAccess('someone@else.com');
      expect(decision.allowed).toBe(false);
    });
  });

  it('denies everyone when the allow-list is empty', () => {
    withAllowList('', () => {
      expect(isEmailAllowed('me@example.com')).toBe(false);
    });
  });

  it('denies everyone when the allow-list is not configured at all', () => {
    withAllowList(undefined, () => {
      expect(isEmailAllowed('me@example.com')).toBe(false);
    });
  });

  it('denies an account with no email address', () => {
    withAllowList('me@example.com', () => {
      expect(isEmailAllowed(null)).toBe(false);
      expect(isEmailAllowed(undefined)).toBe(false);
      expect(isEmailAllowed('')).toBe(false);
    });
  });

  it('does not treat a substring match as a match', () => {
    withAllowList('me@example.com', () => {
      expect(isEmailAllowed('notme@example.com')).toBe(false);
      expect(isEmailAllowed('me@example.com.attacker.test')).toBe(false);
    });
  });

  it('explains why access was refused', () => {
    withAllowList('me@example.com', () => {
      const decision = checkAccess('someone@else.com');
      expect(decision.allowed).toBe(false);
      if (!decision.allowed) expect(decision.reason).toMatch(/allow-list/i);
    });
  });
});
