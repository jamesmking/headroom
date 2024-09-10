import React from 'react';
import { render, screen } from '@testing-library/react';
import { TextInput } from './TextInput';

describe('Text Input component', () => {
  test('renders with testId', () => {
    const testId = 'testId';
    render(<TextInput id="firstName" name="firstName" testId={testId} />);
    const element = screen.getByTestId(testId);
    expect(element).toBeTruthy();
  });
});
