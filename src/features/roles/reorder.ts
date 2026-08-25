/**
 * Ordering helpers for roles.
 *
 * Kept pure and separate from the database so the move rules — clamping at the
 * ends, leaving the rest of the list untouched — can be tested directly.
 */

export type Direction = 'up' | 'down';

/**
 * Swap the item at `index` with its neighbour in the given direction.
 * Returns the list unchanged when the move would fall off either end.
 */
export const moveWithin = <T>(items: T[], index: number, direction: Direction): T[] => {
  const target = direction === 'up' ? index - 1 : index + 1;

  if (index < 0 || index >= items.length) return items;
  if (target < 0 || target >= items.length) return items;

  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

/** Whether a move is possible, used to disable the control at the ends. */
export const canMove = (index: number, length: number, direction: Direction): boolean =>
  direction === 'up' ? index > 0 : index < length - 1;
