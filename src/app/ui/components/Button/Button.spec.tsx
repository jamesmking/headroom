import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button component', () => {
  test('renders button with text and testId', () => {
    const testText = 'Click me';
    const testId = 'customTestId';
    render(<Button text={testText} testId={testId} />);
    const buttonElement = screen.getByText(testText);
    expect(buttonElement).toBeTruthy();
  });

  test('renders button with children and testId', () => {
    const testChildren = <span>Child element</span>;
    const testId = 'customTestId';
    render(<Button children={testChildren} testId={testId} />);
    const buttonElement = screen.getByText('Child element');
    expect(buttonElement).toBeTruthy();
  });
});
