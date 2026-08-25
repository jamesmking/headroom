/**
 * @jest-environment node
 */
import {avatarBackground} from './avatar-url';

describe('avatarBackground', () => {
  it('wraps a normal provider URL', () => {
    expect(avatarBackground('https://lh3.googleusercontent.com/a/abc123=s96-c')).toBe(
      'url("https://lh3.googleusercontent.com/a/abc123=s96-c")'
    );
  });

  it('returns null when there is no picture, so the initials stand alone', () => {
    expect(avatarBackground(null)).toBeNull();
    expect(avatarBackground(undefined)).toBeNull();
    expect(avatarBackground('   ')).toBeNull();
  });

  it('rejects anything that is not a real http(s) URL', () => {
    expect(avatarBackground('not a url')).toBeNull();
    expect(avatarBackground('javascript:alert(1)')).toBeNull();
    expect(avatarBackground('data:image/svg+xml,<svg/>')).toBeNull();
    expect(avatarBackground('file:///etc/passwd')).toBeNull();
  });

  /**
   * The property that actually matters: whatever the input, the value between
   * the wrapping quotes can never contain a character able to end the CSS
   * string early. Parentheses are harmless inside a quoted url() and are left
   * alone; quotes, backslashes and newlines are not, and must never survive.
   */
  it.each([
    'https://example.test/a.png") ; background: url("https://evil.test/x.png',
    'https://example.test/a(1)".png',
    'https://example.test/a.png";}\nbody{display:none',
    String.raw`https://example.test/a\".png`,
  ])('cannot break out of the declaration: %s', hostile => {
    const result = avatarBackground(hostile);
    expect(result).not.toBeNull();

    expect(result!.startsWith('url("')).toBe(true);
    expect(result!.endsWith('")')).toBe(true);

    const inner = result!.slice('url("'.length, -'")'.length);
    expect(inner).not.toMatch(/["\\\n\r]/);
  });
});
