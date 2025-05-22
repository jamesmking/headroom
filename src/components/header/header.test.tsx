import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';
import {Header} from './header';

describe('Header', () => {
  it('renders the header with the correct brand name', () => {
    render(<Header />);
    expect(screen.getByText('Head Room')).toBeInTheDocument();
  });

  it('applies the correct styles to the header container', () => {
    render(<Header />);
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('Header');
  });

  it('renders the navigation component', () => {
    render(<Header />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
