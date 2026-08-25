/**
 * The avatar is painted as a CSS background rather than an `<img>`.
 *
 * A broken `<img>` draws the browser's own placeholder icon over the initials
 * underneath it, which is exactly the case this needs to handle well: a Google
 * photo URL that has expired or been revoked. A background image that fails to
 * load paints nothing at all, so the initials simply remain — no client-side
 * error handling, and no flash of a broken glyph.
 *
 * The value ends up inside a CSS `url()`, so it is validated rather than
 * trusted: it reaches us from an identity provider by way of the database, and
 * a string containing quotes or parentheses could otherwise escape the
 * declaration it is placed in.
 */

/** Schemes a profile picture may legitimately use. */
const ALLOWED_PROTOCOLS = new Set(['https:', 'http:']);

/**
 * A `url(...)` value for a stored avatar, or null when there is nothing safe
 * to render — in which case the initials stand on their own.
 */
export const avatarBackground = (image: string | null | undefined): string | null => {
  if (typeof image !== 'string' || image.trim().length === 0) return null;

  let parsed: URL;
  try {
    parsed = new URL(image.trim());
  } catch {
    return null;
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return null;

  // The URL parser already percent-encodes quotes, backslashes and newlines —
  // the only characters that could end the string early — and a host that
  // contained one would have thrown above. Escaping them again costs nothing
  // and means the guarantee does not rest on that behaviour staying true.
  const escaped = parsed.href.replace(
    /[\\"\n\r]/g,
    character => `%${character.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()}`
  );

  return `url("${escaped}")`;
};
