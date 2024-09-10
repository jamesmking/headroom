import React from 'react';
import { render, screen } from '@testing-library/react';
import { Main } from './Main';

describe('Main component', () => {
  test('renders with testId', () => {
    const testId = 'testId';
    render(<Main testId={testId} />);
    const element = screen.getByTestId(testId);
    expect(element).toBeTruthy();
  });

  test('renders with children and testId', () => {
    const testChildren = <span>Child element</span>;
    const testId = 'testId';
    render(<Main children={testChildren} testId={testId} />);
    const textElement = screen.getByText('Child element');
    expect(textElement).toBeTruthy();
  });
});
