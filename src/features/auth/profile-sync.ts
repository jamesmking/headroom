/**
 * Keeping the stored profile in step with the identity provider.
 *
 * The Prisma adapter writes a user's name and picture exactly once, when it
 * creates the row. Any User that exists before the first Google sign-in — one
 * made by `npm run db:seed` or by the development sign-in — is *linked* to the
 * Google account rather than created by it, so `createUser` never runs and the
 * picture is never stored at all. The avatar then falls back to initials
 * forever, even though Google has a photo.
 *
 * The comparison is kept pure and separate from the database so the rules are
 * testable without a session or an OAuth round trip.
 */

export type ProfileFields = {
  name: string | null;
  image: string | null;
};

/** Trim to a usable value, treating blank strings as absent. */
const clean = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Which stored fields should be rewritten from a freshly fetched profile.
 *
 * Returns only what has actually changed, so an unchanged sign-in costs no
 * write. The provider is treated as the source of truth for both fields —
 * neither is editable in the application, and Settings already says the name
 * comes from Google — but it can only ever set a value, never blank one out:
 * a provider that omits a field should not erase what is already known.
 */
export const profileUpdates = (
  current: ProfileFields,
  incoming: {name?: unknown; picture?: unknown; image?: unknown}
): Partial<ProfileFields> => {
  const updates: Partial<ProfileFields> = {};

  const name = clean(incoming.name);
  if (name !== null && name !== current.name) updates.name = name;

  // Google sends the photo as `picture`; other providers use `image`.
  const image = clean(incoming.picture) ?? clean(incoming.image);
  if (image !== null && image !== current.image) updates.image = image;

  return updates;
};
