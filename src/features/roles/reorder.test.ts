import {canMove, moveWithin} from './reorder';

describe('moveWithin', () => {
  const list = ['a', 'b', 'c', 'd'];

  it('moves an item up', () => {
    expect(moveWithin(list, 2, 'up')).toEqual(['a', 'c', 'b', 'd']);
  });

  it('moves an item down', () => {
    expect(moveWithin(list, 1, 'down')).toEqual(['a', 'c', 'b', 'd']);
  });

  it('leaves the first item alone when moved up', () => {
    expect(moveWithin(list, 0, 'up')).toEqual(list);
  });

  it('leaves the last item alone when moved down', () => {
    expect(moveWithin(list, 3, 'down')).toEqual(list);
  });

  it('ignores an index outside the list', () => {
    expect(moveWithin(list, -1, 'down')).toEqual(list);
    expect(moveWithin(list, 9, 'up')).toEqual(list);
  });

  it('does not mutate the original list', () => {
    const original = [...list];
    moveWithin(list, 1, 'down');
    expect(list).toEqual(original);
  });

  it('handles a single-item list', () => {
    expect(moveWithin(['only'], 0, 'up')).toEqual(['only']);
    expect(moveWithin(['only'], 0, 'down')).toEqual(['only']);
  });

  it('moving up then down returns the original order', () => {
    const moved = moveWithin(list, 2, 'up');
    expect(moveWithin(moved, 1, 'down')).toEqual(list);
  });
});

describe('canMove', () => {
  it('is false at the ends and true in between', () => {
    expect(canMove(0, 4, 'up')).toBe(false);
    expect(canMove(0, 4, 'down')).toBe(true);
    expect(canMove(3, 4, 'down')).toBe(false);
    expect(canMove(3, 4, 'up')).toBe(true);
  });

  it('is false both ways for a single item', () => {
    expect(canMove(0, 1, 'up')).toBe(false);
    expect(canMove(0, 1, 'down')).toBe(false);
  });
});
