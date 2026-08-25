import {render} from '@testing-library/react';
import {BoardSkeleton, DaySkeleton, StackSkeleton, WeekSkeleton} from './page-skeleton';

/**
 * These render during navigation, before anything else is on screen, so a
 * throw here would replace the page with an error boundary at exactly the
 * wrong moment. They are also hidden from assistive technology: a screen
 * reader should hear the new page, not a description of its placeholder.
 */
describe('page skeletons', () => {
  it.each([
    ['day', DaySkeleton],
    ['week', WeekSkeleton],
    ['board', BoardSkeleton],
    ['stack', StackSkeleton],
  ])('renders the %s skeleton, hidden from assistive technology', (_name, Skeleton) => {
    const {container} = render(<Skeleton />);

    const root = container.firstElementChild;
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root!.querySelectorAll('span').length).toBeGreaterThan(0);
    expect(container).toHaveTextContent('');
  });
});
