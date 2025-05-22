import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';
import {Navigation} from './navigation';
import styles from './navigation.module.scss';

describe('Navigation', () => {
  it('renders all navigation links with correct labels', () => {
    render(<Navigation />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Tickets')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('applies active class to the link matching the current path', () => {
    jest.mock('next/navigation', () => ({
      usePathname: jest.fn(() => '/tickets'),
    }));
    render(<Navigation />);
    expect(screen.getByText('Tickets')).toHaveClass(styles.Link);
    expect(screen.getByText('Home')).not.toHaveClass(styles.LinkActive);
    expect(screen.getByText('Settings')).not.toHaveClass(styles.LinkActive);
  });

  it('renders navigation container with correct styles', () => {
    render(<Navigation />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass(styles.Navigation);
  });
});
