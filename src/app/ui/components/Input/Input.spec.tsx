import React from 'react';
import { render, screen } from '@testing-library/react';
import { Input } from './Input';

describe('Input component', () => {
  test('renders with testId', () => {
    const testId = 'testId';
    render(<Input id="firstName" name="firstName" testId={testId} />);
    const element = screen.getByTestId(testId);
    expect(element).toBeTruthy();
  });
});
