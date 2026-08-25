/**
 * @jest-environment node
 */
import {profileUpdates} from './profile-sync';

const stored = (over: Partial<{name: string | null; image: string | null}> = {}) => ({
  name: 'James King',
  image: 'https://example.test/old.jpg',
  ...over,
});

describe('profileUpdates', () => {
  it('adopts a picture the stored record has never had', () => {
    expect(
      profileUpdates(stored({image: null}), {picture: 'https://example.test/new.jpg'})
    ).toEqual({image: 'https://example.test/new.jpg'});
  });

  it('adopts a changed picture', () => {
    expect(profileUpdates(stored(), {picture: 'https://example.test/new.jpg'})).toEqual({
      image: 'https://example.test/new.jpg',
    });
  });

  it('accepts `image` for providers that do not use Google’s `picture`', () => {
    expect(profileUpdates(stored({image: null}), {image: 'https://example.test/a.jpg'})).toEqual({
      image: 'https://example.test/a.jpg',
    });
  });

  it('writes nothing when the profile matches what is stored', () => {
    expect(
      profileUpdates(stored(), {name: 'James King', picture: 'https://example.test/old.jpg'})
    ).toEqual({});
  });

  it('never blanks a stored value when the provider omits the field', () => {
    expect(profileUpdates(stored(), {})).toEqual({});
    expect(profileUpdates(stored(), {name: '   ', picture: ''})).toEqual({});
  });

  it('ignores values that are not strings', () => {
    expect(profileUpdates(stored(), {name: 42, picture: {url: 'x'}})).toEqual({});
  });

  it('replaces a placeholder name left behind by the seed or dev sign-in', () => {
    expect(profileUpdates(stored({name: 'hello'}), {name: 'James King'})).toEqual({
      name: 'James King',
    });
  });
});
